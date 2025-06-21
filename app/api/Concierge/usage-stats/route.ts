import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { requireAuth } from '@/utils/auth-utils';
import { createClient } from '@/utils/supabase/server';

export const GET = requireAuth(async (context, req: NextRequest) => {
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

    // Verify the user has access to this assistant
    const { data: assistantData, error: assistantError } = await supabase
      .from('assistants')
      .select('*')
      .eq('id', assistantId)
      .single();

    if (assistantError) {
      console.error('Error fetching assistant:', assistantError);

      return NextResponse.json({ error: 'Error fetching assistant data' }, { status: 500 });
    }

    // Use auth user ID directly since we no longer have a separate users table
    const appUserId = context.user.id;

    // Check if the user owns this assistant.
    // assistantData.user_id should match the auth user ID directly.
    if (assistantData.user_id !== appUserId) {
      return NextResponse.json(
        { error: 'You do not have access to this assistant' },
        { status: 403 }
      );
    }

    // Return a simple response indicating no usage limits are enforced
    return NextResponse.json({
      messagesReceived: 0,
      messagesSent: 0,
      documentsProcessed: 0,
      limits: {
        messagesReceivedLimit: null,
        messagesSentLimit: null,
        documentsProcessedLimit: null,
      },
      limitReached: false,
    });
  } catch (error) {
    console.error('Unexpected error:', error);

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
});
