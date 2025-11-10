// Script per vedere la struttura della tabella contact_requests
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: 'postgresql://neondb_owner:npg_5TBySVaU7Ktf@ep-sweet-glitter-ag53yugd-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require',
  ssl: { rejectUnauthorized: false }
});

async function checkContactsTable() {
  try {
    console.log('🔄 Controllando struttura contact_requests...\n');
    
    const structure = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'contact_requests'
      ORDER BY ordinal_position
    `);
    
    console.log('📋 STRUTTURA CONTACT_REQUESTS:');
    structure.rows.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? 'NOT NULL' : ''}`);
    });
    
    // Vedi anche tabelle simili
    const tables = await pool.query(`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public' AND tablename LIKE '%contact%'
      ORDER BY tablename
    `);
    
    console.log('\n📋 Tabelle contenenti "contact":');
    tables.rows.forEach(table => {
      console.log(`  - ${table.tablename}`);
    });
    
  } catch (error) {
    console.error('❌ Errore:', error.message);
  } finally {
    await pool.end();
  }
}

checkContactsTable();