import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { Interaction } from '@/app/dashboard/models';
import logger from '@/lib/logger';

// Create a logger with context
const apiLogger = logger.withContext('API:InteractionsRoute');

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
  const opLogger = apiLogger.startOperation('GET');
  
  try {
    const supabase = await createClient();

    // Get the user
    apiLogger.debug('Authenticating user');
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      apiLogger.warn('Unauthorized access attempt', { error: userError });
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
    
    apiLogger.debug('Request parameters', { 
      phoneNumber, startDate, endDate, searchTerm, page, pageSize, userId: user.id 
    });
    
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
      apiLogger.debug('Fetching count');
      const countTimer = apiLogger.startOperation('CountQuery');
      
      // Parse dates properly for inclusive range
      const startDateFormatted = startDate ? new Date(startDate).toISOString().split('T')[0] : '';
      const endDateFormatted = endDate ? new Date(endDate).toISOString().split('T')[0] + 'T23:59:59.999Z' : '';
      
      let countQuery = supabase
        .from('chat_history')
        .select('count', { count: 'exact', head: true })
        .eq('user_id', user.id)
        // Apply the same filters that are applied to the main query
        .match(phoneNumber && phoneNumber !== 'all' ? { 'metadata->phoneNumber': phoneNumber } : {})
        .gte(startDate ? 'created_at' : '', startDateFormatted || '')
        .lte(endDate ? 'created_at' : '', endDateFormatted || '');
      
      // Only apply search filter if search term exists
      if (searchTerm) {
        countQuery = countQuery.or(`question.ilike.%${searchTerm}%,answer.ilike.%${searchTerm}%`);
      }
        
      const { count, error: countError } = await countQuery;
      countTimer.end();
        
      // Handle count error - could be missing table
      if (countError) {
        apiLogger.error('Error fetching count', { error: countError });
        
        // If table doesn't exist or other DB error, return empty data with appropriate structure
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
      apiLogger.debug('Fetching response time data');
      const avgTimeTimer = apiLogger.startOperation('AvgTimeQuery');
      
      // Create a copy of the main query but only select metadata
      let avgTimeQuery = supabase
        .from('chat_history')
        .select('metadata')
        .eq('user_id', user.id)
        // Apply the same filters that are applied to the main query
        .match(phoneNumber && phoneNumber !== 'all' ? { 'metadata->phoneNumber': phoneNumber } : {})
        .gte(startDate ? 'created_at' : '', startDateFormatted || '')
        .lte(endDate ? 'created_at' : '', endDateFormatted || '')
        .not('answer', 'is', null); // Only include records with responses
        
      if (searchTerm) {
        avgTimeQuery = avgTimeQuery.or(`question.ilike.%${searchTerm}%,answer.ilike.%${searchTerm}%`);
      }
      
      const { data: timeData, error: timeError } = await avgTimeQuery;
      avgTimeTimer.end();
      
      let averageResponseTime = '0s';
      if (!timeError && timeData && timeData.length > 0) {
        // Calculate average response time
        let totalResponseTime = 0;
        let validResponseCount = 0;
        
        for (const item of timeData) {
          const metadata = item.metadata || {};
          
          if (metadata.responseDuration) {
            // If we have the duration directly
            totalResponseTime += parseInt(metadata.responseDuration);
            validResponseCount++;
          } else if (metadata.requestTimestamp && metadata.responseTimestamp) {
            // Calculate from timestamps
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
          apiLogger.debug('Calculated average response time', { 
            avgMilliseconds, 
            validResponseCount 
          });
        }
      }

      // Then get paginated results
      apiLogger.debug('Fetching interactions');
      const dataTimer = apiLogger.startOperation('DataQuery');
      const { data: chatData, error: chatError } = await query
        .range((page - 1) * pageSize, page * pageSize - 1);
      dataTimer.end();
      
      if (chatError) {
        apiLogger.error('Error fetching interactions', { error: chatError });
        return NextResponse.json({ error: 'Failed to fetch interactions' }, { status: 500 });
      }

      apiLogger.debug(`Found ${chatData?.length || 0} interactions out of ${totalCount} total`);

      // Transform data to match Interaction type
      const interactions: Interaction[] = (chatData || []).map((chat) => {
        const date = new Date(chat.created_at);
        const formattedDate = `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear().toString().substring(2)}`;
        
        // Extract metadata from chat
        const metadata = chat.metadata || {};
        const phoneNumber = metadata.phoneNumber || 'Unknown';
        const requestTimestamp = metadata.requestTimestamp;
        const responseTimestamp = metadata.responseTimestamp;
        const responseDuration = metadata.responseDuration;
        
        // Determine interaction type
        let type = 'Unknown';
        if (chat.question && chat.answer) {
          type = 'Inbound, Outbound';
        } else if (chat.question) {
          type = 'Inbound';
        } else if (chat.answer) {
          type = 'Outbound';
        }
        
        // Format response time
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

      apiLogger.debug('Fetching assistant stats');
      const statsTimer = apiLogger.startOperation('StatsQuery');
      const { error: statsError } = await supabase
        .from('assistants')
        .select('message_count, last_used_at')
        .eq('user_id', user.id)
        .single();
      statsTimer.end();
      
      // Ignore stats errors, just log them
      if (statsError && statsError.code !== 'PGRST116') { // PGRST116 is "no rows returned"
        apiLogger.warn('Error fetching stats', { error: statsError });
      }
      
      const uniquePhoneNumbers = new Set((interactions || []).map(i => i.phoneNumber)).size;
      
      const stats = {
        totalInteractions: totalCount,
        activeContacts: uniquePhoneNumbers,
        interactionsPerContact: uniquePhoneNumbers > 0 ? Math.round((totalCount / uniquePhoneNumbers) * 10) / 10 : 0,
        averageResponseTime,
        phoneNumbers: `${uniquePhoneNumbers}/10`, // Assuming plan limit of 10 phone numbers
        smsReceived: `${Math.floor(totalCount / 2)}/200`, // Assuming half are received messages with plan limit
        smsSent: `${Math.ceil(totalCount / 2)}/200`, // Assuming half are sent messages with plan limit
        planType: 'Personal',
      };

      // Format date range based on provided filters or defaults
      const startDateObj = new Date(startDate);
      const endDateObj = new Date(endDate);
      
      const startMonth = startDateObj.toLocaleString('default', { month: 'short' });
      const endMonth = endDateObj.toLocaleString('default', { month: 'short' });
      
      let dateRange = `${startMonth} ${startDateObj.getDate()} - ${endMonth} ${endDateObj.getDate()}, ${endDateObj.getFullYear()}`;

      // If no interactions found but filters are applied, use the date range from filters
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
          totalPages: Math.ceil(totalCount / pageSize) || 1 // Ensure at least 1 page even when empty
        }
      };

      apiLogger.debug('Successfully retrieved interactions', { 
        totalCount,
        currentPage: page,
        totalPages: Math.ceil(totalCount / pageSize) || 1
      });

      opLogger.end({ responseSize: interactions.length });
      return NextResponse.json(response);
    } catch (error: any) {
      apiLogger.error('Error in interactions query', { error });
      
      // Return empty data structure if table doesn't exist
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
    apiLogger.error('Unexpected error in GET handler', { error });
    opLogger.end({ error: true });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}