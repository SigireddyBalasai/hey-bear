import { createClient } from '@/utils/supabase/client';
import { toast } from 'sonner';
import { Tables } from '@/lib/db.types';

/**
 * Fetch all available phone numbers from the pool
 */
export async function fetchAvailablePhoneNumbers() {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('phonenumbers')
      .select('*')
      .eq('is_assigned', false);
      
    if (error) throw error;
    return data as Tables<'phonenumbers'>[];
  } catch (error) {
    console.error('Error fetching available phone numbers:', error);
    toast.error('Failed to load available phone numbers');
    return [];
  }
}

/**
 * Fetch all assigned phone numbers with their associated assistants
 */
export async function fetchAssignedPhoneNumbers() {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('assistants')
      .select(`
        id,
        name,
        assigned_phone_number,
        params,
        user_id,
        users:user_id (
          auth_user_id,
          id
        )
      `)
      .not('assigned_phone_number', 'is', null);
      
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching assigned phone numbers:', error);
    toast.error('Failed to load assigned phone numbers');
    return [];
  }
}

/**
 * Add a new phone number to the pool
 */
export async function addPhoneNumber(phoneNumber: string) {
  try {
    const supabase = createClient();
    
    // Validate phone number format
    const phoneRegex = /^\+[1-9]\d{1,14}$/; // E.164 format
    if (!phoneRegex.test(phoneNumber)) {
      toast.error('Phone number must be in E.164 format (e.g., +12345678901)');
      return false;
    }
    
    // Check if phone number already exists
    const { data: existingNumber } = await supabase
      .from('phonenumbers')
      .select('id')
      .eq('number', phoneNumber)
      .single();
    
    if (existingNumber) {
      toast.error('This phone number already exists in the system');
      return false;
    }
    
    // Insert the new phone number
    const { error } = await supabase
      .from('phonenumbers')
      .insert({
        number: phoneNumber,
        is_assigned: false,
        created_at: new Date().toISOString()
      });
    
    if (error) {
      console.error('Error adding phone number:', error);
      throw error;
    }
    
    // Add to the phone number pool as well
    const { data: userData } = await supabase.auth.getUser();
    
    if (!userData.user?.id) {
      throw new Error('User not authenticated');
    }
    
    const { data: adminData } = await supabase
      .from('users')
      .select('id')
      .eq('auth_user_id', userData.user.id)
      .single();
    
    // Get the inserted phone number ID
    const { data: insertedPhone } = await supabase
      .from('phonenumbers')
      .select('id')
      .eq('number', phoneNumber)
      .single();
    
    if (insertedPhone) {
      await supabase
        .from('phonenumberpool')
        .insert({
          phone_number_id: insertedPhone.id,
          added_by_admin: adminData?.id,
          added_at: new Date().toISOString()
        });
    }
    
    toast.success('Phone number added successfully');
    return true;
  } catch (error) {
    console.error('Failed to add phone number:', error);
    toast.error('Failed to add phone number');
    return false;
  }
}

/**
 * Assign a phone number to an assistant
 */
export async function assignPhoneNumber(phoneNumberId: string, assistantId: string) {
  try {
    const supabase = createClient();
    
    // Update phone number record
    const { error: updateError } = await supabase
      .from('phonenumbers')
      .update({ is_assigned: true })
      .eq('id', phoneNumberId);
    
    if (updateError) {
      console.error('Error updating phone number:', updateError);
      throw updateError;
    }
    
    // Get phone number value
    const { data: phoneData } = await supabase
      .from('phonenumbers')
      .select('number')
      .eq('id', phoneNumberId)
      .single();
    
    if (!phoneData) {
      toast.error('Phone number not found');
      return false;
    }
    
    // Update assistant record
    const { error: assistantError } = await supabase
      .from('assistants')
      .update({ assigned_phone_number: phoneData.number })
      .eq('id', assistantId);
    
    if (assistantError) {
      console.error('Error updating concierge:', assistantError);
      
      // Rollback phone number assignment
      await supabase
        .from('phonenumbers')
        .update({ is_assigned: false })
        .eq('id', phoneNumberId);
      
      throw assistantError;
    }
    
    toast.success('Phone number assigned successfully');
    return true;
  } catch (error) {
    console.error('Failed to assign phone number:', error);
    toast.error('Failed to assign phone number');
    return false;
  }
}

/**
 * Unassign a phone number from an assistant
 */
export async function unassignPhoneNumber(phoneNumber: string) {
  try {
    const supabase = createClient();
    
    // Find the phone number record
    const { data: phoneData, error: phoneError } = await supabase
      .from('phonenumbers')
      .select('id')
      .eq('number', phoneNumber)
      .single();
    
    if (phoneError || !phoneData) {
      console.error('Error finding phone number:', phoneError);
      toast.error('Phone number not found');
      return false;
    }
    
    // Update the phone number record
    const { error: updateError } = await supabase
      .from('phonenumbers')
      .update({ is_assigned: false })
      .eq('id', phoneData.id);
    
    if (updateError) {
      console.error('Error updating phone number:', updateError);
      throw updateError;
    }
    
    // Find assistants using this phone number
    const { data: assistants, error: assistantError } = await supabase
      .from('assistants')
      .select('id')
      .eq('assigned_phone_number', phoneNumber);
    
    if (assistantError) {
      console.error('Error finding assistants:', assistantError);
      throw assistantError;
    }
    
    // Clear assigned phone number from assistants
    if (assistants && assistants.length > 0) {
      const { error: clearError } = await supabase
        .from('assistants')
        .update({ assigned_phone_number: null })
        .eq('assigned_phone_number', phoneNumber);
      
      if (clearError) {
        console.error('Error clearing phone number from assistants:', clearError);
        throw clearError;
      }
    }
    
    toast.success('Phone number unassigned successfully');
    return true;
  } catch (error) {
    console.error('Failed to unassign phone number:', error);
    toast.error('Failed to unassign phone number');
    return false;
  }
}

/**
 * Delete a phone number from the system
 * Only allows deletion of unassigned numbers
 */
export async function deletePhoneNumber(phoneNumberId: string) {
  try {
    const supabase = createClient();
    
    // Check if phone number is assigned
    const { data: phoneData, error: phoneError } = await supabase
      .from('phonenumbers')
      .select('is_assigned')
      .eq('id', phoneNumberId)
      .single();
    
    if (phoneError || !phoneData) {
      console.error('Error finding phone number:', phoneError);
      toast.error('Phone number not found');
      return false;
    }
    
    if (phoneData.is_assigned) {
      toast.error('Cannot delete an assigned phone number. Unassign it first.');
      return false;
    }
    
    // Remove from phone number pool first
    const { error: poolError } = await supabase
      .from('phonenumberpool')
      .delete()
      .eq('phone_number_id', phoneNumberId);
    
    if (poolError) {
      console.error('Error removing phone number from pool:', poolError);
    }
    
    // Delete the phone number
    const { error: deleteError } = await supabase
      .from('phonenumbers')
      .delete()
      .eq('id', phoneNumberId);
    
    if (deleteError) {
      console.error('Error deleting phone number:', deleteError);
      throw deleteError;
    }
    
    toast.success('Phone number deleted successfully');
    return true;
  } catch (error) {
    console.error('Failed to delete phone number:', error);
    toast.error('Failed to delete phone number');
    return false;
  }
}

/**
 * Fetch assistants that don't have a phone number assigned
 */
export async function fetchAssistantsWithoutPhoneNumbers() {
  try {
    const supabase = createClient();
    
    // Get assistants without an assigned phone number
    const { data, error } = await supabase
      .from('assistants')
      .select(`
        id,
        name,
        user_id,
        users (
          id,
          auth_user_id
        )
      `)
      .is('assigned_phone_number', null)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching assistants:', error);
      throw error;
    }
    
    // Enrich with user details
    const enrichedData = await Promise.all((data || []).map(async (assistant) => {
      if (assistant.users && assistant.users.auth_user_id) {
        try {
          const { data: userData } = await supabase.auth.admin.getUserById(
            assistant.users.auth_user_id
          );
          
          return {
            ...assistant,
            owner: userData?.user?.email || 'Unknown',
            owner_name: userData?.user?.user_metadata?.full_name || 'Unknown'
          };
        } catch (e) {
          console.error('Error fetching user data:', e);
        }
      }
      return assistant;
    }));
    
    return enrichedData || [];
  } catch (error) {
    console.error('Failed to fetch assistants:', error);
    toast.error('Failed to load assistants');
    return [];
  }
}
