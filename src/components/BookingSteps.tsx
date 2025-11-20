import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useBooking } from '../hooks/useBooking';
import { getSafeTranslation } from '../i18n';
import StripePaymentForm from './StripePaymentForm';
import './BookingSteps.css';
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js';

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
  const [bookingConfirmed, setBookingConfirmed] = useState(false);

  React.useEffect(() => {
    if (booking.formData.payment_method === 'stripe' && booking.quote && !stripeClientSecret) {
      setIsProcessing(true);
      setStripeError(null);
      fetch('/api/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: booking.formData.payment_type === 'deposit'
            ? Math.round(booking.quote.totalAmount * 0.3 * 100) / 100
            : Math.round(booking.quote.totalAmount * 100) / 100,
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
    // Salva la prenotazione dopo pagamento Stripe
    fetch('/api/booking/confirm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        payment_method: 'stripe',
        payment_status: 'success',
        payment_id: null, // puoi passare l'id Stripe se disponibile
        amount: booking.formData.payment_type === 'deposit'
          ? Math.round(booking.quote.totalAmount * 0.3 * 100) / 100
          : Math.round(booking.quote.totalAmount * 100) / 100,
        booking_data: booking.formData
      })
    })
      .then(() => handleConfirmBooking())
      .catch(() => handleConfirmBooking());
  };
  const handlePayPalSuccess = () => {
    setPaypalSuccess(true);
    setPaypalError(null);
    // Salva la prenotazione dopo pagamento PayPal
    fetch('/api/booking/confirm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        payment_method: 'paypal',
        payment_status: 'success',
        payment_id: null, // puoi passare l'id PayPal se disponibile
        amount: booking.formData.payment_type === 'deposit'
          ? Math.round(booking.quote.totalAmount * 0.3 * 100) / 100
          : Math.round(booking.quote.totalAmount * 100) / 100,
        booking_data: booking.formData
      })
    })
      .then(() => handleConfirmBooking())
      .catch(() => handleConfirmBooking());
  };
  const handlePayPalError = (err: string) => {
    setPaypalError(err);
  };
  const handleConfirmBooking = () => {
    setIsProcessing(true);
    // Se pagamento con bonifico, salva la prenotazione come pending
    if (booking.formData.payment_method === 'bank_transfer') {
      fetch('/api/booking/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          payment_method: 'bank_transfer',
          payment_status: 'pending',
          payment_id: null,
          amount: booking.formData.payment_type === 'deposit'
            ? Math.round(booking.quote.totalAmount * 0.3 * 100) / 100
            : Math.round(booking.quote.totalAmount * 100) / 100,
          booking_data: booking.formData
        })
      })
        .then(() => {
          setIsProcessing(false);
          setBookingConfirmed(true);
        })
        .catch(() => {
          setIsProcessing(false);
          setBookingConfirmed(true);
        });
    } else {
      setIsProcessing(false);
      setBookingConfirmed(true);
    }
  };

  // Calcolo importi
  const quote = booking.quote;
  const total = quote ? quote.totalAmount : 0;
  const deposit = Math.round(total * 0.3 * 100) / 100;
  const saldo = Math.round((total - deposit) * 100) / 100;
  const isDeposit = booking.formData.payment_type === 'deposit';

  if (bookingConfirmed) {
    return (
      <div className="booking-confirmed-message">
        <h2>{getSafeTranslation(t, 'booking.confirmed', 'Prenotazione confermata!')}</h2>
        <p>{getSafeTranslation(t, 'booking.thank_you', 'Grazie per aver prenotato con noi.')}</p>
      </div>
    );
  }

  return (
    <div className="booking-step payment-step-box">
      <div className="payment-header">
        <span className="step-icon">💳</span>
        <div>
          <h3>{getSafeTranslation(t, 'booking.step3.title', 'Pagamento')}</h3>
          <p>{getSafeTranslation(t, 'booking.step3.subtitle', 'Conferma la tua prenotazione')}</p>
        </div>
      </div>

      <div className="payment-summary-box">
        <div className="summary-row">
          <span>Totale soggiorno:</span>
          <span><strong>€{total.toFixed(2)}</strong></span>
        </div>
        <div className="summary-row">
          <span>Acconto (30%):</span>
          <span>€{deposit.toFixed(2)}</span>
        </div>
        <div className="summary-row">
          <span>Saldo al check-in:</span>
          <span>€{saldo.toFixed(2)}</span>
        </div>
      </div>

      <div className="payment-choice-box">
        <div className="payment-choice-btn-group">
          <button
            type="button"
            className={`choice-btn${booking.formData.payment_type === 'deposit' ? ' active' : ''}`}
            onClick={() => booking.setFormData({ payment_type: 'deposit' })}
          >
            Acconto 30% ora, saldo al check-in
          </button>
          <button
            type="button"
            className={`choice-btn${booking.formData.payment_type === 'full' ? ' active' : ''}`}
            onClick={() => {
              booking.setFormData({ payment_type: 'full' });
              // Logica: azzera acconto se si paga tutto
              if (typeof booking.setDeposit === 'function') booking.setDeposit(0);
            }}
          >
            Paga l'intero importo ora
          </button>
        </div>
        <div className="payment-choice-btn-group">
          <button
            type="button"
            className={`choice-btn${booking.formData.payment_method === 'stripe' ? ' active' : ''}`}
            onClick={() => booking.setFormData({ payment_method: 'stripe' })}
          >
            <img src="/icons/stripe_icon.webp" alt="Stripe" className="payment-logo" />
            Carta di credito (Stripe)
          </button>
          <button
            type="button"
            className={`choice-btn${booking.formData.payment_method === 'paypal' ? ' active' : ''}`}
            onClick={() => booking.setFormData({ payment_method: 'paypal' })}
          >
            <img src="/icons/PayPal_icon.webp" alt="PayPal" className="payment-logo" />
            PayPal
          </button>
          <button
            type="button"
            className={`choice-btn${booking.formData.payment_method === 'bank_transfer' ? ' active' : ''}`}
            onClick={() => booking.setFormData({ payment_method: 'bank_transfer' })}
          >
            <img src="/icons/bonifico_icon.webp" alt="Bonifico" className="payment-logo" />
            Bonifico bancario
          </button>
        </div>
      </div>

      <div className="payment-methods">
        {/* Stripe Elements: mostra sempre se selezionato e c'è un preventivo */}
        {booking.formData.payment_method === 'stripe' && booking.quote && stripeClientSecret && !stripeSuccess && (
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
            <button
              type="button"
              className="btn btn-primary btn-pay btn-pay-margin"
              onClick={() => {
                const btn = document.querySelector('.StripePaymentForm button[type=submit]') as HTMLButtonElement | null;
                btn?.click();
              }}
              disabled={isProcessing}
            >
              {isProcessing ? 'Elaborazione...' : 'Effettua pagamento'}
            </button>
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
              <PayPalScriptProvider options={{ "client-id": import.meta.env.VITE_PAYPAL_CLIENT_ID || '', clientId: import.meta.env.VITE_PAYPAL_CLIENT_ID || '', currency: 'EUR' }}>
                <PayPalButtons
                  createOrder={(_data, actions) => {
                    return actions.order.create({
                      intent: 'CAPTURE',
                      purchase_units: [{
                        amount: {
                          value: (isDeposit && booking.quote ? (booking.quote.totalAmount * 0.3) : (booking.quote?.totalAmount || 0)).toFixed(2),
                          currency_code: 'EUR'
                        }
                      }]
                    });
                  }}
                  onApprove={(_data, actions) => {
                    return actions.order!.capture().then((_details: any) => {
                      handlePayPalSuccess();
                    });
                  }}
                  onError={(err: any) => handlePayPalError(err?.message || 'Errore PayPal')}
                />
              </PayPalScriptProvider>
            </div>
            {paypalError && <div className="error-message"><span className="icon">⚠️</span> {paypalError}</div>}
            <button
              type="button"
              className="btn btn-primary btn-pay btn-pay-margin"
              onClick={() => {
                const btn = document.querySelector('.paypal-buttons button') as HTMLButtonElement | null;
                btn?.click();
              }}
              disabled={isProcessing}
            >
              {isProcessing ? 'Elaborazione...' : 'Effettua pagamento'}
            </button>
          </div>
        )}
        {paypalSuccess && (
          <div className="success-message"><span className="icon">✅</span> Pagamento completato! Prenotazione in corso...</div>
        )}

        {/* Bonifico bancario */}
        {booking.formData.payment_method === 'bank_transfer' && (
          <div className="payment-block">
            <h4>Dati per Bonifico Bancario</h4>
            <div className="bank-details">
              <p><strong>Intestatario:</strong> Vincanto Srl</p>
              <p><strong>IBAN:</strong> IT00X0000000000000000000000</p>
              <p><strong>Causale:</strong> Prenotazione {booking.formData.guest_name} {booking.formData.guest_surname} - {booking.formData.check_in_date ? new Date(booking.formData.check_in_date).toLocaleDateString('it-IT') : ''}</p>
              <p><strong>Importo da versare:</strong> €{isDeposit ? deposit.toFixed(2) : total.toFixed(2)}</p>
            </div>
            <div className="info-message info-mt-12">
              Dopo aver effettuato il bonifico, invia la ricevuta a <a href="mailto:info@vincantomaori.it">info@vincantomaori.it</a> per confermare la prenotazione.
            </div>
            <button
              type="button"
              className="btn btn-primary btn-confirm btn-pay-margin"
              onClick={handleConfirmBooking}
              disabled={isProcessing}
            >
              {isProcessing ? 'Elaborazione...' : 'Conferma prenotazione'}
            </button>
          </div>
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
      </div>
    </div>
  );
};

export default BookingStep3;
export { BookingStep3 };