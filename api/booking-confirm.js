// api/booking-confirm.js
// Endpoint per confermare e salvare una prenotazione dopo pagamento (Stripe, PayPal, Bonifico)

const express = require('express');
const router = express.Router();
// TODO: importa qui il tuo client DB, es: const db = require('../db')

/**
 * POST /api/booking/confirm
 * Body: {
 *   payment_method: 'stripe' | 'paypal' | 'bank_transfer',
 *   payment_status: 'success' | 'pending' | 'failed',
 *   payment_id: string | null,
 *   amount: number,
 *   booking_data: { ... }
 * }
 */
router.post('/booking/confirm', async (req, res) => {
  try {
    console.log('Ricevuto booking/confirm:', req.body);
    const { payment_method, payment_status, payment_id, amount, booking_data } = req.body;
    // Controllo più robusto
    if (!payment_method || !payment_status || typeof amount !== 'number' || !booking_data || typeof booking_data !== 'object') {
      return res.status(400).json({ error: 'Dati mancanti o non validi', received: req.body });
    }
    // Esempio: salva la prenotazione nel DB
    // const result = await db.query('INSERT INTO bookings ...', [...]);
    // Qui puoi salvare anche lo stato (confermato/pending) in base a payment_status
    // Esempio mock:
    const bookingId = Math.floor(Math.random() * 1000000);
    // TODO: sostituisci con logica reale di salvataggio su DB
    res.json({ success: true, bookingId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
