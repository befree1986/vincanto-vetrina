// Script per creare tutte le tabelle mancanti nel database
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

export default async function handler(req, res) {
  // Solo GET permesso
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Only GET allowed' });
  }

  let client;
  const results = [];

  try {
    client = await pool.connect();
    console.log('🔧 SETUP DATABASE - Inizio creazione tabelle mancanti');

    // 1. Tabella admin_calendar_events per calendario e date bloccate
    try {
      await client.query(`
        CREATE TABLE IF NOT EXISTS admin_calendar_events (
          id SERIAL PRIMARY KEY,
          event_title VARCHAR(255) NOT NULL,
          event_date DATE NOT NULL,
          event_type VARCHAR(50) DEFAULT 'blocked',
          event_description TEXT,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        );
      `);
      results.push({ table: 'admin_calendar_events', status: 'created' });
      console.log('✅ Tabella admin_calendar_events creata');
    } catch (error) {
      results.push({ table: 'admin_calendar_events', status: 'error', error: error.message });
      console.log('❌ Errore admin_calendar_events:', error.message);
    }

    // 2. Tabella admin_bookings per prenotazioni
    try {
      await client.query(`
        CREATE TABLE IF NOT EXISTS admin_bookings (
          id SERIAL PRIMARY KEY,
          booking_id VARCHAR(50) UNIQUE NOT NULL,
          guest_name VARCHAR(255) NOT NULL,
          guest_email VARCHAR(255) NOT NULL,
          guest_phone VARCHAR(50),
          check_in_date DATE NOT NULL,
          check_out_date DATE NOT NULL,
          guests_count INTEGER DEFAULT 1,
          total_amount DECIMAL(10,2) NOT NULL,
          status VARCHAR(50) DEFAULT 'pending',
          payment_status VARCHAR(50) DEFAULT 'pending',
          notes TEXT,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        );
      `);
      results.push({ table: 'admin_bookings', status: 'created' });
      console.log('✅ Tabella admin_bookings creata');
    } catch (error) {
      results.push({ table: 'admin_bookings', status: 'error', error: error.message });
      console.log('❌ Errore admin_bookings:', error.message);
    }

    // 3. Tabella admin_payments per pagamenti
    try {
      await client.query(`
        CREATE TABLE IF NOT EXISTS admin_payments (
          id SERIAL PRIMARY KEY,
          booking_id VARCHAR(50) NOT NULL,
          amount DECIMAL(10,2) NOT NULL,
          currency VARCHAR(3) DEFAULT 'EUR',
          payment_method VARCHAR(50) NOT NULL,
          status VARCHAR(50) DEFAULT 'pending',
          transaction_id VARCHAR(255),
          stripe_payment_id VARCHAR(255),
          paypal_payment_id VARCHAR(255),
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW(),
          FOREIGN KEY (booking_id) REFERENCES admin_bookings(booking_id)
        );
      `);
      results.push({ table: 'admin_payments', status: 'created' });
      console.log('✅ Tabella admin_payments creata');
    } catch (error) {
      results.push({ table: 'admin_payments', status: 'error', error: error.message });
      console.log('❌ Errore admin_payments:', error.message);
    }

    // 4. Tabella admin_calendar_configs per configurazioni calendario
    try {
      await client.query(`
        CREATE TABLE IF NOT EXISTS admin_calendar_configs (
          id SERIAL PRIMARY KEY,
          calendar_name VARCHAR(255) NOT NULL,
          platform VARCHAR(50) NOT NULL,
          calendar_url TEXT,
          last_sync_at TIMESTAMP,
          sync_status VARCHAR(50) DEFAULT 'active',
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        );
      `);
      results.push({ table: 'admin_calendar_configs', status: 'created' });
      console.log('✅ Tabella admin_calendar_configs creata');
    } catch (error) {
      results.push({ table: 'admin_calendar_configs', status: 'error', error: error.message });
      console.log('❌ Errore admin_calendar_configs:', error.message);
    }

    // 5. Inserimento dati di esempio per il calendario
    try {
      await client.query(`
        INSERT INTO admin_calendar_configs (calendar_name, platform, sync_status)
        VALUES ('Calendario Principale', 'ical', 'active')
        ON CONFLICT DO NOTHING;
      `);
      console.log('✅ Calendario di esempio inserito');
    } catch (error) {
      console.log('⚠️ Errore inserimento calendario esempio:', error.message);
    }

    // 6. Verifica finale delle tabelle create
    const tableCheck = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name LIKE 'admin_%'
      ORDER BY table_name;
    `);

    return res.status(200).json({
      success: true,
      message: 'Setup database completato',
      results: results,
      tablesCreated: tableCheck.rows.map(row => row.table_name),
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Setup Database Error:', error);
    return res.status(500).json({
      success: false,
      error: 'Errore durante setup database',
      details: error.message,
      results: results
    });
  } finally {
    if (client) {
      client.release();
    }
  }
}