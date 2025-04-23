import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { stripe } from '@/lib/stripe';
import { TablesInsert } from '@/lib/db.types';
import { v4 as uuidv4 } from 'uuid';
import { getPineconeClient } from '@/lib/pinecone';

// Helper function to generate a valid Pinecone name
function generatePineconeName(name: string): string {
  // Replace spaces and special characters with underscores, ensure lowercase
  let safeName = name.toLowerCase().replace(/[^a-z0-9]/g, '_');
  // Ensure it's not longer than 45 chars (leaving room for the random suffix)
  safeName = safeName.substring(0, 45);
  
  // Add a random suffix for uniqueness
  const randomSuffix = Math.random().toString(36).substring(2, 8);
  return `${safeName}_${randomSuffix}`;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: 'Invalid request format' }, { status: 400 });
    }
    
    const { pendingAssistantId, sessionId } = body;
    
    if (!pendingAssistantId || !sessionId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const supabase = await createClient();

    // Check user authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.error('Auth error:', authError);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the user record
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('auth_user_id', user.id)
      .single();
      
    if (userError || !userData) {
      console.error('Error fetching user record:', userError);
      return NextResponse.json({ error: 'Failed to fetch user record' }, { status: 500 });
    }

    // Fetch the pending assistant
    const { data: pendingAssistant, error: pendingError } = await supabase
      .from('pending_assistants')
      .select('*')
      .eq('id', pendingAssistantId)
      .single();

    if (pendingError || !pendingAssistant) {
      console.error('Error fetching pending assistant:', pendingError);
      return NextResponse.json({ error: 'Pending assistant not found' }, { status: 404 });
    }

    // Verify the pending assistant belongs to this user
    if (pendingAssistant.user_id !== userData.id) {
      return NextResponse.json({ error: 'Unauthorized: You do not own this pending assistant' }, { status: 403 });
    }

    // Verify the checkout session
    const session = await stripe?.checkout.sessions.retrieve(sessionId);
    if (!session || session.status !== 'complete') {
      return NextResponse.json({ error: 'Invalid or incomplete payment session' }, { status: 400 });
    }

    // Get subscription info
    const subscriptionId = session.subscription as string;
    const subscription = await stripe?.subscriptions.retrieve(subscriptionId);
    
    if (!subscription) {
      return NextResponse.json({ error: 'Failed to retrieve subscription' }, { status: 500 });
    }

    // Generate a unique ID for the assistant
    const assistantId = uuidv4();
    
    // Generate unique Pinecone name
    const pinecone_name = generatePineconeName(pendingAssistant.name);
    console.log(`Generated Pinecone name: ${pinecone_name}`);
    
    // Create assistant in Pinecone
    const pinecone = getPineconeClient();
    if (!pinecone) {
      return NextResponse.json({ error: 'Pinecone client initialization failed' }, { status: 500 });
    }
    
    let pineconeResult;
    try {
      // Try to create the assistant in Pinecone
      pineconeResult = await pinecone.createAssistant({ name:pinecone_name,
          instructions: (typeof pendingAssistant.params === 'object' && pendingAssistant.params !== null) ? 
            (pendingAssistant.params as any).systemPrompt || 
            `You are a helpful AI assistant named ${pendingAssistant.name}.` :
            `You are a helpful AI assistant named ${pendingAssistant.name}.`
    });
      
      console.log('Pinecone assistant created successfully');
    } catch (pineconeError: any) {
      console.error('Error creating Pinecone assistant:', pineconeError);
      return NextResponse.json({ 
        error: 'Failed to create assistant in Pinecone',
        details: pineconeError.message
      }, { status: 500 });
    }
    
    // Create the assistant in our database
    const assistantData: TablesInsert<'assistants'> = {
      id: assistantId,
      name: pendingAssistant.name,
      user_id: userData.id,
      pinecone_name: pinecone_name,
      created_at: new Date().toISOString(),
      params: {
        ...(typeof pendingAssistant.params === 'object' && pendingAssistant.params !== null ? pendingAssistant.params : {}),
        subscription: {
          stripeSubscriptionId: subscriptionId,
          status: subscription.status,
          plan: typeof pendingAssistant.params === 'object' && pendingAssistant.params !== null ? 
            (pendingAssistant.params as any).plan || 'personal' : 'personal',
          currentPeriodEnd: new Date((subscription as any).current_period_end * 1000).toISOString(),
          createdAt: new Date().toISOString()
        }
      },
      plan_id: pendingAssistant.plan_id
    };
    
    const { error: assistantError } = await supabase
      .from('assistants')
      .insert(assistantData);
      
    if (assistantError) {
      console.error('Error creating assistant in database:', assistantError);
      return NextResponse.json({ error: 'Failed to create assistant in database' }, { status: 500 });
    }
    
    // Delete the pending assistant entry
    await supabase
      .from('pending_assistants')
      .delete()
      .eq('id', pendingAssistantId);
      
    return NextResponse.json({
      success: true,
      assistantId,
      name: pendingAssistant.name
    });
  } catch (error: any) {
    console.error('Error converting pending assistant:', error);
    return NextResponse.json({ 
      error: 'Failed to convert pending assistant',
      details: error.message 
    }, { status: 500 });
  }
}