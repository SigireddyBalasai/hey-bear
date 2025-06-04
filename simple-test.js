const { Client } = require('pg');

async function simpleTest() {
  console.log('Testing payment session database setup...');
  
  try {
    const client = new Client({
      host: '127.0.0.1',
      port: 54322,
      database: 'postgres',
      user: 'postgres',
      password: 'postgres',
    });

    await client.connect();
    console.log('Connected to database');

    // Check foreign key constraint
    const result = await client.query(`
      SELECT 
        tc.constraint_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_name = 'payment_sessions'
        AND kcu.column_name = 'user_id'
    `);
    
    if (result.rows.length > 0) {
      const constraint = result.rows[0];
      console.log(`Foreign key references: ${constraint.foreign_table_name}(${constraint.foreign_column_name})`);
      
      if (constraint.foreign_table_name === 'users') {
        console.log('SUCCESS: Foreign key correctly references users table');
      } else {
        console.log('ERROR: Foreign key references wrong table');
      }
    } else {
      console.log('ERROR: No foreign key constraint found');
    }

    await client.end();
  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

simpleTest();
