import type { Database } from "@/lib/db.types";

export type PaymentSessionData =
  Database["public"]["Tables"]["payment_sessions"]["Row"] & {
    sessionId: string;
    userId: string;
    stripeCustomerId: string;
    assistantName: string;
    businessName: string;
    displayName: string;
    assistantDescription: string; // from assistant_config_data JSON
    conciergeName: string; // from assistant_config_data JSON
    businessPhone: string; // from assistant_config_data JSON
    personality: string; // from assistant_config_data JSON
    sharePhoneNumber: boolean; // from assistant_config_data JSON
  };

export type AssistantConfigData = Pick<
  Database["public"]["Tables"]["assistant_configs"]["Row"],
  | "display_name"
  | "business_name"
  | "description"
  | "concierge_name"
  | "business_phone"
>;

export interface WebhookPayload {
  type: string;
  data: {
    object: {
      id: string;
      customer: string;
      metadata: Record<string, string | number | boolean | null>;
      object?: string;
    };
  };
}
