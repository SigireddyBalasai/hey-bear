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
      return NextResponse.json({ error: 'No-show name is required' }, { status: 400 });
    }
    
    const supabase = await createClient();

    // Check user authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.error('Auth error:', authError);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
      // Delete from Pinecone
      const pinecone = getPineconeClient();
      if (!pinecone) {
        return NextResponse.json({ error: 'Pinecone client initialization failed' }, { status: 500 });
      }
      
      await pinecone.deleteAssistant(assistantName);
      
      // Delete from Supabase (adding record cleanup)
      const { error: deleteError } = await supabase
        .from('assistants')
        .delete()
        .eq('user_id', user.id)
        .eq('assistant_id', assistantName);
        
      if (deleteError) {
        console.error('Error deleting No-Show from database:', deleteError);
        // We continue since the assistant was deleted from Pinecone already
      }

      // Clean up chat history
      const { error: chatDeleteError } = await supabase
        .from('interactions')
        .delete()
        .eq('user_id', user.id)
        .eq('assistant_id', assistantName);
        
      if (chatDeleteError) {
        console.error('Error cleaning up chat history:', chatDeleteError);
      }

      return NextResponse.json({ message: `No-Show ${assistantName} deleted` });
    } catch (apiError) {
      console.error('Error deleting No-Show:', apiError);
      return NextResponse.json(
        { error: 'Failed to delete No-Show' }, 
        { status: 500 }
      );
    }
  } catch (e) {
    console.error('Unexpected error:', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}