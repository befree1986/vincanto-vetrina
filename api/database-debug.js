const { Pool } = require('pg');

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('🔍 DEBUG: Verifica configurazione database...');

    // Check if admin_settings table exists
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'admin_settings'
      );
    `);

    const tableExists = tableCheck.rows[0].exists;
    console.log('📋 Tabella admin_settings esiste:', tableExists);

    if (!tableExists) {
      // Create admin_settings table
      await pool.query(`
        CREATE TABLE IF NOT EXISTS admin_settings (
          id SERIAL PRIMARY KEY,
          setting_key VARCHAR(50) UNIQUE NOT NULL,
          setting_value TEXT,
          category VARCHAR(30) DEFAULT 'general',
          description TEXT,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        );
      `);
      console.log('✅ Tabella admin_settings creata');
    }

    // Check existing settings
    const settingsQuery = await pool.query(`
      SELECT setting_key, setting_value, category 
      FROM admin_settings 
      WHERE category = 'pricing'
      ORDER BY setting_key
    `);

    console.log('💰 Configurazioni pricing esistenti:', settingsQuery.rows);

    // If no pricing settings exist, create defaults
    if (settingsQuery.rows.length === 0) {
      const defaultSettings = [
        { key: 'base_price', value: '75', category: 'pricing', description: 'Prezzo base per persona per notte' },
        { key: 'cleaning_fee', value: '50', category: 'pricing', description: 'Costo pulizia finale' },
        { key: 'parking_fee', value: '15', category: 'pricing', description: 'Costo parcheggio per notte' },
        { key: 'weekend_surcharge', value: '20', category: 'pricing', description: 'Maggiorazione weekend' },
        { key: 'weekly_discount', value: '10', category: 'pricing', description: 'Sconto soggiorni settimanali %' },
        { key: 'monthly_discount', value: '15', category: 'pricing', description: 'Sconto soggiorni mensili %' }
      ];

      for (const setting of defaultSettings) {
        await pool.query(`
          INSERT INTO admin_settings (setting_key, setting_value, category, description)
          VALUES ($1, $2, $3, $4)
          ON CONFLICT (setting_key) DO UPDATE SET
            setting_value = $2,
            updated_at = NOW()
        `, [setting.key, setting.value, setting.category, setting.description]);
      }

      console.log('✅ Configurazioni pricing predefinite create');
    }

    // Get final settings after initialization
    const finalSettings = await pool.query(`
      SELECT setting_key, setting_value, category 
      FROM admin_settings 
      WHERE category = 'pricing'
      ORDER BY setting_key
    `);

    return res.json({
      success: true,
      tableExists: tableExists,
      settingsCount: finalSettings.rows.length,
      pricingSettings: finalSettings.rows,
      message: 'Database configurato correttamente'
    });

  } catch (error) {
    console.error('❌ Errore debug database:', error);
    return res.status(500).json({
      success: false,
      error: 'Errore configurazione database',
      details: error.message
    });
  }
};