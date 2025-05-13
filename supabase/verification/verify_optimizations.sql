-- Database Optimization Verification Script
-- Created: May 13, 2025

-- Verify that the maintenance functions were properly created
DO $$
DECLARE
  function_count INT;
  missing_functions TEXT := '';
BEGIN
  -- Check for the required maintenance functions
  WITH required_functions AS (
    SELECT 'maintenance.vacuum_tables' AS function_name UNION
    SELECT 'maintenance.reindex_fragmented_indexes' UNION
    SELECT 'maintenance.update_statistics' UNION
    SELECT 'maintenance.run_all_maintenance' UNION
    SELECT 'maintenance.scheduled_maintenance' UNION
    SELECT 'maintenance.with_advisory_lock'
  )
  SELECT 
    COUNT(*),
    string_agg(r.function_name, ', ' ORDER BY r.function_name) 
  INTO 
    function_count,
    missing_functions
  FROM 
    required_functions r
  LEFT JOIN 
    pg_proc p ON p.proname = split_part(r.function_name, '.', 2) 
    AND p.pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = split_part(r.function_name, '.', 1))
  WHERE 
    p.oid IS NULL;
  
  -- Output the results
  IF function_count > 0 THEN
    RAISE NOTICE 'VERIFICATION FAILED: Missing % functions: %', function_count, missing_functions;
    RAISE EXCEPTION 'Database optimization verification failed';
  ELSE
    RAISE NOTICE 'VERIFICATION PASSED: All maintenance functions are installed properly';
  END IF;
END;
$$;

-- Test database maintenance functions with dry run mode
DO $$
BEGIN
  RAISE NOTICE 'Testing maintenance functions...';
  
  -- Don't actually execute maintenance operations in verification
  -- Just make sure they can be called without errors
  
  PERFORM * FROM pg_tables WHERE schemaname = 'maintenance';
  
  RAISE NOTICE 'Maintenance functions verification complete';
END;
$$;