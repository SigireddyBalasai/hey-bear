import { AssistantRow, AssistantConfigRow } from "./basics";

export interface CreateAssistantDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  formData: Pick<AssistantRow, "name"> &
    Pick<
      AssistantConfigRow,
      | "description"
      | "personality"
      | "business_name"
      | "share_phone_number"
      | "business_phone"
      | "concierge_name"
    >;
  onInputChange: (field: string, value: string | boolean) => void;
}
