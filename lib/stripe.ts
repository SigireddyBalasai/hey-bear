import Stripe from 'stripe';

// Initialize Stripe client
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-03-31.basil', // Use the latest API version
});

// Define subscription plans
export const SUBSCRIPTION_PLANS = {
  PERSONAL: {
    name: 'Personal',
    id: process.env.STRIPE_PERSONAL_PLAN_ID,
    price: 13.99,
    features: [
      'Basic chat capabilities',
      'Document upload',
      'Basic analytics',
      'Email support'
    ],
    description: 'Perfect for personal use and individual projects'
  },
  BUSINESS: {
    name: 'Business',
    id: process.env.STRIPE_BUSINESS_PLAN_ID,
    price: 34.99,
    features: [
      'Advanced chat capabilities',
      'Unlimited document upload',
      'Detailed analytics',
      'Priority support',
      'SMS capabilities',
      'API access'
    ],
    description: 'For professionals and businesses who need more capabilities'
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