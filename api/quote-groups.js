// API Quote Sistema Gruppi - Versione 2.0
import { Pool } from 'pg';

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

/**
 * Calcola il prezzo con sistema BASE + AGGIUNTIVE
 */
function calculateGroupPrice(guests, pricing) {
  // Prezzo base per 2 persone
  const basePrice = (pricing.basePrice || pricing.priceGroup1to2 || 75) * 2;
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
  
  // Calcola costi aggiuntivi
  let remainingGuests = guests - 2;
  
  // 3-4 persone
  if (remainingGuests > 0) {
    const guestsInRange = Math.min(remainingGuests, 2);
    const costPerGuest = pricing.additionalGuest3to4 || pricing.priceGroup3to4 || 30;
    const rangeCost = guestsInRange * costPerGuest;
    additionalCost += rangeCost;
    breakdown += ` + 3-4: €${rangeCost}`;
    remainingGuests -= guestsInRange;
  }
  
  // 5-6 persone
  if (remainingGuests > 0) {
    const guestsInRange = Math.min(remainingGuests, 2);
    const costPerGuest = pricing.additionalGuest5to6 || pricing.priceGroup5to6 || 25;
    const rangeCost = guestsInRange * costPerGuest;
    additionalCost += rangeCost;
    breakdown += ` + 5-6: €${rangeCost}`;
    remainingGuests -= guestsInRange;
  }
  
  // 7-8 persone
  if (remainingGuests > 0) {
    const guestsInRange = Math.min(remainingGuests, 2);
    const costPerGuest = pricing.additionalGuest7to8 || pricing.priceGroup7to8 || 20;
    const rangeCost = guestsInRange * costPerGuest;
    additionalCost += rangeCost;
    breakdown += ` + 7-8: €${rangeCost}`;
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
 * Calcola il totale del soggiorno con il nuovo sistema base + aggiuntive
 */
function calculateStayTotal(params, pricing) {
  const { guests, nights, includeParking, adults, children, childrenAges } = params;
  
  // Calcolo prezzo per notte con sistema base + aggiuntive
  const priceCalculation = calculateGroupPrice(guests, pricing);
  const pricePerNight = priceCalculation.totalPerNight;
  let baseCost = nights * pricePerNight;
  
  // Applica sconti per durata soggiorno
  let appliedDiscount = 0;
  let discountType = '';
  let discountAmount = 0;
  
  if (nights >= 30 && pricing.monthlyDiscount > 0) {
    appliedDiscount = pricing.monthlyDiscount;
    discountType = 'Sconto Mensile (30+ notti)';
  } else if (nights >= 7 && pricing.weeklyDiscount > 0) {
    appliedDiscount = pricing.weeklyDiscount;
    discountType = 'Sconto Settimanale (7+ notti)';
  }
  
  if (appliedDiscount > 0) {
    discountAmount = baseCost * (appliedDiscount / 100);
    baseCost = baseCost - discountAmount;
  }
  
  // Costi aggiuntivi
  const cleaningCost = pricing.cleaningFee;
  const parkingCost = includeParking ? nights * pricing.parkingFeePerNight : 0;
  
  // Tassa di soggiorno (solo adulti e bambini ≥12 anni)
  let guestsSubjectToTax = adults || guests;
  if (childrenAges && childrenAges.length > 0) {
    const childrenOver12 = childrenAges.filter(age => age >= 12).length;
    guestsSubjectToTax = (adults || guests - children) + childrenOver12;
  }
  
  const touristTax = guestsSubjectToTax * Math.min(nights, 7) * pricing.touristTaxPerPersonPerNight;
  
  const totalAmount = baseCost + cleaningCost + parkingCost + touristTax;
  const depositAmount = totalAmount * 0.30; // 30% di acconto
  
  return {
    pricePerNight,
    basePrice: priceCalculation.basePrice,
    additionalCost: priceCalculation.additionalCost,
    priceBreakdown: priceCalculation.breakdown,
    baseCost,
    discountAmount,
    discountType,
    cleaningCost,
    parkingCost,
    touristTax,
    totalAmount,
    depositAmount,
    breakdown: {
      accommodationCost: baseCost,
      cleaningFee: cleaningCost,
      parkingFee: parkingCost,
      touristTax: touristTax,
      discount: discountAmount > 0 ? `-€${discountAmount.toFixed(2)} (${discountType})` : null
    }
  };
}

export default async function handler(req, res) {
  console.log('🔥 API Quote Groups chiamata:', req.method, req.url);

  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Supporta sia GET che POST
    let checkIn, checkOut, guests, includeParking, adults, children, childrenAges;
    
    if (req.method === 'GET') {
      ({ checkIn, checkOut, guests, includeParking, adults, children, childrenAges } = req.query);
    } else if (req.method === 'POST') {
      ({ checkIn, checkOut, guests, includeParking, adults, children, childrenAges } = req.body);
    } else {
      return res.status(405).json({ success: false, error: 'Metodo non consentito' });
    }

    // Parsing parametri
    guests = parseInt(guests) || 0;
    adults = parseInt(adults) || guests;
    children = parseInt(children) || 0;
    childrenAges = Array.isArray(childrenAges) ? childrenAges.map(age => parseInt(age)) : [];
    includeParking = includeParking === 'true' || includeParking === true;
    
    console.log('🎯 PARAMETRI GRUPPI:', { 
      checkIn, checkOut, guests, adults, children, childrenAges, includeParking 
    });

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
    
    console.log('🛏️ CALCOLO NOTTI:', { checkIn, checkOut, nights });

    // 🔥 CARICA CONFIGURAZIONE PREZZI BASE + AGGIUNTIVE DAL DATABASE
    let pricing = {
      basePrice: 75, // Prezzo base per persona (2 persone = 150)
      additionalGuest3to4: 30,
      additionalGuest5to6: 25,
      additionalGuest7to8: 20,
      cleaningFee: 50,
      parkingFeePerNight: 20,
      touristTaxPerPersonPerNight: 2.00,
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
        
        // Aggiorna pricing con valori dal database (supporta sia nuovo che vecchio formato)
        pricing = {
          basePrice: parseFloat(settings.base_price) || parseFloat(settings.price_group_1to2) || pricing.basePrice,
          additionalGuest3to4: parseFloat(settings.additional_guest_3to4) || parseFloat(settings.price_group_3to4) || pricing.additionalGuest3to4,
          additionalGuest5to6: parseFloat(settings.additional_guest_5to6) || parseFloat(settings.price_group_5to6) || pricing.additionalGuest5to6,
          additionalGuest7to8: parseFloat(settings.additional_guest_7to8) || parseFloat(settings.price_group_7to8) || pricing.additionalGuest7to8,
          cleaningFee: parseFloat(settings.cleaning_fee) || pricing.cleaningFee,
          parkingFeePerNight: parseFloat(settings.parking_fee) || pricing.parkingFeePerNight,
          touristTaxPerPersonPerNight: parseFloat(settings.tourist_tax_adult) || pricing.touristTaxPerPersonPerNight,
          weeklyDiscount: parseFloat(settings.weekly_discount) || pricing.weeklyDiscount,
          monthlyDiscount: parseFloat(settings.monthly_discount) || pricing.monthlyDiscount
        };
        
        console.log('✅ Configurazione prezzi base + aggiuntive caricata dal database');
      }
    } catch (dbError) {
      console.error('❌ Errore caricamento pricing gruppi:', dbError.message);
      console.log('🔄 Usando configurazione prezzi gruppi predefinita');
    }

    // Calcola il totale del soggiorno
    const calculation = calculateStayTotal({
      guests,
      nights,
      includeParking,
      adults,
      children,
      childrenAges
    }, pricing);
    
    console.log(`🔥 CALCOLO COMPLETATO: ${guests} ospiti × ${nights} notti = €${calculation.totalAmount.toFixed(2)}`);

    // Controlla disponibilità (placeholder - da implementare con calendario reale)
    const isAvailable = true; // Temporaneo

    const response = {
      success: true,
      quote: {
        // Dettagli prenotazione
        checkIn,
        checkOut,
        nights,
        guests,
        adults: adults || guests,
        children: children || 0,
        
        // Sistema base + aggiuntive
        priceGroup: guests <= 2 ? '1-2' : guests <= 4 ? '3-4' : guests <= 6 ? '5-6' : '7-8',
        pricePerNight: calculation.pricePerNight,
        basePrice: calculation.basePrice,
        additionalCost: calculation.additionalCost,
        priceBreakdown: calculation.priceBreakdown,
        
        // Costi
        accommodationCost: calculation.baseCost,
        cleaningFee: calculation.cleaningCost,
        parkingFee: calculation.parkingCost,
        touristTax: calculation.touristTax,
        discountAmount: calculation.discountAmount,
        discountType: calculation.discountType || null,
        
        // Totali
        totalAmount: calculation.totalAmount,
        depositAmount: calculation.depositAmount,
        remainingAmount: calculation.totalAmount - calculation.depositAmount,
        
        // Disponibilità
        available: isAvailable,
        
        // Metadata
        currency: 'EUR',
        system: 'groups',
        version: '2.0'
      },
      pricing: {
        groupPricing: pricing,
        breakdown: calculation.breakdown
      }
    };

    console.log('✅ Quote gruppi generata con successo');
    return res.status(200).json(response);

  } catch (error) {
    console.error('❌ Errore API Quote Groups:', error);
    return res.status(500).json({
      success: false,
      error: 'Errore interno del server',
      message: error.message
    });
  }
}