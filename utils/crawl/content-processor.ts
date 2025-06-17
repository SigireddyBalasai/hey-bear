import * as fs from 'node:fs';
import * as os from 'node:os';
import path from 'node:path';
import { v4 as uuidv4 } from 'uuid';
import { getPineconeClient } from '@/lib/pinecone';
import type { FirecrawlResult } from '@/types/api.types';
import { logger } from './logging';

/**
 * Processes crawled content and stores it in vector database
 */
export async function processAndStoreContent(
  crawlResults: FirecrawlResult[],
  assistantId: string,
  originalUrl: string
): Promise<{ processedCount: number; vectorIds: string[] }> {
  logger.info('Starting content processing', { 
    totalPages: crawlResults.length,
    assistantId,
    originalUrl 
  });

  const pinecone = getPineconeClient();
  const index = pinecone.Index('assistants');
  const vectorIds: string[] = [];
  let processedCount = 0;

  try {
    // Process each crawled page
    for (const [pageIndex, page] of crawlResults.entries()) {
      try {
        logger.info(`Processing page ${pageIndex + 1}/${crawlResults.length}`, {
          url: page.metadata?.sourceURL || 'unknown',
          title: page.metadata?.title || 'No title',
        });

        // Skip if no content
        if (!page.content || page.content.trim().length === 0) {
          logger.warn('Skipping page with no content', { url: page.metadata?.sourceURL });
          continue;
        }

        // Generate embeddings and store
        const vectorId = await createAndStoreEmbedding(
          page,
          assistantId,
          originalUrl,
          index
        );

        if (vectorId) {
          vectorIds.push(vectorId);
          processedCount++;
          logger.info(`Successfully processed page ${pageIndex + 1}`, { vectorId });
        }

      } catch (error) {
        logger.error(`Failed to process page ${pageIndex + 1}`, {
          url: page.metadata?.sourceURL,
          error: error instanceof Error ? error.message : String(error),
        });
        // Continue processing other pages
      }
    }

    logger.info('Content processing completed', {
      processedCount,
      totalPages: crawlResults.length,
      vectorIds: vectorIds.length,
    });

    return { processedCount, vectorIds };

  } catch (error) {
    logger.error('Critical error during content processing', {
      error: error instanceof Error ? error.message : String(error),
      assistantId,
    });
    throw error;
  }
}

/**
 * Creates embeddings and stores content in vector database
 */
async function createAndStoreEmbedding(
  page: FirecrawlResult,
  assistantId: string,
  originalUrl: string,
  index: any
): Promise<string | null> {
  try {
    // Chunk content if it's too large
    const chunks = chunkContent(page.content, 1000); // 1000 char chunks
    const vectorId = uuidv4();

    for (const [chunkIndex, chunk] of chunks.entries()) {
      const chunkId = chunks.length > 1 ? `${vectorId}-chunk-${chunkIndex}` : vectorId;

      // Generate embedding using OpenAI
      const embeddingResponse = await fetch('https://api.openai.com/v1/embeddings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'text-embedding-3-small',
          input: chunk,
        }),
      });

      if (!embeddingResponse.ok) {
        throw new Error(`Embedding API error: ${embeddingResponse.status}`);
      }

      const embeddingData = await embeddingResponse.json();
      const embedding = embeddingData.data[0].embedding;

      // Store in Pinecone
      await index.upsert([
        {
          id: chunkId,
          values: embedding,
          metadata: {
            assistant_id: assistantId,
            content: chunk,
            source_url: page.metadata?.sourceURL || originalUrl,
            title: page.metadata?.title || 'No title',
            original_url: originalUrl,
            chunk_index: chunkIndex,
            total_chunks: chunks.length,
            created_at: new Date().toISOString(),
          },
        },
      ]);
    }

    return vectorId;
  } catch (error) {
    logger.error('Failed to create and store embedding', {
      url: page.metadata?.sourceURL,
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}

/**
 * Splits content into smaller chunks for processing
 */
function chunkContent(content: string, chunkSize: number): string[] {
  if (content.length <= chunkSize) {
    return [content];
  }

  const chunks: string[] = [];
  let currentChunk = '';

  // Split by sentences first, then by words if needed
  const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);

  for (const sentence of sentences) {
    const trimmedSentence = sentence.trim();
    
    if (currentChunk.length + trimmedSentence.length + 1 <= chunkSize) {
      currentChunk += (currentChunk ? '. ' : '') + trimmedSentence;
    } else {
      if (currentChunk) {
        chunks.push(currentChunk + '.');
        currentChunk = '';
      }
      
      // If sentence is still too long, split by words
      if (trimmedSentence.length > chunkSize) {
        const words = trimmedSentence.split(' ');
        let wordChunk = '';
        
        for (const word of words) {
          if (wordChunk.length + word.length + 1 <= chunkSize) {
            wordChunk += (wordChunk ? ' ' : '') + word;
          } else {
            if (wordChunk) {
              chunks.push(wordChunk);
              wordChunk = '';
            }
            wordChunk = word;
          }
        }
        
        if (wordChunk) {
          currentChunk = wordChunk;
        }
      } else {
        currentChunk = trimmedSentence;
      }
    }
  }

  if (currentChunk) {
    chunks.push(currentChunk + '.');
  }

  return chunks.filter(chunk => chunk.trim().length > 0);
}

/**
 * Saves crawl progress to temporary file
 */
export function saveCrawlProgress(jobId: string, data: any): string {
  const tempFile = path.join(os.tmpdir(), `crawl-${jobId}.json`);
  fs.writeFileSync(tempFile, JSON.stringify(data, null, 2));
  logger.info('Crawl progress saved', { tempFile, jobId });
  return tempFile;
}

/**
 * Loads crawl progress from temporary file
 */
export function loadCrawlProgress(jobId: string): any | null {
  const tempFile = path.join(os.tmpdir(), `crawl-${jobId}.json`);
  
  try {
    if (fs.existsSync(tempFile)) {
      const data = JSON.parse(fs.readFileSync(tempFile, 'utf8'));
      logger.info('Crawl progress loaded', { tempFile, jobId });
      return data;
    }
  } catch (error) {
    logger.error('Failed to load crawl progress', { tempFile, error });
  }
  
  return null;
}

/**
 * Cleans up temporary files
 */
export function cleanupTempFiles(jobId: string): void {
  const tempFile = path.join(os.tmpdir(), `crawl-${jobId}.json`);
  
  try {
    if (fs.existsSync(tempFile)) {
      fs.unlinkSync(tempFile);
      logger.info('Temporary file cleaned up', { tempFile });
    }
  } catch (error) {
    logger.warn('Failed to cleanup temporary file', { tempFile, error });
  }
}
