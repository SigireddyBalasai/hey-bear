"use client";

import { Line } from 'react-chartjs-2';

interface UsageChartProps {
  title: string;
  data: any;
  type?: 'line' | 'bar';
  yAxisLabel?: string;
  isCurrency?: boolean;
}

export function UsageChart({ 
  title, 
  data, 
  type = 'line', 
  yAxisLabel = '', 
  isCurrency = false 
}: UsageChartProps) {
  
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: title,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: !!yAxisLabel,
          text: yAxisLabel,
        },
        ticks: {
          callback: function(value: any) {
            if (isCurrency) {
              return '$' + value;
            }
            return value;
          }
        }
      },
    },
  };

  return (
    <div className="h-80">
      <Line data={data} options={options} />
    </div>
  );
}
