import React from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import BookingStep3 from './BookingSteps';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

const BookingStep3WithStripe: React.FC<any> = (props) => (
  <Elements stripe={stripePromise}>
    <BookingStep3 {...props} />
  </Elements>
);

export default BookingStep3WithStripe;
