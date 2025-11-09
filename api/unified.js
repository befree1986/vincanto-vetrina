// API UNIFICATA VINCANTO - Consolidamento di tutte le API
import { Pool } from 'pg';

// ========================
// DATABASE CONNECTION (Unificata)
// ========================
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// ========================
// UTILITY FUNCTIONS (Unificata)
// ========================

/**
 * Funzione unificata per calcolare il prezzo con sistema BASE + AGGIUNTIVE
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
 * Carica configurazione prezzi dal database
 */
async function loadPricingConfig() {
  const result = await pool.query(`
    SELECT setting_key, setting_value 
    FROM admin_settings 
    WHERE category = 'pricing' 
    ORDER BY setting_key
  `);
  
  const config = {};
  result.rows.forEach(row => {
    const value = parseFloat(row.setting_value);
    config[row.setting_key] = isNaN(value) ? row.setting_value : value;
  });
  
  return config;
}

/**
 * Carica configurazione calendari dal database
 */
async function loadCalendarConfig() {
  const result = await pool.query(`
    SELECT setting_key, setting_value 
    FROM admin_settings 
    WHERE category = 'calendar' 
    ORDER BY setting_key
  `);
  
  const config = {};
  result.rows.forEach(row => {
    config[row.setting_key] = row.setting_value;
  });
  
  return config;
}

// ========================
// CALENDAR SYNC FUNCTIONS (Da utilities.js)
// ========================

// Funzioni di sincronizzazione calendario spostate da utilities.js
async function syncGoogleCalendar(config) {
  // Simula chiamata API Google Calendar
  console.log('📅 Google Calendar sync simulation...');
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  return [
    { date: '2024-12-25', isBlocking: true, source: 'google', title: 'Natale' },
    { date: '2024-12-26', isBlocking: true, source: 'google', title: 'Santo Stefano' },
    { date: '2024-12-31', isBlocking: true, source: 'google', title: 'Capodanno' }
  ];
}

async function syncBookingCom(config) {
  console.log('🏨 Booking.com sync simulation...');
  await new Promise(resolve => setTimeout(resolve, 800));
  
  return [
    { date: '2024-12-20', isBlocking: true, source: 'booking', title: 'Prenotazione Booking' },
    { date: '2024-12-21', isBlocking: true, source: 'booking', title: 'Prenotazione Booking' }
  ];
}

async function syncAirbnb(config) {
  console.log('🏠 Airbnb sync simulation...');
  await new Promise(resolve => setTimeout(resolve, 600));
  
  // Check if Airbnb is suspended
  if (config.airbnb_status === 'suspended') {
    console.log('⚠️ Airbnb sospeso, ma configurazione mantenuta per auto-riattivazione');
    return { 
      status: 'suspended', 
      message: 'Airbnb configurato per auto-riattivazione quando torna online',
      configPreserved: true 
    };
  }
  
  return [
    { date: '2024-12-28', isBlocking: true, source: 'airbnb', title: 'Prenotazione Airbnb' },
    { date: '2024-12-29', isBlocking: true, source: 'airbnb', title: 'Prenotazione Airbnb' }
  ];
}

async function syncHolidu(config) {
  console.log('🏖️ Holidu sync simulation...');
  await new Promise(resolve => setTimeout(resolve, 900));
  
  return [
    { date: '2024-12-15', isBlocking: true, source: 'holidu', title: 'Prenotazione Holidu' },
    { date: '2024-12-16', isBlocking: true, source: 'holidu', title: 'Prenotazione Holidu' }
  ];
}

// ========================
// MAIN HANDLER (Unificato)
// ========================
export default async function handler(req, res) {
  // CORS Headers unificati
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Ottieni action da query params o body
  let { action } = req.query;
  if (req.method === 'POST' && req.body && req.body.action) {
    action = req.body.action;
  }
  
  try {
    // ========================
    // ADMIN ACTIONS
    // ========================
    if (action === 'login') {
      if (req.method !== 'POST') {
        return res.status(405).json({ success: false, error: 'Metodo non consentito' });
      }

      const { password } = req.body;
      const correctPassword = 'vincanto2025';

      if (password === correctPassword) {
        return res.status(200).json({
          success: true,
          message: 'Login effettuato con successo',
          token: 'admin-token-vincanto'
        });
      } else {
        return res.status(401).json({
          success: false,
          error: 'Password non corretta'
        });
      }
    }

    if (action === 'settings') {
      if (req.method === 'GET') {
        const result = await pool.query('SELECT * FROM admin_settings ORDER BY category, setting_key');
        
        const settings = {};
        result.rows.forEach(row => {
          if (!settings[row.category]) {
            settings[row.category] = {};
          }
          settings[row.category][row.setting_key] = row.setting_value;
        });

        return res.status(200).json({
          success: true,
          settings: settings
        });
      }
      
      if (req.method === 'POST') {
        const { category, settings: newSettings } = req.body;
        
        if (!category || !newSettings) {
          return res.status(400).json({
            success: false,
            error: 'Categoria e impostazioni richieste'
          });
        }

        for (const [key, value] of Object.entries(newSettings)) {
          await pool.query(`
            DELETE FROM admin_settings 
            WHERE category = $1 AND setting_key = $2
          `, [category, key]);
          
          await pool.query(`
            INSERT INTO admin_settings (category, setting_key, setting_value, setting_type, updated_at)
            VALUES ($1, $2, $3, 'string', NOW())
          `, [category, key, value]);
        }

        return res.status(200).json({
          success: true,
          message: `Impostazioni ${category} salvate con successo`
        });
      }

      return res.status(405).json({ success: false, error: 'Metodo non consentito' });
    }

    // ========================
    // PRICING ACTIONS (Unificata da pricing.js e quote.js)
    // ========================
    if (action === 'pricing' || action === 'quote' || action === 'calculate') {
      if (req.method === 'GET') {
        const { guests, nights, checkin, checkout } = req.query;
        
        const guestsNum = parseInt(guests) || 2;
        const nightsNum = parseInt(nights) || 1;
        
        // Carica configurazione prezzi
        const config = await loadPricingConfig();
        
        // Calcola prezzo
        const groupPrice = calculateGroupPrice(guestsNum, config);
        const accommodationTotal = groupPrice.totalPerNight * nightsNum;
        
        // Aggiungi tariffe extra
        const cleaningFee = parseFloat(config.cleaning_fee || config.cleaningFee || 50);
        const parkingFee = parseFloat(config.parking_fee || config.parkingFee || 0);
        const touristTax = parseFloat(config.tourist_tax_adult || config.touristTaxAdult || 2) * guestsNum * nightsNum;
        
        const totalExtras = cleaningFee + parkingFee + touristTax;
        const grandTotal = accommodationTotal + totalExtras;
        
        const response = {
          success: true,
          pricing: {
            guests: guestsNum,
            nights: nightsNum,
            basePrice: groupPrice.basePrice,
            additionalCost: groupPrice.additionalCost,
            accommodationPerNight: groupPrice.totalPerNight,
            accommodationTotal: accommodationTotal,
            cleaningFee: cleaningFee,
            parkingFee: parkingFee,
            touristTax: touristTax,
            totalExtras: totalExtras,
            grandTotal: grandTotal,
            breakdown: groupPrice.breakdown,
            config: config
          }
        };
        
        return res.status(200).json(response);
      }
      
      if (req.method === 'POST') {
        // Update pricing configuration
        const { basePrice, additionalGuest3to4, additionalGuest5to6, additionalGuest7to8, cleaningFee, parkingFee, touristTaxAdult } = req.body;
        
        const pricingUpdates = {
          base_price: basePrice,
          additional_guest_3to4: additionalGuest3to4,
          additional_guest_5to6: additionalGuest5to6,
          additional_guest_7to8: additionalGuest7to8,
          cleaning_fee: cleaningFee,
          parking_fee: parkingFee,
          tourist_tax_adult: touristTaxAdult
        };

        for (const [key, value] of Object.entries(pricingUpdates)) {
          if (value !== undefined) {
            await pool.query(`
              DELETE FROM admin_settings 
              WHERE category = 'pricing' AND setting_key = $1
            `, [key]);
            
            await pool.query(`
              INSERT INTO admin_settings (category, setting_key, setting_value, setting_type, updated_at)
              VALUES ('pricing', $1, $2, 'string', NOW())
            `, [key, value]);
          }
        }

        return res.status(200).json({
          success: true,
          message: 'Prezzi aggiornati con successo'
        });
      }
    }

    // ========================
    // BOOKING ACTIONS
    // ========================
    if (action === 'booking' || action === 'bookings') {
      if (req.method === 'GET') {
        // Ottieni tutte le prenotazioni
        const result = await pool.query(`
          SELECT * FROM bookings 
          ORDER BY created_at DESC
        `);
        
        return res.status(200).json({
          success: true,
          bookings: result.rows
        });
      }
      
      if (req.method === 'POST') {
        // Crea nuova prenotazione
        const { 
          checkin, checkout, guests, totalPrice, 
          customerName, customerEmail, customerPhone, 
          specialRequests, paymentMethod 
        } = req.body;
        
        const result = await pool.query(`
          INSERT INTO bookings (
            checkin, checkout, guests, total_price,
            customer_name, customer_email, customer_phone,
            special_requests, payment_method, status, created_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'pending', NOW())
          RETURNING *
        `, [
          checkin, checkout, guests, totalPrice,
          customerName, customerEmail, customerPhone,
          specialRequests, paymentMethod
        ]);
        
        return res.status(201).json({
          success: true,
          booking: result.rows[0],
          message: 'Prenotazione creata con successo'
        });
      }
      
      if (req.method === 'DELETE') {
        const { id: deleteId } = req.query;
        if (!deleteId) {
          return res.status(400).json({ success: false, error: 'ID prenotazione richiesto' });
        }

        const deleteResult = await pool.query('DELETE FROM bookings WHERE id = $1 RETURNING *', [deleteId]);
        
        if (deleteResult.rows.length === 0) {
          return res.status(404).json({ success: false, error: 'Prenotazione non trovata' });
        }

        return res.status(200).json({
          success: true,
          message: 'Prenotazione eliminata con successo',
          booking: deleteResult.rows[0]
        });
      }
    }

    // ========================
    // CALENDAR ACTIONS
    // ========================
    if (action === 'sync-calendars') {
      if (req.method !== 'POST') {
        return res.status(405).json({ success: false, error: 'Metodo non consentito' });
      }

      console.log('🔄 Avvio sincronizzazione calendari...');
      
      const config = await loadCalendarConfig();
      const calendarSources = [];
      const blockedDatesFound = [];
      
      // Sincronizzazione di tutti i calendari
      try {
        const googleEvents = await syncGoogleCalendar(config);
        calendarSources.push({
          name: 'Google Calendar',
          status: 'active',
          lastSync: new Date().toISOString(),
          eventsFound: googleEvents.length,
          blockedDates: googleEvents.filter(e => e.isBlocking).length
        });
        blockedDatesFound.push(...googleEvents.filter(e => e.isBlocking));
      } catch (error) {
        calendarSources.push({
          name: 'Google Calendar',
          status: 'error',
          lastSync: null,
          error: error.message
        });
      }
      
      try {
        const bookingEvents = await syncBookingCom(config);
        calendarSources.push({
          name: 'Booking.com',
          status: 'active',
          lastSync: new Date().toISOString(),
          eventsFound: bookingEvents.length,
          blockedDates: bookingEvents.length
        });
        blockedDatesFound.push(...bookingEvents);
      } catch (error) {
        calendarSources.push({
          name: 'Booking.com',
          status: 'error',
          lastSync: null,
          error: error.message
        });
      }
      
      try {
        const airbnbEvents = await syncAirbnb(config);
        if (airbnbEvents.status === 'suspended') {
          calendarSources.push({
            name: 'Airbnb',
            status: 'suspended',
            lastSync: new Date().toISOString(),
            message: airbnbEvents.message,
            configPreserved: airbnbEvents.configPreserved
          });
        } else {
          calendarSources.push({
            name: 'Airbnb',
            status: 'active',
            lastSync: new Date().toISOString(),
            eventsFound: airbnbEvents.length,
            blockedDates: airbnbEvents.length
          });
          blockedDatesFound.push(...airbnbEvents);
        }
      } catch (error) {
        calendarSources.push({
          name: 'Airbnb',
          status: 'error',
          lastSync: null,
          error: error.message
        });
      }
      
      try {
        const holiduEvents = await syncHolidu(config);
        calendarSources.push({
          name: 'Holidu',
          status: 'active',
          lastSync: new Date().toISOString(),
          eventsFound: holiduEvents.length,
          blockedDates: holiduEvents.length
        });
        blockedDatesFound.push(...holiduEvents);
      } catch (error) {
        calendarSources.push({
          name: 'Holidu',
          status: 'error',
          lastSync: null,
          error: error.message
        });
      }
      
      // Aggiorna database con le date bloccate
      for (const event of blockedDatesFound) {
        await pool.query(`
          INSERT INTO blocked_dates (date, source, updated_at)
          VALUES ($1, $2, NOW())
          ON CONFLICT (date, source) DO UPDATE SET updated_at = NOW()
        `, [event.date, event.source]);
      }
      
      return res.status(200).json({
        success: true,
        message: 'Sincronizzazione calendari completata',
        calendarSources: calendarSources,
        totalBlockedDates: blockedDatesFound.length,
        syncTime: new Date().toISOString()
      });
    }

    if (action === 'blocked-dates') {
      if (req.method === 'GET') {
        const result = await pool.query(`
          SELECT date, source, updated_at 
          FROM blocked_dates 
          ORDER BY date DESC
        `);
        
        return res.status(200).json({
          success: true,
          blockedDates: result.rows
        });
      }
    }

    // ========================
    // CALENDAR CONFIGS ACTIONS
    // ========================
    if (action === 'calendar-configs') {
      if (req.method !== 'GET') {
        return res.status(405).json({ success: false, error: 'Metodo non consentito' });
      }

      try {
        const config = await loadCalendarConfig();
        const calendars = [
          {
            id: 'google',
            name: 'Google Calendar',
            type: 'google',
            status: config.googleCalendarId ? 'active' : 'inactive',
            lastSync: new Date().toISOString()
          },
          {
            id: 'booking',
            name: 'Booking.com',
            type: 'booking',
            status: config.bookingCalendarUrl ? 'active' : 'inactive',
            lastSync: new Date().toISOString()
          },
          {
            id: 'airbnb',
            name: 'Airbnb',
            type: 'airbnb',
            status: config.airbnbCalendarUrl ? 'active' : 'inactive',
            lastSync: new Date().toISOString()
          }
        ];

        return res.status(200).json({
          success: true,
          calendars: calendars
        });
      } catch (error) {
        console.error('❌ Errore nel caricamento config calendari:', error);
        return res.status(500).json({ success: false, error: error.message });
      }
    }

    if (action === 'calendar-config') {
      if (req.method !== 'POST') {
        return res.status(405).json({ success: false, error: 'Metodo non consentito' });
      }

      try {
        const config = req.body;
        // Salva la configurazione del calendario nel database
        await pool.query(`
          INSERT INTO admin_settings (category, setting_key, setting_value, updated_at)
          VALUES ('calendar', $1, $2, NOW())
          ON CONFLICT (category, setting_key) 
          DO UPDATE SET setting_value = $2, updated_at = NOW()
        `, [config.type + '_config', JSON.stringify(config)]);

        return res.status(200).json({
          success: true,
          message: 'Configurazione calendario salvata'
        });
      } catch (error) {
        console.error('❌ Errore nel salvataggio config calendario:', error);
        return res.status(500).json({ success: false, error: error.message });
      }
    }

    if (action === 'sync-calendar') {
      if (req.method !== 'POST') {
        return res.status(405).json({ success: false, error: 'Metodo non consentito' });
      }

      try {
        const { calendarId } = req.body;
        const config = await loadCalendarConfig();
        let syncResult = {};

        if (calendarId === 'google') {
          const events = await syncGoogleCalendar(config);
          syncResult = {
            calendar: 'Google Calendar',
            syncedEvents: events.length,
            blockedDates: events.filter(e => e.isBlocking).length
          };
        } else if (calendarId === 'booking') {
          const events = await syncBookingCom(config);
          syncResult = {
            calendar: 'Booking.com',
            syncedEvents: events.length,
            blockedDates: events.filter(e => e.isBlocking).length
          };
        } else {
          throw new Error(`Calendario '${calendarId}' non supportato`);
        }

        return res.status(200).json({
          success: true,
          ...syncResult
        });
      } catch (error) {
        console.error('❌ Errore nella sincronizzazione calendario:', error);
        return res.status(500).json({ success: false, error: error.message });
      }
    }

    // ========================
    // FALLBACK per azioni non riconosciute
    // ========================
    return res.status(400).json({
      success: false,
      error: `Azione '${action}' non riconosciuta`,
      availableActions: [
        'login', 'settings', 'pricing', 'quote', 'calculate',
        'booking', 'bookings', 'sync-calendars', 'blocked-dates',
        'calendar-configs', 'calendar-config', 'sync-calendar'
      ]
    });

  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({
      success: false,
      error: 'Errore interno del server',
      details: error.message
    });
  }
}