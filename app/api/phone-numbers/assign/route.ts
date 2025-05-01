import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { PhoneNumberService } from '../../services/phone-number-service';

export async function POST(request: Request) {
  try {
    // Parse the request body
    const body = await request.json();
    const { assistantId, phoneNumberId } = body;
    
    // Initialize the service with Supabase client
    const supabase = await createClient();
    const phoneNumberService = new PhoneNumberService(supabase);
    
    // Call the service to assign the phone number
    const result = await phoneNumberService.assignPhoneNumber(assistantId, phoneNumberId);
    
    // Return appropriate response based on the service result
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }
    
    return NextResponse.json({ 
      message: 'Phone number assigned successfully',
      phoneNumber: result.phoneNumber 
    }, { status: 200 });
    
  } catch (error) {
    console.error('[Phone Number Assignment - ERROR:', error);
    return NextResponse.json(
      { error: `Internal server error: ${error instanceof Error ? error.message : String(error)}` },
      { status: 500 }
    );
  }
}
