// Modulo per gestione iCal e sincronizzazione calendari reali
// Supporta parsing iCal da Airbnb, Booking.com, VRBO
// e integrazione con Google Calendar API

/**
 * Classe per gestire sincronizzazione calendario reale
 */
export class RealCalendarSync {
  constructor() {
    this.calendars = [
      {
        id: 'airbnb',
        name: 'Airbnb',
        type: 'ical',
        url: process.env.AIRBNB_ICAL_URL,
        enabled: !!process.env.AIRBNB_ICAL_URL
      },
      {
        id: 'booking',
        name: 'Booking.com',
        type: 'ical',
        url: process.env.BOOKING_ICAL_URL,
        enabled: !!process.env.BOOKING_ICAL_URL
      },
      {
        id: 'vrbo',
        name: 'VRBO',
        type: 'ical',
        url: process.env.VRBO_ICAL_URL,
        enabled: !!process.env.VRBO_ICAL_URL
      },
      {
        id: 'google',
        name: 'Google Calendar',
        type: 'api',
        clientId: process.env.GOOGLE_CALENDAR_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CALENDAR_CLIENT_SECRET,
        refreshToken: process.env.GOOGLE_CALENDAR_REFRESH_TOKEN,
        calendarId: process.env.GOOGLE_CALENDAR_ID,
        enabled: !!(process.env.GOOGLE_CALENDAR_CLIENT_ID && process.env.GOOGLE_CALENDAR_REFRESH_TOKEN)
      }
    ];
  }

  /**
   * Sincronizza tutti i calendari configurati
   */
  async syncAll() {
    const results = [];
    
    for (const calendar of this.calendars) {
      if (!calendar.enabled) {
        results.push({
          id: calendar.id,
          name: calendar.name,
          status: 'disabled',
          message: 'Calendario non configurato'
        });
        continue;
      }

      try {
        let syncResult;
        
        if (calendar.type === 'ical') {
          syncResult = await this.syncICalCalendar(calendar);
        } else if (calendar.type === 'api') {
          syncResult = await this.syncGoogleCalendar(calendar);
        }
        
        results.push({
          id: calendar.id,
          name: calendar.name,
          status: 'success',
          ...syncResult
        });
        
      } catch (error) {
        console.error(`❌ Errore sincronizzazione ${calendar.name}:`, error.message);
        results.push({
          id: calendar.id,
          name: calendar.name,
          status: 'error',
          error: error.message,
          eventsFound: 0,
          eventsUpdated: 0
        });
      }
    }
    
    return results;
  }

  /**
   * Sincronizza calendario tramite iCal URL
   */
  async syncICalCalendar(calendar) {
    if (!calendar.url) {
      throw new Error('URL iCal non configurato');
    }

    try {
      console.log(`🔄 Fetching iCal da ${calendar.name}: ${calendar.url}`);
      
      const response = await fetch(calendar.url, {
        headers: {
          'User-Agent': 'Vincanto Calendar Sync/1.0'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const icalData = await response.text();
      const events = this.parseICalData(icalData);
      
      console.log(`✅ ${calendar.name}: trovati ${events.length} eventi`);
      
      // Qui salveresti gli eventi nel database
      const savedEvents = await this.saveEventsToDatabase(events, calendar.id);
      
      return {
        eventsFound: events.length,
        eventsUpdated: savedEvents,
        lastSync: new Date().toISOString()
      };
      
    } catch (error) {
      throw new Error(`Errore fetch iCal: ${error.message}`);
    }
  }

  /**
   * Sincronizza Google Calendar tramite API
   */
  async syncGoogleCalendar(calendar) {
    try {
      // 1. Ottieni access token da refresh token
      const accessToken = await this.getGoogleAccessToken(calendar);
      
      // 2. Chiama Google Calendar API
      const events = await this.fetchGoogleCalendarEvents(calendar, accessToken);
      
      // 3. Salva eventi nel database
      const savedEvents = await this.saveEventsToDatabase(events, calendar.id);
      
      return {
        eventsFound: events.length,
        eventsUpdated: savedEvents,
        lastSync: new Date().toISOString()
      };
      
    } catch (error) {
      throw new Error(`Errore Google Calendar: ${error.message}`);
    }
  }

  /**
   * Parse dati iCal in formato standard
   */
  parseICalData(icalText) {
    const events = [];
    const lines = icalText.split('\n');
    let currentEvent = null;

    for (let line of lines) {
      line = line.trim();
      
      if (line === 'BEGIN:VEVENT') {
        currentEvent = {};
      } else if (line === 'END:VEVENT' && currentEvent) {
        if (currentEvent.dtstart && currentEvent.dtend) {
          events.push({
            uid: currentEvent.uid || '',
            summary: currentEvent.summary || 'Prenotazione',
            start: this.parseICalDate(currentEvent.dtstart),
            end: this.parseICalDate(currentEvent.dtend),
            description: currentEvent.description || '',
            location: currentEvent.location || ''
          });
        }
        currentEvent = null;
      } else if (currentEvent && line.includes(':')) {
        const [key, ...values] = line.split(':');
        const value = values.join(':');
        
        const cleanKey = key.split(';')[0].toLowerCase();
        currentEvent[cleanKey] = value;
      }
    }

    return events;
  }

  /**
   * Parse data iCal in oggetto Date JavaScript
   */
  parseICalDate(icalDate) {
    // Formato: YYYYMMDDTHHMMSSZ o YYYYMMDD
    if (icalDate.includes('T')) {
      const date = icalDate.replace(/[TZ]/g, '');
      return new Date(
        date.substr(0, 4),    // anno
        date.substr(4, 2) - 1, // mese (0-based)
        date.substr(6, 2),     // giorno
        date.substr(8, 2) || 0, // ora
        date.substr(10, 2) || 0, // minuti
        date.substr(12, 2) || 0  // secondi
      );
    } else {
      return new Date(
        icalDate.substr(0, 4),
        icalDate.substr(4, 2) - 1,
        icalDate.substr(6, 2)
      );
    }
  }

  /**
   * Ottieni access token Google tramite refresh token
   */
  async getGoogleAccessToken(calendar) {
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: calendar.refreshToken,
        client_id: calendar.clientId,
        client_secret: calendar.clientSecret
      })
    });

    if (!response.ok) {
      throw new Error('Impossibile ottenere access token Google');
    }

    const data = await response.json();
    return data.access_token;
  }

  /**
   * Fetch eventi da Google Calendar
   */
  async fetchGoogleCalendarEvents(calendar, accessToken) {
    const url = `https://www.googleapis.com/calendar/v3/calendars/${calendar.calendarId}/events`;
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Google Calendar API error: ${response.status}`);
    }

    const data = await response.json();
    
    return data.items.map(event => ({
      uid: event.id,
      summary: event.summary || 'Evento',
      start: new Date(event.start.dateTime || event.start.date),
      end: new Date(event.end.dateTime || event.end.date),
      description: event.description || '',
      location: event.location || ''
    }));
  }

  /**
   * Salva eventi nel database PostgreSQL
   */
  async saveEventsToDatabase(events, calendarSource) {
    console.log(`💾 Salvando ${events.length} eventi da ${calendarSource}`);
    
    if (!events.length) return 0;

    try {
      // Connessione al database
      const { Pool } = require('pg');
      const pool = new Pool({
        connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL,
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
      });

      let savedCount = 0;

      // Crea tabella se non esiste
      await pool.query(`
        CREATE TABLE IF NOT EXISTS calendar_events (
          id SERIAL PRIMARY KEY,
          uid TEXT UNIQUE NOT NULL,
          calendar_source VARCHAR(50) NOT NULL,
          summary TEXT NOT NULL,
          description TEXT,
          start_date TIMESTAMP NOT NULL,
          end_date TIMESTAMP NOT NULL,
          location TEXT,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        )
      `);

      // Inserisci/aggiorna eventi
      for (const event of events) {
        try {
          const result = await pool.query(`
            INSERT INTO calendar_events (uid, calendar_source, summary, description, start_date, end_date, location)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            ON CONFLICT (uid) 
            DO UPDATE SET 
              summary = EXCLUDED.summary,
              description = EXCLUDED.description,
              start_date = EXCLUDED.start_date,
              end_date = EXCLUDED.end_date,
              location = EXCLUDED.location,
              updated_at = NOW()
            RETURNING id
          `, [
            event.uid,
            calendarSource,
            event.summary,
            event.description,
            event.start,
            event.end,
            event.location
          ]);

          if (result.rowCount > 0) savedCount++;
        } catch (eventError) {
          console.error(`❌ Errore salvando evento ${event.uid}:`, eventError.message);
        }
      }

      await pool.end();
      
      console.log(`✅ Salvati ${savedCount}/${events.length} eventi da ${calendarSource}`);
      return savedCount;
      
    } catch (error) {
      console.error('❌ Errore database:', error.message);
      return 0;
    }
  }

  /**
   * Ottieni status generale sincronizzazione dal database
   */
  async getStatus() {
    try {
      const { Pool } = require('pg');
      const pool = new Pool({
        connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL,
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
      });

      // Statistiche generali
      const statsResult = await pool.query(`
        SELECT 
          calendar_source,
          COUNT(*) as event_count,
          MAX(updated_at) as last_sync,
          MIN(start_date) as next_event_date
        FROM calendar_events 
        WHERE start_date >= NOW()
        GROUP BY calendar_source
      `);

      const totalEventsResult = await pool.query(`
        SELECT COUNT(*) as total_events 
        FROM calendar_events 
        WHERE start_date >= NOW()
      `);

      await pool.end();

      // Mappa risultati per calendario
      const calendarStats = {};
      statsResult.rows.forEach(row => {
        calendarStats[row.calendar_source] = {
          eventsCount: parseInt(row.event_count),
          lastSync: row.last_sync,
          nextEvent: row.next_event_date
        };
      });

      // Costruisci status per ogni calendario configurato
      const calendars = this.calendars.map(calendar => ({
        id: calendar.id,
        name: calendar.name,
        status: calendar.enabled ? 'configured' : 'disabled',
        enabled: calendar.enabled,
        eventsCount: calendarStats[calendar.id]?.eventsCount || 0,
        lastSync: calendarStats[calendar.id]?.lastSync || null,
        nextEvent: calendarStats[calendar.id]?.nextEvent || null
      }));

      return {
        lastFullSync: new Date().toISOString(),
        status: 'active',
        totalCalendars: this.calendars.length,
        enabledCalendars: this.calendars.filter(c => c.enabled).length,
        syncFrequency: '1 hour',
        totalEvents: parseInt(totalEventsResult.rows[0].total_events),
        calendars: calendars,
        configuredCalendars: this.calendars.filter(c => c.enabled).map(c => c.name).join(', ')
      };

    } catch (error) {
      console.error('❌ Errore ottenendo status:', error.message);
      
      // Status fallback senza database
      const calendars = this.calendars.map(calendar => ({
        id: calendar.id,
        name: calendar.name,
        status: calendar.enabled ? 'configured' : 'disabled',
        enabled: calendar.enabled,
        eventsCount: 0,
        lastSync: null,
        nextEvent: null,
        error: 'Database non disponibile'
      }));

      return {
        lastFullSync: null,
        status: 'error',
        error: 'Database non disponibile',
        totalCalendars: this.calendars.length,
        enabledCalendars: this.calendars.filter(c => c.enabled).length,
        totalEvents: 0,
        calendars: calendars,
        configuredCalendars: this.calendars.filter(c => c.enabled).map(c => c.name).join(', ')
      };
    }
  }
}

/**
 * Funzione di utilità per validare configurazione calendario
 */
export function validateCalendarConfig() {
  const issues = [];
  
  if (!process.env.AIRBNB_ICAL_URL && !process.env.BOOKING_ICAL_URL && !process.env.VRBO_ICAL_URL) {
    issues.push('Nessun URL iCal configurato per le piattaforme di prenotazione');
  }
  
  if (process.env.GOOGLE_CALENDAR_CLIENT_ID && !process.env.GOOGLE_CALENDAR_REFRESH_TOKEN) {
    issues.push('Google Calendar: Client ID presente ma manca Refresh Token');
  }
  
  return {
    isValid: issues.length === 0,
    issues: issues
  };
}