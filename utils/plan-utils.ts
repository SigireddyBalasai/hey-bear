/**
 * Utilities for plan-related functionality
 */

/**
 * Plan limits for different plan types
 */
export interface PlanLimits {
  phoneLimit: number;
  smsLimit: number;
}

/**
 * Get plan limits based on plan type
 * @param planType The plan type (free, pro, business, enterprise)
 * @returns Object with limits for the specified plan
 */
export const getPlanLimits = (planType: string = 'free'): PlanLimits => {
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

/**
 * Capitalize the first letter of a string
 * @param str String to capitalize
 * @returns Capitalized string
 */
export const capitalizeFirstLetter = (str: string): string => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};
