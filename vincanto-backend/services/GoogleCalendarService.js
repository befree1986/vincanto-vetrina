/**
 * Google Calendar Service - Gestione integrazione Google Calendar API
 * Vincanto Admin System - Professional Calendar Management
 */

const { google } = require('googleapis');
const fs = require('fs').promises;
const path = require('path');

class GoogleCalendarService {
  constructor() {
    this.oauth2Client = null;
    this.calendar = null;
    this.credentials = {
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      redirect_uri: process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/auth/google/callback'
    };
    
    this.scopes = [
      'https://www.googleapis.com/auth/calendar',
      'https://www.googleapis.com/auth/calendar.events'
    ];
    
    this.tokenPath = path.join(__dirname, '..', 'config', 'google-tokens.json');
    this.initialize();
  }

  /**
   * Inizializza il client OAuth2
   */
  initialize() {
    try {
      this.oauth2Client = new google.auth.OAuth2(
        this.credentials.client_id,
        this.credentials.client_secret,
        this.credentials.redirect_uri
      );

      this.calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });
      
      // Carica i token salvati se esistenti
      this.loadSavedTokens();
      
      console.log('✅ GoogleCalendarService inizializzato');
    } catch (error) {
      console.error('❌ Errore inizializzazione GoogleCalendarService:', error.message);
    }
  }

  /**
   * Genera URL per l'autorizzazione OAuth2
   */
  getAuthUrl() {
    if (!this.oauth2Client) {
      throw new Error('OAuth2 client non inizializzato');
    }

    const authUrl = this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: this.scopes,
      prompt: 'consent' // Force consent per ottenere refresh token
    });

    return authUrl;
  }

  /**
   * Scambia il codice di autorizzazione con i token
   */
  async exchangeCodeForTokens(code) {
    try {
      const { tokens } = await this.oauth2Client.getToken(code);
      this.oauth2Client.setCredentials(tokens);
      
      // Salva i token per uso futuro
      await this.saveTokens(tokens);
      
      console.log('✅ Token Google Calendar ottenuti e salvati');
      return tokens;
    } catch (error) {
      console.error('❌ Errore scambio codice per token:', error.message);
      throw error;
    }
  }

  /**
   * Salva i token nel file system
   */
  async saveTokens(tokens) {
    try {
      const configDir = path.dirname(this.tokenPath);
      await fs.mkdir(configDir, { recursive: true });
      await fs.writeFile(this.tokenPath, JSON.stringify(tokens, null, 2));
      console.log('💾 Token salvati in:', this.tokenPath);
    } catch (error) {
      console.error('❌ Errore salvataggio token:', error.message);
    }
  }

  /**
   * Carica i token salvati
   */
  async loadSavedTokens() {
    try {
      const tokenData = await fs.readFile(this.tokenPath, 'utf8');
      const tokens = JSON.parse(tokenData);
      this.oauth2Client.setCredentials(tokens);
      console.log('✅ Token Google Calendar caricati');
      return tokens;
    } catch (error) {
      console.log('⚠️ Nessun token salvato trovato');
      return null;
    }
  }

  /**
   * Verifica se è autenticato
   */
  isAuthenticated() {
    return this.oauth2Client && this.oauth2Client.credentials && this.oauth2Client.credentials.access_token;
  }

  /**
   * Refresh del token se necessario
   */
  async refreshTokenIfNeeded() {
    if (!this.oauth2Client.credentials.refresh_token) {
      throw new Error('Refresh token non disponibile');
    }

    try {
      const { credentials } = await this.oauth2Client.refreshAccessToken();
      this.oauth2Client.setCredentials(credentials);
      await this.saveTokens(credentials);
      console.log('✅ Token Google Calendar refreshed');
      return credentials;
    } catch (error) {
      console.error('❌ Errore refresh token:', error.message);
      throw error;
    }
  }

  /**
   * Lista i calendari dell'utente
   */
  async listCalendars() {
    if (!this.isAuthenticated()) {
      throw new Error('Non autenticato con Google Calendar');
    }

    try {
      const response = await this.calendar.calendarList.list();
      return response.data.items || [];
    } catch (error) {
      console.error('❌ Errore lista calendari:', error.message);
      throw error;
    }
  }

  /**
   * Ottiene eventi da un calendario specifico
   */
  async getEvents(calendarId = 'primary', timeMin = null, timeMax = null) {
    if (!this.isAuthenticated()) {
      throw new Error('Non autenticato con Google Calendar');
    }

    try {
      const params = {
        calendarId: calendarId,
        timeMin: timeMin || new Date().toISOString(),
        timeMax: timeMax,
        maxResults: 2500,
        singleEvents: true,
        orderBy: 'startTime'
      };

      const response = await this.calendar.events.list(params);
      return response.data.items || [];
    } catch (error) {
      console.error('❌ Errore recupero eventi:', error.message);
      throw error;
    }
  }

  /**
   * Crea un nuovo evento nel calendario
   */
  async createEvent(calendarId = 'primary', eventData) {
    if (!this.isAuthenticated()) {
      throw new Error('Non autenticato con Google Calendar');
    }

    try {
      const event = {
        summary: eventData.title,
        description: eventData.description,
        start: {
          dateTime: eventData.startDateTime,
          timeZone: 'Europe/Rome'
        },
        end: {
          dateTime: eventData.endDateTime,
          timeZone: 'Europe/Rome'
        },
        attendees: eventData.attendees || [],
        reminders: {
          useDefault: false,
          overrides: [
            { method: 'email', minutes: 24 * 60 }, // 1 giorno prima
            { method: 'popup', minutes: 60 }       // 1 ora prima
          ]
        }
      };

      const response = await this.calendar.events.insert({
        calendarId: calendarId,
        resource: event
      });

      console.log('✅ Evento creato:', response.data.id);
      return response.data;
    } catch (error) {
      console.error('❌ Errore creazione evento:', error.message);
      throw error;
    }
  }

  /**
   * Aggiorna un evento esistente
   */
  async updateEvent(calendarId = 'primary', eventId, eventData) {
    if (!this.isAuthenticated()) {
      throw new Error('Non autenticato con Google Calendar');
    }

    try {
      const response = await this.calendar.events.update({
        calendarId: calendarId,
        eventId: eventId,
        resource: eventData
      });

      console.log('✅ Evento aggiornato:', eventId);
      return response.data;
    } catch (error) {
      console.error('❌ Errore aggiornamento evento:', error.message);
      throw error;
    }
  }

  /**
   * Elimina un evento
   */
  async deleteEvent(calendarId = 'primary', eventId) {
    if (!this.isAuthenticated()) {
      throw new Error('Non autenticato con Google Calendar');
    }

    try {
      await this.calendar.events.delete({
        calendarId: calendarId,
        eventId: eventId
      });

      console.log('✅ Evento eliminato:', eventId);
      return true;
    } catch (error) {
      console.error('❌ Errore eliminazione evento:', error.message);
      throw error;
    }
  }

  /**
   * Sincronizza prenotazioni dal database a Google Calendar
   */
  async syncBookingsToCalendar(bookings, calendarId = 'primary') {
    if (!this.isAuthenticated()) {
      throw new Error('Non autenticato con Google Calendar');
    }

    const results = {
      created: 0,
      updated: 0,
      errors: 0,
      details: []
    };

    for (const booking of bookings) {
      try {
        const eventData = {
          title: `[VINCANTO] ${booking.customer_name} - ${booking.guests} ospiti`,
          description: `
🏡 Prenotazione Vincanto Maori
👤 Cliente: ${booking.customer_name}
📧 Email: ${booking.customer_email}
🛏️ Ospiti: ${booking.guests}
💰 Totale: €${booking.total_amount}
🌐 Piattaforma: ${booking.platform}
📋 Stato: ${booking.status}

Check-in: ${booking.check_in}
Check-out: ${booking.check_out}
          `.trim(),
          startDateTime: new Date(booking.check_in + 'T15:00:00'),
          endDateTime: new Date(booking.check_out + 'T11:00:00'),
          attendees: [{ email: booking.customer_email }]
        };

        // Controlla se l'evento esiste già (basato su ID prenotazione)
        const existingEvents = await this.getEvents(calendarId);
        const existingEvent = existingEvents.find(event => 
          event.description && event.description.includes(`ID: ${booking.id}`)
        );

        if (existingEvent) {
          await this.updateEvent(calendarId, existingEvent.id, eventData);
          results.updated++;
        } else {
          await this.createEvent(calendarId, eventData);
          results.created++;
        }

        results.details.push({
          bookingId: booking.id,
          action: existingEvent ? 'updated' : 'created',
          status: 'success'
        });

      } catch (error) {
        results.errors++;
        results.details.push({
          bookingId: booking.id,
          action: 'error',
          status: 'failed',
          error: error.message
        });
      }
    }

    console.log('📅 Sincronizzazione completata:', results);
    return results;
  }

  /**
   * Test della connessione
   */
  async testConnection() {
    try {
      if (!this.isAuthenticated()) {
        return {
          success: false,
          message: 'Non autenticato con Google Calendar'
        };
      }

      const calendars = await this.listCalendars();
      return {
        success: true,
        message: `Connesso a ${calendars.length} calendari`,
        data: calendars
      };
    } catch (error) {
      return {
        success: false,
        message: error.message
      };
    }
  }
}

module.exports = GoogleCalendarService;