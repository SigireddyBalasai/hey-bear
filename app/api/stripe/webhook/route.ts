import { headers } from 'next/headers';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import Stripe from 'stripe';

import type { Database } from '@/lib/db.types';
import { createClient } from '@/utils/supabase/server';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: NextRequest) {
  const body = await request.text();
  const headersList = await headers();
  const signature = headersList.get('stripe-signature');

  if (!signature) {
    console.error('Missing Stripe signature');
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  console.log('Received Stripe webhook event:', event.type);

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutSessionCompleted(session);
        break;
      }
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaymentSucceeded(invoice);
        break;
      }
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaymentFailed(invoice);
        break;
      }
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(subscription);
        break;
      }
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  console.log('Processing checkout session completed:', session.id);

  const supabase = await createClient();

  // Extract user ID and assistant data from metadata or client_reference_id
  const clientReferenceId = session.client_reference_id;
  const assistantName = session.metadata?.assistant_name;
  const userIdFromMetadata = session.metadata?.user_id;

  // Extract user ID from client_reference_id
  // Handle both old format (user-{userId}) and new format (user-{userId}-session-{sessionId})
  let userId = userIdFromMetadata;
  let sessionId: string | null = null;

  if (!userId && clientReferenceId) {
    // Try new format first: user-{userId}-session-{sessionId}
    const newFormatMatch = clientReferenceId.match(
      /^user-([a-f0-9A-F-]+)-session-([a-f0-9A-F-]+)$/
    );
    if (newFormatMatch) {
      userId = newFormatMatch[1];
      sessionId = newFormatMatch[2];
      console.log('Parsed new format client_reference_id:', { userId, sessionId });
    } else {
      // Fall back to old format: user-{userId}
      const oldFormatMatch = clientReferenceId.match(/^user-([a-f0-9A-F-]+)$/);
      if (oldFormatMatch) {
        userId = oldFormatMatch[1];
        console.log('Parsed old format client_reference_id:', { userId });
      }
    }
  }

  // Extract assistant data from Stripe session metadata or payment_sessions table
  let assistantData: Partial<
    Database['public']['Tables']['assistants']['Insert'] &
      Database['public']['Tables']['assistant_configs']['Insert']
  > | null = null;

  // If we have a sessionId, look up assistant data from payment_sessions table
  if (sessionId && userId) {
    console.log('Looking up assistant data from payment_sessions table with sessionId:', sessionId);
    try {
      // First get the correct user_id from users table
      const { data: userRecord, error: userLookupError } = await supabase
        .from('users')
        .select('id')
        .eq('auth_user_id', userId)
        .single();

      if (userLookupError || !userRecord) {
        console.error('Error finding user record for payment session lookup:', userLookupError);
      } else {
        const { data: paymentSession, error: paymentSessionError } = await supabase
          .from('payment_sessions')
          .select('*')
          .eq('session_id', sessionId)
          .eq('user_id', userRecord.id)
          .single();

        if (paymentSessionError) {
          console.error('Error fetching payment session:', paymentSessionError);
        } else if (paymentSession && paymentSession.assistant_config_data) {
          console.log('Found payment session with assistant config data');
          const configData = paymentSession.assistant_config_data as {
            display_name?: string;
            name?: string;
            description?: string;
            concierge_name?: string;
            personality?: string;
            business_name?: string;
            business_phone?: string;
            share_phone_number?: boolean;
          };

          assistantData = {
            name: configData.display_name || configData.name || 'New Assistant',
            description: configData.description,
            concierge_name: configData.concierge_name,
            personality: configData.personality,
            business_name: configData.business_name,
            business_phone: configData.business_phone,
            share_phone_number: configData.share_phone_number || false,
            display_name: configData.display_name,
          };

          console.log('Extracted assistant data from payment session:', {
            name: assistantData.name,
            businessName: assistantData.business_name,
            conciergeName: assistantData.concierge_name,
          });

          // Update payment session status to completed
          await supabase
            .from('payment_sessions')
            .update({ status: 'completed' })
            .eq('session_id', sessionId);
        }
      }
    } catch (error) {
      console.error('Error retrieving payment session data:', error);
    }
  }

  // Check if this session has assistant data in metadata (direct checkout) - fallback
  if (!assistantData && session.metadata && session.metadata.assistant_name) {
    console.log('Found assistant data in session metadata (direct checkout flow)');
    try {
      assistantData = {
        name: session.metadata.assistant_name || '',
        description: session.metadata.assistant_description || undefined,
        concierge_name: session.metadata.concierge_name || undefined,
        personality: session.metadata.personality || undefined,
        business_name: session.metadata.business_name || undefined,
        business_phone: session.metadata.business_phone || undefined,
        share_phone_number: session.metadata.share_phone_number === 'true',
        display_name: session.metadata.display_name || undefined,
      };
      console.log('Using metadata for assistant data:', {
        assistantName: assistantData.name,
        businessName: assistantData.business_name,
        conciergeName: assistantData.concierge_name,
      });
    } catch (error) {
      console.error('Error parsing assistant data from metadata:', error);
    }
  } else if (clientReferenceId && clientReferenceId.startsWith('cs_')) {
    // Pricing table flow - look up assistant data from original session
    console.log(
      'Pricing table flow detected - looking up original session data:',
      clientReferenceId
    );
    try {
      const { getSessionData } = await import('@/lib/session-storage');
      const originalSessionData = await getSessionData(clientReferenceId);

      if (originalSessionData) {
        console.log('Original session data retrieved successfully');
        userId = originalSessionData.userId; // Use userId from original session
        assistantData = {
          name: originalSessionData.assistantData.name,
          description: originalSessionData.assistantData.description || undefined,
          concierge_name: originalSessionData.assistantData.concierge_name || undefined,
          personality: originalSessionData.assistantData.personality || undefined,
          business_name: originalSessionData.assistantData.business_name || undefined,
          business_phone: originalSessionData.assistantData.business_phone || undefined,
          share_phone_number: originalSessionData.assistantData.share_phone_number,
          display_name: originalSessionData.assistantData.display_name || undefined,
        };
        console.log('Using original session data for assistant:', {
          assistantName: assistantData.name,
          businessName: assistantData.business_name,
          userId: originalSessionData.userId,
        });
      } else {
        console.error(
          'Could not retrieve original session data for pricing table flow:',
          clientReferenceId
        );
      }
    } catch (error) {
      console.error('Error retrieving original session data:', error);
    }
  } else {
    console.log('No assistant data found in session metadata or client_reference_id');
  }

  console.log('Extracted data:', {
    clientReferenceId,
    assistantName,
    userId,
    assistantData,
    customerId: session.customer,
    subscriptionId: session.subscription,
  });

  // Handle assistant creation and subscription
  if (
    session.customer &&
    session.subscription &&
    userId &&
    (assistantName || assistantData?.name)
  ) {
    const customerId =
      typeof session.customer === 'string' ? session.customer : session.customer.id;
    const subscriptionId =
      typeof session.subscription === 'string' ? session.subscription : session.subscription.id;
    const finalAssistantName = assistantName || assistantData?.name || '';

    try {
      // First, get the correct user_id from the users table using auth_user_id
      console.log('Looking up user record with auth_user_id:', userId);
      const { data: userData, error: userLookupError } = await supabase
        .from('users')
        .select('id')
        .eq('auth_user_id', userId)
        .single();

      if (userLookupError || !userData) {
        console.error('Error finding user record:', userLookupError);
        console.error('User with auth_user_id not found:', userId);
        return;
      }

      const actualUserId = userData.id;
      console.log('Found user record - auth_user_id:', userId, 'actual user_id:', actualUserId);

      // Check if assistant already exists
      const { data: existingAssistant, error: assistantError } = await supabase
        .from('assistants')
        .select('id')
        .eq('user_id', actualUserId)
        .eq('name', finalAssistantName)
        .single();

      let assistantId = existingAssistant?.id;

      // If assistant doesn't exist and we have assistant data, create it
      if (!existingAssistant && assistantData) {
        console.log('Creating assistant from webhook with data:', assistantData);

        // Create assistant (only fields that exist in assistants table)
        const { data: newAssistant, error: createError } = await supabase
          .from('assistants')
          .insert({
            user_id: actualUserId,
            name: assistantData.name || 'New Assistant',
          })
          .select('id')
          .single();

        if (createError) {
          console.error('Error creating assistant in webhook:', createError);
        } else if (newAssistant) {
          assistantId = newAssistant.id;
          console.log('Successfully created assistant in webhook:', newAssistant.id);

          // Create assistant config with all the detailed configuration
          const conciergeName = assistantData.concierge_name || assistantData.name || 'Assistant';
          const businessName = assistantData.business_name || '';
          const systemPrompt = `You are ${conciergeName}, a helpful assistant for ${businessName || 'the user'}. Your personality is ${(assistantData.personality || 'Business Casual').toLowerCase()}. ${assistantData.description || ''}`;

          const { error: configError } = await supabase.from('assistant_configs').insert({
            id: newAssistant.id,
            description: assistantData.description,
            display_name: assistantData.display_name || assistantData.name,
            concierge_name: assistantData.concierge_name,
            personality: assistantData.personality,
            business_name: assistantData.business_name,
            business_phone: assistantData.business_phone,
            share_phone_number: assistantData.share_phone_number,
            system_prompt: systemPrompt,
          });

          if (configError) {
            console.error('Error creating assistant config in webhook:', configError);
          }

          // Create default usage limits
          const { error: limitsError } = await supabase.from('assistant_usage_limits').insert({
            assistant_id: newAssistant.id,
            max_calls_per_month: 100, // Default limit for personal plan
            max_minutes_per_month: 300,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });

          if (limitsError) {
            console.error('Error creating assistant usage limits in webhook:', limitsError);
          }
        }
      } else if (assistantError && assistantError.code !== 'PGRST116') {
        // PGRST116 is "not found" error, which is expected if assistant doesn't exist
        console.error('Error finding assistant:', assistantError);
      }

      // Create or update assistant subscription if we have an assistant
      if (assistantId) {
        // Get the subscription plan from payment session or default to 'personal'
        let planId = 'personal'; // Default fallback

        // If we have sessionId, get the plan from payment session
        if (sessionId) {
          try {
            // Use the actualUserId we already have
            const { data: paymentSession } = await supabase
              .from('payment_sessions')
              .select('plan_id')
              .eq('session_id', sessionId)
              .eq('user_id', actualUserId)
              .single();

            if (paymentSession?.plan_id) {
              planId = paymentSession.plan_id;
              console.log('Using plan_id from payment session:', planId);
            }
          } catch (error) {
            console.error('Error fetching plan_id from payment session:', error);
          }
        }

        // For checkout sessions, we can get basic subscription info from the session
        // We'll update with detailed period info when we get the first invoice
        const { error: subscriptionError } = await supabase.from('assistant_subscriptions').upsert(
          {
            assistant_id: assistantId,
            plan_id: planId,
            status: 'active',
            stripe_subscription_id: subscriptionId,
            current_period_start: new Date().toISOString(), // Will be updated by invoice webhook
            current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // Default 30 days, will be updated by invoice webhook
          },
          {
            onConflict: 'assistant_id',
          }
        );

        if (subscriptionError) {
          console.error('Error updating assistant subscription:', subscriptionError);
        } else {
          console.log('Successfully updated assistant subscription status');
        }
      } else {
        console.log('No assistant ID available for subscription creation');
      }

      // Ensure user record exists in users table (in case the trigger failed)
      if (userId) {
        const { data: _existingUser, error: userCheckError } = await supabase
          .from('users')
          .select('id')
          .eq('auth_user_id', userId)
          .single();

        if (userCheckError && userCheckError.code === 'PGRST116') {
          // User not found, try to create one
          console.log('User not found in users table, attempting to create:', userId);

          // Get user data from auth.users table
          const { data: authUser, error: authUserError } =
            await supabase.auth.admin.getUserById(userId);

          if (authUserError) {
            console.error('Error fetching auth user:', authUserError);
          } else if (authUser.user) {
            const { error: createUserError } = await supabase.from('users').insert({
              auth_user_id: userId,
              email: authUser.user.email || '',
              stripe_customer_id: customerId,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            });

            if (createUserError) {
              console.error('Error creating user record:', createUserError);
            } else {
              console.log('Successfully created user record for:', userId);
            }
          }
        } else if (userCheckError) {
          console.error('Error checking user existence:', userCheckError);
        } else {
          // User exists, update stripe customer ID
          const { error: userUpdateError } = await supabase
            .from('users')
            .update({
              stripe_customer_id: customerId,
            })
            .eq('auth_user_id', userId);

          if (userUpdateError) {
            console.error('Error updating user stripe customer ID:', userUpdateError);
          } else {
            console.log('Successfully updated user stripe customer ID');
          }
        }
      }
    } catch (error) {
      console.error('Error in checkout session completed handler:', error);
    }
  } else {
    console.log('Missing required data for assistant creation:', {
      customer: !!session.customer,
      subscription: !!session.subscription,
      userId: !!userId,
      assistantName: !!(assistantName || assistantData?.name),
    });
  }

  // Log the successful payment for tracking
  console.log('Checkout session completed successfully:', {
    sessionId: session.id,
    customerId: session.customer,
    subscriptionId: session.subscription,
    assistantName: assistantName || assistantData?.name || '',
    clientReferenceId,
    userId,
  });
}

async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  console.log('Processing invoice payment succeeded:', invoice.id);

  const supabase = await createClient();

  // For subscription invoices, get subscription info from lines
  const subscriptionLine = invoice.lines?.data?.[0];
  const subscriptionId = subscriptionLine?.subscription;

  if (invoice.customer && subscriptionId && typeof subscriptionId === 'string') {
    try {
      // Find the assistant subscription by stripe subscription ID
      const { data: assistantSubscription, error: subscriptionError } = await supabase
        .from('assistant_subscriptions')
        .select('*')
        .eq('stripe_subscription_id', subscriptionId)
        .single();

      if (subscriptionError) {
        console.error('Error finding assistant subscription for invoice:', subscriptionError);
        return;
      }

      if (assistantSubscription) {
        // Get subscription details from Stripe for updated period info
        const subscriptionData = await stripe.subscriptions.retrieve(subscriptionId);

        // Update subscription status to active with new period dates
        const { error: updateError } = await supabase
          .from('assistant_subscriptions')
          .update({
            status: 'active',
            current_period_start: new Date(
              (subscriptionData as unknown as { current_period_start: number })
                .current_period_start * 1000
            ).toISOString(),
            current_period_end: new Date(
              (subscriptionData as unknown as { current_period_end: number }).current_period_end *
                1000
            ).toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', assistantSubscription.id);

        if (updateError) {
          console.error('Error updating assistant subscription from invoice:', updateError);
        } else {
          console.log('Successfully updated assistant subscription from invoice');
        }
      }
    } catch (error) {
      console.error('Error in invoice payment succeeded handler:', error);
    }
  }
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  console.log('Processing invoice payment failed:', invoice.id);

  const supabase = await createClient();

  // For subscription invoices, get subscription info from lines
  const subscriptionLine = invoice.lines?.data?.[0];
  const subscriptionId = subscriptionLine?.subscription;

  if (invoice.customer && subscriptionId && typeof subscriptionId === 'string') {
    try {
      // Find the assistant subscription by stripe subscription ID
      const { data: assistantSubscription, error: subscriptionError } = await supabase
        .from('assistant_subscriptions')
        .select('*')
        .eq('stripe_subscription_id', subscriptionId)
        .single();

      if (subscriptionError) {
        console.error(
          'Error finding assistant subscription for failed invoice:',
          subscriptionError
        );
        return;
      }

      if (assistantSubscription) {
        // Update subscription status to past_due
        const { error: updateError } = await supabase
          .from('assistant_subscriptions')
          .update({
            status: 'past_due',
            updated_at: new Date().toISOString(),
          })
          .eq('id', assistantSubscription.id);

        if (updateError) {
          console.error('Error updating assistant subscription for failed payment:', updateError);
        } else {
          console.log('Successfully updated assistant subscription for failed payment');
        }
      }
    } catch (error) {
      console.error('Error in invoice payment failed handler:', error);
    }
  }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  console.log('Processing subscription deleted:', subscription.id);

  const supabase = await createClient();

  try {
    // Find the assistant subscription by stripe subscription ID
    const { data: assistantSubscription, error: subscriptionError } = await supabase
      .from('assistant_subscriptions')
      .select('*')
      .eq('stripe_subscription_id', subscription.id)
      .single();

    if (subscriptionError) {
      console.error('Error finding assistant subscription for deletion:', subscriptionError);
      return;
    }

    if (assistantSubscription) {
      // Update subscription status to cancelled and clear stripe subscription ID
      const { error: updateError } = await supabase
        .from('assistant_subscriptions')
        .update({
          status: 'cancelled',
          stripe_subscription_id: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', assistantSubscription.id);

      if (updateError) {
        console.error('Error updating assistant subscription for deletion:', updateError);
      } else {
        console.log('Successfully updated assistant subscription for deletion');
      }
    }
  } catch (error) {
    console.error('Error in subscription deleted handler:', error);
  }
}
