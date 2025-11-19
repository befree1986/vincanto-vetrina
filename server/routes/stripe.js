const express = require('express');
const router = express.Router();
const Stripe = require('stripe');
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

router.post('/create-payment-intent', async (req, res) => {
  try {
    const { amount, customer_email, customer_name } = req.body;
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: 'eur',
      receipt_email: customer_email,
      metadata: { customer_name }
    });
    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
