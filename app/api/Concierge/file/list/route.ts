import type { AssistantFilesList } from '@pinecone-database/pinecone';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';


import { getPineconeClient } from '@/lib/pinecone';
import type { ListFilesRequest } from '@/types/api.types';
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
        .from('assistants')
        .select(
          `
          *,
          assistant_configs!inner(pinecone_name)
        `
        )
        .eq('id', assistantId)
        .single<AssistantWithConfig>();

      if (assistantError) {
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
      }

      if (!assistantPineconeName) {
        // It's possible an assistant exists but has no pinecone_name configured yet.
        // Depending on business logic, this might be an error or a valid state where no files can be listed.
        // For now, treating as an error if pinecone_name is essential for listing files.
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
      return NextResponse.json({ error: 'Pinecone configuration error' }, { status: 500 });
    }

    try {
      // Get Pinecone client and list files for this assistant
      const pinecone = getPineconeClient();
      const assistant = pinecone.Assistant(assistantPineconeName); // assistantPineconeName is guaranteed non-null
      const filesResponse: AssistantFilesList = await assistant.listFiles();

      // Extract the files array from the Pinecone response
      // The AssistantFilesList might have a structure like { files: [...] } or be an array directly
      const files = Array.isArray(filesResponse) ? filesResponse : filesResponse.files || [];

      return NextResponse.json({ files });
    } catch (error: unknown) {
      let errorMessage = 'An unknown error occurred';

      if (error instanceof Error) {
        errorMessage = error.message;
      }

      return NextResponse.json({ error: `Failed to list files: ${errorMessage}` }, { status: 500 });
    }
  } catch (error: unknown) {
    let errorMessage = 'An internal server error occurred';

    if (error instanceof Error) {
      errorMessage = error.message;
    }

    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
});
