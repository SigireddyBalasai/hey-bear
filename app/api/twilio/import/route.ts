import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function POST(req: Request) {
  try {
    // Check authentication and admin permissions
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check admin status directly instead of using the utility function
    // This matches how it's done in the list endpoint that works
    const { data: userData, error: userDataError } = await supabase
      .from('users')
      .select('is_admin, id')
      .eq('auth_user_id', user.id)  // Use auth_user_id, not user.id
      .single();
      
    if (userDataError || !userData?.is_admin) {
      console.log('Admin check failed:', userDataError, userData);
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    // Get the phone number to import
    const { phoneNumber } = await req.json();

    if (!phoneNumber) {
      return NextResponse.json(
        { error: 'Phone number is required' },
        { status: 400 }
      );
    }

    // Check if the number already exists
    const { data: existingNumber } = await supabase
      .from('phone_numbers')
      .select('id')
      .eq('number', phoneNumber)
      .single();

    if (existingNumber) {
      return NextResponse.json(
        { error: 'This phone number already exists in the system' },
        { status: 400 }
      );
    }

    // Add the phone number to the database
    const { data: number, error: insertError } = await supabase
      .from('phone_numbers')
      .insert({
        phone_number: phoneNumber,
        is_assigned: false,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (insertError) {
      return NextResponse.json(
        { error: 'Failed to add phone number to database' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Phone number imported successfully',
      number: number
    });
  } catch (error: any) {
    console.error('Error importing phone number:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to import phone number'
      },
      { status: 500 }
    );
  }
}
