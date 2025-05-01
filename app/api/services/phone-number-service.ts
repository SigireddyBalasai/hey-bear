import { Database } from '@/lib/db.types';
import { createClient } from '@/utils/supabase/server';

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

/**
 * Service for managing phone number operations
 */
export class PhoneNumberService {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Get available phone numbers (not assigned to any assistant)
   */
  async getAvailablePhoneNumbers() {
    try {
      // Get user id from session
      const { data: { user } } = await this.supabase.auth.getUser();
      if (!user) {
        return { error: 'Unauthorized', status: 401, phoneNumbers: [] };
      }

      // Fetch available phone numbers
      const { data, error } = await this.supabase
        .from('phonenumbers')
        .select('*')
        .eq('is_assigned', false)
        .order('created_at', { ascending: false });

      if (error) {
        return { 
          error: `Error fetching available phone numbers: ${error.message}`, 
          status: 500,
          phoneNumbers: [] 
        };
      }

      return { 
        phoneNumbers: data || [], 
        status: 200,
        error: null
      };
    } catch (error) {
      return {
        error: `Error fetching available phone numbers: ${error instanceof Error ? error.message : String(error)}`,
        status: 500,
        phoneNumbers: []
      };
    }
  }

  /**
   * Assign a phone number to an assistant
   */
  async assignPhoneNumber(assistantId: string, phoneNumberId: number) {
    try {
      // Get user id from session
      const { data: { user } } = await this.supabase.auth.getUser();
      if (!user) {
        return { error: 'Unauthorized', status: 401 };
      }

      // Verify parameters
      if (!assistantId) {
        return { error: 'Missing required parameter: assistantId', status: 400 };
      }
      if (!phoneNumberId) {
        return { error: 'Missing required parameter: phoneNumberId', status: 400 };
      }

      // Update the phone number assignment
      const { data, error } = await this.supabase
        .from('phonenumbers')
        .update({
          is_assigned: true,
          assistant_id: assistantId
        })
        .eq('id', String(phoneNumberId));

      if (error) {
        return { 
          error: `Error assigning phone number: ${error.message}`, 
          status: 500 
        };
      }

      return { 
        message: 'Phone number assigned successfully',
        phoneNumber: data || null,
        status: 200,
        error: null
      };
    } catch (error) {
      return {
        error: `Error assigning phone number: ${error instanceof Error ? error.message : String(error)}`,
        status: 500
      };
    }
  }

  /**
   * Unassign a phone number from an assistant
   */
  async unassignPhoneNumber(phoneNumberId: number) {
    try {
      // Get user id from session
      const { data: { user } } = await this.supabase.auth.getUser();
      if (!user) {
        return { error: 'Unauthorized', status: 401 };
      }

      // Verify parameters
      if (!phoneNumberId) {
        return { error: 'Missing required parameter: phoneNumberId', status: 400 };
      }

      // Update the phone number assignment
      const { data, error } = await this.supabase
        .from('phonenumbers')
        .update({
          is_assigned: false,
          assistant_id: null
        })
        .eq('id', String(phoneNumberId));

      if (error) {
        return { 
          error: `Error unassigning phone number: ${error.message}`, 
          status: 500 
        };
      }

      return { 
        message: 'Phone number unassigned successfully',
        phoneNumber: data || null,
        status: 200,
        error: null
      };
    } catch (error) {
      return {
        error: `Error unassigning phone number: ${error instanceof Error ? error.message : String(error)}`,
        status: 500
      };
    }
  }
}