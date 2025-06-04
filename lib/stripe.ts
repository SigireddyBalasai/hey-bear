import Stripe from 'stripe';

// Only initialize Stripe on the server-side and when we have a valid key
const createStripeInstance = (): Stripe | null => {
  // Only run on server-side
  if (typeof window !== 'undefined') {
    return null;
  }

  const secretKey = process.env.STRIPE_SECRET_KEY;

  // Check if we have a valid secret key (not a placeholder)
  if (!secretKey || secretKey === 'your_stripe_secret_key' || secretKey.length < 10) {
    console.warn('Stripe secret key is not configured or is a placeholder value');
    return null;
  }

  return new Stripe(secretKey, {
    apiVersion: '2025-03-31.basil',
  });
};

export const stripe = createStripeInstance();

export const getStripeInstance = (): Stripe | null => {
  return stripe;
};

export const isSubscriptionActive = (
  subscription: { status?: string } | null | undefined
): boolean => {
  return subscription?.status === 'active' || subscription?.status === 'trialing';
};

// Re-export subscription plans from the client-safe module
export {
  SUBSCRIPTION_PLANS,
  formatPrice,
  getSubscriptionPlanDetails,
  getPlanLimits,
} from './subscription-plans';
