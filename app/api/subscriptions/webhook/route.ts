import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { stripe } from '@/lib/stripe';
import { createServiceClient } from '@/utils/supabase/server-admin';

// This endpoint handles Stripe webhook events to sync subscription state with our database
export async function POST(req: NextRequest) {
  const body = await req.text();
  const headersInstance = await headers();
  const signature = headersInstance.get('stripe-signature') as string;

  let event;
  
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET || ''
    );
  } catch (error: any) {
    console.error(`Webhook signature verification failed: ${error.message}`);
    return NextResponse.json({ error: `Webhook Error: ${error.message}` }, { status: 400 });
  }

  // Get a server admin client
  const supabase = createServiceClient();
  
  try {
    // Handle the event
    switch (event.type) {
      case 'invoice.paid':
        await handleInvoicePaid(event.data.object, supabase);
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
        console.log(`Unhandled event type: ${event.type}`);
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

async function handleInvoicePaid(invoice: any, supabase: any) {
  const subscriptionId = invoice.subscription;
  
  if (!subscriptionId) return;
  
  // Update subscription in database with payment success
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  
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
  } // end if
} // end handleInvoicePaid function

// Handle new subscription creation
async function handleSubscriptionCreated(subscription: any, supabase: any) {
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
            currentPeriodEnd: new Date((subscription as any).current_period_end * 1000).toISOString(),
            createdAt: new Date().toISOString()
          }
        }
      })
      .eq('id', assistantId);
  }
}

// Handle subscription updates
async function handleSubscriptionUpdated(subscription: any, supabase: any) {
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
    
    // Update the assistant with the updated subscription data
    await supabase
      .from('assistants')
      .update({
        params: {
          ...assistantData.params,
          subscription: {
            ...assistantData.params?.subscription,
            status: subscription.status,
            currentPeriodEnd: new Date((subscription as any).current_period_end * 1000).toISOString(),
            updatedAt: new Date().toISOString()
          }
        }
      })
      .eq('id', assistantId);
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