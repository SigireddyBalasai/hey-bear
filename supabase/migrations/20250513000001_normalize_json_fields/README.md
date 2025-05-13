# Database Normalization Project

This migration moves away from using JSON fields (`params` column in the `assistants` table) in favor of a more structured, normalized database design.

## Why Normalize?

1. **Better Queryability**: Normalized data is easier to query and filter
2. **Improved Performance**: Queries on structured fields perform better than JSON field queries
3. **Data Integrity**: Structured tables enforce data types and constraints
4. **Maintainability**: Easier to understand, maintain, and extend the database schema

## Migration Overview

This migration creates four new tables to replace the `params` JSON field:

1. **assistant_configs**: Stores configuration parameters like description, concierge name, personality settings
2. **assistant_subscriptions**: Stores subscription details previously nested in the params.subscription object
3. **assistant_usage_limits**: Defines usage limits based on the subscription plan
4. **assistant_activity**: Tracks assistant activity metrics like last_used_at, total_messages, etc.

## Backward Compatibility

To ensure a smooth transition, this migration maintains backward compatibility:

- The `params` column is preserved during the transition
- Data is duplicated between the JSON field and the new tables
- A compatibility layer lets existing code continue to work with `params` 
- New code should use the normalized tables directly

## Implementation Details

### Database Changes

1. **New Tables**:
   - `assistant_configs`
   - `assistant_subscriptions`
   - `assistant_usage_limits` 
   - `assistant_activity`

2. **Migration Function**: 
   - `migrate_assistant_params()` extracts data from JSON fields and populates the new tables

3. **Updated Stored Procedures**:
   - `get_assistant_subscription_details()` function updated to work with the new schema

### Application Changes

1. **New Helper Module**: 
   - `assistant-data.ts` provides utility functions for working with the normalized structure
   - Includes backward compatibility layer for code still using `params`

2. **Updated Components**:
   - Key components updated to use normalized tables instead of JSON fields
   - API endpoints modified to store data in both formats during transition

## Testing the Migration

To test this migration:

1. **Apply database changes**:
   ```bash
   supabase db push
   ```

2. **Verify data migration**:
   - Check that data has been correctly copied from `params` to the new tables
   - Run a query like:
   ```sql
   SELECT a.id, a.name, 
     (a.params->>'description') as param_desc,
     ac.description as config_desc
   FROM assistants a
   JOIN assistant_configs ac ON a.id = ac.id
   LIMIT 10;
   ```

3. **Test the application**:
   - Ensure you can create new assistants
   - Verify subscription status is correctly tracked
   - Check that usage monitoring works

## Rollback Procedure

If needed, you can roll back using:

```bash
supabase db reset --db-reset
```

Or apply the provided `down.sql` script:

```bash
supabase db run --file supabase/migrations/20250513000001_normalize_json_fields/down.sql
```

## Future Steps

After the migration is fully deployed and stable:

1. Gradually refactor all code to use the normalized tables directly
2. Update database views and functions to exclusively use the new schema
3. Eventually remove the redundant `params` column (in a future migration)

## Monitoring

After deployment, monitor:

1. Database performance metrics
2. Application error rates 
3. Customer support issues related to assistant functionality

Report any issues to the database team for immediate resolution.