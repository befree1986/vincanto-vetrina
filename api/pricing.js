// API UNIFICATA PREZZI - Gestisce tutti i servizi di pricing
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
  const basePrice = (config.basePrice || config.priceGroup1to2 || 75) * 2;
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
    const costPerGuest = config.additionalGuest3to4 || config.priceGroup3to4 || 30;
    const rangeCost = guestsInRange * costPerGuest;
    additionalCost += rangeCost;
    breakdown += ` + 3-4 persone: €${rangeCost} (${guestsInRange}×€${costPerGuest})`;
    remainingGuests -= guestsInRange;
  }
  
  // 5-6 persone
  if (remainingGuests > 0) {
    const guestsInRange = Math.min(remainingGuests, 2);
    const costPerGuest = config.additionalGuest5to6 || config.priceGroup5to6 || 25;
    const rangeCost = guestsInRange * costPerGuest;
    additionalCost += rangeCost;
    breakdown += ` + 5-6 persone: €${rangeCost} (${guestsInRange}×€${costPerGuest})`;
    remainingGuests -= guestsInRange;
  }
  
  // 7-8 persone
  if (remainingGuests > 0) {
    const guestsInRange = Math.min(remainingGuests, 2);
    const costPerGuest = config.additionalGuest7to8 || config.priceGroup7to8 || 20;
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
 * Calcola il costo totale del soggiorno
 */
function calculateStayTotal(params, config) {
  const { guests, nights, includeParking = false, children = 0 } = params;
  
  const priceCalculation = calculateGroupPrice(guests, config);
  const pricePerNight = priceCalculation.totalPerNight;
  const subtotal = pricePerNight * nights;
  const cleaningFee = config.cleaningFee || 50;
  const parkingFee = includeParking ? (config.parkingFee || 20) * nights : 0;
  
  const adults = Math.max(1, guests - children);
  const touristTax = adults * (config.touristTaxAdult || 2.00) * Math.min(nights, 7);
  
  const total = subtotal + cleaningFee + parkingFee + touristTax;
  
  return {
    pricePerNight,
    basePrice: priceCalculation.basePrice,
    additionalCost: priceCalculation.additionalCost,
    subtotal,
    cleaningFee,
    parkingFee,
    touristTax,
    total,
    breakdown: {
      pricePerNight: pricePerNight,
      basePrice: priceCalculation.basePrice,
      additionalCost: priceCalculation.additionalCost,
      priceBreakdown: priceCalculation.breakdown,
      nights,
      guests,
      adults
    }
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
    touristTaxAdult: 2.00,
    weeklyDiscount: 10,
    monthlyDiscount: 15
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
        settings[row.setting_key] = row.setting_value;
      });
      
      return {
        basePrice: parseFloat(settings.base_price) || parseFloat(settings.price_group_1to2) || defaultConfig.basePrice,
        additionalGuest3to4: parseFloat(settings.additional_guest_3to4) || parseFloat(settings.price_group_3to4) || defaultConfig.additionalGuest3to4,
        additionalGuest5to6: parseFloat(settings.additional_guest_5to6) || parseFloat(settings.price_group_5to6) || defaultConfig.additionalGuest5to6,
        additionalGuest7to8: parseFloat(settings.additional_guest_7to8) || parseFloat(settings.price_group_7to8) || defaultConfig.additionalGuest7to8,
        cleaningFee: parseFloat(settings.cleaning_fee) || defaultConfig.cleaningFee,
        parkingFee: parseFloat(settings.parking_fee) || defaultConfig.parkingFee,
        touristTaxAdult: parseFloat(settings.tourist_tax_adult) || defaultConfig.touristTaxAdult,
        weeklyDiscount: parseFloat(settings.weekly_discount) || defaultConfig.weeklyDiscount,
        monthlyDiscount: parseFloat(settings.monthly_discount) || defaultConfig.monthlyDiscount
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
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { action } = req.query;
  
  try {
    switch (action) {
      case 'config':
        // GET /api/pricing?action=config - Ritorna configurazione prezzi
        if (req.method !== 'GET') {
          return res.status(405).json({ success: false, error: 'Metodo non consentito' });
        }
        
        const config = await loadPricingConfig();
        return res.status(200).json({
          success: true,
          config: config
        });

      case 'calculate':
        // GET/POST /api/pricing?action=calculate - Calcola prezzo per parametri
        const { guests, nights, includeParking, children } = req.method === 'GET' ? req.query : req.body;
        
        if (!guests || !nights) {
          return res.status(400).json({ 
            success: false, 
            error: 'Parametri richiesti: guests, nights' 
          });
        }

        const pricing = await loadPricingConfig();
        const calculation = calculateStayTotal({
          guests: parseInt(guests),
          nights: parseInt(nights),
          includeParking: includeParking === 'true' || includeParking === true,
          children: parseInt(children) || 0
        }, pricing);

        return res.status(200).json({
          success: true,
          pricing: calculation
        });

      case 'quote':
        // GET/POST /api/pricing?action=quote - Genera preventivo completo
        let { checkIn, checkOut, guests: qGuests, includeParking: qParking, adults, children: qChildren, childrenAges } = req.method === 'GET' ? req.query : req.body;
        
        qGuests = parseInt(qGuests) || 0;
        adults = parseInt(adults) || qGuests;
        qChildren = parseInt(qChildren) || 0;
        childrenAges = Array.isArray(childrenAges) ? childrenAges.map(age => parseInt(age)) : [];
        qParking = qParking === 'true' || qParking === true;

        if (!checkIn || !checkOut || !qGuests) {
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
        const nightsCount = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (nightsCount < 1) {
          return res.status(400).json({ 
            success: false, 
            error: 'Almeno 1 notte richiesta' 
          });
        }

        const quotePricing = await loadPricingConfig();
        
        // Calcola con sconti durata
        const priceCalculation = calculateGroupPrice(qGuests, quotePricing);
        const pricePerNight = priceCalculation.totalPerNight;
        // Calculate base cost with per-night pricing
        let baseCost = nightsCount * pricePerNight;
        
        let appliedDiscount = 0;
        let discountType = '';
        let discountAmount = 0;
        
        if (nightsCount >= 30 && quotePricing.monthlyDiscount > 0) {
          appliedDiscount = quotePricing.monthlyDiscount;
          discountType = 'Sconto Mensile (30+ notti)';
        } else if (nightsCount >= 7 && quotePricing.weeklyDiscount > 0) {
          appliedDiscount = quotePricing.weeklyDiscount;
          discountType = 'Sconto Settimanale (7+ notti)';
        }
        
        if (appliedDiscount > 0) {
          discountAmount = baseCost * (appliedDiscount / 100);
          baseCost = baseCost - discountAmount;
        }
        
        const cleaningCost = quotePricing.cleaningFee;
        const parkingCost = qParking ? nightsCount * quotePricing.parkingFee : 0;
        
        // Tassa di soggiorno
        let guestsSubjectToTax = adults || qGuests;
        if (childrenAges && childrenAges.length > 0) {
          const childrenOver12 = childrenAges.filter(age => age >= 12).length;
          guestsSubjectToTax = (adults || qGuests - qChildren) + childrenOver12;
        }
        
        const touristTax = guestsSubjectToTax * Math.min(nightsCount, 7) * quotePricing.touristTaxAdult;
        const totalAmount = baseCost + cleaningCost + parkingCost + touristTax;
        const depositAmount = totalAmount * 0.30;

        return res.status(200).json({
          success: true,
          quote: {
            checkIn,
            checkOut,
            nights: nightsCount,
            guests: qGuests,
            adults: adults || qGuests,
            children: qChildren || 0,
            priceGroup: qGuests <= 2 ? '1-2' : qGuests <= 4 ? '3-4' : qGuests <= 6 ? '5-6' : '7-8',
            pricePerNight,
            basePrice: priceCalculation.basePrice,
            additionalCost: priceCalculation.additionalCost,
            priceBreakdown: priceCalculation.breakdown,
            accommodationCost: baseCost,
            cleaningFee: cleaningCost,
            parkingFee: parkingCost,
            touristTax: touristTax,
            discountAmount: discountAmount,
            discountType: discountType || null,
            totalAmount: totalAmount,
            depositAmount: depositAmount,
            remainingAmount: totalAmount - depositAmount,
            available: true,
            currency: 'EUR',
            system: 'base-plus-additional',
            version: '3.0'
          },
          pricing: {
            config: quotePricing,
            breakdown: {
              accommodationCost: baseCost,
              cleaningFee: cleaningCost,
              parkingFee: parkingCost,
              touristTax: touristTax,
              discount: discountAmount > 0 ? `-€${discountAmount.toFixed(2)} (${discountType})` : null
            }
          }
        });

      default:
        return res.status(400).json({ 
          success: false, 
          error: 'Azione non riconosciuta. Usa: config, calculate, quote' 
        });
    }
  } catch (error) {
    console.error('❌ Errore API Pricing Unificata:', error);
    return res.status(500).json({
      success: false,
      error: 'Errore interno del server',
      message: error.message
    });
  }
}