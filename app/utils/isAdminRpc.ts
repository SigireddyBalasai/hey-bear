import { createClient } from "@/utils/supabase/client";

/**
 * Calls the Supabase RPC function to check if the current user is admin.
 * Returns true if admin, false otherwise.
 */
export async function isAdminRpc(): Promise<boolean> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("is_admin");
  if (error) {
    console.error("Error calling is_admin RPC:", error);
    return false;
  }
  return !!data;
}
