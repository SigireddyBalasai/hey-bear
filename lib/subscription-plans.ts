// Subscription plans configuration - safe for client-side use
export const SUBSCRIPTION_PLANS = {
  PERSONAL: {
    id: 'personal',
    stripeProductId: 'prod_SACbde4CkKIpX6', // Added Stripe Product ID
    limits: {
      maxMessages: 1000,
      maxTokens: 50000,
      maxDocuments: 10,
      maxWebpages: 5,
      maxPhoneNumbers: 1,
      maxSmsMessages: 100,
    },
  },
  BUSINESS: {
    id: 'business',
    stripeProductId: 'prod_SACZFYC14Veixw', // Added Stripe Product ID
    limits: {
      maxMessages: 10000,
      maxTokens: 500000,
      maxDocuments: 100,
      maxWebpages: 50,
      maxPhoneNumbers: 5,
      maxSmsMessages: 1000,
    },
  },
} as const;

// Helper function to format price
export const formatPrice = (price: number): string =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(price);

// Helper function to get subscription plan details
export const getSubscriptionPlanDetails = (planId: string) => {
  if (!planId) return null;

  switch (planId.toLowerCase()) {
    case 'personal':
      return SUBSCRIPTION_PLANS.PERSONAL;
    case 'business':
      return SUBSCRIPTION_PLANS.BUSINESS;
    default:
      return null;
  }
};

// Helper function to get plan limits
export const getPlanLimits = (planType: string) => {
  const plan = getSubscriptionPlanDetails(planType);

  return plan ? plan.limits : SUBSCRIPTION_PLANS.PERSONAL.limits; // Default to personal limits
};

// Helper function to get plan by Stripe Product ID
export const getPlanByStripeProductId = (stripeId: string) => {
  if (!stripeId) return null;

  const plans = Object.values(SUBSCRIPTION_PLANS);

  for (const plan of plans) {
    if (plan.stripeProductId === stripeId) {
      return plan;
    }
  }

  return null; // Or undefined, as per original requirement
};
