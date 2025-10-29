/**
 * Stripe Payment Integration per Vincanto Backend
 * Gestisce Payment Intent, Webhook e conferme pagamento
 */

const express = require('express');
const router = express.Router();

// Stripe configuration - usare variabili ambiente in produzione
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || 'sk_test_...';
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || 'whsec_...';

let stripe;
try {
    stripe = require('stripe')(STRIPE_SECRET_KEY);
    console.log('✅ Stripe inizializzato correttamente');
} catch (error) {
    console.error('❌ Errore inizializzazione Stripe:', error.message);
}

// Storage temporaneo per payment intents (in produzione usare database)
let paymentIntents = [];

/**
 * POST /api/stripe/create-payment-intent
 * Crea un Payment Intent per il booking
 */
router.post('/create-payment-intent', async (req, res) => {
    try {
        const { booking_id, amount, customer_email, customer_name } = req.body;
        
        console.log('💳 Creazione Payment Intent:', { booking_id, amount, customer_email });
        
        if (!stripe) {
            return res.status(500).json({
                success: false,
                error: 'Stripe non configurato'
            });
        }
        
        if (!booking_id || !amount) {
            return res.status(400).json({
                success: false,
                error: 'booking_id e amount obbligatori'
            });
        }
        
        // Converti amount in centesimi (Stripe requirement)
        const amountInCents = Math.round(amount * 100);
        
        // Crea Payment Intent
        const paymentIntent = await stripe.paymentIntents.create({
            amount: amountInCents,
            currency: 'eur',
            metadata: {
                booking_id: booking_id,
                property: 'vincanto-maiori'
            },
            description: `Prenotazione Vincanto Maiori - ${booking_id}`,
            receipt_email: customer_email,
            // Setup future usage for potential refunds
            setup_future_usage: 'off_session'
        });
        
        // Salva riferimento payment intent
        paymentIntents.push({
            id: paymentIntent.id,
            booking_id,
            amount,
            customer_email,
            customer_name,
            status: paymentIntent.status,
            created_at: new Date().toISOString()
        });
        
        console.log('✅ Payment Intent creato:', paymentIntent.id);
        
        res.json({
            success: true,
            client_secret: paymentIntent.client_secret,
            payment_intent_id: paymentIntent.id
        });
        
    } catch (error) {
        console.error('❌ Errore Payment Intent:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * POST /api/stripe/confirm-payment
 * Conferma il pagamento dopo il successo Stripe
 */
router.post('/confirm-payment', async (req, res) => {
    try {
        const { payment_intent_id } = req.body;
        
        console.log('✅ Conferma pagamento:', payment_intent_id);
        
        if (!stripe) {
            return res.status(500).json({
                success: false,
                error: 'Stripe non configurato'
            });
        }
        
        // Recupera Payment Intent da Stripe
        const paymentIntent = await stripe.paymentIntents.retrieve(payment_intent_id);
        
        if (paymentIntent.status !== 'succeeded') {
            return res.status(400).json({
                success: false,
                error: 'Pagamento non completato'
            });
        }
        
        // Trova il payment intent locale
        const localPayment = paymentIntents.find(p => p.id === payment_intent_id);
        if (localPayment) {
            localPayment.status = 'succeeded';
            localPayment.completed_at = new Date().toISOString();
        }
        
        // TODO: Aggiornare database booking con stato "paid"
        // TODO: Inviare email di conferma
        
        res.json({
            success: true,
            message: 'Pagamento confermato',
            booking_id: paymentIntent.metadata.booking_id,
            amount: paymentIntent.amount / 100, // Converti da centesimi
            status: paymentIntent.status
        });
        
    } catch (error) {
        console.error('❌ Errore conferma pagamento:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * POST /api/stripe/webhook
 * Gestisce webhook Stripe per eventi automatici
 */
router.post('/webhook', express.raw({type: 'application/json'}), async (req, res) => {
    try {
        const sig = req.headers['stripe-signature'];
        let event;
        
        if (!STRIPE_WEBHOOK_SECRET || STRIPE_WEBHOOK_SECRET === 'whsec_...') {
            console.log('⚠️ Webhook Stripe ricevuto ma secret non configurato, simulazione evento');
            event = JSON.parse(req.body);
        } else {
            event = stripe.webhooks.constructEvent(req.body, sig, STRIPE_WEBHOOK_SECRET);
        }
        
        console.log(`🔔 Webhook Stripe: ${event.type}`);
        
        switch (event.type) {
            case 'payment_intent.succeeded':
                const paymentIntent = event.data.object;
                console.log('✅ Pagamento completato automaticamente:', paymentIntent.id);
                
                // Trova e aggiorna il payment locale
                const payment = paymentIntents.find(p => p.id === paymentIntent.id);
                if (payment) {
                    payment.status = 'succeeded';
                    payment.webhook_received_at = new Date().toISOString();
                }
                
                // TODO: Aggiornare database booking
                // TODO: Inviare email automatica di conferma
                break;
                
            case 'payment_intent.payment_failed':
                const failedPayment = event.data.object;
                console.log('❌ Pagamento fallito:', failedPayment.id);
                
                const failedLocal = paymentIntents.find(p => p.id === failedPayment.id);
                if (failedLocal) {
                    failedLocal.status = 'failed';
                    failedLocal.failed_at = new Date().toISOString();
                }
                break;
                
            default:
                console.log(`🔔 Evento Stripe non gestito: ${event.type}`);
        }
        
        res.json({received: true});
        
    } catch (error) {
        console.error('❌ Errore webhook Stripe:', error);
        res.status(400).json({
            success: false,
            error: 'Webhook validation failed'
        });
    }
});

/**
 * GET /api/stripe/payment-status/:payment_intent_id
 * Verifica stato di un pagamento
 */
router.get('/payment-status/:payment_intent_id', async (req, res) => {
    try {
        const { payment_intent_id } = req.params;
        
        if (!stripe) {
            return res.status(500).json({
                success: false,
                error: 'Stripe non configurato'
            });
        }
        
        const paymentIntent = await stripe.paymentIntents.retrieve(payment_intent_id);
        const localPayment = paymentIntents.find(p => p.id === payment_intent_id);
        
        res.json({
            success: true,
            payment_intent_id,
            status: paymentIntent.status,
            amount: paymentIntent.amount / 100,
            booking_id: paymentIntent.metadata?.booking_id,
            local_data: localPayment
        });
        
    } catch (error) {
        console.error('❌ Errore verifica stato:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/stripe/payments
 * Lista tutti i pagamenti
 */
router.get('/payments', (req, res) => {
    res.json({
        success: true,
        payments: paymentIntents,
        total: paymentIntents.length
    });
});

module.exports = router;