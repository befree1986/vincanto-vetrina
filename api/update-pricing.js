const { Pool } = require('pg');

// ✅ Configurazione database PostgreSQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

export default async function handler(req, res) {
  // Solo metodo POST per sicurezza
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  console.log('🔄 Forzando aggiornamento prezzi nel database...');

  try {
    const client = await pool.connect();
    
    // Aggiorna i valori esistenti con quelli corretti
    const updates = [
      { key: 'base_price', value: '75' },
      { key: 'additional_guest_price', value: '20' }
    ];

    for (const update of updates) {
      const result = await client.query(`
        UPDATE admin_settings 
        SET setting_value = $1, updated_at = NOW()
        WHERE setting_key = $2 AND category = 'pricing'
      `, [update.value, update.key]);
      
      console.log(`✅ Aggiornato ${update.key} = ${update.value} (${result.rowCount} rows affected)`);
    }

    client.release();

    res.status(200).json({
      success: true,
      message: 'Prezzi aggiornati con successo',
      updates: updates
    });

  } catch (error) {
    console.error('❌ Errore aggiornamento prezzi:', error);
    res.status(500).json({
      success: false,
      message: 'Errore interno del server',
      error: error.message
    });
  }
}