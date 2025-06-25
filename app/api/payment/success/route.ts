import type { NextRequest } from "next/server";

import type { SupabaseClient } from "@supabase/supabase-js";
import type Stripe from "stripe";

import { getStripeInstance } from "@/lib/stripe";
import { SUBSCRIPTION_PLANS } from "@/lib/subscription-plans";
import type {
  AssistantConfigData,
  WebhookPayload,
} from "@/types/payment.types";
import type { Database } from "@/lib/db.types";
import { createAssistantFromConfig } from "@/utils/payment/assistant-creation";
import { PaymentErrorHandler } from "@/utils/payment/error-responses";
import { createAssistantFromMetadata } from "@/utils/payment/legacy-flow";
import {
  fetchPaymentSession,
  updatePaymentSession,
} from "@/utils/payment/session-management";
import {
  parseClientReferenceId,
  validatePaymentSession,
  validateWebhookPayload,
} from "@/utils/payment/session-validation";
import { createClient } from "@/utils/supabase/server-admin";

// Handle POST requests with webhook payload from Stripe
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  let sessionId = "unknown";

  if (!request?.body || !request.headers) {
    return PaymentErrorHandler.invalidRequest();
  }

  try {
    const body = (await request.json()) as WebhookPayload;

    console.log("[PAYMENT SUCCESS] Received webhook payload:", body);

    // Validate webhook payload
    if (!validateWebhookPayload(body)) {
      console.error(
        "[PAYMENT SUCCESS] Invalid webhook payload - not a checkout session:",
        {
          hasData: Boolean(body.data),
          hasObject: Boolean(body.data?.object),
          objectType: body.data?.object?.object,
        },
      );
      const origin = request.headers.get("origin") ?? "http://localhost:3000";

      return PaymentErrorHandler.invalidWebhookPayload(origin);
    }

    const session = body.data.object as unknown as Stripe.Checkout.Session;

    sessionId = session.id;

    console.log("[PAYMENT SUCCESS] Processing Stripe session from webhook:", {
      sessionId: session.id,
      paymentStatus: session.payment_status,
      status: session.status,
      clientReferenceId: session.client_reference_id,
      hasMetadata: Boolean(session.metadata),
      metadataKeys: session.metadata ? Object.keys(session.metadata) : [],
      customerId: session.customer,
    });

    const origin = request.headers.get("origin") ?? "http://localhost:3000";

    return await processPaymentSuccess(session, origin, startTime);
  } catch (error) {
    console.error("[PAYMENT SUCCESS] Failed to parse webhook payload:", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      sessionId: sessionId ?? "unknown",
    });
    const origin = request.headers.get("origin") ?? "http://localhost:3000";

    return PaymentErrorHandler.invalidWebhookPayload(origin);
  }
}

// Process the payment success using only Stripe session data
async function processPaymentSuccess(
  session: Stripe.Checkout.Session,
  origin: string,
  startTime: number,
) {
  const sessionId = session.id;

  console.log("[PAYMENT SUCCESS] Processing session:", sessionId);

  try {
    console.log("[PAYMENT SUCCESS] Creating Supabase client...");
    const supabase: SupabaseClient<Database> = await createClient();

    // Validate the session is complete and paid
    const validation = validatePaymentSession(session);

    if (!validation.isValid) {
      console.error(
        "[PAYMENT SUCCESS] Session validation failed:",
        validation.errors,
      );

      return PaymentErrorHandler.paymentNotCompleted(
        origin,
        session.payment_status ?? "unknown",
        session.status ?? "unknown",
      );
    }

    console.log(
      "[PAYMENT SUCCESS] Session validation passed - payment completed successfully",
    );

    // Extract user ID from client_reference_id
    const clientRefId = session.client_reference_id;

    if (!clientRefId) {
      console.error(
        "[PAYMENT SUCCESS] No client_reference_id found in session:",
        {
          sessionId,
          hasMetadata: Boolean(session.metadata),
          customerId: session.customer,
        },
      );

      return PaymentErrorHandler.missingReference(origin);
    }

    console.log("[PAYMENT SUCCESS] Parsing client_reference_id:", clientRefId);

    let authUserId: string;
    let internalPaymentSessionId: string | null;

    try {
      const {
        authUserId: parsedUserId,
        internalPaymentSessionId: parsedSessionId,
      } = parseClientReferenceId(clientRefId);

      authUserId = parsedUserId;
      internalPaymentSessionId = parsedSessionId;
    } catch (error) {
      console.error("[PAYMENT SUCCESS] Invalid client_reference_id format:", {
        clientRefId,
        error: error instanceof Error ? error.message : String(error),
      });

      return PaymentErrorHandler.invalidReferenceFormat(origin);
    }

    console.log("[PAYMENT SUCCESS] Extracted from client_reference_id:", {
      authUserId,
      internalPaymentSessionId,
    });

    if (!internalPaymentSessionId) {
      console.warn(
        "[PAYMENT SUCCESS] internalPaymentSessionId is missing from client_reference_id. This is unexpected for the new flow.",
      );
    }

    // Use the auth user ID directly
    const resolvedApplicationUserId = authUserId;

    // Fetch Payment Session record
    let paymentSession;

    try {
      paymentSession = await fetchPaymentSession(
        supabase,
        internalPaymentSessionId,
        session.id,
      );
    } catch (error) {
      console.error(
        "[PAYMENT SUCCESS] Payment session not found, trying legacy flow:",
        {
          error: error instanceof Error ? error.message : String(error),
        },
      );

      // Try legacy flow as fallback
      try {
        const result = await createAssistantFromMetadata(
          session,
          sessionId,
          origin,
        );

        console.log("[PAYMENT SUCCESS] Legacy flow completed successfully:", {
          assistantId: result.assistantId,
          duration: Date.now() - startTime,
        });

        return PaymentErrorHandler.success(origin, result.assistantId, true);
      } catch (legacyError) {
        console.error("[PAYMENT SUCCESS] Legacy flow also failed:", {
          error:
            legacyError instanceof Error
              ? legacyError.message
              : String(legacyError),
        });

        return PaymentErrorHandler.paymentSessionNotFound(origin);
      }
    }

    console.log(
      `[PAYMENT SUCCESS] Fetched payment session (ID: ${paymentSession.id}), current user_id: ${paymentSession.user_id}, status: ${paymentSession.status}`,
    );

    // Update payment session
    try {
      await updatePaymentSession(
        supabase,
        paymentSession,
        session.id,
        resolvedApplicationUserId,
      );
    } catch (error) {
      console.error("[PAYMENT SUCCESS] Failed to update payment session:", {
        error: error instanceof Error ? error.message : String(error),
      });

      return PaymentErrorHandler.unexpectedError(origin);
    }

    // Verify we have a user ID
    if (!paymentSession.user_id && !resolvedApplicationUserId) {
      console.error(
        "[PAYMENT SUCCESS] CRITICAL: No user ID available after payment session update",
      );

      return PaymentErrorHandler.unexpectedError(origin);
    }

    // Get assistant configuration data
    const assistantConfigData =
      paymentSession.assistant_config_data as AssistantConfigData;

    if (!assistantConfigData) {
      console.error(
        "[PAYMENT SUCCESS] No assistant config data found in payment session",
      );

      return PaymentErrorHandler.unexpectedError(origin);
    }

    console.log(
      "[PAYMENT SUCCESS] Assistant config data from payment session:",
      assistantConfigData,
    );

    // Extract plan_id from subscription data
    let internalPlanId: string | undefined;

    console.log("[PAYMENT SUCCESS] Extracting plan_id from session data:", {
      sessionId: session.id,
      hasSubscription: Boolean(session.subscription),
      subscriptionId: session.subscription,
      amount: session.amount_total,
      currency: session.currency,
    });

    if (session.subscription) {
      try {
        const stripeClient = await getStripeInstance();

        if (!stripeClient) {
          console.error("[PAYMENT SUCCESS] Stripe client not available");

          return PaymentErrorHandler.unexpectedError(origin);
        }

        console.log(
          "[PAYMENT SUCCESS] Fetching subscription details from Stripe...",
        );

        const subscription = await stripeClient.subscriptions.retrieve(
          session.subscription as string,
          {
            expand: ["items.data.price.product"],
          },
        );

        console.log("[PAYMENT SUCCESS] Subscription retrieved:", {
          id: subscription.id,
          status: subscription.status,
          itemsCount: subscription.items.data.length,
        });

        if (subscription.items.data.length > 0) {
          const [subscriptionItem] = subscription.items.data;
          let productId: string | undefined;

          // Get product ID from subscription item
          if (
            typeof subscriptionItem.price.product === "object" &&
            subscriptionItem.price.product
          ) {
            productId = subscriptionItem.price.product.id;
          } else if (typeof subscriptionItem.price.product === "string") {
            productId = subscriptionItem.price.product;
          }

          console.log(
            "[PAYMENT SUCCESS] Product ID from subscription:",
            productId,
          );

          // Map Stripe product ID to internal plan ID
          if (productId === SUBSCRIPTION_PLANS.PERSONAL.stripeProductId) {
            internalPlanId = "personal";
            console.log("[PAYMENT SUCCESS] Matched PERSONAL plan");
          } else if (
            productId === SUBSCRIPTION_PLANS.BUSINESS.stripeProductId
          ) {
            internalPlanId = "business";
            console.log("[PAYMENT SUCCESS] Matched BUSINESS plan");
          } else {
            console.error(
              `[PAYMENT SUCCESS] Unknown Stripe product ID: ${productId}`,
            );

            return PaymentErrorHandler.unexpectedError(origin);
          }
        } else {
          console.error("[PAYMENT SUCCESS] No subscription items found");

          return PaymentErrorHandler.unexpectedError(origin);
        }
      } catch (error) {
        console.error("[PAYMENT SUCCESS] Error retrieving subscription:", {
          error: error instanceof Error ? error.message : String(error),
          subscriptionId: session.subscription,
        });

        return PaymentErrorHandler.unexpectedError(origin);
      }
    } else {
      console.error("[PAYMENT SUCCESS] No subscription ID found in session");

      return PaymentErrorHandler.unexpectedError(origin);
    }

    console.log("[PAYMENT SUCCESS] Using plan_id:", internalPlanId);

    // Create assistant
    try {
      const result = await createAssistantFromConfig(
        assistantConfigData,
        sessionId,
        paymentSession.id,
        internalPlanId,
        origin,
        resolvedApplicationUserId, // Pass the user ID
      );

      // After successful assistant creation, update the subscription with Stripe subscription ID
      if (session.subscription && result.assistantId) {
        try {
          const supabase = await createClient();
          const { error: updateError } = await supabase
            .from("assistant_subscriptions")
            .update({
              stripe_subscription_id: session.subscription as string,
              updated_at: new Date().toISOString(),
            })
            .eq("assistant_id", result.assistantId);

          if (updateError) {
            console.error(
              "[PAYMENT SUCCESS] Failed to update subscription with Stripe ID:",
              {
                error: updateError.message,
                assistantId: result.assistantId,
                subscriptionId: session.subscription,
              },
            );
          } else {
            console.log(
              "[PAYMENT SUCCESS] Successfully updated subscription with Stripe ID:",
              {
                assistantId: result.assistantId,
                subscriptionId: session.subscription,
              },
            );
          }
        } catch (updateSubError) {
          console.error(
            "[PAYMENT SUCCESS] Error updating subscription with Stripe ID:",
            {
              error:
                updateSubError instanceof Error
                  ? updateSubError.message
                  : String(updateSubError),
              assistantId: result.assistantId,
              subscriptionId: session.subscription,
            },
          );
        }
      }

      console.log("[PAYMENT SUCCESS] Assistant created successfully:", {
        assistantId: result.assistantId,
        pendingAssistantId: result.pendingAssistantId,
        sessionId,
        paymentSessionId: paymentSession.id,
        duration: Date.now() - startTime,
      });

      return PaymentErrorHandler.success(origin, result.assistantId);
    } catch (createError) {
      console.error("[PAYMENT SUCCESS] Error creating assistant:", {
        error:
          createError instanceof Error
            ? createError.message
            : String(createError),
        stack: createError instanceof Error ? createError.stack : undefined,
        sessionId,
        paymentSessionId: paymentSession.id,
      });

      if (
        createError instanceof Error &&
        createError.message.includes("creation failed")
      ) {
        return PaymentErrorHandler.assistantCreationFailed(origin);
      }

      return PaymentErrorHandler.assistantCreationError(origin);
    }
  } catch (error) {
    console.error("[PAYMENT SUCCESS] Unexpected error:", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      sessionId,
      duration: Date.now() - startTime,
    });

    return PaymentErrorHandler.unexpectedError(origin);
  } finally {
    console.log("[PAYMENT SUCCESS] Request completed:", {
      sessionId,
      duration: Date.now() - startTime,
      timestamp: new Date().toISOString(),
    });
  }
}
