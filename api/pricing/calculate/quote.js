// API endpoint per calcolo preventivi Vincanto
import { Pool } from 'pg';

export default async function handler(req, res) {
  console.log('💰 API Quote chiamata:', req.method, req.query);

  // Headers CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  let client;
  
  try {
    if (req.method === 'GET') {
      const { checkIn, checkOut, guests = 2 } = req.query;

      if (!checkIn || !checkOut) {
        return res.status(400).json({
          success: false,
          message: 'Date di check-in e check-out sono richieste'
        });
      }

      // Calcola i giorni di soggiorno
      const startDate = new Date(checkIn);
      const endDate = new Date(checkOut);
      const nights = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));

      if (nights <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Le date non sono valide'
        });
      }

      // 🔥 CARICA CONFIGURAZIONE PREZZI DAL DATABASE ADMIN IN TEMPO REALE
      let config = {
        basePrice: 85,
        cleaningFee: 40,
        weekendSurcharge: 20,
        weeklyDiscount: 15,
        monthlyDiscount: 25,
        additionalGuestPrice: 25,
        maxGuests: 8,
        taxRate: 3 // €3 per persona per notte
      };

      try {
        const pool = new Pool({
          connectionString: process.env.DATABASE_URL,
          ssl: {
            rejectUnauthorized: false
          }
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
          
          console.log('🔍 Settings dal database:', settings);
          
          // Aggiorna config con valori dal database
          config = {
            basePrice: parseFloat(settings.base_price) || config.basePrice,
            cleaningFee: parseFloat(settings.cleaning_fee) || config.cleaningFee,
            weekendSurcharge: parseFloat(settings.weekend_surcharge) || config.weekendSurcharge,
            weeklyDiscount: parseFloat(settings.weekly_discount) || config.weeklyDiscount,
            monthlyDiscount: parseFloat(settings.monthly_discount) || config.monthlyDiscount,
            additionalGuestPrice: 25, // TODO: Aggiungere al pannello admin
            maxGuests: 8,
            taxRate: 3
          };
          
          console.log('✅ Configurazione prezzi aggiornata dal database admin:', config);
        } else {
          console.log('⚠️ Nessuna configurazione prezzi nel database, uso valori predefiniti:', config);
        }
      } catch (dbError) {
        console.error('❌ Errore caricamento prezzi dal database:', dbError);
        console.log('🔄 Usando configurazione prezzi predefinita');
      }

      // 🔥 NUOVO CALCOLO: PREZZO PER PERSONA (€75 a persona per notte)
      // Minimo 2 persone come da configurazione admin
      const effectiveGuests = Math.max(2, parseInt(guests));
      const basePrice = config.basePrice * effectiveGuests * nights;
      let totalPrice = basePrice;

      // Non servono più ospiti aggiuntivi - tutto incluso nel prezzo per persona
      const additionalGuestsCost = 0;

      // Supplemento weekend (venerdì e sabato)
      let weekendNights = 0;
      for (let d = new Date(startDate); d < endDate; d.setDate(d.getDate() + 1)) {
        const dayOfWeek = d.getDay();
        if (dayOfWeek === 5 || dayOfWeek === 6) { // Venerdì o Sabato
          weekendNights++;
        }
      }
      const weekendSurcharge = (basePrice * config.weekendSurcharge / 100) * (weekendNights / nights);
      totalPrice += weekendSurcharge;

      // Sconti per durata
      let discount = 0;
      if (nights >= 30) {
        discount = totalPrice * (config.monthlyDiscount / 100);
      } else if (nights >= 7) {
        discount = totalPrice * (config.weeklyDiscount / 100);
      }
      totalPrice -= discount;

      // Pulizia finale
      totalPrice += config.cleaningFee;

      // Tassa di soggiorno
      const touristTax = config.taxRate * parseInt(guests) * nights;
      totalPrice += touristTax;

      const breakdown = {
        basePrice: basePrice, // €75 x persone x notti
        additionalGuests: additionalGuestsCost, // Sempre 0 con nuovo sistema
        weekendSurcharge: weekendSurcharge,
        discount: -discount,
        cleaningFee: config.cleaningFee,
        touristTax: touristTax,
        total: Math.round(totalPrice * 100) / 100
      };

      const quote = {
        checkIn,
        checkOut,
        nights,
        guests: parseInt(guests),
        weekendNights,
        breakdown,
        totalPrice: breakdown.total,
        currency: 'EUR',
        validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        calculatedAt: new Date().toISOString()
      };

      console.log('✅ Preventivo calcolato:', quote);
      
      return res.status(200).json({
        success: true,
        data: quote,
        message: 'Preventivo calcolato con successo'
      });
    }

    return res.status(405).json({
      success: false,
      message: 'Metodo non supportato'
    });

  } catch (error) {
    console.error('❌ Errore calcolo preventivo:', error);
    return res.status(500).json({
      success: false,
      message: 'Errore nel calcolo del preventivo',
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