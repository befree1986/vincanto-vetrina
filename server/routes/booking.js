import express from 'express';
import { body, validationResult } from 'express-validator';
import { db } from '../index.js';
import { calculateBookingCosts } from '../utils/pricing.js';
import { sendBookingConfirmationEmail } from '../services/email.js';

const router = express.Router();

// Validation rules per la prenotazione
const bookingValidation = [
    body('guest_name').notEmpty().trim().withMessage('Nome obbligatorio'),
    body('guest_surname').notEmpty().trim().withMessage('Cognome obbligatorio'),
    body('guest_email').isEmail().normalizeEmail().withMessage('Email non valida'),
    body('guest_phone').notEmpty().trim().withMessage('Telefono obbligatorio'),
    body('check_in_date').isISO8601().withMessage('Data check-in non valida'),
    body('check_out_date').isISO8601().withMessage('Data check-out non valida'),
    body('num_adults').isInt({ min: 1 }).withMessage('Almeno 1 adulto richiesto'),
    body('num_children').isInt({ min: 0 }).withMessage('Numero bambini non valido'),
    body('parking_option').isIn(['none', 'street', 'private']).withMessage('Opzione parcheggio non valida'),
    body('payment_method').isIn(['stripe', 'paypal', 'bank_transfer']).withMessage('Metodo pagamento non valido'),
    body('payment_type').isIn(['deposit', 'full']).withMessage('Tipo pagamento non valido')
];

/**
 * POST /api/booking/quote
 * Calcola il preventivo per una prenotazione
 */
router.post('/quote', async (req, res) => {
    try {
        const { check_in_date, check_out_date, num_adults, num_children, children_ages, parking_option } = req.body;
        
        // Validazioni base
        if (!check_in_date || !check_out_date || !num_adults) {
            return res.status(400).json({ error: 'Parametri mancanti per il calcolo' });
        }
        
        const checkIn = new Date(check_in_date);
        const checkOut = new Date(check_out_date);
        
        if (checkOut <= checkIn) {
            return res.status(400).json({ error: 'Data check-out deve essere successiva al check-in' });
        }
        
        // Calcola i costi
        const costs = await calculateBookingCosts({
            check_in_date: checkIn,
            check_out_date: checkOut,
            num_adults: parseInt(num_adults),
            num_children: parseInt(num_children) || 0,
            children_ages: children_ages || [],
            parking_option: parking_option || 'none'
        });
        
        res.json({
            success: true,
            costs,
            quote_valid_until: new Date(Date.now() + 30 * 60 * 1000) // 30 minuti
        });
        
    } catch (error) {
        console.error('❌ Errore calcolo preventivo:', error);
        res.status(500).json({ error: 'Errore nel calcolo del preventivo' });
    }
});

/**
 * POST /api/booking/create
 * Crea una nuova prenotazione
 */
router.post('/create', bookingValidation, async (req, res) => {
    try {
        // Controllo errori di validazione
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ 
                error: 'Dati non validi',
                details: errors.array()
            });
        }
        
        const {
            guest_name,
            guest_surname,
            guest_email,
            guest_phone,
            check_in_date,
            check_out_date,
            num_adults,
            num_children,
            children_ages,
            parking_option,
            payment_method,
            payment_type,
            guest_message
        } = req.body;
        
        // Verifica disponibilità
        const availability = await db.query(`
            SELECT check_availability($1, $2) as available
        `, [check_in_date, check_out_date]);
        
        if (!availability.rows[0].available) {
            return res.status(409).json({ error: 'Date non disponibili' });
        }
        
        // Calcola i costi
        const costs = await calculateBookingCosts({
            check_in_date: new Date(check_in_date),
            check_out_date: new Date(check_out_date),
            num_adults: parseInt(num_adults),
            num_children: parseInt(num_children) || 0,
            children_ages: children_ages || [],
            parking_option: parking_option || 'none'
        });
        
        // Determina l'importo da pagare
        const payment_amount = payment_type === 'deposit' ? costs.deposit_amount : costs.total_amount;
        
        // Inserisci la prenotazione nel database
        const result = await db.query(`
            INSERT INTO bookings (
                guest_name, guest_surname, guest_email, guest_phone,
                check_in_date, check_out_date, num_adults, num_children, children_ages,
                parking_option, base_price, parking_cost, cleaning_fee, tourist_tax,
                total_amount, deposit_amount, payment_method, payment_type, payment_amount,
                guest_message
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
            RETURNING *
        `, [
            guest_name, guest_surname, guest_email, guest_phone,
            check_in_date, check_out_date, num_adults, num_children, children_ages || [],
            parking_option, costs.base_price, costs.parking_cost, costs.cleaning_fee,
            costs.tourist_tax, costs.total_amount, costs.deposit_amount,
            payment_method, payment_type, payment_amount, guest_message
        ]);
        
        const booking = result.rows[0];
        
        // Invia email di conferma
        try {
            await sendBookingConfirmationEmail(booking);
        } catch (emailError) {
            console.error('⚠️ Errore invio email:', emailError);
            // Non bloccare la prenotazione per errori email
        }
        
        res.status(201).json({
            success: true,
            booking_id: booking.id,
            payment_amount: booking.payment_amount,
            payment_method: booking.payment_method,
            message: 'Prenotazione creata con successo'
        });
        
    } catch (error) {
        console.error('❌ Errore creazione prenotazione:', error);
        res.status(500).json({ error: 'Errore nella creazione della prenotazione' });
    }
});

/**
 * GET /api/booking/:id
 * Ottieni dettagli di una prenotazione
 */
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        const result = await db.query(
            'SELECT * FROM bookings WHERE id = $1',
            [id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Prenotazione non trovata' });
        }
        
        res.json({
            success: true,
            booking: result.rows[0]
        });
        
    } catch (error) {
        console.error('❌ Errore recupero prenotazione:', error);
        res.status(500).json({ error: 'Errore nel recupero della prenotazione' });
    }
});

/**
 * PUT /api/booking/:id/status
 * Aggiorna lo stato di una prenotazione
 */
router.put('/:id/status', async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        
        if (!['pending', 'confirmed', 'cancelled', 'completed'].includes(status)) {
            return res.status(400).json({ error: 'Stato non valido' });
        }
        
        const timestamp_field = status === 'confirmed' ? 'confirmed_at' 
                              : status === 'cancelled' ? 'cancelled_at' 
                              : null;
        
        let query = 'UPDATE bookings SET booking_status = $1, updated_at = CURRENT_TIMESTAMP';
        let params = [status, id];
        
        if (timestamp_field) {
            query += `, ${timestamp_field} = CURRENT_TIMESTAMP`;
        }
        
        query += ' WHERE id = $2 RETURNING *';
        
        const result = await db.query(query, params);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Prenotazione non trovata' });
        }
        
        res.json({
            success: true,
            booking: result.rows[0]
        });
        
    } catch (error) {
        console.error('❌ Errore aggiornamento stato:', error);
        res.status(500).json({ error: 'Errore nell\'aggiornamento dello stato' });
    }
});

export default router;