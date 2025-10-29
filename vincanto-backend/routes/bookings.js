/**
 * Routes per la gestione delle prenotazioni - POSTGRESQL ENTERPRISE
 * Endpoint REST per CRUD prenotazioni con database completo
 */

const express = require('express');
const router = express.Router();
const { Booking, Payment } = require('../models');
const { Op } = require('sequelize');

// GET /api/bookings - Ottieni tutte le prenotazioni con filtri e paginazione
router.get('/', async (req, res) => {
  try {
    const { 
      status, 
      startDate, 
      endDate, 
      guestEmail, 
      limit = 50, 
      offset = 0 
    } = req.query;
    
    // Costruzione filtri per Sequelize
    let whereClause = {};
    
    if (status) {
      whereClause.status = status;
    }
    
    if (startDate && endDate) {
      whereClause.check_in_date = {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      };
    }
    
    if (guestEmail) {
      whereClause.guest_email = {
        [Op.iLike]: `%${guestEmail}%`
      };
    }
    
    // Query database con paginazione
    const { rows: bookings, count: total } = await Booking.findAndCountAll({
      where: whereClause,
      include: [{
        model: Payment,
        as: 'payments',
        required: false
      }],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['created_at', 'DESC']]
    });
    
    // Statistiche dal database
    const stats = await Booking.findAll({
      attributes: [
        'status',
        [Booking.sequelize.fn('COUNT', '*'), 'count']
      ],
      group: ['status'],
      raw: true
    });
    
    const formattedStats = {
      total: total,
      confirmed: stats.find(s => s.status === 'confirmed')?.count || 0,
      pending: stats.find(s => s.status === 'pending')?.count || 0,
      cancelled: stats.find(s => s.status === 'cancelled')?.count || 0,
      completed: stats.find(s => s.status === 'completed')?.count || 0
    };
    
    res.json({
      success: true,
      data: {
        bookings: bookings,
        pagination: {
          total: total,
          limit: parseInt(limit),
          offset: parseInt(offset),
          hasMore: (parseInt(offset) + parseInt(limit)) < total
        },
        stats: formattedStats
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Database error in bookings route:', error);
    res.status(500).json({
      success: false,
      message: 'Errore nel recupero delle prenotazioni dal database',
      error: error.message
    });
  }
});

// GET /api/bookings/:bookingId - Ottieni prenotazione specifica
router.get('/:bookingId', async (req, res) => {
  try {
    const { bookingId } = req.params;
    
    const booking = await Booking.findByPk(bookingId, {
      include: [{
        model: Payment,
        as: 'payments',
        required: false
      }]
    });
    
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Prenotazione non trovata'
      });
    }
    
    res.json({
      success: true,
      data: booking,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Database error in get booking by ID:', error);
    res.status(500).json({
      success: false,
      message: 'Errore nel recupero della prenotazione',
      error: error.message
    });
  }
});

// POST /api/bookings - Crea nuova prenotazione
router.post('/', async (req, res) => {
  try {
    const {
      guest_first_name,
      guest_last_name,
      guest_email,
      guest_phone,
      check_in,
      check_out,
      guests_count,
      children_count = 0,
      special_requests = '',
      base_price,
      extra_costs = 0,
      cleaning_fee = 0,
      tourist_tax = 0,
      total_amount,
      deposit_amount,
      currency = 'EUR'
    } = req.body;
    
    // Calcola notti
    const checkInDate = new Date(check_in);
    const checkOutDate = new Date(check_out);
    const nights = Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24));
    
    // Validazione campi obbligatori
    if (!guest_first_name || !guest_last_name || !guest_email || !check_in || !check_out) {
      return res.status(400).json({
        success: false,
        message: 'Campi obbligatori mancanti',
        required: ['guest_first_name', 'guest_last_name', 'guest_email', 'check_in', 'check_out']
      });
    }
    
    // Genera numero prenotazione
    const bookingNumber = `VINC${Date.now().toString().slice(-6)}`;
    
    // Crea prenotazione
    const booking = await Booking.create({
      booking_number: bookingNumber,
      status: 'pending',
      guest_first_name,
      guest_last_name,
      guest_email,
      guest_phone,
      check_in_date: new Date(check_in),
      check_out_date: new Date(check_out),
      nights: nights,
      num_adults: parseInt(guests_count),
      num_children: parseInt(children_count),
      total_guests: parseInt(guests_count) + parseInt(children_count),
      special_requests,
      base_price: parseFloat(base_price),
      extra_guest_fee: parseFloat(extra_costs),
      cleaning_fee: parseFloat(cleaning_fee),
      tourist_tax: parseFloat(tourist_tax),
      total_amount: parseFloat(total_amount),
      deposit_amount: parseFloat(deposit_amount),
      balance_amount: parseFloat(total_amount) - parseFloat(deposit_amount),
      currency
    });
    
    res.status(201).json({
      success: true,
      message: 'Prenotazione creata con successo',
      data: booking,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Database error in create booking:', error);
    res.status(500).json({
      success: false,
      message: 'Errore nella creazione della prenotazione',
      error: error.message
    });
  }
});

// PUT /api/bookings/:bookingId - Aggiorna prenotazione
router.put('/:bookingId', async (req, res) => {
  try {
    const { bookingId } = req.params;
    const updateData = req.body;
    
    // Trova prenotazione
    const booking = await Booking.findByPk(bookingId);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Prenotazione non trovata'
      });
    }
    
    // Aggiorna
    await booking.update(updateData);
    
    // Ricarica con relazioni
    const updatedBooking = await Booking.findByPk(bookingId, {
      include: [{
        model: Payment,
        as: 'payments',
        required: false
      }]
    });
    
    res.json({
      success: true,
      message: 'Prenotazione aggiornata con successo',
      data: updatedBooking,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Database error in update booking:', error);
    res.status(500).json({
      success: false,
      message: 'Errore nell\'aggiornamento della prenotazione',
      error: error.message
    });
  }
});

// PATCH /api/bookings/:bookingId/status - Aggiorna solo status
router.patch('/:bookingId/status', async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { status, notes } = req.body;
    
    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Status è obbligatorio'
      });
    }
    
    const booking = await Booking.findByPk(bookingId);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Prenotazione non trovata'
      });
    }
    
    await booking.update({ 
      status,
      admin_notes: notes || booking.admin_notes 
    });
    
    res.json({
      success: true,
      message: `Status aggiornato a: ${status}`,
      data: { status, updated_at: booking.updated_at },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Database error in update booking status:', error);
    res.status(500).json({
      success: false,
      message: 'Errore nell\'aggiornamento dello status',
      error: error.message
    });
  }
});

// DELETE /api/bookings/:bookingId - Elimina prenotazione
router.delete('/:bookingId', async (req, res) => {
  try {
    const { bookingId } = req.params;
    
    const booking = await Booking.findByPk(bookingId);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Prenotazione non trovata'
      });
    }
    
    // Verifica se ci sono pagamenti associati
    const payments = await Payment.findAll({ where: { booking_id: bookingId } });
    if (payments.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Impossibile eliminare: prenotazione ha pagamenti associati',
        suggestion: 'Considera di annullare la prenotazione invece di eliminarla'
      });
    }
    
    await booking.destroy();
    
    res.json({
      success: true,
      message: 'Prenotazione eliminata con successo',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Database error in delete booking:', error);
    res.status(500).json({
      success: false,
      message: 'Errore nell\'eliminazione della prenotazione',
      error: error.message
    });
  }
});

// GET /api/bookings/stats/dashboard - Statistiche dashboard
router.get('/stats/dashboard', async (req, res) => {
  try {
    const today = new Date();
    const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
    
    // Statistiche generali
    const totalBookings = await Booking.count();
    const activeBookings = await Booking.count({ where: { status: { [Op.in]: ['confirmed', 'pending'] } } });
    const thisMonthBookings = await Booking.count({ 
      where: { 
        created_at: { [Op.gte]: thisMonth },
        status: { [Op.ne]: 'cancelled' }
      } 
    });
    
    // Revenue del mese
    const monthlyRevenue = await Booking.sum('total_amount', {
      where: { 
        created_at: { [Op.gte]: thisMonth },
        status: 'confirmed'
      }
    });
    
    // Prossimi check-in (prossimi 7 giorni)
    const nextWeek = new Date();
    nextWeek.setDate(today.getDate() + 7);
    
    const upcomingCheckins = await Booking.findAll({
      where: {
        check_in_date: { [Op.between]: [today, nextWeek] },
        status: 'confirmed'
      },
      attributes: ['id', 'booking_number', 'guest_first_name', 'guest_last_name', 'check_in_date', 'check_out_date'],
      order: [['check_in_date', 'ASC']],
      limit: 10
    });
    
    // Occupancy rate del mese corrente
    const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
    const occupiedNights = await Booking.sum('nights', {
      where: {
        check_in_date: { [Op.gte]: thisMonth },
        status: 'confirmed'
      }
    }) || 0;
    
    const occupancyRate = ((occupiedNights / daysInMonth) * 100).toFixed(1);
    
    res.json({
      success: true,
      data: {
        overview: {
          totalBookings,
          activeBookings,
          thisMonthBookings,
          monthlyRevenue: monthlyRevenue || 0,
          occupancyRate: parseFloat(occupancyRate)
        },
        upcomingCheckins: upcomingCheckins,
        period: {
          month: today.toLocaleDateString('it-IT', { month: 'long', year: 'numeric' })
        }
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Database error in booking stats:', error);
    res.status(500).json({
      success: false,
      message: 'Errore nel recupero delle statistiche',
      error: error.message
    });
  }
});

module.exports = router;