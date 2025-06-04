interface UserData {
  full_name?: string | null;
  email?: string | null;
  created_at?: string | null;
  last_active?: string | null;
}

export interface UserUsageStats {
  id?: string;
  user_id?: string;
  users?: UserData;
  date?: string | null;
  message_count?: number;
  token_usage?: number;
  cost_estimate?: number;
  total_messages?: number;
  assistant_count?: number;
}

// Add a default export to make it a proper module
export default UserUsageStats;
