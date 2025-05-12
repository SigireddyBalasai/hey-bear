import { NextRequest, NextResponse } from 'next/server';
import { getRouteStatistics } from '@/utils/analytics/route-scanner';
import { createClient } from '@/utils/supabase/server';

/**
 * API endpoint to get API usage analytics
 * Restricted to admin users only
 */
export async function GET(req: NextRequest) {
  try {
    // Check authentication and admin permissions
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check admin status
    const { data: userData, error: userDataError } = await supabase
      .from('users')
      .select('is_admin')
      .eq('auth_user_id', user.id)
      .single();
      
    if (userDataError || !userData?.is_admin) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    // Get API usage statistics
    const stats = await getRouteStatistics();
    
    return NextResponse.json({
      success: true,
      data: stats
    });
  } catch (error: any) {
    console.error('Error fetching API analytics:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to fetch API analytics'
      },
      { status: 500 }
    );
  }
}