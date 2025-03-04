import { NextRequest, NextResponse } from 'next/server';
import { getPineconeClient } from '@/lib/pinecone';
import { createClient } from '@/utils/supabase/server';

export async function POST(req: NextRequest) {
  try {
    const { assistantName } = await req.json();
    
    if (!assistantName) {
      return NextResponse.json({ error: 'Assistant name is required' }, { status: 400 });
    }
    
    const supabase = await createClient();

    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
      const pinecone = getPineconeClient();
      const assistant = pinecone.Assistant(assistantName);
      
      console.log('Listing files for assistant:', assistantName);
      
      const filesResponse = await assistant.listFiles().catch(error => {
        console.error(`Error listing files for assistant ${assistantName}:`, error);
        return { files: [] }; // Return empty array on error
      });
      
      // Handle cases where filesResponse might be null or undefined
      const files = filesResponse && filesResponse.files ? filesResponse.files : [];
      
      console.log('Fetched files:', files);
      return NextResponse.json({ files });
    } catch (error: any) {
      console.error('Error listing files:', error);
      // Return empty files array instead of error
      return NextResponse.json({ files: [] });
    }
  } catch (error) {
    console.error('Unexpected error in file list:', error);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}