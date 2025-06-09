import { NextResponse } from 'next/server';

// Re-added Supabase client

import type { Database } from '@/lib/db.types';
import { createClient } from '@/utils/supabase/server';

// Types for DB operations
type InteractionsInsert = Database['public']['Tables']['interactions']['Insert'];

// Define the expected structure for the incoming interaction data
interface InteractionWebhookPayload {
  assistant_id?: string;
  user_id?: string;
  request_data: string; // Maps to 'request' in the interactions table
  response_data: string; // Maps to 'response' in the interactions table
  chat_id?: string; // Optional: maps to 'chat' in the interactions table
  // Add any other relevant fields you expect from the webhook
}

// This endpoint handles webhook events for interactions
export async function POST(req: Request) {
  // Removed underscore from req as it will be used
  console.log('Interaction webhook received');

  try {
    const payload = (await req.json()) as InteractionWebhookPayload;

    // Validate payload (basic example)
    if (!payload.request_data || !payload.response_data) {
      return NextResponse.json(
        { message: 'Missing required fields: request_data and response_data' },
        { status: 400 }
      );
    }

    if (!payload.assistant_id) {
      return NextResponse.json(
        { message: 'Missing required field: assistant_id' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    const interactionData: InteractionsInsert = {
      request: payload.request_data,
      response: payload.response_data,
      assistant_id: payload.assistant_id,
      user_id: payload.user_id ?? null,
      chat: payload.chat_id ?? null,
      // Supabase will use default for created_at, updated_at, id unless specified
      // interaction_time could be set here if relevant: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('interactions')
      .insert(interactionData)
      .select()
      .single();

    if (error) {
      console.error('Error inserting interaction into Supabase:', error);
      return NextResponse.json(
        { message: `Error saving interaction: ${error.message}` },
        { status: 500 }
      );
    }

    console.log('Interaction successfully recorded:', data);
    return NextResponse.json(
      { message: 'Interaction recorded successfully', data },
      { status: 201 }
    );
  } catch (error: unknown) {
    let errorMessage = 'An unknown error occurred processing the webhook';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    // Check if error is due to JSON parsing
    if (errorMessage.toLowerCase().includes('invalid json')) {
      return NextResponse.json({ message: 'Invalid JSON payload' }, { status: 400 });
    }
    console.error('Webhook processing error:', errorMessage);
    return NextResponse.json(
      { message: `Webhook Error: ${errorMessage}` },
      { status: 400 } // Or 500 depending on the nature of the error
    );
  }
}

// All Stripe-specific event handlers (handleCheckoutSessionCompleted, handleInvoicePaid, etc.)
// and related utility functions (toDateTime, manageSubscriptionStatusChange, etc.)
// have been removed as they are no longer needed.
