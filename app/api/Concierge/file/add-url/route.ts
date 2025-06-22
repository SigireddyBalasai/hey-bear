import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { requireAuth } from '@/utils/auth-utils';
import { FirecrawlClient } from '@/utils/crawl/firecrawl-client-new';
import type { RequestBody } from '@/utils/crawl/firecrawl-types';
import {
  CrawlErrorHandler,
  PineconeUploadManager,
  RequestValidator,
} from '@/utils/crawl/upload-manager';
import { WebContentProcessor } from '@/utils/crawl/web-content-processor';
import { createClient } from '@/utils/supabase/server';

// Set maxDuration to 60 seconds to comply with Vercel hobby plan limitations
export const maxDuration = 60;

export const POST = requireAuth(async (context, req: NextRequest) => {
  const supabase = await createClient();
  const { user } = context;

  let tempFilePath: string | null = null;

  try {
    // Parse and validate request body
    let body: RequestBody;

    try {
      body = (await req.json()) as RequestBody;
    } catch {
      return NextResponse.json(
        { error: 'Invalid request: Could not parse JSON body' },
        { status: 400 }
      );
    }

    const { assistantId, pinecone_name, url } = body;

    // Validate required fields
    const validation = RequestValidator.validateBody(body);

    if (!validation.isValid) {
      return NextResponse.json(
        { error: `Missing required fields: ${validation.missingFields.join(', ')}` },
        { status: 400 }
      );
    }

    // Validate URL format
    if (!RequestValidator.validateUrl(url)) {
      return NextResponse.json({ error: 'Invalid URL format' }, { status: 400 });
    }

    // Verify assistant exists
    const { data: assistant, error: assistantError } = await supabase
      .from('assistants')
      .select('*')
      .eq('id', assistantId)
      .single();

    if (assistantError || !assistant) {
      return NextResponse.json(
        { error: 'Assistant not found or you do not have permission to modify it' },
        { status: 404 }
      );
    }

    // Initialize Firecrawl client and crawl the URL
    const firecrawlClient = new FirecrawlClient();
    const resultData = await firecrawlClient.crawlAndWait(url);

    // Process the crawled content
    const markdownContent = WebContentProcessor.extractContent(resultData, url);

    tempFilePath = WebContentProcessor.createTempFile(markdownContent);

    // Upload to Pinecone with retry logic
    const uploadManager = new PineconeUploadManager();
    const uploadResult = await uploadManager.uploadWithRetry(
      tempFilePath,
      pinecone_name,
      url,
      assistantId,
      user.id,
      resultData
    );

    // Clean up temporary file
    WebContentProcessor.cleanupTempFile(tempFilePath);
    tempFilePath = null;

    return NextResponse.json({
      message: 'URL content uploaded successfully',
      fileId: uploadResult.id,
      source: url,
      title: resultData?.metadata?.title ?? '',
      contentLength: markdownContent.length,
    });
  } catch (error: unknown) {
    // Clean up temporary file if it exists
    if (tempFilePath) {
      WebContentProcessor.cleanupTempFile(tempFilePath);
    }

    // Handle and return appropriate error response
    return CrawlErrorHandler.handleError(error);
  } finally {
    // Final cleanup in case of unexpected exits
    if (tempFilePath) {
      WebContentProcessor.cleanupTempFile(tempFilePath);
    }
  }
});
