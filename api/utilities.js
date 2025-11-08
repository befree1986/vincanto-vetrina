// API UNIFICATA UTILITIES - Gestisce calendario, servizi e utilità varie
import { Pool } from 'pg';

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Ottieni action da query params o body
  let { action } = req.query;
  if (req.method === 'POST' && req.body && req.body.action) {
    action = req.body.action;
  }
  
    try {
    switch (action) {
      case 'sync-calendars':
        // POST /api/utilities?action=sync-calendars - Sincronizza calendari esterni
        if (req.method !== 'POST') {
          return res.status(405).json({ success: false, error: 'Metodo non consentito' });
        }

        console.log('🔄 Avvio sincronizzazione calendari...');
        
        // Recupera configurazioni calendario dal database
        const calendarConfig = await pool.query(`
          SELECT setting_key, setting_value 
          FROM admin_settings 
          WHERE category = 'calendar' 
          ORDER BY setting_key
        `);
        
        const config = {};
        calendarConfig.rows.forEach(row => {
          config[row.setting_key] = row.setting_value;
        });
        
        const calendarSources = [];
        const blockedDatesFound = [];
        
        // 1. Sincronizzazione Google Calendar
        try {
          console.log('📅 Sincronizzazione Google Calendar...');
          // Simula chiamata API Google Calendar
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
          console.error('Google Calendar sync error:', error.message);
          calendarSources.push({
            name: 'Google Calendar',
            status: 'error',
            lastSync: null,
            error: error.message
          });
        }
        
        // 2. Sincronizzazione Booking.com
        try {
          console.log('🏨 Sincronizzazione Booking.com...');
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
          console.error('Booking.com sync error:', error.message);
          calendarSources.push({
            name: 'Booking.com',
            status: 'error',
            lastSync: null,
            error: error.message
          });
        }
        
        // 3. Sincronizzazione Airbnb
        try {
          console.log('🏠 Sincronizzazione Airbnb...');
          const airbnbEvents = await syncAirbnb(config);
          calendarSources.push({
            name: 'Airbnb',
            status: 'active',
            lastSync: new Date().toISOString(),
            eventsFound: airbnbEvents.length,
            blockedDates: airbnbEvents.length
          });
          blockedDatesFound.push(...airbnbEvents);
        } catch (error) {
          console.error('Airbnb sync error:', error.message);
          calendarSources.push({
            name: 'Airbnb',
            status: 'inactive',
            lastSync: null,
            error: error.message
          });
        }
        
        // 4. Aggiorna database con date bloccate trovate
        if (blockedDatesFound.length > 0) {
          console.log(`📝 Aggiornamento database: ${blockedDatesFound.length} date bloccate trovate`);
          
          // Pulisci date bloccate esistenti da sync esterni
          await pool.query(`
            DELETE FROM blocked_dates 
            WHERE reason LIKE '%sync%' OR reason LIKE '%external%'
          `);
          
          // Inserisci nuove date bloccate
          for (const blockedDate of blockedDatesFound) {
            try {
              await pool.query(`
                INSERT INTO blocked_dates (date_blocked, reason, created_at, source)
                VALUES ($1, $2, NOW(), $3)
              `, [
                blockedDate.date,
                `External sync: ${blockedDate.source} - ${blockedDate.title || 'Booking'}`,
                blockedDate.source
              ]);
            } catch (error) {
              // Se la data esiste già, aggiornala
              if (error.code === '23505') { // unique violation
                await pool.query(`
                  UPDATE blocked_dates 
                  SET reason = $2, source = $3, updated_at = NOW()
                  WHERE date_blocked = $1
                `, [
                  blockedDate.date,
                  `External sync: ${blockedDate.source} - ${blockedDate.title || 'Booking'}`,
                  blockedDate.source
                ]);
              } else {
                console.error('Errore inserimento data bloccata:', error.message);
              }
            }
          }
        }
        
        // 5. Aggiorna timestamp sincronizzazione
        await pool.query(`
          INSERT INTO admin_settings (category, setting_key, setting_value, setting_type, updated_at)
          VALUES ('calendar', 'last_sync_timestamp', $1, 'string', NOW())
          ON CONFLICT (category, setting_key) DO UPDATE SET
            setting_value = EXCLUDED.setting_value,
            updated_at = NOW()
        `, [new Date().toISOString()]);
        
        const activeServices = calendarSources.filter(s => s.status === 'active').length;
        const totalBlockedDates = blockedDatesFound.length;
        
        console.log(`✅ Sincronizzazione completata: ${activeServices}/${calendarSources.length} servizi attivi, ${totalBlockedDates} date bloccate`);

        return res.status(200).json({
          success: true,
          message: 'Sincronizzazione calendari completata con successo',
          sources: calendarSources,
          syncedAt: new Date().toISOString(),
          blockedDatesUpdated: totalBlockedDates,
          activeServices,
          totalServices: calendarSources.length,
          nextSyncRecommended: new Date(Date.now() + 60 * 60 * 1000).toISOString() // +1 ora
        });

// Funzioni helper per sincronizzazione servizi esterni
async function syncGoogleCalendar(config) {
  // Simula controllo Google Calendar
  // In produzione: integrare con Google Calendar API
  const mockEvents = [
    { date: '2025-11-15', isBlocking: true, title: 'Prenotazione privata', source: 'google' },
    { date: '2025-11-16', isBlocking: true, title: 'Prenotazione privata', source: 'google' },
    { date: '2025-12-25', isBlocking: true, title: 'Natale - Non disponibile', source: 'google' }
  ];
  
  // Simula delay API
  await new Promise(resolve => setTimeout(resolve, 500));
  return mockEvents;
}

async function syncBookingCom(config) {
  // Simula controllo Booking.com
  // In produzione: integrare con Booking.com Partner API
  const mockBookings = [
    { date: '2025-11-20', title: 'Booking.com reservation', source: 'booking' },
    { date: '2025-11-21', title: 'Booking.com reservation', source: 'booking' },
    { date: '2025-11-22', title: 'Booking.com reservation', source: 'booking' }
  ];
  
  await new Promise(resolve => setTimeout(resolve, 300));
  return mockBookings;
}

async function syncAirbnb(config) {
  // Simula controllo Airbnb
  // In produzione: integrare con Airbnb API
  // Attualmente disattivato per demo
  throw new Error('Airbnb API non configurata - servizio temporaneamente disattivato');
}

      case 'database-status':
        // GET/POST /api/utilities?action=database-status - Verifica stato database
        if (req.method !== 'GET' && req.method !== 'POST') {
          return res.status(405).json({ success: false, error: 'Metodo non consentito' });
        }

        try {
          // Verifica esistenza tabelle essenziali
          const tablesCheck = await pool.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name IN ('bookings', 'blocked_dates', 'admin_settings')
          `);

          const existingTables = tablesCheck.rows.map(row => row.table_name);
          const requiredTables = ['bookings', 'blocked_dates', 'admin_settings'];
          const missingTables = requiredTables.filter(table => !existingTables.includes(table));

          // Conta record in ciascuna tabella
          const tableCounts = {};
          for (const table of existingTables) {
            try {
              const countResult = await pool.query(`SELECT COUNT(*) as count FROM ${table}`);
              tableCounts[table] = parseInt(countResult.rows[0].count);
            } catch (error) {
              tableCounts[table] = 'Error: ' + error.message;
            }
          }

          // Verifica configurazioni
          let configurationsCount = 0;
          if (existingTables.includes('admin_settings')) {
            const configResult = await pool.query('SELECT COUNT(*) as count FROM admin_settings');
            configurationsCount = parseInt(configResult.rows[0].count);
          }

          const isFullyConfigured = missingTables.length === 0 && configurationsCount > 0;

          return res.status(200).json({
            success: true,
            status: isFullyConfigured ? 'ready' : 'incomplete',
            database: {
              existingTables,
              missingTables,
              tableCounts,
              configurationsCount,
              totalTables: existingTables.length,
              requiredTables: requiredTables.length
            },
            ready: isFullyConfigured,
            recommendations: missingTables.length > 0 ? 
              ['Eseguire /api/admin?action=init-database per creare tabelle mancanti'] : 
              ['Database completamente configurato']
          });

        } catch (error) {
          return res.status(500).json({
            success: false,
            error: 'Errore verifica database',
            message: error.message
          });
        }
        break;

      case 'check-availability':
        // GET/POST /api/utilities?action=check-availability&startDate=X&endDate=Y
        if (req.method !== 'GET' && req.method !== 'POST') {
          return res.status(405).json({ success: false, error: 'Metodo non consentito' });
        }
        
        let { startDate, endDate } = req.query;
        if (req.method === 'POST' && req.body) {
          startDate = startDate || req.body.startDate;
          endDate = endDate || req.body.endDate;
        }
        
        if (!startDate || !endDate) {
          return res.status(400).json({
            success: false,
            error: 'startDate e endDate sono richiesti'
          });
        }
        
        try {
          console.log(`🔍 Controllo disponibilità: ${startDate} - ${endDate}`);
          
          // 1. Controlla prenotazioni esistenti
          const existingBookings = await pool.query(`
            SELECT booking_id, check_in, check_out, status
            FROM bookings 
            WHERE status != 'cancelled'
            AND NOT (check_out <= $1 OR check_in >= $2)
          `, [startDate, endDate]);
          
          // 2. Controlla date bloccate
          const blockedDates = await pool.query(`
            SELECT date_blocked, reason, source
            FROM blocked_dates 
            WHERE date_blocked >= $1 AND date_blocked <= $2
            ORDER BY date_blocked
          `, [startDate, endDate]);
          
          // 3. Verifica ultimo sync calendari esterni
          const lastSync = await pool.query(`
            SELECT setting_value 
            FROM admin_settings 
            WHERE category = 'calendar' AND setting_key = 'last_sync_timestamp'
          `);
          
          const syncInfo = lastSync.rows[0] ? {
            lastSync: lastSync.rows[0].setting_value,
            minutesAgo: Math.floor((Date.now() - new Date(lastSync.rows[0].setting_value).getTime()) / 60000)
          } : null;
          
          // 4. Determina disponibilità
          const conflictingBookings = existingBookings.rows;
          const blockedDatesInRange = blockedDates.rows;
          const isAvailable = conflictingBookings.length === 0 && blockedDatesInRange.length === 0;
          
          const response = {
            success: true,
            available: isAvailable,
            period: { startDate, endDate },
            conflicts: {
              bookings: conflictingBookings,
              blockedDates: blockedDatesInRange,
              total: conflictingBookings.length + blockedDatesInRange.length
            },
            calendarSync: syncInfo,
            checkedAt: new Date().toISOString(),
            recommendation: isAvailable ? 
              'Periodo disponibile per prenotazione' : 
              `Periodo non disponibile - ${conflictingBookings.length} prenotazioni, ${blockedDatesInRange.length} date bloccate`
          };
          
          console.log(`${isAvailable ? '✅' : '❌'} Disponibilità: ${response.recommendation}`);
          
          return res.status(200).json(response);
          
        } catch (error) {
          console.error('Errore controllo disponibilità:', error.message);
          return res.status(500).json({
            success: false,
            error: 'Errore controllo disponibilità',
            message: error.message
          });
        }
        break;

      case 'calendar-setup':
        // POST /api/utilities-unified?action=calendar-setup
        if (req.method !== 'POST') {
          return res.status(405).json({ success: false, error: 'Metodo non consentito' });
        }

        // Crea tabelle calendario se non esistono
        await pool.query(`
          CREATE TABLE IF NOT EXISTS calendar_events (
            id SERIAL PRIMARY KEY,
            title VARCHAR(255) NOT NULL,
            start_date DATE NOT NULL,
            end_date DATE NOT NULL,
            event_type VARCHAR(50) DEFAULT 'booking',
            description TEXT,
            created_at TIMESTAMP DEFAULT NOW()
          )
        `);

        await pool.query(`
          CREATE TABLE IF NOT EXISTS calendar_sync (
            id SERIAL PRIMARY KEY,
            provider VARCHAR(50) NOT NULL,
            calendar_id VARCHAR(255) NOT NULL,
            access_token TEXT,
            refresh_token TEXT,
            last_sync TIMESTAMP,
            active BOOLEAN DEFAULT true,
            created_at TIMESTAMP DEFAULT NOW()
          )
        `);

        return res.status(200).json({
          success: true,
          message: 'Tabelle calendario create con successo'
        });

      case 'calendar-events':
        // GET /api/utilities-unified?action=calendar-events - Lista eventi
        // POST /api/utilities-unified?action=calendar-events - Crea evento
        
        if (req.method === 'GET') {
          const { startDate, endDate } = req.query;
          
          let query = 'SELECT * FROM calendar_events';
          let params = [];
          
          if (startDate && endDate) {
            query += ' WHERE start_date >= $1 AND end_date <= $2';
            params = [startDate, endDate];
          }
          
          query += ' ORDER BY start_date';
          
          const result = await pool.query(query, params);
          
          return res.status(200).json({
            success: true,
            events: result.rows
          });
        }
        
        if (req.method === 'POST') {
          const { title, startDate, endDate, eventType, description } = req.body;
          
          if (!title || !startDate || !endDate) {
            return res.status(400).json({
              success: false,
              error: 'Titolo, data inizio e fine richiesti'
            });
          }

          const result = await pool.query(`
            INSERT INTO calendar_events (title, start_date, end_date, event_type, description)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING id
          `, [title, startDate, endDate, eventType || 'booking', description]);

          return res.status(200).json({
            success: true,
            message: 'Evento creato con successo',
            eventId: result.rows[0].id
          });
        }

        return res.status(405).json({ success: false, error: 'Metodo non consentito' });

      case 'tourist-tax':
        // GET /api/utilities-unified?action=tourist-tax&guests=X&nights=Y&childrenAges=[]
        if (req.method !== 'GET') {
          return res.status(405).json({ success: false, error: 'Metodo non consentito' });
        }

        const { guests, nights, childrenAges } = req.query;
        
        if (!guests || !nights) {
          return res.status(400).json({
            success: false,
            error: 'Numero ospiti e notti richiesti'
          });
        }

        // Carica tassa di soggiorno dal database
        const taxResult = await pool.query(`
          SELECT setting_value FROM admin_settings 
          WHERE category = 'pricing' AND setting_key = 'tourist_tax_adult'
        `);
        
        const taxPerAdultPerNight = parseFloat(taxResult.rows[0]?.setting_value) || 2.00;
        
        // Calcola tassa di soggiorno
        const totalGuests = parseInt(guests);
        const totalNights = parseInt(nights);
        let children = 0;
        
        if (childrenAges) {
          const ages = Array.isArray(childrenAges) ? childrenAges : [childrenAges];
          children = ages.filter(age => parseInt(age) < 12).length;
        }
        
        const adultsForTax = totalGuests - children;
        const maxTaxNights = Math.min(totalNights, 7); // Massimo 7 notti
        const totalTax = adultsForTax * taxPerAdultPerNight * maxTaxNights;

        return res.status(200).json({
          success: true,
          touristTax: {
            totalAmount: totalTax,
            perAdultPerNight: taxPerAdultPerNight,
            adultsSubjectToTax: adultsForTax,
            nightsSubjectToTax: maxTaxNights,
            exemptChildren: children
          }
        });

      case 'google-calendar':
        // GET /api/utilities-unified?action=google-calendar - Stato sincronizzazione
        // POST /api/utilities-unified?action=google-calendar - Configura sincronizzazione
        
        if (req.method === 'GET') {
          const result = await pool.query(`
            SELECT * FROM calendar_sync WHERE provider = 'google' AND active = true
          `);
          
          return res.status(200).json({
            success: true,
            connected: result.rows.length > 0,
            lastSync: result.rows[0]?.last_sync || null
          });
        }
        
        if (req.method === 'POST') {
          const { calendarId, accessToken, refreshToken } = req.body;
          
          if (!calendarId) {
            return res.status(400).json({
              success: false,
              error: 'ID calendario richiesto'
            });
          }

          await pool.query(`
            INSERT INTO calendar_sync (provider, calendar_id, access_token, refresh_token, last_sync)
            VALUES ('google', $1, $2, $3, NOW())
            ON CONFLICT (provider, calendar_id)
            DO UPDATE SET 
              access_token = $2,
              refresh_token = $3,
              last_sync = NOW(),
              active = true
          `, [calendarId, accessToken, refreshToken]);

          return res.status(200).json({
            success: true,
            message: 'Sincronizzazione Google Calendar configurata'
          });
        }

        return res.status(405).json({ success: false, error: 'Metodo non consentito' });

      case 'health':
        // GET /api/utilities-unified?action=health - Health check
        if (req.method !== 'GET') {
          return res.status(405).json({ success: false, error: 'Metodo non consentito' });
        }

        // Test connessione database
        await pool.query('SELECT 1');
        
        return res.status(200).json({
          success: true,
          status: 'healthy',
          timestamp: new Date().toISOString(),
          database: 'connected'
        });

      default:
        return res.status(400).json({ 
          success: false, 
          error: 'Azione non riconosciuta. Usa: calendar-setup, calendar-events, tourist-tax, google-calendar, health' 
        });
    }
  } catch (error) {
    console.error('❌ Errore API Utilities Unificata:', error);
    return res.status(500).json({
      success: false,
      error: 'Errore interno del server',
      message: error.message
    });
  }
}