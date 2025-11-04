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
    
    if (startDate <= today) {
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

    if (nights < 2) {
      return res.status(400).json({ 
        success: false, 
        error: 'Minimo 2 notti richieste' 
      });
    }

    // 🔥 CARICA PREZZI DAL DATABASE ADMIN IN TEMPO REALE
    let basePrice = 75.00;           // €75 per persona per notte (aggiornato)
    let additionalGuestPrice = 75.00; // €75 per ospite aggiuntivo per notte (stesso prezzo per persona)
    let cleaningFee = 50.00;         // €50 pulizia finale
    let parkingFeePerNight = 15.00;  // €15 parcheggio per notte (aggiornato)
    let touristTaxPerPersonPerNight = 2.00; // €2 tassa soggiorno per persona per notte

    console.log('🎯 PARAMETRI RICEVUTI:', { checkIn, checkOut, guests: parseInt(guests), nights });
    console.log('💰 PREZZI INIZIALI HARDCODED:', { basePrice, cleaningFee, parkingFeePerNight });

    try {
      // Usa la connessione pool già configurata
      
      console.log('🔄 Caricamento prezzi dal database admin per quote...');
      const result = await pool.query(`
        SELECT setting_key, setting_value
        FROM admin_settings 
        WHERE category = 'pricing'
      `);
      
      console.log('📊 RISULTATO DATABASE ROWS:', result.rows.length, result.rows);
      
      if (result.rows.length > 0) {
        const settings = {};
        result.rows.forEach(row => {
          settings[row.setting_key] = row.setting_value;
        });
        
        console.log('⚙️ SETTINGS ESTRATTE DAL DB:', settings);
        
        // 🔥 Aggiorna TUTTI i prezzi con valori dal database admin
        const oldBasePrice = basePrice;
        basePrice = parseFloat(settings.base_price) || basePrice;
        cleaningFee = parseFloat(settings.cleaning_fee) || cleaningFee;
        parkingFeePerNight = parseFloat(settings.parking_fee) || parkingFeePerNight; // 🅿️ CORREZIONE PARCHEGGIO!
        
        console.log('✅ Prezzi AGGIORNATI:', { 
          oldBasePrice, 
          newBasePrice: basePrice, 
          cleaningFee, 
          parkingFeePerNight,
          settings_base_price: settings.base_price
        });
      } else {
        console.log('⚠️ Nessuna configurazione prezzi nel database, uso valori predefiniti');
      }
    } catch (dbError) {
      console.error('❌ Errore caricamento prezzi dal database:', dbError);
      console.log('🔄 Usando prezzi predefiniti');
    }
    const depositPercentage = 0.30;    // 30% acconto

    // Calcolo totale - €75 PER PERSONA PER NOTTE
    const baseCost = nights * parseInt(guests) * basePrice; // €75 per OGNI persona per notte
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
      baseCost,
      cleaningFee,
      parkingCost,
      touristTax,
      subtotal,
      totalAmount
    });

    const costs = {
      nights,
      guests,
      basePrice: baseCost, // Solo baseCost perché additionalGuestsCost è 0
      parkingCost,
      cleaningFee,
      touristTax,
      subtotal,
      totalAmount,
      depositAmount,
      depositPercentage,
      currency: 'EUR',
      breakdown: {
        pricePerPersonPerNight: basePrice, // €75 per persona per notte
        totalPersonsNights: guests * nights, // Totale persone-notte
        parkingPerNight: parkingFeePerNight,
        touristTaxPerPersonPerNight: touristTaxPerPersonPerNight,
        cleaningFeeTotal: cleaningFee
      }
    };

    return res.status(200).json({ success: true, costs });

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