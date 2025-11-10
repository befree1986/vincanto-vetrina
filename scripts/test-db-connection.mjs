// Test connessione database semplice
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: 'postgresql://neondb_owner:npg_5TBySVaU7Ktf@ep-sweet-glitter-ag53yugd-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require',
  ssl: { rejectUnauthorized: false }
});

async function testConnection() {
  try {
    console.log('🔄 Testando connessione database...');
    
    const result = await pool.query('SELECT NOW() as current_time');
    console.log('✅ Connessione OK:', result.rows[0].current_time);
    
    // Lista tabelle
    const tables = await pool.query(`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public'
      ORDER BY tablename
    `);
    
    console.log('📋 Tabelle presenti:', tables.rowCount);
    tables.rows.forEach(row => console.log(`  - ${row.tablename}`));
    
  } catch (error) {
    console.error('❌ Errore connessione:', error.message);
  } finally {
    await pool.end();
  }
}

testConnection();