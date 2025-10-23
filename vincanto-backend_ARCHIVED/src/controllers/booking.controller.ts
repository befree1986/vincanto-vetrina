import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import { Booking } from '@models/Booking';
import { CreateBookingRequestInput } from '@schemas/booking.schema';
import { sendBookingRequestEmails } from '@services/email.service';

/**
 * @desc   Crea una nuova richiesta di prenotazione
 * @route  POST /api/bookings/booking-request
 * @access Pubblica
 */
export const createBookingRequest = asyncHandler(
  async (req: Request<{}, {}, CreateBookingRequestInput>, res: Response) => {
    console.log('Richiesta ricevuta a /api/booking-request con dati:', req.body);
    const { formData, paymentAmount, paymentMethod, costs } = req.body;

    const bookingData = {
      guest_name: formData.name,
      guest_surname: formData.surname,
      guest_email: formData.email,
      guest_phone: formData.phone,
      check_in_date: new Date(formData.checkin),
      check_out_date: new Date(formData.checkout),
      num_adults: formData.guests,
      num_children: formData.children,
      children_ages: formData.childrenAges,
      parking_option: formData.parkingOption || 'none',
      base_price: costs?.subtotalNightlyRate ?? 0,
      parking_cost: costs?.parkingCost ?? 0,
      cleaning_fee: costs?.cleaningFee ?? 0,
      tourist_tax: costs?.touristTax ?? 0,
      total_amount: costs?.grandTotalWithTax ?? 0,
      deposit_amount: costs?.depositAmount ?? 0,
      payment_amount: costs
        ? paymentAmount === 'acconto'
          ? costs.depositAmount
          : costs.grandTotalWithTax
        : 0,
      payment_method: paymentMethod || '',
      booking_status: 'PENDING',
      payment_choice: paymentAmount === 'acconto' ? 'acconto' : 'totale',
    };

    const newBooking = new Booking(bookingData);
    await newBooking.save();
    console.log(`✅ Prenotazione salvata con successo nel DB (ID: ${newBooking._id}).`);

    // Invio email in background
    sendBookingRequestEmails(newBooking, req.body);

    res.status(201).json({
      success: true,
      message: 'Richiesta di prenotazione ricevuta e email inviate!',
    });
  }
);

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