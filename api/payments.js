import Stripe from 'stripe';
import { neon } from '@neondatabase/serverless';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2023-10-16' });
const sql = neon(process.env.DATABASE_URL);

export default async function handler(req, res) {
  const { action } = req.query;

  try {
    switch (action) {
      case 'create-intent':
        return await createPaymentIntent(req, res);
      case 'refund':
        return await processRefund(req, res);
      case 'get-transactions':
        return await getTransactions(req, res);
      case 'send-receipt':
        return await sendReceipt(req, res);
      case 'verify-status':
        return await verifyPaymentStatus(req, res);
      case 'configure-stripe':
        return await configureStripe(req, res);
      case 'configure-paypal':
        return await configurePayPal(req, res);
      default:
        return res.status(400).json({ error: 'Azione non valida' });
    }
  } catch (error) {
    console.error('❌ Errore API payments:', error);
    return res.status(500).json({ error: error.message });
  }
}

async function createPaymentIntent(req, res) {
  const { amount, booking_id, customer_email, customer_name } = req.body;

  const paymentIntent = await stripe.paymentIntents.create({
    amount: Math.round(amount * 100),
    currency: 'eur',
    receipt_email: customer_email,
    metadata: { booking_id, customer_email, customer_name },
    automatic_payment_methods: { enabled: true }
  });

  // Log transaction in DB
  await sql`
    INSERT INTO payment_transactions (
      booking_id, amount, currency, status, 
      payment_method, stripe_payment_id, customer_email
    ) VALUES (
      ${booking_id}, ${amount}, 'EUR', 'pending',
      'stripe', ${paymentIntent.id}, ${customer_email}
    )
  `;

  return res.status(200).json({ 
    clientSecret: paymentIntent.client_secret,
    paymentIntentId: paymentIntent.id 
  });
}

async function processRefund(req, res) {
  const { payment_intent_id, amount, reason } = req.body;

  const refund = await stripe.refunds.create({
    payment_intent: payment_intent_id,
    amount: amount ? Math.round(amount * 100) : undefined,
    reason: reason || 'requested_by_customer'
  });

  // Update DB
  await sql`
    UPDATE payment_transactions 
    SET status = 'refunded', refund_id = ${refund.id}, updated_at = NOW()
    WHERE stripe_payment_id = ${payment_intent_id}
  `;

  return res.status(200).json({ 
    success: true, 
    refund_id: refund.id,
    amount: refund.amount / 100 
  });
}

async function getTransactions(req, res) {
  const { limit = 50, offset = 0, status } = req.query;

  let query = sql`
    SELECT * FROM payment_transactions 
    WHERE 1=1
  `;

  if (status && status !== 'all') {
    query = sql`${query} AND status = ${status}`;
  }

  const transactions = await sql`
    ${query}
    ORDER BY created_at DESC 
    LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}
  `;

  return res.status(200).json({ transactions });
}

async function sendReceipt(req, res) {
  const { payment_id, customer_email } = req.body;

  // In a real implementation, integrate with email service
  // For now, generate receipt URL from Stripe
  const paymentIntent = await stripe.paymentIntents.retrieve(payment_id);
  
  if (paymentIntent.charges.data[0]?.receipt_url) {
    return res.status(200).json({ 
      success: true,
      receipt_url: paymentIntent.charges.data[0].receipt_url 
    });
  }

  return res.status(404).json({ error: 'Ricevuta non disponibile' });
}

async function verifyPaymentStatus(req, res) {
  const { payment_id } = req.query;

  if (!payment_id) {
    // No payment_id provided, return Stripe configuration status
    return res.status(200).json({ 
      success: true,
      configured: !!process.env.STRIPE_SECRET_KEY,
      message: process.env.STRIPE_SECRET_KEY ? 'Stripe configurato correttamente' : 'Stripe non configurato'
    });
  }

  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(payment_id);

    // Update DB with latest status
    await sql`
      UPDATE payment_transactions 
      SET status = ${paymentIntent.status}, updated_at = NOW()
      WHERE stripe_payment_id = ${payment_id}
    `;

    return res.status(200).json({ 
      status: paymentIntent.status,
      amount: paymentIntent.amount / 100,
      currency: paymentIntent.currency,
      customer_email: paymentIntent.receipt_email
    });
  } catch (error) {
    return res.status(500).json({ 
      error: error.message,
      configured: !!process.env.STRIPE_SECRET_KEY
    });
  }
}

async function configureStripe(req, res) {
  const { publishable_key, secret_key, webhook_secret } = req.body;

  // Store configuration securely (in production, use proper secrets management)
  await sql`
    INSERT INTO system_settings (key, value, category)
    VALUES 
      ('stripe_publishable_key', ${publishable_key}, 'payments'),
      ('stripe_webhook_secret', ${webhook_secret}, 'payments')
    ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value
  `;

  return res.status(200).json({ success: true, message: 'Stripe configurato con successo' });
}

async function configurePayPal(req, res) {
  const { client_id, client_secret, mode } = req.body;

  await sql`
    INSERT INTO system_settings (key, value, category)
    VALUES 
      ('paypal_client_id', ${client_id}, 'payments'),
      ('paypal_mode', ${mode}, 'payments')
    ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value
  `;

  return res.status(200).json({ success: true, message: 'PayPal configurato con successo' });
}
