// Debug API per verificare prezzi nel database
const { Pool } = require('pg');

// 🔗 Configurazione database
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

export default async function handler(req, res) {
  try {
    console.log('🔍 PRICING DEBUG - Controllo prezzi nel database');
    
    // Carica tutti i settings di pricing
    const result = await pool.query(`
      SELECT setting_key, setting_value, category, updated_at
      FROM admin_settings 
      WHERE category = 'pricing'
      ORDER BY setting_key
    `);
    
    console.log('📊 RISULTATI DATABASE:', result.rows);
    
    // Carica anche i prezzi hardcoded per confronto
    const hardcodedPrices = {
      base_price: 75,
      cleaning_fee: 50,
      parking_fee: 15,
      tourist_tax: 2
    };
    
    // Carica i prezzi dal database come fa l'API quote
    const settings = {};
    result.rows.forEach(row => {
      settings[row.setting_key] = row.setting_value;
    });
    
    let finalPrices = {
      basePrice: parseFloat(settings.base_price) || hardcodedPrices.base_price,
      cleaningFee: parseFloat(settings.cleaning_fee) || hardcodedPrices.cleaning_fee,
      parkingFee: parseFloat(settings.parking_fee) || hardcodedPrices.parking_fee,
      touristTax: parseFloat(settings.tourist_tax) || hardcodedPrices.tourist_tax
    };
    
    console.log('💰 PREZZI FINALI CALCOLATI:', finalPrices);
    
    res.status(200).json({
      success: true,
      data: {
        database_rows: result.rows,
        settings_object: settings,
        hardcoded_fallbacks: hardcodedPrices,
        final_prices: finalPrices,
        database_count: result.rows.length,
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('❌ ERRORE PRICING DEBUG:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      stack: error.stack
    });
  }
}