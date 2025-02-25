import { NextRequest, NextResponse } from 'next/server';
import { getPineconeClient } from '@/lib/pinecone';
import { createClient } from '@/utils/supabase/server';

export async function POST(req: NextRequest) {
  const { assistantName, message } = await req.json();
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const pinecone = getPineconeClient();
  const assistant = pinecone.Assistant(assistantName);
  const response = await assistant.chat({ messages: [{ role: 'user', content: message }] });

  return NextResponse.json({ response: response.message?.content ?? '' });
}