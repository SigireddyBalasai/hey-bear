import { createClient } from '@/utils/supabase/server';
import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server';
import type { TransformedInteraction } from '@/app/dashboard/types';

// Helper function to format response time
function formatResponseTime(durationMs: number): string {
  if (durationMs < 1000) {
    return `${durationMs}ms`;
  } else {
    return `${(durationMs / 1000).toFixed(2)}s`;
  }
}

export async function GET(req: NextRequest) {
  try {
    // Get query parameters
    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const pageSize = parseInt(url.searchParams.get('pageSize') || '10');
    const searchTerm = url.searchParams.get('search') || '';
    const assistantId = url.searchParams.get('assistantId') || undefined;

    // Validate pagination parameters
    if (page < 1 || pageSize < 1) {
      return NextResponse.json({ error: 'Invalid pagination parameters' }, { status: 400 });
    }

    const supabase = await createClient();

    // Start building the query
    let query = supabase
      .schema('analytics')
      .from('interactions')
      .select('*')
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
      .schema('analytics')
      .from('interactions')
      .select('id', { count: 'exact', head: true });

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
    const interactions: TransformedInteraction[] = (chatData || []).map(chat => {
      const date = new Date(chat.interaction_time || new Date());
      const formattedDate = `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear().toString().substring(2)}`;
      
      const phoneNumber = chat.assistant_id || 'Unknown';

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
        assistant_id: chat.assistant_id ?? undefined,
        user_id: chat.user_id ?? undefined,
        duration: chat.duration ?? undefined,
        interaction_time: chat.interaction_time ?? undefined,
        chat: chat.chat,
        assistant_name: null,
        status: 'Completed',
      };
    });

    return NextResponse.json({
      interactions,
      totalPages: Math.ceil((count || 0) / pageSize),
      currentPage: page,
      totalCount: count,
    });
  } catch (error) {
    console.error('Error fetching interactions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch interactions' },
      { status: 500 }
    );
  }
}
