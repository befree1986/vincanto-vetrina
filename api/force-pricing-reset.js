const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  console.log('🔄 Forzando reset prezzi nel database...');

  try {
    const client = await pool.connect();
    
    // Aggiorna tutti i valori di pricing con quelli corretti
    const updates = [
      { key: 'base_price', value: '75' },
      { key: 'additional_guest_price', value: '20' },
      { key: 'cleaning_fee', value: '50' },
      { key: 'weekend_surcharge', value: '0' },
      { key: 'weekly_discount', value: '10' },
      { key: 'monthly_discount', value: '15' },
      { key: 'parking_fee', value: '20' },
      { key: 'minimum_nights', value: '2' },
      { key: 'maximum_nights', value: '14' }
    ];

    for (const update of updates) {
      const result = await client.query(`
        INSERT INTO admin_settings (setting_key, setting_value, setting_type, category, created_at, updated_at)
        VALUES ($1, $2, 'config', 'pricing', NOW(), NOW())
        ON CONFLICT (setting_key) 
        DO UPDATE SET 
          setting_value = $2, 
          updated_at = NOW()
      `, [update.key, update.value]);
      
      console.log(`✅ Forzato ${update.key} = ${update.value} (${result.rowCount} rows affected)`);
    }

    client.release();

    // Verifica i valori aggiornati
    const client2 = await pool.connect();
    const verifyResult = await client2.query(`
      SELECT setting_key, setting_value FROM admin_settings 
      WHERE category = 'pricing' 
      ORDER BY setting_key
    `);
    client2.release();

    res.status(200).json({
      success: true,
      message: 'Prezzi forzati con successo',
      updates: updates,
      currentValues: verifyResult.rows
    });

  } catch (error) {
    console.error('❌ Errore reset prezzi:', error);
    res.status(500).json({
      success: false,
      message: 'Errore interno del server',
      error: error.message
    });
  }
}