import { createClient } from '@/utils/supabase/server';
import { PhoneNumberAdminService } from '@/app/services/phone-number/phone-number-admin-service';
import { serviceResponseToNextResponse, createWarningResponse } from '@/app/utils/api-response';

export async function GET(request: Request) {
  try {
    // Initialize the supabase client
    const supabase = await createClient();
    
    // Initialize service with client
    const phoneNumberAdminService = new PhoneNumberAdminService(supabase);
    
    // Get all phone numbers (admin only)
    const response = await phoneNumberAdminService.getAllPhoneNumbers();
    
    // Convert service response to NextResponse and return
    return serviceResponseToNextResponse({
      ...response,
      data: { phoneNumbers: response.phoneNumbers }
    });
    
  } catch (error) {
    console.error('Error fetching phone numbers:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return serviceResponseToNextResponse({
      error: `Error fetching phone numbers: ${errorMessage}`,
      status: 500,
      data: { phoneNumbers: [] }
    });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { phone_number, twilio_sid, is_assigned, assistant_id } = body;
    
    // Initialize the supabase client
    const supabase = await createClient();
    
    // Initialize service with client
    const phoneNumberAdminService = new PhoneNumberAdminService(supabase);
    
    // Create a new phone number (admin only)
    const response = await phoneNumberAdminService.createPhoneNumber({
      phone_number,
      twilio_sid,
      is_assigned,
      assistant_id
    });
    
    // Convert service response to NextResponse and return
    return serviceResponseToNextResponse({
      ...response,
      data: { phoneNumber: response.phoneNumber }
    });
    
  } catch (error) {
    console.error('Error creating phone number:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return serviceResponseToNextResponse({
      error: `Error creating phone number: ${errorMessage}`,
      status: 500
    });
  }
}

export async function DELETE(request: Request) {
  try {
    const body = await request.json();
    const { phoneNumber, twilioSid } = body;
    
    // Initialize the supabase client
    const supabase = await createClient();
    
    // Initialize service with client
    const phoneNumberAdminService = new PhoneNumberAdminService(supabase);
    
    // Delete phone number (admin only)
    const response = await phoneNumberAdminService.deletePhoneNumber({ phoneNumber, twilioSid });
    
    // Call Twilio API to release the number if database deletion was successful
    if (response.status === 200) {
      try {
        // Note: This assumes you have a separate API endpoint that handles Twilio operations
        const twilioResponse = await fetch("/api/twilio/release", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phoneNumber, twilioSid }),
        });

        const twilioResult = await twilioResponse.json();

        if (!twilioResponse.ok) {
          console.warn(
            "Phone number deleted from database but Twilio release failed:",
            twilioResult.error
          );
          return createWarningResponse(
            { success: true },
            "Phone number removed from database but may not have been released from Twilio",
            "Partial success"
          );
        }
      } catch (twilioError) {
        const errorMessage = twilioError instanceof Error ? twilioError.message : String(twilioError);
        return createWarningResponse(
          { success: true },
          "Phone number removed from database but Twilio API call failed",
          `Twilio error: ${errorMessage}`
        );
      }
    }
    
    // Convert service response to NextResponse and return
    return serviceResponseToNextResponse({
      ...response,
      data: { success: response.status === 200 }
    });
    
  } catch (error) {
    console.error('Error deleting phone number:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return serviceResponseToNextResponse({
      error: `Error deleting phone number: ${errorMessage}`,
      status: 500
    });
  }
}
