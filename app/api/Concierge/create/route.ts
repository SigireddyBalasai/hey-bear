import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { v4 as uuidv4 } from 'uuid';
import type { Database } from '@/lib/db.types';

function generatePineconeName(base: string): string {
  let prefix = base.toLowerCase().replace(/[^a-z0-9]/g, '-');
  prefix = prefix.substring(0, 40);
  const randomSuffix = Math.random().toString(36).substring(2, 8);
  return `${prefix}-${randomSuffix}`;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    const { 
      assistantName, 
      description, 
      params = {},
      plan = 'personal', // Default plan
      stripeCheckoutSessionId // Added for payment verification
    } = body;
    
    if (!assistantName) {
      return NextResponse.json({ error: 'Assistant name is required' }, { status: 400 });
    }
    
    let verifiedPlanId = plan;
    let subscriptionStatus: Database['assistants']['Tables']['assistant_subscriptions']['Insert']['status'] = 'pending'; // Default status

    // If a plan other than personal is selected, verify payment
    if (plan !== 'personal' && stripeCheckoutSessionId) {
      try {
        // Hypothetical function to verify Stripe payment and get plan details
        // This function would live in a file like lib/stripe.ts and use your Stripe secret key
        // const paymentDetails = await verifyStripePayment(stripeCheckoutSessionId);
        // For demonstration, let's assume verification is successful if stripeCheckoutSessionId is present
        // and paymentDetails would return the actual plan_id confirmed by Stripe.
        
        // Example: const { successful, actualPlanId } = await verifyStripePayment(stripeCheckoutSessionId);
        // if (successful) {
        //   verifiedPlanId = actualPlanId; // Use the plan confirmed by Stripe
        //   subscriptionStatus = 'active';
        // } else {
        //   return NextResponse.json({ error: 'Payment verification failed or plan mismatch.' }, { status: 402 }); // Payment Required
        // }

        // For now, let's simulate a successful verification if stripeCheckoutSessionId is provided
        // In a real scenario, you MUST call Stripe API here to verify the session.
        console.log(`Simulating Stripe payment verification for session: ${stripeCheckoutSessionId} and plan: ${plan}`);
        verifiedPlanId = plan; // Assume plan from request is the one paid for after verification
        subscriptionStatus = 'active'; // Set status to active if payment is "verified"

      } catch (verificationError: unknown) {
        console.error('Stripe verification error:', verificationError);
        return NextResponse.json({ error: 'Failed to verify payment', details: (verificationError instanceof Error) ? verificationError.message : String(verificationError) }, { status: 500 });
      }
    } else if (plan !== 'personal' && !stripeCheckoutSessionId) {
      // If it's a paid plan, stripeCheckoutSessionId is required
      return NextResponse.json({ error: 'Stripe Checkout Session ID is required for paid plans.' }, { status: 400 });
    }
    
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.error('Auth error:', authError);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    try {
      const { data: userData, error: userFetchError } = await supabase
        .schema('users')
        .from('users')
        .select('id')
        .eq('auth_user_id', user.id)
        .single();
      
      if (userFetchError) {
        console.error('Error fetching user record:', userFetchError);
        return NextResponse.json({ error: 'Failed to fetch user record' }, { status: 500 });
      }
      
      const userId = userData.id;
      const pendingAssistantId = uuidv4();
      
      const pinecone_name = generatePineconeName(assistantName);
      console.log(`Generated Pinecone name: ${pinecone_name}`);
      
      const pendingAssistantData: Database['assistants']['Tables']['assistants']['Insert'] = {
        id: pendingAssistantId,
        user_id: userId,
        name: assistantName,
        created_at: new Date().toISOString(),
        pending: true,
      };

      const { error: insertError } = await supabase
        .schema('assistants')
        .from('assistants')
        .insert([pendingAssistantData]);
      
      if (insertError) {
        console.error('Error saving pending assistant to Supabase:', insertError);
        return NextResponse.json({ error: 'Failed to save pending assistant to database' }, { status: 500 });
      }

      // Insert consolidated config data into assistant_configs table
      const configData: Database['assistants']['Tables']['assistant_configs']['Insert'] = {
        id: pendingAssistantId,
        description: description ?? null,
        display_name: params.conciergeName ?? assistantName,
        business_name: params.businessName ?? null,
        business_phone: params.phoneNumber ?? null,
      };
      const { error: configInsertError } = await supabase
        .schema('assistants')
        .from('assistant_configs')
        .insert([configData]);

      if (configInsertError) {
        console.error('Error inserting assistant config:', configInsertError);
        // Attempt to delete the pending assistant if config insertion fails
        await supabase.schema('assistants').from('assistants').delete().eq('id', pendingAssistantId);
        return NextResponse.json({ error: 'Failed to save assistant configuration' }, { status: 500 });
      }

      // Insert subscription data
      const subscriptionData: Database['assistants']['Tables']['assistant_subscriptions']['Insert'] = {
        id: uuidv4(),
        assistant_id: pendingAssistantId,
        status: subscriptionStatus,
        plan_id: verifiedPlanId,
        created_at: new Date().toISOString(),
        // Add any other default fields here
      };

      const { error: subscriptionInsertError } = await supabase
        .schema('assistants')
        .from('assistant_subscriptions')
        .insert([subscriptionData]);

      if (subscriptionInsertError) {
        console.error('Error saving subscription data:', subscriptionInsertError);
        return NextResponse.json({ error: 'Failed to save subscription data' }, { status: 500 });
      }

      return NextResponse.json({ 
        message: `Assistant ${assistantName} created as pending`,
        assistantId: pendingAssistantId,
        pendingAssistantId: pendingAssistantId
      });
    } catch (apiError: unknown) {
      console.error('API error during assistant creation:', apiError);
      return NextResponse.json({ error: 'Failed to create assistant', details: apiError instanceof Error ? apiError.message : 'Unknown error' }, { status: 500 });
    }
    
  } catch (error: unknown) {
    console.error('Unexpected error in POST /api/Concierge/create:', error);
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
