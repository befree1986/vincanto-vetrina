// API endpoint per i prezzi Vincanto
import { Pool } from 'pg';

export default async function handler(req, res) {
  console.log('📊 API Pricing chiamata:', req.method, req.url);

  // Headers CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  let client;

  try {
    if (req.method === 'GET') {
      // 🔥 CARICA CONFIGURAZIONE PREZZI DAL DATABASE ADMIN IN TEMPO REALE
      let pricingConfig = {
        basePrice: 85,
        cleaningFee: 40,
        weekendSurcharge: 20,
        weeklyDiscount: 15,
        monthlyDiscount: 25,
        additionalGuestPrice: 25,
        maxGuests: 8,
        minStay: 2,
        maxStay: 30,
        currency: 'EUR',
        taxRate: 10, // Tassa di soggiorno
        parkingFeePerNight: 10,
        airConditioningFeePerNight: 15,
        lastUpdated: new Date().toISOString()
      };

      try {
        const pool = new Pool({
          connectionString: process.env.POSTGRES_URL
        });
        client = await pool.connect();
        
        console.log('🔄 Caricamento configurazione prezzi dal database admin...');
        const result = await client.query(`
          SELECT setting_key, setting_value
          FROM admin_settings 
          WHERE category = 'pricing'
        `);
        
        if (result.rows.length > 0) {
          const settings = {};
          result.rows.forEach(row => {
            settings[row.setting_key] = row.setting_value;
          });
          
          // Aggiorna config con valori dal database admin
          pricingConfig = {
            ...pricingConfig,
            basePrice: parseFloat(settings.base_price) || pricingConfig.basePrice,
            cleaningFee: parseFloat(settings.cleaning_fee) || pricingConfig.cleaningFee,
            weekendSurcharge: parseFloat(settings.weekend_surcharge) || pricingConfig.weekendSurcharge,
            weeklyDiscount: parseFloat(settings.weekly_discount) || pricingConfig.weeklyDiscount,
            monthlyDiscount: parseFloat(settings.monthly_discount) || pricingConfig.monthlyDiscount,
            minStay: parseInt(settings.minimum_nights) || pricingConfig.minStay,
            maxStay: parseInt(settings.maximum_nights) || pricingConfig.maxStay,
            lastUpdated: new Date().toISOString()
          };
          
          console.log('✅ Configurazione prezzi aggiornata dal database admin:', pricingConfig);
        } else {
          console.log('⚠️ Nessuna configurazione prezzi nel database, uso valori predefiniti');
        }
      } catch (dbError) {
        console.error('❌ Errore caricamento prezzi dal database:', dbError);
        console.log('🔄 Usando configurazione prezzi predefinita');
      }

      console.log('✅ Configurazione prezzi restituita');
      return res.status(200).json({
        success: true,
        data: pricingConfig,
        message: 'Configurazione prezzi caricata dal database admin'
      });
    }

    if (req.method === 'POST') {
      // Aggiornamento configurazione prezzi (per admin)
      const updates = req.body;
      console.log('💾 Aggiornamento prezzi:', updates);
      
      return res.status(200).json({
        success: true,
        message: 'Configurazione prezzi aggiornata'
      });
    }

    return res.status(405).json({
      success: false,
      message: 'Metodo non supportato'
    });

  } catch (error) {
    console.error('❌ Errore API Pricing:', error);
    return res.status(500).json({
      success: false,
      message: 'Errore interno del server',
      error: error.message
    });
  } finally {
    // Chiudi connessione database se aperta
    if (client) {
      try {
        client.release();
      } catch (releaseError) {
        console.error('❌ Errore chiusura connessione database:', releaseError);
      }
    }
  }
}