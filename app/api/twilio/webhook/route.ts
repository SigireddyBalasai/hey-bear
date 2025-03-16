import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function POST(req: Request) {
  try {
    // Extract assistantId from query parameters
    const url = new URL(req.url);
    const assistantId = url.searchParams.get('assistantId');
    
    const formData = await req.formData();
    
    // Extract data from Twilio webhook
    const from = formData.get('From') as string;
    const to = formData.get('To') as string;
    const body = formData.get('Body') as string;
    const callSid = formData.get('CallSid') as string | null; // Check for CallSid to identify voice calls
    const isVoiceCall = !!callSid;
    
    if (!from || !to || (!body && !isVoiceCall)) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    console.log(`Received ${isVoiceCall ? 'voice call' : 'SMS'} from ${from} to ${to}: ${body}`);
    
    const supabase = await createClient();
    
    let assistant;
    
    if (assistantId) {
      // If assistantId is provided in the URL, use it directly
      console.log(`Using assistantId from URL param: ${assistantId}`);
      
      const { data, error } = await supabase
        .from('assistants')
        .select(`
          id,
          name,
          user_id,
          assigned_phone_number
        `)
        .eq('id', assistantId)
        .single();
      
      if (error) {
        console.error('Error fetching assistant by ID:', error);
        return NextResponse.json({ error: 'Assistant not found' }, { status: 404 });
      }
      
      assistant = data;
    } else {
      console.log(`No assistantId provided, cannot process request`);
      return NextResponse.json({ error: 'Assistant ID is required' }, { status: 400 });
    }
    
    if (!assistant) {
      console.error('No assistant found with provided ID.');
      
      // Generate a polite response indicating the number is not active
      const twiml = `
        <?xml version="1.0" encoding="UTF-8"?>
        <Response>
          <Message>This phone number is not currently connected to an assistant. For support, please contact the system administrator.</Message>
        </Response>
      `;
      
      return new Response(twiml, {
        headers: {
          'Content-Type': 'text/xml'
        }
      });
    }

    try {
      // Send the request to the chat endpoint
      const chatResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || ''}/api/assistant/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          assistantId: assistant.id,
          message: body,
          systemOverride: `You are responding to a ${isVoiceCall ? 'voice call' : 'SMS'} message. Keep your response concise.`,
          userPhone: from
        }),
      });

      if (!chatResponse.ok) {
        throw new Error(`Chat API error: ${chatResponse.status}`);
      }

      const responseData = await chatResponse.json();
      const aiResponse = responseData.response || "I'm sorry, I couldn't generate a response.";
      
      // Record the interaction with token usage but without SMS-specific fields
      await supabase
        .from('interactions')
        .insert({
          user_id: assistant.user_id,
          assistant_id: assistant.id,
          request: body,
          response: aiResponse,
          chat: JSON.stringify({ from, to, body }),
          interaction_time: new Date().toISOString(),
          token_usage: responseData.tokens || null,
          input_tokens: responseData.usage?.promptTokens || null,
          output_tokens: responseData.usage?.completionTokens || null,
          cost_estimate: responseData.cost || null,
          duration: responseData.timing?.responseDuration || null
        });
      
      let twiml;
      if (isVoiceCall) {
        // Generate Twilio TwiML for voice call
        twiml = `<?xml version="1.0" encoding="UTF-8"?>
                  <Response>
                    <Say>${aiResponse}</Say>
                  </Response>`;
      } else {
        // Generate Twilio TwiML for SMS
        twiml = `<?xml version="1.0" encoding="UTF-8"?>
                  <Response>
                    <Message>${aiResponse}</Message>
                  </Response>`;
      }
      
      return new Response(twiml, {
        headers: {
          'Content-Type': 'text/xml'
        }
      });
    } catch (aiError) {
      console.error('Error calling assistant chat API:', aiError);
      
      // Fallback response
      const fallbackResponse = "I'm sorry, I'm having trouble processing your request right now. Please try again later.";
      
      // Record error interaction with token usage fields but without SMS-specific fields
      await supabase
        .from('interactions')
        .insert({
          user_id: assistant.user_id,
          assistant_id: assistant.id,
          request: body,
          response: fallbackResponse,
          chat: JSON.stringify({ from, to, body }),
          interaction_time: new Date().toISOString(),
          is_error: true
        });
      
      let twiml;
      if (isVoiceCall) {
        // Generate Twilio TwiML for voice call
        twiml = `<?xml version="1.0" encoding="UTF-8"?>
                  <Response>
                    <Say>${fallbackResponse}</Say>
                  </Response>`;
      } else {
        // Generate Twilio TwiML for SMS
        twiml = `<?xml version="1.0" encoding="UTF-8"?>
                  <Response>
                    <Message>${fallbackResponse}</Message>
                  </Response>`;
      }
      
      return new Response(twiml, {
        headers: {
          'Content-Type': 'text/xml'
        }
      });
    }
  } catch (error) {
    console.error('Error processing Twilio webhook:', error);
    
    // Return a generic error response
    const twiml = `
      <?xml version="1.0" encoding="UTF-8"?>
      <Response>
        <Message>Sorry, we encountered an error processing your message. Please try again later.</Message>
      </Response>
    `;
    
    return new Response(twiml, {
      headers: {
        'Content-Type': 'text/xml'
      }
    });
  }
}
