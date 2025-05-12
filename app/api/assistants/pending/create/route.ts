import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function POST(req: NextRequest) {
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
    
    // Parse request body
    const body = await req.json();
    const { 
      name, 
      description, 
      systemPrompt, 
      files = [] 
    } = body;
    
    // Validate required fields
    if (!name) {
      return NextResponse.json({ 
        error: 'Assistant name is required'
      }, { status: 400 });
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
    
    // Prepare the pending assistant data
    const pendingAssistantData = {
      name,
      description: description || null,
      system_prompt: systemPrompt || null,
      user_id: userData.id,
      pending: true, // Mark as pending
      created_at: new Date().toISOString(),
      params: {
        files,
        creation_status: 'pending',
        creation_started_at: new Date().toISOString()
      }
    };
    
    // Insert into the assistants table with pending flag instead of non-existent pending_assistants table
    const { error: pendingError } = await supabase
      .from('assistants')
      .insert(pendingAssistantData);
    
    if (pendingError) {
      console.error('Error creating pending assistant:', pendingError);
      return NextResponse.json({ 
        error: 'Failed to create pending assistant', 
        details: pendingError.message 
      }, { status: 500 });
    }
    
    return NextResponse.json({
      success: true,
      message: 'Pending assistant created successfully',
    });
    
  } catch (error: any) {
    console.error('Error creating pending assistant:', error);
    return NextResponse.json({ 
      error: 'Failed to create pending assistant',
      details: error.message 
    }, { status: 500 });
  }
}
