import { NextRequest, NextResponse } from 'next/server';
import { Pinecone } from '@pinecone-database/pinecone';
import { createClient } from '@/utils/supabase/server';
import fs from 'fs';
import os from 'os';
import path from 'path';

export async function POST(req: NextRequest) {
  try {
    // Validate form data
    const formData = await req.formData().catch(() => null);
    if (!formData) {
      return NextResponse.json({ error: 'Invalid form data' }, { status: 400 });
    }
    
    const assistantName = formData.get('assistantName') as string | null;
    const file = formData.get('file') as File | null;
    
    // Validate required fields
    if (!assistantName) {
      return NextResponse.json({ error: 'Assistant name is required' }, { status: 400 });
    }
    
    if (!file) {
      return NextResponse.json({ error: 'File is required' }, { status: 400 });
    }
    
    // Authenticate user
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.error('Auth error:', authError);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    try {
      // Create temp file
      const tempDir = os.tmpdir();
      const fileName = file.name || `upload-${Date.now()}`;
      const tempPath = path.join(tempDir, fileName);
      
      try {
        const buffer = Buffer.from(await file.arrayBuffer());
        await fs.promises.writeFile(tempPath, buffer);
      } catch (fileError) {
        console.error('File processing error:', fileError);
        return NextResponse.json({ error: 'Failed to process uploaded file' }, { status: 500 });
      }
      
      // Initialize Pinecone
      const pinecone = new Pinecone();
      if (!pinecone) {
        await cleanupTempFile(tempPath);
        return NextResponse.json({ error: 'Pinecone client initialization failed' }, { status: 500 });
      }
      
      // Get assistant
      const assistant = pinecone.assistant(assistantName);
      if (!assistant) {
        await cleanupTempFile(tempPath);
        return NextResponse.json({ error: 'Failed to create assistant reference' }, { status: 500 });
      }
      
      // Set metadata
      const now = new Date();
      const date = now.toISOString().split("T")[0] || '';
      const time = now.toTimeString().split(" ")[0] || '';
      
      // Upload file
      try {
        await assistant.uploadFile({
          path: tempPath,
          metadata: {
            userid: user.id || '',
            email: user.email || '',
            date,
            time
          }
        });
      } catch (uploadError) {
        console.error('File upload error:', uploadError);
        await cleanupTempFile(tempPath);
        return NextResponse.json({ error: 'Failed to upload file to assistant' }, { status: 500 });
      }
      
      // Clean up temp file
      await cleanupTempFile(tempPath);
      
      // Update file record in database (optional)
      const { error: dbError } = await supabase.from('assistant_files').insert({
        user_id: user.id,
        assistant_id: assistantName,
        file_name: fileName,
        uploaded_at: now.toISOString(),
      });
      
      if (dbError) {
        console.error('Error recording file upload in database:', dbError);
        // Continue since the file was uploaded to Pinecone successfully
      }
      
      return NextResponse.json({ message: `File ${fileName} uploaded to ${assistantName}` });
    } catch (assistantError) {
      console.error('Assistant error:', assistantError);
      return NextResponse.json(
        { error: 'Failed to upload file to assistant' }, 
        { status: 500 }
      );
    }
  } catch (e) {
    console.error('Unexpected error:', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Helper function to clean up temp file
async function cleanupTempFile(filePath: string): Promise<void> {
  try {
    await fs.promises.access(filePath);
    await fs.promises.unlink(filePath);
  } catch (err) {
    console.error('Error cleaning up temp file:', err);
    // Fail silently as this is cleanup code
  }
}