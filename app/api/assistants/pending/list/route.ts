import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET(req: NextRequest) {
  try {
    // Initialize Supabase client
    const supabase = await createClient();
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json({ 
        error: 'Authentication required' 
      }, { status: 401 });
    }
    
    // Get the user's internal ID
    const { data: userData, error: userDataError } = await supabase
      .from('users')
      .select('id')
      .eq('auth_user_id', user.id)
      .single();
      
    if (userDataError || !userData) {
      console.error('User data fetch error:', userDataError);
      return NextResponse.json({ 
        error: 'User record not found'
      }, { status: 404 });
    }
    
    // Get pending assistants from the assistants table
    const { data: pendingAssistants, error: listError } = await supabase
      .from('assistants')
      .select('*')
      .eq('user_id', userData.id)
      .eq('pending', true);
    
    if (listError) {
      console.error('Error listing pending assistants:', listError);
      return NextResponse.json({ 
        error: 'Failed to list pending assistants', 
        details: listError.message 
      }, { status: 500 });
    }
    
    return NextResponse.json({
      success: true,
      pendingAssistants
    });
    
  } catch (error: any) {
    console.error('Error listing pending assistants:', error);
    return NextResponse.json({ 
      error: 'Failed to list pending assistants',
      details: error.message 
    }, { status: 500 });
  }
}
