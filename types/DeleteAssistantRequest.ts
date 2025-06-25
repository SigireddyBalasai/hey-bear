import type { AssistantRow, AssistantConfigRow } from "./basics";

export type DeleteAssistantRequest = Pick<AssistantRow, "id" | "name"> &
  Pick<AssistantConfigRow, "pinecone_name"> & {
    assistantId: string;
    assistantName?: string;
  };
