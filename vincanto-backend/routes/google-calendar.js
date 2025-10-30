/**
 * Google Calendar Routes - API endpoints per Google Calendar integration
 * Vincanto Admin System - Professional Calendar Management
 */

const express = require('express');
const router = express.Router();
const GoogleCalendarService = require('../services/GoogleCalendarService');

// Inizializza il servizio Google Calendar
const googleCalendar = new GoogleCalendarService();

/**
 * GET /api/google-calendar/auth-url
 * Genera URL per l'autorizzazione OAuth2 Google
 */
router.get('/auth-url', async (req, res) => {
  try {
    const authUrl = googleCalendar.getAuthUrl();
    
    res.json({
      success: true,
      authUrl: authUrl,
      message: 'URL di autorizzazione generato'
    });
  } catch (error) {
    console.error('❌ Errore generazione URL auth:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * POST /api/google-calendar/callback
 * Gestisce il callback OAuth2 e scambia il codice con i token
 */
router.post('/callback', async (req, res) => {
  try {
    const { code } = req.body;
    
    if (!code) {
      return res.status(400).json({
        success: false,
        message: 'Codice di autorizzazione mancante'
      });
    }
    
    const tokens = await googleCalendar.exchangeCodeForTokens(code);
    
    res.json({
      success: true,
      message: 'Autorizzazione completata con successo',
      data: {
        hasRefreshToken: !!tokens.refresh_token,
        expiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : null
      }
    });
  } catch (error) {
    console.error('❌ Errore callback OAuth:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * GET /api/google-calendar/status
 * Verifica lo stato dell'autenticazione
 */
router.get('/status', async (req, res) => {
  try {
    const isAuthenticated = googleCalendar.isAuthenticated();
    
    res.json({
      success: true,
      data: {
        isAuthenticated: isAuthenticated,
        message: isAuthenticated ? 'Autenticato' : 'Non autenticato'
      }
    });
  } catch (error) {
    console.error('❌ Errore verifica status:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * GET /api/google-calendar/calendars
 * Lista tutti i calendari dell'utente
 */
router.get('/calendars', async (req, res) => {
  try {
    if (!googleCalendar.isAuthenticated()) {
      return res.status(401).json({
        success: false,
        message: 'Non autenticato con Google Calendar'
      });
    }
    
    const calendars = await googleCalendar.listCalendars();
    
    res.json({
      success: true,
      data: calendars,
      count: calendars.length
    });
  } catch (error) {
    console.error('❌ Errore lista calendari:', error);
    
    // Gestisci token scaduto
    if (error.message.includes('invalid_grant') || error.message.includes('unauthorized')) {
      return res.status(401).json({
        success: false,
        message: 'Token scaduto, riautorizzazione richiesta',
        needsAuth: true
      });
    }
    
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * GET /api/google-calendar/events
 * Ottiene eventi da un calendario specifico
 */
router.get('/events', async (req, res) => {
  try {
    if (!googleCalendar.isAuthenticated()) {
      return res.status(401).json({
        success: false,
        message: 'Non autenticato con Google Calendar'
      });
    }
    
    const { 
      calendarId = 'primary', 
      timeMin, 
      timeMax 
    } = req.query;
    
    const events = await googleCalendar.getEvents(calendarId, timeMin, timeMax);
    
    res.json({
      success: true,
      data: events,
      count: events.length,
      calendarId: calendarId
    });
  } catch (error) {
    console.error('❌ Errore recupero eventi:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * POST /api/google-calendar/events
 * Crea un nuovo evento nel calendario
 */
router.post('/events', async (req, res) => {
  try {
    if (!googleCalendar.isAuthenticated()) {
      return res.status(401).json({
        success: false,
        message: 'Non autenticato con Google Calendar'
      });
    }
    
    const { calendarId = 'primary', eventData } = req.body;
    
    if (!eventData) {
      return res.status(400).json({
        success: false,
        message: 'Dati evento mancanti'
      });
    }
    
    const createdEvent = await googleCalendar.createEvent(calendarId, eventData);
    
    res.json({
      success: true,
      data: createdEvent,
      message: 'Evento creato con successo'
    });
  } catch (error) {
    console.error('❌ Errore creazione evento:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * PUT /api/google-calendar/events/:eventId
 * Aggiorna un evento esistente
 */
router.put('/events/:eventId', async (req, res) => {
  try {
    if (!googleCalendar.isAuthenticated()) {
      return res.status(401).json({
        success: false,
        message: 'Non autenticato con Google Calendar'
      });
    }
    
    const { eventId } = req.params;
    const { calendarId = 'primary', eventData } = req.body;
    
    const updatedEvent = await googleCalendar.updateEvent(calendarId, eventId, eventData);
    
    res.json({
      success: true,
      data: updatedEvent,
      message: 'Evento aggiornato con successo'
    });
  } catch (error) {
    console.error('❌ Errore aggiornamento evento:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * DELETE /api/google-calendar/events/:eventId
 * Elimina un evento
 */
router.delete('/events/:eventId', async (req, res) => {
  try {
    if (!googleCalendar.isAuthenticated()) {
      return res.status(401).json({
        success: false,
        message: 'Non autenticato con Google Calendar'
      });
    }
    
    const { eventId } = req.params;
    const { calendarId = 'primary' } = req.query;
    
    await googleCalendar.deleteEvent(calendarId, eventId);
    
    res.json({
      success: true,
      message: 'Evento eliminato con successo'
    });
  } catch (error) {
    console.error('❌ Errore eliminazione evento:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * POST /api/google-calendar/sync
 * Sincronizza prenotazioni dal database a Google Calendar
 */
router.post('/sync', async (req, res) => {
  try {
    if (!googleCalendar.isAuthenticated()) {
      return res.status(401).json({
        success: false,
        message: 'Non autenticato con Google Calendar'
      });
    }
    
    const { calendarId = 'primary', bookings } = req.body;
    
    if (!bookings || !Array.isArray(bookings)) {
      return res.status(400).json({
        success: false,
        message: 'Lista prenotazioni mancante o non valida'
      });
    }
    
    const syncResult = await googleCalendar.syncBookingsToCalendar(bookings, calendarId);
    
    res.json({
      success: true,
      data: syncResult,
      message: `Sincronizzazione completata: ${syncResult.created} creati, ${syncResult.updated} aggiornati, ${syncResult.errors} errori`
    });
  } catch (error) {
    console.error('❌ Errore sincronizzazione:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * GET /api/google-calendar/test
 * Test della connessione Google Calendar
 */
router.get('/test', async (req, res) => {
  try {
    const testResult = await googleCalendar.testConnection();
    
    res.json({
      success: testResult.success,
      message: testResult.message,
      data: testResult.data || null
    });
  } catch (error) {
    console.error('❌ Errore test connessione:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * POST /api/google-calendar/refresh-token
 * Forza il refresh del token
 */
router.post('/refresh-token', async (req, res) => {
  try {
    const newTokens = await googleCalendar.refreshTokenIfNeeded();
    
    res.json({
      success: true,
      message: 'Token refreshed con successo',
      data: {
        expiresAt: newTokens.expiry_date ? new Date(newTokens.expiry_date) : null
      }
    });
  } catch (error) {
    console.error('❌ Errore refresh token:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * GET /api/google-calendar/booking-events
 * Converte prenotazioni del database in eventi calendario
 */
router.get('/booking-events', async (req, res) => {
  try {
    // Questo endpoint dovrebbe recuperare prenotazioni dal database
    // e convertirle in formato evento calendario
    
    const db = req.app.get('db'); // Assumiamo che db sia disponibile nell'app
    
    if (!db) {
      return res.status(500).json({
        success: false,
        message: 'Database non disponibile'
      });
    }
    
    // Query prenotazioni recenti
    const query = `
      SELECT * FROM bookings 
      WHERE check_out >= CURRENT_DATE 
      ORDER BY check_in ASC 
      LIMIT 100
    `;
    
    const result = await db.query(query);
    const bookings = result.rows || [];
    
    // Converte prenotazioni in eventi
    const events = bookings.map(booking => ({
      id: `booking-${booking.id}`,
      title: `${booking.customer_name} (${booking.guests} ospiti)`,
      start: booking.check_in + 'T15:00:00',
      end: booking.check_out + 'T11:00:00',
      description: `Cliente: ${booking.customer_name}\nEmail: ${booking.customer_email}\nOspiti: ${booking.guests}\nPiattaforma: ${booking.platform}\nTotale: €${booking.total_amount}`,
      source: booking.platform,
      bookingId: booking.id,
      totalPrice: booking.total_amount
    }));
    
    res.json({
      success: true,
      data: events,
      count: events.length
    });
    
  } catch (error) {
    console.error('❌ Errore recupero booking events:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;