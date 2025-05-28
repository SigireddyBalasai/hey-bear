import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server';
import { getPineconeClient } from '@/lib/pinecone';
import { createClient } from '@/utils/supabase/server';
import type { PostgrestError } from '@supabase/supabase-js';
import type { Database } from '@/lib/db.types'; // Import Database type

// Define the type for the data expected from Supabase using db.types.ts
type AssistantConfigFromDb = Database['assistants']['Tables']['assistant_configs']['Row'];
type AssistantFromDb = Database['assistants']['Tables']['assistants']['Row'];

type TypedAssistantWithSpecificConfig = AssistantFromDb & {
  // !inner join in select means assistant_configs object is expected
  assistant_configs: AssistantConfigFromDb; // Changed from Pick to full type
};

export async function POST(req: NextRequest) {
  try {
    // Validate request body
    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: 'Invalid request format' }, { status: 400 });
    }

    const { assistantId, pinecone_name, fileId } = body;
    
    if (!assistantId || !fileId) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    const supabase = await createClient();

    // Check user authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.error('Auth error:', authError);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get pinecone_name if not provided
    let assistantPineconeName = pinecone_name;
    
    if (!assistantPineconeName) {
      const { data: assistantData, error: assistantError } = await supabase
        .schema('assistants')
        .from('assistants')
        .select('id, assistant_configs!inner(*)') // Fetch all columns from assistant_configs
        .eq('id', assistantId)
        .single<TypedAssistantWithSpecificConfig>(); // Use the new type
      
      if (assistantError) {
        console.error('Error fetching assistant data or configuration:', assistantError);
        const errorCode = (assistantError as PostgrestError)?.code;
        return NextResponse.json({ error: 'Failed to fetch assistant configuration', details: assistantError.message }, { status: errorCode === 'PGRST116' ? 404 : 500 });
      }

      if (!assistantData) {
          console.error('Assistant data is unexpectedly null after a successful query for ID:', assistantId);
          return NextResponse.json({ error: 'Assistant not found (unexpected null data)' }, { status: 404 });
      }
      
      // assistant_configs is guaranteed by !inner join and TypedAssistantWithSpecificConfig type.
      // pinecone_name itself can be null in the database.
      const fetchedPineconeName = assistantData.assistant_configs.pinecone_name;

      if (fetchedPineconeName) {
        assistantPineconeName = fetchedPineconeName;
      } else {
        // This branch means pinecone_name was explicitly NULL in the database.
        console.warn(`pinecone_name is null in assistant_configs for assistant ID: ${assistantId}. Fetched data:`, assistantData);
      }

      if (!assistantPineconeName) { // True if pinecone_name from body was falsy AND fetchedPineconeName was null
        return NextResponse.json({ error: 'Pinecone configuration (pinecone_name) not found for assistant.' }, { status: 500 });
      }
    }
    
    try {
      // Get Pinecone client and delete file from this assistant
      const pinecone = getPineconeClient();
      if (!pinecone) {
        return NextResponse.json({ error: 'Pinecone client initialization failed' }, { status: 500 });
      }
      
      const assistant = pinecone.Assistant(assistantPineconeName);
      await assistant.deleteFile(fileId);

      return NextResponse.json({ 
        message: 'File deletion initiated',
        fileId: fileId
      });
    } catch (error: unknown) {
      console.error('Error deleting file:', error);
      let errorMessage = 'An unknown error occurred';
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      return NextResponse.json(
        { error: `Failed to delete file: ${errorMessage}` }, 
        { status: 500 }
      );
    }
  } catch (e: unknown) {
    console.error('Unexpected error:', e);
    let errorMessage = 'An internal server error occurred';
    if (e instanceof Error) {
      errorMessage = e.message;
    }
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
