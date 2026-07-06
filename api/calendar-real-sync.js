// api/calendar-real-sync.js
import { Pool } from 'pg';
import fetch from 'node-fetch'; // Assicurati che node-fetch sia disponibile o usa il fetch nativo di Node 18+

/**
 * Classe per gestire sincronizzazione calendario reale
 */
export class RealCalendarSync {
  constructor() {
    this.calendars = [];
  }

  async loadCalendarsFromDB() {
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    });

    try {
      // Carica calendari attivi dal DB
      const result = await pool.query('SELECT * FROM calendar_configs WHERE is_active = true');
      
      this.calendars = result.rows.map(row => ({
        id: `cal_${row.id}`, // ID univoco per la sincronizzazione (es. cal_1, cal_2)
        name: row.name,
        type: 'ical',
        url: row.url,
        enabled: row.is_active,
        platform: row.calendar_type // 'airbnb', 'booking', 'holidu' (per la logica di parsing)
      }));

      // Aggiungi Google Calendar se configurato via ENV (gestione speciale API)
      if (process.env.GOOGLE_CALENDAR_CLIENT_ID && process.env.GOOGLE_CALENDAR_REFRESH_TOKEN) {
        this.calendars.push({
          id: 'google',
          name: 'Google Calendar',
          type: 'api',
          clientId: process.env.GOOGLE_CALENDAR_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CALENDAR_CLIENT_SECRET,
          refreshToken: process.env.GOOGLE_CALENDAR_REFRESH_TOKEN,
          calendarId: process.env.GOOGLE_CALENDAR_ID || 'primary',
          enabled: true,
          platform: 'google'
        });
      }
      
      console.log('🗓️ Calendari caricati dal DB:', this.calendars.length);
    } catch (err) {
      console.error('❌ Errore caricamento calendari dal DB:', err);
    } finally {
      await pool.end();
    }
  }

  /**
   * Sincronizza tutti i calendari configurati
   */
  async syncAll() {
    await this.loadCalendarsFromDB();
    
    const results = [];
    
    for (const calendar of this.calendars) {
      if (!calendar.enabled) {
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
      console.log(`🔄 Fetching iCal da ${calendar.name}`);
      
      const response = await fetch(calendar.url, {
        headers: {
          'User-Agent': 'Vincanto Calendar Sync/1.0'
        },
        timeout: 10000 // 10 secondi timeout
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const icalData = await response.text();
      
      if (!icalData || icalData.trim().length === 0) {
        throw new Error('Dati iCal vuoti ricevuti');
      }

      // Usa calendar.platform per la logica di parsing (es. filtri Airbnb vs Booking)
      const events = this.parseICalData(icalData, calendar.platform);
      
      console.log(`✅ ${calendar.name}: trovati ${events.length} eventi validi`);
      
      // Filtra solo eventi futuri (o in corso)
      const futureEvents = events.filter(event => new Date(event.end) > new Date());
      
      // Salva eventi nel database
      // Usa calendar.id (es. cal_1) come sorgente univoca per evitare conflitti tra più calendari dello stesso tipo
      const savedEvents = await this.saveEventsToDatabase(futureEvents, calendar.id, calendar.platform);
      
      return {
        eventsFound: events.length,
        futureEvents: futureEvents.length,
        eventsUpdated: savedEvents,
        lastSync: new Date().toISOString()
      };
      
    } catch (error) {
      console.error(`❌ Errore sync ${calendar.name}:`, error.message);
      throw new Error(`Errore fetch iCal da ${calendar.name}: ${error.message}`);
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
      const savedEvents = await this.saveEventsToDatabase(events, calendar.id, calendar.platform);
      
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
  parseICalData(icalText, platform) {
    const events = [];
    const lines = icalText.split('\n');
    let currentEvent = null;

    for (let line of lines) {
      line = line.trim();
      
      if (line === 'BEGIN:VEVENT') {
        currentEvent = {};
      } else if (line === 'END:VEVENT' && currentEvent) {
        // 🔥 FILTRO: Esclude festività e blocchi Airbnb - sincronizza SOLO prenotazioni
        if (currentEvent.dtstart && currentEvent.dtend && this.isValidBooking({ ...currentEvent, calendar_source: platform })) {
          events.push({
            uid: currentEvent.uid || '',
            summary: currentEvent.summary || 'Prenotazione',
            start: this.parseICalDate(currentEvent.dtstart),
            end: this.parseICalDate(currentEvent.dtend),
            description: currentEvent.description || '',
            location: currentEvent.location || '',
            eventType: this.classifyEvent(currentEvent.summary || '')
          });
        }
        currentEvent = null;
      } else if (currentEvent && line.includes(':')) {
        const [key, ...values] = line.split(':');
        const value = values.join(':').trim();
        
        const cleanKey = key.split(';')[0].toLowerCase();
        currentEvent[cleanKey] = value;
      }
    }

    return events;
  }

  /**
   * Classifica il tipo di evento dal summary per filtrare festività/blocchi
   */
  classifyEvent(summary) {
    if (!summary) return 'unknown';
    
    const s = summary.toLowerCase();
    
    // Festività/Vacanze
    if (s.includes('holiday') || s.includes('festività') || s.includes('vacation') || s.includes('break') || s.includes('festa')) {
      return 'holiday';
    }
    
    // Blocchi/Unavailable
    if (s.includes('blocked') || s.includes('unavailable') || s.includes('not available') || s.includes('block') || s.includes('bloccato')) {
      return 'blocked';
    }
    
    // Maintenance/Cleaning
    if (s.includes('maintenance') || s.includes('manutenzione') || s.includes('cleaning') || s.includes('pulizie') || s.includes('manutenzione')) {
      return 'maintenance';
    }
    
    // Prenotazioni (default)
    return 'booking';
  }

  /**
   * Valida se un evento è una prenotazione valida
   */
  isValidBooking(event) {
    // 🚫 CHECK GLOBALE: Se lo status è CANCELLED, ignora sempre
    if (event.status && event.status.toUpperCase() === 'CANCELLED') {
      return false;
    }

    // 🚫 CHECK SUMMARY: Se il summary contiene "Cancelled", ignora (Safety Check)
    if (event.summary && (event.summary.toLowerCase().includes('canceled') || event.summary.toLowerCase().includes('cancelled'))) {
      return false;
    }

    // 🚫 CHECK TRANSPARENCY: Se è TRANSPARENT, significa che non blocca il calendario
    if (event.transp && event.transp.toUpperCase() === 'TRANSPARENT') {
      return false;
    }

    if (!event.summary) return true; 
    
    // Se è da Booking.com, MANTIENI anche i "CLOSED" (chiusure reali del host)
    if (event.calendar_source === 'booking') {
      return true; 
    }
    
    // Se è da Airbnb, FILTRA i blocchi/festività
    if (event.calendar_source === 'airbnb') {
      const eventType = this.classifyEvent(event.summary);
      return eventType === 'booking';
    }
    
    // Se è da Holidu, FILTRA SOLO i blocchi di sistema (unavailable)
    if (event.calendar_source === 'holidu') {
      const summary = event.summary?.toLowerCase() || '';
      if (summary.includes('unavailable') || summary.includes('not available') || 
          summary.includes('non disponibile') || summary.includes('non-available')) {
        return false; 
      }
      return true;
    }
    
    const eventType = this.classifyEvent(event.summary);
    return eventType === 'booking';
  }

  /**
   * Parse data iCal in oggetto Date JavaScript
   */
  parseICalDate(icalDate) {
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
  async saveEventsToDatabase(events, calendarSource, platform) {
    console.log(`💾 Salvando ${events.length} eventi da ${calendarSource} (${platform})`);
    
    if (!events.length) return 0;

    try {
      // Connessione al database
      let pool;
      try {
        const dbUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL;
        pool = new Pool({
          connectionString: dbUrl,
          ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
        });
      } catch (dbError) {
        console.log(`⚠️ Database non disponibile per ${calendarSource}:`, dbError.message);
        return events.length; 
      }

      let savedCount = 0;

      // Crea tabella se non esiste (già fatto in unified.js ma per sicurezza)
      await pool.query(`
        CREATE TABLE IF NOT EXISTS calendar_events (
          id SERIAL PRIMARY KEY,
          uid TEXT UNIQUE NOT NULL,
          calendar_source VARCHAR(50) NOT NULL,
          platform VARCHAR(50),
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
          const eventUid = event.uid || `${calendarSource}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          
          const result = await pool.query(`
            INSERT INTO calendar_events (uid, calendar_source, platform, summary, description, start_date, end_date, location)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            ON CONFLICT (uid) 
            DO UPDATE SET 
              summary = EXCLUDED.summary,
              description = EXCLUDED.description,
              start_date = EXCLUDED.start_date,
              end_date = EXCLUDED.end_date,
              location = EXCLUDED.location,
              platform = EXCLUDED.platform,
              updated_at = NOW()
            RETURNING id
          `, [
            eventUid,
            calendarSource,
            platform || 'unknown',
            event.summary,
            event.description || '',
            event.start,
            event.end,
            event.location || ''
          ]);

          if (result.rowCount > 0) savedCount++;
        } catch (eventError) {
          console.error(`❌ Errore salvando evento ${event.uid}:`, eventError.message);
        }
      }

      // 🧹 PULIZIA: Rimuovi eventi futuri nel DB che non sono più presenti nel feed (Cancellazioni)
      const activeUids = events.map(e => e.uid).filter(u => u && u.length > 0);

      if (activeUids.length > 0) {
        const placeholders = activeUids.map((_, i) => `$${i + 2}`).join(',');
        
        const deleteQuery = `
          DELETE FROM calendar_events 
          WHERE calendar_source = $1 
            AND end_date >= NOW() 
            AND uid NOT IN (${placeholders})
        `;
        
        await pool.query(deleteQuery, [calendarSource, ...activeUids]);
      } else if (events.length === 0) {
        // Se il feed è vuoto ma avevamo eventi futuri, cancella tutto per questa sorgente
        await pool.query(`
          DELETE FROM calendar_events 
          WHERE calendar_source = $1 
            AND end_date >= NOW()
        `, [calendarSource]);
      }

      await pool.end();
      return savedCount;
      
    } catch (error) {
      console.error('❌ Errore database:', error.message);
      return events.length; 
    }
  }

  /**
   * Ottieni status generale sincronizzazione dal database
   */
  async getStatus() {
    // ... (metodo getStatus invariato, utile per il frontend)
    return { status: 'active' }; // Placeholder se non serve implementazione completa qui
  }
}

// Handler API per Vercel/Next.js
export default async function handler(req, res) {
  // Permetti GET per i Cron Jobs automatici e POST per trigger manuali
  if (req.method !== 'POST' && req.method !== 'GET') {
    res.status(405).json({ error: 'Metodo non consentito. Usa GET (Cron) o POST (Manuale).' });
    return;
  }
  // Protezione opzionale tramite token di sincronizzazione
  try {
    const requiredToken = process.env.CALENDAR_SYNC_TOKEN;
    const providedToken = req.headers['x-sync-token'];
    if (requiredToken) {
      if (!providedToken || providedToken !== requiredToken) {
        res.status(401).json({ error: 'Token di sincronizzazione non valido o assente' });
        return;
      }
    }
  } catch (_) {
    // nessuna azione: protezione opzionale
  }
  try {
    const sync = new RealCalendarSync();
    const result = await sync.syncAll();
    const status = await sync.getStatus().catch(() => null);
    res.status(200).json({ success: true, result, status });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
