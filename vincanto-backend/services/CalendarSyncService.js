/**
 * Calendar Sync Service - Sincronizzazione automatica calendari
 * Vincanto Admin System - Professional Calendar Management
 */

const GoogleCalendarService = require('./GoogleCalendarService');
const ICalService = require('./ICalService');
const axios = require('axios');

class CalendarSyncService {
  constructor(db) {
    this.db = db;
    this.googleCalendar = new GoogleCalendarService();
    this.iCalService = new ICalService();
    this.syncIntervals = new Map(); // Store sync intervals
    this.isInitialized = false;
  }

  /**
   * Inizializza il servizio di sincronizzazione
   */
  async initialize() {
    try {
      console.log('🔄 Inizializzazione CalendarSyncService...');
      
      // Carica tutte le configurazioni calendario attive
      const configs = await this.getActiveCalendarConfigs();
      
      // Avvia la sincronizzazione automatica per ogni configurazione
      for (const config of configs) {
        if (config.is_active) {
          this.startAutoSync(config);
        }
      }
      
      this.isInitialized = true;
      console.log(`✅ CalendarSyncService inizializzato con ${configs.length} calendari attivi`);
    } catch (error) {
      console.error('❌ Errore inizializzazione CalendarSyncService:', error);
    }
  }

  /**
   * Ottiene tutte le configurazioni calendario attive
   */
  async getActiveCalendarConfigs() {
    try {
      const query = `
        SELECT * FROM calendar_configs 
        WHERE is_active = true 
        ORDER BY created_at ASC
      `;
      const result = await this.db.query(query);
      return result.rows || [];
    } catch (error) {
      console.error('❌ Errore recupero configurazioni calendario:', error);
      return [];
    }
  }

  /**
   * Avvia la sincronizzazione automatica per una configurazione
   */
  startAutoSync(config) {
    const intervalMs = (config.sync_frequency || 30) * 60 * 1000; // Converti minuti in millisecondi
    
    console.log(`🔄 Avvio sync automatica per ${config.name} ogni ${config.sync_frequency} minuti`);
    
    const interval = setInterval(async () => {
      try {
        await this.syncCalendar(config.id);
      } catch (error) {
        console.error(`❌ Errore sync automatica ${config.name}:`, error.message);
      }
    }, intervalMs);
    
    this.syncIntervals.set(config.id, interval);
    
    // Esegui una sincronizzazione immediata
    setTimeout(() => this.syncCalendar(config.id), 5000);
  }

  /**
   * Ferma la sincronizzazione automatica per una configurazione
   */
  stopAutoSync(configId) {
    if (this.syncIntervals.has(configId)) {
      clearInterval(this.syncIntervals.get(configId));
      this.syncIntervals.delete(configId);
      console.log(`⏹️ Sync automatica fermata per configurazione ${configId}`);
    }
  }

  /**
   * Sincronizza un singolo calendario
   */
  async syncCalendar(configId) {
    const startTime = Date.now();
    
    try {
      console.log(`📅 Inizio sincronizzazione calendario ${configId}...`);
      
      // Ottieni la configurazione
      const config = await this.getCalendarConfig(configId);
      if (!config) {
        throw new Error(`Configurazione ${configId} non trovata`);
      }

      let syncResult = {};
      
      // Sincronizza in base al tipo di calendario
      switch (config.calendar_type) {
        case 'google_calendar':
          syncResult = await this.syncGoogleCalendar(config);
          break;
        
        case 'airbnb':
        case 'booking_com':
        case 'vrbo':
        case 'holidu':
        case 'ical_external':
          syncResult = await this.syncICalFeed(config);
          break;
        
        default:
          throw new Error(`Tipo calendario non supportato: ${config.calendar_type}`);
      }

      // Registra il risultato della sincronizzazione
      await this.logSyncResult(configId, 'success', syncResult, Date.now() - startTime);
      
      console.log(`✅ Sincronizzazione completata per ${config.name}:`, syncResult);
      return syncResult;
      
    } catch (error) {
      console.error(`❌ Errore sincronizzazione ${configId}:`, error.message);
      await this.logSyncResult(configId, 'error', { error: error.message }, Date.now() - startTime);
      throw error;
    }
  }

  /**
   * Sincronizza con Google Calendar (bidirezionale)
   */
  async syncGoogleCalendar(config) {
    if (!this.googleCalendar.isAuthenticated()) {
      throw new Error('Google Calendar non autenticato');
    }

    // 1. Importa eventi da Google Calendar
    const googleEvents = await this.googleCalendar.getEvents(config.credentials);
    let importedEvents = 0;
    
    for (const event of googleEvents) {
      // Converti eventi Google in prenotazioni se necessario
      if (this.isBookingEvent(event)) {
        const booking = await this.convertGoogleEventToBooking(event);
        await this.createOrUpdateBooking(booking);
        importedEvents++;
      }
    }

    // 2. Esporta prenotazioni locali a Google Calendar
    const localBookings = await this.getRecentBookings();
    const syncResult = await this.googleCalendar.syncBookingsToCalendar(localBookings, config.credentials);

    return {
      type: 'google_calendar',
      imported_events: importedEvents,
      exported_bookings: syncResult.created + syncResult.updated,
      errors: syncResult.errors
    };
  }

  /**
   * Sincronizza con feed iCal esterno
   */
  async syncICalFeed(config) {
    try {
      // Scarica il feed iCal
      const response = await axios.get(config.url, {
        timeout: 30000,
        headers: {
          'User-Agent': 'Vincanto Calendar Sync Service 1.0'
        }
      });

      // Parsa il contenuto iCal
      const events = this.iCalService.parseICalData(response.data);
      let processedEvents = 0;
      
      // Processa ogni evento
      for (const event of events) {
        // Converti evento iCal in prenotazione
        const booking = await this.convertICalEventToBooking(event, config.calendar_type);
        
        if (booking) {
          await this.createOrUpdateBooking(booking);
          processedEvents++;
        }
      }

      return {
        type: config.calendar_type,
        imported_events: processedEvents,
        total_events: events.length,
        source_url: config.url
      };

    } catch (error) {
      if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
        throw new Error(`Impossibile raggiungere ${config.url}`);
      }
      throw error;
    }
  }

  /**
   * Converte un evento Google in una prenotazione
   */
  async convertGoogleEventToBooking(googleEvent) {
    const startDate = new Date(googleEvent.start.dateTime || googleEvent.start.date);
    const endDate = new Date(googleEvent.end.dateTime || googleEvent.end.date);
    
    return {
      external_id: googleEvent.id,
      customer_name: this.extractCustomerName(googleEvent.summary),
      customer_email: this.extractCustomerEmail(googleEvent.description),
      check_in: startDate.toISOString().split('T')[0],
      check_out: endDate.toISOString().split('T')[0],
      guests: this.extractGuestCount(googleEvent.description) || 2,
      total_amount: this.extractAmount(googleEvent.description) || 0,
      status: 'confirmed',
      platform: 'google_calendar',
      source: 'google_sync',
      created_at: new Date()
    };
  }

  /**
   * Converte un evento iCal in una prenotazione
   */
  async convertICalEventToBooking(icalEvent, platform) {
    return {
      external_id: icalEvent.uid,
      customer_name: icalEvent.summary || 'Guest',
      customer_email: this.extractEmailFromEvent(icalEvent),
      check_in: icalEvent.start.toISOString().split('T')[0],
      check_out: icalEvent.end.toISOString().split('T')[0],
      guests: this.extractGuestCount(icalEvent.description) || 2,
      total_amount: 0, // Non sempre disponibile nei feed iCal
      status: 'confirmed',
      platform: platform,
      source: 'ical_sync',
      created_at: new Date()
    };
  }

  /**
   * Crea o aggiorna una prenotazione nel database
   */
  async createOrUpdateBooking(bookingData) {
    try {
      // Controlla se la prenotazione esiste già (basata su external_id)
      const existingQuery = `
        SELECT id FROM bookings 
        WHERE external_id = $1 OR (
          customer_email = $2 AND 
          check_in = $3 AND 
          check_out = $4
        )
        LIMIT 1
      `;
      
      const existing = await this.db.query(existingQuery, [
        bookingData.external_id,
        bookingData.customer_email,
        bookingData.check_in,
        bookingData.check_out
      ]);

      if (existing.rows.length > 0) {
        // Aggiorna prenotazione esistente
        const updateQuery = `
          UPDATE bookings SET
            customer_name = $1,
            customer_email = $2,
            guests = $3,
            status = $4,
            updated_at = NOW()
          WHERE id = $5
          RETURNING *
        `;
        
        const result = await this.db.query(updateQuery, [
          bookingData.customer_name,
          bookingData.customer_email,
          bookingData.guests,
          bookingData.status,
          existing.rows[0].id
        ]);
        
        return { action: 'updated', booking: result.rows[0] };
      } else {
        // Crea nuova prenotazione
        const insertQuery = `
          INSERT INTO bookings (
            external_id, customer_name, customer_email, check_in, check_out,
            guests, total_amount, status, platform, source, created_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
          RETURNING *
        `;
        
        const result = await this.db.query(insertQuery, [
          bookingData.external_id,
          bookingData.customer_name,
          bookingData.customer_email,
          bookingData.check_in,
          bookingData.check_out,
          bookingData.guests,
          bookingData.total_amount,
          bookingData.status,
          bookingData.platform,
          bookingData.source,
          bookingData.created_at
        ]);
        
        return { action: 'created', booking: result.rows[0] };
      }
    } catch (error) {
      console.error('❌ Errore creazione/aggiornamento prenotazione:', error);
      throw error;
    }
  }

  /**
   * Utility functions per l'estrazione dati
   */
  extractCustomerName(summary) {
    if (!summary) return 'Guest';
    
    // Rimuovi prefissi comuni
    const cleaned = summary
      .replace(/^\[VINCANTO\]|\[AIRBNB\]|\[BOOKING\]/i, '')
      .replace(/^\s*-\s*/, '')
      .trim();
    
    return cleaned.split('-')[0].trim() || 'Guest';
  }

  extractCustomerEmail(description) {
    if (!description) return null;
    
    const emailMatch = description.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
    return emailMatch ? emailMatch[0] : null;
  }

  extractGuestCount(description) {
    if (!description) return null;
    
    const guestMatch = description.match(/(\d+)\s*ospit[ei]/i) || 
                      description.match(/guests?\s*:?\s*(\d+)/i);
    return guestMatch ? parseInt(guestMatch[1]) : null;
  }

  extractAmount(description) {
    if (!description) return null;
    
    const amountMatch = description.match(/€\s*(\d+(?:[.,]\d{2})?)|(\d+(?:[.,]\d{2})?)\s*€/);
    return amountMatch ? parseFloat(amountMatch[1] || amountMatch[2]) : null;
  }

  isBookingEvent(event) {
    return event.summary && !event.summary.toLowerCase().includes('disponibile');
  }

  /**
   * Ottiene prenotazioni recenti per l'export
   */
  async getRecentBookings(days = 365) {
    const query = `
      SELECT * FROM bookings 
      WHERE check_out >= CURRENT_DATE - INTERVAL '${days} days'
      ORDER BY check_in ASC
    `;
    
    const result = await this.db.query(query);
    return result.rows || [];
  }

  /**
   * Ottiene configurazione calendario per ID
   */
  async getCalendarConfig(configId) {
    const query = 'SELECT * FROM calendar_configs WHERE id = $1';
    const result = await this.db.query(query, [configId]);
    return result.rows[0] || null;
  }

  /**
   * Registra il risultato di una sincronizzazione
   */
  async logSyncResult(configId, status, result, duration) {
    try {
      const query = `
        INSERT INTO calendar_sync_log (
          calendar_config_id, sync_type, status, events_processed,
          conflicts_found, error_message, sync_started_at, sync_completed_at
        ) VALUES ($1, $2, $3, $4, $5, $6, NOW() - INTERVAL '${duration} milliseconds', NOW())
      `;
      
      await this.db.query(query, [
        configId,
        'import',
        status,
        result.imported_events || result.total_events || 0,
        result.conflicts || 0,
        result.error || null
      ]);
    } catch (error) {
      console.error('❌ Errore logging sync result:', error);
    }
  }

  /**
   * Sincronizzazione forzata di tutti i calendari
   */
  async forceFullSync() {
    const configs = await this.getActiveCalendarConfigs();
    const results = [];
    
    for (const config of configs) {
      try {
        const result = await this.syncCalendar(config.id);
        results.push({ configId: config.id, name: config.name, ...result });
      } catch (error) {
        results.push({ 
          configId: config.id, 
          name: config.name, 
          error: error.message 
        });
      }
    }
    
    return results;
  }

  /**
   * Cleanup - ferma tutti gli intervalli attivi
   */
  cleanup() {
    for (const [configId, interval] of this.syncIntervals) {
      clearInterval(interval);
    }
    this.syncIntervals.clear();
    console.log('🧹 CalendarSyncService cleanup completato');
  }
}

module.exports = CalendarSyncService;