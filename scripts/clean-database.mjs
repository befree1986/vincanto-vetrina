// Script per pulire Database Neon - Solo tabelle essenziali
import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL,
  ssl: { rejectUnauthorized: false }
});

/**
 * PULIZIA COMPLETA DATABASE NEON
 * Mantiene solo le tabelle essenziali per Vincanto
 */
async function cleanDatabase() {
  try {
    console.log('🗑️ Avvio pulizia database Neon...');
    
    // 1. Lista tutte le tabelle esistenti
    const tablesResult = await pool.query(`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public'
    `);
    
    console.log('📋 Tabelle trovate:', tablesResult.rows.map(r => r.tablename));
    
    // 2. Tabelle essenziali da mantenere
    const essentialTables = [
      'calendar_events',     // Eventi calendario sincronizzati
      'bookings',           // Prenotazioni
      'users',              // Utenti registrati  
      'admin_settings',     // Configurazioni admin
      'contact_requests'    // Richieste di contatto
    ];
    
    // 3. Trova tabelle da eliminare
    const tablesToDelete = tablesResult.rows
      .map(r => r.tablename)
      .filter(name => !essentialTables.includes(name))
      .filter(name => !name.startsWith('pg_')) // Non eliminare tabelle sistema
      .filter(name => !name.startsWith('information_schema'));
    
    console.log('🗑️ Tabelle da eliminare:', tablesToDelete);
    
    // 4. Elimina tabelle non necessarie
    for (const tableName of tablesToDelete) {
      try {
        await pool.query(`DROP TABLE IF EXISTS "${tableName}" CASCADE`);
        console.log(`✅ Eliminata tabella: ${tableName}`);
      } catch (error) {
        console.log(`❌ Errore eliminando ${tableName}:`, error.message);
      }
    }
    
    // 5. Crea/aggiorna struttura tabelle essenziali
    await createEssentialTables();
    
    console.log('🎉 Pulizia database completata!');
    
  } catch (error) {
    console.error('❌ Errore pulizia database:', error);
  } finally {
    await pool.end();
  }
}

/**
 * Crea tabelle essenziali con struttura ottimizzata
 */
async function createEssentialTables() {
  console.log('📊 Creando struttura tabelle essenziali...');
  
  // Tabella eventi calendario
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
      status VARCHAR(20) DEFAULT 'active',
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `);
  
  // Indici per performance
  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_calendar_events_dates 
    ON calendar_events(start_date, end_date)
  `);
  
  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_calendar_events_source 
    ON calendar_events(calendar_source)
  `);
  
  // Tabella prenotazioni
  await pool.query(`
    CREATE TABLE IF NOT EXISTS bookings (
      id SERIAL PRIMARY KEY,
      booking_id VARCHAR(100) UNIQUE NOT NULL,
      guest_name VARCHAR(255) NOT NULL,
      guest_email VARCHAR(255) NOT NULL,
      guest_phone VARCHAR(50),
      check_in DATE NOT NULL,
      check_out DATE NOT NULL,
      guests_count INTEGER NOT NULL,
      total_price DECIMAL(10,2),
      currency VARCHAR(3) DEFAULT 'EUR',
      status VARCHAR(30) DEFAULT 'pending',
      source VARCHAR(50),
      notes TEXT,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `);
  
  // Tabella utenti
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      email VARCHAR(255) UNIQUE NOT NULL,
      name VARCHAR(255) NOT NULL,
      phone VARCHAR(50),
      preferences JSONB,
      status VARCHAR(20) DEFAULT 'active',
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `);
  
  // Tabella configurazioni admin
  await pool.query(`
    CREATE TABLE IF NOT EXISTS admin_settings (
      id SERIAL PRIMARY KEY,
      category VARCHAR(100) NOT NULL,
      setting_key VARCHAR(100) NOT NULL,
      setting_value TEXT,
      description TEXT,
      updated_at TIMESTAMP DEFAULT NOW(),
      UNIQUE(category, setting_key)
    )
  `);
  
  // Tabella richieste contatto
  await pool.query(`
    CREATE TABLE IF NOT EXISTS contact_requests (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL,
      phone VARCHAR(50),
      subject VARCHAR(255),
      message TEXT NOT NULL,
      status VARCHAR(20) DEFAULT 'new',
      created_at TIMESTAMP DEFAULT NOW(),
      responded_at TIMESTAMP
    )
  `);
  
  console.log('✅ Struttura tabelle essenziali creata');
}

/**
 * Verifica stato finale database
 */
async function verifyDatabaseState() {
  const tablesResult = await pool.query(`
    SELECT tablename, schemaname
    FROM pg_tables 
    WHERE schemaname = 'public'
    ORDER BY tablename
  `);
  
  console.log('\n📊 STATO FINALE DATABASE:');
  console.log('Tabelle presenti:', tablesResult.rowCount);
  tablesResult.rows.forEach(row => {
    console.log(`  - ${row.tablename}`);
  });
  
  // Conta record per tabella
  for (const row of tablesResult.rows) {
    try {
      const countResult = await pool.query(`SELECT COUNT(*) FROM "${row.tablename}"`);
      console.log(`    └─ Record: ${countResult.rows[0].count}`);
    } catch (error) {
      console.log(`    └─ Errore conteggio: ${error.message}`);
    }
  }
}

// Esegui pulizia
if (import.meta.url === `file://${process.argv[1]}`) {
  cleanDatabase()
    .then(() => verifyDatabaseState())
    .then(() => process.exit(0))
    .catch(error => {
      console.error('❌ Errore:', error);
      process.exit(1);
    });
}