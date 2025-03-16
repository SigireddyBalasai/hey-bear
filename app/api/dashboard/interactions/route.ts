import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { Interaction, DashboardStats, DashboardResponse } from '@/app/dashboard/models';

// Helper function to get default start date (1 month ago)
function getDefaultStartDate(): string {
  const date = new Date();
  date.setMonth(date.getMonth() - 1);
  return date.toISOString().split('T')[0];
}

// Helper function to get default end date (today)
function getDefaultEndDate(): string {
  return new Date().toISOString().split('T')[0];
}

// Helper function to format response time
function formatResponseTime(milliseconds: number): string {
  if (milliseconds < 1000) {
    return `${milliseconds}ms`;
  } else if (milliseconds < 60000) {
    return `${(milliseconds / 1000).toFixed(1)}s`;
  } else {
    const minutes = Math.floor(milliseconds / 60000);
    const seconds = ((milliseconds % 60000) / 1000).toFixed(1);
    return `${minutes}m ${seconds}s`;
  }
}

export async function GET(req: NextRequest) {
  console.log('Dashboard API request received');
  try {
    const supabase = await createClient();

    // Get the user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error('Authentication error:', userError);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse query parameters
    const url = new URL(req.url);
    const assistantId = url.searchParams.get('assistantId') || 'all';
    const startDate = url.searchParams.get('startDate') || getDefaultStartDate();
    const endDate = url.searchParams.get('endDate') || getDefaultEndDate();
    const searchTerm = url.searchParams.get('searchTerm') || '';
    const page = parseInt(url.searchParams.get('page') || '1');
    const pageSize = parseInt(url.searchParams.get('pageSize') || '10');

    console.log('Query params:', { assistantId, startDate, endDate, searchTerm, page, pageSize });

    // Format dates for database queries
    const startDateFormatted = new Date(startDate).toISOString();
    const endDateFormatted = new Date(endDate).toISOString();

    // Get user ID from the users table
    const { data: userData, error: userIdError } = await supabase
      .from('users')
      .select('id')
      .eq('auth_user_id', user.id)
      .single();

    if (userIdError || !userData) {
      console.error('Error fetching user ID:', userIdError);
      return NextResponse.json({ error: 'Failed to fetch user ID' }, { status: 500 });
    }

    const userId = userData.id;

    // Prepare the query
    let query = supabase
      .from('interactions')
      .select('id, interaction_time, assistant_id, user_id, request, response, duration, chat')
      .eq('user_id', userId)
      .order('interaction_time', { ascending: false });

    // Apply filters
    if (assistantId && assistantId !== 'all') {
      console.log('Filtering by assistant ID:', assistantId);
      query = query.eq('assistant_id', assistantId);
    }
    
    query = query.gte('interaction_time', startDateFormatted).lte('interaction_time', endDateFormatted);
    
    if (searchTerm) {
      console.log('Applying search term filter:', searchTerm);
      query = query.or(`request.ilike.%${searchTerm}%,response.ilike.%${searchTerm}%`);
    }

    // Get total count for pagination
    const countQuery = supabase
      .from('interactions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);
      
    // Apply the same filters as the main query
    if (assistantId && assistantId !== 'all') {
      countQuery.eq('assistant_id', assistantId);
    }
    
    countQuery.gte('interaction_time', startDateFormatted).lte('interaction_time', endDateFormatted);
    
    if (searchTerm) {
      countQuery.or(`request.ilike.%${searchTerm}%,response.ilike.%${searchTerm}%`);
    }
    
    const { count, error: countError } = await countQuery;

    if (countError) {
      console.error('Error getting count:', countError);
      return NextResponse.json({ error: 'Failed to fetch interactions' }, { status: 500 });
    }
    const totalCount = count || 0;
    console.log('Total interactions count:', totalCount);

    // Get paginated results
    const { data: chatData, error: chatError } = await query
      .range((page - 1) * pageSize, page * pageSize - 1);

    if (chatError) {
      console.error('Error fetching data:', chatError);
      return NextResponse.json({ error: 'Failed to fetch interactions' }, { status: 500 });
    }

    console.log('Fetched interactions data:', chatData);

    // Transform to Interaction format
    const interactions: Interaction[] = (chatData || []).map(chat => {
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
        chat: chat.chat
      };
    });

    console.log('Transformed interactions:', interactions);

    const uniqueAssistantIds = new Set(interactions.map(i => i.assistant_id).filter(Boolean)).size;
    console.log('Unique assistant IDs count:', uniqueAssistantIds);

    // Add this before creating the stats object
    let totalDuration = 0;
    let validDurationCount = 0;

    interactions.forEach(interaction => {
      if (interaction.duration && typeof interaction.duration === 'number') {
        totalDuration += interaction.duration;
        validDurationCount++;
      }
    });

    const averageDuration = validDurationCount > 0 ? totalDuration / validDurationCount : 0;

    const stats: DashboardStats = {
      totalInteractions: totalCount,
      activeContacts: uniqueAssistantIds,
      interactionsPerContact: uniqueAssistantIds > 0 ? Math.round((totalCount / uniqueAssistantIds) * 10) / 10 : 0,
      averageResponseTime: formatResponseTime(averageDuration), // Use the calculated average
      phoneNumbers: `${uniqueAssistantIds}/10`,
      smsReceived: `${Math.floor(totalCount / 2)}/200`,
      smsSent: `${Math.ceil(totalCount / 2)}/200`,
      planType: 'Personal',
    };

    console.log('Calculated stats:', stats);

    const startDateObj = new Date(startDate);
    const endDateObj = new Date(endDate);
    const startMonth = startDateObj.toLocaleString('default', { month: 'short' });
    const endMonth = endDateObj.toLocaleString('default', { month: 'short' });
    let dateRange = `${startMonth} ${startDateObj.getDate()} - ${endMonth} ${endDateObj.getDate()}, ${endDateObj.getFullYear()}`;
    
    if (interactions.length === 0) {
      dateRange += " (No data)";
    }

    const totalPages = Math.ceil(totalCount / pageSize) || 1;

    const response: DashboardResponse = {
      interactions,
      stats,
      dateRange,
      pagination: {
        total: totalCount,
        page,
        pageSize,
        totalPages
      }
    };

    console.log('Final response:', response);

    return NextResponse.json(response);
  } catch (error) {
    console.error('Unhandled error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
