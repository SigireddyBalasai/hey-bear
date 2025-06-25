import { AssistantRow } from "@/types/basics";
import { AssistantConfig } from "@/types/basics";

export type ConciergeFormData = Pick<AssistantRow, "name"> &
  Pick<
    AssistantConfig,
    | "description"
    | "personality"
    | "business_name"
    | "share_phone_number"
    | "business_phone"
    | "concierge_name"
  >;
