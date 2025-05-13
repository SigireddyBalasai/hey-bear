import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { stripe } from '@/lib/stripe';
import { createServiceClient } from '@/utils/supabase/server-admin';
import { v4 as uuidv4 } from 'uuid';
import { getPineconeClient } from '@/lib/pinecone';
import { updateAssistantData } from '@/utils/assistant-data';

// Helper function to generate a valid Pinecone name
function generatePineconeName(name: string): string {
  // Pinecone requires names to be lowercase alphanumeric with hyphens, no underscores, 
  // Start with a letter, at least 3 characters, and no more than 45 characters
  
  // Convert to lowercase and replace non-alphanumeric chars with hyphens
  let safeName = name.toLowerCase().replace(/[^a-z0-9]/g, '-');
  
  // Replace consecutive hyphens with a single one
  safeName = safeName.replace(/-{2,}/g, '-');
  
  // Remove leading and trailing hyphens
  safeName = safeName.replace(/^-+|-+$/g, '');
  
  // Ensure the name starts with a letter
  if (!/^[a-z]/.test(safeName)) {
    safeName = 'a' + safeName;
  }
  
  // Ensure the name is at least 3 characters long
  if (safeName.length < 3) {
    safeName = safeName + 'bot';
  }
  
  // Limit length to 40 chars to leave room for random suffix
  safeName = safeName.substring(0, 40);
  
  // Add a random suffix for uniqueness (using hyphen as separator)
  const randomSuffix = Math.random().toString(36).substring(2, 7);
  
  // Combine name and suffix with a hyphen
  return `${safeName}-${randomSuffix}`;
}

// This endpoint handles Stripe webhook events to sync subscription state with our database
export async function POST(req: NextRequest) {
  console.log('==== WEBHOOK RECEIVED ====');
  const body = await req.text();
  const headersInstance = await headers();
  const signature = headersInstance.get('stripe-signature') as string;
  
  console.log('Webhook signature received:', signature ? 'Yes' : 'No');

  let event;
  
  try {
    event = stripe?.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET || ''
    );
    console.log('Webhook event constructed successfully:', event?.type);
  } catch (error: any) {
    console.error(`Webhook signature verification failed: ${error.message}`);
    // Log more details about the signature verification failure
    console.error('Stripe-Signature header:', signature);
    console.error('STRIPE_WEBHOOK_SECRET length:', (process.env.STRIPE_WEBHOOK_SECRET || '').length);
    return NextResponse.json({ error: `Webhook Error: ${error.message}` }, { status: 400 });
  }

  // Get a server admin client
  const supabase = createServiceClient();
  
  try {
    // Handle the event
    console.log(`Processing webhook event: ${event?.type}`);
    
    switch (event?.type) {
      case 'invoice.paid':
        await handleInvoicePaid(event.data.object, supabase);
        break;
      
      case 'checkout.session.completed':
        console.log('Checkout session completed event received');
        console.log('Session data:', JSON.stringify(event.data.object, null, 2));
        await handleCheckoutSessionCompleted(event.data.object, supabase);
        break;
      
      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object, supabase);
        break;
      
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object, supabase);
        break;
      
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object, supabase);
        break;
      
      case 'payment_method.attached':
        // Handle payment method attached
        break;
      
      case 'payment_intent.succeeded':
        // Handle successful payment
        break;
      
      case 'payment_intent.payment_failed':
        await handlePaymentFailed(event.data.object, supabase);
        break;
      
      default:
        // Unexpected event type
        console.log(`Unhandled event type: ${event?.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Error handling webhook:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}

// Handle checkout session completed - create the assistant if it was a pending assistant
async function handleCheckoutSessionCompleted(session: any, supabase: any) {
  console.log('Processing checkout session completed:', session.id);
  
  // Check if this is a session for an assistant
  if (session && session.metadata?.pendingAssistantId) {
    const pendingAssistantId = session.metadata.pendingAssistantId;
    
    console.log(`Found pending assistant metadata: pendingId=${pendingAssistantId}`);
    
    // Check if the checkout was successful
    if (session.payment_status !== 'paid') {
      console.log(`Payment not completed for session ${session.id}, status: ${session.payment_status}`);
      return;
    }
    
    // Get the pending assistant
    const { data: pendingAssistant, error: pendingError } = await supabase
      .from('assistants')
      .select('*')
      .eq('id', pendingAssistantId)
      
      .single();
    
    if (pendingError || !pendingAssistant) {
      console.error('Error fetching pending assistant:', pendingError);
      return;
    }
    
    return handleCheckoutSessionForAssistant(session, supabase, pendingAssistant);
  } else {
    console.log('Session does not contain pending assistant metadata:', session.id);
  }
}

// Helper function to get plan_id (UUID) from Stripe product ID
async function getPlanIdFromProductId(productId: string, supabase: any): Promise<string | null> {
  // Query the plans table to find the matching plan by product ID
  const { data: plans, error } = await supabase
    .from('plans')
    .select('id, stripe_product_id')
    .eq('stripe_product_id', productId)
    .single();
  
  if (error || !plans) {
    console.error(`Error finding plan for product ID ${productId}:`, error);
    return null;
  }
  
  return plans.id;
}

// Helper function to process a checkout session for a specific assistant
async function handleCheckoutSessionForAssistant(session: any, supabase: any, pendingAssistant: any) {
  try {
    // Extract relevant details from the session
    const checkoutSessionId = session.id;
    const subscriptionId = session.subscription;
    const customerId = session.customer;
    const priceId = session.metadata?.price_id;
    
    if (!subscriptionId) {
      throw new Error('No subscription ID in session');
    }
    
    // Fetch subscription details
    const stripe = getStripeInstance();
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    
    if (!subscription) {
      throw new Error('Could not retrieve subscription');
    }
    
    // Generate a unique name for the Pinecone assistant
    const pinecone_name = generatePineconeName(pendingAssistant.name);
    
    // Create a new assistant in Pinecone
    const pinecone = getPineconeClient();
    if (!pinecone) {
      throw new Error('Could not get Pinecone client');
    }
    
    try {
      // Create the Pinecone assistant
      // ...existing code for creating Pinecone assistant...

      // Handle existing errors the same way
      // ...existing error handling code...
    }
    
    // Get the current period end timestamp and safely convert to ISO string
    const currentPeriodEndISO = safeTimestampToISO((subscription as any).current_period_end);
    const currentPeriodStartISO = safeTimestampToISO((subscription as any).current_period_start);
    const planType = session.metadata?.plan_type || 'personal';

    // Update subscription in the new normalized tables
    await updateAssistantData(pendingAssistant.id, {
      // Update assistant config
      config: {
        id: pendingAssistant.id,
        // Use existing description from params or default
        description: typeof pendingAssistant.params === 'object' && 
                    pendingAssistant.params !== null &&
                    'description' in pendingAssistant.params ? 
                    String(pendingAssistant.params.description) : null,
        // Use existing values from params if available
        concierge_name: typeof pendingAssistant.params === 'object' && 
                        pendingAssistant.params !== null &&
                        'conciergeName' in pendingAssistant.params ? 
                        String(pendingAssistant.params.conciergeName) : pendingAssistant.name,
        concierge_personality: typeof pendingAssistant.params === 'object' && 
                              pendingAssistant.params !== null &&
                              'conciergePersonality' in pendingAssistant.params ? 
                              String(pendingAssistant.params.conciergePersonality) : null,
        business_name: typeof pendingAssistant.params === 'object' && 
                      pendingAssistant.params !== null &&
                      'businessName' in pendingAssistant.params ? 
                      String(pendingAssistant.params.businessName) : null,
        share_phone_number: typeof pendingAssistant.params === 'object' && 
                           pendingAssistant.params !== null &&
                           'sharePhoneNumber' in pendingAssistant.params ? 
                           Boolean(pendingAssistant.params.sharePhoneNumber) : false,
        business_phone: typeof pendingAssistant.params === 'object' && 
                       pendingAssistant.params !== null &&
                       'phoneNumber' in pendingAssistant.params ? 
                       String(pendingAssistant.params.phoneNumber) : null
      },
      
      // Update subscription information
      subscription: {
        assistant_id: pendingAssistant.id,
        stripe_subscription_id: subscriptionId,
        plan: planType || 'personal',
        status: subscription.status,
        current_period_end: currentPeriodEndISO,
        current_period_start: currentPeriodStartISO,
        created_at: new Date().toISOString()
      },
      
      // Set usage limits based on plan
      usageLimits: {
        assistant_id: pendingAssistant.id,
        max_messages: planType === 'business' ? 2000 : 100,
        max_tokens: planType === 'business' ? 1000000 : 100000,
        max_documents: planType === 'business' ? 25 : 5,
        max_webpages: planType === 'business' ? 25 : 5
      }
    });
    
    // For backward compatibility, update the assistant record in the assistants table as before
    const assistantData = {
      pending: false, // Mark as no longer pending
      pinecone_name: pinecone_name,
      // Also keep updating the params for backward compatibility
      params: {
        ...(typeof pendingAssistant.params === 'object' && pendingAssistant.params !== null ? pendingAssistant.params : {}),
        is_active: true,
        pending: false,
        subscription: {
          stripeSubscriptionId: subscriptionId,
          status: subscription.status,
          plan: planType || 'personal',
          currentPeriodEnd: currentPeriodEndISO,
          createdAt: new Date().toISOString()
        }
      }
    };
    
    const { error: assistantError } = await supabase
      .from('assistants')
      .update(assistantData)
      .eq('id', pendingAssistant.id);
      
    if (assistantError) {
      console.error('Error updating assistant in database:', assistantError);
      throw assistantError;
    }
    
    return {
      success: true,
      assistantId: pendingAssistant.id,
      name: pendingAssistant.name
    };
  } catch (error) {
    console.error('Error in handleCheckoutSessionForAssistant:', error);
    throw error;
  }
}

// Helper function to safely convert UNIX timestamp to ISO string
const safeTimestampToISO = (timestamp: number | null | undefined): string => {
  if (!timestamp) return new Date().toISOString();
  
  try {
    // Stripe timestamps are in seconds, JS needs milliseconds
    const date = new Date(timestamp * 1000);
    return date.toISOString();
  } catch (error) {
    console.error('Error converting timestamp to ISO:', error);
    return new Date().toISOString();
  }
};

async function handleInvoicePaid(invoice: any, supabase: any) {
  const subscriptionId = invoice.subscription;
  
  if (!subscriptionId) return;
  
  // Update subscription in database with payment success
  const subscription = await stripe?.subscriptions.retrieve(subscriptionId);
  
  // Handle regular assistants
  if (subscription && subscription.metadata?.assistantId) {
    const assistantId = subscription.metadata.assistantId;
    
    // Update assistant record with new subscription status
    const { data: assistantData, error: fetchError } = await supabase
      .from('assistants')
      .select('*')
      .eq('id', assistantId)
      .single();
    
    if (fetchError || !assistantData) {
      console.error('Error fetching assistant:', fetchError);
      return;
    }
    
    // Update the subscription status in the assistant record
    await supabase
      .from('assistants')
      .update({
        params: {
          ...assistantData.params,
          subscription: {
            ...assistantData.params?.subscription,
            status: subscription.status,
            currentPeriodEnd: new Date((subscription as any).current_period_end * 1000).toISOString(),
            lastPaymentSuccess: new Date().toISOString()
          }
        }
      })
      .eq('id', assistantId);
  }
} // end handleInvoicePaid function

// Handle new subscription creation
async function handleSubscriptionCreated(subscription: any, supabase: any) {
  // Handle regular assistants
  if (subscription && subscription.metadata?.assistantId) {
    const assistantId = subscription.metadata.assistantId;
    
    // Get the assistant
    const { data: assistantData, error: fetchError } = await supabase
      .from('assistants')
      .select('*')
      .eq('id', assistantId)
      .single();
    
    if (fetchError || !assistantData) {
      console.error('Error fetching assistant:', fetchError);
      return;
    }

    // Check if this is an upgrade flow by looking at the metadata
    const isUpgrade = subscription.metadata.upgradeFlow === 'true';
    const previousSubscriptionId = subscription.metadata.previousSubscriptionId;
    
    // If this is an upgrade and there's a previous subscription, cancel it
    if (isUpgrade && previousSubscriptionId) {
      try {
        console.log(`This is a plan upgrade. Canceling previous subscription ${previousSubscriptionId}`);
        await stripe?.subscriptions.cancel(previousSubscriptionId, {
          prorate: false, // No refunds for upgrades
        });
        console.log(`Successfully canceled previous subscription ${previousSubscriptionId}`);
      } catch (cancelError) {
        console.error('Error canceling previous subscription during upgrade:', cancelError);
        // Continue with the upgrade process even if cancellation fails
      }
    }
    
    // Update the assistant with the new subscription data
    await supabase
      .from('assistants')
      .update({
        params: {
          ...assistantData.params,
          subscription: {
            ...assistantData.params?.subscription,
            stripeSubscriptionId: subscription.id,
            status: subscription.status,
            plan: isUpgrade ? 'business' : (assistantData.params?.subscription?.plan || 'personal'),
            currentPeriodEnd: new Date((subscription as any).current_period_end * 1000).toISOString(),
            createdAt: new Date().toISOString(),
            upgradedAt: isUpgrade ? new Date().toISOString() : undefined
          }
        }
      })
      .eq('id', assistantId);
  }
  
  // Handle pending assistants that might have been missed by checkout.session.completed
  if (subscription && subscription.metadata?.pendingAssistantId) {
    const pendingAssistantId = subscription.metadata.pendingAssistantId;
    const assistantId = subscription.metadata.assistantId;
    
    // Check if the pending assistant still exists (wasn't already processed)
    const { data: pendingAssistant, error: pendingError } = await supabase
      .from('assistants')
      .select('*')
      .eq('id', pendingAssistantId)
      .eq('pending',true)
      .single();
    
    if (pendingError || !pendingAssistant) {
      // Likely already processed by checkout.session.completed
      return;
    }
    
    try {
      // Generate unique Pinecone name
      const pinecone_name = generatePineconeName(pendingAssistant.name);
      console.log(`Generated Pinecone name: ${pinecone_name}`);
      
      // Create assistant in Pinecone
      const pinecone = getPineconeClient();
      if (!pinecone) {
        console.error('Pinecone client initialization failed');
        return;
      }
      
      // Create the assistant in Pinecone
      await pinecone.createAssistant({
        name: pinecone_name,
        instructions: pendingAssistant.params?.systemPrompt || 
            `You are a helpful AI assistant named ${pendingAssistant.name}.`,
        metadata: {
          owner: pendingAssistant.user_id,
          description: pendingAssistant.params?.description || 'No description provided',
          created_at: new Date().toISOString(),
          display_name: pendingAssistant.name
        },
      });
      
      // First check if there's already a placeholder assistant record
      const { data: existingAssistant } = await supabase
        .from('assistants')
        .select('*')
        .eq('id', assistantId)
        .single();

      if (existingAssistant) {
        // Update the existing placeholder assistant record with Pinecone info
        const { error: updateError } = await supabase
          .from('assistants')
          .update({
            pinecone_name: pinecone_name,
            params: {
              ...pendingAssistant.params,
              description: pendingAssistant.params?.description || 'No description provided',
              systemPrompt: pendingAssistant.params?.systemPrompt,
              is_active: true,
              pending: false,
              subscription: {
                stripeSubscriptionId: subscription.id,
                status: subscription.status,
                plan: pendingAssistant.params?.plan || 'personal',
                currentPeriodEnd: new Date((subscription as any).current_period_end * 1000).toISOString(),
                createdAt: new Date().toISOString()
              }
            },
            plan_id: pendingAssistant.plan_id
          })
          .eq('id', assistantId);
          
        if (updateError) {
          console.error('Error updating assistant record:', updateError);
          return;
        }
        
        console.log(`Successfully updated assistant ${assistantId} with Pinecone information`);
      } else {
        // If no placeholder exists, create a new assistant record
        const newAssistantId = assistantId || uuidv4();
        const newAssistantData = {
          id: newAssistantId,
          name: pendingAssistant.name,
          user_id: pendingAssistant.user_id,
          pinecone_name: pinecone_name,
          created_at: new Date().toISOString(),
          params: {
            ...pendingAssistant.params,
            is_active: true,
            pending: false,
            subscription: {
              stripeSubscriptionId: subscription.id,
              status: subscription.status,
              plan: pendingAssistant.params?.plan || 'personal',
              currentPeriodEnd: new Date((subscription as any).current_period_end * 1000).toISOString(),
              createdAt: new Date().toISOString()
            }
          },
          plan_id: pendingAssistant.plan_id
        };
        
        const { error: assistantError } = await supabase
          .from('assistants')
          .insert(newAssistantData);
          
        if (assistantError) {
          console.error('Error creating assistant in database:', assistantError);
          return;
        }
        
        console.log(`Successfully created new assistant ${newAssistantId} from pending assistant ${pendingAssistantId}`);
      }
      
      // Delete the pending assistant entry
      await supabase
        .from('assistants')
        .delete()
        .eq('pending',true)
        .eq('id', pendingAssistantId);
      
      console.log(`Successfully processed pending assistant ${pendingAssistantId} via subscription creation`);
    } catch (error) {
      console.error('Error creating assistant from pending assistant:', error);
    }
  }
}

// Handle subscription updates
async function handleSubscriptionUpdated(subscription: any, supabase: any) {
  try {
    // Find the assistant that uses this subscription
    const { data: assistantData, error: findError } = await supabase
      .from('assistant_subscriptions')
      .select('assistant_id')
      .eq('stripe_subscription_id', subscription.id)
      .single();
    
    if (findError || !assistantData) {
      // Try the old way with JSON params
      const { data: legacyData, error: legacyError } = await supabase
        .from('assistants')
        .select('id, params')
        .contains('params', { subscription: { stripeSubscriptionId: subscription.id } })
        .limit(1);
        
      if (legacyError || !legacyData || legacyData.length === 0) {
        console.error('Could not find assistant for subscription:', subscription.id);
        return {
          success: false,
          error: 'No assistant found for this subscription'
        };
      }
      
      const assistantId = legacyData[0].id;
      
      // Update in normalized table
      await updateAssistantData(assistantId, {
        subscription: {
          assistant_id: assistantId,
          stripe_subscription_id: subscription.id,
          plan: subscription.metadata?.plan_type || 'personal',
          status: subscription.status,
          current_period_end: safeTimestampToISO(subscription.current_period_end),
          current_period_start: safeTimestampToISO(subscription.current_period_start),
        }
      });
      
      // Update in legacy table too
      const { error: updateError } = await supabase
        .from('assistants')
        .update({
          params: {
            ...(typeof legacyData[0].params === 'object' ? legacyData[0].params : {}),
            subscription: {
              stripeSubscriptionId: subscription.id,
              status: subscription.status,
              plan: subscription.metadata?.plan_type || 'personal',
              currentPeriodEnd: safeTimestampToISO(subscription.current_period_end),
            }
          }
        })
        .eq('id', assistantId);
        
      if (updateError) {
        console.error('Error updating assistant subscription (legacy):', updateError);
        return {
          success: false,
          error: 'Failed to update assistant subscription (legacy)'
        };
      }
      
      return {
        success: true
      };
    }
    
    // For normalized tables, update the subscription
    const assistantId = assistantData.assistant_id;
    
    // Update in normalized table
    await updateAssistantData(assistantId, {
      subscription: {
        assistant_id: assistantId,
        stripe_subscription_id: subscription.id,
        plan: subscription.metadata?.plan_type || 'personal',
        status: subscription.status,
        current_period_end: safeTimestampToISO(subscription.current_period_end),
        current_period_start: safeTimestampToISO(subscription.current_period_start),
      }
    });
    
    return {
      success: true
    };
  } catch (error) {
    console.error('Error handling subscription update:', error);
    return {
      success: false,
      error: 'Failed to process subscription update'
    };
  }
}

// Handle subscription deletion (cancellation)
async function handleSubscriptionDeleted(subscription: any, supabase: any) {
  if (subscription && subscription.metadata?.assistantId) {
    const assistantId = subscription.metadata.assistantId;
    
    // Get the assistant
    const { data: assistantData, error: fetchError } = await supabase
      .from('assistants')
      .select('*')
      .eq('id', assistantId)
      .single();
    
    if (fetchError || !assistantData) {
      console.error('Error fetching assistant:', fetchError);
      return;
    }
    
    // Update the assistant with the canceled subscription data
    await supabase
      .from('assistants')
      .update({
        params: {
          ...assistantData.params,
          subscription: {
            ...assistantData.params?.subscription,
            status: 'canceled',
            canceledAt: new Date().toISOString()
          }
        }
      })
      .eq('id', assistantId);
  }
}

// Handle payment failures
async function handlePaymentFailed(paymentIntent: any, _supabase: any) {
  // Find the subscription associated with this payment intent
  // This would require additional querying or retrieving the invoice
  
  // For now, just log the failure
  console.log('Payment failed:', paymentIntent.id);
  
  // In a production system, you might want to:
  // 1. Notify the user
  // 2. Disable certain bot features until payment succeeds
  // 3. Try automatic retries
}