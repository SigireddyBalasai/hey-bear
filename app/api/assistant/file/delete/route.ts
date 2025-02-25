import { NextRequest, NextResponse } from 'next/server';
import { getPineconeClient } from '@/lib/pinecone';
import { createClient } from '@/utils/supabase/server';
import { PineconeRequestError } from '@pinecone-database/pinecone/dist/errors';

export async function POST(req: NextRequest) {
  const { assistantName, fileId } = await req.json();
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const pinecone = getPineconeClient();
    const assistant = pinecone.Assistant(assistantName);
    console.log(`Deleting file ${fileId} from ${assistantName}`);
    await assistant.deleteFile(fileId);

    return NextResponse.json({ message: `File ${fileId} deleted from ${assistantName}` });
  } catch (error: any) {
    console.error('Error deleting file:', error);
    if (error instanceof PineconeRequestError && error.cause?.message === 'FILE_NOT_FOUND') {
      return NextResponse.json({ error: `File "${fileId}" not found in Pinecone.` }, { status: 404 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

