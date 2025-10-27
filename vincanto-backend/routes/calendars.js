/**
 * Routes per la gestione dei calendari
 * Endpoint REST per configurazioni calendario e sincronizzazione Google Calendar
 */

const express = require('express');
const router = express.Router();

// Storage temporaneo per configurazioni calendario
let calendarConfigs = {
  googleCalendar: {
    isConnected: false,
    calendarId: null,
    lastSync: null,
    syncEnabled: true,
    autoSync: false,
    syncInterval: 60 // minuti
  },
  availability: {
    defaultCheckInTime: '15:00',
    defaultCheckOutTime: '11:00',
    minimumStay: 2,
    maximumStay: 30,
    bufferDays: 1, // giorni di buffer tra prenotazioni
    weeklyDiscountThreshold: 7,
    monthlyDiscountThreshold: 30
  },
  blockedPeriods: [], // Array di periodi non disponibili
  customRates: [], // Array di tariffe personalizzate per date specifiche
  settings: {
    allowSameDayBooking: false,
    advanceBookingLimit: 365, // giorni
    instantBooking: false,
    requireApproval: true
  }
};

// GET /api/calendars - Ottieni tutte le configurazioni calendario
router.get('/', (req, res) => {
  try {
    res.json({
      success: true,
      data: calendarConfigs,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Errore nel recupero delle configurazioni calendario',
      error: error.message
    });
  }
});

// GET /api/calendars/:section - Ottieni una sezione specifica
router.get('/:section', (req, res) => {
  try {
    const { section } = req.params;
    
    if (!calendarConfigs[section]) {
      return res.status(404).json({
        success: false,
        message: `Sezione '${section}' non trovata`
      });
    }
    
    res.json({
      success: true,
      data: calendarConfigs[section],
      section: section,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Errore nel recupero della configurazione calendario',
      error: error.message
    });
  }
});

// PUT /api/calendars/:section - Aggiorna una sezione specifica
router.put('/:section', (req, res) => {
  try {
    const { section } = req.params;
    const updateData = req.body;
    
    if (!calendarConfigs[section]) {
      return res.status(404).json({
        success: false,
        message: `Sezione '${section}' non trovata`
      });
    }
    
    // Validazione specifica per sezioni
    if (section === 'availability') {
      if (updateData.minimumStay && updateData.minimumStay < 1) {
        return res.status(400).json({
          success: false,
          message: 'Il soggiorno minimo deve essere almeno 1 notte'
        });
      }
      if (updateData.maximumStay && updateData.maximumStay > 365) {
        return res.status(400).json({
          success: false,
          message: 'Il soggiorno massimo non può superare 365 giorni'
        });
      }
    }
    
    // Aggiorna la configurazione
    calendarConfigs[section] = { ...calendarConfigs[section], ...updateData };
    
    res.json({
      success: true,
      message: `Configurazione calendario '${section}' aggiornata`,
      data: calendarConfigs[section],
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Errore nell\'aggiornamento della configurazione calendario',
      error: error.message
    });
  }
});

// POST /api/calendars/google/connect - Connetti Google Calendar
router.post('/google/connect', (req, res) => {
  try {
    const { calendarId, accessToken } = req.body;
    
    if (!calendarId || !accessToken) {
      return res.status(400).json({
        success: false,
        message: 'CalendarId e accessToken richiesti'
      });
    }
    
    // Simula connessione Google Calendar
    calendarConfigs.googleCalendar = {
      ...calendarConfigs.googleCalendar,
      isConnected: true,
      calendarId: calendarId,
      lastSync: new Date().toISOString(),
      accessToken: accessToken // In produzione, criptare!
    };
    
    res.json({
      success: true,
      message: 'Google Calendar connesso con successo',
      data: {
        calendarId: calendarId,
        isConnected: true,
        lastSync: calendarConfigs.googleCalendar.lastSync
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Errore nella connessione Google Calendar',
      error: error.message
    });
  }
});

// POST /api/calendars/google/disconnect - Disconnetti Google Calendar
router.post('/google/disconnect', (req, res) => {
  try {
    calendarConfigs.googleCalendar = {
      isConnected: false,
      calendarId: null,
      lastSync: null,
      syncEnabled: true,
      autoSync: false,
      syncInterval: 60,
      accessToken: null
    };
    
    res.json({
      success: true,
      message: 'Google Calendar disconnesso con successo',
      data: calendarConfigs.googleCalendar,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Errore nella disconnessione Google Calendar',
      error: error.message
    });
  }
});

// POST /api/calendars/google/sync - Sincronizza con Google Calendar
router.post('/google/sync', (req, res) => {
  try {
    if (!calendarConfigs.googleCalendar.isConnected) {
      return res.status(400).json({
        success: false,
        message: 'Google Calendar non connesso'
      });
    }
    
    // Simula sincronizzazione
    calendarConfigs.googleCalendar.lastSync = new Date().toISOString();
    
    // Simula eventi sincronizzati
    const syncedEvents = [
      {
        id: 'sync_1',
        title: 'Prenotazione sincronizzata',
        start: new Date(),
        end: new Date(Date.now() + 86400000 * 3), // 3 giorni
        source: 'google'
      }
    ];
    
    res.json({
      success: true,
      message: 'Sincronizzazione completata con successo',
      data: {
        lastSync: calendarConfigs.googleCalendar.lastSync,
        syncedEvents: syncedEvents.length,
        events: syncedEvents
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Errore nella sincronizzazione',
      error: error.message
    });
  }
});

// GET /api/calendars/availability/:year/:month - Ottieni disponibilità per mese
router.get('/availability/:year/:month', (req, res) => {
  try {
    const { year, month } = req.params;
    
    if (!year || !month || isNaN(year) || isNaN(month)) {
      return res.status(400).json({
        success: false,
        message: 'Anno e mese devono essere numerici'
      });
    }
    
    const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
    const endDate = new Date(parseInt(year), parseInt(month), 0);
    
    // Simula calendario disponibilità
    const availability = [];
    for (let day = 1; day <= endDate.getDate(); day++) {
      const currentDate = new Date(parseInt(year), parseInt(month) - 1, day);
      const dayOfWeek = currentDate.getDay();
      
      // Simula logica disponibilità
      let status = 'available';
      if (Math.random() < 0.2) status = 'booked'; // 20% occupato
      if (Math.random() < 0.1) status = 'blocked'; // 10% bloccato
      
      availability.push({
        date: currentDate.toISOString().split('T')[0],
        status: status,
        price: calendarConfigs.availability.basePrice || 100,
        minimumStay: calendarConfigs.availability.minimumStay,
        checkIn: dayOfWeek === 6 || dayOfWeek === 0, // Weekend check-in
        checkOut: true
      });
    }
    
    res.json({
      success: true,
      data: {
        year: parseInt(year),
        month: parseInt(month),
        availability: availability,
        summary: {
          totalDays: availability.length,
          availableDays: availability.filter(d => d.status === 'available').length,
          bookedDays: availability.filter(d => d.status === 'booked').length,
          blockedDays: availability.filter(d => d.status === 'blocked').length
        }
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Errore nel recupero della disponibilità',
      error: error.message
    });
  }
});

// POST /api/calendars/block - Blocca periodo specifico
router.post('/block', (req, res) => {
  try {
    const { startDate, endDate, reason = 'Manutenzione' } = req.body;
    
    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Data inizio e fine richieste'
      });
    }
    
    const blockId = 'block_' + Date.now();
    const blockedPeriod = {
      id: blockId,
      startDate: startDate,
      endDate: endDate,
      reason: reason,
      createdAt: new Date().toISOString()
    };
    
    calendarConfigs.blockedPeriods.push(blockedPeriod);
    
    res.json({
      success: true,
      message: 'Periodo bloccato con successo',
      data: blockedPeriod,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Errore nel blocco del periodo',
      error: error.message
    });
  }
});

// DELETE /api/calendars/block/:blockId - Rimuovi blocco
router.delete('/block/:blockId', (req, res) => {
  try {
    const { blockId } = req.params;
    
    const blockIndex = calendarConfigs.blockedPeriods.findIndex(block => block.id === blockId);
    
    if (blockIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Blocco non trovato'
      });
    }
    
    const removedBlock = calendarConfigs.blockedPeriods.splice(blockIndex, 1)[0];
    
    res.json({
      success: true,
      message: 'Blocco rimosso con successo',
      data: removedBlock,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Errore nella rimozione del blocco',
      error: error.message
    });
  }
});

module.exports = router;