import type {
  ErrorData,
  FirecrawlCrawlResponse,
  FirecrawlResult,
  FirecrawlTaskResponse,
} from './firecrawl-types';

const FIRECRAWL_API_KEY = process.env.FIRECRAWL_API_KEY;
const FIRECRAWL_BASE_URL = 'http://34.30.131.11:11235';

/**
 * Custom HTTP client with logging for Firecrawl API calls
 */
async function fetchWithLogging(url: string, options: RequestInit = {}): Promise<Response> {
  return fetch(url, options);
}

/**
 * Firecrawl API client for web crawling operations
 */
export class FirecrawlClient {
  private readonly headers: Record<string, string>;

  constructor() {
    if (!FIRECRAWL_API_KEY) {
      throw new Error('FIRECRAWL_API_KEY is not set');
    }

    this.headers = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${FIRECRAWL_API_KEY}`,
    };
  }

  /**
   * Initiates a crawl task for the given URL
   */
  async crawlUrl(url: string): Promise<FirecrawlCrawlResponse> {
    const crawlUrl = `${FIRECRAWL_BASE_URL}/crawl`;
    const crawlBody = {
      urls: [url],
      priority: 10,
    };

    const response = await fetchWithLogging(crawlUrl, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify(crawlBody),
    });

    if (!response.ok) {
      let errorData: ErrorData;

      try {
        errorData = await response.json();
      } catch {
        errorData = { message: 'Could not parse error response' };
      }

      throw new Error(errorData?.detail || `HTTP error! status: ${response.status}`);
    }

    return await response.json();
  }

  /**
   * Polls for task completion with timeout handling
   */
  async waitForTaskCompletion(taskId: string): Promise<FirecrawlResult> {
    const maxPolls = 25;
    const startTime = Date.now();
    const timeoutMs = 50000; // 50 seconds timeout

    let taskResult: FirecrawlTaskResponse | null = null;
    let status = 'pending';
    let pollCount = 0;

    while (status !== 'completed' && status !== 'failed' && pollCount < maxPolls) {
      // Check if we're approaching the timeout
      if (Date.now() - startTime > timeoutMs) {
        break;
      }

      pollCount++;

      const taskUrl = `${FIRECRAWL_BASE_URL}/task/${taskId}`;
      const taskResponse = await fetchWithLogging(taskUrl, {
        method: 'GET',
        headers: this.headers,
      });

      if (!taskResponse.ok) {
        let errorData: ErrorData;

        try {
          errorData = await taskResponse.json();
        } catch {
          errorData = { message: 'Could not parse error response' };
        }

        throw new Error(errorData?.detail || `HTTP error! status: ${taskResponse.status}`);
      }

      taskResult = (await taskResponse.json()) as FirecrawlTaskResponse;
      status = taskResult.status;

      if (status !== 'completed' && status !== 'failed') {
        // Variable wait time with maximum cap
        const waitTime = Math.min(1500 * Math.pow(1.1, pollCount), 5000);

        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }

    if (status === 'failed') {
      throw new Error(
        taskResult?.result?.error_message ||
          'The crawl task failed without a specific error message'
      );
    }

    if (!taskResult || status !== 'completed') {
      throw new Error('The crawl task did not complete within the timeout period');
    }

    // Get the appropriate result object - handle both formats
    let resultData: FirecrawlResult | undefined;

    if (taskResult?.result) {
      resultData = taskResult.result;
    } else if (taskResult?.results && taskResult.results.length > 0) {
      resultData = taskResult.results[0];
    }

    if (!resultData) {
      throw new Error('The crawl task completed, but no result data was found');
    }

    return resultData;
  }

  /**
   * Crawls a URL and waits for completion
   */
  async crawlAndWait(url: string): Promise<FirecrawlResult> {
    const { task_id } = await this.crawlUrl(url);

    if (!task_id) {
      throw new Error('No task ID returned from crawl request');
    }

    return this.waitForTaskCompletion(task_id);
  }
}
