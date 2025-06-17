import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

import type { TransformedInteraction } from '@/types/dashboard.types';
import { requireAuth } from '@/utils/auth-utils';
import { createClient } from '@/utils/supabase/server';

function formatResponseTime(durationMs: number): string {
  return durationMs < 1000 ? `${durationMs}ms` : `${(durationMs / 1000).toFixed(2)}s`;
}

export const GET = requireAuth(async (context, req: NextRequest) => {
  try {
    // Get query parameters
    const url = new URL(req.url);
    const page = Number.parseInt(url.searchParams.get('page') ?? '1');
    const pageSize = Number.parseInt(url.searchParams.get('pageSize') ?? '10');
    const searchTerm = url.searchParams.get('search') ?? '';
    const assistantId = url.searchParams.get('assistantId') ?? undefined;

    // Validate pagination parameters
    if (page < 1 || pageSize < 1) {
      return NextResponse.json({ error: 'Invalid pagination parameters' }, { status: 400 });
    }

    const supabase = await createClient();
    const { user } = context;

    // Start building the query - filter by user_id to ensure users only see their own interactions
    let query = supabase

      .from('interactions')
      .select('*')
      .eq('user_id', user.id)
      .order('interaction_time', { ascending: false });

    // Apply filters if provided
    if (assistantId) {
      query = query.eq('assistant_id', assistantId);
    }

    if (searchTerm) {
      query = query.or(`request.ilike.%${searchTerm}%,response.ilike.%${searchTerm}%`);
    }

    // Get the total count with the same filters applied
    let countQuery = supabase
      .from('interactions')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id);

    if (assistantId) {
      countQuery = countQuery.eq('assistant_id', assistantId);
    }

    if (searchTerm) {
      countQuery = countQuery.or(`request.ilike.%${searchTerm}%,response.ilike.%${searchTerm}%`);
    }

    const { count, error: countError } = await countQuery;

    if (countError) {
      throw countError;
    }

    // Calculate pagination
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    // Get paginated data
    const { data: chatData, error } = await query.range(from, to);

    if (error) {
      throw error;
    }

    // Transform to TransformedInteraction format
    const interactions: TransformedInteraction[] = chatData.map(chat => {
      const date = new Date(chat.interaction_time ?? new Date());
      const formattedDate = `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear().toString().slice(2)}`;

      const phoneNumber = chat.assistant_id ?? 'Unknown';

      let type = 'Unknown';
      if (chat.request && chat.response) {
        type = 'Inbound, Outbound';
      } else if (chat.request) {
        type = 'Inbound';
      } else if (chat.response) {
        type = 'Outbound';
      }

      let responseTime = '0ms';
      if (chat.duration) {
        responseTime = formatResponseTime(chat.duration);
      }

      return {
        id: chat.id,
        date: formattedDate,
        phoneNumber: phoneNumber,
        message: typeof chat.request === 'string' ? chat.request : JSON.stringify(chat.request),
        response: typeof chat.response === 'string' ? chat.response : JSON.stringify(chat.response),
        type: type,
        responseTime: responseTime,
        assistant_id: chat.assistant_id,
        user_id: chat.user_id ?? user.id,
        duration: chat.duration ?? 0,
        interaction_time: chat.interaction_time ?? '',
        chat: chat.chat,
        assistant_name: '',
        status: 'Completed',
      };
    });

    return NextResponse.json({
      interactions,
      totalPages: Math.ceil((count ?? 0) / pageSize),
      currentPage: page,
      totalCount: count,
    });
  } catch (error: unknown) {
    const errorObj = error instanceof Error ? error : new Error('Unknown error');
    console.error('Error fetching interactions:', {
      message: errorObj.message,
      name: errorObj.name,
      stack: errorObj.stack || 'No stack trace',
      error: error,
    });
    return NextResponse.json({ error: 'Failed to fetch interactions' }, { status: 500 });
  }
});
