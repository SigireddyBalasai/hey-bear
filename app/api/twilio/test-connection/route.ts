import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import twilio from 'twilio';

export async function POST(req: Request) {
  try {
    // Check authentication and admin permissions
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check admin status directly without using the utility
    const { data: userData, error: userDataError } = await supabase
      .from('users')
      .select('is_admin')
      .eq('auth_user_id', user.id)
      .single();
      
    if (userDataError || !userData?.is_admin) {
      console.log('Admin check failed:', userDataError, userData);
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    // Get credentials from request body
    const { accountSid, authToken } = await req.json();
    
    if (!accountSid || !authToken) {
      return NextResponse.json(
        { error: 'Account SID and Auth Token are required' },
        { status: 400 }
      );
    }

    // If auth token is masked (unchanged), use the one from environment variables
    const actualAuthToken = authToken === '••••••••••••••••' 
      ? process.env.TWILIO_AUTH_TOKEN 
      : authToken;

    if (!actualAuthToken) {
      return NextResponse.json(
        { error: 'Valid Auth Token is required' },
        { status: 400 }
      );
    }

    try {
      // Initialize Twilio client with the provided credentials
      const client = twilio(accountSid, actualAuthToken);
      
      // Make a simple request to test the connection
      const account = await client.api.accounts(accountSid).fetch();
      
      return NextResponse.json({
        success: true,
        accountName: account.friendlyName
      });
    } catch (twilioError: any) {
      console.error('Twilio API error:', twilioError);
      
      return NextResponse.json({
        success: false,
        error: `Twilio API Error: ${twilioError.message}`
      }, { status: 500 });
    }
  } catch (error: any) {
    console.error('Error testing Twilio connection:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to test Twilio connection'
      },
      { status: 500 }
    );
  }
}
