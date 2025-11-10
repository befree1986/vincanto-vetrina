// Pulizia diretta database - Eliminazione tabelle eccessive
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: 'postgresql://neondb_owner:npg_5TBySVaU7Ktf@ep-sweet-glitter-ag53yugd-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require',
  ssl: { rejectUnauthorized: false }
});

async function cleanDatabase() {
  try {
    console.log('🗑️ Pulizia database in corso...');
    
    // Tabelle da mantenere (solo essenziali)
    const keepTables = [
      'bookings',
      'users', 
      'admin_settings',
      'pricing_config'
    ];
    
    // Lista tutte le tabelle
    const allTables = await pool.query(`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public'
    `);
    
    // Trova tabelle da eliminare
    const tablesToDelete = allTables.rows
      .map(r => r.tablename)
      .filter(name => !keepTables.includes(name));
    
    console.log('📋 Tabelle da eliminare:', tablesToDelete);
    
    // Elimina tabelle una per una
    for (const tableName of tablesToDelete) {
      try {
        await pool.query(`DROP TABLE IF EXISTS "${tableName}" CASCADE`);
        console.log(`✅ Eliminata: ${tableName}`);
      } catch (error) {
        console.log(`❌ Errore eliminando ${tableName}:`, error.message);
      }
    }
    
    // Crea tabella eventi calendario
    await pool.query(`
      CREATE TABLE IF NOT EXISTS calendar_events (
        id SERIAL PRIMARY KEY,
        uid TEXT UNIQUE NOT NULL,
        calendar_source VARCHAR(50) NOT NULL,
        summary TEXT NOT NULL,
        description TEXT,
        start_date TIMESTAMP NOT NULL,
        end_date TIMESTAMP NOT NULL,
        location TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    
    // Crea tabella richieste contatto
    await pool.query(`
      CREATE TABLE IF NOT EXISTS contact_requests (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        phone VARCHAR(50),
        subject VARCHAR(255),
        message TEXT NOT NULL,
        status VARCHAR(20) DEFAULT 'new',
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    
    console.log('✅ Nuove tabelle create');
    
    // Verifica stato finale
    const finalTables = await pool.query(`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public'
      ORDER BY tablename
    `);
    
    console.log('\n🎉 PULIZIA COMPLETATA');
    console.log('📊 Tabelle finali:', finalTables.rowCount);
    finalTables.rows.forEach(row => console.log(`  ✓ ${row.tablename}`));
    
  } catch (error) {
    console.error('❌ Errore:', error.message);
  } finally {
    await pool.end();
  }
}

cleanDatabase();