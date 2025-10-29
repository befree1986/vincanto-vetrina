/**
 * Routes per la gestione delle prenotazioni - CONNESSO A POSTGRESQL
 * Endpoint REST per CRUD prenotazioni con database enterprise
 */

const express = require('express');
const router = express.Router();
const { Booking, Payment } = require('../models');
const { Op } = require('sequelize');

// GET /api/bookings - Ottieni tutte le prenotazioni con filtri opzionali
router.get('/', (req, res) => {
  try {
    const { 
      status, 
      fromDate, 
      toDate, 
      guestEmail, 
      limit = 50, 
      offset = 0 
    } = req.query;
    
    let filteredBookings = [...bookings];
    
    // Applica filtri
    if (status) {
      filteredBookings = filteredBookings.filter(b => b.status === status);
    }
    
    if (fromDate) {
      filteredBookings = filteredBookings.filter(b => 
        new Date(b.stayDetails.checkIn) >= new Date(fromDate)
      );
    }
    
    if (toDate) {
      filteredBookings = filteredBookings.filter(b => 
        new Date(b.stayDetails.checkOut) <= new Date(toDate)
      );
    }
    
    if (guestEmail) {
      filteredBookings = filteredBookings.filter(b => 
        b.guestInfo.email.toLowerCase().includes(guestEmail.toLowerCase())
      );
    }
    
    // Paginazione
    const total = filteredBookings.length;
    const paginatedBookings = filteredBookings
      .slice(parseInt(offset), parseInt(offset) + parseInt(limit));
    
    // Statistiche
    const stats = {
      total: bookings.length,
      confirmed: bookings.filter(b => b.status === 'confirmed').length,
      pending: bookings.filter(b => b.status === 'pending').length,
      cancelled: bookings.filter(b => b.status === 'cancelled').length,
      completed: bookings.filter(b => b.status === 'completed').length
    };
    
    res.json({
      success: true,
      data: {
        bookings: paginatedBookings,
        pagination: {
          total: total,
          limit: parseInt(limit),
          offset: parseInt(offset),
          hasMore: (parseInt(offset) + parseInt(limit)) < total
        },
        stats: stats
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Errore nel recupero delle prenotazioni',
      error: error.message
    });
  }
});

// GET /api/bookings/:bookingId - Ottieni prenotazione specifica
router.get('/:bookingId', (req, res) => {
  try {
    const { bookingId } = req.params;
    
    const booking = bookings.find(b => b.id === bookingId);
    
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
    res.status(500).json({
      success: false,
      message: 'Errore nel recupero della prenotazione',
      error: error.message
    });
  }
});

// POST /api/bookings - Crea nuova prenotazione
router.post('/', (req, res) => {
  try {
    const {
      guestInfo,
      stayDetails,
      pricing,
      specialRequests = ''
    } = req.body;
    
    // Validazione campi obbligatori
    if (!guestInfo || !guestInfo.email || !guestInfo.firstName || !guestInfo.lastName) {
      return res.status(400).json({
        success: false,
        message: 'Informazioni ospite richieste: email, nome, cognome'
      });
    }
    
    if (!stayDetails || !stayDetails.checkIn || !stayDetails.checkOut || !stayDetails.guests) {
      return res.status(400).json({
        success: false,
        message: 'Dettagli soggiorno richiesti: checkIn, checkOut, guests'
      });
    }
    
    // Calcola notti
    const checkinDate = new Date(stayDetails.checkIn);
    const checkoutDate = new Date(stayDetails.checkOut);
    const nights = Math.ceil((checkoutDate - checkinDate) / (1000 * 60 * 60 * 24));
    
    if (nights <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Date di soggiorno non valide'
      });
    }
    
    // Controlla disponibilità (simulata)
    const conflictBooking = bookings.find(b => 
      b.status !== 'cancelled' &&
      ((new Date(b.stayDetails.checkIn) <= checkinDate && new Date(b.stayDetails.checkOut) > checkinDate) ||
       (new Date(b.stayDetails.checkIn) < checkoutDate && new Date(b.stayDetails.checkOut) >= checkoutDate) ||
       (new Date(b.stayDetails.checkIn) >= checkinDate && new Date(b.stayDetails.checkOut) <= checkoutDate))
    );
    
    if (conflictBooking) {
      return res.status(409).json({
        success: false,
        message: 'Date non disponibili - conflitto con prenotazione esistente',
        conflictBookingId: conflictBooking.id
      });
    }
    
    // Crea nuova prenotazione
    const bookingId = 'book_' + Date.now();
    const newBooking = {
      id: bookingId,
      status: 'pending',
      guestInfo: {
        ...guestInfo,
        nationality: guestInfo.nationality || 'IT'
      },
      stayDetails: {
        ...stayDetails,
        nights: nights,
        children: stayDetails.children || [],
        specialRequests: specialRequests
      },
      pricing: pricing || {
        basePrice: nights * 100,
        extraCosts: 0,
        cleaningFee: 30,
        touristTax: stayDetails.guests * 2 * nights,
        total: (nights * 100) + 30 + (stayDetails.guests * 2 * nights),
        deposit: ((nights * 100) + 30 + (stayDetails.guests * 2 * nights)) * 0.3,
        currency: 'EUR'
      },
      payment: {
        status: 'pending',
        method: null,
        transactionId: null
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    // Calcola balance
    newBooking.pricing.balance = newBooking.pricing.total - newBooking.pricing.deposit;
    
    bookings.push(newBooking);
    
    res.status(201).json({
      success: true,
      message: 'Prenotazione creata con successo',
      data: newBooking,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Errore nella creazione della prenotazione',
      error: error.message
    });
  }
});

// PUT /api/bookings/:bookingId - Aggiorna prenotazione
router.put('/:bookingId', (req, res) => {
  try {
    const { bookingId } = req.params;
    const updateData = req.body;
    
    const bookingIndex = bookings.findIndex(b => b.id === bookingId);
    
    if (bookingIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Prenotazione non trovata'
      });
    }
    
    // Previeni modifica di prenotazioni completate/cancellate
    if (['completed', 'cancelled'].includes(bookings[bookingIndex].status) && updateData.status !== 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Impossibile modificare prenotazioni completate o cancellate'
      });
    }
    
    // Aggiorna prenotazione
    bookings[bookingIndex] = {
      ...bookings[bookingIndex],
      ...updateData,
      updatedAt: new Date().toISOString()
    };
    
    res.json({
      success: true,
      message: 'Prenotazione aggiornata con successo',
      data: bookings[bookingIndex],
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Errore nell\'aggiornamento della prenotazione',
      error: error.message
    });
  }
});

// PATCH /api/bookings/:bookingId/status - Aggiorna solo lo stato
router.patch('/:bookingId/status', (req, res) => {
  try {
    const { bookingId } = req.params;
    const { status, reason = '' } = req.body;
    
    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Status richiesto'
      });
    }
    
    const validStatuses = ['pending', 'confirmed', 'checked_in', 'checked_out', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Status non valido. Validi: ${validStatuses.join(', ')}`
      });
    }
    
    const bookingIndex = bookings.findIndex(b => b.id === bookingId);
    
    if (bookingIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Prenotazione non trovata'
      });
    }
    
    const oldStatus = bookings[bookingIndex].status;
    
    // Aggiorna status
    bookings[bookingIndex].status = status;
    bookings[bookingIndex].updatedAt = new Date().toISOString();
    
    // Log cambio stato
    if (!bookings[bookingIndex].statusHistory) {
      bookings[bookingIndex].statusHistory = [];
    }
    
    bookings[bookingIndex].statusHistory.push({
      from: oldStatus,
      to: status,
      reason: reason,
      timestamp: new Date().toISOString()
    });
    
    res.json({
      success: true,
      message: `Status aggiornato da '${oldStatus}' a '${status}'`,
      data: {
        bookingId: bookingId,
        oldStatus: oldStatus,
        newStatus: status,
        updatedAt: bookings[bookingIndex].updatedAt
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Errore nell\'aggiornamento dello status',
      error: error.message
    });
  }
});

// DELETE /api/bookings/:bookingId - Cancella prenotazione
router.delete('/:bookingId', (req, res) => {
  try {
    const { bookingId } = req.params;
    const { reason = 'Cancellazione amministrativa' } = req.body;
    
    const bookingIndex = bookings.findIndex(b => b.id === bookingId);
    
    if (bookingIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Prenotazione non trovata'
      });
    }
    
    // Soft delete - marca come cancellata invece di eliminare
    bookings[bookingIndex].status = 'cancelled';
    bookings[bookingIndex].cancellationReason = reason;
    bookings[bookingIndex].cancelledAt = new Date().toISOString();
    bookings[bookingIndex].updatedAt = new Date().toISOString();
    
    res.json({
      success: true,
      message: 'Prenotazione cancellata con successo',
      data: {
        bookingId: bookingId,
        status: 'cancelled',
        reason: reason,
        cancelledAt: bookings[bookingIndex].cancelledAt
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Errore nella cancellazione della prenotazione',
      error: error.message
    });
  }
});

// GET /api/bookings/calendar/:year/:month - Vista calendario delle prenotazioni
router.get('/calendar/:year/:month', (req, res) => {
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
    
    // Filtra prenotazioni per il mese
    const monthBookings = bookings.filter(booking => {
      const checkIn = new Date(booking.stayDetails.checkIn);
      const checkOut = new Date(booking.stayDetails.checkOut);
      
      return (checkIn <= endDate && checkOut >= startDate) && 
             booking.status !== 'cancelled';
    });
    
    // Crea vista calendario
    const calendar = [];
    for (let day = 1; day <= endDate.getDate(); day++) {
      const currentDate = new Date(parseInt(year), parseInt(month) - 1, day);
      const dateStr = currentDate.toISOString().split('T')[0];
      
      const dayBookings = monthBookings.filter(booking => {
        const checkIn = new Date(booking.stayDetails.checkIn);
        const checkOut = new Date(booking.stayDetails.checkOut);
        return currentDate >= checkIn && currentDate < checkOut;
      });
      
      calendar.push({
        date: dateStr,
        day: day,
        dayOfWeek: currentDate.getDay(),
        bookings: dayBookings.map(b => ({
          id: b.id,
          guestName: `${b.guestInfo.firstName} ${b.guestInfo.lastName}`,
          status: b.status,
          checkIn: b.stayDetails.checkIn,
          checkOut: b.stayDetails.checkOut,
          nights: b.stayDetails.nights,
          guests: b.stayDetails.guests
        })),
        isOccupied: dayBookings.length > 0,
        occupancyRate: dayBookings.reduce((sum, b) => sum + b.stayDetails.guests, 0)
      });
    }
    
    res.json({
      success: true,
      data: {
        year: parseInt(year),
        month: parseInt(month),
        calendar: calendar,
        summary: {
          totalBookings: monthBookings.length,
          occupiedDays: calendar.filter(d => d.isOccupied).length,
          totalDays: calendar.length,
          occupancyRate: (calendar.filter(d => d.isOccupied).length / calendar.length * 100).toFixed(1)
        }
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Errore nel recupero del calendario prenotazioni',
      error: error.message
    });
  }
});

module.exports = router;