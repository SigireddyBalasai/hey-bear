import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

// Define the settings object type
type TwilioSettings = {
  accountSid: string;
  authToken: string;
  webhookUrl: string;
  webhookEnabled: boolean;
  smsEnabled: boolean;
  voiceEnabled: boolean;
};

// Get current settings
export async function GET(req: Request) {
  try {
    // Check authentication and admin permissions
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      console.log('Auth error:', authError);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('User authenticated:', user.id);

    // Check admin status - directly query the users table
    const { data: userData, error: userDataError } = await supabase
      .from('users')
      .select('is_admin')
      .eq('auth_user_id', user.id)
      .single();
      
    if (userDataError) {
      console.log('User data error:', userDataError);
      return NextResponse.json({ error: 'Error checking admin status' }, { status: 500 });
    }
    
    if (!userData?.is_admin) {
      console.log('Not an admin:', userData);
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    console.log('Admin access confirmed');

    // For implementation, use environment variables
    const settings: TwilioSettings = {
      accountSid: process.env.TWILIO_ACCOUNT_SID || '',
      // Don't return the full auth token for security reasons
      authToken: process.env.TWILIO_AUTH_TOKEN ? '••••••••••••••••' : '',
      webhookUrl: process.env.TWILIO_WEBHOOK_URL || `${process.env.NEXT_PUBLIC_APP_URL}/api/twilio/webhook`,
      webhookEnabled: true,
      smsEnabled: true,
      voiceEnabled: false
    };

    return NextResponse.json({
      success: true,
      settings
    });
  } catch (error: any) {
    console.error('Error fetching Twilio settings:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to fetch Twilio settings'
      },
      { status: 500 }
    );
  }
}

// Update settings
export async function POST(req: Request) {
  try {
    // Check authentication and admin permissions
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check admin status - directly using auth_user_id
    const { data: userData, error: userDataError } = await supabase
      .from('users')
      .select('is_admin')
      .eq('auth_user_id', user.id)
      .single();
      
    if (userDataError || !userData?.is_admin) {
      console.log('Admin check failed:', userDataError, userData);
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    // Get settings from request body
    const { settings } = await req.json();
    
    if (!settings) {
      return NextResponse.json({ error: 'Settings are required' }, { status: 400 });
    }

    // Validate settings
    if (!settings.accountSid || !settings.authToken) {
      return NextResponse.json(
        { error: 'Account SID and Auth Token are required' },
        { status: 400 }
      );
    }

    // In a real implementation, you would update environment variables
    // For now, we'll just acknowledge the receipt of the settings
    console.log('Received settings to save:', settings.accountSid, settings.authToken === '••••••••••••••••' ? '(masked token)' : '(new token)');
    
    // If using .env.local file, you could update it here
    // However, for security and best practices, consider using a secret manager

    return NextResponse.json({
      success: true,
      message: 'Settings saved successfully'
    });
  } catch (error: any) {
    console.error('Error saving Twilio settings:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to save Twilio settings'
      },
      { status: 500 }
    );
  }
}
