import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { v4 as uuidv4 } from 'uuid';
import { getPineconeClient } from '@/lib/pinecone';
import { updateAssistantData } from '@/utils/assistant-data';
import { Tables } from '@/lib/db.types';
import crypto from 'crypto';

// Generate a valid name for Pinecone assistant
// Pinecone requires names to be lowercase alphanumeric with hyphens only
function generatePineconeName(base: string): string {
  // Replace spaces and special characters with hyphens, ensure lowercase
  let prefix = base.toLowerCase().replace(/[^a-z0-9]/g, '-');
  
  // Ensure the name isn't too long (leave room for random suffix)
  prefix = prefix.substring(0, 40);
  
  // Add a random suffix for uniqueness
  const randomSuffix = Math.random().toString(36).substring(2, 8);
  
  return `${prefix}-${randomSuffix}`;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // Validate required fields
    const { 
      assistantName, 
      description, 
      params = {},
      plan = 'personal'  // Default to personal plan
    } = body;
    
    if (!assistantName) {
      return NextResponse.json({ error: 'Assistant name is required' }, { status: 400 });
    }
    
    // Get authentication
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.error('Auth error:', authError);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    try {
      // Get user ID from the users table
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
      
      // Extract configuration parameters from params
      const {
        conciergeName,
        conciergePersonality,
        businessName,
        sharePhoneNumber,
        phoneNumber,
        systemPrompt
      } = params;

      // Create a pending assistant record that will be fulfilled after payment is confirmed
      const pendingAssistantData: Tables<'assistants'>['Insert'] = {
        id: pendingAssistantId,
        user_id: userId,
        name: assistantName,
        description: description || null,
        created_at: new Date().toISOString(),
        pending: true, // Set the pending flag instead of using a separate table
        pinecone_name: pinecone_name,
        // For backward compatibility, still include params
        params: {
          description,
          systemPrompt,
          plan,
          pending: true,
          createdAt: new Date().toISOString(),
          conciergeName,
          conciergePersonality,
          businessName,
          sharePhoneNumber,
          phoneNumber
        }
      };

      // Insert into assistants table with pending flag
      const { error: pendingError } = await supabase
        .from('assistants')
        .insert(pendingAssistantData);

      if (pendingError) {
        console.error('Error saving pending assistant to Supabase:', pendingError);
        return NextResponse.json({ error: 'Failed to save pending assistant to database' }, { status: 500 });
      }
      
      // Also insert the normalized data into the new tables
      await updateAssistantData(pendingAssistantId, {
        config: {
          id: pendingAssistantId,
          description: description || null,
          concierge_name: conciergeName || assistantName,
          concierge_personality: conciergePersonality || null,
          business_name: businessName || null,
          share_phone_number: sharePhoneNumber || false,
          business_phone: phoneNumber || null,
          system_prompt: systemPrompt || null
        },
        subscription: {
          assistant_id: pendingAssistantId,
          plan: plan || 'personal',
          status: 'pending',
          created_at: new Date().toISOString()
        },
        usageLimits: {
          assistant_id: pendingAssistantId,
          max_messages: plan === 'business' ? 2000 : 100,
          max_tokens: plan === 'business' ? 1000000 : 100000,
          max_documents: plan === 'business' ? 25 : 5,
          max_webpages: plan === 'business' ? 25 : 5
        }
      });

      return NextResponse.json({ 
        message: `Assistant ${assistantName} created as pending`,
        assistantId: pendingAssistantId,
        pendingAssistantId: pendingAssistantId
      });
    } catch (apiError: any) {
      console.error('Error creating assistant:', apiError);
      return NextResponse.json({ 
        error: 'Failed to create assistant', 
        details: apiError.message
      }, { status: 500 });
    }
  } catch (error: any) {
    console.error('Error processing request:', error);
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error.message 
    }, { status: 500 });
  }
}