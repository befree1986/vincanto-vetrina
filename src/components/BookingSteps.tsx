import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useBooking } from '../hooks/useBooking';
import { getSafeTranslation } from '../i18n';
import StripePaymentForm from './StripePaymentForm';
import PayPalPaymentButton from './PayPalPaymentButton';
import './BookingSteps.css';

type BookingStep3Props = {
  booking?: any;
  onBack: () => void;
};

const BookingStep3: React.FC<BookingStep3Props> = ({ booking: propBooking, onBack }) => {
  const { t } = useTranslation();
  const defaultBooking = useBooking();
  const booking = propBooking || defaultBooking;
  const [isProcessing, setIsProcessing] = useState(false);
  const [stripeClientSecret, setStripeClientSecret] = useState<string | null>(null);
  const [stripeError, setStripeError] = useState<string | null>(null);
  const [stripeSuccess, setStripeSuccess] = useState(false);
  const [paypalSuccess, setPaypalSuccess] = useState(false);
  const [paypalError, setPaypalError] = useState<string | null>(null);

  React.useEffect(() => {
    if (booking.formData.payment_method === 'stripe' && booking.quote && !stripeClientSecret) {
      setIsProcessing(true);
      setStripeError(null);
      fetch('/api/stripe/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: booking.formData.payment_type === 'deposit'
            ? Math.round(booking.quote.totalAmount * 0.3 * 100)
            : Math.round(booking.quote.totalAmount * 100),
          customer_email: booking.formData.guest_email,
          customer_name: booking.formData.guest_name + ' ' + booking.formData.guest_surname
        })
      })
        .then(res => res.json())
        .then(data => setStripeClientSecret(data.clientSecret))
        .catch(() => setStripeError('Errore nel recupero del pagamento Stripe.'))
        .finally(() => setIsProcessing(false));
    }
  }, [booking.formData.payment_method, booking.quote, booking.formData.payment_type, booking.formData.guest_email, booking.formData.guest_name, booking.formData.guest_surname, stripeClientSecret]);

  const handleStripeSuccess = () => {
    setStripeSuccess(true);
    setStripeError(null);
  };
  const handlePayPalSuccess = () => {
    setPaypalSuccess(true);
    setPaypalError(null);
  };
  const handlePayPalError = (err: string) => {
    setPaypalError(err);
  };
  const handleConfirmBooking = () => {
    setIsProcessing(true);
    // ...logica di conferma prenotazione...
    setIsProcessing(false);
  };

  return (
    <div className="booking-step">
      <div className="step-header">
        <h3>
          <span className="step-icon">💳</span>
          {getSafeTranslation(t, 'booking.step3.title', 'Pagamento')}
        </h3>
        <p>{getSafeTranslation(t, 'booking.step3.subtitle', 'Conferma la tua prenotazione')}</p>
      </div>
      <div className="payment-methods">
        {/* Stripe Elements */}
        {booking.formData.payment_method === 'stripe' && stripeClientSecret && !stripeSuccess && (
          <div className="payment-block">
            <h4>Paga con carta</h4>
            <div className="payment-form-wrapper">
              <StripePaymentForm
                clientSecret={stripeClientSecret}
                onSuccess={handleStripeSuccess}
                onError={setStripeError}
              />
            </div>
            {stripeError && <div className="error-message"><span className="icon">⚠️</span> {stripeError}</div>}
          </div>
        )}
        {stripeSuccess && (
          <div className="success-message"><span className="icon">✅</span> Pagamento completato! Prenotazione in corso...</div>
        )}
        {/* PayPal Button */}
        {booking.formData.payment_method === 'paypal' && !paypalSuccess && (
          <div className="payment-block">
            <h4>Paga con PayPal</h4>
            <div className="payment-form-wrapper">
              <PayPalPaymentButton
                amount={booking.formData.payment_type === 'deposit' && booking.quote ? booking.quote.totalAmount * 0.3 : (booking.quote?.totalAmount || 0)}
                currency="EUR"
                onSuccess={handlePayPalSuccess}
                onError={handlePayPalError}
              />
            </div>
            {paypalError && <div className="error-message"><span className="icon">⚠️</span> {paypalError}</div>}
          </div>
        )}
        {paypalSuccess && (
          <div className="success-message"><span className="icon">✅</span> Pagamento completato! Prenotazione in corso...</div>
        )}
      </div>
      <div className="booking-navigation">
        <button 
          type="button" 
          onClick={onBack}
          className="btn btn-secondary"
          disabled={isProcessing}
        >
          <span className="icon">⬅️</span>
          {getSafeTranslation(t, 'booking.navigation.back', 'Indietro')}
        </button>
        {/* Mostra il bottone conferma solo se non Stripe, Stripe lo gestisce dal form */}
        {booking.formData.payment_method !== 'stripe' && (
          <button 
            type="button" 
            onClick={handleConfirmBooking}
            className="btn btn-primary btn-confirm"
            disabled={isProcessing || (!stripeSuccess && !paypalSuccess)}
          >
            {isProcessing ? (
              <>
                <span className="loading-spinner">⏳</span>
                Elaborazione...
              </>
            ) : (
              <>
                {getSafeTranslation(t, 'booking.navigation.confirm', 'Conferma Prenotazione')}
                <span className="icon">✅</span>
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
};

export default BookingStep3;
export { BookingStep3 };