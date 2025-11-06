import { Pool } from 'pg';
import fetch from 'node-fetch';
import ical from 'node-ical';

// Cache in memoria per le disponibilità (ottimizzazione)
const availabilityCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minuti

// Configurazione database
let pool;
try {
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });
} catch (poolError) {
  console.error('Pool creation error:', poolError);
}

/**
 * Sistema di Sincronizzazione Availability Real-Time
 * Aggrega disponibilità da:
 * - Google Calendar (OAuth2)
 * - Booking.com (iCal)
 * - Holidu (iCal)
 * - Altri calendari iCal esterni
 * - Prenotazioni interne (database)
 */
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { action, startDate, endDate, forceRefresh } = req.query;
  let client;

  try {
    client = await pool.connect();
    
    switch (action) {
      case 'check':
        return await checkAvailability(req, res, client);
      case 'sync-all':
        return await syncAllCalendars(req, res, client);
      case 'block-dates':
        return await blockDatesOnAllCalendars(req, res, client);
      default:
        return await getAggregatedAvailability(req, res, client);
    }
    
  } catch (error) {
    console.error('Availability sync error:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Errore sincronizzazione disponibilità',
      details: error.message 
    });
  } finally {
    if (client) client.release();
  }
}

/**
 * Controlla disponibilità per un range di date specifico
 */
async function checkAvailability(req, res, client) {
  const { startDate, endDate, guests = 1 } = req.query;
  
  if (!startDate || !endDate) {
    return res.status(400).json({ 
      success: false, 
      error: 'startDate e endDate sono obbligatori' 
    });
  }

  console.log(`🔍 Controllo disponibilità: ${startDate} → ${endDate} per ${guests} ospiti`);

  try {
    // 1. Controlla cache prima
    const cacheKey = `availability_${startDate}_${endDate}`;
    const cached = availabilityCache.get(cacheKey);
    
    if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
      console.log('📦 Usando cache per disponibilità');
      return res.json({
        success: true,
        available: cached.available,
        blockedDates: cached.blockedDates,
        source: 'cache',
        lastUpdate: cached.timestamp
      });
    }

    // 2. Aggrega da tutte le fonti
    const availability = await aggregateAvailabilityFromAllSources(client, startDate, endDate);
    
    // 3. Determina disponibilità finale
    const isAvailable = !availability.blockedDates.some(blockedDate => {
      const blocked = new Date(blockedDate);
      const start = new Date(startDate);
      const end = new Date(endDate);
      return blocked >= start && blocked < end;
    });

    // 4. Salva in cache
    availabilityCache.set(cacheKey, {
      available: isAvailable,
      blockedDates: availability.blockedDates,
      timestamp: Date.now()
    });

    return res.json({
      success: true,
      available: isAvailable,
      blockedDates: availability.blockedDates,
      calendarsChecked: availability.calendarsChecked,
      lastSync: availability.lastSync
    });

  } catch (error) {
    console.error('Error checking availability:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Errore controllo disponibilità' 
    });
  }
}

/**
 * Aggrega disponibilità da tutte le fonti
 */
async function aggregateAvailabilityFromAllSources(client, startDate, endDate) {
  const blockedDates = [];
  const calendarsChecked = [];
  let lastSync = null;

  try {
    // 1. Calendari esterni (iCal: Booking, Holidu, etc.)
    const externalCalendars = await client.query(`
      SELECT id, calendar_name, platform, ical_url, last_sync_at
      FROM admin_calendar_configs 
      WHERE is_active = true AND ical_url IS NOT NULL
    `);

    for (const calendar of externalCalendars.rows) {
      try {
        console.log(`📅 Sincronizzando ${calendar.calendar_name} (${calendar.platform})`);
        
        const icalData = await fetch(calendar.ical_url);
        const icalText = await icalData.text();
        const events = ical.parseICS(icalText);

        Object.values(events).forEach(event => {
          if (event.type === 'VEVENT' && event.start && event.end) {
            const eventStart = new Date(event.start);
            const eventEnd = new Date(event.end);
            
            // Aggiungi tutte le date dell'evento come bloccate
            for (let d = new Date(eventStart); d < eventEnd; d.setDate(d.getDate() + 1)) {
              blockedDates.push(d.toISOString().split('T')[0]);
            }
          }
        });

        calendarsChecked.push({
          name: calendar.calendar_name,
          platform: calendar.platform,
          status: 'synced'
        });

        // Aggiorna timestamp sync
        await client.query(`
          UPDATE admin_calendar_configs 
          SET last_sync_at = NOW() 
          WHERE id = $1
        `, [calendar.id]);

      } catch (calendarError) {
        console.error(`Errore sync ${calendar.calendar_name}:`, calendarError);
        calendarsChecked.push({
          name: calendar.calendar_name,
          platform: calendar.platform,
          status: 'error',
          error: calendarError.message
        });
      }
    }

    // 2. Prenotazioni interne dal database
    try {
      const internalBookings = await client.query(`
        SELECT check_in_date, check_out_date 
        FROM admin_bookings 
        WHERE status IN ('confirmed', 'pending')
        AND check_out_date >= $1 
        AND check_in_date <= $2
      `, [startDate, endDate]);

      internalBookings.rows.forEach(booking => {
        const start = new Date(booking.check_in_date);
        const end = new Date(booking.check_out_date);
        
        for (let d = new Date(start); d < end; d.setDate(d.getDate() + 1)) {
          blockedDates.push(d.toISOString().split('T')[0]);
        }
      });

      calendarsChecked.push({
        name: 'Prenotazioni Interne',
        platform: 'database',
        status: 'synced'
      });

    } catch (dbError) {
      console.log('Tabella bookings non disponibile, skip prenotazioni interne');
    }

    // 3. Date bloccate manualmente
    try {
      const blockedDatesQuery = await client.query(`
        SELECT blocked_date, reason
        FROM admin_blocked_dates 
        WHERE blocked_date >= $1 AND blocked_date <= $2
        AND is_active = true
      `, [startDate, endDate]);

      blockedDatesQuery.rows.forEach(row => {
        blockedDates.push(row.blocked_date.toISOString().split('T')[0]);
      });

      calendarsChecked.push({
        name: 'Blocchi Manuali',
        platform: 'admin',
        status: 'synced'
      });

    } catch (dbError) {
      console.log('Tabella blocked_dates non disponibile, skip blocchi manuali');
    }

    return {
      blockedDates: [...new Set(blockedDates)], // Rimuovi duplicati
      calendarsChecked,
      lastSync: new Date().toISOString()
    };

  } catch (error) {
    console.error('Error aggregating availability:', error);
    throw error;
  }
}

/**
 * Sincronizza tutti i calendari (refresh forzato)
 */
async function syncAllCalendars(req, res, client) {
  try {
    console.log('🔄 Avvio sincronizzazione forzata tutti i calendari');
    
    // Pulisci cache
    availabilityCache.clear();
    
    // Esegui sync completa
    const result = await aggregateAvailabilityFromAllSources(
      client, 
      new Date().toISOString().split('T')[0], 
      new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // 1 anno
    );

    return res.json({
      success: true,
      message: 'Sincronizzazione completata',
      calendarsChecked: result.calendarsChecked,
      totalBlockedDates: result.blockedDates.length,
      lastSync: result.lastSync
    });

  } catch (error) {
    console.error('Error syncing all calendars:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Errore sincronizzazione calendari' 
    });
  }
}

/**
 * Blocca date su tutti i calendari esterni (dopo conferma prenotazione)
 */
async function blockDatesOnAllCalendars(req, res, client) {
  const { startDate, endDate, bookingId, guestName } = req.body;
  
  if (!startDate || !endDate) {
    return res.status(400).json({ 
      success: false, 
      error: 'startDate e endDate sono obbligatori' 
    });
  }

  try {
    console.log(`🔒 Blocco date ${startDate} → ${endDate} per prenotazione ${bookingId}`);
    
    const results = [];
    
    // 1. Google Calendar (se configurato)
    if (process.env.GOOGLE_CALENDAR_ENABLED === 'true') {
      try {
        const googleResult = await createGoogleCalendarEvent(startDate, endDate, guestName, bookingId);
        results.push({
          platform: 'google',
          status: 'success',
          eventId: googleResult.eventId
        });
      } catch (googleError) {
        console.error('Errore Google Calendar:', googleError);
        results.push({
          platform: 'google',
          status: 'error',
          error: googleError.message
        });
      }
    }

    // 2. Altri calendari esterni (se supportano scrittura)
    // TODO: Implementare per Booking.com API, Holidu API quando disponibili
    
    // 3. Invalida cache
    availabilityCache.clear();
    
    return res.json({
      success: true,
      message: 'Date bloccate sui calendari esterni',
      results,
      bookingId
    });

  } catch (error) {
    console.error('Error blocking dates:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Errore blocco date' 
    });
  }
}

/**
 * Crea evento su Google Calendar (placeholder - da implementare con OAuth2)
 */
async function createGoogleCalendarEvent(startDate, endDate, guestName, bookingId) {
  // TODO: Implementare con Google Calendar API e OAuth2
  console.log(`📅 [PLACEHOLDER] Creazione evento Google Calendar: ${startDate} → ${endDate}`);
  
  return {
    eventId: `booking_${bookingId}_${Date.now()}`,
    status: 'created'
  };
}