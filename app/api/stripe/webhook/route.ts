import { headers } from 'next/headers';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';

import {
  handleCheckoutSessionCompleted,
  handleInvoicePaymentFailed,
  handleInvoicePaymentSucceeded,
  handleSubscriptionDeleted,
} from '@/utils/stripe/webhook-handlers';
import { createClient } from '@/utils/supabase/server-admin';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_dummy');
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || 'whsec_dummy';

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
    const supabase = await createClient();

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;

        if (session.object === 'checkout.session') {
          await handleCheckoutSessionCompleted(session, supabase);
        }
        break;
      }
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object;

        if (invoice.object === 'invoice') {
          await handleInvoicePaymentSucceeded(invoice, supabase);
        }
        break;
      }
      case 'invoice.payment_failed': {
        const invoice = event.data.object;

        if (invoice.object === 'invoice') {
          await handleInvoicePaymentFailed(invoice, supabase);
        }
        break;
      }
      case 'customer.subscription.deleted': {
        const subscription = event.data.object;

        if (subscription.object === 'subscription') {
          await handleSubscriptionDeleted(subscription, supabase);
        }
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
