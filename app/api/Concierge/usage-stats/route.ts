import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { getAssistantUsageStats } from '@/utils/usage-limits';

export async function GET(req: NextRequest) {
  try {
    // Extract the assistant ID from the query parameters
    const url = new URL(req.url);
    const assistantId = url.searchParams.get('assistantId');
    
    if (!assistantId) {
      return NextResponse.json(
        { error: 'Missing required parameter: assistantId' },
        { status: 400 }
      );
    }
    
    const supabase = await createClient();
    
    // Check user authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.error('Auth error:', authError);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Verify the user has access to this assistant
    const { data: assistantData, error: assistantError } = await supabase
      .from('assistants')
      .select('user_id')
      .eq('id', assistantId)
      .single();
    
    if (assistantError) {
      console.error('Error fetching assistant:', assistantError);
      return NextResponse.json(
        { error: 'Assistant not found' },
        { status: 404 }
      );
    }
    
    // Get the user ID from the database
    const { data: userData, error: userDataError } = await supabase
      .from('users')
      .select('id')
      .eq('auth_user_id', user.id)
      .single();
    
    if (userDataError || !userData) {
      console.error('Error fetching user data:', userDataError);
      return NextResponse.json({ error: 'User record not found' }, { status: 404 });
    }
    
    // Check if the user owns this assistant
    if (assistantData.user_id !== userData.id) {
      return NextResponse.json(
        { error: 'You do not have access to this assistant' },
        { status: 403 }
      );
    }
    
    // Get the usage statistics for this assistant
    const usageStats = await getAssistantUsageStats(assistantId);
    
    if (!usageStats) {
      return NextResponse.json(
        { error: 'Failed to retrieve usage statistics' },
        { status: 500 }
      );
    }
    
    return NextResponse.json(usageStats);
  } catch (error) {
    console.error('Unexpected error fetching usage stats:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}