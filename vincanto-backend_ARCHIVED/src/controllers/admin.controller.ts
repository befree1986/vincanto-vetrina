import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import { Booking } from '@models/Booking';

/**
 * @desc   Ottiene tutte le prenotazioni
 * @route  GET /api/admin/bookings
 * @access Privata
 */
export const getAllBookings = asyncHandler(async (req: Request, res: Response) => {
  const bookings = await Booking.find({}).sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: bookings.length,
    data: bookings,
  });
});

/**
 * @desc   Ottiene una singola prenotazione per ID
 * @route  GET /api/admin/bookings/:id
 * @access Privata
 */
export const getBookingById = asyncHandler(async (req: Request, res: Response) => {
  const booking = await Booking.findById(req.params.id);

  if (!booking) {
    res.status(404);
    throw new Error('Prenotazione non trovata.');
  }

  res.status(200).json({ success: true, data: booking });
});

/**
 * @desc   Aggiorna lo stato di una prenotazione
 * @route  PATCH /api/admin/bookings/:id/status
 * @access Privata
 */
export const updateBookingStatus = asyncHandler(async (req: Request, res: Response) => {
  const { status } = req.body;

  if (!status || !['CONFIRMED', 'CANCELLED'].includes(status)) {
    res.status(400);
    throw new Error("Stato non valido. Usare 'CONFIRMED' o 'CANCELLED'.");
  }

  const booking = await Booking.findById(req.params.id);

  if (!booking) {
    res.status(404);
    throw new Error('Prenotazione non trovata.');
  }

  booking.booking_status = status;
  await booking.save();

  res.status(200).json({
    success: true,
    data: booking,
  });
});

/**
 * @desc   Elimina una prenotazione
 * @route  DELETE /api/admin/bookings/:id
 * @access Privata
 */
export const deleteBooking = asyncHandler(async (req: Request, res: Response) => {
  const booking = await Booking.findByIdAndDelete(req.params.id);

  if (!booking) {
    res.status(404);
    throw new Error('Prenotazione non trovata.');
  }

  res.status(200).json({ success: true, message: 'Prenotazione eliminata con successo.' });
});

/**
 * @desc   Ottiene tutte le date prenotate (check-in e check-out)
 * @route  GET /api/bookings/booked-dates
 * @access Pubblica
 */
export const getBookedDates = asyncHandler(async (req: Request, res: Response) => {
  try {
    const bookings = await Booking.find({}, 'check_in_date check_out_date');
    res.status(200).json({
      success: true,
      data: bookings,
    });
  } catch (error) {
    console.error('❌ Errore nel recupero delle date prenotate:', error);
    res.status(500).json({
      success: false,
      message: 'Errore interno del server',
    });
  }
});