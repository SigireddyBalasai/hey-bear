import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { getPineconeClient } from '@/lib/pinecone';
import { TablesInsert } from '@/lib/db.types';
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
    
    const { assistantName, description } = body;
    
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
      
      // Generate unique Pinecone name with valid format
      let pinecone_name = generatePineconeName(assistantName);
      console.log(`Generated Pinecone name: ${pinecone_name}`);
      
      // Create assistant in Pinecone
      const pinecone = getPineconeClient();
      if (!pinecone) {
        return NextResponse.json({ error: 'Pinecone client initialization failed' }, { status: 500 });
      }
      
      let pineconeResult;
      let attempts = 0;
      const MAX_ATTEMPTS = 3;
      
      // Try creating assistant with retries for name conflicts
      while (attempts < MAX_ATTEMPTS) {
        try {
          // Try to create the assistant in Pinecone using the generated name
          pineconeResult = await pinecone.createAssistant({
            name: pinecone_name,
            metadata: { 
              owner: user.id,
              description: description || 'No description provided',
              created_at: new Date().toISOString(),
              display_name: assistantName
            },
          });
          
          // Successfully created, exit the loop
          break;
          
        } catch (pineconeError: any) {
          // If the assistant already exists, retry with a new name
          if (pineconeError.message && pineconeError.message.includes('ALREADY_EXISTS')) {
            console.log('Concierge already exists in Pinecone, generating new name');
            attempts++;
            
            if (attempts >= MAX_ATTEMPTS) {
              throw new Error('Failed to create Concierge after multiple attempts. Please try again later.');
            }
            
            // Generate a new name for the next attempt
            pinecone_name = generatePineconeName(assistantName + `-${attempts}`);
            console.log(`Retry #${attempts} with name: ${pinecone_name}`);
          } else {
            // For other errors, stop and return the error
            console.error('Pinecone error:', pineconeError);
            throw pineconeError;
          }
        }
      }

      // Insert into assistants table with valid UUID and pinecone_name
      const assistantData: TablesInsert<'assistants'> = {
        id: assistantId,
        user_id: userId,
        name: assistantName,
        pinecone_name: pinecone_name,
        created_at: new Date().toISOString(),
        params: {
          description: description || 'No description provided',
          is_active: true,
          createdAt: new Date().toISOString()
        }
      };

      const { error } = await supabase.from('assistants').insert(assistantData);

      if (error) {
        console.error('Error saving Concierge to Supabase:', error);
        return NextResponse.json({ error: 'Failed to save Concierge to database' }, { status: 500 });
      }

      return NextResponse.json({ 
        message: `Assistant ${assistantName} created`,
        assistantId: assistantId,
        pinecone_name: pinecone_name
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