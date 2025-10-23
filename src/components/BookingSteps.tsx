import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useBooking } from '../hooks/useBooking';
import { getSafeTranslation } from '../i18n';
import './BookingSteps.css';

// 📝 Step 2: Dati Personali
interface BookingStep2Props {
  onNext: () => void;
  onBack: () => void;
}

export const BookingStep2: React.FC<BookingStep2Props> = ({ onNext, onBack }) => {
  const { t } = useTranslation();
  const booking = useBooking();
  const [errors, setErrors] = useState<string[]>([]);

  const validateForm = () => {
    const newErrors: string[] = [];
    
    if (!booking.formData.guest_name.trim()) {
      newErrors.push('Il nome è obbligatorio');
    }
    
    if (!booking.formData.guest_surname.trim()) {
      newErrors.push('Il cognome è obbligatorio');
    }
    
    if (!booking.formData.guest_email.trim()) {
      newErrors.push('L\'email è obbligatoria');
    } else if (!/\S+@\S+\.\S+/.test(booking.formData.guest_email)) {
      newErrors.push('Inserisci un\'email valida');
    }
    
    if (!booking.formData.guest_phone.trim()) {
      newErrors.push('Il telefono è obbligatorio');
    }
    
    setErrors(newErrors);
    return newErrors.length === 0;
  };

  const handleNext = () => {
    if (validateForm()) {
      onNext();
    }
  };

  return (
    <div className="booking-step">
      <div className="step-header">
        <h3>
          <span className="step-icon">📝</span>
          {getSafeTranslation(t, 'booking.step2.title', 'Dati Personali')}
        </h3>
        <p>{getSafeTranslation(t, 'booking.step2.subtitle', 'I tuoi dati per la prenotazione')}</p>
      </div>

      <div className="personal-data-form">
        <div className="form-grid">
          <div className="form-group">
            <label htmlFor="guest_name">
              <span className="icon">👤</span>
              Nome *
            </label>
            <input
              id="guest_name"
              type="text"
              value={booking.formData.guest_name}
              onChange={(e) => booking.setFormData({ guest_name: e.target.value })}
              placeholder="Inserisci il tuo nome"
              className={errors.some(e => e.includes('nome')) ? 'error' : ''}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="guest_surname">
              <span className="icon">👤</span>
              Cognome *
            </label>
            <input
              id="guest_surname"
              type="text"
              value={booking.formData.guest_surname}
              onChange={(e) => booking.setFormData({ guest_surname: e.target.value })}
              placeholder="Inserisci il tuo cognome"
              className={errors.some(e => e.includes('cognome')) ? 'error' : ''}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="guest_email">
              <span className="icon">📧</span>
              Email *
            </label>
            <input
              id="guest_email"
              type="email"
              value={booking.formData.guest_email}
              onChange={(e) => booking.setFormData({ guest_email: e.target.value })}
              placeholder="inserisci@email.com"
              className={errors.some(e => e.includes('email')) ? 'error' : ''}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="guest_phone">
              <span className="icon">📱</span>
              Telefono *
            </label>
            <input
              id="guest_phone"
              type="tel"
              value={booking.formData.guest_phone}
              onChange={(e) => booking.setFormData({ guest_phone: e.target.value })}
              placeholder="+39 333 1234567"
              className={errors.some(e => e.includes('telefono')) ? 'error' : ''}
              required
            />
          </div>
        </div>

        <div className="form-group full-width">
          <label htmlFor="guest_message">
            <span className="icon">💬</span>
            Messaggio aggiuntivo (opzionale)
          </label>
          <textarea
            id="guest_message"
            value={booking.formData.guest_message}
            onChange={(e) => booking.setFormData({ guest_message: e.target.value })}
            placeholder="Hai richieste particolari? Scrivici qui..."
            rows={4}
          />
        </div>

        {errors.length > 0 && (
          <div className="error-messages">
            {errors.map((error, index) => (
              <div key={index} className="error-message">
                <span className="icon">⚠️</span>
                {error}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="booking-navigation">
        <button 
          type="button" 
          onClick={onBack}
          className="btn btn-secondary"
        >
          <span className="icon">⬅️</span>
          {getSafeTranslation(t, 'booking.navigation.back', 'Indietro')}
        </button>
        
        <button 
          type="button" 
          onClick={handleNext}
          className="btn btn-primary"
        >
          {getSafeTranslation(t, 'booking.navigation.next', 'Continua')}
          <span className="icon">➡️</span>
        </button>
      </div>
    </div>
  );
};

// 💳 Step 3: Pagamento
interface BookingStep3Props {
  onBack: () => void;
}

export const BookingStep3: React.FC<BookingStep3Props> = ({ onBack }) => {
  const { t } = useTranslation();
  const booking = useBooking();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleConfirmBooking = async () => {
    setIsProcessing(true);
    try {
      await booking.submitBooking();
      // Gestione del successo...
    } catch (error) {
      console.error('Errore nella prenotazione:', error);
      // Gestione dell'errore...
    } finally {
      setIsProcessing(false);
    }
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

      <div className="payment-section">
        <div className="booking-summary">
          <h4>
            <span className="icon">📋</span>
            Riepilogo Prenotazione
          </h4>
          
          <div className="summary-details">
            <div className="summary-item">
              <span className="label">Ospite:</span>
              <span className="value">
                {booking.formData.guest_name} {booking.formData.guest_surname}
              </span>
            </div>
            
            <div className="summary-item">
              <span className="label">Email:</span>
              <span className="value">{booking.formData.guest_email}</span>
            </div>
            
            <div className="summary-item">
              <span className="label">Check-in:</span>
              <span className="value">
                {booking.formData.check_in_date?.toLocaleDateString('it-IT')}
              </span>
            </div>
            
            <div className="summary-item">
              <span className="label">Check-out:</span>
              <span className="value">
                {booking.formData.check_out_date?.toLocaleDateString('it-IT')}
              </span>
            </div>
            
            <div className="summary-item">
              <span className="label">Ospiti:</span>
              <span className="value">
                {booking.formData.num_adults} adulti
                {booking.formData.num_children > 0 && 
                  `, ${booking.formData.num_children} bambini`
                }
              </span>
            </div>
          </div>
        </div>

        <div className="payment-methods">
          <h4>
            <span className="icon">💳</span>
            Metodo di Pagamento
          </h4>
          
          <div className="payment-options">
            <label className="payment-option">
              <input
                type="radio"
                name="payment_method"
                value="stripe"
                checked={booking.formData.payment_method === 'stripe'}
                onChange={(e) => booking.setFormData({ payment_method: e.target.value as any })}
              />
              <div className="payment-method-content">
                <span className="icon">💳</span>
                <div className="method-info">
                  <span className="method-name">Carta di Credito/Debito</span>
                  <span className="method-description">Pagamento sicuro con Stripe</span>
                </div>
              </div>
            </label>

            <label className="payment-option">
              <input
                type="radio"
                name="payment_method"
                value="paypal"
                checked={booking.formData.payment_method === 'paypal'}
                onChange={(e) => booking.setFormData({ payment_method: e.target.value as any })}
              />
              <div className="payment-method-content">
                <span className="icon">🟦</span>
                <div className="method-info">
                  <span className="method-name">PayPal</span>
                  <span className="method-description">Pagamento rapido e sicuro</span>
                </div>
              </div>
            </label>

            <label className="payment-option">
              <input
                type="radio"
                name="payment_method"
                value="bank_transfer"
                checked={booking.formData.payment_method === 'bank_transfer'}
                onChange={(e) => booking.setFormData({ payment_method: e.target.value as any })}
              />
              <div className="payment-method-content">
                <span className="icon">🏦</span>
                <div className="method-info">
                  <span className="method-name">Bonifico Bancario</span>
                  <span className="method-description">Riceverai le coordinate via email</span>
                </div>
              </div>
            </label>
          </div>
        </div>

        <div className="payment-type">
          <h4>
            <span className="icon">💰</span>
            Tipo di Pagamento
          </h4>
          
          <div className="payment-type-options">
            <label className="payment-type-option">
              <input
                type="radio"
                name="payment_type"
                value="deposit"
                checked={booking.formData.payment_type === 'deposit'}
                onChange={(e) => booking.setFormData({ payment_type: e.target.value as any })}
              />
              <div className="type-content">
                <span className="type-name">Acconto (30%)</span>
                <span className="type-description">
                  Paga ora l'acconto, il resto al check-in
                </span>
              </div>
            </label>

            <label className="payment-type-option">
              <input
                type="radio"
                name="payment_type"
                value="full"
                checked={booking.formData.payment_type === 'full'}
                onChange={(e) => booking.setFormData({ payment_type: e.target.value as any })}
              />
              <div className="type-content">
                <span className="type-name">Pagamento Completo</span>
                <span className="type-description">
                  Paga l'intero importo ora
                </span>
              </div>
            </label>
          </div>
        </div>
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
      </div>
    </div>
  );
};