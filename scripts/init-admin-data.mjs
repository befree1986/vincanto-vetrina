import { Pool } from 'pg';

// Configurazione database Neon
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function initializeAdminData() {
  const client = await pool.connect();
  
  try {
    console.log('🚀 Inizializzazione dati admin...');
    
    // Inserisci configurazioni pricing di default nella tabella settings
    const pricingSettings = [
      { key: 'base_price', value: '85.00', type: 'number', category: 'pricing', description: 'Prezzo base per notte' },
      { key: 'additional_guest_price', value: '25.00', type: 'number', category: 'pricing', description: 'Prezzo aggiuntivo per ospite extra' },
      { key: 'cleaning_fee', value: '40.00', type: 'number', category: 'pricing', description: 'Tassa di pulizia' },
      { key: 'parking_fee_per_night', value: '15.00', type: 'number', category: 'pricing', description: 'Tassa parcheggio per notte' },
      { key: 'minimum_nights', value: '2', type: 'number', category: 'pricing', description: 'Numero minimo notti' },
      { key: 'deposit_percentage', value: '0.30', type: 'number', category: 'pricing', description: 'Percentuale acconto' }
    ];
    
    for (const setting of pricingSettings) {
      await client.query(`
        INSERT INTO admin_settings (setting_key, setting_value, setting_type, category, description) 
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (setting_key) DO UPDATE SET
          setting_value = EXCLUDED.setting_value,
          updated_at = NOW()
      `, [setting.key, setting.value, setting.type, setting.category, setting.description]);
    }
    
    // Inserisci calendario esempio
    const calendarCheck = await client.query("SELECT COUNT(*) FROM admin_calendar_configs");
    if (parseInt(calendarCheck.rows[0].count) === 0) {
      await client.query(`
        INSERT INTO admin_calendar_configs (calendar_name, platform, calendar_url, is_active) 
        VALUES 
          ('Airbnb Principal', 'airbnb', 'https://airbnb.com/calendar/ical/xxxxx', true),
          ('Booking.com', 'booking_com', 'https://booking.com/calendar/ical/xxxxx', true)
      `);
    }
    
    // Inserisci notifica di sistema
    await client.query(`
      INSERT INTO admin_notifications (title, message, type, is_read) 
      VALUES 
        ('✅ Sistema Admin Attivo', 'Pannello amministrazione completamente funzionale con database Neon collegato e funzionalità reali attive.', 'system', false),
        ('🔧 Database Inizializzato', 'Configurazioni di default caricate. Sistema pronto per uso autonomo.', 'system', false)
      ON CONFLICT DO NOTHING
    `);
    
    console.log('✅ Dati iniziali caricati con successo!');
    
  } catch (error) {
    console.error('❌ Errore durante inizializzazione:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

initializeAdminData();