
import Stripe from 'stripe';
import { Pool } from 'pg';

// Inizializza Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2022-11-15' });

// Inizializza PostgreSQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Secret del webhook
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  // Stripe richiede il raw body per la verifica della firma
  let event;
  try {
    const sig = req.headers['stripe-signature'];
    // Su Vercel, req.body potrebbe essere già parsato: assicurati che sia un buffer/raw
    // Se usi Vercel, puoi abilitare il raw body con config (vedi commento sotto)
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    console.error('❌ Errore verifica firma webhook:', err.message);
    res.status(400).send(`Webhook Error: ${err.message}`);
    return;
  }

  // Gestisci solo payment_intent.succeeded
  if (event.type === 'payment_intent.succeeded') {
    const paymentIntent = event.data.object;
    try {
      await pool.query(
        `INSERT INTO stripe_payments (
          payment_intent_id,
          booking_id,
          amount,
          currency,
          status,
          customer_email,
          stripe_customer_id,
          payment_method,
          description,
          raw_event,
          created_at,
          updated_at
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,NOW(),NOW())`,
        [
          paymentIntent.id,
          paymentIntent.metadata?.booking_id || null,
          paymentIntent.amount / 100,
          paymentIntent.currency,
          paymentIntent.status,
          paymentIntent.receipt_email || paymentIntent.metadata?.customer_email || null,
          paymentIntent.customer || null,
          paymentIntent.payment_method_types ? paymentIntent.payment_method_types[0] : null,
          paymentIntent.description || null,
          JSON.stringify(event)
        ]
      );
      console.log('✅ Pagamento Stripe salvato:', paymentIntent.id);
    } catch (dbError) {
      console.error('❌ Errore salvataggio pagamento su DB:', dbError.message);
      res.status(500).json({ error: 'Errore salvataggio pagamento' });
      return;
    }
  }

  res.status(200).json({ received: true });
}

// NB: Ricorda di impostare STRIPE_WEBHOOK_SECRET tra le variabili ambiente su Vercel!
// NB2: La tabella stripe_payments deve avere i campi suggeriti (vedi query SQL fornita)
// NB3: Su Vercel, per i webhook Stripe, puoi aggiungere in fondo al file:
// export const config = { api: { bodyParser: false } };
// e usare un middleware per ottenere il raw body se necessario.
