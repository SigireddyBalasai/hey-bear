'use client';

import { useEffect, useState } from 'react';

import { MessageSquare, Phone, Zap } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useLoadingState } from '@/hooks/useLoadingState';
import type { Assistant, PlanUsageProps } from '@/types/usage.types';
import { createUsageMetric, defaultUsageMetric } from '@/types/usage.types';
import { countChatsByDirection } from '@/utils/chat-utils';
import { withErrorHandling } from '@/utils/error-handling';
import { capitalizeFirstLetter, getPlanLimits } from '@/utils/plan-utils';
import { createClient } from '@/utils/supabase/client';

import { AssistantSelector } from './AssistantSelector';
import { useData } from './DataContext';
import { PlanInfoHeader } from './PlanInfoHeader';
import { UsageDisplay } from './UsageDisplay';

const PlanUsage = ({
  planType: propPlanType,
  phoneNumbers: propPhoneNumbers,
  smsReceived: propSmsReceived,
  smsSent: propSmsSent,
  loading: propLoading,
  selectedAssistant: propSelectedAssistant,
  assistantSelectionDisabled = false,
}: Partial<PlanUsageProps> = {}) => {
  const [planType, setPlanType] = useState<string>(propPlanType ?? 'Free');
  const [phoneNumbers, setPhoneNumbers] = useState(propPhoneNumbers || defaultUsageMetric);
  const [smsReceived, setSmsReceived] = useState(propSmsReceived || defaultUsageMetric);
  const [smsSent, setSmsSent] = useState(propSmsSent || defaultUsageMetric);
  const { isLoading: loading, setIsLoading: setLoading } = useLoadingState(propLoading ?? true);
  const [selectedAssistant, setSelectedAssistant] = useState<string>(
    propSelectedAssistant || 'default'
  );
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
      await withErrorHandling(
        async () => {
          // Get current user
          const {
            data: { user },
            error: authError,
          } = await _supabase.auth.getUser();

          if (authError || !user) {
            console.error('User not authenticated:', authError);
            return;
          }

          // Try to fetch from assistants schema first, fall back to public if needed
          let assistantsData: Array<{ id: string; name: string }> = [];

          try {
            // Since we no longer have a separate users table, fetch assistants directly using auth user ID
            // The assistants.user_id should now contain auth.users.id directly
            const result = await _supabase

              .from('assistants')
              .select('id, name')
              .eq('user_id', user.id);

            if (result.error) {
              console.warn('Error fetching assistants:', result.error);
              assistantsData = []; // Use empty array on error
            } else {
              // Ensure we have valid IDs and names in the assistants data
              assistantsData = (result.data || []).map(
                (assistant: { id: string; name: string }) => ({
                  id: typeof assistant.id === 'string' ? assistant.id : '',
                  name: typeof assistant.name === 'string' ? assistant.name : 'Unknown Assistant',
                })
              );
            }
          } catch (schemaError) {
            console.error('Assistants schema not accessible:', schemaError);
            // Don't use default/dummy data - use empty array
            assistantsData = [];
          }

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
                    percentage:
                      tokensLimit > 0 ? Math.round((tokensCurrent / tokensLimit) * 100) : 0,
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

          // Get plan limits from utility function
          const { phoneLimit, smsLimit } = getPlanLimits(planType);

          // Attempt to fetch actual SMS usage data, default to 0 if unavailable
          let smsReceived = 0;
          let smsSent = 0;

          // Only try to fetch analytics data if we have assistants
          if (transformedAssistants.length > 0) {
            try {
              // Try to get analytics data if available
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
                  const chatField = item.chat;
                  if (!chatField || typeof chatField !== 'string') return false;
                  try {
                    // Type-safe JSON parsing with explicit type casting
                    const chatData = JSON.parse(chatField) as Record<string, unknown>;

                    // Safely check properties with type guards
                    if (chatData && typeof chatData === 'object') {
                      if ('direction' in chatData && typeof chatData.direction === 'string') {
                        return chatData.direction === 'incoming';
                      }
                      return 'from' in chatData;
                    }
                    return false;
                  } catch {
                    // Parse error - skip this item
                    return false;
                  }
                }).length;

                smsSent = analyticsData.filter(item => {
                  const chatField = item.chat;
                  if (!chatField || typeof chatField !== 'string') return false;
                  try {
                    // Type-safe JSON parsing with explicit type casting
                    const chatData = JSON.parse(chatField) as Record<string, unknown>;

                    // Safely check properties with type guards
                    if (chatData && typeof chatData === 'object') {
                      if ('direction' in chatData && typeof chatData.direction === 'string') {
                        return chatData.direction === 'outgoing';
                      }
                      return 'to' in chatData;
                    }
                    return false;
                  } catch {
                    // Parse error - skip this item
                    return false;
                  }
                }).length;
              } else if (analyticsError) {
                if (analyticsError.code === 'PGRST116') {
                  // No rows found - this is not an error
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
                      .from('interactions') // Ensure this is the correct table name
                      .select('id, assistant_id, chat') // Ensure 'chat' is selected here
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
                      if (value instanceof Error)
                        return { name: value.name, message: value.message };
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
                  } catch {
                    console.warn('Could not fetch SMS analytics data: Error details unavailable');
                  }
                }
              } else {
                console.warn('Could not fetch SMS analytics data:', String(error));
              }

              // Keep the default values of 0, don't use dummy data
            }
          }

          // Set state with capitalized plan type
          setPlanType(capitalizeFirstLetter(planType));

          // Create usage metric objects using our utility function
          setPhoneNumbers(createUsageMetric(phoneNumbersUsed, phoneLimit));
          setSmsReceived(createUsageMetric(smsReceived, smsLimit));
          setSmsSent(createUsageMetric(smsSent, smsLimit));
        },
        {
          fallbackMessage: 'Failed to fetch plan usage data',
          context: 'PlanUsage',
          showToast: true,
        }
      );

      // Handle cleanup and defaults on error or completion
      setLoading(false);
    };

    // Function to handle setting default values on error
    // This is now handled inside the try/catch of our withErrorHandling

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

  // Helper function to process SMS data - simplified to use the shared utility
  const processSmsData = countChatsByDirection;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Plan Usage</h2>
        {!assistantSelectionDisabled && (
          <AssistantSelector
            assistants={assistants}
            selectedAssistant={selectedAssistant}
            onAssistantChange={setSelectedAssistant}
            isLoading={loading}
          />
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <UsageDisplay
          title="Message Usage"
          usage={currentAssistant?.plan.messages}
          isLoading={loading}
          variant="card"
          description="Total messages sent this billing cycle"
          icon={<MessageSquare className="h-4 w-4 text-blue-600" />}
        />

        <UsageDisplay
          title="Token Usage"
          usage={currentAssistant?.plan.tokens}
          isLoading={loading}
          variant="card"
          description="Total tokens processed this billing cycle"
          icon={<Zap className="h-4 w-4 text-amber-600" />}
        />
      </div>

      <Card className="mb-6">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Plan Usage</CardTitle>
          <PlanInfoHeader
            planType={planType}
            isLoading={loading}
            upgradePath="/dashboard/billing"
            onUpgrade={() => (window.location.href = '/dashboard/billing')}
            variant="default"
          />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center">
              <Phone className="h-4 w-4 text-purple-600" />
            </div>
            <div className="flex-1">
              <UsageDisplay
                title="Phone Numbers"
                usage={phoneNumbers}
                isLoading={loading}
                variant="inline"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
              <MessageSquare className="h-4 w-4 text-green-600" />
            </div>
            <div className="flex-1">
              <UsageDisplay
                title="SMS Received"
                usage={smsReceived}
                isLoading={loading}
                variant="inline"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
              <MessageSquare className="h-4 w-4 text-blue-600" />
            </div>
            <div className="flex-1">
              <UsageDisplay
                title="SMS Sent"
                usage={smsSent}
                isLoading={loading}
                variant="inline"
                dangerThreshold={70}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PlanUsage;
