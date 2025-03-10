import { NextRequest, NextResponse } from 'next/server';
import { getPineconeClient } from '@/lib/pinecone';
import { createClient } from '@/utils/supabase/server';
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';
import { UploadFileOptions } from '@pinecone-database/pinecone';

// List of allowed file types
const ALLOWED_FILE_TYPES = [
  'application/pdf',
  'text/plain',
  'text/markdown',
  'text/csv',
  'text/html',
  'text/x-python',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // docx
  'application/msword', // doc
  'application/vnd.openxmlformats-officedocument.presentationml.presentation', // pptx
  'application/vnd.ms-powerpoint', // ppt
];

export async function POST(req: NextRequest) {
  try {
    // Parse the multipart form data
    const formData = await req.formData();
    const assistantId = formData.get('assistantId') as string;
    const providedPineconeName = formData.get('pinecone_name') as string;
    const file = formData.get('file') as File;

    if (!assistantId || !file) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    // Check file type
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      return NextResponse.json({
        error: 'Invalid file type',
        message: `File type "${file.type || 'unknown'}" is not supported. Allowed types: PDF, TXT, MD, CSV, HTML, Python, Word documents, and PowerPoint presentations.`
      }, { status: 400 });
    }

    const supabase = await createClient();

    // Check user authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.error('Auth error:', authError);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get pinecone_name if not provided
    let pinecone_name = providedPineconeName;
    
    if (!pinecone_name) {
      // Fetch the assistant from the database
      const { data: assistantData, error: assistantError } = await supabase
        .from('assistants')
        .select('pinecone_name')
        .eq('id', assistantId)
        .single();
      
      if (assistantError || !assistantData) {
        console.error('Error fetching assistant:', assistantError);
        return NextResponse.json({ error: 'Assistant not found' }, { status: 404 });
      }
      
      pinecone_name = assistantData.pinecone_name;
      if (!pinecone_name) {
        return NextResponse.json({ error: 'Invalid assistant configuration' }, { status: 500 });
      }
    }
    
    try {
      const tempDir = os.tmpdir();
      const tempFilePath = path.join(tempDir, file.name);
      const buffer = await file.arrayBuffer();
      await fs.writeFile(tempFilePath, Buffer.from(buffer));

      // Get Pinecone client and add file to this assistant
      const pinecone = getPineconeClient();
      if (!pinecone) {
        return NextResponse.json({ error: 'Pinecone client initialization failed' }, { status: 500 });
      }
      
      const assistant = pinecone.Assistant(pinecone_name);
      
      try {
        const uploadResult = await assistant.uploadFile({
          path: tempFilePath
        } as UploadFileOptions);

        // Clean up the temporary file
        await fs.unlink(tempFilePath).catch(err => console.warn('Error deleting temp file:', err));

        return NextResponse.json({ 
          message: 'File uploaded successfully',
          fileId: uploadResult.id
        });
      } catch (uploadError: any) {
        // Clean up the temporary file even if upload failed
        await fs.unlink(tempFilePath).catch(err => console.warn('Error deleting temp file:', err));
        
        // Check for specific Pinecone error messages
        if (uploadError.message && uploadError.message.includes('Invalid file type')) {
          return NextResponse.json({
            error: 'Invalid file type',
            message: 'The file type is not supported by Pinecone. Please try a different format like PDF, TXT, or DOCX.'
          }, { status: 400 });
        }
        
        // Re-throw other errors to be caught by the outer catch block
        throw uploadError;
      }
    } catch (error: any) {
      console.error('Error uploading file:', error);
      return NextResponse.json(
        { 
          error: 'Failed to upload file',
          message: error.message || 'An error occurred during file upload'  
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
