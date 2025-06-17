import type { FirecrawlCrawlResponse, FirecrawlTaskResponse, FirecrawlResult } from '@/types/api.types';
import { fetchWithLogging, logger } from './logging';

const FIRECRAWL_API_KEY = process.env.FIRECRAWL_API_KEY;
const FIRECRAWL_BASE_URL = 'https://34.30.131.11:11235';

/**
 * Initiates a URL crawl using Firecrawl API
 */
export async function initiateCrawl(url: string): Promise<string> {
  if (!FIRECRAWL_API_KEY) {
    throw new Error('FIRECRAWL_API_KEY is not configured');
  }

  logger.info('Starting crawl process for URL', { url });

  const crawlOptions = {
    includeSubdomains: false,
    limit: 50,
    maxDepth: 2,
    allowBackwardLinks: false,
    allowExternalLinks: false,
    excludePaths: [
      'blog',
      'news',
      'archive',
      'category',
      'tag',
      'admin',
      'wp-admin',
      'wp-content',
      'search',
      'sitemap',
      'rss',
      'feed',
      'comments',
      'reply',
      'login',
      'register',
      'cart',
      'checkout',
      'account',
      'dashboard',
      'profile',
      'settings',
      'edit',
      'delete',
      'api',
      '.json',
      '.xml',
      '.pdf',
      '.jpg',
      '.jpeg',
      '.png',
      '.gif',
      '.svg',
      '.webp',
      '.mp4',
      '.mp3',
      '.zip',
      '.rar',
      '.exe',
      '.dmg',
      '/images/',
      '/assets/',
      '/static/',
      '/media/',
    ],
  };

  const response = await fetchWithLogging(`${FIRECRAWL_BASE_URL}/v1/crawl`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${FIRECRAWL_API_KEY}`,
    },
    body: JSON.stringify({
      url,
      crawlerOptions: crawlOptions,
      pageOptions: {
        includeHtml: false,
        onlyMainContent: true,
        includeLinks: false,
        screenshot: false,
        waitFor: 1000,
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    logger.error('Failed to initiate crawl', {
      status: response.status,
      statusText: response.statusText,
      error: errorText,
    });
    throw new Error(`Crawl initiation failed: ${response.status} ${errorText}`);
  }

  const result = (await response.json()) as FirecrawlCrawlResponse;
  logger.info('Crawl initiated successfully', { jobId: result.id });

  return result.id;
}

/**
 * Polls for crawl completion and returns results
 */
export async function pollCrawlStatus(jobId: string): Promise<FirecrawlResult[]> {
  if (!FIRECRAWL_API_KEY) {
    throw new Error('FIRECRAWL_API_KEY is not configured');
  }

  const maxAttempts = 30; // 5 minutes with 10-second intervals
  const pollInterval = 10000; // 10 seconds

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    logger.info(`Polling crawl status (attempt ${attempt}/${maxAttempts})`, { jobId });

    const response = await fetchWithLogging(`${FIRECRAWL_BASE_URL}/v1/crawl/${jobId}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${FIRECRAWL_API_KEY}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.error('Failed to check crawl status', {
        status: response.status,
        statusText: response.statusText,
        error: errorText,
      });
      throw new Error(`Status check failed: ${response.status} ${errorText}`);
    }

    const result = (await response.json()) as FirecrawlTaskResponse;
    logger.info('Crawl status check result', { 
      status: result.status, 
      progress: result.current,
      total: result.total 
    });

    if (result.status === 'completed' && result.data) {
      logger.info('Crawl completed successfully', { 
        totalPages: result.data.length,
        jobId 
      });
      return result.data;
    }

    if (result.status === 'failed') {
      logger.error('Crawl failed', { jobId, error: result.error });
      throw new Error(`Crawl failed: ${result.error || 'Unknown error'}`);
    }

    if (attempt < maxAttempts) {
      logger.info(`Crawl still in progress, waiting ${pollInterval / 1000} seconds...`, {
        status: result.status,
        progress: `${result.current}/${result.total}`,
      });
      await new Promise(resolve => setTimeout(resolve, pollInterval));
    }
  }

  throw new Error('Crawl timeout: Maximum polling attempts exceeded');
}

/**
 * Validates if a URL is crawlable
 */
export function validateUrl(url: string): { isValid: boolean; error?: string } {
  try {
    const urlObj = new URL(url);
    
    // Check protocol
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      return { isValid: false, error: 'URL must use HTTP or HTTPS protocol' };
    }

    // Check for localhost or private IPs
    if (urlObj.hostname === 'localhost' || 
        urlObj.hostname.startsWith('127.') ||
        urlObj.hostname.startsWith('192.168.') ||
        urlObj.hostname.startsWith('10.') ||
        urlObj.hostname.includes('192.168.')) {
      return { isValid: false, error: 'Cannot crawl localhost or private IP addresses' };
    }

    return { isValid: true };
  } catch (error) {
    return { isValid: false, error: 'Invalid URL format' };
  }
}
