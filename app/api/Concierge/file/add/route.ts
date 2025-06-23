import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import type { UploadFileOptions } from '@pinecone-database/pinecone';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { getPineconeClient } from '@/lib/pinecone';
import type { Database } from '@/types/db.types';
import { requireAuth } from '@/utils/auth-utils';
import { createClient } from '@/utils/supabase/server';

// List of allowed file types
const ALLOWED_FILE_TYPES = new Set([
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
]);

// Define types based on db.types.ts
type AssistantConfigFromDb = Database['public']['Tables']['assistant_configs']['Row'];
type AssistantFromDb = Database['public']['Tables']['assistants']['Row'];

// Type for an assistant with its configuration, specifically needing pinecone_name
type TypedAssistantWithSpecificConfig = AssistantFromDb & {
  assistant_configs: Pick<AssistantConfigFromDb, 'pinecone_name'> | null; // Can be null if no config
};

export const POST = requireAuth(async (context, req: NextRequest) => {
  try {
    const formData = await req.formData();
    const assistantId = formData.get('assistantId') as string;
    const providedPineconeName = formData.get('pinecone_name') as string | null; // Allow null
    const file = formData.get('file') as File | null; // Allow null and check

    if (!assistantId || !file) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    if (!ALLOWED_FILE_TYPES.has(file.type)) {
      return NextResponse.json(
        {
          error: 'Invalid file type',
          message: `File type "${file.type || 'unknown'}" is not supported. Allowed types: PDF, TXT, MD, CSV, HTML, Python, Word documents, and PowerPoint presentations.`,
        },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    let pinecone_name: string | null = providedPineconeName;

    if (!pinecone_name) {
      const { data: assistantData, error: assistantError } = await supabase
        .from('assistants')
        .select(
          `
          *,
          assistant_configs!inner(pinecone_name)
        `
        )
        .eq('id', assistantId)
        .single<TypedAssistantWithSpecificConfig>();

      if (assistantError) {
        console.error('Error fetching assistant data or configuration:', assistantError);
        const errorCode = assistantError.code;

        return NextResponse.json(
          { error: 'Failed to fetch assistant configuration', details: assistantError.message },
          { status: errorCode === 'PGRST116' ? 404 : 500 }
        );
      }

      // Access pinecone_name safely
      if (assistantData.assistant_configs?.pinecone_name) {
        const { pinecone_name: configPineconeName } = assistantData.assistant_configs;

        pinecone_name = configPineconeName;
      } else {
        console.warn(
          `pinecone_name could not be determined from assistant_configs for assistant ID: ${assistantId}. Fetched data:`,
          assistantData
        );
      }

      if (!pinecone_name) {
        console.error(
          'pinecone_name is missing for assistant ID:',
          assistantId,
          '(neither provided nor found in configuration).'
        );

        return NextResponse.json(
          {
            error:
              'Invalid assistant configuration (pinecone_name is required but could not be determined)',
          },
          { status: 500 }
        );
      }
    }

    // Ensure pinecone_name is not null or undefined before using it
    if (!pinecone_name) {
      // This case should ideally be caught by the logic above, but as a safeguard:
      console.error(
        'Critical error: pinecone_name is null or undefined before Pinecone Assistant initialization.'
      );

      return NextResponse.json({ error: 'Pinecone configuration error' }, { status: 500 });
    }

    try {
      const tempDir = os.tmpdir();
      const tempFilePath = path.join(tempDir, file.name); // file is guaranteed to be non-null here
      const buffer = await file.arrayBuffer();

      await fs.writeFile(tempFilePath, Buffer.from(buffer));

      const pinecone = getPineconeClient();

      const assistant = pinecone.Assistant(pinecone_name); // pinecone_name is guaranteed non-null

      try {
        const options: UploadFileOptions = {
          path: tempFilePath,
        };
        const uploadResult = await assistant.uploadFile(options);

        await fs.unlink(tempFilePath).catch((error: unknown) => {
          console.warn('Error deleting temp file:', error);
        });

        return NextResponse.json({
          message: 'File uploaded successfully',
          fileId: uploadResult.id,
        });
      } catch (uploadError: unknown) {
        await fs.unlink(tempFilePath).catch((error: unknown) => {
          console.warn('Error deleting temp file:', error);
        });

        if (uploadError instanceof Error && uploadError.message.includes('Invalid file type')) {
          return NextResponse.json(
            {
              error: 'Invalid file type',
              message:
                'The file type is not supported by Pinecone. Please try a different format like PDF, TXT, or DOCX.',
            },
            { status: 400 }
          );
        }

        throw uploadError;
      }
    } catch (error: unknown) {
      console.error('Error uploading file:', error);
      let errorMessage = 'An unknown error occurred';

      if (error instanceof Error) {
        errorMessage = error.message;
      }

      return NextResponse.json(
        {
          error: 'Failed to upload file',
          message: errorMessage,
        },
        { status: 500 }
      );
    }
  } catch (error: unknown) {
    console.error('Unexpected error:', error);
    let errorMessage = 'An internal server error occurred';

    if (error instanceof Error) {
      errorMessage = error.message;
    }

    return NextResponse.json(
      {
        error: 'Internal server error',
        message: errorMessage,
      },
      { status: 500 }
    );
  }
});
