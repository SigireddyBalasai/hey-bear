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

  // Fetch assistants from database
  useEffect(() => {
    const fetchAssistants = async () => {
      try {
        // Use type assertion to bypass restrictive Supabase types
        const supabaseClient = _supabase as unknown as {
          from: (table: string) => {
            select: (columns: string) => Promise<{
              data: Record<string, unknown>[] | null;
              error: Record<string, unknown> | null;
            }>;
          };
        };

        const { data: assistantsData, error } = await supabaseClient
          .from('assistants')
          .select('id, name, messages_used, message_limit, tokens_used, token_limit');

        if (error) {
          console.error('Error fetching assistants:', error);
          return;
        }

        // Transform data and calculate real usage values
        const transformedAssistants: Assistant[] = (assistantsData ?? []).map(
          (assistant: Record<string, unknown>) => {
            // Default values if no usage data available
            const messagesCurrent = (assistant.messages_used as number | undefined) ?? 0;
            const messagesLimit = (assistant.message_limit as number | undefined) ?? 1000;
            const tokensCurrent = (assistant.tokens_used as number | undefined) ?? 0;
            const tokensLimit = (assistant.token_limit as number | undefined) ?? 100_000;

            return {
              id: assistant.id as string,
              name: assistant.name as string,
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
          }
        );

        setAssistants(transformedAssistants);

        // Set default selection to first assistant if available
        if (transformedAssistants.length > 0 && selectedAssistant === 'default') {
          setSelectedAssistant(transformedAssistants[0].id);
        }
      } catch (error) {
        console.error('Error fetching assistants:', error);
      }
    };

    fetchAssistants();
  }, [_supabase, selectedAssistant]);

  // If props aren't provided, fetch the data
  useEffect(() => {
    if (propPlanType && propPhoneNumbers && propSmsReceived && propSmsSent) {
      return; // Don't fetch if props are provided
    }

    const fetchUsageData = async () => {
      setLoading(true);
      try {
        // Fetch real usage data from API
        const response = await fetch('/api/dashboard/usage');
        if (!response.ok) {
          throw new Error('Failed to fetch usage data');
        }

        const data = await response.json();

        setPlanType(data.planType ?? 'Free');

        if (data.phoneNumbers) {
          setPhoneNumbers({
            used: data.phoneNumbers.used ?? 0,
            total: data.phoneNumbers.total ?? 0,
            percentage: data.phoneNumbers.percentage ?? 0,
          });
        }

        if (data.smsReceived) {
          setSmsReceived({
            used: data.smsReceived.used ?? 0,
            total: data.smsReceived.total ?? 0,
            percentage: data.smsReceived.percentage ?? 0,
          });
        }

        if (data.smsSent) {
          setSmsSent({
            used: data.smsSent.used ?? 0,
            total: data.smsSent.total ?? 0,
            percentage: data.smsSent.percentage ?? 0,
          });
        }

        setLoading(false);
      } catch (error) {
        console.error('Error fetching usage data:', error);
        setLoading(false);
      }
    };

    fetchUsageData();
  }, [propPlanType, propPhoneNumbers, propSmsReceived, propSmsSent, dateRange]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Plan Usage</h2>
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
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Message Usage</CardTitle>
          </CardHeader>
          <CardContent>
            {currentAssistant ? (
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
              <div className="mt-2 space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-2 w-full" />
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Token Usage</CardTitle>
          </CardHeader>
          <CardContent>
            {currentAssistant ? (
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
              <div className="mt-2 space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-2 w-full" />
              </div>
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
