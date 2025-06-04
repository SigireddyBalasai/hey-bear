import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { createClient } from '@/utils/supabase/server';

// Debug: Log that this module is being loaded
console.log('[SESSION API] Module loaded at:', new Date().toISOString());

// Define the assistant data interface
interface AssistantSessionData {
  name: string;
  description?: string;
  conciergeName: string;
  personality: string;
  businessName: string;
  sharePhoneNumber: boolean;
  phoneNumber: string;
}

// In-memory storage for temporary session data
const sessionStore = new Map<
  string,
  {
    assistantData: AssistantSessionData;
    userId: string;
    customerId: string;
    createdAt: Date;
  }
>();

// Cleanup expired sessions (older than 1 hour)
const cleanupExpiredSessions = () => {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

  for (const [sessionId, sessionData] of sessionStore.entries()) {
    if (sessionData.createdAt < oneHourAgo) {
      sessionStore.delete(sessionId);
    }
  }
};

// Run cleanup every 15 minutes
setInterval(cleanupExpiredSessions, 15 * 60 * 1000);

// Generate a unique session ID
function generateSessionId(): string {
  return crypto.randomUUID();
}

export async function POST(request: NextRequest) {
  console.log('[SESSION API] POST endpoint called at:', new Date().toISOString());

  try {
    const supabase = await createClient();

    // Get user from session
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Get user's stripe customer ID
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .single();

    if (userError || !userData?.stripe_customer_id) {
      return NextResponse.json(
        { error: 'User not found or no stripe customer ID' },
        { status: 404 }
      );
    }

    // Parse assistant data from request body
    const body = (await request.json()) as AssistantSessionData;
    const assistantData: AssistantSessionData = body;

    // Generate unique session ID
    const sessionId = generateSessionId();

    // Store session data in memory
    sessionStore.set(sessionId, {
      assistantData,
      userId: user.id,
      customerId: userData.stripe_customer_id,
      createdAt: new Date(),
    });

    return NextResponse.json({ sessionId });
  } catch (error) {
    console.error('Error in session creation:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
    }

    const supabase = await createClient();

    // Get user from session
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Check if session exists and belongs to user
    const sessionData = sessionStore.get(sessionId);

    if (!sessionData || sessionData.userId !== user.id) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    return NextResponse.json({
      assistantData: sessionData.assistantData,
      customerId: sessionData.customerId,
    });
  } catch (error) {
    console.error('Error in session retrieval:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID is required' }, { status: 400 });
    }

    const supabase = await createClient();

    // Get user from session
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Check if session exists and belongs to user
    const sessionData = sessionStore.get(sessionId);

    if (!sessionData || sessionData.userId !== user.id) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // Remove session from memory
    sessionStore.delete(sessionId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in session delete:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
