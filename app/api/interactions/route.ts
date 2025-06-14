import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

import type { InteractionRequest } from '@/types/api.types';
import { requireAuth } from '@/utils/auth-utils';
import { createClient } from '@/utils/supabase/server';

export const POST = requireAuth(async (context, request: NextRequest) => {
  const supabase = await createClient();

  try {
    const { user } = context;

    // Parse the request body
    const requestBody = (await request.json()) as InteractionRequest;
    const {
      assistantId,
      chat,
      request: userRequest,
      response,
      tokenUsage,
      costEstimate,
      duration,
      isError,
    } = requestBody;
    if (!assistantId || !userRequest || !response) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    // Record the interaction
    const success = await supabase
      .from('interactions')
      .insert({
        user_id: user.id,
        assistant_id: assistantId,
        chat,
        request: userRequest,
        response,
        interaction_time: new Date().toISOString(),
        token_usage: tokenUsage ?? 0,
        cost_estimate: costEstimate ?? 0,
        duration: duration ?? 0,
        is_error: isError ?? false,
        input_tokens: null, // Optional, can be added if needed
        output_tokens: null, // Optional, can be added if needed
      })
      .then(({ error }) => {
        if (error) {
          console.error('Error recording interaction:', error);
          return false;
        }
        return true;
      });

    if (!success) {
      return NextResponse.json({ error: 'Failed to record interaction' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in interactions API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
});
