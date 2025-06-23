import { Pie } from 'react-chartjs-2';

import { Pie } from 'react-chartjs-2';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import type {
  AdminTokenDistribution,
  AdminTokenDistributionChartProps,
  AdminTotalStats,
} from '@/types/admin.types';

export function TokenDistributionChart({
  tokenDistribution,
  totalStats,
}: AdminTokenDistributionChartProps) {
  const generateTokenDistributionData = () => ({
    labels: tokenDistribution.map(item => item.type),
    datasets: [
      {
        data: tokenDistribution.map(item => item.tokens),
        backgroundColor: ['rgba(59, 130, 246, 0.7)', 'rgba(16, 185, 129, 0.7)'],
        borderColor: ['rgba(59, 130, 246, 1)', 'rgba(16, 185, 129, 1)'],
        borderWidth: 1,
      },
    ],
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Token Distribution</CardTitle>
        <CardDescription>Breakdown of input vs output tokens</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <Pie
            data={generateTokenDistributionData()}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: {
                  position: 'bottom',
                },
                tooltip: {
                  callbacks: {
                    label(context) {
                      const dataPoint = tokenDistribution[context.dataIndex];

                      return `${dataPoint.type}: ${String(dataPoint.tokens.toLocaleString())} (${String(dataPoint.percentage)}%)`;
                    },
                  },
                },
              },
            }}
          />
        </div>

        <Separator className="my-4" />

        <div className="space-y-3">
          {tokenDistribution.map((item, index) => (
            <div key={index} className="flex justify-between text-sm">
              <div className="flex items-center">
                <div
                  className="mr-2 h-3 w-3 rounded-full"
                  style={{
                    backgroundColor:
                      index === 0 ? 'rgba(59, 130, 246, 0.7)' : 'rgba(16, 185, 129, 0.7)',
                  }}
                />
                <span>{item.type}</span>
              </div>
              <span className="font-medium">
                {item.tokens.toLocaleString()} ({item.percentage}%)
              </span>
            </div>
          ))}
          <div className="flex justify-between border-t pt-2 text-sm font-semibold">
            <span>Total Tokens</span>
            <span>{totalStats.tokens.toLocaleString()}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
