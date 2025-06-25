import { createClient } from "@/utils/supabase/server";
import { getStripeInstance } from "@/lib/stripe";
import { Tables } from "@/lib/db.types";

interface SubscriptionResult {
  isActive: boolean;
  status?: string;
  plan?: string;
  error?: string;
}

type AssistantDetailView = Tables<"assistant_detail_view">;

/**
 * Check if the given assistant has an active subscription
 */
export async function checkAssistantSubscription(
  assistantId: string,
): Promise<SubscriptionResult> {
  try {
    const supabase = await createClient();

    // Fetch assistant details
    const { data, error } = await supabase
      .from("assistant_detail_view")
      .select("*")
      .eq("id", assistantId)
      .single<AssistantDetailView>();

    if (error || !data) {
      console.error("Error fetching assistant:", error);
      return { isActive: false, error: "Assistant not found" };
    }

    if (!data.stripe_subscription_id) {
      return {
        isActive: false,
        error: "No subscription found for this assistant",
      };
    }

    // Fetch subscription from Stripe
    const stripe = await getStripeInstance();
    const subscription = await stripe?.subscriptions.retrieve(
      data.stripe_subscription_id,
    );

    if (!subscription) {
      return { isActive: false, error: "Subscription not found" };
    }

    const isActive =
      subscription.status === "active" || subscription.status === "trialing";
    const plan = subscription.items.data[0]?.plan?.id;

    return {
      isActive,
      status: subscription.status,
      plan,
    };
  } catch (err) {
    console.error("Error checking subscription:", err);
    return { isActive: false, error: "Internal server error" };
  }
}
