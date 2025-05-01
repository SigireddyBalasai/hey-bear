import { BaseService, ServiceResponse, SupabaseClient } from '../base/base-service';
import { PhoneNumberRepository } from './phone-number-repository';
import { PhoneNumberResponse, PhoneNumbersResponse } from '../types/phone-number-types';

/**
 * Service for admin-level phone number operations
 */
export class PhoneNumberAdminService extends BaseService {
  private repository: PhoneNumberRepository;

  constructor(supabase: SupabaseClient) {
    super(supabase);
    this.repository = new PhoneNumberRepository(supabase);
  }

  /**
   * Check if a user is an admin
   */
  private async checkIsAdmin(userId: string): Promise<{isAdmin: boolean, error?: string}> {
    try {
      // Use type assertion to allow access to the profiles table
      const response = await this.supabase
        .from('profiles' as any)
        .select('is_admin')
        .eq('id', userId)
        .single();

      if (response.error) {
        return { isAdmin: false, error: `Error checking admin status: ${response.error.message}` };
      }

      // Type assertion to safely access the data
      const data = response.data as { is_admin?: boolean } | null;
      return { isAdmin: data?.is_admin || false };
    } catch (error) {
      return { 
        isAdmin: false, 
        error: `Error checking admin status: ${error instanceof Error ? error.message : String(error)}` 
      };
    }
  }

  /**
   * Verify the user has admin privileges
   */
  private async verifyAdminAccess(): Promise<{userId?: string, error?: string, status?: number}> {
    // First verify authentication
    const auth = await this.verifyAuthentication();
    if (auth.error) {
      return { error: auth.error, status: auth.status };
    }

    // Then check admin status
    const { isAdmin, error } = await this.checkIsAdmin(auth.user.id);
    if (error) {
      return { error, status: 500 };
    }

    if (!isAdmin) {
      return { error: 'Forbidden: Admin access required', status: 403 };
    }

    return { userId: auth.user.id };
  }

  /**
   * Get all phone numbers (admin only)
   */
  async getAllPhoneNumbers(): Promise<PhoneNumbersResponse> {
    try {
      // Verify admin access
      const admin = await this.verifyAdminAccess();
      if (admin.error) {
        return { 
          ...this.createErrorResponse(admin.error, admin.status || 401),
          phoneNumbers: [] 
        };
      }

      // Fetch all phone numbers
      const { data, error } = await this.repository.findAll('created_at', false);

      if (error) {
        return { 
          ...this.createErrorResponse(`Error fetching phone numbers: ${error.message}`, 500),
          phoneNumbers: [] 
        };
      }

      return { 
        ...this.createSuccessResponse(data, 'Phone numbers retrieved successfully'),
        phoneNumbers: data || [] 
      };
    } catch (error) {
      return {
        ...this.formatError(error, 'Error fetching phone numbers'),
        phoneNumbers: []
      };
    }
  }

  /**
   * Delete a phone number (admin only)
   */
  async deletePhoneNumber(params: { phoneNumber?: string; twilioSid?: string }): Promise<ServiceResponse> {
    try {
      // Verify admin access
      const admin = await this.verifyAdminAccess();
      if (admin.error) {
        return this.createErrorResponse(admin.error, admin.status || 401);
      }

      // Validate parameters
      if (!params.phoneNumber && !params.twilioSid) {
        return this.createErrorResponse('Missing required parameter: phoneNumber or twilioSid', 400);
      }

      // Delete the phone number
      const { error } = await this.repository.deletePhoneNumber(params);

      if (error) {
        return this.createErrorResponse(`Error deleting phone number: ${error.message}`, 500);
      }

      return this.createSuccessResponse(null, 'Phone number deleted successfully');
    } catch (error) {
      return this.formatError(error, 'Error deleting phone number');
    }
  }
  
  /**
   * Create a new phone number (admin only)
   */
  async createPhoneNumber(phoneNumberData: {
    phone_number: string;
    twilio_sid: string;
    is_assigned?: boolean;
    assistant_id?: string | null;
  }): Promise<PhoneNumberResponse> {
    try {
      // Verify admin access
      const admin = await this.verifyAdminAccess();
      if (admin.error) {
        return this.createErrorResponse(admin.error, admin.status || 401);
      }

      // Validate parameters
      if (!phoneNumberData.phone_number || !phoneNumberData.twilio_sid) {
        return this.createErrorResponse('Missing required parameter: phone_number or twilio_sid', 400);
      }
      
      // Set default values if not provided
      const dataToCreate = {
        ...phoneNumberData,
        is_assigned: phoneNumberData.is_assigned || false,
        assistant_id: phoneNumberData.assistant_id || null
      };

      // Create the phone number
      const { data, error } = await this.repository.create(dataToCreate);

      if (error) {
        return this.createErrorResponse(`Error creating phone number: ${error.message}`, 500);
      }

      return {
        ...this.createSuccessResponse(data, 'Phone number created successfully'),
        phoneNumber: data
      };
    } catch (error) {
      return this.formatError(error, 'Error creating phone number');
    }
  }
}