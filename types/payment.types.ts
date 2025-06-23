// This file contains types related to payment processing, Stripe, and subscriptions.
// Supabase generated types should be imported from `lib/db.types.ts` or `types/db.types.ts`.

import type Stripe from 'stripe';
import type { Database } from './db.types';

// Types for payment sessions
export type PaymentSessionRow = Database['public']['Tables']['payment_sessions']['Row'];
export type PaymentSessionInsert = Database['public']['Tables']['payment_sessions']['Insert'];
export type PaymentSessionUpdate = Database['public']['Tables']['payment_sessions']['Update'];

// Stripe specific types - often, Stripe's own types are used directly,
// but we can define specific structures if needed for our application logic.

export interface StripeCustomerResult {
  customerId?: string;
  error?: string;
}

// Example: if we have specific metadata or structures for Stripe webhooks
export interface StripeWebhookEvent<T = any> extends Stripe.Event {
  data: {
    object: T;
    previous_attributes?: Partial<T>;
  };
}

// Types related to assistant creation flow if it involves payment
export type AssistantMetadata = Pick<Database['public']['Tables']['assistants']['Row'], 'name'> &
  Pick<Database['public']['Tables']['assistant_configs']['Row'], 'description' | 'business_phone'>;

// Add other payment-related types and interfaces here as they are identified and moved.
