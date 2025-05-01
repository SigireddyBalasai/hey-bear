import { createClient } from '@/utils/supabase/server';
import { PhoneNumberService } from '@/app/services/phone-number/phone-number-service';
import { serviceResponseToNextResponse } from '@/app/utils/api-response';

export async function GET(request: Request) {
  try {
    // Initialize the supabase client
    const supabase = await createClient();
    
    // Initialize service with client
    const phoneNumberService = new PhoneNumberService(supabase);
    
    // Get available phone numbers
    const response = await phoneNumberService.getAvailablePhoneNumbers();
    
    // Convert service response to NextResponse and return
    return serviceResponseToNextResponse({
      ...response,
      data: { phoneNumbers: response.phoneNumbers }
    });
    
  } catch (error) {
    console.error('Error fetching available phone numbers:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return serviceResponseToNextResponse({
      error: `Error fetching available phone numbers: ${errorMessage}`,
      status: 500,
      data: { phoneNumbers: [] }
    });
  }
}
