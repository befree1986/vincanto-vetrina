// API Quote Semplificata - Compatibile con frontend esistente
import { Pool } from 'pg';

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  let client;
  
  try {
    // Supporta sia GET che POST
    let checkIn, checkOut, guests, includeParking;
    
    if (req.method === 'GET') {
      ({ checkIn, checkOut, guests, includeParking } = req.query);
    } else if (req.method === 'POST') {
      ({ checkIn, checkOut, guests, includeParking } = req.body);
    } else {
      return res.status(405).json({ success: false, error: 'Metodo non consentito' });
    }

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
    today.setHours(0, 0, 0, 0); // Reset ora a mezzanotte per confronto corretto
    
    console.log('🗓️ DATE VALIDATION:', {
      checkIn,
      checkOut,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      today: today.toISOString(),
      startDateTimestamp: startDate.getTime(),
      todayTimestamp: today.getTime(),
      isStartDateValid: startDate >= today
    });
    
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
    
    console.log('🛏️ NIGHTS CALCULATION:', {
      checkIn,
      checkOut, 
      diffTime,
      nights,
      isValid: nights >= 1
    });

    // 🔥 CARICA PREZZI DAL DATABASE ADMIN IN TEMPO REALE
    let basePrice = 75.00;           // €75 per persona per notte (aggiornato)
    let additionalGuestPrice = 75.00; // €75 per ospite aggiuntivo per notte (stesso prezzo per persona)
    let cleaningFee = 50.00;         // €50 pulizia finale
    let parkingFeePerNight = 20.00;  // €20 parcheggio per notte (aggiornato)
    let touristTaxPerPersonPerNight = 2.00; // €2 tassa soggiorno per persona per notte

    console.log('🎯 PARAMETRI RICEVUTI:', { checkIn, checkOut, guests: parseInt(guests), nights });
    console.log('💰 PREZZI INIZIALI HARDCODED:', { basePrice, cleaningFee, parkingFeePerNight });

    // 🎯 CARICA TUTTE LE CONFIGURAZIONI PRICING IN UNA SOLA QUERY
    let weeklyDiscount = 0;
    let monthlyDiscount = 0;
    const depositPercentage = 0.30;

    try {
      // 🔥 QUERY OTTIMIZZATA: Una sola chiamata per tutti i dati pricing
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
        
        // Aggiorna prezzi base
        basePrice = parseFloat(settings.basePrice || settings.base_price) || basePrice;
        cleaningFee = parseFloat(settings.cleaningFee || settings.cleaning_fee) || cleaningFee;
        parkingFeePerNight = parseFloat(settings.parkingFee || settings.parking_fee) || parkingFeePerNight;
        additionalGuestPrice = parseFloat(settings.additionalGuestPrice || settings.additional_guest_price) || additionalGuestPrice;
        touristTaxPerPersonPerNight = parseFloat(
          settings.touristTaxAdult || settings.touristTax || settings.tourist_tax
        ) || touristTaxPerPersonPerNight;
        
        // Carica sconti dalla stessa query
        weeklyDiscount = parseFloat(settings.weeklyDiscount || settings.weekly_discount) || 0;
        monthlyDiscount = parseFloat(settings.monthlyDiscount || settings.monthly_discount) || 0;
        
        console.log('� Configurazione pricing caricata:', { basePrice, weeklyDiscount, monthlyDiscount });
      }
    } catch (dbError) {
      console.error('❌ Errore database pricing:', dbError.message);
    }

    // Calcolo totale - €75 PER PERSONA PER NOTTE
    let baseCost = nights * parseInt(guests) * basePrice; // €75 per OGNI persona per notte
    
    // 🎯 APPLICA SCONTI PER DURATA SOGGIORNO
    let appliedDiscount = 0;
    let discountType = '';
    
    if (nights >= 30 && monthlyDiscount > 0) {
      // Sconto mensile per 30+ notti
      appliedDiscount = monthlyDiscount;
      discountType = 'Sconto Mensile (30+ notti)';
    } else if (nights >= 7 && weeklyDiscount > 0) {
      // Sconto settimanale per 7+ notti
      appliedDiscount = weeklyDiscount;
      discountType = 'Sconto Settimanale (7+ notti)';
    }

    // Applica lo sconto al costo base
    let discountAmount = 0;
    if (appliedDiscount > 0) {
      discountAmount = baseCost * (appliedDiscount / 100);
      baseCost = baseCost - discountAmount;
      console.log(`💰 SCONTO APPLICATO: ${discountType} ${appliedDiscount}% = -€${discountAmount.toFixed(2)}`);
    }

    const additionalGuestsCost = 0; // Non serve più calcolo separato, tutto incluso in baseCost
    const parkingCost = includeParking ? nights * parkingFeePerNight : 0;
    const touristTax = parseInt(guests) * nights * touristTaxPerPersonPerNight;
    
    const subtotal = baseCost + cleaningFee + parkingCost;
    const totalAmount = subtotal + touristTax;
    const depositAmount = Math.round(totalAmount * depositPercentage * 100) / 100;

    console.log('🧮 CALCOLO DETTAGLIATO:', {
      formula: `${nights} notti × ${guests} persone × €${basePrice} = €${baseCost}`,
      nights,
      guests: parseInt(guests),
      basePrice,
      originalBaseCost: nights * parseInt(guests) * basePrice,
      appliedDiscount,
      discountType,
      discountAmount,
      baseCost,
      cleaningFee,
      parkingCost,
      touristTax,
      subtotal,
      totalAmount
    });

    // 🎯 RISPOSTA COMPATIBILE CON FRONTEND DINAMICO
    const responseData = {
      success: true,
      nights,
      guests,
      baseCost, 
      parkingCost,
      cleaningFee,
      touristTax,
      subtotal,
      totalAmount,
      depositAmount,
      depositPercentage,
      currency: 'EUR',
      // 🎯 AGGIUNTO: Informazioni sugli sconti applicati
      discount: appliedDiscount > 0 ? {
        type: discountType,
        percentage: appliedDiscount,
        amount: discountAmount,
        originalBaseCost: nights * parseInt(guests) * basePrice
      } : null,
      // ⭐ Aggiunta configurazione prezzi per frontend dinamico
      pricingConfig: {
        basePrice: basePrice, // Prezzo per persona per notte dal database
        parkingFee: parkingFeePerNight, // Prezzo parcheggio per notte dal database
        cleaningFee: cleaningFee, // Pulizie dal database
        additionalGuestPrice: additionalGuestPrice, // Prezzo ospiti aggiuntivi
        touristTax: touristTaxPerPersonPerNight, // Tassa soggiorno dal database
        minStay: 1, // Minimo soggiorno
        maxStay: 14 // Massimo soggiorno
      },
      // Manteniamo anche la struttura originale per compatibilità
      parkingPerNight: parkingFeePerNight,
      touristTaxPerPersonPerNight: touristTaxPerPersonPerNight,
      breakdown: {
        pricePerPersonPerNight: basePrice, // €75 per persona per notte
        totalPersonsNights: guests * nights, // Totale persone-notte
        parkingPerNight: parkingFeePerNight,
        touristTaxPerPersonPerNight: touristTaxPerPersonPerNight,
        cleaningFeeTotal: cleaningFee
      }
    };

    console.log('📤 RISPOSTA FINALE API QUOTE:', responseData);
    return res.status(200).json(responseData);

  } catch (error) {
    console.error('Errore calcolo quote:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Errore interno del server' 
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