// ESEMPIO: Integrazione Stripe Checkout (0 API Vercel necessarie)

// Frontend - src/components/PaymentButton.jsx
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe('pk_live_...');

export default function PaymentButton({ bookingData }) {
    const handlePayment = async () => {
        const stripe = await stripePromise;
        
        // Redirect diretto a Stripe Checkout (no API Vercel)
        const { error } = await stripe.redirectToCheckout({
            lineItems: [{
                price: 'price_vincanto_booking', // Configurato su Stripe
                quantity: 1,
            }],
            mode: 'payment',
            successUrl: `${window.location.origin}/booking-success?session_id={CHECKOUT_SESSION_ID}`,
            cancelUrl: `${window.location.origin}/booking-cancelled`,
            metadata: {
                bookingId: bookingData.id,
                checkIn: bookingData.checkIn,
                checkOut: bookingData.checkOut
            }
        });

        if (error) console.error(error);
    };

    return (
        <button onClick={handlePayment} className="stripe-checkout-btn">
            Paga €{bookingData.total} con Stripe
        </button>
    );
}

// Webhook Handler - api/stripe-webhook.js (UNICA API necessaria)
import { buffer } from 'micro';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).end();

    const sig = req.headers['stripe-signature'];
    const rawBody = await buffer(req);

    try {
        const event = stripe.webhooks.constructEvent(
            rawBody, 
            sig, 
            process.env.STRIPE_WEBHOOK_SECRET
        );

        switch (event.type) {
            case 'checkout.session.completed':
                const session = event.data.object;
                
                // Aggiorna database prenotazione
                await updateBookingStatus(session.metadata.bookingId, 'confirmed');
                
                // Invia email conferma (SendGrid)
                await sendConfirmationEmail(session.customer_email, session.metadata);
                
                break;
        }

        res.json({ received: true });
    } catch (err) {
        res.status(400).send(`Webhook Error: ${err.message}`);
    }
}

// Notifiche Email - nessuna API Vercel (SendGrid diretto)
// src/services/emailService.js
export async function sendConfirmationEmail(email, bookingData) {
    // Chiamata diretta a SendGrid (no API Vercel)
    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${process.env.SENDGRID_API_KEY}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            from: { email: 'noreply@vincantomaiori.it', name: 'Vincanto' },
            personalizations: [{
                to: [{ email }],
                dynamic_template_data: {
                    booking_id: bookingData.bookingId,
                    check_in: bookingData.checkIn,
                    check_out: bookingData.checkOut,
                    guest_name: bookingData.guestName
                }
            }],
            template_id: 'd-vincanto-booking-confirmation'
        })
    });
    
    return response.json();
}