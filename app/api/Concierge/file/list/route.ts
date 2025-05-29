import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Added import

import type { Database } from '@/lib/db.types';
import { getPineconeClient } from '@/lib/pinecone';
import { createClient } from '@/utils/supabase/server';

// Define types based on db.types.ts
type AssistantConfigFromDb = Database['assistants']['Tables']['assistant_configs']['Row'];
type AssistantFromDb = Database['assistants']['Tables']['assistants']['Row'];

// Type for an assistant with its full configuration
type TypedAssistantWithFullConfig = AssistantFromDb & {
  assistant_configs: AssistantConfigFromDb; // Non-nullable due to the inner join with assistant_configs
};

export async function POST(req: NextRequest) {
  try {
    // Validate request body
    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: 'Invalid request format' }, { status: 400 });
    }

    const { assistantId, pinecone_name: providedPineconeName } = body as {
      assistantId?: string;
      pinecone_name?: string;
    }; // Type assertion for body

    // Validate required fields
    if (!assistantId) {
      return NextResponse.json({ error: 'Missing assistantId' }, { status: 400 }); // Corrected error message
    }

    const supabase = await createClient();

    // Check user authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error('Auth error:', authError);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // If pinecone_name wasn't provided in the request, fetch it from the database
    let assistantPineconeName: string | null = providedPineconeName ?? null;

    if (!assistantPineconeName) {
      // Fetch the assistant and its configuration from the database
      const { data: assistantData, error: assistantError } = await supabase
        .schema('assistants') // Schema for the 'assistants' table
        .from('assistants') // The 'assistants' table
        .select('id, assistant_configs!inner(*)') // Fetch all columns from assistant_configs
        .eq('id', assistantId)
        .single<TypedAssistantWithFullConfig>(); // Apply the updated type here

      if (assistantError) {
        console.error('Error fetching assistant data or configuration:', assistantError);
        const errorCode = (assistantError).code;
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
      const files = await assistant.listFiles();

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
}
