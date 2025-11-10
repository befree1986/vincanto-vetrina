// Script per vedere la struttura delle tabelle
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: 'postgresql://neondb_owner:npg_5TBySVaU7Ktf@ep-sweet-glitter-ag53yugd-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require',
  ssl: { rejectUnauthorized: false }
});

async function checkTableStructure() {
  try {
    console.log('🔄 Struttura tabelle database...\n');
    
    const tables = ['bookings', 'admin_settings', 'pricing_config', 'calendar_events'];
    
    for (const tableName of tables) {
      console.log(`📋 STRUTTURA ${tableName.toUpperCase()}:`);
      
      const structure = await pool.query(`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_name = $1
        ORDER BY ordinal_position
      `, [tableName]);
      
      structure.rows.forEach(col => {
        console.log(`  - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? 'NOT NULL' : ''}`);
      });
      
      // Vedi alcuni dati campione
      const sample = await pool.query(`SELECT * FROM ${tableName} LIMIT 2`);
      console.log(`  Dati: ${sample.rowCount} righe`);
      if (sample.rowCount > 0) {
        console.log('  Esempio:', JSON.stringify(sample.rows[0], null, 2));
      }
      console.log('');
    }
    
  } catch (error) {
    console.error('❌ Errore:', error.message);
  } finally {
    await pool.end();
  }
}

checkTableStructure();