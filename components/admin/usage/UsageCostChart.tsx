import { Line } from 'react-chartjs-2';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { TimeSeriesDataPoint } from '@/types/admin.types';

interface UsageCostChartProps {
  timeSeriesData: TimeSeriesDataPoint[];
}

export function UsageCostChart({ timeSeriesData }: UsageCostChartProps) {
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

  return (
    <Card className="md:col-span-2">
      <CardHeader>
        <CardTitle>Cost Over Time</CardTitle>
        <CardDescription>Daily cost for the selected time period</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <Line
            data={generateTimeSeriesData()}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              scales: {
                y: {
                  beginAtZero: true,
                  ticks: {
                    callback: function (value) {
                      return '$' + String(value);
                    },
                  },
                },
              },
              plugins: {
                tooltip: {
                  callbacks: {
                    label: function (context) {
                      const dataIndex = context.dataIndex;
                      const day = timeSeriesData[dataIndex] || { tokens: 0, interactions: 0 };
                      return [
                        `Cost: $${Number(context.raw).toFixed(2)}`,
                        `Tokens: ${day.tokens.toLocaleString()}`,
                        `Interactions: ${String(day.interactions)}`,
                      ];
                    },
                  },
                },
              },
            }}
          />
        </div>
      </CardContent>
    </Card>
  );
}
