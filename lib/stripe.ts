import Stripe from 'stripe';

// Check if we're on the client side
const isClient = typeof window !== 'undefined';

// Server-side Stripe instance (for API routes)
let stripe: Stripe | undefined;
if (!isClient) {
  // Only initialize on the server
  stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
    apiVersion: '2025-03-31.basil',
  });
}

// Export server-side Stripe in a way that it's not bundled for client
export { stripe };

// Client-side Stripe instance and utilities
let stripePromise: Promise<Stripe | null>;

// Get the Stripe publishable key for client-side usage
export const getStripePublishableKey = (): string => {
  return process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '';
};

// Initialize Stripe on the client side
export const getStripe = (): Promise<Stripe | null> => {
  if (!stripePromise) {
    const publishableKey = getStripePublishableKey();
    
    if (!publishableKey) {
      console.error('Stripe publishable key is missing');
      return Promise.resolve(null);
    }
    
    stripePromise = Promise.resolve(
      new Stripe(publishableKey, {
        apiVersion: '2025-03-31.basil',
      })
    );
  }
  return stripePromise;
};

// Define subscription plans using NEXT_PUBLIC_ environment variables for client access
export const SUBSCRIPTION_PLANS = {
  PERSONAL: {
    name: 'Personal',
    id: process.env.NEXT_PUBLIC_STRIPE_PERSONAL_PLAN_ID || process.env.STRIPE_PERSONAL_PLAN_ID,
    price: 13.99,
    features: [
      'Document upload',
      'Webpage referencing & crawling',
      'Interaction analytics',
      'Email support',
      'Dedicated local phone number',
      'SMS capabilities',
      'Simple interface, easy management',
      '300 messages/month (sent and received)',
      '5 documents',
      '5 webpages crawled'
    ],
    description: 'Perfect for individuals'
  },
  BUSINESS: {
    name: 'Business',
    id: process.env.NEXT_PUBLIC_STRIPE_BUSINESS_PLAN_ID || process.env.STRIPE_BUSINESS_PLAN_ID,
    price: 34.99,
    features: [
      'Document upload',
      'Webpage referencing & crawling',
      'Interaction analytics',
      'Priority email support',
      'Dedicated local phone number',
      'SMS capabilities',
      'Webhook access',
      'Simple interface, easy management',
      '2,000 messages/month (sent and received)',
      '25 documents',
      '25 webpages crawled'
    ],
    description: 'For small to medium-sized businesses'
  }
};

// Helper function to get formatted price with currency symbol
export function formatPrice(price: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency', 
    currency: 'USD'
  }).format(price);
}

// Helper function to check if a subscription is active
export const isSubscriptionActive = (subscription: any): boolean => {
  if (!subscription) return false;
  return subscription.status === 'active' || subscription.status === 'trialing';
};

// Helper function to get the subscription plan details
export const getSubscriptionPlanDetails = (planId: string | undefined) => {
  if (planId === SUBSCRIPTION_PLANS.PERSONAL.id) return SUBSCRIPTION_PLANS.PERSONAL;
  if (planId === SUBSCRIPTION_PLANS.BUSINESS.id) return SUBSCRIPTION_PLANS.BUSINESS;
  return null;
};