import type { TimeSeriesDataPoint } from '@/types/admin.types';

export function useChartData(
  timeSeriesData: TimeSeriesDataPoint[],
  tokenDistribution: { type: string; tokens: number; percentage: number }[]
) {
  const generateTimeSeriesData = () => {
    return {
      labels: timeSeriesData.map(entry => {
        const date = new Date(entry.date);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      }),
      datasets: [
        {
          label: 'Daily Cost ($)',
          data: timeSeriesData.map(entry => entry.costs),
          borderColor: 'rgb(59, 130, 246)',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          tension: 0.3,
          fill: true,
        },
      ],
    };
  };

  const generateTokenUsageData = () => {
    return {
      labels: timeSeriesData.map(entry => {
        const date = new Date(entry.date);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      }),
      datasets: [
        {
          label: 'Tokens Used',
          data: timeSeriesData.map(entry => entry.tokens),
          borderColor: 'rgb(16, 185, 129)',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          tension: 0.3,
          fill: true,
        },
      ],
    };
  };

  const generateTokenDistributionData = () => {
    return {
      labels: tokenDistribution.map(item => item.type),
      datasets: [
        {
          data: tokenDistribution.map(item => item.tokens),
          backgroundColor: ['rgba(59, 130, 246, 0.7)', 'rgba(16, 185, 129, 0.7)'],
          borderColor: ['rgba(59, 130, 246, 1)', 'rgba(16, 185, 129, 1)'],
          borderWidth: 1,
        },
      ],
    };
  };

  return {
    generateTimeSeriesData,
    generateTokenUsageData,
    generateTokenDistributionData,
  };
}
