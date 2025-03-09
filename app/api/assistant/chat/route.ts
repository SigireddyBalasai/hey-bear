import { NextRequest, NextResponse } from 'next/server';
import { getPineconeClient } from '@/lib/pinecone';
import { createClient } from '@/utils/supabase/server';

export async function POST(req: NextRequest) {
  // Record the request timestamp
  const requestTimestamp = new Date();
  
  try {
    // Validate request body
    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: 'Invalid request format' }, { status: 400 });
    }

    const { assistantName, message } = body;
    
    // Validate required fields
    if (!assistantName || !message) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    const supabase = await createClient();

    // Check user authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.error('Auth error:', authError);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Handle Pinecone assistant
    try {
      const pinecone = getPineconeClient();
      if (!pinecone) {
        return NextResponse.json({ error: 'Pinecone client initialization failed' }, { status: 500 });
      }

      const assistant = pinecone.Assistant(assistantName);
      if (!assistant) {
        return NextResponse.json({ error: 'Failed to create assistant' }, { status: 500 });
      }

      const response = await assistant.chat({ messages: [{ role: 'user', content: message }] });
      
      // Record the response timestamp
      const responseTimestamp = new Date();
      const responseDuration = responseTimestamp.getTime() - requestTimestamp.getTime(); // in milliseconds
      
      if (!response || !response.message) {
        return NextResponse.json({ error: 'Assistant returned no response' }, { status: 500 });
      }

      // Save chat to Supabase with timing information
      const { error: chatError } = await supabase.from('chat_history').insert({
        user_id: user.id,
        assistant_id: assistantName,
        question: message,
        answer: response.message?.content || '',
        metadata: { 
          assistant_name: assistantName,
          assistant_id: assistant,
          user_email: user.email,
          requestTimestamp: requestTimestamp.toISOString(),
          responseTimestamp: responseTimestamp.toISOString(),
          responseDuration: responseDuration // in milliseconds
        },
      });

      if (chatError) {
        console.error('Error saving chat to Supabase:', chatError);
      }

      // Update assistant usage statistics
      const { data: assistantData, error: fetchError } = await supabase
        .from('assistants')
        .select('message_count')
        .eq('user_id', user.id)
        .eq('assistant_id', assistantName)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') { // Not found error
        console.error('Error fetching assistant:', fetchError);
      }

      const newMessageCount = ((assistantData?.message_count !== null && assistantData?.message_count !== undefined) ? 
        assistantData.message_count : 0) + 1;
        
      const { error: updateError } = await supabase
        .from('assistants')
        .update({
          last_used_at: new Date().toISOString(),
          message_count: newMessageCount,
        })
        .eq('user_id', user.id)
        .eq('assistant_id', assistantName);

      if (updateError) {
        console.error('Error updating assistant:', updateError);
      }

      return NextResponse.json({ 
        response: response.message?.content || '',
        timing: {
          requestTimestamp: requestTimestamp.toISOString(),
          responseTimestamp: responseTimestamp.toISOString(),
          responseDuration: responseDuration
        }
      });
    } catch (assistantError) {
      console.error('Error interacting with assistant:', assistantError);
      return NextResponse.json(
        { error: 'Failed to process request with the assistant' }, 
        { status: 500 }
      );
    }
  } catch (e) {
    console.error('Unexpected error:', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}