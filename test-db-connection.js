// Test database connection
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://neondb_owner:npg_5TBySVaU7Ktf@ep-sweet-glitter-ag53yugd-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require',
  ssl: { rejectUnauthorized: false }
});

async function testConnection() {
  try {
    console.log('🔄 Testing database connection...');
    
    const client = await pool.connect();
    console.log('✅ Database connected successfully');
    
    // Test query
    const result = await client.query('SELECT NOW() as current_time');
    console.log('🕐 Current time:', result.rows[0].current_time);
    
    // Test admin_settings
    const settings = await client.query('SELECT COUNT(*) FROM admin_settings');
    console.log('📊 Admin settings count:', settings.rows[0].count);
    
    client.release();
    console.log('✅ Test completed successfully');
    
  } catch (error) {
    console.error('❌ Database error:', error.message);
    console.error('❌ Error code:', error.code);
    console.error('❌ Error detail:', error.detail);
  } finally {
    await pool.end();
  }
}

testConnection();