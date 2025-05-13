import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { getDatabaseStats } from '@/utils/db-maintenance';

/**
 * API endpoint to get database statistics for admin dashboard
 */
export async function GET() {
  try {
    // Fetch database statistics
    const result = await getDatabaseStats();
    
    if (!result.success) {
      return NextResponse.json(
        { success: false, message: result.message }, 
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      tableSizes: result.tableSizes,
      rowCounts: result.rowCounts,
      indexStats: result.indexStats
    });
  } catch (error) {
    console.error('Error in database stats API:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to retrieve database statistics' }, 
      { status: 500 }
    );
  }
}