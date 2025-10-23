import { Router } from 'express';
import { createBookingRequest, getBookedDates } from '@controllers/booking.controller';
import validate from '@middleware/validateResource';
import { createBookingRequestSchema } from '@schemas/booking.schema';

const router = Router();

// Rotta per ottenere le date già prenotate
router.get('/booked-dates', getBookedDates);

// Rotta per inviare una nuova richiesta di prenotazione
router.post('/booking-request', validate(createBookingRequestSchema), createBookingRequest);

export default router;