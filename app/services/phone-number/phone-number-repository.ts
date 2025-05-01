import { BaseRepository } from '../base/base-repository';
import { SupabaseClient } from '../base/base-service';
import { PhoneNumber } from '../types/phone-number-types';

/**
 * Repository class for phone number data operations
 */
export class PhoneNumberRepository extends BaseRepository<PhoneNumber> {
  constructor(supabase: SupabaseClient) {
    super(supabase, 'phonenumbers');
  }

  /**
   * Get available unassigned phone numbers
   */
  async getAvailablePhoneNumbers(): Promise<{data?: PhoneNumber[], error?: any}> {
    // Use the same pattern as in BaseRepository for handling response types
    const response = await this.supabase
      .from(this.tableName as any)
      .select('*')
      .eq('is_assigned', false)
      .order('created_at', { ascending: false });
    
    // Cast to unknown first for safer type conversion
    return {
      data: (response.data as unknown) as PhoneNumber[] | undefined,
      error: response.error
    };
  }

  /**
   * Update phone number assignment status
   */
  async updatePhoneNumberAssignment(
    phoneNumberId: number, 
    isAssigned: boolean, 
    assistantId: string | null
  ): Promise<{data?: PhoneNumber, error?: any}> {
    return await this.update(phoneNumberId, {
      is_assigned: isAssigned,
      assistant_id: assistantId
    });
  }

  /**
   * Get phone numbers by assistant ID
   */
  async getPhoneNumbersByAssistantId(assistantId: string): Promise<{data?: PhoneNumber[], error?: any}> {
    return await this.findBy('assistant_id', assistantId);
  }

  /**
   * Delete phone number by phone number value or Twilio SID
   */
  async deletePhoneNumber(params: { phoneNumber?: string; twilioSid?: string }): Promise<{error?: any}> {
    const { phoneNumber, twilioSid } = params;
    
    if (!phoneNumber && !twilioSid) {
      return { error: "Phone number or Twilio SID is required" };
    }
    
    // Handle response explicitly for type safety
    const query = this.supabase.from(this.tableName as any).delete();
    
    if (phoneNumber) {
      query.eq("phone_number", phoneNumber);
    } else if (twilioSid) {
      query.eq("twilio_sid", twilioSid);
    }
    
    const response = await query;
    return { error: response.error };
  }
}