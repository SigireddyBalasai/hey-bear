import { NextRequest, NextResponse } from 'next/server';
import { getPineconeClient } from '@/lib/pinecone';
import { createClient } from '@/utils/supabase/server';
import { PineconeRequestError } from '@pinecone-database/pinecone/dist/errors';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const assistantName = body?.assistantName;
    const fileId = body?.fileId;
    
    if (!assistantName || !fileId) {
      return NextResponse.json({ error: 'Assistant name and file ID are required' }, { status: 400 });
    }
    
    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Failed to initialize Supabase client' }, { status: 500 });
    }

    const { data, error: authError } = await supabase.auth.getUser();
    if (authError || !data?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
      const pinecone = getPineconeClient();
      if (!pinecone) {
        return NextResponse.json({ error: 'Failed to initialize Pinecone client' }, { status: 500 });
      }
      
      const assistant = pinecone.Assistant(assistantName);
      if (!assistant) {
        return NextResponse.json({ error: 'Failed to initialize assistant' }, { status: 500 });
      }
      
      console.log(`Deleting file ${fileId} from ${assistantName}`);
      
      await assistant.deleteFile(fileId);

      return NextResponse.json({ message: `File ${fileId} deleted from ${assistantName}` });
    } catch (error: any) {
      console.error('Error deleting file:', error);
      if (error instanceof PineconeRequestError && error.cause?.message === 'FILE_NOT_FOUND') {
        return NextResponse.json({ error: `File "${fileId}" not found in Pinecone.` }, { status: 404 });
      }
      return NextResponse.json({ error: error.message || 'Unknown error occurred' }, { status: 500 });
    }
  } catch (error: any) {
    console.error('Error processing request:', error);
    return NextResponse.json({ error: 'Invalid request payload' }, { status: 400 });
  }
}
