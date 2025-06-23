import { Line } from 'react-chartjs-2';

import type {
  AdminDashboardChartProps,
  ChartData,
  ChartOptions,
  TimeSeriesDataPoint,
} from '@/types/admin.types';

export function DashboardCharts({ timeSeriesData }: AdminDashboardChartProps) {
  const chartData: ChartData = {
    labels: timeSeriesData.map(data => data.date),
    datasets: [
      {
        label: 'Interactions',
        data: timeSeriesData.map(data => data.interactions),
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.1)',
        tension: 0.1,
        fill: true,
      },
      {
        label: 'Token Usage (x1000)',
        data: timeSeriesData.map(data => Math.round(data.tokens / 1000)),
        borderColor: 'rgb(255, 99, 132)',
        backgroundColor: 'rgba(255, 99, 132, 0.1)',
        tension: 0.1,
        fill: true,
      },
      {
        label: 'Cost Estimate ($)',
        data: timeSeriesData.map(data => data.costs),
        borderColor: 'rgb(54, 162, 235)',
        backgroundColor: 'rgba(54, 162, 235, 0.1)',
        tension: 0.1,
        fill: true,
      },
    ],
  };

  const chartOptions: ChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      tooltip: {
        callbacks: {
          label: (context: unknown) => {
            const ctx = context as { dataset: { label: string }; parsed: { y: number } };

            return `${ctx.dataset.label}: ${ctx.parsed.y}`;
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: (value: string | number) => value.toString(),
        },
      },
    },
  };

  return (
    <div className="h-96">
      <Line data={chartData} options={chartOptions} />
    </div>
  );
}
