import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2022-11-15' });

// Crea una sessione di Stripe Checkout
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  const { amount, customer_email, customer_name } = req.body || {};

  if (!amount || !customer_email) {
    res.status(400).json({ error: 'Parametri mancanti: amount, customer_email' });
    return;
  }

  try {
    // Line item singolo: importo passato (in EUR)
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      customer_email,
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: 'Prenotazione Vincanto',
              description: customer_name ? `Cliente: ${customer_name}` : 'Prenotazione struttura',
            },
            unit_amount: Math.round(amount * 100), // centesimi
          },
          quantity: 1,
        },
      ],
      allow_promotion_codes: false,
      billing_address_collection: 'auto',
      success_url: `${process.env.FRONTEND_BASE_URL || 'https://vincanto-vetrina.vercel.app'}/#/booking?payment=stripe_success`,
      cancel_url: `${process.env.FRONTEND_BASE_URL || 'https://vincanto-vetrina.vercel.app'}/#/booking?payment=stripe_cancel`,
      metadata: {
        customer_email,
        customer_name: customer_name || '',
        original_amount: amount,
      },
    });

    res.status(200).json({ url: session.url });
  } catch (error) {
    console.error('Errore creazione Stripe Checkout Session:', error);
    res.status(500).json({ error: 'Errore creazione sessione Stripe' });
  }
}
