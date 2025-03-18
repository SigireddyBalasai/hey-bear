import { createClient } from '@/utils/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import FirecrawlApp from '@mendable/firecrawl-js';
import { v4 as uuidv4 } from 'uuid';
import { getPineconeClient } from '@/lib/pinecone';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { ScrapeResponse } from '@mendable/firecrawl-js';


export const maxDuration = 60;
const FIRECRAWL_API_KEY = process.env.FIRECRAWL_API_KEY!;

export async function POST(req: NextRequest) {
    const supabase = await createClient();

    try {
        // Authenticate user
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json(
                { error: 'Unauthorized: Please sign in to continue' },
                { status: 401 }
            );
        }

        // Validate request body
        const { assistantId, pinecone_name, url } = await req.json();
        if (!assistantId || !pinecone_name || !url) {
            return NextResponse.json(
                { error: 'Missing required fields: assistantId, pinecone_name, or url' },
                { status: 400 }
            );
        }

        // Validate URL format
        try {
            new URL(url);
        } catch (e) {
            return NextResponse.json(
                { error: 'Invalid URL format' },
                { status: 400 }
            );
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

        // Crawl the URL content
        console.log(`Starting to crawl URL: ${url}`);
        const app = new FirecrawlApp({ apiKey: FIRECRAWL_API_KEY });
        const crawlResult = await app.scrapeUrl(url);
        
        // Check crawl results
        if (crawlResult.error) {
            console.error('Error crawling URL:', crawlResult.error);
            return NextResponse.json(
                { 
                    error: 'Failed to crawl the URL',
                    message: crawlResult.error || 'The URL could not be accessed properly.'
                },
                { status: 400 }
            );
        }

        // Type narrowing - we now know it's a successful ScrapeResponse
        const successResult = crawlResult as ScrapeResponse<any, never>;
        
        if (!successResult.markdown) {
            console.error('Failed to extract content from URL:', url);
            return NextResponse.json(
                { 
                    error: 'Failed to extract content from the URL',
                    message: 'The URL could not be crawled or returned empty content. Please verify the URL is accessible.'
                },
                { status: 400 }
            );
        }

        // Get Pinecone client
        const pinecone = getPineconeClient();
        if (!pinecone) {
            return NextResponse.json(
                { error: 'Pinecone client initialization failed' }, 
                { status: 500 }
            );
        }

        // Create temporary file with crawled content
        const fileName = `url-${uuidv4()}.md`;
        const tempDir = os.tmpdir();
        const tempFilePath = path.join(tempDir, fileName);
        
        try {
            // Write content to temporary file and upload to Pinecone
            fs.writeFileSync(tempFilePath, successResult.markdown);

            const pineconeAssistant = pinecone.Assistant(pinecone_name);
            const uploadResult = await pineconeAssistant.uploadFile({
                path: tempFilePath,
                metadata: { 
                    source: url,
                    type: 'webpage',
                    dateAdded: new Date().toISOString()
                }
            });
            fs.unlinkSync(tempFilePath);
            
            console.log(`Successfully uploaded URL content to Pinecone with ID: ${uploadResult.id}`);
            
            return NextResponse.json({ 
                message: 'URL content uploaded successfully',
                fileId: uploadResult.id,
                source: url
            });
        } catch (error: any) {
            // Clean up file if it exists and there was an error
            if (fs.existsSync(tempFilePath)) {
                fs.unlinkSync(tempFilePath);
            }
            
            console.error('Error uploading URL content to Pinecone:', error);
            return NextResponse.json(
                { 
                    error: 'Failed to upload URL content',
                    message: error.message || 'An error occurred during content upload'  
                }, 
                { status: 500 }
            );
        }
    } catch (e: any) {
        console.error('Unexpected error:', e);
        return NextResponse.json({ 
            error: 'Internal server error',
            message: e.message || 'An unexpected error occurred'
        }, { status: 500 });
    }
}
