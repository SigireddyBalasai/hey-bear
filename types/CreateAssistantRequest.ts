import type { AssistantRow, AssistantConfigRow } from "./basics";

export type CreateAssistantRequest = Pick<AssistantRow, "name"> &
  Pick<
    AssistantConfigRow,
    "description" | "concierge_name" | "business_name" | "business_phone"
  > & {
    plan?: string;
    stripeCheckoutSessionId?: string;
    paymentSessionId?: string;
  };
