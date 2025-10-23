const express = require('express');
const {
    getAllReservations,
    getReservationById,
    updateReservationStatus,
    deleteReservation
} = require('../../controllers/admin/reservation.controller');
const { protect } = require('../../middleware/auth.middleware');

const router = express.Router();

// Applichiamo il middleware 'protect' a tutte le rotte definite di seguito
// Da questo momento, per accedere a queste API servirà un token valido.
router.use(protect);

router.get('/', getAllReservations); // Protetto
router.get('/:id', getReservationById); // Protetto
router.put('/:id/status', updateReservationStatus); // Protetto
router.delete('/:id', deleteReservation); // Protetto

module.exports = router;