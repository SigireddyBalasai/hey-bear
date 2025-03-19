import { NextRequest, NextResponse } from 'next/server';
import { getPineconeClient } from '@/lib/pinecone';
import { createClient } from '@/utils/supabase/server';

export async function POST(req: NextRequest) {
  try {
    // Validate request body
    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: 'Invalid request format' }, { status: 400 });
    }

    const { assistantId, pinecone_name } = body;
    
    // Validate required fields
    if (!assistantId) {
      return NextResponse.json({ error: 'Missing assistantId' }, { status: 400 });
    }
    
    const supabase = await createClient();

    // Check user authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.error('Auth error:', authError);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // If pinecone_name wasn't provided in the request, fetch it from the database
    let assistantPineconeName = pinecone_name;
    
    if (!assistantPineconeName) {
      // Fetch the assistant details from the database
      const { data: assistantData, error: assistantError } = await supabase
        .from('assistants')
        .select('pinecone_name')
        .eq('id', assistantId)
        .single();
      
      if (assistantError || !assistantData) {
        console.error('Error fetching concierge:', assistantError);
        return NextResponse.json({ error: 'Concierge not found' }, { status: 404 });
      }
      
      assistantPineconeName = assistantData.pinecone_name;
      if (!assistantPineconeName) {
        return NextResponse.json({ error: 'Invalid assistant configuration' }, { status: 500 });
      }
    }
    
    try {
      // Get Pinecone client and list files for this assistant
      const pinecone = getPineconeClient();
      if (!pinecone) {
        return NextResponse.json({ error: 'Pinecone client initialization failed' }, { status: 500 });
      }
      
      const assistant = pinecone.Assistant(assistantPineconeName);
      const files = await assistant.listFiles();

      return NextResponse.json({ files });
    } catch (error: any) {
      console.error('Error listing assistant files:', error);
      return NextResponse.json(
        { error: `Failed to list files: ${error.message}` }, 
        { status: 500 }
      );
    }
  } catch (e: any) {
    console.error('Unexpected error:', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}