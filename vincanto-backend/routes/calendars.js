/**
 * Routes per la gestione dei calendari - POSTGRESQL ENTERPRISE
 * Endpoint REST per configurazioni calendario e sincronizzazione con database
 */

const express = require('express');
const router = express.Router();
const { CalendarConfig, Booking } = require('../models');
const { Op } = require('sequelize');

// GET /api/calendars - Ottieni tutte le configurazioni calendario
router.get('/', async (req, res) => {
  try {
    const { calendar_type, is_active } = req.query;
    
    let whereClause = {};
    
    if (calendar_type) {
      whereClause.calendar_type = calendar_type;
    }
    
    if (is_active !== undefined) {
      whereClause.is_active = is_active === 'true';
    }
    
    const configs = await CalendarConfig.findAll({
      where: whereClause,
      order: [['created_at', 'DESC']]
    });
    
    // Aggiungi statistiche di sincronizzazione
    const stats = {
      total: configs.length,
      active: configs.filter(c => c.is_active).length,
      googleCalendar: configs.filter(c => c.calendar_type === 'google_calendar').length,
      external: configs.filter(c => ['airbnb', 'booking_com', 'vrbo'].includes(c.calendar_type)).length,
      lastSyncSuccess: configs
        .filter(c => c.last_sync_at)
        .sort((a, b) => new Date(b.last_sync_at) - new Date(a.last_sync_at))[0]?.last_sync_at || null
    };
    
    res.json({
      success: true,
      data: {
        calendars: configs,
        stats: stats
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Database error in calendars route:', error);
    res.status(500).json({
      success: false,
      message: 'Errore nel recupero delle configurazioni calendario dal database',
      error: error.message
    });
  }
});

// GET /api/calendars/:configId - Ottieni configurazione specifica
router.get('/:configId', async (req, res) => {
  try {
    const { configId } = req.params;
    
    const config = await CalendarConfig.findByPk(configId);
    
    if (!config) {
      return res.status(404).json({
        success: false,
        message: 'Configurazione calendario non trovata'
      });
    }
    
    res.json({
      success: true,
      data: config,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Database error in get calendar config:', error);
    res.status(500).json({
      success: false,
      message: 'Errore nel recupero della configurazione calendario',
      error: error.message
    });
  }
});

// POST /api/calendars - Crea nuova configurazione calendario
router.post('/', async (req, res) => {
  try {
    const {
      name,
      description,
      calendar_type,
      calendar_url,
      sync_frequency_hours = 24,
      is_active = true,
      auto_sync_enabled = false,
      timezone = 'Europe/Rome'
    } = req.body;
    
    // Validazione
    if (!name || !calendar_type) {
      return res.status(400).json({
        success: false,
        message: 'Campi obbligatori mancanti',
        required: ['name', 'calendar_type']
      });
    }
    
    // Crea configurazione
    const config = await CalendarConfig.create({
      name,
      description,
      calendar_type,
      calendar_url,
      sync_frequency_hours,
      is_active,
      auto_sync_enabled,
      timezone,
      last_sync_at: null,
      sync_status: 'pending'
    });
    
    res.status(201).json({
      success: true,
      message: 'Configurazione calendario creata con successo',
      data: config,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Database error in create calendar config:', error);
    res.status(500).json({
      success: false,
      message: 'Errore nella creazione della configurazione calendario',
      error: error.message
    });
  }
});

// PUT /api/calendars/:configId - Aggiorna configurazione
router.put('/:configId', async (req, res) => {
  try {
    const { configId } = req.params;
    const updateData = req.body;
    
    const config = await CalendarConfig.findByPk(configId);
    if (!config) {
      return res.status(404).json({
        success: false,
        message: 'Configurazione calendario non trovata'
      });
    }
    
    await config.update(updateData);
    
    res.json({
      success: true,
      message: 'Configurazione calendario aggiornata con successo',
      data: config,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Database error in update calendar config:', error);
    res.status(500).json({
      success: false,
      message: 'Errore nell\'aggiornamento della configurazione calendario',
      error: error.message
    });
  }
});

// POST /api/calendars/:configId/sync - Forza sincronizzazione
router.post('/:configId/sync', async (req, res) => {
  try {
    const { configId } = req.params;
    
    const config = await CalendarConfig.findByPk(configId);
    if (!config) {
      return res.status(404).json({
        success: false,
        message: 'Configurazione calendario non trovata'
      });
    }
    
    if (!config.is_active) {
      return res.status(400).json({
        success: false,
        message: 'Il calendario non è attivo'
      });
    }
    
    // Aggiorna status sincronizzazione
    await config.update({
      sync_status: 'syncing',
      last_sync_attempt_at: new Date()
    });
    
    // Qui dovrebbe esserci la logica di sincronizzazione effettiva
    // Per ora simuliamo una sincronizzazione
    setTimeout(async () => {
      try {
        await config.update({
          sync_status: 'success',
          last_sync_at: new Date(),
          sync_error_message: null
        });
      } catch (error) {
        console.error('Error updating sync status:', error);
      }
    }, 2000);
    
    res.json({
      success: true,
      message: 'Sincronizzazione avviata',
      data: {
        config_id: configId,
        status: 'syncing',
        started_at: new Date().toISOString()
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Database error in calendar sync:', error);
    res.status(500).json({
      success: false,
      message: 'Errore nell\'avvio della sincronizzazione',
      error: error.message
    });
  }
});

// GET /api/calendars/availability/:year/:month - Ottieni disponibilità per mese
router.get('/availability/:year/:month', async (req, res) => {
  try {
    const { year, month } = req.params;
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);
    
    // Trova prenotazioni confermate per il periodo
    const bookings = await Booking.findAll({
      where: {
        [Op.or]: [
          {
            check_in: {
              [Op.between]: [startDate, endDate]
            }
          },
          {
            check_out: {
              [Op.between]: [startDate, endDate]
            }
          },
          {
            [Op.and]: [
              { check_in: { [Op.lte]: startDate } },
              { check_out: { [Op.gte]: endDate } }
            ]
          }
        ],
        status: { [Op.in]: ['confirmed', 'checked_in'] }
      },
      attributes: ['check_in', 'check_out', 'guest_first_name', 'guest_last_name', 'booking_number'],
      order: [['check_in', 'ASC']]
    });
    
    // Genera calendario del mese
    const daysInMonth = endDate.getDate();
    const availability = [];
    
    for (let day = 1; day <= daysInMonth; day++) {
      const currentDate = new Date(year, month - 1, day);
      const dateStr = currentDate.toISOString().split('T')[0];
      
      // Verifica se il giorno è occupato
      const isOccupied = bookings.some(booking => {
        const checkIn = new Date(booking.check_in);
        const checkOut = new Date(booking.check_out);
        return currentDate >= checkIn && currentDate < checkOut;
      });
      
      // Trova prenotazione del giorno
      const booking = bookings.find(booking => {
        const checkIn = new Date(booking.check_in);
        const checkOut = new Date(booking.check_out);
        return currentDate >= checkIn && currentDate < checkOut;
      });
      
      availability.push({
        date: dateStr,
        day: day,
        dayOfWeek: currentDate.getDay(),
        available: !isOccupied,
        booking: booking ? {
          booking_number: booking.booking_number,
          guest_name: `${booking.guest_first_name} ${booking.guest_last_name}`,
          is_checkin: currentDate.toDateString() === new Date(booking.check_in).toDateString(),
          is_checkout: currentDate.toDateString() === new Date(booking.check_out).toDateString()
        } : null
      });
    }
    
    res.json({
      success: true,
      data: {
        year: parseInt(year),
        month: parseInt(month),
        monthName: new Date(year, month - 1).toLocaleDateString('it-IT', { month: 'long' }),
        availability: availability,
        summary: {
          totalDays: daysInMonth,
          occupiedDays: availability.filter(d => !d.available).length,
          availableDays: availability.filter(d => d.available).length,
          occupancyRate: ((availability.filter(d => !d.available).length / daysInMonth) * 100).toFixed(1)
        }
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Database error in calendar availability:', error);
    res.status(500).json({
      success: false,
      message: 'Errore nel recupero della disponibilità calendario',
      error: error.message
    });
  }
});

// DELETE /api/calendars/:configId - Elimina configurazione
router.delete('/:configId', async (req, res) => {
  try {
    const { configId } = req.params;
    
    const config = await CalendarConfig.findByPk(configId);
    if (!config) {
      return res.status(404).json({
        success: false,
        message: 'Configurazione calendario non trovata'
      });
    }
    
    await config.destroy();
    
    res.json({
      success: true,
      message: 'Configurazione calendario eliminata con successo',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Database error in delete calendar config:', error);
    res.status(500).json({
      success: false,
      message: 'Errore nell\'eliminazione della configurazione calendario',
      error: error.message
    });
  }
});

// GET /api/calendars/stats/dashboard - Statistiche calendario per dashboard
router.get('/stats/dashboard', async (req, res) => {
  try {
    const today = new Date();
    const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
    
    // Configurazioni attive
    const activeConfigs = await CalendarConfig.count({ where: { is_active: true } });
    const totalConfigs = await CalendarConfig.count();
    
    // Ultima sincronizzazione
    const lastSync = await CalendarConfig.findOne({
      where: { last_sync_at: { [Op.ne]: null } },
      order: [['last_sync_at', 'DESC']],
      attributes: ['last_sync_at', 'name', 'sync_status']
    });
    
    // Sincronizzazioni fallite nelle ultime 24h
    const yesterday = new Date();
    yesterday.setHours(yesterday.getHours() - 24);
    
    const failedSyncs = await CalendarConfig.count({
      where: {
        sync_status: 'error',
        last_sync_attempt_at: { [Op.gte]: yesterday }
      }
    });
    
    // Occupancy del mese corrente
    const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
    const occupiedNights = await Booking.sum('nights_count', {
      where: {
        check_in: { [Op.gte]: thisMonth },
        status: 'confirmed'
      }
    }) || 0;
    
    const occupancyRate = ((occupiedNights / daysInMonth) * 100).toFixed(1);
    
    res.json({
      success: true,
      data: {
        configurations: {
          active: activeConfigs,
          total: totalConfigs,
          inactive: totalConfigs - activeConfigs
        },
        synchronization: {
          lastSync: lastSync ? {
            date: lastSync.last_sync_at,
            calendar: lastSync.name,
            status: lastSync.sync_status
          } : null,
          failedSyncsLast24h: failedSyncs
        },
        occupancy: {
          currentMonth: parseFloat(occupancyRate),
          daysInMonth: daysInMonth,
          occupiedNights: occupiedNights
        }
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Database error in calendar stats:', error);
    res.status(500).json({
      success: false,
      message: 'Errore nel recupero delle statistiche calendario',
      error: error.message
    });
  }
});

module.exports = router;