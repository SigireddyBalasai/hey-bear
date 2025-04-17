import { createClient } from '@/utils/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { getPineconeClient } from '@/lib/pinecone';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';



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
                { error: 'Concierge not found or you do not have permission to modify it' },
                { status: 404 }
            );
        }

        // Crawl the URL content
        console.log(`Starting to crawl URL: ${url}`);
        const crawlResponse = await fetch('http://34.30.131.11:11235/crawl', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ urls: url, priority: 10 }),
        });

        if (!crawlResponse.ok) {
            const errorData = await crawlResponse.json();
            console.error('Error initiating crawl:', errorData);
            return NextResponse.json(
                {
                    error: 'Failed to initiate crawl',
                    message: errorData?.detail || `HTTP error! status: ${crawlResponse.status}`,
                },
                { status: 400 }
            );
        }

        const { task_id } = await crawlResponse.json();
        console.log(`Crawl task initiated with task ID: ${task_id}`);

        let taskResult;
        let status = 'pending';
        while (status !== 'completed') {
            const taskResponse = await fetch(`http://34.30.131.11:11235/task/${task_id}`);
            if (!taskResponse.ok) {
                const errorData = await taskResponse.json();
                console.error('Error fetching task status:', errorData);
                return NextResponse.json(
                    { error: 'Failed to fetch task status', message: errorData?.detail || `HTTP error! status: ${taskResponse.status}` },
                    { status: 500 }
                );
            }
            taskResult = await taskResponse.json();
            status = taskResult.status;
            if (status !== 'completed') {
                await new Promise(resolve => setTimeout(resolve, 2000)); // Poll every 2 seconds
            }
        }

        if (!taskResult?.result?.markdown) {
            console.error('Failed to extract content or empty markdown:', taskResult);
            return NextResponse.json(
                {
                    error: 'Failed to extract content from the URL or received empty content',
                    message: 'The crawl task completed, but no markdown content was found in the result.',
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
            fs.writeFileSync(tempFilePath, taskResult.result.markdown);

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
