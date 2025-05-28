"use client";
import React from 'react';
import { Line } from 'react-chartjs-2';
import type {
  ChartData,
  ChartOptions} from 'chart.js';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface UsageChartProps {
  title: string;
  data: ChartData<'line'>;
  type?: 'line' | 'bar';
  yAxisLabel?: string;
  isCurrency?: boolean;
}

export function UsageChart({ 
  title, 
  data, 
  type: _type = 'line', 
  yAxisLabel = '', 
  isCurrency = false 
}: UsageChartProps) {
  
  const options: ChartOptions<'line'> = {
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
          callback: function(value) {
            if (isCurrency) {
              return '$' + value.toString();
            }
            return value.toString();
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