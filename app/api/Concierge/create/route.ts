import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { v4 as uuidv4 } from 'uuid';
import type { SupabaseClient } from '@supabase/supabase-js';

import type { Database } from '@/lib/db.types';
import { createClient } from '@/utils/supabase/server';
import { createClient as createAdminClient } from '@/utils/supabase/server-admin';

function generatePineconeName(base: string): string {
  let prefix = base.toLowerCase().replaceAll(/[^a-z0-9]/g, '-');
  prefix = prefix.slice(0, 40);
  const timestamp = Date.now().toString().slice(-6); // Use timestamp for uniqueness
  return `${prefix}-${timestamp}`;
}

interface CreateAssistantRequest {
  assistantName: string;
  description?: string;
  params?: {
    conciergeName?: string;
    businessName?: string;
    phoneNumber?: string;
  };
  stripeCheckoutSessionId?: string;
  paymentSessionId?: string; // Add this for linking to payment session
  plan?: string;
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as CreateAssistantRequest;

    const {
      assistantName,
      description,
      params = {},
      plan = 'personal', // Default plan
      stripeCheckoutSessionId, // Added for payment verification
      paymentSessionId, // Added for linking to payment session
    } = body;

    if (!assistantName) {
      return NextResponse.json({ error: 'Assistant name is required' }, { status: 400 });
    }

    let verifiedPlanId = plan;
    let subscriptionStatus: Database['public']['Tables']['assistant_subscriptions']['Insert']['status'] =
      'pending'; // Default status

    // If a plan other than personal is selected, verify payment
    if (plan !== 'personal' && stripeCheckoutSessionId) {
      try {
        // Payment verification would be implemented here
        // For now, proceeding with plan creation
        console.log(
          `Simulating Stripe payment verification for session: ${stripeCheckoutSessionId} and plan: ${plan}`
        );
        verifiedPlanId = plan; // Assume plan from request is the one paid for after verification
        subscriptionStatus = 'active'; // Set status to active if payment is "verified"
      } catch (verificationError: unknown) {
        console.error('Stripe verification error:', verificationError);
        return NextResponse.json(
          {
            error: 'Failed to verify payment',
            details:
              verificationError instanceof Error
                ? verificationError.message
                : String(verificationError),
          },
          { status: 500 }
        );
      }
    } else if (plan !== 'personal' && !stripeCheckoutSessionId) {
      // If it's a paid plan, stripeCheckoutSessionId is required
      return NextResponse.json(
        { error: 'Stripe Checkout Session ID is required for paid plans.' },
        { status: 400 }
      );
    }

    // Check if this is a webhook call (has paymentSessionId and stripeCheckoutSessionId)
    const isWebhookCall = !!(paymentSessionId && stripeCheckoutSessionId);
    let userId: string;
    let dbClient: SupabaseClient<Database>;
    
    if (isWebhookCall) {
      // For webhook calls, use admin client and get user from payment session
      console.log('Webhook call detected, using admin client to fetch user_id from payment_sessions table.');
      dbClient = createAdminClient();
      
      const { data: paymentSessionData, error: paymentSessionError } = await dbClient
        .from('payment_sessions')
        .select('user_id') // This user_id references public.users.id
        .eq('id', paymentSessionId)
        .single();
        
      if (paymentSessionError || !paymentSessionData || !paymentSessionData.user_id) {
        console.error('Error fetching user_id from payment_sessions for webhook:', paymentSessionError, 'or user_id is null.');
        return NextResponse.json({ error: 'Valid payment session with user_id not found' }, { status: 404 });
      }
      
      userId = paymentSessionData.user_id; // This is the correct application user ID (public.users.id)
      console.log('Retrieved application user_id from payment_sessions:', userId);
      
      // The previous lookup for userData using auth_user_id is removed as it was incorrect.
      // We now directly use the user_id from payment_sessions.
    } else {
      // For regular calls, authenticate the user
      const supabase = await createClient();
      dbClient = supabase;
      
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        console.error('Auth error:', authError);
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      const { data: userData, error: userFetchError } = await supabase
        .from('users')
        .select('id')
        .eq('auth_user_id', user.id)
        .single();

      if (userFetchError) {
        console.error('Error fetching user record:', userFetchError);
        return NextResponse.json({ error: 'Failed to fetch user record' }, { status: 500 });
      }

      userId = userData.id;
    }

    // Fetch the actual plan UUID from subscription_plans table
    let actualPlanUUID: string | null = null;
    if (verifiedPlanId) { // Only query if verifiedPlanId is set
      console.log(`Fetching plan UUID for plan name: ${verifiedPlanId}`);
      const { data: planData, error: planFetchError } = await dbClient
        .from('subscription_plans')
        .select('id')
        .eq('name', verifiedPlanId)
        .single();

      if (planFetchError || !planData) {
        console.error(`Error fetching plan UUID for name "${verifiedPlanId}":`, planFetchError);
        return NextResponse.json({ error: `Invalid plan specified: ${verifiedPlanId}. Plan not found.` }, { status: 400 });
      }
      actualPlanUUID = planData.id;
      console.log(`Found plan UUID: ${actualPlanUUID} for plan name: ${verifiedPlanId}`);
    } else {
      // This case should ideally not happen if 'plan' has a default and is validated.
      // But if verifiedPlanId could be null/empty, handle it.
      console.error('verifiedPlanId is null or empty, cannot determine plan UUID.');
      return NextResponse.json({ error: 'Plan ID could not be determined.' }, { status: 400 });
    }

    try {
      const pendingAssistantId = uuidv4();

      const pinecone_name = generatePineconeName(assistantName);
      console.log(`Generated Pinecone name: ${pinecone_name}`);

      const pendingAssistantData: Database['public']['Tables']['assistants']['Insert'] = {
        id: pendingAssistantId,
        user_id: userId,
        name: assistantName,
        created_at: new Date().toISOString(),
        pending: true,
      };

      const { error: insertError } = await dbClient
        .from('assistants')
        .insert([pendingAssistantData]);

      if (insertError) {
        console.error('Error saving pending assistant to Supabase:', insertError);
        return NextResponse.json(
          { error: 'Failed to save pending assistant to database' },
          { status: 500 }
        );
      }

      // Insert consolidated config data into assistant_configs table
      const configData: Database['public']['Tables']['assistant_configs']['Insert'] = {
        id: pendingAssistantId,
        description: description ?? null,
        display_name: params.conciergeName ?? assistantName,
        business_name: params.businessName ?? null,
        business_phone: params.phoneNumber ?? null,
      };
      const { error: configInsertError } = await dbClient
        .from('assistant_configs')
        .insert([configData]);

      if (configInsertError) {
        console.error('Error inserting assistant config:', configInsertError);
        // Attempt to delete the pending assistant if config insertion fails
        await dbClient.from('assistants').delete().eq('id', pendingAssistantId);
        return NextResponse.json(
          { error: 'Failed to save assistant configuration' },
          { status: 500 }
        );
      }

      // Insert subscription data using the fetched actualPlanUUID
      const subscriptionData: Database['public']['Tables']['assistant_subscriptions']['Insert'] = {
        id: uuidv4(),
        assistant_id: pendingAssistantId,
        status: subscriptionStatus,
        plan_id: actualPlanUUID, // Use the fetched UUID
        payment_session_id: paymentSessionId || null,
        created_at: new Date().toISOString(),
      };

      const { error: subscriptionInsertError } = await dbClient
        .from('assistant_subscriptions')
        .insert([subscriptionData]);

      if (subscriptionInsertError) {
        console.error('Error saving subscription data with plan_id UUID:', subscriptionInsertError);
        // Attempt to clean up assistant and config if subscription fails
        await dbClient.from('assistant_configs').delete().eq('id', pendingAssistantId);
        await dbClient.from('assistants').delete().eq('id', pendingAssistantId);
        return NextResponse.json({ error: 'Failed to save subscription data.' }, { status: 500 });
      }

      return NextResponse.json({
        message: `Assistant ${assistantName} created as pending`,
        assistantId: pendingAssistantId,
        pendingAssistantId: pendingAssistantId,
      });
    } catch (apiError: unknown) {
      console.error('API error during assistant creation:', apiError);
      return NextResponse.json(
        {
          error: 'Failed to create assistant',
          details: apiError instanceof Error ? apiError.message : 'Unknown error',
        },
        { status: 500 }
      );
    }
  } catch (error: unknown) {
    console.error('Unexpected error in POST /api/Concierge/create:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
