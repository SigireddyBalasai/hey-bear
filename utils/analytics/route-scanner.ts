import fs from 'fs';
import path from 'path';
import { getApiStats } from './api-tracker';

interface RouteData {
  path: string;
  usageCount: number;
  lastUsed?: string;
  status: 'active' | 'inactive' | 'unused';
}

/**
 * Scans the project to find all API route files and compares with usage stats
 */
export async function scanForUnusedRoutes(): Promise<RouteData[]> {
  const apiRoutes = await findAllApiRoutes();
  const usageStats = getApiStats();
  
  return apiRoutes.map(route => {
    // Check if this route has been hit with any HTTP method
    const methods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];
    const hitCounts = methods.map(method => 
      usageStats[`${method} ${route}`] || 0
    );
    
    const totalHits = hitCounts.reduce((sum, count) => sum + count, 0);
    
    return {
      path: route,
      usageCount: totalHits,
      lastUsed: totalHits > 0 ? new Date().toISOString() : undefined, // In a real impl, store last used timestamp
      status: totalHits > 0 ? 'active' : 'unused'
    };
  });
}

/**
 * Recursively finds all route.ts files in the API directory
 */
async function findAllApiRoutes(
  dir = path.join(process.cwd(), 'app', 'api'),
  apiPrefix = '/api',
  routes: string[] = []
): Promise<string[]> {
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      // Handle directories with route groups (parentheses folders)
      const dirName = file.startsWith('(') && file.endsWith(')') ? '' : file;
      const newPrefix = dirName ? `${apiPrefix}/${dirName}` : apiPrefix;
      await findAllApiRoutes(filePath, newPrefix, routes);
    } else if (file === 'route.ts' || file === 'route.js') {
      routes.push(apiPrefix);
    }
  }
  
  return routes;
}

/**
 * Get route statistics, including potentially unused routes
 */
export async function getRouteStatistics() {
  const routeData = await scanForUnusedRoutes();
  
  // Count statistics
  const totalRoutes = routeData.length;
  const activeRoutes = routeData.filter(r => r.status === 'active').length;
  const unusedRoutes = totalRoutes - activeRoutes;
  
  return {
    summary: {
      totalRoutes,
      activeRoutes,
      unusedRoutes,
      unusedPercentage: Math.round((unusedRoutes / totalRoutes) * 100)
    },
    routes: routeData.sort((a, b) => b.usageCount - a.usageCount)
  };
}