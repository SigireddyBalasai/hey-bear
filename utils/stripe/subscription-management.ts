import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/db.types";

/**
 * Creates or updates assistant subscription in the database
 */
export async function createAssistantSubscription(
  supabase: SupabaseClient<Database>,
  assistantId: string,
  subscriptionId: string,
): Promise<boolean> {
  try {
    // Check if subscription already exists for this assistant
    const { data: existingSubscription, error: subscriptionError } =
      await supabase
        .from("assistant_subscriptions")
        .select("*")
        .eq("assistant_id", assistantId)
        .single();

    if (subscriptionError && subscriptionError.code !== "PGRST116") {
      console.error(
        "Error checking for existing subscription:",
        subscriptionError,
      );

      return false;
    }

    if (existingSubscription) {
      // Update existing subscription with Stripe subscription ID
      const { error: updateError } = await supabase
        .from("assistant_subscriptions")
        .update({
          stripe_subscription_id: subscriptionId,
          status: "active",
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingSubscription.id);

      if (updateError) {
        console.error(
          "Error updating assistant subscription with Stripe ID:",
          updateError,
        );

        return false;
      }

      console.log(
        "Successfully updated assistant subscription with Stripe ID for:",
        assistantId,
      );

      return true;
    }

    // Create new subscription
    const { error: createError } = await supabase
      .from("assistant_subscriptions")
      .insert({
        assistant_id: assistantId,
        stripe_subscription_id: subscriptionId,
        plan_id: "business", // Default plan or get from context
        status: "active",
      });

    if (createError) {
      console.error("Error creating assistant subscription:", createError);

      return false;
    }

    console.log(
      "Successfully created assistant subscription for:",
      assistantId,
    );

    return true;
  } catch (error) {
    console.error("Error in createAssistantSubscription:", error);

    return false;
  }
}

/**
 * Updates subscription status for invoice payment success
 */
export async function updateSubscriptionForPaymentSuccess(
  supabase: SupabaseClient<Database>,
  subscriptionId: string,
): Promise<boolean> {
  try {
    const { data: assistantSubscription, error: subscriptionError } =
      await supabase
        .from("assistant_subscriptions")
        .select("*")
        .eq("stripe_subscription_id", subscriptionId)
        .single();

    if (subscriptionError) {
      console.error(
        "Error finding assistant subscription for payment success:",
        subscriptionError,
      );

      return false;
    }

    if (!assistantSubscription) {
      console.log("No assistant subscription found for successful payment");

      return false;
    }

    // Update subscription status to active
    const { error: updateError } = await supabase
      .from("assistant_subscriptions")
      .update({
        status: "active",
        updated_at: new Date().toISOString(),
      })
      .eq("id", assistantSubscription.id);

    if (updateError) {
      console.error(
        "Error updating assistant subscription for successful payment:",
        updateError,
      );

      return false;
    }

    console.log(
      "Successfully updated assistant subscription for successful payment",
    );

    return true;
  } catch (error) {
    console.error("Error in updateSubscriptionForPaymentSuccess:", error);

    return false;
  }
}

/**
 * Updates subscription status for invoice payment failure
 */
export async function updateSubscriptionForPaymentFailure(
  supabase: SupabaseClient<Database>,
  subscriptionId: string,
): Promise<boolean> {
  try {
    const { data: assistantSubscription, error: subscriptionError } =
      await supabase
        .from("assistant_subscriptions")
        .select("*")
        .eq("stripe_subscription_id", subscriptionId)
        .single();

    if (subscriptionError) {
      console.error(
        "Error finding assistant subscription for payment failure:",
        subscriptionError,
      );

      return false;
    }

    if (!assistantSubscription) {
      console.log("No assistant subscription found for failed payment");

      return false;
    }

    // Update subscription status to past_due
    const { error: updateError } = await supabase
      .from("assistant_subscriptions")
      .update({
        status: "past_due",
        updated_at: new Date().toISOString(),
      })
      .eq("id", assistantSubscription.id);

    if (updateError) {
      console.error(
        "Error updating assistant subscription for failed payment:",
        updateError,
      );

      return false;
    }

    console.log(
      "Successfully updated assistant subscription for failed payment",
    );

    return true;
  } catch (error) {
    console.error("Error in updateSubscriptionForPaymentFailure:", error);

    return false;
  }
}

/**
 * Handles subscription deletion
 */
export async function handleSubscriptionDeletion(
  supabase: SupabaseClient<Database>,
  subscriptionId: string,
): Promise<boolean> {
  try {
    const { data: assistantSubscription, error: subscriptionError } =
      await supabase
        .from("assistant_subscriptions")
        .select("*")
        .eq("stripe_subscription_id", subscriptionId)
        .single();

    if (subscriptionError) {
      console.error(
        "Error finding assistant subscription for deletion:",
        subscriptionError,
      );

      return false;
    }

    if (!assistantSubscription) {
      console.log("No assistant subscription found for deletion");

      return false;
    }

    // Update subscription status to cancelled and clear stripe subscription ID
    const { error: updateError } = await supabase
      .from("assistant_subscriptions")
      .update({
        status: "canceled",
        stripe_subscription_id: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", assistantSubscription.id);

    if (updateError) {
      console.error(
        "Error updating assistant subscription for deletion:",
        updateError,
      );

      return false;
    }

    console.log("Successfully updated assistant subscription for deletion");

    return true;
  } catch (error) {
    console.error("Error in handleSubscriptionDeletion:", error);

    return false;
  }
}
