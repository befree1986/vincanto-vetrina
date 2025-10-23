import express from 'express';
import Stripe from 'stripe';
import fetch from 'node-fetch';
import { db } from '../index.js';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// PayPal configuration
const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID;
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET;
const PAYPAL_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://api.paypal.com' 
  : 'https://api.sandbox.paypal.com';

/**
 * POST /api/payment/create-intent
 * Crea un Payment Intent per Stripe
 */
router.post('/create-intent', async (req, res) => {
    try {
        const { booking_id, amount } = req.body;
        
        if (!booking_id || !amount) {
            return res.status(400).json({ error: 'booking_id e amount obbligatori' });
        }
        
        // Verifica che la prenotazione esista
        const bookingResult = await db.query(
            'SELECT * FROM bookings WHERE id = $1 AND payment_status = $2',
            [booking_id, 'pending']
        );
        
        if (bookingResult.rows.length === 0) {
            return res.status(404).json({ error: 'Prenotazione non trovata o già pagata' });
        }
        
        const booking = bookingResult.rows[0];
        
        // Verifica che l'importo corrisponda
        if (Math.abs(parseFloat(amount) - parseFloat(booking.payment_amount)) > 0.01) {
            return res.status(400).json({ error: 'Importo non corrispondente alla prenotazione' });
        }
        
        // Crea il Payment Intent
        const paymentIntent = await stripe.paymentIntents.create({
            amount: Math.round(parseFloat(amount) * 100), // Stripe usa centesimi
            currency: 'eur',
            metadata: {
                booking_id: booking_id,
                guest_email: booking.guest_email,
                guest_name: `${booking.guest_name} ${booking.guest_surname}`
            },
            description: `Prenotazione Vincanto ${booking_id}`,
            receipt_email: booking.guest_email
        });
        
        // Salva il Payment Intent ID nella prenotazione
        await db.query(
            'UPDATE bookings SET stripe_payment_intent_id = $1 WHERE id = $2',
            [paymentIntent.id, booking_id]
        );
        
        // Log della transazione
        await db.query(`
            INSERT INTO payment_logs (booking_id, payment_method, payment_provider, provider_transaction_id, amount, status, provider_response)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
        `, [booking_id, 'stripe', 'stripe', paymentIntent.id, amount, 'created', JSON.stringify(paymentIntent)]);
        
        res.json({
            success: true,
            client_secret: paymentIntent.client_secret,
            payment_intent_id: paymentIntent.id
        });
        
    } catch (error) {
        console.error('❌ Errore creazione Payment Intent:', error);
        res.status(500).json({ error: 'Errore nella creazione del pagamento' });
    }
});

/**
 * POST /api/payment/confirm-stripe
 * Conferma pagamento Stripe completato
 */
router.post('/confirm-stripe', async (req, res) => {
    try {
        const { payment_intent_id } = req.body;
        
        if (!payment_intent_id) {
            return res.status(400).json({ error: 'payment_intent_id obbligatorio' });
        }
        
        // Recupera il Payment Intent da Stripe per verificare lo stato
        const paymentIntent = await stripe.paymentIntents.retrieve(payment_intent_id);
        
        if (paymentIntent.status !== 'succeeded') {
            return res.status(400).json({ error: 'Pagamento non completato' });
        }
        
        const booking_id = paymentIntent.metadata.booking_id;
        
        // Aggiorna la prenotazione
        const result = await db.query(`
            UPDATE bookings 
            SET payment_status = 'completed', booking_status = 'confirmed', confirmed_at = CURRENT_TIMESTAMP
            WHERE id = $1 AND stripe_payment_intent_id = $2
            RETURNING *
        `, [booking_id, payment_intent_id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Prenotazione non trovata' });
        }
        
        // Log del pagamento completato
        await db.query(`
            INSERT INTO payment_logs (booking_id, payment_method, payment_provider, provider_transaction_id, amount, status, provider_response)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
        `, [booking_id, 'stripe', 'stripe', payment_intent_id, paymentIntent.amount / 100, 'completed', JSON.stringify(paymentIntent)]);
        
        res.json({
            success: true,
            booking: result.rows[0],
            message: 'Pagamento confermato con successo'
        });
        
    } catch (error) {
        console.error('❌ Errore conferma pagamento Stripe:', error);
        res.status(500).json({ error: 'Errore nella conferma del pagamento' });
    }
});

/**
 * POST /api/payment/create-paypal-order
 * Crea un ordine PayPal
 */
router.post('/create-paypal-order', async (req, res) => {
    try {
        const { booking_id, amount } = req.body;
        
        if (!booking_id || !amount) {
            return res.status(400).json({ error: 'booking_id e amount obbligatori' });
        }
        
        // Verifica prenotazione
        const bookingResult = await db.query(
            'SELECT * FROM bookings WHERE id = $1 AND payment_status = $2',
            [booking_id, 'pending']
        );
        
        if (bookingResult.rows.length === 0) {
            return res.status(404).json({ error: 'Prenotazione non trovata o già pagata' });
        }
        
        const booking = bookingResult.rows[0];
        
        // Per ora restituiamo i dati necessari per il frontend PayPal
        // L'integrazione completa PayPal richiederebbe l'SDK server-side
        res.json({
            success: true,
            paypal_order_data: {
                booking_id,
                amount: parseFloat(amount).toFixed(2),
                currency: 'EUR',
                description: `Prenotazione Vincanto ${booking_id}`,
                guest_email: booking.guest_email
            }
        });
        
    } catch (error) {
        console.error('❌ Errore creazione ordine PayPal:', error);
        res.status(500).json({ error: 'Errore nella creazione dell\'ordine PayPal' });
    }
});

/**
 * POST /api/payment/confirm-paypal
 * Conferma pagamento PayPal
 */
router.post('/confirm-paypal', async (req, res) => {
    try {
        const { booking_id, paypal_order_id, paypal_capture_id } = req.body;
        
        if (!booking_id || !paypal_order_id) {
            return res.status(400).json({ error: 'Parametri mancanti' });
        }
        
        // Aggiorna la prenotazione
        const result = await db.query(`
            UPDATE bookings 
            SET payment_status = 'completed', booking_status = 'confirmed', 
                paypal_order_id = $1, confirmed_at = CURRENT_TIMESTAMP
            WHERE id = $2 AND payment_status = 'pending'
            RETURNING *
        `, [paypal_order_id, booking_id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Prenotazione non trovata o già pagata' });
        }
        
        const booking = result.rows[0];
        
        // Log del pagamento
        await db.query(`
            INSERT INTO payment_logs (booking_id, payment_method, payment_provider, provider_transaction_id, amount, status, provider_response)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
        `, [booking_id, 'paypal', 'paypal', paypal_order_id, booking.payment_amount, 'completed', JSON.stringify(req.body)]);
        
        res.json({
            success: true,
            booking: booking,
            message: 'Pagamento PayPal confermato con successo'
        });
        
    } catch (error) {
        console.error('❌ Errore conferma PayPal:', error);
        res.status(500).json({ error: 'Errore nella conferma del pagamento PayPal' });
    }
});

/**
 * POST /api/payment/confirm-bank-transfer
 * Conferma pagamento bonifico (manuale da admin)
 */
router.post('/confirm-bank-transfer', async (req, res) => {
    try {
        const { booking_id, bank_reference } = req.body;
        
        if (!booking_id) {
            return res.status(400).json({ error: 'booking_id obbligatorio' });
        }
        
        // Aggiorna la prenotazione
        const result = await db.query(`
            UPDATE bookings 
            SET payment_status = 'completed', booking_status = 'confirmed',
                bank_transfer_reference = $1, confirmed_at = CURRENT_TIMESTAMP
            WHERE id = $2 AND payment_method = 'bank_transfer' AND payment_status = 'pending'
            RETURNING *
        `, [bank_reference, booking_id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Prenotazione non trovata o non pagabile tramite bonifico' });
        }
        
        const booking = result.rows[0];
        
        // Log del pagamento
        await db.query(`
            INSERT INTO payment_logs (booking_id, payment_method, payment_provider, provider_transaction_id, amount, status, provider_response)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
        `, [booking_id, 'bank_transfer', 'manual', bank_reference, booking.payment_amount, 'completed', JSON.stringify({ bank_reference })]);
        
        res.json({
            success: true,
            booking: booking,
            message: 'Pagamento bonifico confermato con successo'
        });
        
    } catch (error) {
        console.error('❌ Errore conferma bonifico:', error);
        res.status(500).json({ error: 'Errore nella conferma del bonifico' });
    }
});

/**
 * PayPal helper functions
 */
async function getPayPalAccessToken() {
    const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`).toString('base64');
    
    const response = await fetch(`${PAYPAL_BASE_URL}/v1/oauth2/token`, {
        method: 'POST',
        headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: 'grant_type=client_credentials'
    });
    
    const data = await response.json();
    return data.access_token;
}

/**
 * POST /api/payment/paypal/capture
 * Cattura il pagamento PayPal e aggiorna la prenotazione
 */
router.post('/paypal/capture', async (req, res) => {
    try {
        const { orderID, paypalOrder, bookingData } = req.body;
        
        if (!orderID || !paypalOrder || !bookingData) {
            return res.status(400).json({ error: 'Dati mancanti per la cattura PayPal' });
        }

        // Verifica dell'ordine PayPal
        const accessToken = await getPayPalAccessToken();
        
        const verifyResponse = await fetch(`${PAYPAL_BASE_URL}/v2/checkout/orders/${orderID}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!verifyResponse.ok) {
            throw new Error('Errore nella verifica dell\'ordine PayPal');
        }
        
        const verifiedOrder = await verifyResponse.json();
        
        if (verifiedOrder.status !== 'COMPLETED') {
            throw new Error('Ordine PayPal non completato');
        }

        // Crea o aggiorna la prenotazione
        const client = await db.getClient();
        
        try {
            await client.query('BEGIN');
            
            let bookingId;
            
            if (bookingData.tempId && bookingData.tempId.startsWith('temp_')) {
                // Nuova prenotazione
                const insertResult = await client.query(`
                    INSERT INTO bookings (
                        guest_name, guest_email, guest_phone, guest_address,
                        start_date, end_date, adults, children, children_ages,
                        total_amount, payment_amount, payment_method, payment_status,
                        booking_status, special_requests, paypal_order_id,
                        created_at, updated_at
                    ) VALUES (
                        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16,
                        CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
                    ) RETURNING id
                `, [
                    bookingData.guestName,
                    bookingData.guestEmail, 
                    bookingData.guestPhone,
                    bookingData.guestAddress,
                    bookingData.checkIn,
                    bookingData.checkOut,
                    bookingData.adults,
                    bookingData.children,
                    JSON.stringify(bookingData.childrenAges || []),
                    parseFloat(verifiedOrder.purchase_units[0].amount.value),
                    parseFloat(verifiedOrder.purchase_units[0].amount.value),
                    'paypal',
                    'completed',
                    'confirmed',
                    bookingData.specialRequests || '',
                    orderID
                ]);
                
                bookingId = insertResult.rows[0].id;
            } else {
                // Aggiorna prenotazione esistente
                await client.query(`
                    UPDATE bookings 
                    SET payment_method = 'paypal',
                        payment_status = 'completed',
                        booking_status = 'confirmed',
                        paypal_order_id = $1,
                        updated_at = CURRENT_TIMESTAMP
                    WHERE id = $2
                `, [orderID, bookingData.tempId]);
                
                bookingId = bookingData.tempId;
            }
            
            // Log del pagamento
            await client.query(`
                INSERT INTO payment_logs (
                    booking_id, payment_method, amount, currency,
                    transaction_id, status, provider_response,
                    created_at
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP)
            `, [
                bookingId,
                'paypal',
                parseFloat(verifiedOrder.purchase_units[0].amount.value),
                verifiedOrder.purchase_units[0].amount.currency_code,
                orderID,
                'completed',
                JSON.stringify(verifiedOrder)
            ]);
            
            await client.query('COMMIT');
            
            // Invia email di conferma (opzionale)
            // await emailService.sendBookingConfirmation(bookingId);
            
            res.json({
                success: true,
                bookingId: bookingId,
                message: 'Pagamento PayPal completato con successo'
            });
            
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
        
    } catch (error) {
        console.error('❌ Errore cattura PayPal:', error);
        res.status(500).json({ 
            error: 'Errore nel processamento del pagamento PayPal' 
        });
    }
});

/**
 * POST /api/payment/paypal/webhook
 * Webhook per notifiche PayPal
 */
router.post('/paypal/webhook', async (req, res) => {
    try {
        const event = req.body;
        
        console.log('📧 PayPal Webhook ricevuto:', event.event_type);
        
        switch (event.event_type) {
            case 'PAYMENT.CAPTURE.COMPLETED':
                // Gestione pagamento completato
                const orderId = event.resource.supplementary_data?.related_ids?.order_id;
                if (orderId) {
                    await db.query(`
                        UPDATE bookings 
                        SET payment_status = 'completed',
                            booking_status = 'confirmed',
                            updated_at = CURRENT_TIMESTAMP
                        WHERE paypal_order_id = $1
                    `, [orderId]);
                }
                break;
                
            case 'PAYMENT.CAPTURE.DENIED':
                // Gestione pagamento rifiutato
                const deniedOrderId = event.resource.supplementary_data?.related_ids?.order_id;
                if (deniedOrderId) {
                    await db.query(`
                        UPDATE bookings 
                        SET payment_status = 'failed',
                            booking_status = 'cancelled',
                            updated_at = CURRENT_TIMESTAMP
                        WHERE paypal_order_id = $1
                    `, [deniedOrderId]);
                }
                break;
        }
        
        res.status(200).json({ received: true });
        
    } catch (error) {
        console.error('❌ Errore webhook PayPal:', error);
        res.status(500).json({ error: 'Errore processamento webhook' });
    }
});

/**
 * GET /api/payment/status/:booking_id
 * Verifica stato pagamento di una prenotazione
 */
router.get('/status/:booking_id', async (req, res) => {
    try {
        const { booking_id } = req.params;
        
        const result = await db.query(`
            SELECT payment_status, payment_method, payment_amount, booking_status,
                   stripe_payment_intent_id, paypal_order_id, bank_transfer_reference
            FROM bookings WHERE id = $1
        `, [booking_id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Prenotazione non trovata' });
        }
        
        res.json({
            success: true,
            payment_status: result.rows[0]
        });
        
    } catch (error) {
        console.error('❌ Errore verifica stato pagamento:', error);
        res.status(500).json({ error: 'Errore nella verifica dello stato pagamento' });
    }
});

export default router;