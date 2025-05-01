import { NextRequest } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { PhoneNumberService } from '@/app/services/phone-number/phone-number-service';
import { serviceResponseToNextResponse, createErrorResponse } from '@/app/utils/api-response';

/**
 * API endpoint to get phone numbers for a specific assistant
 * Uses query parameter instead of dynamic route to avoid type issues
 * Example: GET /api/phone-numbers/by-assistant?assistantId=123
 */
export async function GET(request: NextRequest) {
  try {
    // Get assistantId from URL search params
    const searchParams = request.nextUrl.searchParams;
    const assistantId = searchParams.get('assistantId');

    if (!assistantId) {
      return createErrorResponse('Missing required query parameter: assistantId', 400);
    }

    // Initialize the supabase client
    const supabase = await createClient();
    
    // Initialize service with client
    const phoneNumberService = new PhoneNumberService(supabase);
    
    // Get phone numbers for the specified assistant
    const response = await phoneNumberService.getAssistantPhoneNumbers(assistantId);
    
    // Convert service response to NextResponse and return
    return serviceResponseToNextResponse({
      ...response,
      data: { phoneNumbers: response.phoneNumbers }
    });
    
  } catch (error) {
    console.error('Error fetching assistant phone numbers:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return serviceResponseToNextResponse({
      error: `Error fetching assistant phone numbers: ${errorMessage}`,
      status: 500,
      data: { phoneNumbers: [] }
    });
  }
}