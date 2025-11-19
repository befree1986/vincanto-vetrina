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

  // Calcolo importi
  const quote = booking.quote;
  const total = quote ? quote.totalAmount : 0;
  const deposit = Math.round(total * 0.3 * 100) / 100;
  const saldo = Math.round((total - deposit) * 100) / 100;
  const isDeposit = booking.formData.payment_type === 'deposit';

  return (
    <div className="booking-step">
      <div className="step-header">
        <h3>
          <span className="step-icon">💳</span>
          {getSafeTranslation(t, 'booking.step3.title', 'Pagamento')}
        </h3>
        <p>{getSafeTranslation(t, 'booking.step3.subtitle', 'Conferma la tua prenotazione')}</p>
      </div>

      {/* Riepilogo importi */}
      <div className="payment-summary">
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

      {/* Scelta acconto/totale */}
      <div className="payment-choice">
        <label>
          <input
            type="radio"
            name="payment_type"
            value="deposit"
            checked={booking.formData.payment_type === 'deposit'}
            onChange={() => booking.setFormData({ payment_type: 'deposit' })}
          />
          Acconto 30% ora, saldo al check-in
        </label>
        <label className="ml-24">
          <input
            type="radio"
            name="payment_type"
            value="full"
            checked={booking.formData.payment_type === 'full'}
            onChange={() => booking.setFormData({ payment_type: 'full' })}
          />
          Paga l'intero importo ora
        </label>
      </div>

      {/* Scelta metodo di pagamento */}
      <div className="payment-choice">
        <label>
          <input
            type="radio"
            name="payment_method"
            value="stripe"
            checked={booking.formData.payment_method === 'stripe'}
            onChange={() => booking.setFormData({ payment_method: 'stripe' })}
          />
          Carta di credito (Stripe)
        </label>
        <label className="ml-24">
          <input
            type="radio"
            name="payment_method"
            value="paypal"
            checked={booking.formData.payment_method === 'paypal'}
            onChange={() => booking.setFormData({ payment_method: 'paypal' })}
          />
          PayPal
        </label>
        <label className="ml-24">
          <input
            type="radio"
            name="payment_method"
            value="bank_transfer"
            checked={booking.formData.payment_method === 'bank_transfer'}
            onChange={() => booking.setFormData({ payment_method: 'bank_transfer' })}
          />
          Bonifico bancario
        </label>
      </div>

      {/* Sezione pagamento effettivo */}
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
                amount={isDeposit && booking.quote ? booking.quote.totalAmount * 0.3 : (booking.quote?.totalAmount || 0)}
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
        {/* Mostra il bottone conferma solo se non Stripe, Stripe lo gestisce dal form */}
        {booking.formData.payment_method === 'bank_transfer' && (
          <button 
            type="button" 
            onClick={handleConfirmBooking}
            className="btn btn-primary btn-confirm"
            disabled={isProcessing}
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