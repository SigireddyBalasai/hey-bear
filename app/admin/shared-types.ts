export interface UserUsageStats {
  id?: string;
  user_id?: string;
  users?: {
    full_name?: string | null;
    email?: string | null;
    created_at?: string | null;
    last_active?: string | null;
  };
  date?: string | null;
  message_count?: number;
  token_usage?: number;
  cost_estimate?: number;
  total_messages?: number;
  assistant_count?: number;
}
