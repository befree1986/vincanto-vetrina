// Test per verificare la struttura della tabella blocked_dates
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

export default async function handler(req, res) {
  try {
    console.log('🔍 Verifico struttura tabella blocked_dates...');
    
    // Verifica se la tabella esiste
    const tableExists = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'blocked_dates'
      );
    `);
    
    console.log('📋 Tabella blocked_dates esiste:', tableExists.rows[0].exists);
    
    if (!tableExists.rows[0].exists) {
      // Crea la tabella se non esiste
      await pool.query(`
        CREATE TABLE IF NOT EXISTS blocked_dates (
          id SERIAL PRIMARY KEY,
          start_date DATE NOT NULL,
          end_date DATE NOT NULL,
          reason TEXT DEFAULT 'Blocco manuale',
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        );
      `);
      console.log('✅ Tabella blocked_dates creata');
    } else {
      // Verifica struttura esistente
      const columns = await pool.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'blocked_dates'
        ORDER BY ordinal_position;
      `);
      console.log('📋 Colonne tabella blocked_dates:', columns.rows);
    }
    
    // Test di inserimento/lettura
    const testResult = await pool.query(`
      SELECT id, start_date, end_date, reason, created_at 
      FROM blocked_dates 
      ORDER BY start_date DESC 
      LIMIT 5
    `);
    
    return res.status(200).json({
      success: true,
      tableExists: tableExists.rows[0].exists,
      structure: 'verified',
      sampleData: testResult.rows,
      message: 'Struttura tabella blocked_dates verificata e funzionante'
    });
    
  } catch (error) {
    console.error('❌ Errore verifica tabella:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
      details: error.toString()
    });
  }
}