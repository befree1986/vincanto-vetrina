// API Quote Semplificata - Compatibile con frontend esistente
import { Pool } from '@vercel/postgres';

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
    let basePrice = 80.00;           // €80 per notte per adulto
    let additionalGuestPrice = 20.00; // €20 per ospite aggiuntivo per notte  
    let cleaningFee = 50.00;         // €50 pulizia finale
    let parkingFeePerNight = 10.00;  // €10 parcheggio per notte
    let touristTaxPerPersonPerNight = 2.00; // €2 tassa soggiorno per persona per notte

    try {
      const pool = new Pool({
        connectionString: process.env.POSTGRES_URL
      });
      client = await pool.connect();
      
      console.log('🔄 Caricamento prezzi dal database admin per quote...');
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
        
        // Aggiorna prezzi con valori dal database admin
        basePrice = parseFloat(settings.base_price) || basePrice;
        cleaningFee = parseFloat(settings.cleaning_fee) || cleaningFee;
        // additionalGuestPrice e altri parametri possono essere aggiunti al pannello admin in futuro
        
        console.log('✅ Prezzi aggiornati dal database admin:', { basePrice, cleaningFee });
      } else {
        console.log('⚠️ Nessuna configurazione prezzi nel database, uso valori predefiniti');
      }
    } catch (dbError) {
      console.error('❌ Errore caricamento prezzi dal database:', dbError);
      console.log('🔄 Usando prezzi predefiniti');
    }
    const depositPercentage = 0.30;    // 30% acconto

    // Calcolo totale
    const baseCost = nights * basePrice; // Prezzo base per primo adulto
    const additionalGuestsCost = Math.max(0, guests - 1) * nights * additionalGuestPrice;
    const parkingCost = includeParking ? nights * parkingFeePerNight : 0;
    const touristTax = guests * nights * touristTaxPerPersonPerNight;
    
    const subtotal = baseCost + additionalGuestsCost + cleaningFee + parkingCost;
    const totalAmount = subtotal + touristTax;
    const depositAmount = Math.round(totalAmount * depositPercentage * 100) / 100;

    const costs = {
      nights,
      guests,
      basePrice: baseCost + additionalGuestsCost,
      parkingCost,
      cleaningFee,
      touristTax,
      subtotal,
      totalAmount,
      depositAmount,
      depositPercentage,
      currency: 'EUR',
      breakdown: {
        pricePerNight: basePrice,
        additionalGuestPricePerNight: additionalGuestPrice,
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