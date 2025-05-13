"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { 
  BarChart, 
  RefreshCw, 
  Database, 
  ArchiveIcon, 
  Calendar, 
  AlertCircle,
  HardDrive,
  Clock,
  LineChart
} from "lucide-react";

type MaintenanceAction = 'vacuum' | 'refresh' | 'aggregate' | 'partition' | 'archive' | 'full';

interface TableSize {
  table_name: string;
  size_bytes: number;
  size_pretty: string;
  total_rows: number;
}

interface TableRowCount {
  table_name: string;
  row_count: number;
}

interface IndexStat {
  table_name: string;
  index_name: string;
  index_size: string;
  scans: number;
  last_used: string;
}

export default function DatabasePage() {
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<MaintenanceAction | null>(null);
  const [tableSizes, setTableSizes] = useState<TableSize[]>([]);
  const [rowCounts, setRowCounts] = useState<TableRowCount[]>([]);
  const [indexStats, setIndexStats] = useState<IndexStat[]>([]);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  useEffect(() => {
    fetchDatabaseStats();
  }, []);

  const fetchDatabaseStats = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/database/stats');
      if (!response.ok) {
        throw new Error('Failed to fetch database stats');
      }
      
      const data = await response.json();
      
      if (data.success) {
        setTableSizes(data.tableSizes || []);
        setRowCounts(data.rowCounts || []);
        setIndexStats(data.indexStats || []);
        setLastUpdated(new Date().toLocaleString());
      } else {
        toast.error(data.message || 'Failed to fetch database statistics');
      }
    } catch (error) {
      console.error('Error fetching database stats:', error);
      toast.error('Failed to fetch database statistics');
    } finally {
      setLoading(false);
    }
  };

  const runMaintenance = async (action: MaintenanceAction) => {
    setActionLoading(action);
    try {
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
      
      const data = await response.json();
      
      if (data.success) {
        toast.success(data.message || `${action} maintenance completed successfully`);
        // Refresh stats after maintenance
        fetchDatabaseStats();
      } else {
        toast.error(data.message || `Failed to run ${action} maintenance`);
      }
    } catch (error) {
      console.error(`Error running ${action} maintenance:`, error);
      toast.error(`Failed to run ${action} maintenance`);
    } finally {
      setActionLoading(null);
    }
  };

  // Find largest tables for quick reference
  const largestTables = [...tableSizes].sort((a, b) => b.size_bytes - a.size_bytes).slice(0, 5);
  
  // Find total database size
  const totalSizeBytes = tableSizes.reduce((sum, table) => sum + table.size_bytes, 0);
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Database Management</h1>
      
      <div className="flex justify-between items-center mb-6">
        <div className="text-sm text-muted-foreground">
          {lastUpdated ? `Last updated: ${lastUpdated}` : 'No data fetched yet'}
        </div>
        <Button 
          variant="outline" 
          onClick={fetchDatabaseStats} 
          disabled={loading}
          className="flex gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh Data
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Database Size</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatBytes(totalSizeBytes)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Total size of all tables
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Tables</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tableSizes.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Number of tables in the database
            </p>
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
            <p className="text-xs text-muted-foreground mt-1">
              Total number of rows across all tables
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Largest Table</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {largestTables[0]?.table_name || 'N/A'}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {largestTables[0]?.size_pretty || 'Unknown size'}
            </p>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Maintenance Actions</CardTitle>
            <CardDescription>
              Run database maintenance operations
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button 
              variant="outline" 
              className="flex justify-start gap-2" 
              onClick={() => runMaintenance('vacuum')}
              disabled={actionLoading !== null}
            >
              <Database className="h-4 w-4" />
              {actionLoading === 'vacuum' ? 'Running...' : 'Vacuum & Analyze'}
            </Button>
            
            <Button 
              variant="outline" 
              className="flex justify-start gap-2"
              onClick={() => runMaintenance('refresh')}
              disabled={actionLoading !== null}
            >
              <RefreshCw className="h-4 w-4" />
              {actionLoading === 'refresh' ? 'Running...' : 'Refresh Materialized Views'}
            </Button>
            
            <Button 
              variant="outline" 
              className="flex justify-start gap-2"
              onClick={() => runMaintenance('aggregate')}
              disabled={actionLoading !== null}
            >
              <BarChart className="h-4 w-4" />
              {actionLoading === 'aggregate' ? 'Running...' : 'Aggregate Stats'}
            </Button>
            
            <Button 
              variant="outline" 
              className="flex justify-start gap-2"
              onClick={() => runMaintenance('partition')}
              disabled={actionLoading !== null}
            >
              <Calendar className="h-4 w-4" />
              {actionLoading === 'partition' ? 'Running...' : 'Create Next Partition'}
            </Button>
            
            <Button 
              variant="outline" 
              className="flex justify-start gap-2 bg-amber-50 hover:bg-amber-100"
              onClick={() => {
                if (confirm('Archive data older than 12 months? This operation cannot be undone.')) {
                  runMaintenance('archive');
                }
              }}
              disabled={actionLoading !== null}
            >
              <ArchiveIcon className="h-4 w-4" />
              {actionLoading === 'archive' ? 'Running...' : 'Archive Old Data'}
            </Button>
            
            <Button 
              variant="default" 
              className="flex justify-start gap-2"
              onClick={() => runMaintenance('full')}
              disabled={actionLoading !== null}
            >
              <Clock className="h-4 w-4" />
              {actionLoading === 'full' ? 'Running...' : 'Run Full Maintenance'}
            </Button>
          </CardContent>
          <CardFooter className="text-xs text-muted-foreground">
            Note: Some operations may take several minutes to complete
          </CardFooter>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Largest Tables</CardTitle>
            <CardDescription>
              Top 5 largest tables by size
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center items-center h-48">
                <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <>
                {largestTables.map((table, index) => (
                  <div key={table.table_name} className="mb-4">
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium">{table.table_name}</span>
                      <span className="text-sm text-muted-foreground">{table.size_pretty}</span>
                    </div>
                    <Progress 
                      value={Math.round((table.size_bytes / (largestTables[0]?.size_bytes || 1)) * 100)} 
                      className="h-2" 
                    />
                    <div className="text-xs text-muted-foreground mt-1">
                      {table.total_rows.toLocaleString()} rows
                    </div>
                  </div>
                ))}
              </>
            )}
          </CardContent>
        </Card>
      </div>
      
      <Tabs defaultValue="tables" className="w-full">
        <TabsList className="grid grid-cols-3 mb-4">
          <TabsTrigger value="tables">Tables</TabsTrigger>
          <TabsTrigger value="indexes">Indexes</TabsTrigger>
          <TabsTrigger value="info">Information</TabsTrigger>
        </TabsList>
        
        <TabsContent value="tables" className="border rounded-md p-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Table Name</TableHead>
                <TableHead>Size</TableHead>
                <TableHead className="text-right">Rows</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={3} className="h-24 text-center">
                    <RefreshCw className="h-8 w-8 animate-spin mx-auto" />
                  </TableCell>
                </TableRow>
              ) : (
                tableSizes.map((table) => (
                  <TableRow key={table.table_name}>
                    <TableCell className="font-medium">{table.table_name}</TableCell>
                    <TableCell>{table.size_pretty}</TableCell>
                    <TableCell className="text-right">{table.total_rows.toLocaleString()}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TabsContent>
        
        <TabsContent value="indexes" className="border rounded-md p-4">
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
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    <RefreshCw className="h-8 w-8 animate-spin mx-auto" />
                  </TableCell>
                </TableRow>
              ) : (
                indexStats.map((index) => (
                  <TableRow key={`${index.table_name}-${index.index_name}`}>
                    <TableCell>{index.table_name}</TableCell>
                    <TableCell className="font-medium">{index.index_name}</TableCell>
                    <TableCell>{index.index_size}</TableCell>
                    <TableCell className="text-right">{index.scans.toLocaleString()}</TableCell>
                    <TableCell className="text-right">
                      {index.scans === 0 ? (
                        <Badge variant="destructive" className="ml-auto">Never Used</Badge>
                      ) : (
                        index.last_used
                      )}
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
              <ul className="list-disc pl-6 mb-4 space-y-1">
                <li>Full maintenance: Daily at 3 AM</li>
                <li>Materialized view refresh: Every 4 hours</li>
                <li>Statistics update: Every 6 hours</li>
                <li>Old data archiving: Quarterly (Jan, Apr, Jul, Oct)</li>
              </ul>
              <p>
                Manual maintenance operations can be triggered from this page when needed.
              </p>
            </AlertDescription>
          </Alert>
          
          <Card>
            <CardHeader>
              <CardTitle>Database Performance Tips</CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-2">
              <p>
                <strong>1. Regular Maintenance</strong> - Run the vacuum and analyze operations weekly to keep the database healthy.
              </p>
              <p>
                <strong>2. Monitor Table Sizes</strong> - Tables growing rapidly may need more frequent partitioning or archiving.
              </p>
              <p>
                <strong>3. Check Unused Indexes</strong> - Indexes that are never used consume space and slow down inserts/updates.
              </p>
              <p>
                <strong>4. Archive Old Data</strong> - Consider archiving data older than 12 months to maintain performance.
              </p>
              <p>
                <strong>5. Refresh Materialized Views</strong> - Materialized views should be refreshed regularly for accurate reporting.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}