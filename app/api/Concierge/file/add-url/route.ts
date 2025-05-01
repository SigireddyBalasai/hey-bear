import { createClient } from '@/utils/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { getPineconeClient, PineconeConnectionError, PineconeNotFoundError } from '@/lib/pinecone';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

// Create a logger function for consistent log formatting
const logger = {
    info: (message: string, data?: any) => {
        console.log(`[CRAWL INFO] ${new Date().toISOString()} - ${message}`, data ? data : '');
    },
    error: (message: string, error?: any) => {
        console.error(`[CRAWL ERROR] ${new Date().toISOString()} - ${message}`, error ? error : '');
    },
    warn: (message: string, data?: any) => {
        console.warn(`[CRAWL WARNING] ${new Date().toISOString()} - ${message}`, data ? data : '');
    },
    debug: (message: string, data?: any) => {
        console.debug(`[CRAWL DEBUG] ${new Date().toISOString()} - ${message}`, data ? data : '');
    },
    http: (direction: 'REQUEST' | 'RESPONSE', method: string, url: string, status?: number, details?: any) => {
        const timestamp = new Date().toISOString();
        const statusText = status ? `[${status}]` : '';
        console.log(`[CRAWL HTTP ${direction}] ${timestamp} - ${method} ${url} ${statusText}`, details ? details : '');
    }
};

// Log HTTP requests in curl format for easier debugging/reproduction
const logAsCurl = (method: string, url: string, headers: Record<string, string>, body?: any) => {
    let curlCmd = `curl -X ${method} "${url}" \\\n`;
    
    // Add headers
    Object.entries(headers).forEach(([key, value]) => {
        // Mask sensitive headers like Authorization
        if (key.toLowerCase() === 'authorization') {
            const tokenParts = value.split(' ');
            if (tokenParts.length > 1) {
                const firstFour = tokenParts[1].substring(0, 4);
                const lastFour = tokenParts[1].substring(tokenParts[1].length - 4);
                value = `${tokenParts[0]} ${firstFour}...${lastFour}`;
            }
        }
        curlCmd += `  -H "${key}: ${value}" \\\n`;
    });
    
    // Add body if present
    if (body) {
        curlCmd += `  -d '${JSON.stringify(body)}'`;
    }
    
    logger.debug('Equivalent curl command:', curlCmd);
};

// Set maxDuration to 60 seconds to comply with Vercel hobby plan limitations
export const maxDuration = 60;
const FIRECRAWL_API_KEY = process.env.FIRECRAWL_API_KEY!;
const FIRECRAWL_BASE_URL = 'http://34.30.131.11:11235';

// Define types for Firecrawl responses based on the observed response structure
interface FirecrawlTaskResponse {
    status: 'pending' | 'processing' | 'completed' | 'failed';
    created_at: number;
    result?: FirecrawlResult;
    results?: FirecrawlResult[]; // Added to handle results array format
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
        images: any[];
        videos: any[];
        audios: any[];
    };
    links?: {
        internal: any[];
        external: Array<{
            href: string;
            text: string;
            title: string;
        }>;
    };
    metadata?: {
        title?: string;
        description?: string;
        keywords?: string | null;
        author?: string | null;
    };
    success: boolean;
    error_message?: string;
    status_code?: number;
}

// Custom HTTP client with logging
async function fetchWithLogging(url: string, options: RequestInit = {}) {
    const method = options.method || 'GET';
    const headers = options.headers as Record<string, string> || {};
    const body = options.body ? JSON.parse(options.body as string) : undefined;
    
    logger.http('REQUEST', method, url, undefined, {
        headers: Object.keys(headers),
        body: body
    });
    
    logAsCurl(method, url, headers, body);
    
    try {
        const startTime = Date.now();
        const response = await fetch(url, options);
        const duration = Date.now() - startTime;
        
        let responseData;
        let responseText = '';
        
        // Try to parse response as JSON
        try {
            const clonedResponse = response.clone();
            responseText = await clonedResponse.text();
            try {
                responseData = JSON.parse(responseText);
            } catch {
                responseData = { text: responseText.substring(0, 500) + (responseText.length > 500 ? '...' : '') };
            }
        } catch (e) {
            responseData = { error: 'Could not read response body' };
        }
        
        logger.http('RESPONSE', method, url, response.status, {
            duration: `${duration}ms`,
            ok: response.ok,
            statusText: response.statusText,
            headers: Object.fromEntries(response.headers.entries()),
            data: responseData
        });
        
        return response;
    } catch (error) {
        logger.http('RESPONSE', method, url, 0, {
            error: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined
        });
        throw error;
    }
}

export async function POST(req: NextRequest) {
    logger.info('Received URL crawl request');
    const supabase = await createClient();
    const requestIp = req.headers.get('x-forwarded-for') || 'unknown-ip';
    const userAgent = req.headers.get('user-agent') || 'unknown-agent';
    
    logger.debug('Request details', { ip: requestIp, userAgent });

    try {
        // Authenticate user
        logger.info('Authenticating user');
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        if (authError) {
            logger.error('Authentication error', authError);
            return NextResponse.json(
                { error: 'Unauthorized: Authentication error', details: authError.message },
                { status: 401 }
            );
        }
        
        if (!user) {
            logger.error('No user found in authentication response');
            return NextResponse.json(
                { error: 'Unauthorized: No user found' },
                { status: 401 }
            );
        }
        
        logger.info(`User authenticated successfully: ${user.id}`);

        // Validate request body
        let body;
        try {
            body = await req.json();
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
            const missingFields = [];
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
        } catch (e) {
            logger.error('Invalid URL format', { url });
            return NextResponse.json(
                { error: 'Invalid URL format' },
                { status: 400 }
            );
        }

        // Verify assistant exists
        logger.info(`Verifying assistant exists: ${assistantId}`);
        const { data: assistant, error: assistantError } = await supabase
            .from('assistants')
            .select('*')
            .eq('id', assistantId)
            .single();

        if (assistantError) {
            logger.error(`Error fetching assistant with ID ${assistantId}`, assistantError);
            return NextResponse.json(
                { error: 'Failed to fetch assistant information', details: assistantError.message },
                { status: 500 }
            );
        }

        if (!assistant) {
            logger.error(`Assistant not found with ID ${assistantId}`);
            return NextResponse.json(
                { error: 'No-show not found or you do not have permission to modify it' },
                { status: 404 }
            );
        }
        
        logger.info(`Assistant verified: ${assistant.name}`);

        // Crawl the URL content
        logger.info(`Starting to crawl URL: ${url}`);
        
        // Fixed authorization header format based on curl example
        const crawlHeaders: Record<string, string> = {
            'Content-Type': 'application/json'
        };
        
        if (FIRECRAWL_API_KEY) {
            // Drop the 'Bearer' prefix as the curl example doesn't use it
            crawlHeaders['Authorization'] = `Bearer ${FIRECRAWL_API_KEY}`;
            logger.debug('Using Firecrawl API key for authentication');
        } else {
            logger.warn('No Firecrawl API key found in environment variables');
            return NextResponse.json(
                { 
                    error: 'Configuration error', 
                    message: 'Firecrawl API key is missing. Please check your environment variables.' 
                }, 
                { status: 500 }
            );
        }
        
        // Construct URLs with base URL
        const crawlUrl = `${FIRECRAWL_BASE_URL}/crawl`;
        
        // Use array format for URLs parameter as shown in the curl example
        const crawlBody = {
            urls: [url],
            priority: 10
        };
        
        const crawlResponse = await fetchWithLogging(crawlUrl, {
            method: 'POST',
            headers: crawlHeaders,
            body: JSON.stringify(crawlBody)
        });

        if (!crawlResponse.ok) {
            const errorStatus = crawlResponse.status;
            let errorData;
            
            try {
                errorData = await crawlResponse.json();
            } catch (e) {
                errorData = { message: 'Could not parse error response' };
            }
            
            logger.error(`Crawl request failed with status ${errorStatus}`, errorData);
            
            return NextResponse.json(
                {
                    error: 'Failed to initiate crawl',
                    message: errorData?.detail || `HTTP error! status: ${crawlResponse.status}`,
                    responseStatus: crawlResponse.status,
                },
                { status: errorStatus }
            );
        }

        const crawlData = await crawlResponse.json();
        const { task_id } = crawlData;
        logger.info(`Crawl task initiated with task ID: ${task_id}`);

        // Polling task status with enhanced timeout handling
        let taskResult: FirecrawlTaskResponse | null = null;
        let status = 'pending';
        let pollCount = 0;
        const maxPolls = 25; // Reduced from 30 to fit within 60-second timeout
        const startTime = Date.now();
        const timeoutMs = 50000; // 50 seconds timeout to leave buffer for processing
        
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
                headers: crawlHeaders
            });
            
            if (!taskResponse.ok) {
                let errorData;
                try {
                    errorData = await taskResponse.json();
                } catch (e) {
                    errorData = { message: 'Could not parse error response' };
                }
                
                logger.error(`Failed to get task status: ${taskResponse.status}`, errorData);
                return NextResponse.json(
                    { error: 'Failed to fetch task status', message: errorData?.detail || `HTTP error! status: ${taskResponse.status}` },
                    { status: 500 }
                );
            }
            
            taskResult = await taskResponse.json() as FirecrawlTaskResponse;
            status = taskResult.status;
            logger.debug(`Task status: ${status}`, { 
                elapsed: Math.round((Date.now() - startTime) / 1000) + 's',
                progress: taskResult.result?.status_code ? `HTTP ${taskResult.result.status_code}` : 'In progress' 
            });
            
            if (status !== 'completed' && status !== 'failed') {
                // Variable wait time with maximum cap
                const waitTime = Math.min(1500 * Math.pow(1.1, pollCount), 5000);
                await new Promise(resolve => setTimeout(resolve, waitTime));
            }
        }
        
        if (status === 'failed') {
            logger.error('Crawl task failed', taskResult);
            return NextResponse.json(
                { 
                    error: 'Crawl task failed',
                    message: taskResult?.result?.error_message || 'The crawl task failed without a specific error message' 
                },
                { status: 400 }
            );
        }
        
        if (!taskResult || status !== 'completed') {
            logger.error('Crawl task did not complete in time', { task_id, status });
            
            // Instead of returning an error, provide a way to check the status later
            return NextResponse.json({
                status: 'pending',
                message: 'The crawl task is still in progress. Please check status later.',
                taskId: task_id,
                pollUrl: `${FIRECRAWL_BASE_URL}/task/${task_id}`
            }, { status: 202 }); // 202 Accepted indicates the task is still processing
        }

        logger.info('Crawl task completed', { 
            task_id, 
            status: taskResult?.status,
            has_result: !!taskResult?.result,
            has_results: !!taskResult?.results && taskResult.results.length > 0
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
                    taskData: taskResult
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
            markdownContent = `# ${resultData.metadata?.title || 'Web Page Content'}\n\n${resultData.cleaned_html}`;
            logger.warn('No markdown available, using cleaned HTML');
        } else {
            logger.error('No usable content found in result data', resultData);
            return NextResponse.json(
                {
                    error: 'Failed to extract content',
                    message: 'The crawl completed, but no markdown or HTML content was found.',
                    url: resultData.url
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
                `Title: ${metadata.title || 'Untitled'}`,
                `URL: ${resultData.url}`,
                metadata.description ? `Description: ${metadata.description}` : null,
                metadata.author ? `Author: ${metadata.author}` : null,
                `Date Crawled: ${new Date().toISOString()}`,
                '---\n\n'
            ].filter(Boolean).join('\n');
            
            markdownContent = metadataSection + markdownContent;
        }

        // Add link information if available
        if (resultData.links?.external?.length) {
            const externalLinks = resultData.links.external;
            if (externalLinks.length > 0) {
                const linkSection = [
                    '\n\n## External Links\n',
                    ...externalLinks.map(link => `- [${link.text || link.href}](${link.href})${link.title ? ` - ${link.title}` : ''}`)
                ].join('\n');
                
                markdownContent += linkSection;
            }
        }

        // Get Pinecone client
        logger.info('Initializing Pinecone client');
        const pinecone = getPineconeClient();
        if (!pinecone) {
            logger.error('Pinecone client initialization failed');
            return NextResponse.json(
                { error: 'Pinecone client initialization failed' }, 
                { status: 500 }
            );
        }

        // Create temporary file with enhanced crawled content
        const fileName = `url-${uuidv4()}.md`;
        const tempDir = os.tmpdir();
        const tempFilePath = path.join(tempDir, fileName);
        
        logger.info(`Creating temporary file: ${tempFilePath}`);
        
        try {
            // Write content to temporary file
            fs.writeFileSync(tempFilePath, markdownContent);
            logger.debug('Content written to temporary file');

            // Try to upload to Pinecone with retries
            logger.info(`Uploading content to Pinecone index: ${pinecone_name}`);
            
            // Retry configuration
            const maxRetries = 3;
            const initialRetryDelay = 1000; // 1 second
            
            let uploadResult = null;
            let lastError = null;
            
            for (let attempt = 0; attempt < maxRetries; attempt++) {
                try {
                    // Create a new Pinecone Assistant instance each time to avoid connection reuse issues
                    const pineconeAssistant = pinecone.Assistant(pinecone_name);
                    
                    // Validate assistant existence by attempting a simple operation
                    try {
                        logger.debug(`Validating Pinecone assistant: ${pinecone_name} (attempt ${attempt + 1}/${maxRetries})`);
                        
                        // We only need to do this check on the first attempt
                        if (attempt === 0) {
                            try {
                                await pineconeAssistant.listFiles();
                                logger.debug(`Pinecone assistant validated: ${pinecone_name}`);
                            } catch (verifyError: any) {
                                // Only throw if it's a not found error, other errors may resolve with retries
                                if (verifyError instanceof PineconeNotFoundError) {
                                    logger.error(`Pinecone assistant not found: ${pinecone_name}`, verifyError);
                                    throw verifyError; // Rethrow to be caught by outer catch
                                }
                                // For connection errors, we'll continue with the upload attempt
                                // as the retry logic will handle those
                            }
                        }
                    } catch (verifyError: any) {
                        // Explicit handling for verification errors
                        if (verifyError instanceof PineconeNotFoundError) {
                            throw new Error(`The Pinecone assistant "${pinecone_name}" doesn't exist. Please check your configuration.`);
                        }
                        throw verifyError; // Rethrow other errors
                    }
                    
                    // Upload the file
                    uploadResult = await pineconeAssistant.uploadFile({
                        path: tempFilePath,
                        metadata: { 
                            source: url,
                            type: 'webpage',
                            dateAdded: new Date().toISOString(),
                            assistantId: assistantId,
                            userId: user.id,
                            title: resultData?.metadata?.title || '',
                            description: resultData?.metadata?.description || ''
                        }
                    });
                    
                    // If we get here, upload was successful
                    break;
                    
                } catch (uploadError: any) {
                    lastError = uploadError;
                    
                    // Check error type to determine if we should retry
                    if ((uploadError instanceof PineconeConnectionError || 
                         uploadError?.code === 'UND_ERR_CONNECT_TIMEOUT') && 
                        attempt < maxRetries - 1) {
                        // Only retry on connection errors, not other types
                        logger.warn(`Pinecone upload failed on attempt ${attempt + 1}/${maxRetries}, retrying...`, {
                            error: uploadError.message,
                            name: uploadError.name,
                            code: uploadError.code
                        });
                        
                        // Exponential backoff
                        await new Promise(r => setTimeout(r, initialRetryDelay * Math.pow(2, attempt)));
                    } else {
                        // Either not a connection error or last attempt
                        logger.error(`Pinecone upload failed on attempt ${attempt + 1}/${maxRetries}`, uploadError);
                        throw uploadError;
                    }
                }
            }
            
            // Clean up temporary file
            logger.debug('Removing temporary file');
            fs.unlinkSync(tempFilePath);
            
            if (!uploadResult) {
                throw lastError || new Error('Failed to upload to Pinecone after multiple attempts');
            }
            
            logger.info(`Successfully uploaded URL content to Pinecone with ID: ${uploadResult.id}`);
            
            return NextResponse.json({ 
                message: 'URL content uploaded successfully',
                fileId: uploadResult.id,
                source: url,
                title: resultData?.metadata?.title || '',
                contentLength: contentLength
            });
        } catch (error: any) {
            // Clean up file if it exists and there was an error
            if (fs.existsSync(tempFilePath)) {
                logger.debug('Cleaning up temporary file after error');
                fs.unlinkSync(tempFilePath);
            }
            
            // Detailed error handling based on error types
            const errorDetails = {
                message: error.message || 'An error occurred during content upload',
                type: error.name || 'Unknown',
                cause: error.cause ? (error.cause.message || String(error.cause)) : undefined
            };
            
            // Format user-friendly error message based on error type
            let userMessage = 'Failed to upload URL content';
            let statusCode = 500;
            
            if (error instanceof PineconeConnectionError) {
                userMessage = 'Unable to connect to the Pinecone service. The service might be temporarily unavailable.';
                logger.error('Pinecone connection error', errorDetails);
            } else if (error instanceof PineconeNotFoundError) {
                userMessage = `The assistant configuration is invalid. Please contact support.`;
                statusCode = 400;
                logger.error('Pinecone assistant not found', errorDetails);
            } else if (error.code === 'ECONNREFUSED' || error.code === 'UND_ERR_CONNECT_TIMEOUT') {
                userMessage = 'Connection to the knowledge base timed out. Please try again later.';
                logger.error('Connection timeout error', errorDetails);
            } else {
                logger.error('Unexpected error uploading URL content', errorDetails);
            }
            
            return NextResponse.json(
                { 
                    error: userMessage,
                    details: `${errorDetails.type}: ${errorDetails.message}${errorDetails.cause ? ` (Caused by: ${errorDetails.cause})` : ''}`
                }, 
                { status: statusCode }
            );
        }
    } catch (e: any) {
        logger.error('Unexpected error in crawl endpoint', e);
        return NextResponse.json({ 
            error: 'Internal server error',
            message: e.message || 'An unexpected error occurred',
            stack: process.env.NODE_ENV === 'development' ? e.stack : undefined
        }, { status: 500 });
    }
}
