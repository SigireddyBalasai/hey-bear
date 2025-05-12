import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';

// Generate a valid name for Pinecone assistant
// Pinecone requires names to be lowercase alphanumeric with hyphens only
function generatePineconeName(base: string): string {
  // Generate a random string of 8 characters
  const randomSuffix = crypto.randomBytes(4).toString('hex');
  
  // Create a valid formatted version of the assistant name
  // Only lowercase alphanumeric characters and hyphens are allowed
  const baseFormatted = base
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '-') // Replace non-alphanumeric with hyphens
    .replace(/-{2,}/g, '-')     // Replace multiple hyphens with a single one
    .replace(/^-|-$/g, '')      // Remove leading/trailing hyphens
    .substring(0, 20);          // Limit to 20 chars
  
  // Ensure the name starts with a letter
  const prefix = /^[a-z]/.test(baseFormatted) ? baseFormatted : `a-${baseFormatted}`;
  
  // Combine them to create a unique valid name
  return `${prefix}-${randomSuffix}`;
}

export async function POST(req: NextRequest) {
  try {
    // Validate request body
    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: 'Invalid request format' }, { status: 400 });
    }
    
    const { assistantName, description, params, plan } = body;
    
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
      // Check if user exists in the users table, and create if not
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('auth_user_id', user.id)
        .single();
      
      // If user doesn't exist in users table, create it
      if (!existingUser) {
        console.log('Creating new user record in users table');
        const { error: createUserError } = await supabase
          .from('users')
          .insert({
            auth_user_id: user.id,
            created_at: new Date().toISOString(),
          });
        
        if (createUserError) {
          console.error('Error creating user record:', createUserError);
          return NextResponse.json({ error: 'Failed to create user record' }, { status: 500 });
        }
      }
      
      // Fetch the user entry again to get the actual user_id
      const { data: userData, error: userFetchError } = await supabase
        .from('users')
        .select('id')
        .eq('auth_user_id', user.id)
        .single();
      
      if (userFetchError || !userData) {
        console.error('Error fetching user record:', userFetchError);
        return NextResponse.json({ error: 'Failed to fetch user record' }, { status: 500 });
      }
      
      const userId = userData.id;
      const assistantId = uuidv4();
      const pendingAssistantId = uuidv4();
      
      // Generate unique Pinecone name with valid format
      const pinecone_name = generatePineconeName(assistantName);
      console.log(`Generated Pinecone name: ${pinecone_name}`);

      // Create a pending assistant record that will be fulfilled after payment is confirmed
      const pendingAssistantData = {
        id: pendingAssistantId,
        user_id: userId,
        name: assistantName,
        description: description || null,
        created_at: new Date().toISOString(),
        pending: true, // Set the pending flag instead of using a separate table
        pinecone_name: pinecone_name,
        params: {
          ...params,
          description: description || 'No description provided',
          systemPrompt: params?.systemPrompt,
          plan: plan || 'personal',
          is_active: false,
          createdAt: new Date().toISOString()
        }
      };

      // Insert into assistants table with pending flag
      const { error: pendingError } = await supabase
        .from('assistants')
        .insert(pendingAssistantData);

      if (pendingError) {
        console.error('Error saving pending No-show to Supabase:', pendingError);
        return NextResponse.json({ error: 'Failed to save pending No-show to database' }, { status: 500 });
      }

      // No longer creating an entry in the assistants table until payment is confirmed

      return NextResponse.json({ 
        message: `Assistant ${assistantName} created as pending`,
        assistantId: pendingAssistantId, // Use pendingAssistantId as the main ID now
        pendingAssistantId: pendingAssistantId
      });
    } catch (apiError: any) {
      console.error('Error creating assistant:', apiError);
      return NextResponse.json(
        { error: `Failed to create assistant: ${apiError.message || ''}` }, 
        { status: 500 }
      );
    }
  } catch (e: any) {
    console.error('Unexpected error:', e);
    return NextResponse.json({ error: `Internal server error: ${e.message || ''}` }, { status: 500 });
  }
}