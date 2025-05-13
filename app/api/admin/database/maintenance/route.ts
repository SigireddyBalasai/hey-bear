import { NextRequest, NextResponse } from 'next/server';
import { 
  runVacuumAndAnalyze, 
  refreshMaterializedViews, 
  aggregateDailyStats,
  createNextPartition,
  archiveOldData,
  runFullMaintenance
} from '@/utils/db-maintenance';

// Authorization middleware would typically be added here
// to ensure only admin users can access this endpoint

/**
 * API endpoint to trigger database maintenance operations
 */
export async function POST(request: NextRequest) {
  try {
    const { action } = await request.json();
    
    // Validate the action parameter
    if (!action || typeof action !== 'string') {
      return NextResponse.json(
        { success: false, message: 'Invalid action parameter' }, 
        { status: 400 }
      );
    }
    
    let result;
    
    // Run the appropriate maintenance function based on the action
    switch (action) {
      case 'vacuum':
        result = await runVacuumAndAnalyze();
        break;
      case 'refresh':
        result = await refreshMaterializedViews();
        break;
      case 'aggregate':
        result = await aggregateDailyStats();
        break;
      case 'partition':
        result = await createNextPartition();
        break;
      case 'archive':
        result = await archiveOldData(12); // Archive data older than 12 months
        break;
      case 'full':
        result = await runFullMaintenance();
        break;
      default:
        return NextResponse.json(
          { success: false, message: `Unknown maintenance action: ${action}` }, 
          { status: 400 }
        );
    }
    
    // Return the result from the maintenance operation
    return NextResponse.json({
      success: result.success,
      message: result.message
    });
  } catch (error) {
    console.error('Error in database maintenance API:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to execute maintenance operation' }, 
      { status: 500 }
    );
  }
}