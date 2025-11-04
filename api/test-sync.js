// Test endpoint per verificare sincronizzazione prezzi admin-frontend
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    console.log('🧪 TEST SYNC: Verifica sincronizzazione admin-frontend...');
    
    // 1. Leggi prezzi dal database admin
    const adminResult = await pool.query(`
      SELECT setting_key, setting_value
      FROM admin_settings 
      WHERE category = 'pricing'
      ORDER BY setting_key
    `);
    
    const adminPrices = {};
    adminResult.rows.forEach(row => {
      adminPrices[row.setting_key] = row.setting_value;
    });
    
    // 2. Simula chiamata API quote
    const quoteResponse = await fetch(`${req.headers.origin || 'https://vincanto-vetrina.vercel.app'}/api/quote?checkIn=2025-01-15&checkOut=2025-01-17&guests=2&includeParking=true`);
    const quoteData = await quoteResponse.json();
    
    // 3. Confronta i risultati
    const comparison = {
      admin_database: {
        basePrice: adminPrices.basePrice || adminPrices.base_price,
        parkingFee: adminPrices.parkingFee || adminPrices.parking_fee || adminPrices.parking_fee_per_night,
        cleaningFee: adminPrices.cleaningFee || adminPrices.cleaning_fee,
        additionalGuestPrice: adminPrices.additionalGuestPrice || adminPrices.additional_guest_price,
        touristTax: adminPrices.touristTaxAdult || adminPrices.touristTaxPerPersonPerNight
      },
      frontend_api_quote: quoteData.pricingConfig || {},
      sync_status: {
        basePrice: (adminPrices.basePrice || adminPrices.base_price) === String(quoteData.pricingConfig?.basePrice),
        parkingFee: (adminPrices.parkingFee || adminPrices.parking_fee) === String(quoteData.pricingConfig?.parkingFee),
        cleaningFee: (adminPrices.cleaningFee || adminPrices.cleaning_fee) === String(quoteData.pricingConfig?.cleaningFee)
      }
    };
    
    return res.status(200).json({
      success: true,
      timestamp: new Date().toISOString(),
      message: 'Test sincronizzazione prezzi admin-frontend',
      data: comparison,
      all_admin_settings: adminPrices,
      quote_response: quoteData
    });
    
  } catch (error) {
    console.error('❌ Errore test sync:', error);
    return res.status(500).json({
      success: false,
      error: 'Errore durante test sincronizzazione',
      details: error.message
    });
  }
}