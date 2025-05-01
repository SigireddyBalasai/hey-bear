import { BaseService, ServiceResponse, SupabaseClient } from '../base/base-service';
import { PhoneNumberRepository } from './phone-number-repository';
import { 
  PhoneNumbersResponse, 
  PhoneNumberResponse,
  AssignPhoneNumberParams,
  UnassignPhoneNumberParams 
} from '../types/phone-number-types';

/**
 * Service for managing phone number operations
 */
export class PhoneNumberService extends BaseService {
  private repository: PhoneNumberRepository;

  constructor(supabase: SupabaseClient) {
    super(supabase);
    this.repository = new PhoneNumberRepository(supabase);
  }

  /**
   * Get available phone numbers (not assigned to any assistant)
   */
  async getAvailablePhoneNumbers(): Promise<PhoneNumbersResponse> {
    try {
      // Verify authentication
      const auth = await this.verifyAuthentication();
      if (auth.error) {
        return { 
          ...this.createErrorResponse(auth.error, auth.status || 401),
          phoneNumbers: [] 
        };
      }

      // Fetch available phone numbers
      const { data, error } = await this.repository.getAvailablePhoneNumbers();

      if (error) {
        return { 
          ...this.createErrorResponse(`Error fetching available phone numbers: ${error.message}`, 500),
          phoneNumbers: [] 
        };
      }

      return { 
        ...this.createSuccessResponse(data, 'Available phone numbers retrieved successfully'),
        phoneNumbers: data || [] 
      };
    } catch (error) {
      return {
        ...this.formatError(error, 'Error fetching available phone numbers'),
        phoneNumbers: []
      };
    }
  }

  /**
   * Get all phone numbers
   */
  async getAllPhoneNumbers(): Promise<PhoneNumbersResponse> {
    try {
      // Verify authentication
      const auth = await this.verifyAuthentication();
      if (auth.error) {
        return { 
          ...this.createErrorResponse(auth.error, auth.status || 401),
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
   * Assign a phone number to an assistant
   */
  async assignPhoneNumber(params: AssignPhoneNumberParams): Promise<PhoneNumberResponse> {
    try {
      const { assistantId, phoneNumberId } = params;

      // Verify authentication
      const auth = await this.verifyAuthentication();
      if (auth.error) {
        return this.createErrorResponse(auth.error, auth.status || 401);
      }

      // Validate parameters
      if (!assistantId) {
        return this.createErrorResponse('Missing required parameter: assistantId', 400);
      }
      if (!phoneNumberId) {
        return this.createErrorResponse('Missing required parameter: phoneNumberId', 400);
      }

      // Update the phone number assignment
      const { data, error } = await this.repository.updatePhoneNumberAssignment(
        phoneNumberId, 
        true, 
        assistantId
      );

      if (error) {
        return this.createErrorResponse(`Error assigning phone number: ${error.message}`, 500);
      }

      return { 
        ...this.createSuccessResponse(data, 'Phone number assigned successfully'),
        phoneNumber: data || null
      };
    } catch (error) {
      return this.formatError(error, 'Error assigning phone number');
    }
  }

  /**
   * Unassign a phone number from an assistant
   */
  async unassignPhoneNumber(params: UnassignPhoneNumberParams): Promise<PhoneNumberResponse> {
    try {
      const { phoneNumberId } = params;

      // Verify authentication
      const auth = await this.verifyAuthentication();
      if (auth.error) {
        return this.createErrorResponse(auth.error, auth.status || 401);
      }

      // Verify parameters
      if (!phoneNumberId) {
        return this.createErrorResponse('Missing required parameter: phoneNumberId', 400);
      }

      // Update the phone number assignment
      const { data, error } = await this.repository.updatePhoneNumberAssignment(
        phoneNumberId, 
        false, 
        null
      );

      if (error) {
        return this.createErrorResponse(`Error unassigning phone number: ${error.message}`, 500);
      }

      return { 
        ...this.createSuccessResponse(data, 'Phone number unassigned successfully'),
        phoneNumber: data || null
      };
    } catch (error) {
      return this.formatError(error, 'Error unassigning phone number');
    }
  }

  /**
   * Get a phone number by ID
   */
  async getPhoneNumberById(id: number): Promise<PhoneNumberResponse> {
    try {
      // Verify authentication
      const auth = await this.verifyAuthentication();
      if (auth.error) {
        return this.createErrorResponse(auth.error, auth.status || 401);
      }

      // Validate parameters
      if (!id) {
        return this.createErrorResponse('Missing required parameter: id', 400);
      }

      // Fetch phone number by ID
      const { data, error } = await this.repository.findById(id);

      if (error) {
        return this.createErrorResponse(`Error fetching phone number: ${error.message}`, 500);
      }

      return { 
        ...this.createSuccessResponse(data, 'Phone number retrieved successfully'),
        phoneNumber: data || null
      };
    } catch (error) {
      return this.formatError(error, 'Error fetching phone number');
    }
  }
  
  /**
   * Get phone numbers assigned to an assistant
   */
  async getAssistantPhoneNumbers(assistantId: string): Promise<PhoneNumbersResponse> {
    try {
      // Verify authentication
      const auth = await this.verifyAuthentication();
      if (auth.error) {
        return { 
          ...this.createErrorResponse(auth.error, auth.status || 401),
          phoneNumbers: [] 
        };
      }

      // Validate parameters
      if (!assistantId) {
        return { 
          ...this.createErrorResponse('Missing required parameter: assistantId', 400),
          phoneNumbers: [] 
        };
      }

      // Fetch phone numbers for the assistant
      const { data, error } = await this.repository.getPhoneNumbersByAssistantId(assistantId);

      if (error) {
        return { 
          ...this.createErrorResponse(`Error fetching assistant phone numbers: ${error.message}`, 500),
          phoneNumbers: [] 
        };
      }

      return { 
        ...this.createSuccessResponse(data, 'Assistant phone numbers retrieved successfully'),
        phoneNumbers: data || [] 
      };
    } catch (error) {
      return {
        ...this.formatError(error, 'Error fetching assistant phone numbers'),
        phoneNumbers: []
      };
    }
  }
}