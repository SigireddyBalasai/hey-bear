/**
 * Logger utility for consistent log formatting
 */
export const logger = {
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

/**
 * Enhanced fetch with comprehensive logging
 */
export async function fetchWithLogging(url: string, options: RequestInit): Promise<Response> {
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
    });
    throw error;
  }
}
