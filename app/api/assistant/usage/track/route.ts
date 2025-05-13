import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { trackUsage, UsageType } from '@/utils/usage-limits';

/**
 * API route to track usage for assistants
 * This allows proper tracking in the new normalized tables
 */
export async function POST(req: NextRequest) {
  try {
    // Validate authentication
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.error('Auth error:', authError);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Parse request data
    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }
    
    const { assistantId, type, amount = 1 } = body;
    
    if (!assistantId) {
      return NextResponse.json({ error: 'Missing assistantId' }, { status: 400 });
    }
    
    if (!type || !Object.values(UsageType).includes(type as UsageType)) {
      return NextResponse.json({ error: 'Invalid usage type' }, { status: 400 });
    }
    
    // Make sure the user has access to this assistant
    const { data: userData } = await supabase
      .from('users')
      .select('id')
      .eq('auth_user_id', user.id)
      .single();
      
    if (!userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    const { data: assistant, error: assistantError } = await supabase
      .from('assistants')
      .select('id, user_id')
      .eq('id', assistantId)
      .single();
    
    if (assistantError || !assistant) {
      console.error('Error fetching assistant:', assistantError);
      return NextResponse.json({ error: 'Assistant not found' }, { status: 404 });
    }
    
    // Verify assistant ownership
    if (assistant.user_id !== userData.id) {
      return NextResponse.json({ error: 'You do not have access to this assistant' }, { status: 403 });
    }
    
    // Track usage using our new utility
    const success = await trackUsage(assistantId, type as UsageType, amount);
    
    if (success) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ error: 'Failed to track usage' }, { status: 500 });
    }
  } catch (error: any) {
    console.error('Error tracking usage:', error);
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 });
  }
}