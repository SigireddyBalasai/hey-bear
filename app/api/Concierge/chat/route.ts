import type { NextRequest } from 'next/server';

import type { Database } from '@/lib/db.types';
import { createClient } from '@/utils/supabase/server';
import { UsageType, isLimitReached, trackUsage } from '@/utils/usage-limits';

type InteractionsInsert = Database['analytics']['Tables']['interactions']['Insert'];

export async function POST(req: NextRequest) {
  try {
    const requestTimestamp = new Date();
    const body = await req.json();
    const { assistantId, message } = body;

    if (!assistantId || !message) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const isLimitExceeded = await isLimitReached(assistantId, UsageType.MESSAGE_RECEIVED);
    if (isLimitExceeded) {
      return NextResponse.json(
        {
          error: 'Usage limit reached',
          details: 'This assistant has reached its monthly message limit.',
          limitReached: true,
        },
        { status: 429 }
      );
    }

    const supabase = await createClient();

    const { data: assistantDetail, error: assistantError } = await supabase
      .schema('assistants')
      .from('assistant_detail_view')
      .select('*')
      .eq('id', assistantId)
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

    const messages = [{ role: 'user', content: message }];

    const response = await assistant.chat({ messages });

    const responseTimestamp = new Date();
    const responseDuration = responseTimestamp.getTime() - requestTimestamp.getTime();

    if (!response.message) {
      return NextResponse.json({ error: 'Assistant returned no response' }, { status: 500 });
    }

    await trackUsage(assistantId, UsageType.MESSAGE_SENT);

    const tokenCount = response.usage?.totalTokens ?? 0;
    const costRate = 0.002 / 1000;
    const costEstimate = tokenCount * costRate;
    const monthlyPeriod = `${requestTimestamp.getFullYear()}-${String(requestTimestamp.getMonth() + 1).padStart(2, '0')}`;

    const interactionData: InteractionsInsert = {
      request: JSON.stringify(messages),
      assistant_id: assistantId,
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
      monthly_period: monthlyPeriod,
    };

    await supabase.schema('analytics').from('interactions').insert([interactionData]);

    await supabase
      .schema('assistants')
      .from('assistants')
      .update({ updated_at: requestTimestamp.toISOString() })
      .eq('id', assistantId);

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
