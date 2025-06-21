import { Bar, Line } from 'react-chartjs-2';

import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { ChartData } from '@/types/admin.types';
import type { DashboardData, UsageChartItem } from '@/types/interaction.types';

interface UsageChartsProps {
  dashboardData: DashboardData | null;
  generateChartData: () => ChartData;
}

export function UsageCharts({ dashboardData, generateChartData }: UsageChartsProps) {
  return (
    <div className="mb-8">
      <Tabs defaultValue="usage" className="w-full">
        <TabsList className="mb-4 w-full justify-start">
          <TabsTrigger value="usage" className="flex-1 sm:flex-none">
            API Usage
          </TabsTrigger>
          <TabsTrigger value="tokens" className="flex-1 sm:flex-none">
            Token Consumption
          </TabsTrigger>
          <TabsTrigger value="costs" className="flex-1 sm:flex-none">
            Costs
          </TabsTrigger>
        </TabsList>

        <TabsContent value="usage" className="space-y-4">
          <Card className="p-6 shadow-sm">
            <h3 className="mb-2 text-lg font-medium">Message Count Over Time</h3>
            <p className="mb-6 text-sm text-muted-foreground">
              Number of messages processed by the platform
            </p>
            <div className="h-80">
              <Line
                data={generateChartData()}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  scales: {
                    y: {
                      beginAtZero: true,
                    },
                  },
                  plugins: {
                    legend: {
                      position: 'top',
                    },
                    tooltip: {
                      backgroundColor: 'rgba(0, 0, 0, 0.7)',
                      padding: 10,
                      cornerRadius: 6,
                    },
                  },
                  interaction: {
                    mode: 'index',
                    intersect: false,
                  },
                }}
              />
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="tokens" className="space-y-4">
          <Card className="p-6 shadow-sm">
            <h3 className="mb-2 text-lg font-medium">Token Usage</h3>
            <p className="mb-6 text-sm text-muted-foreground">Token usage over time</p>
            <div className="h-80">
              <Bar
                data={{
                  labels: (dashboardData?.usageChart ?? []).map((item: UsageChartItem) => {
                    const date = new Date(item.date);

                    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                  }),
                  datasets: [
                    {
                      label: 'Token Usage',
                      data: (dashboardData?.usageChart ?? []).map(
                        (item: UsageChartItem) => item.tokens
                      ),
                      backgroundColor: 'rgba(53, 162, 235, 0.7)',
                      borderRadius: 4,
                    },
                  ],
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  scales: {
                    y: {
                      beginAtZero: true,
                    },
                  },
                }}
              />
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="costs" className="space-y-4">
          <Card className="p-6 shadow-sm">
            <h3 className="mb-2 text-lg font-medium">Cost Breakdown</h3>
            <p className="mb-6 text-sm text-muted-foreground">Estimated costs over time</p>
            <div className="h-80">
              <Bar
                data={{
                  labels: (dashboardData?.usageChart ?? []).map((item: UsageChartItem) => {
                    const date = new Date(item.date);

                    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                  }),
                  datasets: [
                    {
                      label: 'Estimated Cost ($)',
                      data: (dashboardData?.usageChart ?? []).map(
                        (item: UsageChartItem) => item.cost
                      ),
                      backgroundColor: 'rgba(255, 159, 64, 0.7)',
                      borderRadius: 4,
                    },
                  ],
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  scales: {
                    y: {
                      beginAtZero: true,
                    },
                  },
                }}
              />
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
