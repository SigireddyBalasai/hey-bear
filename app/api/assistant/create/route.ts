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
    
    const { assistantName } = body;
    
    // Validate required fields
    if (!assistantName) {
      return NextResponse.json({ error: 'Assistant name is required' }, { status: 400 });
    }
    
    const supabase = await createClient();

    // Check user authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.error('Auth error:', authError);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
      // Create assistant in Pinecone
      const pinecone = getPineconeClient();
      if (!pinecone) {
        return NextResponse.json({ error: 'Pinecone client initialization failed' }, { status: 500 });
      }
      
      const result = await pinecone.createAssistant({
        name: assistantName,
        metadata: { owner: user.id },
      });
      
      if (!result) {
        return NextResponse.json({ error: 'Failed to create assistant in Pinecone' }, { status: 500 });
      }

      // Insert into assistants table
      const { error } = await supabase.from('assistants').insert({
        user_id: user.id,
        assistant_id: assistantName,
        metadata: {},
      });

      if (error) {
        console.error('Error saving assistant to Supabase:', error);
        return NextResponse.json({ error: 'Failed to save assistant' }, { status: 500 });
      }

      return NextResponse.json({ message: `Assistant ${assistantName} created` });
    } catch (apiError) {
      console.error('Error creating assistant:', apiError);
      return NextResponse.json(
        { error: 'Failed to create assistant' }, 
        { status: 500 }
      );
    }
  } catch (e) {
    console.error('Unexpected error:', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}