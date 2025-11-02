import { Pool } from 'pg';
import { google } from 'googleapis';
import { GoogleAuth } from 'google-auth-library';

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

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { action } = req.query;
  let client;

  try {
    if (!pool) {
      return res.status(500).json({ success: false, error: 'Database non disponibile' });
    }

    client = await pool.connect();

    switch (action) {
      case 'sync-all':
        return await syncAllCalendars(client, req, res);
      case 'sync-google':
        return await syncGoogleCalendar(client, req, res);
      case 'sync-booking':
        return await syncBookingComCalendar(client, req, res);
      case 'sync-holidu':
        return await syncHoliduCalendar(client, req, res);
      case 'sync-ical':
        return await syncICalCalendar(client, req, res);
      case 'export-to-google':
        return await exportToGoogleCalendar(client, req, res);
      case 'get-configs':
        return await getCalendarConfigs(client, req, res);
      case 'save-config':
        return await saveCalendarConfig(client, req, res);
      default:
        return res.status(400).json({ 
          success: false, 
          error: 'Azione richiesta: sync-all, sync-google, sync-booking, sync-holidu, sync-ical, export-to-google, get-configs, save-config' 
        });
    }

  } catch (error) {
    console.error('❌ Errore API calendar integration:', error);
    return res.status(500).json({
      success: false,
      error: 'Errore interno del server',
      details: error.message
    });
  } finally {
    if (client) {
      client.release();
    }
  }
}

// Sincronizza tutti i calendari configurati
async function syncAllCalendars(client, req, res) {
  console.log('🔄 Avvio sincronizzazione completa calendari...');
  
  const results = {
    google: null,
    booking: null,
    holidu: null,
    ical: []
  };

  try {
    // Carica configurazioni attive
    const configs = await client.query(`
      SELECT id, calendar_name, platform, calendar_url, sync_settings
      FROM admin_calendar_configs 
      WHERE is_active = true
      ORDER BY platform
    `);

    console.log('📅 Trovate', configs.rows.length, 'configurazioni attive');

    for (const config of configs.rows) {
      try {
        console.log('🔄 Sincronizzazione:', config.platform, '-', config.calendar_name);
        
        switch (config.platform.toLowerCase()) {
          case 'google':
            results.google = await performGoogleSync(client, config);
            break;
          case 'booking.com':
            results.booking = await performBookingSync(client, config);
            break;
          case 'holidu':
            results.holidu = await performHoliduSync(client, config);
            break;
          case 'ical':
            const icalResult = await performICalSync(client, config);
            results.ical.push(icalResult);
            break;
          default:
            console.log('⚠️ Piattaforma non supportata:', config.platform);
        }

        // Aggiorna timestamp sincronizzazione
        await client.query(`
          UPDATE admin_calendar_configs 
          SET last_sync_at = NOW(), sync_status = 'success'
          WHERE id = $1
        `, [config.id]);

      } catch (syncError) {
        console.error('❌ Errore sync', config.platform, ':', syncError);
        
        // Segna errore nel database
        await client.query(`
          UPDATE admin_calendar_configs 
          SET last_sync_at = NOW(), sync_status = 'error'
          WHERE id = $1
        `, [config.id]);
        
        results[config.platform] = { error: syncError.message };
      }
    }

    return res.status(200).json({
      success: true,
      message: 'Sincronizzazione completata',
      results,
      synced_calendars: configs.rows.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Errore sincronizzazione completa:', error);
    return res.status(500).json({
      success: false,
      error: 'Errore durante la sincronizzazione',
      details: error.message
    });
  }
}

// Google Calendar sync con autenticazione
async function performGoogleSync(client, config) {
  console.log('🔄 Sincronizzazione Google Calendar...');
  
  // Per ora implementazione mock - richiede OAuth setup
  // TODO: Implementare OAuth2 flow per Google Calendar API
  
  return {
    success: true,
    platform: 'google',
    imported_events: 0,
    exported_events: await exportBookingsToGoogle(client),
    message: 'Google Calendar sync preparato (richiede configurazione OAuth)'
  };
}

// Booking.com calendar sync via iCal
async function performBookingSync(client, config) {
  console.log('🔄 Sincronizzazione Booking.com...');
  
  try {
    if (!config.calendar_url) {
      throw new Error('URL calendario Booking.com non configurato');
    }

    // Fetch iCal feed da Booking.com
    const response = await fetch(config.calendar_url);
    if (!response.ok) {
      throw new Error(`Errore fetch Booking.com: ${response.status}`);
    }

    const icalData = await response.text();
    const events = parseICalData(icalData);
    
    console.log('📥 Importati', events.length, 'eventi da Booking.com');

    // Salva eventi nel database
    let importedCount = 0;
    for (const event of events) {
      try {
        await client.query(`
          INSERT INTO admin_calendar_events (
            event_date, event_title, event_type, external_id, platform, created_at, updated_at
          )
          VALUES ($1, $2, 'booking', $3, 'booking.com', NOW(), NOW())
          ON CONFLICT (external_id, platform) 
          DO UPDATE SET 
            event_title = $2,
            updated_at = NOW()
        `, [event.start_date, event.summary, event.uid]);
        
        importedCount++;
      } catch (insertError) {
        console.error('❌ Errore inserimento evento Booking.com:', insertError);
      }
    }

    return {
      success: true,
      platform: 'booking.com',
      imported_events: importedCount,
      message: `Importati ${importedCount} eventi da Booking.com`
    };

  } catch (error) {
    throw new Error(`Booking.com sync error: ${error.message}`);
  }
}

// Holidu calendar sync
async function performHoliduSync(client, config) {
  console.log('🔄 Sincronizzazione Holidu...');
  
  // Implementazione simile a Booking.com ma per Holidu
  try {
    if (!config.calendar_url) {
      throw new Error('URL calendario Holidu non configurato');
    }

    const response = await fetch(config.calendar_url);
    if (!response.ok) {
      throw new Error(`Errore fetch Holidu: ${response.status}`);
    }

    const icalData = await response.text();
    const events = parseICalData(icalData);
    
    console.log('📥 Importati', events.length, 'eventi da Holidu');

    let importedCount = 0;
    for (const event of events) {
      try {
        await client.query(`
          INSERT INTO admin_calendar_events (
            event_date, event_title, event_type, external_id, platform, created_at, updated_at
          )
          VALUES ($1, $2, 'booking', $3, 'holidu', NOW(), NOW())
          ON CONFLICT (external_id, platform) 
          DO UPDATE SET 
            event_title = $2,
            updated_at = NOW()
        `, [event.start_date, event.summary, event.uid]);
        
        importedCount++;
      } catch (insertError) {
        console.error('❌ Errore inserimento evento Holidu:', insertError);
      }
    }

    return {
      success: true,
      platform: 'holidu',
      imported_events: importedCount,
      message: `Importati ${importedCount} eventi da Holidu`
    };

  } catch (error) {
    throw new Error(`Holidu sync error: ${error.message}`);
  }
}

// iCal generico sync
async function performICalSync(client, config) {
  console.log('🔄 Sincronizzazione iCal generico...');
  
  try {
    if (!config.calendar_url) {
      throw new Error('URL iCal non configurato');
    }

    const response = await fetch(config.calendar_url);
    if (!response.ok) {
      throw new Error(`Errore fetch iCal: ${response.status}`);
    }

    const icalData = await response.text();
    const events = parseICalData(icalData);
    
    console.log('📥 Importati', events.length, 'eventi da iCal');

    let importedCount = 0;
    for (const event of events) {
      try {
        await client.query(`
          INSERT INTO admin_calendar_events (
            event_date, event_title, event_type, external_id, platform, created_at, updated_at
          )
          VALUES ($1, $2, 'booking', $3, $4, NOW(), NOW())
          ON CONFLICT (external_id, platform) 
          DO UPDATE SET 
            event_title = $2,
            updated_at = NOW()
        `, [event.start_date, event.summary, event.uid, config.platform]);
        
        importedCount++;
      } catch (insertError) {
        console.error('❌ Errore inserimento evento iCal:', insertError);
      }
    }

    return {
      success: true,
      platform: config.platform,
      calendar_name: config.calendar_name,
      imported_events: importedCount,
      message: `Importati ${importedCount} eventi da ${config.calendar_name}`
    };

  } catch (error) {
    throw new Error(`iCal sync error: ${error.message}`);
  }
}

// Esporta prenotazioni locali a Google Calendar
async function exportBookingsToGoogle(client) {
  console.log('📤 Export prenotazioni a Google Calendar...');
  
  try {
    // Carica prenotazioni da esportare
    const bookings = await client.query(`
      SELECT 
        id, guest_name, guest_surname, check_in_date, check_out_date,
        num_adults, num_children, created_at
      FROM admin_bookings 
      WHERE status = 'confirmed'
      AND created_at >= NOW() - interval '30 days'
      AND NOT EXISTS (
        SELECT 1 FROM admin_calendar_events 
        WHERE external_id = 'booking_' || admin_bookings.id 
        AND platform = 'google_export'
      )
    `);

    console.log('📤 Trovate', bookings.rows.length, 'prenotazioni da esportare');

    // Per ora segna come esportate nel DB locale
    // TODO: Implementare effettivo export a Google Calendar
    let exportedCount = 0;
    for (const booking of bookings.rows) {
      try {
        await client.query(`
          INSERT INTO admin_calendar_events (
            event_date, event_title, event_type, external_id, platform, created_at, updated_at
          )
          VALUES ($1, $2, 'export', $3, 'google_export', NOW(), NOW())
        `, [
          booking.check_in_date,
          `Prenotazione: ${booking.guest_name} ${booking.guest_surname} (${booking.num_adults + booking.num_children} persone)`,
          `booking_${booking.id}`
        ]);
        
        exportedCount++;
      } catch (insertError) {
        console.error('❌ Errore export booking:', insertError);
      }
    }

    return exportedCount;

  } catch (error) {
    console.error('❌ Errore export Google Calendar:', error);
    return 0;
  }
}

// Parser semplificato per dati iCal
function parseICalData(icalString) {
  const events = [];
  const lines = icalString.split('\n');
  let currentEvent = null;

  for (let line of lines) {
    line = line.trim();
    
    if (line === 'BEGIN:VEVENT') {
      currentEvent = {};
    } else if (line === 'END:VEVENT' && currentEvent) {
      if (currentEvent.dtstart && currentEvent.summary) {
        events.push({
          uid: currentEvent.uid || `event_${Date.now()}_${Math.random()}`,
          summary: currentEvent.summary,
          start_date: parseICalDate(currentEvent.dtstart),
          end_date: parseICalDate(currentEvent.dtend || currentEvent.dtstart)
        });
      }
      currentEvent = null;
    } else if (currentEvent && line.includes(':')) {
      const [key, ...valueParts] = line.split(':');
      const value = valueParts.join(':');
      
      switch (key.split(';')[0]) {
        case 'UID':
          currentEvent.uid = value;
          break;
        case 'SUMMARY':
          currentEvent.summary = value;
          break;
        case 'DTSTART':
          currentEvent.dtstart = value;
          break;
        case 'DTEND':
          currentEvent.dtend = value;
          break;
      }
    }
  }

  return events;
}

// Parser per date iCal
function parseICalDate(icalDate) {
  if (!icalDate) return new Date();
  
  // Formato: YYYYMMDD o YYYYMMDDTHHMMSS
  const dateStr = icalDate.replace(/[TZ]/g, '');
  const year = dateStr.substring(0, 4);
  const month = dateStr.substring(4, 6);
  const day = dateStr.substring(6, 8);
  
  return new Date(`${year}-${month}-${day}`);
}

// Carica configurazioni calendari
async function getCalendarConfigs(client, req, res) {
  try {
    const result = await client.query(`
      SELECT 
        id, calendar_name, platform, calendar_url, is_active,
        last_sync_at, sync_status, created_at
      FROM admin_calendar_configs 
      ORDER BY platform, calendar_name
    `);

    return res.status(200).json({
      success: true,
      configs: result.rows
    });

  } catch (error) {
    throw new Error(`Errore caricamento configurazioni: ${error.message}`);
  }
}

// Salva configurazione calendario
async function saveCalendarConfig(client, req, res) {
  try {
    const { 
      id, 
      calendar_name, 
      platform, 
      calendar_url, 
      is_active = true,
      sync_settings = {}
    } = req.body;

    if (id) {
      // Aggiorna esistente
      await client.query(`
        UPDATE admin_calendar_configs 
        SET 
          calendar_name = $1,
          platform = $2,
          calendar_url = $3,
          is_active = $4,
          sync_settings = $5,
          updated_at = NOW()
        WHERE id = $6
      `, [calendar_name, platform, calendar_url, is_active, JSON.stringify(sync_settings), id]);
    } else {
      // Crea nuovo
      await client.query(`
        INSERT INTO admin_calendar_configs (
          calendar_name, platform, calendar_url, is_active, sync_settings, created_at, updated_at
        )
        VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
      `, [calendar_name, platform, calendar_url, is_active, JSON.stringify(sync_settings)]);
    }

    return res.status(200).json({
      success: true,
      message: 'Configurazione calendario salvata'
    });

  } catch (error) {
    throw new Error(`Errore salvataggio configurazione: ${error.message}`);
  }
}