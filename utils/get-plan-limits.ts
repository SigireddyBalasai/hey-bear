import type { PlanLimits } from '@/types/interaction.types';

/**
 * Get plan limits based on plan type
 * @param planType The plan type (free, pro, business, enterprise)
 * @returns Object with limits for the specified plan
 */
export const getPlanLimits = (planType = 'free'): PlanLimits => {
  switch (planType.toLowerCase()) {
    case 'pro':
      return {
        phoneLimit: 5,
        smsLimit: 1000,
      };
    case 'business':
      return {
        phoneLimit: 20,
        smsLimit: 5000,
      };
    case 'enterprise':
      return {
        phoneLimit: 100,
        smsLimit: 25000,
      };
    default: // free plan
      return {
        phoneLimit: 1,
        smsLimit: 100,
      };
  }
};
