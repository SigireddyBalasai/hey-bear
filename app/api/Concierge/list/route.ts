import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { getPineconeClient } from '@/lib/pinecone';

export async function GET() {
  try {
    const supabase = await createClient();

    const { data, error: authError } = await supabase.auth.getUser();
    if (authError || !data || !data.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const user = data.user;

    try {
      const pinecone = getPineconeClient();
      
      // Check if Pinecone client was initialized successfully
      if (!pinecone) {
        console.error('Failed to initialize Pinecone client');
        return NextResponse.json({ 
          assistants: [],
          error: 'Failed to connect to knowledge base service'
        });
      }
      
      // Now safely call listAssistants as pinecone is not null
      const assistantsResponse = await pinecone.listAssistants().catch(error => {
        console.error('Pinecone error listing assistants:', error);
        return { assistants: [] }; // Return empty array on error
      });
      
      // Ensure we have an assistants array, even if empty
      const allAssistants = Array.isArray(assistantsResponse?.assistants) ? assistantsResponse.assistants : [];
      
      // Filter assistants by user (assuming Pinecone supports metadata or naming convention)
      const userAssistants = allAssistants.filter((a: any) => 
        a && a.metadata && a.metadata.owner === user.id
      );

      return NextResponse.json({ assistants: userAssistants });
    } catch (error) {
      console.error('Error listing assistants:', error);
      // Return empty list instead of error
      return NextResponse.json({ assistants: [] });
    }
  } catch (error) {
    console.error('Unexpected error in assistant list:', error);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}