import { createClient } from '@/utils/supabase/server';
import { PhoneNumberService } from '@/app/services/phone-number/phone-number-service';
import { UnassignPhoneNumberParams } from '@/app/services/types/phone-number-types';
import { serviceResponseToNextResponse } from '@/app/utils/api-response';

export async function POST(request: Request) {
  try {
    // Parse request body
    const body = await request.json();
    const { phoneNumberId } = body;

    // Initialize the supabase client
    const supabase = await createClient();
    
    // Initialize service with client
    const phoneNumberService = new PhoneNumberService(supabase);
    
    // Unassign phone number
    const params: UnassignPhoneNumberParams = { phoneNumberId };
    const response = await phoneNumberService.unassignPhoneNumber(params);
    
    // Convert service response to NextResponse and return
    return serviceResponseToNextResponse({
      ...response,
      data: { phoneNumber: response.phoneNumber }
    });
    
  } catch (error) {
    console.error('Error unassigning phone number:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return serviceResponseToNextResponse({
      error: `Error unassigning phone number: ${errorMessage}`,
      status: 500
    });
  }
}
