import { NextRequest, NextResponse } from 'next/server';
import { getPineconeClient } from '@/lib/pinecone';
import { createClient } from '@/utils/supabase/server';

export async function POST(req: NextRequest) {
  const { assistantName } = await req.json();
  const supabase = await createClient();

  // Check if user is authenticated
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const pinecone = getPineconeClient();
    const assistant = pinecone.Assistant(assistantName);
    console.log('Listing files for assistant:', assistantName);
    const files = await assistant.listFiles();
    console.log('Fetched files:', files);
    return NextResponse.json({ files });
  } catch (error: any) {
    console.error('Error listing files:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}