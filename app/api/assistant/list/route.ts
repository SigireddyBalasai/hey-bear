import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { getPineconeClient } from '@/lib/pinecone';

export async function GET() {
    const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const pinecone = getPineconeClient();
  const assistants = await pinecone.listAssistants();
  // Filter assistants by user (assuming Pinecone supports metadata or naming convention)
  const userAssistants = assistants.assistants?.filter((a: any) => a.metadata?.owner === user.id);

  return NextResponse.json({ assistants: userAssistants });
}