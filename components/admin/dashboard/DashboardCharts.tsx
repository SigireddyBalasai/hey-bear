import { Line } from 'react-chartjs-2';
import type { ChartData, ChartOptions } from '@/types/admin.types';

interface DashboardChartsProps {
  timeSeriesData: Array<{
    date: string;
    interactions: number;
    tokens: number;
    cost: number;
  }>;
}

export function DashboardCharts({ timeSeriesData }: DashboardChartsProps) {
  const chartData: ChartData = {
    labels: timeSeriesData.map((data) => data.date),
    datasets: [
      {
        label: 'Interactions',
        data: timeSeriesData.map((data) => data.interactions),
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.1)',
        tension: 0.1,
        fill: true,
      },
      {
        label: 'Token Usage (x1000)',
        data: timeSeriesData.map((data) => Math.round(data.tokens / 1000)),
        borderColor: 'rgb(255, 99, 132)',
        backgroundColor: 'rgba(255, 99, 132, 0.1)',
        tension: 0.1,
        fill: true,
      },
      {
        label: 'Cost Estimate ($)',
        data: timeSeriesData.map((data) => data.cost),
        borderColor: 'rgb(54, 162, 235)',
        backgroundColor: 'rgba(54, 162, 235, 0.1)',
        tension: 0.1,
        fill: true,
      },
    ],
  };

  const chartOptions: ChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Usage Metrics Over Time',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
    interaction: {
      mode: 'index',
      intersect: false,
    },
    elements: {
      point: {
        radius: 3,
        hoverRadius: 5,
      },
    },
  };

  return (
    <div className="h-96">
      <Line data={chartData} options={chartOptions} />
    </div>
  );
}
