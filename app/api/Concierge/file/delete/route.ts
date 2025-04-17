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
      // Fetch the assistant from the database
      const { data: assistantData, error: assistantError } = await supabase
        .from('assistants')
        .select('pinecone_name')
        .eq('id', assistantId)
        .single();
      
      if (assistantError || !assistantData) {
        console.error('Error fetching Concierge:', assistantError);
        return NextResponse.json({ error: 'Concierge not found' }, { status: 404 });
      }
      
      assistantPineconeName = assistantData.pinecone_name;
      if (!assistantPineconeName) {
        return NextResponse.json({ error: 'Invalid Concierge configuration' }, { status: 500 });
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
    } catch (error: any) {
      console.error('Error deleting file:', error);
      return NextResponse.json(
        { error: `Failed to delete file: ${error.message}` }, 
        { status: 500 }
      );
    }
  } catch (e: any) {
    console.error('Unexpected error:', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
