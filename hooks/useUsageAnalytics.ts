import { useCallback, useState } from 'react';

import { fetchUsageData } from '@/components/admin/utils/adminUtils';
import type { AnalyticsUserStat, TimeSeriesDataPoint } from '@/types/admin.types';
import { withErrorHandling } from '@/utils/error-handling';
import { createClient } from '@/utils/supabase/client';

export function useUsageAnalytics() {
  const [selectedTimeframe, setSelectedTimeframe] = useState('30d');
  const [selectedModel, setSelectedModel] = useState('all');
  const [selectedAssistant, setSelectedAssistant] = useState('all');
  const [selectedPlan, setSelectedPlan] = useState('all');
  const [assistants, setAssistants] = useState<{ id: string; name: string }[]>([]);
  const [timeSeriesData, setTimeSeriesData] = useState<TimeSeriesDataPoint[]>([]);
  const [tokenDistribution, setTokenDistribution] = useState<
    { type: string; tokens: number; percentage: number }[]
  >([]);
  const [userStats, setUserStats] = useState<AnalyticsUserStat[]>([]);
  const [totalStats, setTotalStats] = useState({
    interactions: 0,
    tokens: 0,
    costs: 0,
    errors: 0,
    activeUsers: 0,
    inputTokens: 0,
    outputTokens: 0,
  });
  const [costTrend, setCostTrend] = useState({
    current: 0,
    previous: 0,
    change: 0,
    isIncrease: false,
  });

  const supabase = createClient();

  const loadUsageData = useCallback(
    async (
      timeframe: string,
      assistantId: string = selectedAssistant,
      plan: string = selectedPlan
    ) => {
      await withErrorHandling(
        async () => {
          const { totalStats, timeSeriesData, userStats } = await fetchUsageData(
            timeframe,
            assistantId,
            plan
          );

          setTotalStats(totalStats);
          const enrichedTimeSeriesData = timeSeriesData.map(point => ({
            ...point,
            totalTokens: point.inputTokens + point.outputTokens,
          }));

          setTimeSeriesData(enrichedTimeSeriesData);

          // Calculate percentage for each user stat
          const userStatsWithPercentage = userStats.map(user => ({
            ...user,
            email: user.email || '',
            fullName: user.fullName || '',
            percentage: totalStats.costs > 0 ? (user.costs / totalStats.costs) * 100 : 0,
          }));

          setUserStats(userStatsWithPercentage);

          if (timeSeriesData.length > 0) {
            const midpoint = Math.floor(timeSeriesData.length / 2);
            const currentPeriod = timeSeriesData.slice(midpoint);
            const previousPeriod = timeSeriesData.slice(0, midpoint);

            const currentCost = currentPeriod.reduce((sum, day) => sum + day.costs, 0);
            const previousCost = previousPeriod.reduce((sum, day) => sum + day.costs, 0);
            const costChange =
              previousCost > 0 ? ((currentCost - previousCost) / previousCost) * 100 : 0;

            setCostTrend({
              current: currentCost,
              previous: previousCost,
              change: Math.abs(costChange),
              isIncrease: costChange > 0,
            });
          }

          const tokenDist = [
            {
              type: 'Input Tokens',
              tokens: totalStats.inputTokens,
              percentage: Math.round((totalStats.inputTokens / totalStats.tokens) * 100) ?? 0,
            },
            {
              type: 'Output Tokens',
              tokens: totalStats.outputTokens,
              percentage: Math.round((totalStats.outputTokens / totalStats.tokens) * 100) ?? 0,
            },
          ];

          setTokenDistribution(tokenDist);
        },
        {
          toastTitle: 'Failed to fetch usage data',
          fallbackMessage: 'Unable to load usage analytics data',
        }
      );
    },
    [selectedAssistant, selectedPlan]
  );

  const fetchAssistants = useCallback(async () => {
    await withErrorHandling(
      async () => {
        const { data: assistantData } = await supabase
          .from('assistants')
          .select('*')
          .eq('pending', false);

        setAssistants(assistantData ?? []);
        await loadUsageData(selectedTimeframe);
      },
      {
        toastTitle: 'Failed to fetch assistants data',
        fallbackMessage: 'Unable to load assistants list',
      }
    );
  }, [selectedTimeframe, loadUsageData, supabase]);

  const handleTimeframeChange = (timeframe: string) => {
    setSelectedTimeframe(timeframe);
    void loadUsageData(timeframe);
  };

  const handleModelChange = (model: string) => {
    setSelectedModel(model);
    void loadUsageData(selectedTimeframe);
  };

  const handleAssistantChange = (assistant: string) => {
    setSelectedAssistant(assistant);
    void loadUsageData(selectedTimeframe, assistant);
  };

  const handlePlanChange = (plan: string) => {
    setSelectedPlan(plan);
    void loadUsageData(selectedTimeframe, selectedAssistant, plan);
  };

  // Data generation functions for charts
  const generateTimeSeriesData = useCallback(() => timeSeriesData, [timeSeriesData]);

  const generateTokenUsageData = useCallback(
    () =>
      timeSeriesData.map(point => ({
        date: point.date,
        inputTokens: point.inputTokens,
        outputTokens: point.outputTokens,
        totalTokens: point.totalTokens,
      })),
    [timeSeriesData]
  );

  const generateTokenDistributionData = useCallback(() => tokenDistribution, [tokenDistribution]);

  return {
    selectedTimeframe,
    selectedModel,
    selectedAssistant,
    selectedPlan,
    assistants,
    timeSeriesData,
    tokenDistribution,
    userStats,
    totalStats,
    costTrend,
    handleTimeframeChange,
    handleModelChange,
    handleAssistantChange,
    handlePlanChange,
    fetchAssistants,
    generateTimeSeriesData,
    generateTokenUsageData,
    generateTokenDistributionData,
  };
}
