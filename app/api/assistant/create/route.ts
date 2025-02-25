import { NextRequest, NextResponse } from 'next/server';
import { getPineconeClient } from '@/lib/pinecone';
import { createClient } from '@/utils/supabase/server';
import { CreateAssistantOptions } from '@pinecone-database/pinecone';

export async function POST(req: NextRequest) {
  const { assistantName } = await req.json();
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const pinecone = getPineconeClient();
  const assistantOption : CreateAssistantOptions = {name: assistantName,metadata: {owner: user.id,email: user.email || ''}};
  await pinecone.createAssistant(assistantOption);

  return NextResponse.json({ message: `Assistant ${assistantName} created` });
}