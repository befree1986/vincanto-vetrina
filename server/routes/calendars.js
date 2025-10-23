/**
 * Calendar Management Routes
 * API endpoints per la gestione dei calendari esterni
 */

import express from 'express';
import CalendarSyncService from '../services/calendarSync.js';

const router = express.Router();

/**
 * GET /api/calendars
 * Recupera tutti i calendari esterni
 */
router.get('/', async (req, res) => {
  try {
    const calendars = await CalendarSyncService.getExternalCalendars();
    res.json({
      success: true,
      data: calendars
    });
  } catch (error) {
    console.error('Error fetching calendars:', error);
    res.status(500).json({
      success: false,
      error: 'Errore nel recupero dei calendari'
    });
  }
});

/**
 * POST /api/calendars
 * Aggiunge un nuovo calendario esterno
 */
router.post('/', async (req, res) => {
  try {
    const { name, platform, ical_url, owner_email } = req.body;

    // Validazione input
    if (!name || !platform || !ical_url) {
      return res.status(400).json({
        success: false,
        error: 'Nome, piattaforma e URL iCal sono obbligatori'
      });
    }

    // Validazione URL
    if (!ical_url.startsWith('http')) {
      return res.status(400).json({
        success: false,
        error: 'URL iCal non valido'
      });
    }

    const calendar = await CalendarSyncService.addExternalCalendar({
      name,
      platform,
      ical_url,
      owner_email
    });

    res.status(201).json({
      success: true,
      data: calendar,
      message: 'Calendario aggiunto con successo'
    });

  } catch (error) {
    console.error('Error adding calendar:', error);
    res.status(500).json({
      success: false,
      error: 'Errore nell\'aggiunta del calendario'
    });
  }
});

/**
 * PUT /api/calendars/:id/sync
 * Sincronizza un calendario specifico
 */
router.put('/:id/sync', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await CalendarSyncService.syncCalendar(id);

    if (result.success) {
      res.json({
        success: true,
        data: result,
        message: 'Sincronizzazione completata'
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error || 'Errore durante la sincronizzazione'
      });
    }

  } catch (error) {
    console.error('Error syncing calendar:', error);
    res.status(500).json({
      success: false,
      error: 'Errore nella sincronizzazione del calendario'
    });
  }
});

/**
 * PUT /api/calendars/sync-all
 * Sincronizza tutti i calendari attivi
 */
router.put('/sync-all', async (req, res) => {
  try {
    const results = await CalendarSyncService.syncAllCalendars();
    
    const successCount = results.filter(r => r.success).length;
    const errorCount = results.filter(r => !r.success).length;

    res.json({
      success: true,
      data: {
        results,
        summary: {
          total: results.length,
          successful: successCount,
          errors: errorCount
        }
      },
      message: `Sincronizzazione completata: ${successCount} successi, ${errorCount} errori`
    });

  } catch (error) {
    console.error('Error syncing all calendars:', error);
    res.status(500).json({
      success: false,
      error: 'Errore nella sincronizzazione di tutti i calendari'
    });
  }
});

/**
 * DELETE /api/calendars/:id
 * Rimuove un calendario esterno
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await CalendarSyncService.removeExternalCalendar(id);

    res.json({
      success: true,
      message: 'Calendario rimosso con successo'
    });

  } catch (error) {
    console.error('Error removing calendar:', error);
    res.status(500).json({
      success: false,
      error: 'Errore nella rimozione del calendario'
    });
  }
});

/**
 * GET /api/calendars/external-bookings
 * Recupera prenotazioni da calendari esterni per un periodo
 */
router.get('/external-bookings', async (req, res) => {
  try {
    const { start_date, end_date } = req.query;

    if (!start_date || !end_date) {
      return res.status(400).json({
        success: false,
        error: 'Date di inizio e fine sono obbligatorie'
      });
    }

    const bookings = await CalendarSyncService.getExternalBookings(
      new Date(start_date),
      new Date(end_date)
    );

    res.json({
      success: true,
      data: bookings
    });

  } catch (error) {
    console.error('Error fetching external bookings:', error);
    res.status(500).json({
      success: false,
      error: 'Errore nel recupero delle prenotazioni esterne'
    });
  }
});

/**
 * GET /api/calendars/availability-check
 * Verifica disponibilità considerando calendari esterni
 */
router.get('/availability-check', async (req, res) => {
  try {
    const { start_date, end_date } = req.query;

    if (!start_date || !end_date) {
      return res.status(400).json({
        success: false,
        error: 'Date di inizio e fine sono obbligatorie'
      });
    }

    const availability = await CalendarSyncService.checkAvailabilityWithExternals(
      new Date(start_date),
      new Date(end_date)
    );

    res.json({
      success: true,
      data: availability
    });

  } catch (error) {
    console.error('Error checking availability:', error);
    res.status(500).json({
      success: false,
      error: 'Errore nella verifica della disponibilità'
    });
  }
});

/**
 * GET /api/calendars/sync-stats
 * Statistiche di sincronizzazione
 */
router.get('/sync-stats', async (req, res) => {
  try {
    const stats = await CalendarSyncService.getSyncStats();
    
    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('Error fetching sync stats:', error);
    res.status(500).json({
      success: false,
      error: 'Errore nel recupero delle statistiche'
    });
  }
});

export default router;