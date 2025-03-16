import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET(req: Request) {
  try {
    const supabase = await createClient();
    
    // Authenticate the user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch all unassigned phone numbers
    const { data: numbers, error } = await supabase
      .from('phonenumbers')
      .select('id, number')
      .eq('is_assigned', false)
      .order('created_at', { ascending: false });
      
    if (error) {
      console.error('Error fetching available phone numbers:', error);
      return NextResponse.json(
        { error: 'Failed to fetch available phone numbers' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ numbers: numbers || [] });
  } catch (error: any) {
    console.error("Error fetching available phone numbers:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
