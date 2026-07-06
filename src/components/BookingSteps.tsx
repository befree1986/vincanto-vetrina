import React, { useState } from 'react';
import { log } from '../utils/logger';
import { useTranslation } from 'react-i18next';
import { useBooking } from '../hooks/useBooking';
import { getSafeTranslation } from '../i18n';
import './BookingSteps.css';
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js';
import i18n from '../i18n';

type BookingStep3Props = {
  booking?: any;
  onBack: () => void;
  selectedExtraServices?: any[];
  extraServicesCost?: number;
};


const BookingStep3: React.FC<BookingStep3Props> = ({
  booking: propBooking,
  onBack,
  selectedExtraServices = [],
  extraServicesCost: _extraServicesCost = 0
}) => {
  const { t } = useTranslation();
  const defaultBooking = useBooking();
  const booking = propBooking || defaultBooking;
  const quote = booking.quote;
  const totalGuests = quote ? (quote.adults) + (quote.children) : 0;

  // Calcola il costo extra dinamicamente in base a quote
  const getExtraServicesCost = () => {
    if (!quote) return 0;
    
    // 🐛 DEBUG: Calcolo servizi extra
    log('[BookingSteps] getExtraServicesCost - Quote:', quote);
    log('[BookingSteps] getExtraServicesCost - SelectedExtraServices:', selectedExtraServices);
    log('[BookingSteps] getExtraServicesCost - _extraServicesCost prop:', _extraServicesCost);
    
    // 🔧 FIX: Usa il costo già calcolato invece di ricalcolarlo
    if (_extraServicesCost > 0) {
      log('[BookingSteps] Usando costo extra pre-calcolato:', _extraServicesCost);
      return _extraServicesCost;
    }
    
    // Calcola manualmente il costo dei servizi extra selezionati (ESCLUSO PARCHEGGIO)
    const reducedCost = selectedExtraServices
      .filter(s => !s.isParking && s.category !== 'parcheggio') // Escludi parcheggio (già nel quote)
      .reduce((tot, s) => {
        // Calcola moltiplicatore in base all'unità
        let multiplier = 1;
        if (s.unit === 'notte' || s.unit === 'per_night') {
          multiplier = quote.nights || 1;
        } else if (s.unit === 'persona' || s.unit === 'per_person') {
          multiplier = quote.guests || 1;
        } else if (s.unit === 'per_person_per_day') {
          multiplier = (quote.guests || 1) * (quote.nights || 1);
        }
        // I servizi inclusi non hanno costo aggiuntivo
        const cost = s.included ? 0 : (s.price || 0) * multiplier;
        log(`[BookingSteps] Servizio "${s.name}": €${s.price} × ${multiplier} = €${cost} ${s.included ? '(INCLUSO)' : ''}`);
        return tot + cost;
      }, 0);
    log('[BookingSteps] Costo ridotto manualmente:', reducedCost);
    return reducedCost;
  };
  const extraServicesCost = getExtraServicesCost();
  log('[BookingSteps] 💰 Totale extra servizi finale:', extraServicesCost);
  const total = quote ? quote.totalAmount + extraServicesCost : 0;
  log('[BookingSteps] 💰 Totale soggiorno (quote + extra):', total);
  const deposit = Math.round(total * 0.3 * 100) / 100;
  const saldo = Math.round((total - deposit) * 100) / 100;
  const isDeposit = booking.formData.payment_type === 'deposit';
  const [isProcessing, setIsProcessing] = useState(false);
  const [stripeSuccess] = useState(false);
  const [paypalSuccess, setPaypalSuccess] = useState(false);
  const [paypalError, setPaypalError] = useState<string | null>(null);
  const [bookingConfirmed, setBookingConfirmed] = useState(false);
  const [stripeResult, setStripeResult] = useState<'success' | 'cancel' | null>(null);
  const [confirmError, setConfirmError] = useState<string | null>(null);

  // Rileva parametro payment nel hash (#/booking?payment=stripe_success)
  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    const hash = window.location.hash || '';
    const queryPart = hash.includes('?') ? hash.split('?')[1] : '';
    const params = new URLSearchParams(queryPart);
    const paymentParam = params.get('payment');
    if (paymentParam === 'stripe_success') {
      setStripeResult('success');
    } else if (paymentParam === 'stripe_cancel') {
      setStripeResult('cancel');
    }
  }, []);

  // Se successo Stripe, conferma prenotazione e invia email finale
  React.useEffect(() => {
    const finalize = async () => {
      if (stripeResult !== 'success') return;
      try {
        const rawData = localStorage.getItem('pendingBookingData');
        const rawQuote = localStorage.getItem('pendingBookingQuote');
        if (!rawData || !rawQuote) {
          setConfirmError('Dati prenotazione non trovati dopo il pagamento.');
          return;
        }
        const bookingData = JSON.parse(rawData);
        const quoteData = JSON.parse(rawQuote);
        const amountPaid = bookingData.payment_type === 'deposit'
          ? Math.round(quoteData.totalAmount * 0.3 * 100) / 100
          : Math.round(quoteData.totalAmount * 100) / 100;

        // Prepara i dati formattati per l'API
        const formattedBookingData = {
          guest_name: bookingData.guest_name,
          guest_surname: bookingData.guest_surname || bookingData.last_name || '',
          guest_email: bookingData.guest_email || bookingData.email,
          guest_phone: bookingData.guest_phone || bookingData.phone || '',
          check_in_date: bookingData.check_in_date || bookingData.checkin,
          check_out_date: bookingData.check_out_date || bookingData.checkout,
          adults: bookingData.num_adults || bookingData.adults || 1,
          children: bookingData.num_children || bookingData.children || 0,
          children_ages: bookingData.children_ages || [],
          parking_option: bookingData.parking_option,
          payment_method: 'stripe',
          payment_type: bookingData.payment_type,
          special_requests: bookingData.guest_message || bookingData.special_requests || '',
          email: bookingData.guest_email || bookingData.email,
          phone: bookingData.guest_phone || bookingData.phone || '',
          guests: (bookingData.num_adults || bookingData.adults || 1) + (bookingData.num_children || bookingData.children || 0),
          language: i18n.language || 'it'
        };

        // Ricostruisci breakdown costi da quoteData
        const breakdownData = {
            accommodationCost: quoteData.accommodationCost || 0,
            cleaningFee: quoteData.cleaningFee || 0,
            parkingCost: quoteData.parkingCost || 0,
            touristTax: quoteData.touristTax || 0,
            extraServicesCost: extraServicesCost || 0,
            nights: quoteData.nights || 0
        };

        const resp = await fetch('/api/unified?action=booking', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            payment_method: 'stripe',
            payment_status: 'success',
            payment_id: null,
            amount: amountPaid,
            total_amount: quoteData.totalAmount,
            booking_data: formattedBookingData,
            ...breakdownData, // 🛎️ Invia breakdown costi
            extra_services: selectedExtraServices // 🛎️ Invia servizi extra
          })
        });
        const data = await resp.json();
        if (!data.success) {
          setConfirmError(data.error || 'Errore conferma prenotazione');
        } else {
          setBookingConfirmed(true);
          log('✅ Prenotazione Stripe salvata:', data.bookingId);
          try {
            await fetch('/api/send-final-email', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                firstName: bookingData.guest_name || bookingData.first_name || '',
                lastName: bookingData.guest_surname || bookingData.last_name || '',
                bookingId: data.bookingId || data.id || 'N/D',
                checkin: bookingData.check_in_date || bookingData.checkin || '',
                checkout: bookingData.check_out_date || bookingData.checkout || '',
                totalAmount: quoteData.totalAmount,
                amountPaid,
                guestEmail: bookingData.guest_email || bookingData.email || '',
                language: i18n.language || 'it'
              })
            });
          } catch (emailErr) {
            console.warn('Errore invio email finale:', emailErr);
          }
          localStorage.removeItem('pendingBookingData');
          localStorage.removeItem('pendingBookingQuote');
        }
      } catch (e) {
        setConfirmError('Eccezione conferma: ' + (e instanceof Error ? e.message : String(e)));
      }
    };
    finalize();
  }, [stripeResult]);


  const handlePayPalSuccess = () => {
    setPaypalSuccess(true);
    setPaypalError(null);
    const amountPaid = booking.formData.payment_type === 'deposit'
      ? Math.round(booking.quote.totalAmount * 0.3 * 100) / 100
      : Math.round(booking.quote.totalAmount * 100) / 100;
    
    const bookingData = {
      guest_name: booking.formData.guest_name,
      guest_surname: booking.formData.guest_surname,
      guest_email: booking.formData.guest_email || booking.formData.email,
      guest_phone: booking.formData.guest_phone || booking.formData.phone,
      check_in_date: booking.formData.check_in_date || booking.formData.checkin,
      check_out_date: booking.formData.check_out_date || booking.formData.checkout,
      adults: booking.formData.num_adults || booking.formData.adults || 1,
      children: booking.formData.num_children || booking.formData.children || 0,
      children_ages: booking.formData.children_ages || [],
      parking_option: booking.formData.parking_option,
      payment_method: 'paypal',
      payment_type: booking.formData.payment_type,
      special_requests: booking.formData.guest_message || booking.formData.special_requests || '',
      email: booking.formData.guest_email || booking.formData.email,
      phone: booking.formData.guest_phone || booking.formData.phone,
      guests: (booking.formData.num_adults || booking.formData.adults || 1) + (booking.formData.num_children || booking.formData.children || 0),
      language: i18n.language || 'it'
    };

    // Ricostruisci breakdown costi
    const breakdownData = booking.quote ? {
        accommodationCost: booking.quote.accommodationCost,
        cleaningFee: booking.quote.cleaningFee,
        parkingCost: booking.quote.parkingCost,
        touristTax: booking.quote.touristTax,
        extraServicesCost: extraServicesCost,
        nights: booking.quote.nights
    } : {};

    fetch('/api/unified?action=booking', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        payment_method: 'paypal',
        payment_status: 'success',
        payment_id: null,
        amount: amountPaid,
        total_amount: booking.quote.totalAmount,
        booking_data: bookingData,
        ...breakdownData, // 🛎️ Invia breakdown costi
        extra_services: selectedExtraServices // 🛎️ Invia servizi extra
      })
    })
      .then(async (resp) => {
        const data = await resp.json();
        if (data.success) {
          log('✅ Prenotazione PayPal salvata:', data.bookingId);
        }
        try {
          await fetch('/api/send-final-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              firstName: booking.formData.guest_name || booking.formData.first_name || '',
              lastName: booking.formData.guest_surname || booking.formData.last_name || '',
              bookingId: data.bookingId || data.id || 'N/D',
              checkin: booking.formData.check_in_date || booking.formData.checkin || '',
              checkout: booking.formData.check_out_date || booking.formData.checkout || '',
              totalAmount: booking.quote.totalAmount,
              amountPaid,
              guestEmail: booking.formData.guest_email || booking.formData.email || '',
              language: i18n.language || 'it'
            })
          });
        } catch (e) {
          console.warn('Errore email finale PayPal:', e);
        }
        handleConfirmBooking();
      })
      .catch(() => handleConfirmBooking());
  };
  const handlePayPalError = (err: string) => {
    setPaypalError(err);
  };
  const handleConfirmBooking = () => {
    setIsProcessing(true);
    // Se pagamento con bonifico, salva la prenotazione come pending
    if (booking.formData.payment_method === 'bank_transfer') {
      const bookingData = {
        guest_name: booking.formData.guest_name,
        guest_surname: booking.formData.guest_surname,
        guest_email: booking.formData.guest_email || booking.formData.email,
        guest_phone: booking.formData.guest_phone || booking.formData.phone,
        check_in_date: booking.formData.check_in_date || booking.formData.checkin,
        check_out_date: booking.formData.check_out_date || booking.formData.checkout,
        adults: booking.formData.num_adults || booking.formData.adults || 1,
        children: booking.formData.num_children || booking.formData.children || 0,
        children_ages: booking.formData.children_ages || [],
        parking_option: booking.formData.parking_option,
        payment_method: 'bank_transfer',
        payment_type: booking.formData.payment_type,
        special_requests: booking.formData.guest_message || booking.formData.special_requests || '',
        email: booking.formData.guest_email || booking.formData.email,
        phone: booking.formData.guest_phone || booking.formData.phone,
        guests: (booking.formData.num_adults || booking.formData.adults || 1) + (booking.formData.num_children || booking.formData.children || 0),
        language: i18n.language || 'it'
      };

      // Ricostruisci breakdown costi
      const breakdownData = booking.quote ? {
          accommodationCost: booking.quote.accommodationCost,
          cleaningFee: booking.quote.cleaningFee,
          parkingCost: booking.quote.parkingCost,
          touristTax: booking.quote.touristTax,
          extraServicesCost: extraServicesCost,
          nights: booking.quote.nights
      } : {};

      fetch('/api/unified?action=booking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          payment_method: 'bank_transfer',
          payment_status: 'pending',
          payment_id: null,
          amount: booking.formData.payment_type === 'deposit'
            ? Math.round(booking.quote.totalAmount * 0.3 * 100) / 100
            : Math.round(booking.quote.totalAmount * 100) / 100,
          total_amount: booking.quote.totalAmount,
          booking_data: bookingData,
          ...breakdownData, // 🛎️ Invia breakdown costi
          extra_services: selectedExtraServices // 🛎️ Invia servizi extra
        })
      })
        .then(async (resp) => {
          const data = await resp.json();
          if (data.success) {
            log('✅ Prenotazione bonifico salvata:', data.bookingId);
          } else {
            console.error('❌ Errore salvataggio:', data.error);
          }
          setIsProcessing(false);
          setBookingConfirmed(true);
        })
        .catch((err) => {
          console.error('❌ Errore rete:', err);
          setIsProcessing(false);
          setBookingConfirmed(true);
        });
    } else {
      setIsProcessing(false);
      setBookingConfirmed(true);
    }
  };

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
      {stripeResult === 'success' && (
        <div className="stripe-result success-message-box">
          <h3>✅ Pagamento completato</h3>
          {bookingConfirmed ? (
            <p>Prenotazione confermata! Riceverai una email a breve.</p>
          ) : (
            <p>Pagamento ricevuto. Conferma prenotazione in corso...</p>
          )}
          {confirmError && <p className="error-message-inline">⚠️ {confirmError}</p>}
          <button type="button" className="btn btn-secondary" onClick={() => onBack()}>Torna alla prenotazione</button>
        </div>
      )}
      {stripeResult === 'cancel' && (
        <div className="stripe-result cancel-message-box">
          <h3>❌ Pagamento annullato</h3>
          <p>Il pagamento è stato annullato. Puoi riprovare scegliendo un metodo di pagamento.</p>
          <button type="button" className="btn btn-primary" onClick={() => window.location.hash = '#/booking'}>Riprendi prenotazione</button>
        </div>
      )}
      <div className="payment-header">
        <span className="step-icon">💳</span>
        <div>
          <h3>{getSafeTranslation(t, 'booking.step3.title', 'Pagamento')}</h3>
          <p>{getSafeTranslation(t, 'booking.step3.subtitle', 'Conferma la tua prenotazione')}</p>
        </div>
      </div>

      <div className="payment-summary-box">
        
        {/*Riepilogo costi//*/}
        {quote && (
          <>
          <div className="summary-row">
          <span>Soggiorno base: ({quote.nights} notti x {totalGuests} ospiti):</span>
          <span>€{quote.accommodationCost.toFixed(2)}</span>
          </div>

          <div className="summary-row">
            <span>Pulizia finale:</span>
            <span>€{quote.cleaningFee.toFixed(2)}</span>
          </div>

          {quote.parkingCost > 0 && (
          <div className="summary-row">
            <span>Parcheggio Privato</span>
            <span>€{quote.parkingCost.toFixed(2)}</span>
          </div>
          )}

          <div className="summary-row">
            <span>Tassa di Soggiorno</span>
            <span>€{quote.touristTax.toFixed(2)}</span>
          </div>


          <hr className="summary-divider" />
          </>

        )}

        <div className="summary-row">
          <span>Totale soggiorno:</span>
          <span><strong>€{total.toFixed(2)}</strong></span>
        </div>
        {selectedExtraServices && selectedExtraServices.filter(s => !s.isParking && s.category !== 'parcheggio').length > 0 && (
          <div className="extra-services-breakdown">
            <div className="summary-row extra-breakdown-title">Servizi extra:</div>
            {selectedExtraServices.filter(s => !s.isParking && s.category !== 'parcheggio').map((extra, idx) => {
              // Calcola il moltiplicatore in base all'unità
              let multiplier = 1;
              if (extra.unit === 'notte' || extra.unit === 'per_night') {
                multiplier = booking.quote?.nights || 1;
              } else if (extra.unit === 'persona' || extra.unit === 'per_person') {
                multiplier = booking.quote?.guests || 1;
              } else if (extra.unit === 'per_person_per_day') {
                multiplier = (booking.quote?.guests || 1) * (booking.quote?.nights || 1);
              }
              const total = (extra.price || 0) * multiplier;
              // LOG dettagliato per debug
              if (typeof window !== 'undefined' && window.console) {
                log('[BREAKDOWN][BookingSteps] Extra:', {
                  id: extra.id,
                  name: extra.name,
                  price: extra.price,
                  unit: extra.unit,
                  multiplier,
                  total,
                  quote: booking.quote
                });
              }
              return (
                <div className="summary-row extra-breakdown-item" key={idx}>
                  <span className="extra-label">
                    {extra.name || extra.label || 'Extra'}
                    {multiplier > 1 && (
                      <span className="extra-breakdown-multiplier">× {multiplier}</span>
                    )}
                  </span>
                  <span className="extra-value">
                    {extra.included ? (
                      <>
                        <span className="extra-strikethrough">€{total.toFixed(2)}</span>
                        <span className="extra-included-label">INCLUSO</span>
                      </>
                    ) : (
                      <>€{total.toFixed(2)}</>
                    )}
                  </span>
                </div>
              );
            })}
            <div className="summary-row extra-breakdown-total">
              <span>Totale extra</span>
              <span>€{extraServicesCost.toFixed(2)}</span>
            </div>
          </div>
        )}
        {booking.formData.payment_type === 'deposit' && (
          <>
            <div className="summary-row">
              <span>Acconto richiesto (20%):</span>
              <span>€{deposit.toFixed(2)}</span>
            </div>
            <div className="summary-row">
              <span>Saldo da pagare al check-in:</span>
              <span>€{saldo.toFixed(2)}</span>
            </div>
          </>
        )}
        {booking.formData.payment_type === 'full' && (
          <div className="summary-row">
            <span>Importo da pagare ora:</span>
            <span><strong>€{total.toFixed(2)}</strong></span>
          </div>
        )}
      </div>

      <div className="payment-choice-box">
        <div className="payment-choice-btn-group">
          <button
            type="button"
            className={`choice-btn${booking.formData.payment_type === 'deposit' ? ' active' : ''}`}
            onClick={() => booking.setFormData({ payment_type: 'deposit' })}
          >
            Acconto 20% ora, saldo al check-in
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
        {/* Mostra metodi di pagamento SEMPRE se è stato selezionato payment_type */}
        {booking.formData.payment_type && (
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
        )}
      </div>

      <div className="payment-methods">
        {/* Stripe Elements: mostra sempre se selezionato e c'è un preventivo */}
        {booking.formData.payment_method === 'stripe' && booking.quote && !stripeSuccess && (
          <div className="payment-block">
            <h4>Paga con carta</h4>
            <div className="payment-form-wrapper">
              <button
                type="button"
                className="btn btn-primary btn-pay btn-pay-margin"
                disabled={isProcessing}
                onClick={async () => {
                  setIsProcessing(true);
                  try {
                    // Salva dati prenotazione temporanei per recupero post-redirect
                    try {
                      localStorage.setItem('pendingBookingData', JSON.stringify(booking.formData));
                      if (booking.quote) {
                        localStorage.setItem('pendingBookingQuote', JSON.stringify(booking.quote));
                      }
                    } catch (e) {
                      console.warn('Impossibile salvare dati prenotazione in localStorage:', e);
                    }
                    const res = await fetch('/api/create-stripe-checkout-session', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        amount: booking.formData.payment_type === 'deposit'
                          ? Math.round(total * 0.3 * 100) / 100
                          : Math.round(total * 100) / 100,
                        customer_email: booking.formData.guest_email,
                        customer_name: booking.formData.guest_name + ' ' + booking.formData.guest_surname
                      })
                    });
                    const data = await res.json();
                    if (data.url) {
                      window.location.href = data.url;
                    } else {
                      alert('Errore nel redirect a Stripe.');
                    }
                  } catch (err) {
                    alert('Errore Stripe: ' + (typeof err === 'object' && err && 'message' in err ? (err as any).message : String(err)));
                  } finally {
                    setIsProcessing(false);
                  }
                }}
              >
                {isProcessing ? 'Elaborazione...' : 'Paga con Stripe'}
              </button>
            </div>
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
              {import.meta.env.VITE_PAYPAL_CLIENT_ID ? (
                <PayPalScriptProvider options={{ "client-id": import.meta.env.VITE_PAYPAL_CLIENT_ID, clientId: import.meta.env.VITE_PAYPAL_CLIENT_ID, currency: 'EUR' }}>
                  <PayPalButtons
                    createOrder={(_data, actions) => {
                      // Calcola l'importo da pagare: acconto (20%) o totale completo
                      const paypalAmount = isDeposit 
                        ? Math.round(total * 0.2 * 100) / 100  // 20% con extra services
                        : Math.round(total * 100) / 100;        // 100% con extra services
                      
                      return actions.order.create({
                        intent: 'CAPTURE',
                        purchase_units: [{
                          amount: {
                            value: paypalAmount.toFixed(2),
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
              ) : (
                <div className="error-message"><span className="icon">⚠️</span> Errore configurazione PayPal: client-id mancante.</div>
              )}
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
              <p><strong>Intestatario:</strong> Antonio Guida</p>
              <p><strong>IBAN:</strong> IT04D3608105038288844288937</p>
              <p><strong>BIC/SWIFT:</strong> PPAYITR1XXX</p>
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