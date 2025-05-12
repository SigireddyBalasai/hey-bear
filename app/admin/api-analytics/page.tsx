'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface RouteData {
  path: string;
  usageCount: number;
  lastUsed?: string;
  status: 'active' | 'inactive' | 'unused';
}

interface RouteStatistics {
  summary: {
    totalRoutes: number;
    activeRoutes: number;
    unusedRoutes: number;
    unusedPercentage: number;
  };
  routes: RouteData[];
}

export default function ApiAnalyticsPage() {
  const [stats, setStats] = useState<RouteStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterUnused, setFilterUnused] = useState(false);

  useEffect(() => {
    async function fetchStats() {
      try {
        setLoading(true);
        const response = await fetch('/api/admin/api-analytics');
        
        if (!response.ok) {
          throw new Error(`Failed to fetch API analytics: ${response.status}`);
        }
        
        const result = await response.json();
        
        if (result.success && result.data) {
          setStats(result.data);
          setError(null);
        } else {
          throw new Error(result.error || 'Failed to fetch API analytics');
        }
      } catch (err: any) {
        console.error('Error fetching API analytics', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    
    fetchStats();
    
    // Set up a refresh interval - refresh every 30 seconds
    const intervalId = setInterval(fetchStats, 30000);
    return () => clearInterval(intervalId);
  }, []);

  // Filter routes based on search term and unused filter
  const filteredRoutes = stats?.routes?.filter(route => {
    const matchesSearch = route.path.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterUnused ? route.status === 'unused' : true;
    return matchesSearch && matchesFilter;
  }) || [];

  if (loading && !stats) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">API Route Analytics</h1>
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          <span className="ml-2">Loading analytics data...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">API Route Analytics</h1>
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <p><strong>Error:</strong> {error}</p>
          <p className="mt-2">Make sure you have admin privileges to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">API Route Analytics</h1>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Total Routes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats?.summary.totalRoutes || 0}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Active Routes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-600">{stats?.summary.activeRoutes || 0}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Unused Routes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-amber-600">{stats?.summary.unusedRoutes || 0}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Unused %</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-amber-600">{stats?.summary.unusedPercentage || 0}%</p>
          </CardContent>
        </Card>
      </div>
      
      {/* Filtering */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1">
          <Input
            placeholder="Search API routes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex">
          <Button 
            onClick={() => setFilterUnused(!filterUnused)}
            variant={filterUnused ? "default" : "outline"}
          >
            {filterUnused ? "Showing Unused" : "Show Unused Only"}
          </Button>
        </div>
      </div>
      
      {/* Routes Table */}
      <Card>
        <CardHeader>
          <CardTitle>API Routes</CardTitle>
          <CardDescription>
            Overview of all API routes and their usage statistics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Path</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Usage Count</TableHead>
                <TableHead>Last Used</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRoutes.length > 0 ? (
                filteredRoutes.map((route, index) => (
                  <TableRow key={`${route.path}-${index}`}>
                    <TableCell className="font-mono">{route.path}</TableCell>
                    <TableCell>
                      <Badge variant={route.status === 'active' ? 'default' : 'outline'} className={
                        route.status === 'active' ? 'bg-green-100 text-green-800'
                        : 'bg-amber-100 text-amber-800'
                      }>
                        {route.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{route.usageCount}</TableCell>
                    <TableCell>{route.lastUsed || 'Never'}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-4">
                    No API routes found with the current filters
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="mt-6 text-sm text-gray-500">
        <p>Note: This tool tracks API usage since it was installed. Routes showing as unused may still be important but not accessed recently.</p>
      </div>
    </div>
  );
}