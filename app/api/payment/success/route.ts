import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

import type Stripe from 'stripe';

import { createClient } from '@/utils/supabase/server-admin';

interface CreateAssistantResult {
  message: string;
  assistantId: string;
  pendingAssistantId: string;
}

interface WebhookPayload {
  id: string;
  object: string;
  data: {
    object: Stripe.Checkout.Session;
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
// We'll use the inferred type from Supabase query

// Handle POST requests with webhook payload from Stripe
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const { origin } = new URL(request.url);

  console.log('[PAYMENT SUCCESS] POST Request started:', {
    url: request.url,
    origin,
    timestamp: new Date().toISOString(),
    userAgent: request.headers.get('user-agent'),
    referer: request.headers.get('referer'),
  });

  let sessionId: string = 'unknown';

  try {
    const body = (await request.json()) as WebhookPayload;

    console.log('[PAYMENT SUCCESS] Webhook payload received:', {
      eventId: body.id,
      eventType: body.type,
      hasData: !!body.data,
      hasObject: !!body.data?.object,
    });

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
    const supabase = createClient();

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

    const userId = clientRefMatch[1];
    const paymentSessionId = clientRefMatch[2]; // This is our internal session ID
    console.log('[PAYMENT SUCCESS] Extracted:', { userId, paymentSessionId });

    // Get user data from database using auth_user_id (not id)
    console.log('[PAYMENT SUCCESS] Fetching user data from database...');
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('auth_user_id', userId)
      .single();

    if (userError || !userData) {
      console.error('[PAYMENT SUCCESS] Error fetching user data:', {
        error: userError,
        hasUserData: !!userData,
        userId: userId,
        clientReferenceId: clientRefId,
        errorCode: userError?.code,
        errorMessage: userError?.message,
        errorDetails: userError?.details,
        errorHint: userError?.hint,
      });
      return NextResponse.json(
        {
          error: 'User not found',
          userId: userId,
          clientReferenceId: clientRefId,
          errorCode: userError?.code,
          errorMessage: userError?.message,
          redirectUrl: `${origin}/Concierge?error=user_not_found&user_id=${userId}`,
        },
        { status: 404 }
      );
    }

    console.log('[PAYMENT SUCCESS] User data retrieved:', {
      userId: userData.id,
      fullName: userData.full_name,
      stripeCustomerId: userData.stripe_customer_id,
      createdAt: userData.created_at,
    });

    // Look up payment session by our internal session ID (if available)
    console.log('[PAYMENT SUCCESS] Looking up payment session...');
    let paymentSessionData = null;
    let paymentSessionError = null;

    if (paymentSessionId) {
      console.log('[PAYMENT SUCCESS] Using internal session ID:', paymentSessionId);
      const result = await supabase
        .from('payment_sessions')
        .select('*')
        .eq('session_id', paymentSessionId)
        .single();
      
      paymentSessionData = result.data;
      paymentSessionError = result.error;
    } else {
      // Fallback: Try to find by stripe_checkout_session_id
      console.log('[PAYMENT SUCCESS] Falling back to Stripe session ID:', sessionId);
      const result = await supabase
        .from('payment_sessions')
        .select('*')
        .eq('stripe_checkout_session_id', sessionId)
        .single();
      
      paymentSessionData = result.data;
      paymentSessionError = result.error;
    }

    if (paymentSessionError || !paymentSessionData) {
      console.error('[PAYMENT SUCCESS] Payment session not found:', {
        error: paymentSessionError,
        paymentSessionId,
        stripeSessionId: sessionId,
        errorCode: paymentSessionError?.code,
        errorMessage: paymentSessionError?.message,
        hasData: !!paymentSessionData,
      });

      // Fallback: Try to extract data from session metadata for backward compatibility
      console.log('[PAYMENT SUCCESS] Falling back to session metadata extraction...');
      return await handleLegacyMetadataFlow(session, origin, startTime);
    }

    // At this point, paymentSessionData is confirmed to exist
    const paymentSession = paymentSessionData;

    console.log('[PAYMENT SUCCESS] Payment session found:', {
      paymentSessionId: paymentSession.id,
      sessionId: paymentSession.session_id,
      status: paymentSession.status,
      planId: paymentSession.plan_id || 'unknown',
      hasConfigData: !!paymentSession.assistant_config_data,
    });

    // Update payment session status to completed
    const { error: updateError } = await supabase
      .from('payment_sessions')
      .update({
        status: 'completed',
        updated_at: new Date().toISOString(),
      })
      .eq('id', paymentSession.id);

    if (updateError) {
      console.error('[PAYMENT SUCCESS] Failed to update payment session status:', updateError);
    }

    // Extract assistant config data from payment session
    const assistantConfigData = paymentSession.assistant_config_data as AssistantConfigData;
    console.log(
      '[PAYMENT SUCCESS] Assistant config data from payment session:',
      assistantConfigData
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
        plan: 'business', // Default to business plan for paid sessions
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
async function handleLegacyMetadataFlow(
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
          plan: 'business', // Default to business plan for paid sessions
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
        plan: 'business', // Default to business plan for paid sessions
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
