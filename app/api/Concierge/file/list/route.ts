import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

import type { AssistantFilesList } from '@pinecone-database/pinecone';

import { getPineconeClient } from '@/lib/pinecone';
import type { Database } from '@/types/db.types';
import { requireAuth } from '@/utils/auth-utils';
import { createClient } from '@/utils/supabase/server';

// Use Supabase database types directly
type AssistantConfigRow = Database['public']['Tables']['assistant_configs']['Row'];
type AssistantRow = Database['public']['Tables']['assistants']['Row'];

// Type for an assistant with its full configuration using Supabase types
type AssistantWithConfig = AssistantRow & {
  assistant_configs: AssistantConfigRow; // Non-nullable due to the inner join
};

// Request body interface using proper naming
interface ListFilesRequest {
  assistantId?: string;
  pinecone_name?: string;
}

export const POST = requireAuth(async (context, req: NextRequest) => {
  try {
    // Validate request body with proper typing
    const body = (await req.json()) as ListFilesRequest;

    const { assistantId, pinecone_name: providedPineconeName } = body;

    // Validate required fields
    if (!assistantId) {
      return NextResponse.json({ error: 'Missing assistantId' }, { status: 400 }); // Corrected error message
    }

    const supabase = await createClient();

    // If pinecone_name wasn't provided in the request, fetch it from the database
    let assistantPineconeName: string | null = providedPineconeName ?? null;

    if (!assistantPineconeName) {
      // Fetch the assistant and its configuration from the database
      const { data: assistantData, error: assistantError } = await supabase
        // Schema for the 'assistants' table
        .from('assistants') // The 'assistants' table
        .select('id, assistant_configs!inner(*)') // Fetch all columns from assistant_configs
        .eq('id', assistantId)
        .single<AssistantWithConfig>(); // Use the Supabase-based type

      if (assistantError) {
        console.error('Error fetching assistant data or configuration:', assistantError);
        const errorCode = assistantError.code;
        return NextResponse.json(
          { error: 'Failed to fetch assistant configuration', details: assistantError.message },
          { status: errorCode === 'PGRST116' ? 404 : 500 }
        );
      }

      // Extract pinecone_name from the joined data
      // If assistantData is not null, assistant_configs is guaranteed to be present due to the inner join.
      if (assistantData.assistant_configs.pinecone_name) {
        assistantPineconeName = assistantData.assistant_configs.pinecone_name;
      } else {
        console.warn(
          `pinecone_name is missing or null on assistant_configs for assistant ID: ${assistantId}. Fetched config:`,
          assistantData.assistant_configs
        );
      }

      if (!assistantPineconeName) {
        // It's possible an assistant exists but has no pinecone_name configured yet.
        // Depending on business logic, this might be an error or a valid state where no files can be listed.
        // For now, treating as an error if pinecone_name is essential for listing files.
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

    // Ensure assistantPineconeName is not null or undefined before using it
    if (!assistantPineconeName) {
      // This case should ideally be caught by the logic above, but as a safeguard:
      console.error(
        'Critical error: assistantPineconeName is null or undefined before Pinecone Assistant initialization.'
      );
      return NextResponse.json({ error: 'Pinecone configuration error' }, { status: 500 });
    }

    try {
      // Get Pinecone client and list files for this assistant
      const pinecone = getPineconeClient();
      const assistant = pinecone.Assistant(assistantPineconeName); // assistantPineconeName is guaranteed non-null
      const files: AssistantFilesList = await assistant.listFiles();

      return NextResponse.json({ files });
    } catch (error: unknown) {
      console.error('Error listing assistant files:', error);
      let errorMessage = 'An unknown error occurred';
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      return NextResponse.json({ error: `Failed to list files: ${errorMessage}` }, { status: 500 });
    }
  } catch (error: unknown) {
    console.error('Unexpected error:', error);
    let errorMessage = 'An internal server error occurred';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
});
