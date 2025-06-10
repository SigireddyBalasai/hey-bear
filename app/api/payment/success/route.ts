import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

import type { SupabaseClient } from '@supabase/supabase-js';
import type Stripe from 'stripe';

import { getSubscriptionPlanDetails } from '@/lib/subscription-plans';
import type { Database } from '@/types/db.types';
import { createClient } from '@/utils/supabase/server-admin';

interface CreateAssistantResult {
  message: string;
  assistantId: string;
  pendingAssistantId: string;
}

interface WebhookPayload {
  id: string;
  object: string;
  api_version: string;
  created: number;
  data: {
    object: Stripe.Checkout.Session;
  };
  livemode: boolean;
  pending_webhooks: number;
  request: {
    id: string;
    idempotency_key: string;
  };
  type: string;
}

interface AssistantConfigData {
  display_name?: string;
  business_name?: string;
  description?: string;
  concierge_name?: string;
  business_phone?: string;
}

// Type for payment session record from database
type PaymentSession = Database['public']['Tables']['payment_sessions']['Row'];
type PaymentSessionUpdate = Database['public']['Tables']['payment_sessions']['Update'];

// Handle POST requests with webhook payload from Stripe
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  let sessionId = 'unknown';

  if (!request || !request.body || !request.headers) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  try {
    const body = (await request.json()) as WebhookPayload;
    console.log(body);

    // Extract session from webhook payload
    if (!body.data?.object || body.data.object.object !== 'checkout.session') {
      console.error('[PAYMENT SUCCESS] Invalid webhook payload - not a checkout session:', {
        hasData: !!body.data,
        hasObject: !!body.data?.object,
        objectType: body.data?.object?.object,
      });
      return NextResponse.json({ error: 'Invalid webhook payload' }, { status: 400 });
    }

    const session = body.data.object;
    sessionId = session.id;

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
    return NextResponse.json({ error: 'Invalid webhook payload' }, { status: 400 });
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

    // Verify the session is complete and paid
    if (session.payment_status !== 'paid') {
      console.error('[PAYMENT SUCCESS] Payment not completed:', {
        sessionId,
        paymentStatus: session.payment_status,
        status: session.status,
      });
      return NextResponse.json(
        {
          error: 'Payment not completed',
          redirectUrl: `${origin}/Concierge?error=payment_incomplete`,
        },
        { status: 400 }
      );
    }

    if (session.status !== 'complete') {
      console.error('[PAYMENT SUCCESS] Session not complete:', {
        sessionId,
        status: session.status,
        paymentStatus: session.payment_status,
      });
      return NextResponse.json(
        {
          error: 'Session not complete',
          redirectUrl: `${origin}/Concierge?error=payment_failed`,
        },
        { status: 400 }
      );
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
      return NextResponse.json(
        {
          error: 'Missing reference',
          redirectUrl: `${origin}/Concierge?error=missing_reference`,
        },
        { status: 400 }
      );
    }

    console.log('[PAYMENT SUCCESS] Parsing client_reference_id:', clientRefId);

    // Parse user ID and session ID from client_reference_id (format: user-{userId}-session-{sessionId})
    const clientRefMatch = clientRefId.match(/^user-([a-f0-9A-F-]+)(?:-session-([a-f0-9A-F-]+))?$/);
    if (!clientRefMatch) {
      console.error('[PAYMENT SUCCESS] Invalid client_reference_id format:', {
        clientRefId,
        expectedFormat: 'user-{userId}-session-{sessionId}',
      });
      return NextResponse.json(
        {
          error: 'Invalid reference format',
          redirectUrl: `${origin}/Concierge?error=invalid_reference`,
        },
        { status: 400 }
      );
    }

    const authUserId = clientRefMatch[1]; // Renamed from userId for clarity
    const internalPaymentSessionId = clientRefMatch[2]; // Renamed from paymentSessionId for clarity
    console.log('[PAYMENT SUCCESS] Extracted from client_reference_id:', {
      authUserId,
      internalPaymentSessionId,
    });

    if (!internalPaymentSessionId) {
      console.error(
        '[PAYMENT SUCCESS] CRITICAL: No internalPaymentSessionId (payment_sessions.session_id) found in client_reference_id. Cannot reliably link payment. client_reference_id:',
        clientRefId
      );
      // Consider if legacy flow should be invoked here or if it's a hard stop.
      // For now, let's assume if client_reference_id was set with our pattern, internalPaymentSessionId should be there.
      // If not, it's a significant issue.
      // However, the original code had a fallback if paymentSessionId (now internalPaymentSessionId) was null.
      // Replicating that fallback to stripe_checkout_session_id for fetching payment_session initially.
      // But the core problem is client_reference_id should be reliable.
      console.warn(
        '[PAYMENT SUCCESS] internalPaymentSessionId is missing from client_reference_id. This is unexpected for the new flow.'
      );
      // The code below will try to find payment_session by stripe_checkout_session_id if internalPaymentSessionId is null.
    }

    // Use the auth user ID directly instead of looking up in users table
    console.log('[PAYMENT SUCCESS] Using auth user ID directly:', authUserId);
    const resolvedApplicationUserId = authUserId;
    console.log('[PAYMENT SUCCESS] Resolved application_user_id:', resolvedApplicationUserId);

    // 2. Fetch Payment Session record
    // Prioritize internalPaymentSessionId if available, otherwise fallback to stripe_checkout_session_id
    let paymentSession: PaymentSession | null = null;
    let psFetchError: Error | null = null;

    if (internalPaymentSessionId) {
      console.log(
        '[PAYMENT SUCCESS] Fetching payment session by internal session_id (from client_reference_id):',
        internalPaymentSessionId
      );
      const { data, error } = await supabase
        .from('payment_sessions')
        .select('*')
        .eq('session_id', internalPaymentSessionId)
        .single();
      paymentSession = data;
      psFetchError = error;
    } else {
      // This block is a fallback if internalPaymentSessionId was NOT in client_reference_id
      // This is less ideal for the new robust flow.
      console.warn(
        '[PAYMENT SUCCESS] internalPaymentSessionId was not in client_reference_id. Falling back to fetch payment_session by stripe_checkout_session_id:',
        session.id
      );
      const { data, error } = await supabase
        .from('payment_sessions')
        .select('*')
        .eq('stripe_checkout_session_id', session.id) // session.id is Stripe's checkout session ID
        .single();
      paymentSession = data;
      psFetchError = error;
    }

    if (psFetchError || !paymentSession) {
      console.error('[PAYMENT SUCCESS] CRITICAL: Payment session not found.', {
        internalPaymentSessionIdAttempted: internalPaymentSessionId,
        stripeCheckoutSessionIdAttempted: !internalPaymentSessionId ? session.id : null,
        error: psFetchError,
      });
      // If payment session isn't found, it's a critical issue.
      // The legacy flow might handle cases where payment_sessions wasn't created, but that shouldn't happen now.
      // Forcing a hard stop here instead of falling back to handleLegacyMetadataFlow if payment_sessions is expected.
      return NextResponse.json(
        { error: 'Payment session details not found, cannot proceed.' },
        { status: 404 }
      );
    }
    console.log(
      `[PAYMENT SUCCESS] Fetched payment session (ID: ${paymentSession.id}), current user_id: ${paymentSession.user_id}, status: ${paymentSession.status}`
    );

    // 3. Prepare and Execute Update to payment_sessions
    const updatePayload: PaymentSessionUpdate = {
      updated_at: new Date().toISOString(),
      status: 'completed', // Always aim to mark as completed if payment was successful
    };

    // Ensure stripe_checkout_session_id is also updated/set, as it might have been found via internalPaymentSessionId
    if (paymentSession.stripe_checkout_session_id !== session.id) {
      console.log(
        `[PAYMENT SUCCESS] Updating stripe_checkout_session_id on payment_session (ID: ${paymentSession.id}) from ${paymentSession.stripe_checkout_session_id} to ${session.id}`
      );
      updatePayload.stripe_checkout_session_id = session.id;
    }

    let needsUserIdUpdate = false;
    if (paymentSession.user_id !== resolvedApplicationUserId) {
      if (paymentSession.user_id === null && resolvedApplicationUserId) {
        console.log(
          `[PAYMENT SUCCESS] payment_sessions.user_id is NULL. Setting to resolved application_user_id: ${resolvedApplicationUserId}.`
        );
        needsUserIdUpdate = true;
      } else if (
        paymentSession.user_id !== null &&
        paymentSession.user_id !== resolvedApplicationUserId
      ) {
        console.warn(
          `[PAYMENT SUCCESS] payment_sessions.user_id (${paymentSession.user_id}) differs from resolved application_user_id (${resolvedApplicationUserId}). Attempting to correct.`
        );
        needsUserIdUpdate = true;
      } else if (paymentSession.user_id === null && !resolvedApplicationUserId) {
        // This case should not happen if resolvedApplicationUserId is fetched successfully.
        console.error(
          `[PAYMENT SUCCESS] CRITICAL: payment_sessions.user_id is NULL and resolvedApplicationUserId is also unexpectedly NULL or empty.`
        );
      }
    }

    if (needsUserIdUpdate && resolvedApplicationUserId) {
      updatePayload.user_id = resolvedApplicationUserId;
    }

    // Only proceed with update if there's something to update
    // (status is always updated, plus potentially user_id and stripe_checkout_session_id)
    console.log(
      `[PAYMENT SUCCESS] Attempting to update payment_sessions (ID: ${paymentSession.id}) with payload:`,
      updatePayload
    );
    const { error: updateError } = await supabase
      .from('payment_sessions')
      .update(updatePayload)
      .eq('id', paymentSession.id); // paymentSession.id is the UUID PK

    if (updateError) {
      console.error(
        `[PAYMENT SUCCESS] CRITICAL: Failed to update payment_session (ID: ${paymentSession.id}) with payload:`,
        updatePayload,
        'Error:',
        updateError
      );
      return NextResponse.json(
        { error: 'Failed to finalize payment session details.' },
        { status: 500 }
      );
    }
    console.log(
      `[PAYMENT SUCCESS] Payment session (ID: ${paymentSession.id}) updated successfully.`
    );

    // Manually update local paymentSession object for consistency in subsequent logic
    if (needsUserIdUpdate && resolvedApplicationUserId) {
      paymentSession.user_id = resolvedApplicationUserId;
    }
    paymentSession.status = 'completed';
    if (updatePayload.stripe_checkout_session_id) {
      paymentSession.stripe_checkout_session_id = updatePayload.stripe_checkout_session_id;
    }

    // 4. Critical user_id Check
    if (!paymentSession.user_id) {
      console.error(
        '[PAYMENT SUCCESS] CRITICAL: paymentSession.user_id is NULL even after update logic for payment_session.id:',
        paymentSession.id
      );
      return NextResponse.json(
        { error: 'Failed to associate user with payment session definitively.' },
        { status: 500 }
      );
    }
    console.log(
      `[PAYMENT SUCCESS] Confirmed payment_session (ID: ${paymentSession.id}) is associated with user_id:`,
      paymentSession.user_id
    );

    // 5. Proceed to Assistant Creation (existing logic uses paymentSession.assistant_config_data)
    const assistantConfigData = paymentSession.assistant_config_data as AssistantConfigData;
    console.log(
      '[PAYMENT SUCCESS] Assistant config data from payment session:',
      assistantConfigData
    );

    // 5a. Determine Plan Name using internal plan_id from paymentSession
    const internalPlanId = paymentSession.plan_id;

    if (!internalPlanId || typeof internalPlanId !== 'string' || internalPlanId.trim() === '') {
      console.error(
        `[PAYMENT SUCCESS] CRITICAL: Plan ID missing or invalid in payment session (ID: ${paymentSession.id}). Received: ${internalPlanId}`
      );
      return NextResponse.json(
        { error: 'Critical: Plan ID missing or invalid in payment session.' },
        { status: 500 }
      );
    }

    console.log(
      `[PAYMENT SUCCESS] Looking up plan details for internal plan ID: ${internalPlanId}`
    );
    const planDetails = getSubscriptionPlanDetails(internalPlanId);

    if (!planDetails) {
      console.error(
        `[PAYMENT SUCCESS] CRITICAL: Unknown plan ID found in payment session: ${internalPlanId}. Plan not configured in lib/subscription-plans.ts.`
      );
      return NextResponse.json(
        { error: 'Critical: Plan configuration error. Unknown plan ID from payment session.' },
        { status: 500 }
      );
    }

    const planName = planDetails.id; // e.g., "personal", "business"
    console.log(
      `[PAYMENT SUCCESS] Successfully determined plan name: "${planName}" for internal plan ID: ${internalPlanId}`
    );

    try {
      console.log('[PAYMENT SUCCESS] Preparing assistant creation request...');

      const createAssistantPayload = {
        assistantName:
          assistantConfigData.display_name ||
          (assistantConfigData.business_name
            ? assistantConfigData.business_name + ' Assistant'
            : 'Business Assistant'),
        description:
          assistantConfigData.description ||
          `AI assistant for ${assistantConfigData.business_name || 'your business'}`,
        params: {
          conciergeName: assistantConfigData.concierge_name || 'Assistant',
          businessName: assistantConfigData.business_name || 'Business',
          phoneNumber: assistantConfigData.business_phone || '',
        },
        stripeCheckoutSessionId: sessionId,
        paymentSessionId: paymentSession.id, // Pass the payment session ID
        plan: planName, // Use fetched plan name
      };

      console.log('[PAYMENT SUCCESS] Assistant creation payload:', createAssistantPayload);

      // Call the create assistant API
      console.log('[PAYMENT SUCCESS] Calling create assistant API...');
      const response = await fetch(`${origin}/api/Concierge/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(createAssistantPayload),
      });

      console.log('[PAYMENT SUCCESS] Create assistant API response:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
      });

      if (response.ok) {
        const result = (await response.json()) as CreateAssistantResult;
        console.log('[PAYMENT SUCCESS] Assistant created successfully:', {
          assistantId: result.assistantId,
          pendingAssistantId: result.pendingAssistantId,
          message: result.message,
          sessionId,
          paymentSessionId: paymentSession.id,
          duration: Date.now() - startTime,
        });

        return NextResponse.json({
          message: 'Assistant created successfully',
          assistantId: result.assistantId,
          redirectUrl: `${origin}/Concierge?success=payment_complete&assistant_created=true`,
        });
      } else {
        const errorText = await response.text().catch(() => 'Failed to read error response');
        console.error('[PAYMENT SUCCESS] Failed to create assistant:', {
          status: response.status,
          statusText: response.statusText,
          errorText,
          sessionId,
          assistantName: assistantConfigData.display_name || 'Unknown',
        });

        return NextResponse.json(
          {
            error: 'Assistant creation failed',
            redirectUrl: `${origin}/Concierge?error=assistant_creation_failed`,
          },
          { status: 500 }
        );
      }
    } catch (createError) {
      console.error('[PAYMENT SUCCESS] Error creating assistant:', {
        error: createError,
        message: createError instanceof Error ? createError.message : String(createError),
        stack: createError instanceof Error ? createError.stack : undefined,
        sessionId,
        paymentSessionId: paymentSession.id,
      });

      return NextResponse.json(
        {
          error: 'Assistant creation error',
          redirectUrl: `${origin}/Concierge?error=assistant_creation_error`,
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('[PAYMENT SUCCESS] Unexpected error:', {
      error,
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      sessionId,
      duration: Date.now() - startTime,
    });

    return NextResponse.json(
      {
        error: 'Processing failed',
        redirectUrl: `${origin}/Concierge?error=unexpected_error`,
      },
      { status: 500 }
    );
  } finally {
    console.log('[PAYMENT SUCCESS] Request completed:', {
      sessionId,
      duration: Date.now() - startTime,
      timestamp: new Date().toISOString(),
    });
  }
}

// Handle legacy flow when payment session is not found (for backward compatibility)
async function _handleLegacyMetadataFlow(
  session: Stripe.Checkout.Session,
  origin: string,
  startTime: number
) {
  const sessionId = session.id;

  try {
    // For pricing table subscriptions, assistant data might not be in metadata
    // In that case, we'll create a basic assistant with available information
    if (!session.metadata || Object.keys(session.metadata).length === 0) {
      console.warn(
        '[PAYMENT SUCCESS] No assistant data found in session metadata, using defaults:',
        {
          sessionId,
          hasMetadata: !!session.metadata,
          metadataKeys: session.metadata ? Object.keys(session.metadata) : [],
          customerEmail: session.customer_details?.email,
          mode: session.mode,
        }
      );

      // For pricing table flow without stored assistant data, we'll create a default assistant
      // Extract what we can from the session
      const customerEmail = session.customer_details?.email || '';
      const businessName = customerEmail.split('@')[0] || 'Business'; // Use email prefix as business name

      console.log('[PAYMENT SUCCESS] Creating default assistant with available data:', {
        customerEmail,
        businessName,
        sessionMode: session.mode,
      });

      const assistantData = {
        name: `${businessName} Assistant`,
        description: `AI assistant for ${businessName}`,
        concierge_name: `${businessName} Concierge`,
        personality: 'professional and helpful',
        business_name: businessName,
        business_phone: '',
        share_phone_number: false,
        display_name: `${businessName} Assistant`,
      };

      console.log('[PAYMENT SUCCESS] Default assistant data created:', assistantData);

      // Continue with assistant creation using default data
      try {
        console.log('[PAYMENT SUCCESS] Preparing assistant creation request with default data...');

        const createAssistantPayload = {
          assistantName: assistantData.name,
          description: assistantData.description,
          params: {
            conciergeName: assistantData.concierge_name,
            businessName: assistantData.business_name,
            phoneNumber: assistantData.business_phone,
          },
          stripeCheckoutSessionId: sessionId,
          plan: 'personal', // Changed from 'business' to 'personal'
        };

        console.log(
          '[PAYMENT SUCCESS] Assistant creation payload (default):',
          createAssistantPayload
        );

        // Call the create assistant API
        console.log('[PAYMENT SUCCESS] Calling create assistant API...');
        const response = await fetch(`${origin}/api/Concierge/create`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(createAssistantPayload),
        });

        console.log('[PAYMENT SUCCESS] Create assistant API response:', {
          status: response.status,
          statusText: response.statusText,
          ok: response.ok,
        });

        if (response.ok) {
          const result = (await response.json()) as CreateAssistantResult;
          console.log('[PAYMENT SUCCESS] Default assistant created successfully:', {
            assistantId: result.assistantId,
            pendingAssistantId: result.pendingAssistantId,
            message: result.message,
            sessionId,
            duration: Date.now() - startTime,
          });

          return NextResponse.json({
            message: 'Assistant created successfully with default settings',
            assistantId: result.assistantId,
            redirectUrl: `${origin}/Concierge?success=payment_complete&assistant_created=true&type=default`,
          });
        } else {
          const errorText = await response.text().catch(() => 'Failed to read error response');
          console.error('[PAYMENT SUCCESS] Failed to create default assistant:', {
            status: response.status,
            statusText: response.statusText,
            errorText,
            sessionId,
          });

          return NextResponse.json(
            {
              error: 'Assistant creation failed',
              redirectUrl: `${origin}/Concierge?error=assistant_creation_failed`,
            },
            { status: 500 }
          );
        }
      } catch (createError) {
        console.error('[PAYMENT SUCCESS] Error creating default assistant:', {
          error: createError,
          message: createError instanceof Error ? createError.message : String(createError),
          stack: createError instanceof Error ? createError.stack : undefined,
          sessionId,
        });

        return NextResponse.json(
          {
            error: 'Assistant creation error',
            redirectUrl: `${origin}/Concierge?error=assistant_creation_error`,
          },
          { status: 500 }
        );
      }
    }

    // Log all metadata for debugging
    console.log('[PAYMENT SUCCESS] Session metadata:', {
      keys: Object.keys(session.metadata),
      assistant_name: session.metadata.assistant_name,
      business_name: session.metadata.business_name,
      concierge_name: session.metadata.concierge_name,
      userId: session.metadata.userId,
      authUserId: session.metadata.authUserId,
    });

    // Extract assistant data from Stripe session metadata
    const assistantData = {
      name: session.metadata.assistant_name || '',
      description: session.metadata.assistant_description || '',
      concierge_name: session.metadata.concierge_name || '',
      personality: session.metadata.personality || '',
      business_name: session.metadata.business_name || '',
      business_phone: session.metadata.business_phone || '',
      share_phone_number: session.metadata.share_phone_number === 'true',
      display_name: session.metadata.display_name || '',
    };

    console.log('[PAYMENT SUCCESS] Assistant data extracted:', {
      name: assistantData.name,
      description: assistantData.description,
      conciergeName: assistantData.concierge_name,
      businessName: assistantData.business_name,
      businessPhone: assistantData.business_phone,
      sharePhoneNumber: assistantData.share_phone_number,
      displayName: assistantData.display_name,
      personality: assistantData.personality,
    });

    // Verify we have required assistant data
    if (!assistantData.name) {
      console.error('[PAYMENT SUCCESS] No assistant name found in session metadata:', {
        sessionId,
        hasMetadata: !!session.metadata,
        metadataKeys: session.metadata ? Object.keys(session.metadata) : [],
      });
      return NextResponse.json(
        {
          error: 'Missing assistant name',
          redirectUrl: `${origin}/Concierge?error=missing_assistant_name`,
        },
        { status: 400 }
      );
    }

    console.log(
      '[PAYMENT SUCCESS] Assistant data validation passed, proceeding to create assistant'
    );

    try {
      console.log('[PAYMENT SUCCESS] Preparing assistant creation request...');

      const createAssistantPayload = {
        assistantName: assistantData.name,
        description: assistantData.description,
        params: {
          conciergeName: assistantData.concierge_name,
          businessName: assistantData.business_name,
          phoneNumber: assistantData.business_phone,
        },
        stripeCheckoutSessionId: sessionId,
        plan: 'personal', // Changed from 'business' to 'personal'
      };

      console.log('[PAYMENT SUCCESS] Assistant creation payload:', createAssistantPayload);

      // Call the create assistant API
      console.log('[PAYMENT SUCCESS] Calling create assistant API...');
      const response = await fetch(`${origin}/api/Concierge/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(createAssistantPayload),
      });

      console.log('[PAYMENT SUCCESS] Create assistant API response:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        headers: Object.fromEntries(response.headers.entries()),
      });

      if (response.ok) {
        const result = (await response.json()) as CreateAssistantResult;
        console.log('[PAYMENT SUCCESS] Assistant created successfully:', {
          assistantId: result.assistantId,
          pendingAssistantId: result.pendingAssistantId,
          message: result.message,
          sessionId,
          duration: Date.now() - startTime,
        });

        return NextResponse.json({
          message: 'Assistant created successfully',
          assistantId: result.assistantId,
          redirectUrl: `${origin}/Concierge?success=payment_complete&assistant_created=true`,
        });
      } else {
        const errorText = await response.text().catch(() => 'Failed to read error response');
        console.error('[PAYMENT SUCCESS] Failed to create assistant:', {
          status: response.status,
          statusText: response.statusText,
          errorText,
          sessionId,
          assistantName: assistantData.name,
        });

        return NextResponse.json(
          {
            error: 'Assistant creation failed',
            redirectUrl: `${origin}/Concierge?error=assistant_creation_failed`,
          },
          { status: 500 }
        );
      }
    } catch (createError) {
      console.error('[PAYMENT SUCCESS] Error creating assistant:', {
        error: createError,
        message: createError instanceof Error ? createError.message : String(createError),
        stack: createError instanceof Error ? createError.stack : undefined,
        sessionId,
        assistantName: assistantData.name,
      });

      return NextResponse.json(
        {
          error: 'Assistant creation error',
          redirectUrl: `${origin}/Concierge?error=assistant_creation_error`,
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('[PAYMENT SUCCESS] Unexpected error in legacy flow:', {
      error,
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      sessionId,
      duration: Date.now() - startTime,
    });

    return NextResponse.json(
      {
        error: 'Processing failed',
        redirectUrl: `${origin}/Concierge?error=unexpected_error`,
      },
      { status: 500 }
    );
  } finally {
    console.log('[PAYMENT SUCCESS] Legacy flow completed:', {
      sessionId,
      duration: Date.now() - startTime,
      timestamp: new Date().toISOString(),
    });
  }
}
