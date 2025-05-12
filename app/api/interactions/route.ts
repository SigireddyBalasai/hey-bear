import { createClient } from '@/utils/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { recordInteraction } from '@/app/utils/interactionUtils';

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  
  try {
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse the request body
    const {
      assistantId,
      chat,
      request: userRequest,
      response,
      tokenUsage,
      costEstimate,
      duration,
      isError
    } = await request.json();

    // Use the utility function to record the interaction with correct user ID mapping
    const success = await recordInteraction(
      user.id,
      assistantId,
      chat,
      userRequest,
      response,
      tokenUsage || 0,
      costEstimate || 0,
      duration || 0,
      isError || false
    );

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to record interaction' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in interactions API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
