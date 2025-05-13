/**
 * Database Maintenance Utilities
 * 
 * This module provides functions for running database maintenance operations
 * on demand from within the application. These operations complement the
 * automated maintenance scheduled in the database.
 */

import { createClient } from '@/utils/supabase/server';

/**
 * Run database vacuum and analyze operations
 * 
 * @returns Result of the maintenance operation
 */
export async function runVacuumAndAnalyze() {
  const supabase = await createClient();
  
  try {
    const { data, error } = await supabase.rpc('maintenance.vacuum_database');
    
    if (error) {
      throw new Error(`Error running vacuum: ${error.message}`);
    }
    
    return { success: true, message: 'Vacuum and analyze completed successfully' };
  } catch (error) {
    console.error('Error running database vacuum:', error);
    return { success: false, message: `Failed to run vacuum: ${error instanceof Error ? error.message : String(error)}` };
  }
}

/**
 * Refresh materialized views to ensure analytics data is current
 * 
 * @returns Result of the refresh operation
 */
export async function refreshMaterializedViews() {
  const supabase = await createClient();
  
  try {
    const { data, error } = await supabase.rpc('maintenance.refresh_materialized_views');
    
    if (error) {
      throw new Error(`Error refreshing views: ${error.message}`);
    }
    
    return { success: true, message: 'Materialized views refreshed successfully' };
  } catch (error) {
    console.error('Error refreshing materialized views:', error);
    return { success: false, message: `Failed to refresh views: ${error instanceof Error ? error.message : String(error)}` };
  }
}

/**
 * Run the daily statistics aggregation process
 * 
 * @returns Result of the aggregation operation
 */
export async function aggregateDailyStats() {
  const supabase = await createClient();
  
  try {
    const { data, error } = await supabase.rpc('maintenance.aggregate_daily_stats');
    
    if (error) {
      throw new Error(`Error aggregating stats: ${error.message}`);
    }
    
    return { success: true, message: 'Daily statistics aggregated successfully' };
  } catch (error) {
    console.error('Error aggregating daily stats:', error);
    return { success: false, message: `Failed to aggregate stats: ${error instanceof Error ? error.message : String(error)}` };
  }
}

/**
 * Create the next month's partition for the interactions table
 * 
 * @returns Result of the partition creation operation
 */
export async function createNextPartition() {
  const supabase = await createClient();
  
  try {
    const { data, error } = await supabase.rpc('maintenance.create_next_partition');
    
    if (error) {
      throw new Error(`Error creating partition: ${error.message}`);
    }
    
    return { success: true, message: 'Next partition created successfully' };
  } catch (error) {
    console.error('Error creating next partition:', error);
    return { success: false, message: `Failed to create partition: ${error instanceof Error ? error.message : String(error)}` };
  }
}

/**
 * Archive old interaction data (older than specified months)
 * 
 * @param monthsToKeep Number of months of data to retain (default: 12)
 * @returns Result of the archiving operation with count of archived records
 */
export async function archiveOldData(monthsToKeep = 12) {
  const supabase = await createClient();
  
  try {
    // Calculate archive date
    const archiveDate = new Date();
    archiveDate.setMonth(archiveDate.getMonth() - monthsToKeep);
    const archiveDateStr = archiveDate.toISOString().split('T')[0]; // Format as YYYY-MM-DD
    
    // Call the archive function
    const { data, error } = await supabase.rpc('archive_old_interactions', {
      archive_before_date: archiveDateStr
    });
    
    if (error) {
      throw new Error(`Error archiving data: ${error.message}`);
    }
    
    const archivedCount = data || 0;
    
    return { 
      success: true, 
      message: `Successfully archived ${archivedCount} records older than ${archiveDateStr}`,
      archivedCount
    };
  } catch (error) {
    console.error('Error archiving old data:', error);
    return { success: false, message: `Failed to archive data: ${error instanceof Error ? error.message : String(error)}` };
  }
}

/**
 * Run all maintenance operations in the optimal order
 * 
 * @returns Result of the maintenance operations
 */
export async function runFullMaintenance() {
  const supabase = await createClient();
  
  try {
    const { data, error } = await supabase.rpc('maintenance.run_all_maintenance');
    
    if (error) {
      throw new Error(`Error running maintenance: ${error.message}`);
    }
    
    return { success: true, message: 'Full maintenance completed successfully' };
  } catch (error) {
    console.error('Error running full maintenance:', error);
    return { success: false, message: `Failed to run maintenance: ${error instanceof Error ? error.message : String(error)}` };
  }
}

/**
 * Get database statistics for monitoring
 * 
 * @returns Database statistics including table sizes and row counts
 */
export async function getDatabaseStats() {
  const supabase = await createClient();
  
  try {
    // Get table sizes
    const { data: tableSizes, error: tableSizesError } = await supabase.rpc('get_table_sizes');
    
    if (tableSizesError) {
      throw new Error(`Error getting table sizes: ${tableSizesError.message}`);
    }
    
    // Get row counts for important tables
    const { data: rowCounts, error: rowCountsError } = await supabase.rpc('get_table_row_counts');
    
    if (rowCountsError) {
      throw new Error(`Error getting row counts: ${rowCountsError.message}`);
    }
    
    // Get index usage statistics
    const { data: indexStats, error: indexStatsError } = await supabase.rpc('get_index_usage_stats');
    
    if (indexStatsError) {
      throw new Error(`Error getting index stats: ${indexStatsError.message}`);
    }
    
    return { 
      success: true,
      tableSizes: tableSizes || [],
      rowCounts: rowCounts || [],
      indexStats: indexStats || []
    };
  } catch (error) {
    console.error('Error getting database stats:', error);
    return { success: false, message: `Failed to get database stats: ${error instanceof Error ? error.message : String(error)}` };
  }
}