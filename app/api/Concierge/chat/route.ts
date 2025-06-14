import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { getPineconeClient } from '@/lib/pinecone';
import type { ChatRequest } from '@/types/api.types';
import type { Database } from '@/types/db.types';
import { createClient } from '@/utils/supabase/server';
import type { PineconeResponse } from '@/types/consolidated-interfaces';

type InteractionsInsert = Database['public']['Tables']['interactions']['Insert'];

export async function POST(req: NextRequest) {
  try {
    const requestTimestamp = new Date();
    const body = (await req.json()) as ChatRequest;
    const { assistantId, message } = body;

    // Type guard to ensure we have valid strings
    const validAssistantId = typeof assistantId === 'string' ? assistantId : '';
    const validMessage = typeof message === 'string' ? message : '';

    if (!validAssistantId || !validMessage) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const supabase = await createClient();

    const { data: assistantDetail, error: assistantError } = await supabase

      .from('assistant_detail_view')
      .select('*')
      .eq('id', validAssistantId)
      .single();

    if (assistantError) {
      return NextResponse.json({ error: 'Assistant not found' }, { status: 404 });
    }

    const { pinecone_name } = assistantDetail;

    if (!pinecone_name) {
      return NextResponse.json({ error: 'Invalid assistant configuration' }, { status: 500 });
    }

    const pinecone = getPineconeClient();

    const assistant = pinecone.Assistant(pinecone_name);

    const messages = [{ role: 'user', content: validMessage }];

    const response = (await assistant.chat({ messages })) as PineconeResponse;

    const responseTimestamp = new Date();
    const responseDuration = responseTimestamp.getTime() - requestTimestamp.getTime();

    if (!response.message) {
      return NextResponse.json({ error: 'Assistant returned no response' }, { status: 500 });
    }

    const tokenCount = response.usage?.totalTokens ?? 0;
    const costRate = 0.002 / 1000;
    const costEstimate = tokenCount * costRate;

    const interactionData: InteractionsInsert = {
      request: JSON.stringify(messages),
      assistant_id: validAssistantId,
      chat: JSON.stringify(messages),
      response: response.message.content ?? '',
      duration: responseDuration,
      interaction_time: requestTimestamp.toISOString(),
      user_id: null,
      cost_estimate: costEstimate,
      is_error: false,
      token_usage: tokenCount,
      input_tokens: response.usage?.promptTokens ?? null,
      output_tokens: response.usage?.completionTokens ?? null,
    };

    await supabase.from('interactions').insert([interactionData]);

    await supabase

      .from('assistants')
      .update({ updated_at: requestTimestamp.toISOString() })
      .eq('id', validAssistantId);

    return NextResponse.json({
      response: response.message.content ?? '',
      message: response.message,
      usage: response.usage,
      citations: response.citations,
      fullResponse: response,
      tokens: tokenCount,
      cost: costEstimate,
      timing: {
        requestTimestamp: requestTimestamp.toISOString(),
        responseTimestamp: responseTimestamp.toISOString(),
        responseDuration: responseDuration,
      },
    });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
