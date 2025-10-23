import { Router } from 'express';
import { getAllBookings } from '@controllers/admin.controller';

const router = Router();

// In futuro, qui aggiungeremo un middleware per proteggere queste rotte
// es: router.use(protect);

router.get('/bookings', getAllBookings);

export default router;