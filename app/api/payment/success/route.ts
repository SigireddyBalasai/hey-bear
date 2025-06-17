import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

import type { SupabaseClient } from '@supabase/supabase-js';
import type Stripe from 'stripe';

import { getSubscriptionPlanDetails } from '@/lib/subscription-plans';
import type { AssistantConfigData, CreateAssistantResult, WebhookPayload } from '@/types/api.types';
import type { Database } from '@/types/db.types';
import { createClient } from '@/utils/supabase/server-admin';
import { PaymentErrorHandler } from '@/utils/payment/error-responses';
import { 
  validateWebhookPayload, 
  validatePaymentSession, 
  parseClientReferenceId 
} from '@/utils/payment/session-validation';
import { 
  fetchPaymentSession, 
  updatePaymentSession 
} from '@/utils/payment/session-management';
import { createAssistantFromConfig } from '@/utils/payment/assistant-creation';
import { createAssistantFromMetadata } from '@/utils/payment/legacy-flow';

// Handle POST requests with webhook payload from Stripe
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  let sessionId = 'unknown';

  if (!request || !request.body || !request.headers) {
    return PaymentErrorHandler.invalidRequest();
  }

  try {
    const body = (await request.json()) as WebhookPayload;
    console.log('[PAYMENT SUCCESS] Received webhook payload:', body);

    // Validate webhook payload
    if (!validateWebhookPayload(body)) {
      console.error('[PAYMENT SUCCESS] Invalid webhook payload - not a checkout session:', {
        hasData: !!body.data,
        hasObject: !!body.data?.object,
        objectType: body.data?.object?.object,
      });
      const origin = request.headers.get('origin') || 'http://localhost:3000';
      return PaymentErrorHandler.invalidWebhookPayload(origin);
    }

    const session = body.data.object as unknown as Stripe.Checkout.Session;
    sessionId = session.id as string;

    console.log('[PAYMENT SUCCESS] Processing Stripe session from webhook:', {
      sessionId: session.id,
      paymentStatus: session.payment_status,
      status: session.status,
      clientReferenceId: session.client_reference_id,
      hasMetadata: !!session.metadata,
      metadataKeys: session.metadata ? Object.keys(session.metadata) : [],
      customerId: session.customer,
    });

    const origin = request.headers.get('origin') || 'http://localhost:3000';
    return await processPaymentSuccess(session, origin, startTime);
  } catch (error) {
    console.error('[PAYMENT SUCCESS] Failed to parse webhook payload:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      sessionId: sessionId || 'unknown',
    });
    const origin = request.headers.get('origin') || 'http://localhost:3000';
    return PaymentErrorHandler.invalidWebhookPayload(origin);
  }
}

// Process the payment success using only Stripe session data
async function processPaymentSuccess(
  session: Stripe.Checkout.Session,
  origin: string,
  startTime: number
) {
  const sessionId = session.id;
  console.log('[PAYMENT SUCCESS] Processing session:', sessionId);

  try {
    console.log('[PAYMENT SUCCESS] Creating Supabase client...');
    const supabase: SupabaseClient<Database> = await createClient();

    // Validate the session is complete and paid
    const validation = validatePaymentSession(session);
    if (!validation.isValid) {
      console.error('[PAYMENT SUCCESS] Session validation failed:', validation.errors);
      return PaymentErrorHandler.paymentNotCompleted(origin, session.payment_status, session.status);
    }

    console.log('[PAYMENT SUCCESS] Session validation passed - payment completed successfully');

    // Extract user ID from client_reference_id
    const clientRefId = session.client_reference_id;
    if (!clientRefId) {
      console.error('[PAYMENT SUCCESS] No client_reference_id found in session:', {
        sessionId,
        hasMetadata: !!session.metadata,
        customerId: session.customer,
      });
      return PaymentErrorHandler.missingReference(origin);
    }

    console.log('[PAYMENT SUCCESS] Parsing client_reference_id:', clientRefId);

    let authUserId: string;
    let internalPaymentSessionId: string | null;

    try {
      const parsed = parseClientReferenceId(clientRefId);
      authUserId = parsed.authUserId;
      internalPaymentSessionId = parsed.internalPaymentSessionId;
    } catch (error) {
      console.error('[PAYMENT SUCCESS] Invalid client_reference_id format:', {
        clientRefId,
        error: error instanceof Error ? error.message : String(error),
      });
      return PaymentErrorHandler.invalidReferenceFormat(origin);
    }

    console.log('[PAYMENT SUCCESS] Extracted from client_reference_id:', {
      authUserId,
      internalPaymentSessionId,
    });

    if (!internalPaymentSessionId) {
      console.warn(
        '[PAYMENT SUCCESS] internalPaymentSessionId is missing from client_reference_id. This is unexpected for the new flow.'
      );
    }

    // Use the auth user ID directly
    const resolvedApplicationUserId = authUserId;

    // Fetch Payment Session record
    let paymentSession;
    try {
      paymentSession = await fetchPaymentSession(supabase, internalPaymentSessionId, session.id);
    } catch (error) {
      console.error('[PAYMENT SUCCESS] Payment session not found, trying legacy flow:', {
        error: error instanceof Error ? error.message : String(error),
      });
      
      // Try legacy flow as fallback
      try {
        const result = await createAssistantFromMetadata(session, sessionId, origin);
        console.log('[PAYMENT SUCCESS] Legacy flow completed successfully:', {
          assistantId: result.assistantId,
          duration: Date.now() - startTime,
        });
        return PaymentErrorHandler.success(origin, result.assistantId, true);
      } catch (legacyError) {
        console.error('[PAYMENT SUCCESS] Legacy flow also failed:', {
          error: legacyError instanceof Error ? legacyError.message : String(legacyError),
        });
        return PaymentErrorHandler.paymentSessionNotFound(origin);
      }
    }

    console.log(
      `[PAYMENT SUCCESS] Fetched payment session (ID: ${paymentSession.id}), current user_id: ${paymentSession.user_id}, status: ${paymentSession.status}`
    );

    // Update payment session
    try {
      await updatePaymentSession(supabase, paymentSession, session.id, resolvedApplicationUserId);
    } catch (error) {
      console.error('[PAYMENT SUCCESS] Failed to update payment session:', {
        error: error instanceof Error ? error.message : String(error),
      });
      return PaymentErrorHandler.unexpectedError(origin);
    }

    // Verify we have a user ID
    if (!paymentSession.user_id && !resolvedApplicationUserId) {
      console.error('[PAYMENT SUCCESS] CRITICAL: No user ID available after payment session update');
      return PaymentErrorHandler.unexpectedError(origin);
    }

    // Get assistant configuration data
    const assistantConfigData = paymentSession.assistant_config_data as AssistantConfigData;
    if (!assistantConfigData) {
      console.error('[PAYMENT SUCCESS] No assistant config data found in payment session');
      return PaymentErrorHandler.unexpectedError(origin);
    }

    console.log('[PAYMENT SUCCESS] Assistant config data from payment session:', assistantConfigData);

    // Get plan details
    const internalPlanId = paymentSession.plan_id;
    if (!internalPlanId || typeof internalPlanId !== 'string' || internalPlanId.trim() === '') {
      console.error(`[PAYMENT SUCCESS] Plan ID missing or invalid in payment session: ${internalPlanId}`);
      return PaymentErrorHandler.unexpectedError(origin);
    }

    // Create assistant
    try {
      const result = await createAssistantFromConfig(
        assistantConfigData,
        sessionId,
        paymentSession.id,
        internalPlanId,
        origin
      );

      console.log('[PAYMENT SUCCESS] Assistant created successfully:', {
        assistantId: result.assistantId,
        pendingAssistantId: result.pendingAssistantId,
        sessionId,
        paymentSessionId: paymentSession.id,
        duration: Date.now() - startTime,
      });

      return PaymentErrorHandler.success(origin, result.assistantId);
    } catch (createError) {
      console.error('[PAYMENT SUCCESS] Error creating assistant:', {
        error: createError instanceof Error ? createError.message : String(createError),
        stack: createError instanceof Error ? createError.stack : undefined,
        sessionId,
        paymentSessionId: paymentSession.id,
      });

      if (createError instanceof Error && createError.message.includes('creation failed')) {
        return PaymentErrorHandler.assistantCreationFailed(origin);
      }
      return PaymentErrorHandler.assistantCreationError(origin);
    }
  } catch (error) {
    console.error('[PAYMENT SUCCESS] Unexpected error:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      sessionId,
      duration: Date.now() - startTime,
    });

    return PaymentErrorHandler.unexpectedError(origin);
  } finally {
    console.log('[PAYMENT SUCCESS] Request completed:', {
      sessionId,
      duration: Date.now() - startTime,
      timestamp: new Date().toISOString(),
    });
  }
}
