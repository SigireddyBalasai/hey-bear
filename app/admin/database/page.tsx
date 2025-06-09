'use client';

import { useEffect, useState } from 'react';

import { AlertCircle, ArchiveIcon, BarChart, Calendar, Database, RefreshCw } from 'lucide-react';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useMultipleLoadingStates } from '@/hooks/useLoadingState';
import { showSuccess, withErrorHandling } from '@/utils/error-handling';

type MaintenanceAction = 'vacuum' | 'refresh' | 'aggregate' | 'partition' | 'archive' | 'full';

// Database stats types
interface TableSizeData {
  table_name: string;
  size_bytes: number;
  size_pretty: string;
  total_rows: number;
  bloat_percentage: number;
  table_size: string;
  bloat_size: string;
}

interface TableRowCountData {
  table_name: string;
  row_count: number;
}

interface IndexStatData {
  table_name: string;
  index_name: string;
  index_size: string;
  scans: number;
  last_used: string;
}

// Helper function for formatting bytes
const formatBytes = (bytes: number) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const size = sizes[i];
  const value = Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2));
  return `${String(value)} ${size || 'Bytes'}`;
};

// Removed custom interfaces - use Supabase types directly

export default function DatabasePage() {
  // Consolidated loading states using useMultipleLoadingStates
  const { loadingStates, setLoadingState } = useMultipleLoadingStates([
    'pageLoading',
    'vacuum',
    'refresh',
    'aggregate',
    'partition',
    'archive',
    'full',
  ] as const);

  // Extract individual loading states for easy access
  const isLoading = loadingStates.pageLoading;

  const [tableSizes, setTableSizes] = useState<TableSizeData[]>([]);
  const [rowCounts, setRowCounts] = useState<TableRowCountData[]>([]);
  const [indexStats, setIndexStats] = useState<IndexStatData[]>([]);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('tables');

  const RUNNING_TEXT = 'Running...';

  useEffect(() => {
    void fetchDatabaseStats();
  }, []);

  const fetchDatabaseStats = async () => {
    setLoadingState('pageLoading', true);

    await withErrorHandling(
      async () => {
        const response = await fetch('/api/admin/database/stats');
        if (!response.ok) {
          throw new Error('Failed to fetch database stats');
        }

        const data = (await response.json()) as {
          success: boolean;
          tableSizes?: TableSizeData[];
          rowCounts?: TableRowCountData[];
          indexStats?: IndexStatData[];
          message?: string;
        };

        if (data.success) {
          setTableSizes(data.tableSizes ?? []);
          setRowCounts(data.rowCounts ?? []);
          setIndexStats(data.indexStats ?? []);
          setLastUpdated(new Date().toLocaleString());
        } else {
          throw new Error(data.message ?? 'Failed to fetch database statistics');
        }
      },
      {
        toastTitle: 'Database Error',
        fallbackMessage: 'Failed to fetch database statistics',
      }
    );

    setLoadingState('pageLoading', false);
  };

  const runMaintenance = async (action: MaintenanceAction) => {
    setLoadingState(action, true);

    await withErrorHandling(
      async () => {
        const response = await fetch('/api/admin/database/maintenance', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ action }),
        });

        if (!response.ok) {
          throw new Error(`Failed to run ${action} maintenance`);
        }

        const data = (await response.json()) as {
          success: boolean;
          message?: string;
        };

        if (data.success) {
          showSuccess(
            `${action} maintenance completed`,
            data.message ?? `${action} maintenance completed successfully`
          );
          // Refresh stats after maintenance
          void fetchDatabaseStats();
        } else {
          throw new Error(data.message ?? `Failed to run ${action} maintenance`);
        }
      },
      {
        toastTitle: 'Maintenance Error',
        fallbackMessage: `Failed to run ${action} maintenance`,
      }
    );

    setLoadingState(action, false);
  };

  // Helper function to render bloat percentage badge
  const renderBloatBadge = (bloatPercentage: number) => {
    const percentage = bloatPercentage.toFixed(1);
    if (bloatPercentage > 40) {
      return <Badge variant="destructive">{percentage}%</Badge>;
    }
    if (bloatPercentage > 20) {
      return (
        <Badge variant="default" className="bg-amber-500">
          {percentage}%
        </Badge>
      );
    }
    return <Badge variant="secondary">{percentage}%</Badge>;
  };

  // Find largest tables for quick reference
  const largestTables = [...tableSizes].sort((a, b) => b.size_bytes - a.size_bytes).slice(0, 5);

  // Find total database size
  const totalSizeBytes = tableSizes.reduce((sum, table) => sum + table.size_bytes, 0);

  return (
    <div className="container mx-auto p-4">
      <h1 className="mb-6 text-2xl font-bold">Database Management</h1>

      <div className="mb-6 flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {lastUpdated ? `Last updated: ${lastUpdated}` : 'No data fetched yet'}
        </div>
        <Button
          variant="outline"
          onClick={fetchDatabaseStats}
          disabled={isLoading}
          className="flex gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh Data
        </Button>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Database Size</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatBytes(totalSizeBytes)}</div>
            <p className="mt-1 text-xs text-muted-foreground">Total size of all tables</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Tables</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tableSizes.length}</div>
            <p className="mt-1 text-xs text-muted-foreground">Number of tables in the database</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Rows</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {rowCounts.reduce((sum, table) => sum + table.row_count, 0).toLocaleString()}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Total number of rows across all tables
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Largest Table</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{largestTables[0]?.table_name || 'N/A'}</div>
            <p className="mt-1 text-xs text-muted-foreground">
              {largestTables[0]?.size_pretty || 'Unknown size'}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Maintenance Actions</CardTitle>
            <CardDescription>Run database maintenance operations</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Button
              variant="outline"
              className="flex justify-start gap-2"
              onClick={() => runMaintenance('vacuum')}
              disabled={Object.values(loadingStates).some(loading => loading)}
            >
              <Database className="h-4 w-4" />
              {loadingStates.vacuum ? RUNNING_TEXT : 'Vacuum & Analyze'}
            </Button>

            <Button
              variant="outline"
              className="flex justify-start gap-2"
              onClick={() => runMaintenance('refresh')}
              disabled={Object.values(loadingStates).some(loading => loading)}
            >
              <RefreshCw className="h-4 w-4" />
              {loadingStates.refresh ? RUNNING_TEXT : 'Refresh Materialized Views'}
            </Button>

            <Button
              variant="outline"
              className="flex justify-start gap-2"
              onClick={() => runMaintenance('aggregate')}
              disabled={Object.values(loadingStates).some(loading => loading)}
            >
              <BarChart className="h-4 w-4" />
              {loadingStates.aggregate ? RUNNING_TEXT : 'Aggregate Stats'}
            </Button>

            <Button
              variant="outline"
              className="flex justify-start gap-2"
              onClick={() => runMaintenance('partition')}
              disabled={Object.values(loadingStates).some(loading => loading)}
            >
              <Calendar className="h-4 w-4" />
              {loadingStates.partition ? RUNNING_TEXT : 'Create Next Partition'}
            </Button>

            <Button
              variant="outline"
              className="flex justify-start gap-2 bg-amber-50 hover:bg-amber-100"
              onClick={() => {
                if (
                  confirm('Archive data older than 12 months? This operation cannot be undone.')
                ) {
                  void runMaintenance('archive');
                }
              }}
              disabled={Object.values(loadingStates).some(loading => loading)}
            >
              <ArchiveIcon className="h-4 w-4" />
              {loadingStates.archive ? RUNNING_TEXT : 'Archive Old Data'}
            </Button>
          </CardContent>
          <CardFooter className="text-xs text-muted-foreground">
            Note: Some operations may take several minutes to complete
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>{activeTab === 'bloat' ? 'Table Bloat' : 'Largest Tables'}</CardTitle>
              <div className="flex gap-2">
                <Button
                  variant={activeTab === 'size' ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => {
                    setActiveTab('size');
                  }}
                >
                  Size
                </Button>
                <Button
                  variant={activeTab === 'bloat' ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => {
                    setActiveTab('bloat');
                  }}
                >
                  Bloat
                </Button>
              </div>
            </div>
            <CardDescription>
              {activeTab === 'bloat'
                ? 'Top 5 tables with highest bloat percentage'
                : 'Top 5 largest tables by size'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex h-48 items-center justify-center">
                <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div>
                {activeTab === 'size' ? (
                  <>
                    {largestTables.map((table, _index) => (
                      <div key={table.table_name} className="mb-4">
                        <div className="mb-1 flex justify-between">
                          <span className="text-sm font-medium">{table.table_name}</span>
                          <span className="text-sm text-muted-foreground">{table.size_pretty}</span>
                        </div>
                        <Progress
                          value={Math.round(
                            (table.size_bytes / (largestTables[0]?.size_bytes || 1)) * 100
                          )}
                          className="h-2"
                        />
                        <div className="mt-1 text-xs text-muted-foreground">
                          {table.total_rows.toLocaleString()} rows
                        </div>
                      </div>
                    ))}
                  </>
                ) : (
                  <>
                    {largestTables.map((table, _index) => (
                      <div key={table.table_name} className="mb-4">
                        <div className="mb-1 flex justify-between">
                          <span className="text-sm font-medium">{table.table_name}</span>
                          <span className="text-sm text-muted-foreground">
                            {table.bloat_percentage.toFixed(1)}% bloat
                          </span>
                        </div>
                        <Progress
                          value={Math.min(Math.round(table.bloat_percentage), 100)}
                          className="h-2"
                        />
                        <div className="mt-1 text-xs text-muted-foreground">
                          Size: {table.table_size}, Bloat: {table.bloat_size}
                        </div>
                      </div>
                    ))}
                  </>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="tables" className="w-full">
        <TabsList className="mb-4 grid grid-cols-4">
          <TabsTrigger value="tables">Tables</TabsTrigger>
          <TabsTrigger value="indexes">Indexes</TabsTrigger>
          <TabsTrigger value="bloat">Table Bloat</TabsTrigger>
          <TabsTrigger value="info">Information</TabsTrigger>
        </TabsList>

        <TabsContent value="tables" className="rounded-md border p-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Table Name</TableHead>
                <TableHead>Size</TableHead>
                <TableHead className="text-right">Rows</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={3} className="h-24 text-center">
                    <RefreshCw className="mx-auto h-8 w-8 animate-spin" />
                  </TableCell>
                </TableRow>
              ) : (
                tableSizes.map(table => (
                  <TableRow key={table.table_name}>
                    <TableCell className="font-medium">{table.table_name}</TableCell>
                    <TableCell>{table.size_pretty}</TableCell>
                    <TableCell className="text-right">
                      {table.total_rows.toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TabsContent>

        <TabsContent value="indexes" className="rounded-md border p-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Table</TableHead>
                <TableHead>Index</TableHead>
                <TableHead>Size</TableHead>
                <TableHead className="text-right">Scans</TableHead>
                <TableHead className="text-right">Last Used</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    <RefreshCw className="mx-auto h-8 w-8 animate-spin" />
                  </TableCell>
                </TableRow>
              ) : (
                indexStats.map(index => {
                  const uniqueKey = `${String(index.table_name)}-${String(index.index_name)}`;
                  return (
                    <TableRow key={uniqueKey}>
                      <TableCell>{index.table_name}</TableCell>
                      <TableCell className="font-medium">{index.index_name}</TableCell>
                      <TableCell>{index.index_size}</TableCell>
                      <TableCell className="text-right">{index.scans.toLocaleString()}</TableCell>
                      <TableCell className="text-right">
                        {index.scans === 0 ? (
                          <Badge variant="destructive" className="ml-auto">
                            Never Used
                          </Badge>
                        ) : (
                          index.last_used
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TabsContent>

        <TabsContent value="bloat" className="rounded-md border p-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Table Name</TableHead>
                <TableHead>Size</TableHead>
                <TableHead>Bloat Size</TableHead>
                <TableHead className="text-right">Bloat %</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center">
                    <RefreshCw className="mx-auto h-8 w-8 animate-spin" />
                  </TableCell>
                </TableRow>
              ) : (
                largestTables.map(table => (
                  <TableRow key={table.table_name}>
                    <TableCell className="font-medium">{table.table_name}</TableCell>
                    <TableCell>{table.table_size}</TableCell>
                    <TableCell>{table.bloat_size}</TableCell>
                    <TableCell className="text-right">
                      {renderBloatBadge(table.bloat_percentage)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TabsContent>

        <TabsContent value="info" className="space-y-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Database Maintenance Information</AlertTitle>
            <AlertDescription>
              <p className="mb-2">The following automated maintenance tasks are scheduled:</p>
              <ul className="mb-4 list-disc space-y-1 pl-6">
                <li>Full maintenance: Daily at 3 AM</li>
                <li>Materialized view refresh: Every 4 hours</li>
                <li>Statistics update: Every 6 hours</li>
                <li>Old data archiving: Quarterly (Jan, Apr, Jul, Oct)</li>
              </ul>
              <p>Manual maintenance operations can be triggered from this page when needed.</p>
            </AlertDescription>
          </Alert>

          <Card>
            <CardHeader>
              <CardTitle>Database Optimization Features</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p>
                <strong>1. Regular Maintenance</strong> - Run the vacuum and analyze operations
                weekly to keep the database healthy.
              </p>
              <p>
                <strong>2. Table Partitioning</strong> - Time-series data is automatically
                partitioned by month for optimal performance.
              </p>
              <p>
                <strong>3. Index Management</strong> - Review and remove unused indexes to reduce
                overhead during writes.
              </p>
              <p>
                <strong>4. Foreign Key Indexes</strong> - Automatically indexes foreign keys to
                prevent performance bottlenecks.
              </p>
              <p>
                <strong>5. Materialized Views</strong> - Common aggregate queries are pre-computed
                and cached for faster reporting.
              </p>
              <p>
                <strong>6. Table Bloat Monitoring</strong> - Identifies tables with high bloat that
                need vacuum/reindexing.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
