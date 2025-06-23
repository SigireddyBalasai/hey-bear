'use client';

import { useEffect, useState } from 'react';

import { MessageSquare, Phone, Zap } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useLoadingState } from '@/hooks/useLoadingState';
import type { Assistant, PlanUsageProps } from '@/types/usage.types';
import { createUsageMetric, defaultUsageMetric } from '@/types/usage.types';
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
  const [phoneNumbers, setPhoneNumbers] = useState(propPhoneNumbers ?? defaultUsageMetric);
  const [smsReceived, setSmsReceived] = useState(propSmsReceived ?? defaultUsageMetric);
  const [smsSent, setSmsSent] = useState(propSmsSent ?? defaultUsageMetric);
  const { isLoading: loading, setIsLoading: setLoading } = useLoadingState(propLoading ?? true);
  const [selectedAssistant, setSelectedAssistant] = useState<string>(
    propSelectedAssistant ?? 'default'
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
            return;
          }

          // Try to fetch from assistants schema first, fall back to public if needed
          let assistantsData: { id: string; name: string }[] = [];

          try {
            // Since we no longer have a separate users table, fetch assistants directly using auth user ID
            // The assistants.user_id should now contain auth.users.id directly
            const result = await _supabase.from('assistants').select('*').eq('user_id', user.id);

            if (result.error) {
              console.error('Supabase assistants fetch error:', result.error);
              assistantsData = []; // Use empty array on error
            } else {
              assistantsData = (result.data ?? []).filter(
                assistant =>
                  assistant &&
                  assistant !== null &&
                  'id' in assistant &&
                  'name' in assistant &&
                  assistant.id?.length > 0 &&
                  assistant.name?.length > 0
              );
            }
          } catch (schemaError) {
            console.error('Assistants schema not accessible:', schemaError);
            assistantsData = [];
          }

          // If no assistants, clear state and return early
          if (assistantsData.length === 0) {
            setAssistants([]);
            setSelectedAssistant('default');
            setPhoneNumbers(createUsageMetric(0, 0));
            setSmsReceived(createUsageMetric(0, 0));
            setSmsSent(createUsageMetric(0, 0));
            setPlanType('Free');
            setLoading(false);

            return;
          }

          // Fetch activity and limits data for each assistant
          const transformedAssistants: Assistant[] = await Promise.all(
            assistantsData
              .filter(
                (assistant): assistant is { id: string; name: string } =>
                  assistant &&
                  assistant !== null &&
                  'id' in assistant &&
                  'name' in assistant &&
                  assistant.id?.length > 0 &&
                  assistant.name?.length > 0
              )
              .map(async assistant => {
                // Fetch activity data
                const { data: activityData } = await _supabase
                  .from('assistant_activity')
                  .select('total_messages, total_tokens')
                  .eq('assistant_id', assistant.id)
                  .single();

                // Fetch limits data
                const { data: limitsData } = await _supabase
                  .from('assistant_usage_limits')
                  .select('message_limit, token_limit')
                  .eq('assistant_id', assistant.id)
                  .single();

                return {
                  id: assistant.id,
                  name: assistant.name,
                  activity: activityData ?? undefined,
                  limits: limitsData ?? undefined,
                };
              })
          );

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
                phoneNumbersData = result.data ?? [];
              }
            } catch (error: unknown) {
              console.warn('Could not fetch phone numbers:', error);
              // Continue with empty data rather than failing
            }
          }

          // Calculate usage data based on actual data, not dummy values
          const phoneNumbersUsed = phoneNumbersData?.length ?? 0;
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
              const analyticsQuery = _supabase
                .from('interactions')
                .select('*')
                .in(
                  'assistant_id',
                  transformedAssistants.map(a => a.id)
                );

              // Execute the query and safely extract results
              const result = await analyticsQuery;

              // Safely extract data with proper fallbacks
              const analyticsData = result?.data ?? [];
              const analyticsError = result?.error ?? null;

              if (!analyticsError && analyticsData) {
                // Count all valid interactions without direction filtering
                const totalMessages = analyticsData.filter(item => {
                  const chatField = item.chat;

                  if (!chatField || !(chatField as string)) return false;
                  try {
                    // Type-safe JSON parsing
                    const chatData = JSON.parse(chatField as string) as unknown;

                    // Return true if we have valid chat data
                    return chatData && chatData !== null;
                  } catch {
                    // Parse error - skip this item
                    return false;
                  }
                }).length;

                // Use the total count for both received and sent
                smsReceived = totalMessages;
                smsSent = totalMessages;
              } else if (analyticsError) {
                if (analyticsError.code === 'PGRST116') {
                  // No rows found - this is not an error
                } else if (
                  analyticsError.code === 'PGRST301' ||
                  analyticsError.message?.includes('The schema must be one of the following')
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
                      .select('*') // Select all columns
                      .in(
                        'assistant_id',
                        transformedAssistants.map(a => a.id)
                      );

                    if (!fallbackResult.error && fallbackResult.data) {
                      // Process the data using the same logic
                      const fallbackData = fallbackResult.data;

                      // Calculate total message count without direction filtering
                      const totalMessages = fallbackData.filter(item => {
                        const chatField = item.chat;

                        if (!chatField || !(chatField as string)) return false;
                        try {
                          const chatData = JSON.parse(chatField as string) as unknown;

                          return chatData && chatData !== null;
                        } catch {
                          return false;
                        }
                      }).length;

                      smsReceived = totalMessages;
                      smsSent = totalMessages;
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
              let errorMessage = 'Unknown error';

              if (error instanceof Error) {
                errorMessage = error.message;
              } else if (error && error !== null && 'message' in (error as object)) {
                errorMessage = String((error as { message: unknown }).message);
              } else {
                errorMessage = String(error);
              }

              console.warn('Could not fetch SMS analytics data:', errorMessage);

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
      setLoading(false);
    };

    // Function to handle setting default values on error
    // This is now handled inside the try/catch of our withErrorHandling

    // Only fetch if props aren't provided
    if (!propPlanType || !propPhoneNumbers || !propSmsReceived || !propSmsSent) {
      void fetchData();
    }
  }, [
    _supabase,
    selectedAssistant,
    propPlanType,
    propPhoneNumbers,
    propSmsReceived,
    propSmsSent,
    dateRange,
    setLoading,
  ]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Plan Usage</h2>
        {!assistantSelectionDisabled && assistants.length > 0 && (
          <AssistantSelector
            assistants={assistants}
            selectedAssistant={selectedAssistant}
            onAssistantChange={setSelectedAssistant}
            isLoading={loading}
          />
        )}
      </div>

      {assistants.length === 0 ? (
        <div className="p-6 text-center text-muted-foreground border rounded-lg bg-muted">
          <p className="text-lg font-medium mb-2">No assistants found</p>
          <p className="mb-4">
            You have not created any assistants yet. Get started by creating your first assistant!
          </p>
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2">
            <UsageDisplay
              title="Message Usage"
              usage={{
                current: currentAssistant?.activity?.total_messages ?? 0,
                limit: currentAssistant?.limits?.message_limit ?? 0,
                percentage:
                  currentAssistant?.limits?.message_limit &&
                  currentAssistant?.limits?.message_limit > 0
                    ? Math.round(
                        ((currentAssistant?.activity?.total_messages ?? 0) /
                          currentAssistant.limits.message_limit) *
                          100
                      )
                    : 0,
              }}
              isLoading={loading}
              variant="card"
              description="Total messages sent this billing cycle"
              icon={<MessageSquare className="h-4 w-4 text-blue-600" />}
            />

            <UsageDisplay
              title="Token Usage"
              usage={{
                current: currentAssistant?.activity?.total_tokens ?? 0,
                limit: currentAssistant?.limits?.token_limit ?? 0,
                percentage:
                  currentAssistant?.limits?.token_limit && currentAssistant?.limits?.token_limit > 0
                    ? Math.round(
                        ((currentAssistant?.activity?.total_tokens ?? 0) /
                          currentAssistant.limits.token_limit) *
                          100
                      )
                    : 0,
              }}
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
        </>
      )}
    </div>
  );
};

export default PlanUsage;
