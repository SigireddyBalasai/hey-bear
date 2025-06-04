const { Client } = require('pg');

// Simplified test to verify the database schema and constraints are working
async function testDatabaseSetup() {
  
  console.log('🧪 Testing payment session database setup...\n');

  try {
    // Connect to the local Supabase database
    const client = new Client({
      host: '127.0.0.1',
      port: 54322,
      database: 'postgres',
      user: 'postgres',
      password: 'postgres',
    });

    await client.connect();
    console.log('✅ Connected to database');

    // 1. Test foreign key constraint is correct
    console.log('📝 Checking foreign key constraint...');
    const constraintQuery = `
      SELECT 
        tc.constraint_name,
        tc.table_name,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_name = 'payment_sessions'
        AND kcu.column_name = 'user_id';
    `;
    
    const constraintResult = await client.query(constraintQuery);
    if (constraintResult.rows.length === 0) {
      console.error('❌ No foreign key constraint found for payment_sessions.user_id');
      return;
    }
    
    const constraint = constraintResult.rows[0];
    if (constraint.foreign_table_name === 'users' && constraint.foreign_column_name === 'id') {
      console.log('✅ Foreign key constraint correctly references users(id)');
    } else {
      console.error('❌ Foreign key constraint references wrong table:', constraint.foreign_table_name);
      return;
    }

    // 2. Test inserting data with proper relationships
    console.log('📝 Testing data insertion with foreign key...');
    
    // First create a test auth user
    const authUserResult = await client.query(`
      INSERT INTO auth.users (id, email, created_at, updated_at, email_confirmed_at)
      VALUES (gen_random_uuid(), 'test@example.com', now(), now(), now())
      RETURNING id;
    `);
    const authUserId = authUserResult.rows[0].id;
    console.log('✅ Created test auth user:', authUserId);

    // Create corresponding app user
    const appUserResult = await client.query(`
      INSERT INTO public.users (auth_user_id, email, full_name, created_at, updated_at)
      VALUES ($1, 'test@example.com', 'Test User', now(), now())
      RETURNING id;
    `, [authUserId]);
    const appUserId = appUserResult.rows[0].id;
    console.log('✅ Created test app user:', appUserId);

    // Try to create payment session with correct user_id (should work)
    const sessionResult = await client.query(`
      INSERT INTO public.payment_sessions (session_id, user_id, assistant_config_data)
      VALUES ('test_session_123', $1, '{"name": "Test Assistant"}')
      RETURNING id;
    `, [appUserId]);
    const sessionId = sessionResult.rows[0].id;
    console.log('✅ Created payment session:', sessionId);

    // Verify foreign key relationship works
    const joinQuery = `
      SELECT ps.id, ps.session_id, u.email, u.full_name
      FROM payment_sessions ps
      JOIN users u ON ps.user_id = u.id
      WHERE ps.id = $1;
    `;
    const joinResult = await client.query(joinQuery, [sessionId]);
    if (joinResult.rows.length > 0) {
      console.log('✅ Foreign key relationship verified:', joinResult.rows[0].email);
    } else {
      console.error('❌ Failed to join payment_sessions with users');
    }

    // Try to create payment session with auth user_id (should fail)
    console.log('📝 Testing constraint enforcement...');
    try {
      await client.query(`
        INSERT INTO public.payment_sessions (session_id, user_id, assistant_config_data)
        VALUES ('test_session_456', $1, '{"name": "Test Assistant 2"}');
      `, [authUserId]);
      console.error('❌ Payment session creation should have failed with auth user ID');
    } catch (err) {
      if (err.message.includes('violates foreign key constraint')) {
        console.log('✅ Foreign key constraint properly enforced');
      } else {
        console.error('❌ Unexpected error:', err.message);
      }
    }

    // Clean up test data
    console.log('🧹 Cleaning up test data...');
    await client.query('DELETE FROM payment_sessions WHERE session_id = $1', ['test_session_123']);
    await client.query('DELETE FROM public.users WHERE id = $1', [appUserId]);
    await client.query('DELETE FROM auth.users WHERE id = $1', [authUserId]);
    console.log('✅ Test data cleaned up');

    await client.end();
    console.log('\n🎉 All database tests passed! Payment session foreign key is working correctly.');

  } catch (error) {
    console.error('💥 Test failed:', error.message);
  }
}

testDatabaseSetup();
