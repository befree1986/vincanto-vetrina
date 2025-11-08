// API ENDPOINT QUOTE - Preventivi semplificati
import { Pool } from 'pg';

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

/**
 * Funzione per calcolare il prezzo con sistema BASE + AGGIUNTIVE
 */
function calculateGroupPrice(guests, config) {
  const basePrice = (config.basePrice || 75) * 2; // Base per 2 persone
  let additionalCost = 0;
  let breakdown = `Base 2 persone: €${basePrice}`;
  
  if (guests <= 2) {
    return {
      totalPerNight: basePrice,
      basePrice: basePrice,
      additionalCost: 0,
      breakdown: breakdown
    };
  }
  
  let remainingGuests = guests - 2;
  
  // 3-4 persone
  if (remainingGuests > 0) {
    const guestsInRange = Math.min(remainingGuests, 2);
    const costPerGuest = config.additionalGuest3to4 || 30;
    const rangeCost = guestsInRange * costPerGuest;
    additionalCost += rangeCost;
    breakdown += ` + 3-4 persone: €${rangeCost} (${guestsInRange}×€${costPerGuest})`;
    remainingGuests -= guestsInRange;
  }
  
  // 5-6 persone
  if (remainingGuests > 0) {
    const guestsInRange = Math.min(remainingGuests, 2);
    const costPerGuest = config.additionalGuest5to6 || 25;
    const rangeCost = guestsInRange * costPerGuest;
    additionalCost += rangeCost;
    breakdown += ` + 5-6 persone: €${rangeCost} (${guestsInRange}×€${costPerGuest})`;
    remainingGuests -= guestsInRange;
  }
  
  // 7-8 persone
  if (remainingGuests > 0) {
    const guestsInRange = Math.min(remainingGuests, 2);
    const costPerGuest = config.additionalGuest7to8 || 20;
    const rangeCost = guestsInRange * costPerGuest;
    additionalCost += rangeCost;
    breakdown += ` + 7-8 persone: €${rangeCost} (${guestsInRange}×€${costPerGuest})`;
    remainingGuests -= guestsInRange;
  }
  
  return {
    totalPerNight: basePrice + additionalCost,
    basePrice: basePrice,
    additionalCost: additionalCost,
    breakdown: breakdown
  };
}

/**
 * Carica configurazione prezzi dal database
 */
async function loadPricingConfig() {
  const defaultConfig = {
    basePrice: 75,
    additionalGuest3to4: 30,
    additionalGuest5to6: 25,
    additionalGuest7to8: 20,
    cleaningFee: 50,
    parkingFee: 20,
    touristTaxAdult: 2.00
  };

  try {
    const result = await pool.query(`
      SELECT setting_key, setting_value
      FROM admin_settings 
      WHERE category = 'pricing'
    `);
    
    if (result.rows.length > 0) {
      const settings = {};
      result.rows.forEach(row => {
        settings[row.setting_key] = parseFloat(row.setting_value) || row.setting_value;
      });
      
      return {
        basePrice: settings.base_price || defaultConfig.basePrice,
        additionalGuest3to4: settings.additional_guest_3to4 || defaultConfig.additionalGuest3to4,
        additionalGuest5to6: settings.additional_guest_5to6 || defaultConfig.additionalGuest5to6,
        additionalGuest7to8: settings.additional_guest_7to8 || defaultConfig.additionalGuest7to8,
        cleaningFee: settings.cleaning_fee || defaultConfig.cleaningFee,
        parkingFee: settings.parking_fee || defaultConfig.parkingFee,
        touristTaxAdult: settings.tourist_tax_adult || defaultConfig.touristTaxAdult
      };
    }
    
    return defaultConfig;
  } catch (error) {
    console.error('❌ Errore caricamento pricing:', error.message);
    return defaultConfig;
  }
}

export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Metodo non consentito' });
  }

  try {
    const { checkIn, checkOut, guests, includeParking, children } = req.query;
    
    if (!checkIn || !checkOut || !guests) {
      return res.status(400).json({ 
        success: false, 
        error: 'Parametri richiesti: checkIn, checkOut, guests' 
      });
    }

    // Validazione date
    const startDate = new Date(checkIn);
    const endDate = new Date(checkOut);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (startDate < today) {
      return res.status(400).json({ 
        success: false, 
        error: 'Data di check-in non può essere nel passato' 
      });
    }

    if (endDate <= startDate) {
      return res.status(400).json({ 
        success: false, 
        error: 'Data di check-out deve essere successiva al check-in' 
      });
    }

    // Calcolo notti
    const diffTime = Math.abs(endDate - startDate);
    const nights = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (nights < 1) {
      return res.status(400).json({ 
        success: false, 
        error: 'Almeno 1 notte richiesta' 
      });
    }

    const config = await loadPricingConfig();
    const priceCalculation = calculateGroupPrice(parseInt(guests), config);
    
    const baseCost = nights * priceCalculation.totalPerNight;
    const cleaningCost = config.cleaningFee;
    const parkingCost = (includeParking === 'true') ? nights * config.parkingFee : 0;
    
    const guestsCount = parseInt(guests);
    const childrenCount = parseInt(children) || 0;
    const adults = Math.max(1, guestsCount - childrenCount);
    const touristTax = adults * Math.min(nights, 7) * config.touristTaxAdult;
    
    const totalAmount = baseCost + cleaningCost + parkingCost + touristTax;
    const depositAmount = totalAmount * 0.30;

    return res.status(200).json({
      success: true,
      quote: {
        checkIn,
        checkOut,
        nights,
        guests: guestsCount,
        adults,
        children: childrenCount,
        pricePerNight: priceCalculation.totalPerNight,
        basePrice: priceCalculation.basePrice,
        additionalCost: priceCalculation.additionalCost,
        priceBreakdown: priceCalculation.breakdown,
        accommodationCost: baseCost,
        cleaningFee: cleaningCost,
        parkingFee: parkingCost,
        touristTax: touristTax,
        totalAmount: totalAmount,
        depositAmount: depositAmount,
        remainingAmount: totalAmount - depositAmount,
        available: true,
        currency: 'EUR',
        system: 'base-plus-additional'
      }
    });
    
  } catch (error) {
    console.error('❌ Errore API Quote:', error);
    return res.status(500).json({
      success: false,
      error: 'Errore interno del server',
      message: error.message
    });
  }
}