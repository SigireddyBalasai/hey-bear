import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

import * as fs from 'node:fs';
import * as os from 'node:os';
import path from 'node:path';
import { v4 as uuidv4 } from 'uuid';

import { getPineconeClient } from '@/lib/pinecone';
import { requireAuth } from '@/utils/auth-utils';
import { createClient } from '@/utils/supabase/server';

// Create a logger function for consistent log formatting
const logger = {
  info: (message: string, data?: unknown) => {
    console.log(`[CRAWL INFO] ${new Date().toISOString()} - ${message}`, data ?? '');
  },
  error: (message: string, error?: unknown) => {
    console.error(`[CRAWL ERROR] ${new Date().toISOString()} - ${message}`, error ?? '');
  },
  warn: (message: string, data?: unknown) => {
    console.warn(`[CRAWL WARNING] ${new Date().toISOString()} - ${message}`, data ?? '');
  },
  debug: (message: string, data?: unknown) => {
    console.debug(`[CRAWL DEBUG] ${new Date().toISOString()} - ${message}`, data ?? '');
  },
  http: (
    direction: 'REQUEST' | 'RESPONSE',
    method: string,
    url: string,
    status?: number,
    details?: unknown
  ) => {
    const statusPart = status ? ` - ${String(status)}` : '';
    console.log(
      `[CRAWL HTTP] ${new Date().toISOString()} - ${direction} - ${method} ${url}${statusPart}`,
      details ?? ''
    );
  },
};

// Log HTTP requests in curl format for easier debugging/reproduction

// Set maxDuration to 60 seconds to comply with Vercel hobby plan limitations
export const maxDuration = 60;
const FIRECRAWL_API_KEY = process.env.FIRECRAWL_API_KEY;
const FIRECRAWL_BASE_URL = 'https://34.30.131.11:11235';

// Define types for Firecrawl responses based on the observed response structure
interface FirecrawlTaskResponse {
  status: 'pending' | 'processing' | 'completed' | 'failed';
  created_at: number;
  result?: FirecrawlResult;
  results?: FirecrawlResult[]; // Added to handle results array format
}

interface FirecrawlCrawlResponse {
  task_id: string;
}

interface RequestBody {
  assistantId: string;
  pinecone_name: string;
  url: string;
}

interface ErrorData {
  detail?: string;
  message?: string;
}

interface FirecrawlResult {
  url: string;
  html?: string;
  cleaned_html?: string;
  markdown?: string;
  markdown_v2?: {
    raw_markdown: string;
    markdown_with_citations: string;
    references_markdown: string;
    fit_markdown: string;
    fit_html: string;
  };
  media?: {
    images: unknown[];
    videos: unknown[];
    audios: unknown[];
  };
  links?: {
    internal: unknown[];
    external: Array<{
      href: string;
      text: string;
      title: string;
    }>;
  };
  metadata?: {
    title?: string;
    description?: string;
    author?: string | null;
  };
  success: boolean;
  error_message?: string;
  status_code?: number;
}

// Make HTTP request with enhanced logging
const fetchWithLogging = async (url: string, options: RequestInit) => {
  const method = options.method ?? 'GET';
  const headers = options.headers ?? {};
  const body: unknown = options.body ? JSON.parse(options.body as string) : undefined;
  logger.http('REQUEST', method, url, undefined, {
    headers: Object.keys(headers),
    body,
  });

  try {
    const startTime = Date.now();
    const response = await fetch(url, options);
    const duration = Date.now() - startTime;

    let responseData: unknown;
    let responseText = '';

    // Try to parse response as JSON
    try {
      const clonedResponse = response.clone();
      responseText = await clonedResponse.text();
      try {
        responseData = JSON.parse(responseText);
      } catch {
        responseData = {
          text: responseText.slice(0, 500) + (responseText.length > 500 ? '...' : ''),
        };
      }
    } catch {
      responseData = { error: 'Could not read response body' };
    }

    logger.http('RESPONSE', method, url, response.status, {
      duration: `${String(duration)}ms`,
      ok: response.ok,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries()),
      data: responseData,
    });

    return response;
  } catch (error) {
    logger.http('RESPONSE', method, url, 0, {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });
    throw error;
  }
};

export const POST = requireAuth(async (context, req: NextRequest) => {
  if (!FIRECRAWL_API_KEY) {
    logger.error('FIRECRAWL_API_KEY is not set');
    return NextResponse.json(
      { error: 'Server configuration error: Missing Firecrawl API key.' },
      { status: 500 }
    );
  }

  const supabase = await createClient();

  // Get request metadata
  const requestIp = req.headers.get('x-forwarded-for') ?? req.headers.get('x-real-ip') ?? 'unknown';
  const userAgent = req.headers.get('user-agent') ?? 'unknown';

  logger.debug('Request details', { ip: requestIp, userAgent });

  try {
    // Authenticate user
    logger.info('Authenticating user');

    logger.info(`User authenticated successfully: ${context.user.id}`);

    // Validate request body
    let body: RequestBody;
    try {
      body = (await req.json()) as RequestBody;
      logger.debug('Request body parsed', { body });
    } catch (parseError) {
      logger.error('Failed to parse request body', parseError);
      return NextResponse.json(
        { error: 'Invalid request: Could not parse JSON body' },
        { status: 400 }
      );
    }

    const { assistantId, pinecone_name, url } = body;

    if (!assistantId || !pinecone_name || !url) {
      const missingFields: string[] = [];
      if (!assistantId) missingFields.push('assistantId');
      if (!pinecone_name) missingFields.push('pinecone_name');
      if (!url) missingFields.push('url');

      logger.error('Missing required fields', { missingFields });
      return NextResponse.json(
        { error: `Missing required fields: ${missingFields.join(', ')}` },
        { status: 400 }
      );
    }

    // Validate URL format
    try {
      new URL(url);
      logger.info(`URL format valid: ${url}`);
    } catch {
      logger.error('Invalid URL format', { url });
      return NextResponse.json({ error: 'Invalid URL format' }, { status: 400 });
    }

    // Verify assistant exists
    logger.info(`Verifying assistant exists: ${String(assistantId)}`);
    const { error: assistantError } = await supabase

      .from('assistants')
      .select('*')
      .eq('id', assistantId)
      .single();

    if (assistantError) {
      logger.error(`Error fetching assistant with ID ${String(assistantId)}`, assistantError);
      return NextResponse.json(
        { error: 'Failed to fetch assistant information', details: assistantError.message },
        { status: 500 }
      );
    }

    logger.info(`Starting to crawl URL: ${url}`);

    // Fixed authorization header format based on curl example
    const crawlHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${FIRECRAWL_API_KEY}`,
    };

    logger.debug('Using Firecrawl API key for authentication');

    // Construct URLs with base URL
    const crawlUrl = `${FIRECRAWL_BASE_URL}/crawl`;

    // Use array format for URLs parameter as shown in the curl example
    const crawlBody = {
      urls: [url],
      priority: 10,
    };

    const crawlResponse = await fetchWithLogging(crawlUrl, {
      method: 'POST',
      headers: crawlHeaders,
      body: JSON.stringify(crawlBody),
    });

    if (!crawlResponse.ok) {
      const errorStatus = crawlResponse.status;
      let errorData: ErrorData;

      try {
        errorData = (await crawlResponse.json()) as ErrorData;
      } catch {
        errorData = { message: 'Could not parse error response' };
      }

      logger.error(`Crawl request failed with status ${errorStatus}`, errorData);

      return NextResponse.json(
        {
          error: 'Failed to initiate crawl',
          message: errorData?.detail ?? `HTTP error! status: ${crawlResponse.status}`,
          responseStatus: crawlResponse.status,
        },
        { status: errorStatus }
      );
    }

    const crawlData = (await crawlResponse.json()) as FirecrawlCrawlResponse;
    const { task_id } = crawlData;
    logger.info(`Crawl task initiated with task ID: ${task_id}`);

    // Polling task status with enhanced timeout handling
    let taskResult: FirecrawlTaskResponse | null = null;
    let status = 'pending';
    let pollCount = 0;
    const maxPolls = 40; // Maximum polling attempts
    const startTime = Date.now();
    const timeoutMs = 50_000; // 50 seconds to stay under 60s limit

    while (status !== 'completed' && status !== 'failed' && pollCount < maxPolls) {
      // Check if we're approaching the timeout
      if (Date.now() - startTime > timeoutMs) {
        logger.warn('Approaching timeout limit, breaking out of polling loop');
        break;
      }

      pollCount++;
      logger.debug(`Polling task status (attempt ${pollCount}/${maxPolls}): ${task_id}`);

      // Use correct task URL format from curl example
      const taskUrl = `${FIRECRAWL_BASE_URL}/task/${task_id}`;

      const taskResponse = await fetchWithLogging(taskUrl, {
        method: 'GET',
        headers: crawlHeaders,
      });

      if (!taskResponse.ok) {
        let errorData: ErrorData;
        try {
          errorData = (await taskResponse.json()) as ErrorData;
        } catch {
          errorData = { message: 'Could not parse error response' };
        }

        logger.error(`Failed to get task status: ${taskResponse.status}`, errorData);
        return NextResponse.json(
          {
            error: 'Failed to fetch task status',
            message: errorData?.detail ?? `HTTP error! status: ${taskResponse.status}`,
          },
          { status: 500 }
        );
      }

      taskResult = (await taskResponse.json()) as FirecrawlTaskResponse;
      status = taskResult.status;
      logger.debug(`Task status: ${status}`, {
        elapsed: Math.round((Date.now() - startTime) / 1000) + 's',
        progress: taskResult.result?.status_code
          ? `HTTP ${taskResult.result.status_code}`
          : 'In progress',
      });

      if (status !== 'completed' && status !== 'failed') {
        // Variable wait time with maximum cap
        const waitTime = Math.min(1500 * Math.pow(1.1, pollCount), 5000);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }

    if (status === 'failed') {
      logger.error('Crawl task failed', { task_id, status, taskResult });
      return NextResponse.json(
        {
          error: 'Crawl task failed',
          message:
            taskResult?.result?.error_message ??
            'The crawl task failed without a specific error message',
        },
        { status: 400 }
      );
    }

    if (status !== 'completed') {
      // Instead of returning an error, provide a way to check the status later
      return NextResponse.json(
        {
          status: 'pending',
          message: 'The crawl task is still in progress. Please check status later.',
          taskId: task_id,
          pollUrl: `${FIRECRAWL_BASE_URL}/task/${task_id}`,
        },
        { status: 202 }
      ); // 202 Accepted indicates the task is still processing
    }

    logger.info('Crawl task completed', {
      task_id,
      status: taskResult?.status,
      has_result: !!taskResult?.result,
      has_results: !!taskResult?.results && taskResult.results.length > 0,
    });

    // Get the appropriate result object - handle both formats
    let resultData: FirecrawlResult | undefined;

    if (taskResult?.result) {
      // Single result format
      resultData = taskResult.result;
    } else if (taskResult?.results && taskResult.results.length > 0) {
      // Array results format
      resultData = taskResult.results[0];
      logger.info(`Found ${taskResult.results.length} results, using first result`);
    }

    if (!resultData) {
      logger.error('No usable content found in crawl result', taskResult);
      return NextResponse.json(
        {
          error: 'Failed to extract content',
          message: 'The crawl task completed, but no result data was found.',
          taskData: taskResult,
        },
        { status: 400 }
      );
    }

    // Choose the best content format in priority order
    let markdownContent = '';

    if (resultData.markdown_v2?.raw_markdown) {
      // Prefer markdown_v2 which has better formatting and citation support
      markdownContent = resultData.markdown_v2.raw_markdown;

      // If references are available, append them to provide context
      if (resultData.markdown_v2.references_markdown) {
        markdownContent += '\n\n' + resultData.markdown_v2.references_markdown;
      }

      logger.info('Using enhanced markdown_v2 format');
    } else if (resultData.markdown) {
      // Fall back to standard markdown
      markdownContent = resultData.markdown;
      logger.info('Using standard markdown format');
    } else if (resultData.cleaned_html) {
      // Fall back to cleaned HTML if markdown is unavailable
      markdownContent = `# ${resultData.metadata?.title ?? 'Web Page Content'}\n\n${resultData.cleaned_html}`;
      logger.warn('No markdown available, using cleaned HTML');
    } else {
      logger.error('No usable content found in result data', resultData);
      return NextResponse.json(
        {
          error: 'Failed to extract content',
          message: 'The crawl completed, but no markdown or HTML content was found.',
          url: resultData.url,
        },
        { status: 400 }
      );
    }

    const contentLength = markdownContent.length;
    logger.info(`Content extracted successfully: ${contentLength} characters`);

    // Enrich the content with metadata
    if (resultData.metadata) {
      const metadata = resultData.metadata;
      const metadataSection = [
        '---',
        `Title: ${metadata.title ?? 'Untitled'}`,
        `URL: ${resultData.url}`,
        metadata.description ? `Description: ${metadata.description}` : null,
        metadata.author ? `Author: ${metadata.author}` : null,
        `Date Crawled: ${new Date().toISOString()}`,
        '---\n\n',
      ]
        .filter(Boolean)
        .join('\n');

      markdownContent = metadataSection + markdownContent;
    }

    // Add link information if available
    if (resultData.links?.external.length) {
      const externalLinks = resultData.links.external;
      if (externalLinks.length > 0) {
        const linkSection = [
          '\n\n## External Links\n',
          ...externalLinks.map(
            link =>
              `- [${link.text || link.href}](${link.href})${link.title ? ` - ${link.title}` : ''}`
          ),
        ].join('\n');

        markdownContent += linkSection;
      }
    }

    // Get Pinecone client
    logger.info('Initializing Pinecone client');
    const pinecone = getPineconeClient();

    // Create temporary file with enhanced crawled content
    const fileName = `url-${uuidv4()}.md`;
    const tempDir = os.tmpdir();
    const tempFilePath = path.join(tempDir, fileName);

    logger.info(`Creating temporary file: ${tempFilePath}`);

    try {
      // Write content to temporary file and upload to Pinecone
      fs.writeFileSync(tempFilePath, markdownContent);
      logger.debug('Content written to temporary file');

      logger.info(`Uploading content to Pinecone index: ${pinecone_name}`);
      const pineconeAssistant = pinecone.Assistant(pinecone_name);
      const uploadResult = await pineconeAssistant.uploadFile({
        path: tempFilePath,
        metadata: {
          source: url,
          type: 'webpage',
          dateAdded: new Date().toISOString(),
          assistantId: assistantId,
          userId: context.user.id,
          title: resultData.metadata?.title ?? '',
          description: resultData.metadata?.description ?? '',
        },
      });

      logger.debug('Removing temporary file');
      fs.unlinkSync(tempFilePath);

      logger.info(`Successfully uploaded URL content to Pinecone with ID: ${uploadResult.id}`);

      return NextResponse.json({
        message: 'URL content uploaded successfully',
        fileId: uploadResult.id,
        source: url,
        title: resultData.metadata?.title ?? '',
        contentLength: contentLength,
      });
    } catch (error: unknown) {
      logger.error('Error processing crawl data', error);
      let detailMessage = 'An error occurred during content upload';
      if (error instanceof Error) {
        detailMessage = error.message;
      }
      return NextResponse.json(
        {
          error: 'Failed to process crawled content',
          details: detailMessage,
        },
        { status: 500 }
      );
    }
  } catch (error: unknown) {
    logger.error('Error in POST /api/Concierge/file/add-url:', error);
    let errorMessage = 'An unexpected error occurred.';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
});
