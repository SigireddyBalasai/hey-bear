import { useCallback, useEffect, useState } from 'react';


import type { AdminDashboardState, ChartData, ChartDataset } from '@/types/dashboard.types';
import type { DashboardData, UsageChartItem } from '@/types/interaction.types';
import { withErrorHandling } from '@/utils/error-handling';

export function useAdminDashboard(user: any, isAdmin: boolean, isLoading: boolean) {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [selectedTimeRange, setSelectedTimeRange] = useState('30d');

  const fetchDashboardData = useCallback(async (): Promise<void> => {
    if (!user || !isAdmin) return;

    setState(prev => ({ ...prev, isLoadingData: true }));

    await withErrorHandling(
      async () => {
        const response = await fetch('/api/admin/dashboard');
        if (!response.ok) {
          throw new Error('Failed to fetch dashboard data');
        }
        const data = (await response.json()) as DashboardData;
        setDashboardData(data);
      },
      {
        toastTitle: 'Dashboard Error',
        fallbackMessage: 'Failed to load dashboard data',
      }
    );
  }, [user]);

  const fetchTimeframeData = async (timeframe: string) => {
    setSelectedTimeRange(timeframe);

    await withErrorHandling(
      async () => {
        const response = await fetch(`/api/admin/usage-stats?timeframe=${timeframe}`);

        if (!response.ok) {
          throw new Error('Failed to fetch usage data');
        }

        const data = (await response.json()) as TimeSeriesResponse;

        setDashboardData((prev: DashboardData | null) => {
          const newUsageChart = data.timeSeriesData;
          const result: DashboardData = {
            usageChart: newUsageChart,
            users: prev?.users ?? { total: 0, activeToday: 0, activeThisWeek: 0 },
            usage: prev?.usage ?? { totalMessages: 0, totalCost: 0 },
          };
          return result;
        });
      },
      {
        toastTitle: 'Usage Data Error',
        fallbackMessage: 'Failed to load usage data',
      }
    );
  };

  const generateChartData = () => {
    if (!dashboardData?.usageChart || dashboardData.usageChart.length === 0) {
      return {
        labels: [],
        datasets: [],
      };
    }

    return {
      labels: dashboardData.usageChart.map((item: UsageChartItem) => {
        const date = new Date(item.date);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      }),
      datasets: [
        {
          label: 'Message Count',
          data: dashboardData.usageChart.map((item: UsageChartItem) => item.count),
          borderColor: 'rgb(53, 162, 235)',
          backgroundColor: 'rgba(53, 162, 235, 0.5)',
          tension: 0.1,
          fill: false,
        },
        {
          label: 'Token Usage (hundreds)',
          data: dashboardData.usageChart.map((item: UsageChartItem) => item.tokens / 100),
          borderColor: 'rgb(255, 99, 132)',
          backgroundColor: 'rgba(255, 99, 132, 0.5)',
          tension: 0.1,
          fill: false,
        },
      ],
    };
  };

  // Load dashboard data when admin auth is complete
  useEffect(() => {
    if (!isLoading && isAdmin && user) {
      void fetchDashboardData();
    }
  }, [isLoading, isAdmin, user, fetchDashboardData]);

  return {
    dashboardData,
    selectedTimeRange,
    fetchTimeframeData,
    generateChartData,
  };
}
