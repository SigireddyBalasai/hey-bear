'use client';

import { useEffect, useState } from 'react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { createClient } from '@/utils/supabase/client';

// Database types are now used as explicit types instead of imports

import { useData } from './DataContext';

export interface PlanUsageProps {
  planType?: string;
  phoneNumbers?: {
    used: number;
    total: number;
    percentage: number;
  };
  smsReceived?: {
    used: number;
    total: number;
    percentage: number;
  };
  smsSent?: {
    used: number;
    total: number;
    percentage: number;
  };
  loading?: boolean;
}

interface UsageData {
  current: number;
  limit: number;
  percentage: number;
}

interface Assistant {
  id: string;
  name: string;
  plan: {
    messages: UsageData;
    tokens: UsageData;
  };
}

const PlanUsage = ({
  planType: propPlanType,
  phoneNumbers: propPhoneNumbers,
  smsReceived: propSmsReceived,
  smsSent: propSmsSent,
  loading: propLoading,
}: PlanUsageProps = {}) => {
  const [planType, setPlanType] = useState<string>(propPlanType ?? '');
  const [phoneNumbers, setPhoneNumbers] = useState(propPhoneNumbers);
  const [smsReceived, setSmsReceived] = useState(propSmsReceived);
  const [smsSent, setSmsSent] = useState(propSmsSent);
  const [loading, setLoading] = useState(propLoading ?? true);
  const [selectedAssistant, setSelectedAssistant] = useState<string>('default');
  const [assistants, setAssistants] = useState<Assistant[]>([]);

  const { dateRange } = useData();
  const _supabase = createClient();

  // Set the current assistant based on selection, or first one if no selection
  const currentAssistant =
    selectedAssistant === 'default'
      ? assistants.length > 0
        ? assistants[0]
        : undefined
      : assistants.find(a => a.id === selectedAssistant);

  // Fetch assistants and usage data from database
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);

      try {
        // Get current user
        const {
          data: { user },
          error: authError,
        } = await _supabase.auth.getUser();

        if (authError || !user) {
          console.error('User not authenticated:', authError);
          setLoading(false);
          return;
        }

        // Try to fetch from assistants schema first, fall back to public if needed
        let assistantsData: Array<{ id: string; name: string }> = [];
        // Removing unused assistantsError variable

        try {
          // First check if the user exists in the system
          const { data: userData, error: userDataError } = await _supabase

            .from('users')
            .select('id')
            .eq('auth_user_id', user.id)
            .single();

          if (userDataError) {
            if (userDataError.code === 'PGRST116') {
              // No rows found - might be a new user
              console.log('New user detected, no user data yet');
              assistantsData = []; // Empty array, no assistants yet
            } else {
              console.warn('Error fetching user data:', userDataError);
              // Continue with empty data instead of throwing
              assistantsData = [];
            }
          } else if (userData) {
            // Now fetch assistants with the user_id - handle potential schema errors
            try {
              const result = await _supabase

                .from('assistants')
                .select('id, name')
                .eq('user_id', userData.id);

              if (result.error) {
                console.warn('Error fetching assistants:', result.error);
                assistantsData = []; // Use empty array on error
              } else {
                // Ensure we have valid IDs and names in the assistants data
                assistantsData = (result.data || []).map(assistant => ({
                  id: typeof assistant.id === 'string' ? assistant.id : '',
                  name: typeof assistant.name === 'string' ? assistant.name : 'Unknown Assistant',
                }));
              }
            } catch (assistantError: unknown) {
              console.warn('Assistant fetch operation failed:', assistantError);
              assistantsData = []; // Use empty array on error
            }
          }
        } catch (schemaError) {
          console.error('Assistants schema not accessible:', schemaError);
          // Don't use default/dummy data - use empty array
          assistantsData = [];
        }

        // All errors are handled inline to ensure we never use dummy data

        // Transform assistants data - using real data or zero values, never dummy data
        const transformedAssistants: Assistant[] = assistantsData
          .filter(
            (item): item is { id: string; name: string } =>
              typeof item === 'object' &&
              item !== null &&
              'id' in item &&
              'name' in item &&
              typeof item.id === 'string' &&
              typeof item.name === 'string'
          )
          .map(assistant => {
            // Initialize with zeros - will be replaced with real data if/when available
            const messagesCurrent = 0;
            const messagesLimit = 1000; // This could come from a plan config
            const tokensCurrent = 0;
            const tokensLimit = 100_000; // This could come from a plan config

            return {
              id: assistant.id,
              name: assistant.name,
              plan: {
                messages: {
                  current: messagesCurrent,
                  limit: messagesLimit,
                  percentage:
                    messagesLimit > 0 ? Math.round((messagesCurrent / messagesLimit) * 100) : 0,
                },
                tokens: {
                  current: tokensCurrent,
                  limit: tokensLimit,
                  percentage: tokensLimit > 0 ? Math.round((tokensCurrent / tokensLimit) * 100) : 0,
                },
              },
            };
          });

        setAssistants(transformedAssistants);

        // Set default selection to first assistant if available
        if (transformedAssistants.length > 0 && selectedAssistant === 'default') {
          setSelectedAssistant(transformedAssistants[0].id);
        }

        // Fetch phone numbers and usage data - only if we have assistants
        let phoneNumbersData = [];

        if (transformedAssistants.length > 0) {
          try {
            // Only query if we have assistants to look for
            const result = await _supabase
              .from('phone_numbers')
              .select('*')
              .in(
                'assistant_id',
                transformedAssistants.map(a => a.id)
              );

            if (result.error) {
              console.warn('Error fetching phone numbers:', result.error);
              // Continue with empty data rather than failing
            } else {
              phoneNumbersData = result.data || [];
            }
          } catch (error: unknown) {
            console.warn('Could not fetch phone numbers:', error);
            // Continue with empty data rather than failing
          }
        }

        // Calculate usage data based on actual data, not dummy values
        const phoneNumbersUsed = phoneNumbersData?.length || 0;
        const planType = 'free'; // Default plan type - could be fetched from user subscription data

        // Define limits based on plan type
        // These could come from a configuration or constants file in a real app
        let phoneLimit = 1;
        let smsLimit = 100;

        switch (planType.toLowerCase()) {
          case 'pro':
            phoneLimit = 5;
            smsLimit = 1000;
            break;
          case 'business':
            phoneLimit = 20;
            smsLimit = 5000;
            break;
          case 'enterprise':
            phoneLimit = 100;
            smsLimit = 25000;
            break;
          default:
            phoneLimit = 1;
            smsLimit = 100;
        }

        // Attempt to fetch actual SMS usage data, default to 0 if unavailable
        let smsReceived = 0;
        let smsSent = 0;

        // Only try to fetch analytics data if we have assistants
        if (transformedAssistants.length > 0) {
          try {
            // Try to get analytics data if available

            // Use the appropriate Database types
            const analyticsQuery = await _supabase

              .from('interactions')
              .select('id, assistant_id, chat')
              .in(
                'assistant_id',
                transformedAssistants.map(a => a.id)
              );

            // Execute the query and safely extract results
            const result = await analyticsQuery;

            // Safely extract data with proper fallbacks
            const analyticsData = result?.data || [];
            const analyticsError = result?.error || null;

            // Calculate counts from the interactions data by parsing the chat field
            if (!analyticsError && analyticsData) {
              // Process each item to determine if it's incoming or outgoing
              smsReceived = analyticsData.filter(item => {
                if (!item.chat || typeof item.chat !== 'string') return false;
                try {
                  // Type-safe JSON parsing with explicit type casting
                  const chatData = JSON.parse(item.chat) as Record<string, unknown>;

                  // Safely check properties with type guards
                  if (chatData && typeof chatData === 'object') {
                    if ('direction' in chatData && typeof chatData.direction === 'string') {
                      return chatData.direction === 'incoming';
                    }
                    return 'from' in chatData;
                  }
                  return false;
                } catch (_parseError) {
                  // Use underscore prefix for unused variables
                  return false;
                }
              }).length;

              smsSent = analyticsData.filter(item => {
                if (!item.chat || typeof item.chat !== 'string') return false;
                try {
                  // Type-safe JSON parsing with explicit type casting
                  const chatData = JSON.parse(item.chat) as Record<string, unknown>;

                  // Safely check properties with type guards
                  if (chatData && typeof chatData === 'object') {
                    if ('direction' in chatData && typeof chatData.direction === 'string') {
                      return chatData.direction === 'outgoing';
                    }
                    return 'to' in chatData;
                  }
                  return false;
                } catch (_parseError) {
                  // Use underscore prefix for unused variables
                  return false;
                }
              }).length;
            } else if (analyticsError) {
              if (analyticsError.code === 'PGRST116') {
                // No rows found - this is not an error
                console.log('No analytics records found');
              } else if (
                analyticsError.code === 'PGRST301' ||
                (analyticsError.message &&
                  analyticsError.message.includes('The schema must be one of the following'))
              ) {
                // Schema access error - try to fall back to public schema
                console.warn('Schema access error:', analyticsError);
                console.info(
                  'This error occurs when Supabase needs schema permissions. Run the migrations to fix this.'
                );

                try {
                  // Fallback to analytics schema
                  const fallbackResult = await _supabase

                    .from('interactions')
                    .select('id, assistant_id, chat')
                    .in(
                      'assistant_id',
                      transformedAssistants.map(a => a.id)
                    );

                  if (!fallbackResult.error && fallbackResult.data) {
                    // Process the data using the same logic
                    const fallbackData = fallbackResult.data;

                    // Calculate counts from the fallback interactions data
                    smsReceived = processSmsData(fallbackData, 'incoming');
                    smsSent = processSmsData(fallbackData, 'outgoing');
                  }
                } catch (fallbackError) {
                  console.warn('Fallback to public schema failed:', fallbackError);
                }
              } else {
                // Other errors
                console.warn('Analytics data error:', analyticsError);
              }
            }
          } catch (error: unknown) {
            // Improved error handling with better context
            if (error && typeof error === 'object') {
              // First check if it's an empty object error
              if (Object.keys(error as Record<string, unknown>).length === 0) {
                console.warn('Could not fetch SMS analytics data: Empty error object received');
              } else {
                try {
                  // Try to create a meaningful error message
                  const errorJson = JSON.stringify(error, (key, value) => {
                    if (typeof value === 'function') return '[Function]' as unknown as string;
                    if (typeof value === 'symbol') return value.toString();
                    if (value instanceof Error) return { name: value.name, message: value.message };
                    return value as unknown as string; // Safe type assertion
                  });

                  console.warn(
                    'Could not fetch SMS analytics data:',
                    'message' in error &&
                      typeof (error as Record<string, unknown>).message === 'string'
                      ? ((error as Record<string, unknown>).message as string)
                      : errorJson === '{}'
                        ? 'Unknown error'
                        : errorJson
                  );
                } catch (_jsonError) {
                  console.warn('Could not fetch SMS analytics data: Error details unavailable');
                }
              }
            } else {
              console.warn('Could not fetch SMS analytics data:', String(error));
            }

            // Keep the default values of 0, don't use dummy data
          }
        }

        // Calculate percentages
        const phonePercentage =
          phoneLimit > 0 ? Math.round((phoneNumbersUsed / phoneLimit) * 100) : 0;
        const smsReceivedPercentage = smsLimit > 0 ? Math.round((smsReceived / smsLimit) * 100) : 0;
        const smsSentPercentage = smsLimit > 0 ? Math.round((smsSent / smsLimit) * 100) : 0;

        // Set state
        setPlanType(planType.charAt(0).toUpperCase() + planType.slice(1));
        setPhoneNumbers({
          used: phoneNumbersUsed,
          total: phoneLimit,
          percentage: phonePercentage,
        });
        setSmsReceived({
          used: smsReceived,
          total: smsLimit,
          percentage: smsReceivedPercentage,
        });
        setSmsSent({
          used: smsSent,
          total: smsLimit,
          percentage: smsSentPercentage,
        });
      } catch (error: unknown) {
        // Enhanced error handling
        if (error && typeof error === 'object') {
          // First check if it's an empty object error
          if (Object.keys(error as Record<string, unknown>).length === 0) {
            console.warn('Received empty error object from database query');
            console.error('Error fetching data: Could not connect to database');
          } else {
            try {
              // Try to create a meaningful error message with safe stringification
              const errorJson = JSON.stringify(error, (key, value) => {
                if (typeof value === 'function') return '[Function]' as unknown as string;
                if (typeof value === 'symbol') return value.toString();
                if (value instanceof Error)
                  return {
                    name: value.name,
                    message: value.message,
                    stack: value.stack?.split('\n').slice(0, 3).join('\n'), // Truncate stack for readability
                  };
                return value as unknown as string; // Safe type assertion
              });

              console.error(
                'Error fetching data:',
                'message' in error && typeof (error as Record<string, unknown>).message === 'string'
                  ? ((error as Record<string, unknown>).message as string)
                  : errorJson === '{}'
                    ? 'Unknown error'
                    : errorJson
              );
            } catch (_jsonError) {
              // Use underscore to indicate unused variable
              console.error('Error fetching data: Unable to stringify error object');
            }
          }
        } else {
          console.error('Error fetching data:', String(error));
        }

        // Set empty or zero values instead of using dummy data
        setAssistants([]);
        setPlanType('Free'); // Default, not dummy
        setPhoneNumbers({
          used: 0,
          total: 1,
          percentage: 0,
        });
        setSmsReceived({
          used: 0,
          total: 100,
          percentage: 0,
        });
        setSmsSent({
          used: 0,
          total: 100,
          percentage: 0,
        });
      } finally {
        setLoading(false);
      }
    };

    // Only fetch if props aren't provided
    if (!propPlanType || !propPhoneNumbers || !propSmsReceived || !propSmsSent) {
      fetchData();
    }
  }, [
    _supabase,
    selectedAssistant,
    propPlanType,
    propPhoneNumbers,
    propSmsReceived,
    propSmsSent,
    dateRange,
  ]);

  // Helper function to process SMS data and count by direction
  const processSmsData = (data: { chat?: string | null }[], direction: 'incoming' | 'outgoing') => {
    return data.filter(item => {
      if (!item.chat || typeof item.chat !== 'string') return false;
      try {
        // Type-safe JSON parsing with explicit type casting
        const chatData = JSON.parse(item.chat) as Record<string, unknown>;

        // Safely check properties with type guards
        if (chatData && typeof chatData === 'object') {
          if ('direction' in chatData && typeof chatData.direction === 'string') {
            return chatData.direction === direction;
          }
          // Fallback to checking from/to properties
          return direction === 'incoming' ? 'from' in chatData : 'to' in chatData;
        }
        return false;
      } catch (_parseError) {
        // Use underscore prefix for unused variables
        return false;
      }
    }).length;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Plan Usage</h2>
        {assistants.length > 0 ? (
          <Select value={selectedAssistant} onValueChange={setSelectedAssistant}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select Assistant" />
            </SelectTrigger>
            <SelectContent>
              {assistants.map(assistant => (
                <SelectItem key={assistant.id} value={assistant.id}>
                  {assistant.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <span className="text-sm text-muted-foreground">No assistants available</span>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Message Usage</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="mt-2 space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-2 w-full" />
              </div>
            ) : currentAssistant ? (
              <div className="mt-2 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>
                    {currentAssistant.plan.messages.current.toLocaleString()} /{' '}
                    {currentAssistant.plan.messages.limit.toLocaleString()}
                  </span>
                  <span className="text-muted-foreground">
                    {currentAssistant.plan.messages.percentage}%
                  </span>
                </div>
                <Progress value={currentAssistant.plan.messages.percentage} />
              </div>
            ) : (
              <div className="mt-2 text-sm text-muted-foreground">No assistant data available</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Token Usage</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="mt-2 space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-2 w-full" />
              </div>
            ) : currentAssistant ? (
              <div className="mt-2 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>
                    {currentAssistant.plan.tokens.current.toLocaleString()} /{' '}
                    {currentAssistant.plan.tokens.limit.toLocaleString()}
                  </span>
                  <span className="text-muted-foreground">
                    {currentAssistant.plan.tokens.percentage}%
                  </span>
                </div>
                <Progress value={currentAssistant.plan.tokens.percentage} />
              </div>
            ) : (
              <div className="mt-2 text-sm text-muted-foreground">No assistant data available</div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="mb-6">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Plan Usage</CardTitle>
          <CardDescription>
            Your current plan:{' '}
            {loading ? (
              <Skeleton className="inline-block h-4 w-20" />
            ) : (
              <span className="font-semibold">{planType}</span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="mb-1 flex justify-between text-sm">
              <span>Phone Numbers</span>
              {loading ? (
                <Skeleton className="h-4 w-12" />
              ) : phoneNumbers ? (
                <span className="font-medium">
                  {phoneNumbers.used}/{phoneNumbers.total}
                </span>
              ) : null}
            </div>
            {loading ? (
              <Skeleton className="h-2 w-full" />
            ) : phoneNumbers ? (
              <Progress value={phoneNumbers.percentage} className="h-2" />
            ) : null}
          </div>

          <div>
            <div className="mb-1 flex justify-between text-sm">
              <span>SMS Received</span>
              {loading ? (
                <Skeleton className="h-4 w-12" />
              ) : smsReceived ? (
                <span className="font-medium">
                  {smsReceived.used}/{smsReceived.total}
                </span>
              ) : null}
            </div>
            {loading ? (
              <Skeleton className="h-2 w-full" />
            ) : smsReceived ? (
              <Progress
                value={smsReceived.percentage}
                className={`h-2 ${smsReceived.percentage > 80 ? 'bg-red-500' : ''}`}
              />
            ) : null}
          </div>

          <div>
            <div className="mb-1 flex justify-between text-sm">
              <span>SMS Sent</span>
              {loading ? (
                <Skeleton className="h-4 w-12" />
              ) : smsSent ? (
                <span className="font-medium">
                  {smsSent.used}/{smsSent.total}
                </span>
              ) : null}
            </div>
            {loading ? (
              <Skeleton className="h-2 w-full" />
            ) : smsSent ? (
              <Progress
                value={smsSent.percentage}
                className={`h-2 ${smsSent.percentage > 80 ? 'bg-red-500' : ''}`}
              />
            ) : null}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PlanUsage;
