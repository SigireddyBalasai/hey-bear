import { NextRequest } from 'next/server';
import fs from 'fs';
import path from 'path';

// Simple in-memory storage for API hits
const apiHits: Record<string, number> = {};
let lastSaveTime = Date.now();

/**
 * Tracks API route usage and logs it
 */
export function trackApiUsage(req: NextRequest, routePath: string) {
  const key = `${req.method} ${routePath}`;
  apiHits[key] = (apiHits[key] || 0) + 1;
  
  // Save data every 5 minutes to avoid excessive disk writes
  const now = Date.now();
  if (now - lastSaveTime > 5 * 60 * 1000) {
    saveApiStats();
    lastSaveTime = now;
  }
}

/**
 * Save API statistics to a JSON file
 */
function saveApiStats() {
  try {
    // Create analytics directory if it doesn't exist
    const dir = path.join(process.cwd(), 'analytics');
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    // Load existing data if available
    let existingData = {};
    const filePath = path.join(dir, 'api-stats.json');
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf-8');
      existingData = JSON.parse(content);
    }
    
    // Merge with new data
    const mergedData = { ...existingData, ...apiHits };
    
    // Save to file
    fs.writeFileSync(filePath, JSON.stringify(mergedData, null, 2));
    console.log('API usage stats saved');
  } catch (error) {
    console.error('Failed to save API stats:', error);
  }
}

/**
 * Middleware wrapper for API routes
 */
export function withApiTracking(handler: Function) {
  return async (req: NextRequest) => {
    const url = new URL(req.url);
    trackApiUsage(req, url.pathname);
    return handler(req);
  };
}

/**
 * Get all tracked API routes and their usage count
 */
export function getApiStats() {
  return apiHits;
}

/**
 * Generate a report of unused API routes
 */
export async function generateUnusedRoutesReport() {
  // This would need to scan your project structure to compare actual routes
  // against the used routes in apiHits
  // For now, this is a placeholder
}