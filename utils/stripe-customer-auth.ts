import type { SupabaseClient } from '@supabase/supabase-js';
/**
 * Get or create a Stripe customer for a user, using auth.users user_metadata
 * @param supabase - Supabase client (must be admin client for user updates)
 * @param user - Authenticated user object from supabase.auth.getUser()
 * @returns Promise with success flag and customer ID
 */
import type { User } from '@supabase/supabase-js';
import type Stripe from 'stripe';

import type { Database } from '@/lib/db.types';
import { getStripeInstance } from '@/lib/stripe';

export interface StripeCustomerResult {
  success: boolean;
  customerId?: string;
  isNewCustomer?: boolean;
  error?: string;
}

export async function getOrCreateStripeCustomerFromAuth(
  supabase: SupabaseClient<Database>,
  user: User // auth.users object
): Promise<StripeCustomerResult> {
  try {
    const stripe = await getStripeInstance();
    if (!stripe) {
      return {
        success: false,
        error: 'Stripe service not available',
      };
    }

    // Check if user already has a valid Stripe customer ID in user_metadata
    const existingCustomerId = user.user_metadata?.stripe_customer_id as string;

    if (existingCustomerId) {
      const isValid = await validateStripeCustomer(stripe, existingCustomerId as string);
      if (isValid) {
        return {
          success: true,
          customerId: existingCustomerId,
          isNewCustomer: false,
        };
      }
    }

    // Create new Stripe customer
    const createResult = await createStripeCustomer(stripe, {
      email: user.email || '',
      fullName:
        (user.user_metadata?.full_name as string) || (user.user_metadata?.name as string) || null,
      company: (user.user_metadata?.company as string) || null,
      authUserId: user.id,
    });

    if (!createResult.success || !createResult.customerId) {
      return createResult;
    }

    // Update user_metadata with the new Stripe customer ID
    // Note: This requires admin client access
    const { error: updateError } = await supabase.auth.admin.updateUserById(user.id as string, {
      user_metadata: {
        ...user.user_metadata,
        stripe_customer_id: createResult.customerId,
      },
    });

    if (updateError) {
      console.error('Error updating user metadata with Stripe customer ID:', updateError);
      return {
        success: false,
        error: 'Failed to update user with Stripe customer ID',
      };
    }

    return {
      success: true,
      customerId: createResult.customerId,
      isNewCustomer: true,
    };
  } catch (error) {
    console.error('Error in getOrCreateStripeCustomerFromAuth:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get or create Stripe customer',
    };
  }
}

/**
 * Validates that a Stripe customer ID exists and is not deleted
 */
export async function validateStripeCustomer(stripe: Stripe, customerId: string): Promise<boolean> {
  try {
    const customer = await stripe.customers.retrieve(customerId);
    return customer && !customer.deleted;
  } catch (error) {
    console.warn(`Stripe customer ${customerId} validation failed:`, error);
    return false;
  }
}

/**
 * Creates a new Stripe customer
 */
export async function createStripeCustomer(
  stripe: Stripe,
  params: {
    email: string;
    fullName?: string | null;
    company?: string | null;
    authUserId: string;
  }
): Promise<StripeCustomerResult> {
  try {
    const { email, fullName, company, authUserId } = params;

    // Prepare customer name
    let customerName = fullName || email || 'User';
    if (company) {
      customerName = `${customerName} (${company})`;
    }

    const customerData: Stripe.CustomerCreateParams = {
      email,
      name: customerName,
      metadata: {
        authUserId,
        createdAt: new Date().toISOString(),
        source: 'hey-bear-app',
      },
    };

    const customer = await stripe.customers.create(customerData);

    return {
      success: true,
      customerId: customer.id,
      isNewCustomer: true,
    };
  } catch (error) {
    console.error('Error creating Stripe customer:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create customer',
    };
  }
}

/**
 * Get Stripe customer ID from user metadata
 */
export function getStripeCustomerIdFromUser(user: User): string | null {
  return (user.user_metadata?.stripe_customer_id as string) || null;
}

/**
 * Creates a customer session for Stripe pricing table
 */
export async function createCustomerSession(
  customerId: string,
  options?: {
    enablePricingTable?: boolean;
    enablePaymentElement?: boolean;
    successUrl?: string;
    cancelUrl?: string;
  }
): Promise<{ success: boolean; clientSecret?: string; error?: string }> {
  try {
    const stripe = await getStripeInstance();
    if (!stripe) {
      return {
        success: false,
        error: 'Stripe service not available',
      };
    }

    const components: Stripe.CustomerSessionCreateParams['components'] = {};

    if (options?.enablePricingTable !== false) {
      components.pricing_table = {
        enabled: true,
      };
    }

    if (options?.enablePaymentElement) {
      components.payment_element = { enabled: true };
    }

    const session = await stripe.customerSessions.create({
      customer: customerId,
      components,
    });

    if (!session.client_secret) {
      return {
        success: false,
        error: 'Customer session created but client_secret is missing',
      };
    }

    return {
      success: true,
      clientSecret: session.client_secret,
    };
  } catch (error) {
    console.error('Error creating customer session:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create session',
    };
  }
}
