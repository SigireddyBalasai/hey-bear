"use client";

import { Line } from 'react-chartjs-2';
import { useMemo } from 'react';
import { ChartData, ChartOptions } from 'chart.js';

interface UsageChartProps {
  title: string;
  data: ChartData<'line'>;
  yAxisLabel?: string;
  isCurrency?: boolean;
}

export function UsageChart({ 
  title, 
  data, 
  yAxisLabel = '', 
  isCurrency = false 
}: UsageChartProps) {
  
  const options = useMemo<ChartOptions<'line'>>(() => ({
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
          display: Boolean(yAxisLabel),
          text: yAxisLabel,
        },
        ticks: {
          callback: (value) => isCurrency ? `$${value}` : value
        }
      },
    },
  }), [title, yAxisLabel, isCurrency]);

  return (
    <div className="h-80">
      <Line data={data} options={options} />
    </div>
  );
}
