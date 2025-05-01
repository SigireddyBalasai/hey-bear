import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { PhoneNumberService } from '../../services/phone-number-service';

export async function GET(request: Request) {
  try {
    // Initialize the supabase client
    const supabase = await createClient();
    
    // Initialize service with client
    const phoneNumberService = new PhoneNumberService(supabase);
    
    // Get available phone numbers
    const phoneNumbers = await phoneNumberService.getAvailablePhoneNumbers();
    
    // Return the available phone numbers
    return NextResponse.json({ phoneNumbers });
    
  } catch (error) {
    console.error('Error fetching available phone numbers:', error);
    return NextResponse.json(
      { error: `Error fetching available phone numbers: ${error instanceof Error ? error.message : String(error)}` },
      { status: 500 }
    );
  }
}
