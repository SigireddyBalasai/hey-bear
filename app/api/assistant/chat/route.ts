import { NextRequest, NextResponse } from 'next/server';
import { getPineconeClient } from '@/lib/pinecone';
import { createClient } from '@/utils/supabase/server';
import { aw } from 'framer-motion/dist/types.d-6pKw1mTI';

export async function POST(req: NextRequest) {
  const { assistantName, message } = await req.json();
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const pinecone = getPineconeClient();
  const assistant = pinecone.Assistant(assistantName);
  const response = await assistant.chat({ messages: [{ role: 'user', content: message }] });

  const { error } = await supabase.from('chat_history').insert({
    user_id: user.id, // Will be null if user is deleted later
    assistant_name: assistantName,
    question: message,
    answer: response.message?.content,
    metadata: {
      assistant_metadata: req || {},
      user_email: user.email,
    },
  });

  if (error) {
    console.error('Error saving chat history:', error);
  }

  return NextResponse.json({ response: response.message?.content ?? '' });
}