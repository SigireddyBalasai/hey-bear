import { SupabaseClient } from "@supabase/supabase-js";
import { isAdminRpc } from "@/app/utils/isAdminRpc";

export async function checkIsAdmin() {
  try {
    const isAdmin = await isAdminRpc();
    return { isAdmin, error: null };
  } catch (error) {
    console.error("Exception in checkIsAdmin:", error);
    return { isAdmin: false, error };
  }
}
