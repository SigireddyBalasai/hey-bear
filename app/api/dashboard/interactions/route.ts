import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { Interaction } from '@/app/dashboard/models';

// Helper function to get default start date (1 month ago)
function getDefaultStartDate() {
  const date = new Date();
  date.setMonth(date.getMonth() - 1);
  return date.toISOString().split('T')[0];
}

// Helper function to get default end date (today)
function getDefaultEndDate() {
  return new Date().toISOString().split('T')[0];
}

// Helper function to format response time in a human-readable way
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
  try {
    const supabase = await createClient();

    // Get the user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse query parameters
    const url = new URL(req.url);
    const phoneNumber = url.searchParams.get('phoneNumber') || 'all';
    const startDate = url.searchParams.get('startDate') || getDefaultStartDate();
    const endDate = url.searchParams.get('endDate') || getDefaultEndDate();
    const searchTerm = url.searchParams.get('searchTerm') || '';
    const page = parseInt(url.searchParams.get('page') || '1');
    const pageSize = parseInt(url.searchParams.get('pageSize') || '10');

    // Check if chat_history table exists
    try {
      // Prepare the query
      let query = supabase
        .from('chat_history')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      // Apply filters
      if (phoneNumber && phoneNumber !== 'all') {
        query = query.eq('metadata->phoneNumber', phoneNumber);
      }

      if (startDate) {
        query = query.gte('created_at', startDate);
      }

      if (endDate) {
        // Add a day to include the entire end date
        const nextDay = new Date(endDate);
        nextDay.setDate(nextDay.getDate() + 1);
        query = query.lt('created_at', nextDay.toISOString());
      }

      if (searchTerm) {
        query = query.or(`question.ilike.%${searchTerm}%,answer.ilike.%${searchTerm}%`);
      }

      // First get total count for pagination
      const startDateFormatted = startDate ? new Date(startDate).toISOString().split('T')[0] : '';
      const endDateFormatted = endDate ? new Date(endDate).toISOString().split('T')[0] + 'T23:59:59.999Z' : '';

      let countQuery = supabase
        .from('chat_history')
        .select('count', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .match(phoneNumber && phoneNumber !== 'all' ? { 'metadata->phoneNumber': phoneNumber } : {})
        .gte(startDate ? 'created_at' : '', startDateFormatted || '')
        .lte(endDate ? 'created_at' : '', endDateFormatted || '');

      if (searchTerm) {
        countQuery = countQuery.or(`question.ilike.%${searchTerm}%,answer.ilike.%${searchTerm}%`);
      }

      const { count, error: countError } = await countQuery;

      if (countError) {
        return NextResponse.json({
          interactions: [],
          stats: {
            totalInteractions: 0,
            activeContacts: 0,
            interactionsPerContact: 0,
            averageResponseTime: '0s',
            phoneNumbers: '0/10',
            smsReceived: '0/200',
            smsSent: '0/200',
            planType: 'Personal',
          },
          dateRange: `${startDate} - ${endDate} (No data)`,
          pagination: {
            total: 0,
            page: 1,
            pageSize: 10,
            totalPages: 1
          }
        });
      }

      const totalCount = count || 0;

      // Fetch all response time data for calculating average
      let avgTimeQuery = supabase
        .from('chat_history')
        .select('metadata')
        .eq('user_id', user.id)
        .match(phoneNumber && phoneNumber !== 'all' ? { 'metadata->phoneNumber': phoneNumber } : {})
        .gte(startDate ? 'created_at' : '', startDateFormatted || '')
        .lte(endDate ? 'created_at' : '', endDateFormatted || '')
        .not('answer', 'is', null);

      if (searchTerm) {
        avgTimeQuery = avgTimeQuery.or(`question.ilike.%${searchTerm}%,answer.ilike.%${searchTerm}%`);
      }

      const { data: timeData, error: timeError } = await avgTimeQuery;

      let averageResponseTime = '0s';
      if (!timeError && timeData && timeData.length > 0) {
        let totalResponseTime = 0;
        let validResponseCount = 0;

        for (const item of timeData) {
          const metadata = item.metadata || {};

          if (metadata.responseDuration) {
            totalResponseTime += parseInt(metadata.responseDuration);
            validResponseCount++;
          } else if (metadata.requestTimestamp && metadata.responseTimestamp) {
            const requestTime = new Date(metadata.requestTimestamp).getTime();
            const responseTime = new Date(metadata.responseTimestamp).getTime();

            if (!isNaN(requestTime) && !isNaN(responseTime) && responseTime > requestTime) {
              const duration = responseTime - requestTime;
              totalResponseTime += duration;
              validResponseCount++;
            }
          }
        }

        if (validResponseCount > 0) {
          const avgMilliseconds = Math.round(totalResponseTime / validResponseCount);
          averageResponseTime = formatResponseTime(avgMilliseconds);
        }
      }

      // Then get paginated results
      const { data: chatData, error: chatError } = await query
        .range((page - 1) * pageSize, page * pageSize - 1);

      if (chatError) {
        return NextResponse.json({ error: 'Failed to fetch interactions' }, { status: 500 });
      }

      const interactions: Interaction[] = (chatData || []).map((chat) => {
        const date = new Date(chat.created_at);
        const formattedDate = `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear().toString().substring(2)}`;

        const metadata = chat.metadata || {};
        const phoneNumber = metadata.phoneNumber || 'Unknown';
        const requestTimestamp = metadata.requestTimestamp;
        const responseTimestamp = metadata.responseTimestamp;
        const responseDuration = metadata.responseDuration;

        let type = 'Unknown';
        if (chat.question && chat.answer) {
          type = 'Inbound, Outbound';
        } else if (chat.question) {
          type = 'Inbound';
        } else if (chat.answer) {
          type = 'Outbound';
        }

        let responseTime = '0ms';
        if (responseDuration) {
          responseTime = `${responseDuration}ms`;
        } else if (requestTimestamp && responseTimestamp) {
          const duration = new Date(responseTimestamp).getTime() - new Date(requestTimestamp).getTime();
          responseTime = formatResponseTime(duration);
        }

        return {
          id: chat.id,
          date: formattedDate,
          phoneNumber: phoneNumber,
          message: chat.question || '-',
          response: chat.answer || '-',
          type: type,
          responseTime: responseTime,
          metadata: {
            requestTimestamp,
            responseTimestamp,
            responseDuration
          }
        };
      });

      const { error: statsError } = await supabase
        .from('assistants')
        .select('message_count, last_used_at')
        .eq('user_id', user.id)
        .single();

      const uniquePhoneNumbers = new Set((interactions || []).map(i => i.phoneNumber)).size;

      const stats = {
        totalInteractions: totalCount,
        activeContacts: uniquePhoneNumbers,
        interactionsPerContact: uniquePhoneNumbers > 0 ? Math.round((totalCount / uniquePhoneNumbers) * 10) / 10 : 0,
        averageResponseTime,
        phoneNumbers: `${uniquePhoneNumbers}/10`,
        smsReceived: `${Math.floor(totalCount / 2)}/200`,
        smsSent: `${Math.ceil(totalCount / 2)}/200`,
        planType: 'Personal',
      };

      const startDateObj = new Date(startDate);
      const endDateObj = new Date(endDate);

      const startMonth = startDateObj.toLocaleString('default', { month: 'short' });
      const endMonth = endDateObj.toLocaleString('default', { month: 'short' });

      let dateRange = `${startMonth} ${startDateObj.getDate()} - ${endMonth} ${endDateObj.getDate()}, ${endDateObj.getFullYear()}`;

      if (interactions.length === 0) {
        dateRange = `${startMonth} ${startDateObj.getDate()} - ${endMonth} ${endDateObj.getDate()}, ${endDateObj.getFullYear()} (No data)`;
      }

      const response = {
        interactions,
        stats,
        dateRange,
        pagination: {
          total: totalCount,
          page,
          pageSize,
          totalPages: Math.ceil(totalCount / pageSize) || 1
        }
      };

      return NextResponse.json(response);
    } catch (error: any) {
      return NextResponse.json({
        interactions: [],
        stats: {
          totalInteractions: 0,
          activeContacts: 0,
          interactionsPerContact: 0,
          averageResponseTime: '0s',
          phoneNumbers: '0/10',
          smsReceived: '0/200',
          smsSent: '0/200',
          planType: 'Personal',
        },
        dateRange: `${startDate} - ${endDate} (No data)`,
        pagination: {
          total: 0,
          page: 1,
          pageSize: 10,
          totalPages: 1
        }
      });
    }
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
