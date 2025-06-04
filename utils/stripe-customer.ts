import type { SupabaseClient } from '@supabase/supabase-js';
import type Stripe from 'stripe';

import type { Database } from '@/lib/db.types';
import { getStripeInstance } from '@/lib/stripe';

export interface StripeCustomerResult {
  success: boolean;
  customerId?: string;
  isNewCustomer?: boolean;
  error?: string;
}

export interface CustomerSyncResult {
  success: boolean;
  customerId?: string;
  error?: string;
}

/**
 * Creates or retrieves a Stripe customer for a user
 * This is the main function for customer management
 */
export async function getOrCreateStripeCustomer(
  supabase: SupabaseClient<Database>,
  userId: string,
  authUserId: string,
  email: string,
  fullName?: string
): Promise<StripeCustomerResult> {
  try {
    // Get user record
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (userError || !userData) {
      return {
        success: false,
        error: `User record not found: ${userError?.message || 'Unknown error'}`,
      };
    }

    const stripe = getStripeInstance();
    if (!stripe) {
      return {
        success: false,
        error: 'Stripe service not available',
      };
    }

    // Check if user already has a valid Stripe customer
    if (userData.stripe_customer_id) {
      const customerId = userData.stripe_customer_id as string;
      const isValid = await validateStripeCustomer(stripe, customerId);
      if (isValid) {
        return {
          success: true,
          customerId,
          isNewCustomer: false,
        };
      }
    }

    // Create new Stripe customer
    const createResult = await createStripeCustomer(stripe, {
      email,
      fullName: fullName || (userData.full_name as string | undefined) || undefined,
      company: (userData.company as string | undefined) ?? undefined,
      authUserId,
      supabaseUserId: userId,
    });

    if (!createResult.success || !createResult.customerId) {
      return createResult;
    }

    // Update user record with new customer ID
    const { error: updateError } = await supabase
      .from('users')
      .update({
        stripe_customer_id: createResult.customerId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (updateError) {
      console.error('Failed to update user with Stripe customer ID:', updateError);
      // Don't fail the operation, just log the error
    }

    return {
      success: true,
      customerId: createResult.customerId,
      isNewCustomer: true,
    };
  } catch (error) {
    console.error('Error in getOrCreateStripeCustomer:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
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
    supabaseUserId: string;
  }
): Promise<StripeCustomerResult> {
  try {
    const { email, fullName, company, authUserId, supabaseUserId } = params;

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
        supabaseUserId,
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
 * Syncs user data with Stripe customer
 * Updates customer information in Stripe based on user profile changes
 */
export async function syncUserWithStripeCustomer(
  supabase: SupabaseClient<Database>,
  userId: string,
  updates: {
    email?: string;
    fullName?: string;
    company?: string;
  }
): Promise<CustomerSyncResult> {
  try {
    // Get user record
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('stripe_customer_id')
      .eq('id', userId)
      .single();

    if (userError || !userData?.stripe_customer_id) {
      return {
        success: false,
        error: 'User or Stripe customer not found',
      };
    }

    const stripe = getStripeInstance();
    if (!stripe) {
      return {
        success: false,
        error: 'Stripe service not available',
      };
    }

    // At this point we know stripe_customer_id is not null
    const stripeCustomerId = userData.stripe_customer_id as string;

    // Prepare update data
    const updateData: Stripe.CustomerUpdateParams = {};

    if (updates.email) {
      updateData.email = updates.email;
    }

    if (updates.fullName || updates.company) {
      let name = updates.fullName || '';
      if (updates.company) {
        name = name ? `${name} (${updates.company})` : updates.company;
      }
      if (name) {
        updateData.name = name;
      }
    }

    // Update Stripe customer
    await stripe.customers.update(stripeCustomerId, updateData);

    return {
      success: true,
      customerId: stripeCustomerId,
    };
  } catch (error) {
    console.error('Error syncing user with Stripe customer:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Sync failed',
    };
  }
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
    const stripe = getStripeInstance();
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
