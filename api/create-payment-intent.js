import Stripe from 'stripe';

cont stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {apiVersion: '2022-11-15'});

export default async function handler(req, res) {
    if (req.method !== 'POST') {
     res.status(405).json({ error: 'Method Not Allowed' });
     return;
    }
    const { amount, booking_id, customer_email, customer_name } = req.body;

    try {
        const paymentIntent = await stripe.paymentIntents.create({
            amount: Math.round(amount * 100), // Converti in centesimi
            currency: 'eur',
            receipt_email: customer_email,
            metadata: {
                booking_id,
                customer_email,
                customer_name
            }
        });
        res.status(200).json({ clientSecret: paymentIntent.client_secret });
    } catch (error) {
        console.error('Errore creazione Payment Intent:', error);
        res.status(500).json({ error: 'Errore interno del server' });
    }
}