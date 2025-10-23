import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useBooking } from '../hooks/useBooking';
import BookingCalendar from './BookingCalendar';
import StripePayment from './StripePayment';
import PayPalPayment from './PayPalPayment';
import './BookingSystem.css';
import { getSafeTranslation } from '../i18n';

interface PriceBreakdownProps {
    costs: any;
    isDeposit: boolean;
}

const PriceBreakdown: React.FC<PriceBreakdownProps> = ({ costs, isDeposit }) => {
    const { t } = useTranslation();
    
    if (!costs) return null;

    return (
        <div className="price-breakdown">
            <h4>{getSafeTranslation(t, 'booking.priceBreakdown', 'Riepilogo Costi')}</h4>
            <div className="breakdown-items">
                <div className="breakdown-item">
                    <span>{getSafeTranslation(t, 'booking.accommodationBase', 'Soggiorno base')}</span>
                    <span>€{costs.base_price.toFixed(2)}</span>
                </div>
                
                {costs.parking_cost > 0 && (
                    <div className="breakdown-item">
                        <span>{getSafeTranslation(t, 'booking.parking', 'Parcheggio privato')}</span>
                        <span>€{costs.parking_cost.toFixed(2)}</span>
                    </div>
                )}
                
                <div className="breakdown-item">
                    <span>{getSafeTranslation(t, 'booking.cleaning', 'Pulizia finale')}</span>
                    <span>€{costs.cleaning_fee.toFixed(2)}</span>
                </div>
                
                <div className="breakdown-item">
                    <span>{getSafeTranslation(t, 'booking.touristTax', 'Tassa di soggiorno')}</span>
                    <span>€{costs.tourist_tax.toFixed(2)}</span>
                </div>
                
                <div className="breakdown-separator"></div>
                
                <div className="breakdown-item total">
                    <span>{getSafeTranslation(t, 'booking.total', 'Totale')}</span>
                    <span>€{costs.total_amount.toFixed(2)}</span>
                </div>
                
                {isDeposit && (
                    <div className="breakdown-item deposit">
                        <span>{getSafeTranslation(t, 'booking.deposit', 'Acconto (30%)')}</span>
                        <span className="highlight">€{costs.deposit_amount.toFixed(2)}</span>
                    </div>
                )}
            </div>
            
            <div className="breakdown-info">
                <p>
                    <strong>{getSafeTranslation(t, 'booking.nights', 'Notti')}:</strong> {costs.nights} | 
                    <strong> {getSafeTranslation(t, 'booking.guests', 'Ospiti')}:</strong> {costs.total_paying_guests} paganti
                </p>
                {costs.pricing_config && (
                    <p className="pricing-details">
                        Primi 2 ospiti: €{costs.pricing_config.base_price_per_adult}/notte • 
                        Ospiti aggiuntivi: €{costs.pricing_config.additional_guest_price}/notte
                    </p>
                )}
            </div>
        </div>
    );
};

const BookingSystem: React.FC = () => {
    const { t } = useTranslation();
    const {
        formData,
        setFormData,
        quote,
        isLoadingQuote,
        quoteError,
        calendar,
        isLoadingCalendar,
        formErrors,
        isFormValid,
        isCreatingBooking,
        bookingError,
        bookingResult,
        submitBooking,
        resetForm
    } = useBooking();

    const [currentStep, setCurrentStep] = useState<'dates' | 'details' | 'payment' | 'confirmation'>('dates');
    const [showPayment, setShowPayment] = useState(false);

    // Handlers
    const handleDateChange = (checkIn: Date | null, checkOut: Date | null) => {
        setFormData({ check_in_date: checkIn, check_out_date: checkOut });
    };

    const handleGuestsChange = (field: string, value: any) => {
        setFormData({ [field]: value });
        
        // Aggiorna array età bambini se necessario
        if (field === 'num_children') {
            const ages = new Array(parseInt(value) || 0).fill(0);
            setFormData({ children_ages: ages });
        }
    };

    const handleChildAgeChange = (index: number, age: number) => {
        const newAges = [...formData.children_ages];
        newAges[index] = age;
        setFormData({ children_ages: newAges });
    };

    const proceedToDetails = () => {
        if (formData.check_in_date && formData.check_out_date) {
            setCurrentStep('details');
        }
    };

    const proceedToPayment = async () => {
        if (isFormValid) {
            await submitBooking();
            if (!bookingError) {
                setCurrentStep('payment');
                setShowPayment(true);
            }
        }
    };

    const handlePaymentSuccess = (result: any) => {
        setCurrentStep('confirmation');
        setShowPayment(false);
        console.log('Pagamento completato:', result);
    };

    const handlePaymentError = (error: string) => {
        console.error('Errore pagamento:', error);
        // Il pagamento può essere ritentato
    };

    const cancelPayment = () => {
        setShowPayment(false);
        setCurrentStep('details');
    };

    const startNewBooking = () => {
        resetForm();
        setCurrentStep('dates');
        setShowPayment(false);
    };

    // Render step indicator
    const renderStepIndicator = () => (
        <div className="booking-steps">
            <div className={`step ${currentStep === 'dates' ? 'active' : ['details', 'payment', 'confirmation'].includes(currentStep) ? 'completed' : ''}`}>
                <span className="step-number">1</span>
                <span className="step-label">Date</span>
            </div>
            <div className={`step ${currentStep === 'details' ? 'active' : ['payment', 'confirmation'].includes(currentStep) ? 'completed' : ''}`}>
                <span className="step-number">2</span>
                <span className="step-label">Dettagli</span>
            </div>
            <div className={`step ${currentStep === 'payment' ? 'active' : currentStep === 'confirmation' ? 'completed' : ''}`}>
                <span className="step-number">3</span>
                <span className="step-label">Pagamento</span>
            </div>
            <div className={`step ${currentStep === 'confirmation' ? 'active' : ''}`}>
                <span className="step-number">4</span>
                <span className="step-label">Conferma</span>
            </div>
        </div>
    );

    // Render date selection step
    const renderDateStep = () => (
        <div className="booking-step-content">
            <h2>{getSafeTranslation(t, 'booking.selectDates', 'Seleziona le Date')}</h2>
            
            <BookingCalendar
                selectedCheckIn={formData.check_in_date}
                selectedCheckOut={formData.check_out_date}
                onDateChange={handleDateChange}
                occupiedDates={calendar?.occupied_dates || []}
                isLoading={isLoadingCalendar}
                minNights={2}
            />

            {formData.check_in_date && formData.check_out_date && (
                <div className="guests-selection">
                    <h3>Numero di Ospiti</h3>
                    <div className="guests-inputs">
                        <div className="input-group">
                            <label htmlFor="adults">Adulti</label>
                            <select
                                id="adults"
                                value={formData.num_adults}
                                onChange={(e) => handleGuestsChange('num_adults', parseInt(e.target.value))}
                            >
                                {Array.from({ length: 8 }, (_, i) => (
                                    <option key={i + 1} value={i + 1}>{i + 1}</option>
                                ))}
                            </select>
                        </div>

                        <div className="input-group">
                            <label htmlFor="children">Bambini</label>
                            <select
                                id="children"
                                value={formData.num_children}
                                onChange={(e) => handleGuestsChange('num_children', parseInt(e.target.value))}
                            >
                                {Array.from({ length: 6 }, (_, i) => (
                                    <option key={i} value={i}>{i}</option>
                                ))}
                            </select>
                        </div>

                        <div className="input-group">
                            <label htmlFor="parking">Parcheggio</label>
                            <select
                                id="parking"
                                value={formData.parking_option}
                                onChange={(e) => setFormData({ parking_option: e.target.value as any })}
                            >
                                <option value="none">Nessuno</option>
                                <option value="street">Strada (gratuito)</option>
                                <option value="private">Privato (+€15/notte)</option>
                            </select>
                        </div>
                    </div>

                    {formData.num_children > 0 && (
                        <div className="children-ages">
                            <h4>Età dei Bambini</h4>
                            <div className="ages-inputs">
                                {formData.children_ages.map((age, index) => (
                                    <div key={index} className="age-input">
                                        <label>Bambino {index + 1}</label>
                                        <select
                                            value={age}
                                            onChange={(e) => handleChildAgeChange(index, parseInt(e.target.value))}
                                            aria-label={`Età bambino ${index + 1}`}
                                        >
                                            {Array.from({ length: 18 }, (_, i) => (
                                                <option key={i} value={i}>{i} anni</option>
                                            ))}
                                        </select>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {quote && (
                <div className="quote-preview">
                    <PriceBreakdown costs={quote.costs} isDeposit={formData.payment_type === 'deposit'} />
                    {quoteError && (
                        <div className="error-message">{quoteError}</div>
                    )}
                </div>
            )}

            {isLoadingQuote && (
                <div className="loading-quote">
                    <div className="spinner"></div>
                    <p>Calcolo preventivo...</p>
                </div>
            )}

            <div className="step-actions">
                <button
                    onClick={proceedToDetails}
                    disabled={!formData.check_in_date || !formData.check_out_date || isLoadingQuote}
                    className="btn-primary"
                >
                    Continua
                </button>
            </div>
        </div>
    );

    // Render details step
    const renderDetailsStep = () => (
        <div className="booking-step-content">
            <h2>{getSafeTranslation(t, 'booking.guestDetails', 'Dati dell\'Ospite')}</h2>
            
            <form className="guest-form">
                <div className="form-row">
                    <div className="input-group">
                        <label htmlFor="name">Nome *</label>
                        <input
                            id="name"
                            type="text"
                            value={formData.guest_name}
                            onChange={(e) => setFormData({ guest_name: e.target.value })}
                            className={formErrors.guest_name ? 'error' : ''}
                        />
                        {formErrors.guest_name && <span className="error-text">{formErrors.guest_name}</span>}
                    </div>

                    <div className="input-group">
                        <label htmlFor="surname">Cognome *</label>
                        <input
                            id="surname"
                            type="text"
                            value={formData.guest_surname}
                            onChange={(e) => setFormData({ guest_surname: e.target.value })}
                            className={formErrors.guest_surname ? 'error' : ''}
                        />
                        {formErrors.guest_surname && <span className="error-text">{formErrors.guest_surname}</span>}
                    </div>
                </div>

                <div className="form-row">
                    <div className="input-group">
                        <label htmlFor="email">Email *</label>
                        <input
                            id="email"
                            type="email"
                            value={formData.guest_email}
                            onChange={(e) => setFormData({ guest_email: e.target.value })}
                            className={formErrors.guest_email ? 'error' : ''}
                        />
                        {formErrors.guest_email && <span className="error-text">{formErrors.guest_email}</span>}
                    </div>

                    <div className="input-group">
                        <label htmlFor="phone">Telefono *</label>
                        <input
                            id="phone"
                            type="tel"
                            value={formData.guest_phone}
                            onChange={(e) => setFormData({ guest_phone: e.target.value })}
                            className={formErrors.guest_phone ? 'error' : ''}
                        />
                        {formErrors.guest_phone && <span className="error-text">{formErrors.guest_phone}</span>}
                    </div>
                </div>

                <div className="input-group">
                    <label htmlFor="message">Richieste Speciali</label>
                    <textarea
                        id="message"
                        value={formData.guest_message}
                        onChange={(e) => setFormData({ guest_message: e.target.value })}
                        placeholder="Eventuali richieste particolari o note per il soggiorno..."
                        rows={3}
                    />
                </div>

                <div className="payment-options">
                    <h3>Opzioni di Pagamento</h3>
                    
                    <div className="payment-type-selection">
                        <div className="radio-group">
                            <input
                                type="radio"
                                id="deposit"
                                name="payment_type"
                                value="deposit"
                                checked={formData.payment_type === 'deposit'}
                                onChange={(e) => setFormData({ payment_type: e.target.value as any })}
                            />
                            <label htmlFor="deposit">
                                <strong>Acconto 30%</strong>
                                {quote && (
                                    <span className="amount"> - €{quote.costs.deposit_amount.toFixed(2)}</span>
                                )}
                            </label>
                        </div>

                        <div className="radio-group">
                            <input
                                type="radio"
                                id="full"
                                name="payment_type"
                                value="full"
                                checked={formData.payment_type === 'full'}
                                onChange={(e) => setFormData({ payment_type: e.target.value as any })}
                            />
                            <label htmlFor="full">
                                <strong>Saldo Completo</strong>
                                {quote && (
                                    <span className="amount"> - €{quote.costs.total_amount.toFixed(2)}</span>
                                )}
                            </label>
                        </div>
                    </div>

                    <div className="payment-method-selection">
                        <div className="radio-group">
                            <input
                                type="radio"
                                id="stripe"
                                name="payment_method"
                                value="stripe"
                                checked={formData.payment_method === 'stripe'}
                                onChange={(e) => setFormData({ payment_method: e.target.value as any })}
                            />
                            <label htmlFor="stripe">💳 Carta di Credito/Debito</label>
                        </div>

                        <div className="radio-group">
                            <input
                                type="radio"
                                id="paypal"
                                name="payment_method"
                                value="paypal"
                                checked={formData.payment_method === 'paypal'}
                                onChange={(e) => setFormData({ payment_method: e.target.value as any })}
                            />
                            <label htmlFor="paypal">🟡 PayPal</label>
                        </div>

                        <div className="radio-group">
                            <input
                                type="radio"
                                id="bank_transfer"
                                name="payment_method"
                                value="bank_transfer"
                                checked={formData.payment_method === 'bank_transfer'}
                                onChange={(e) => setFormData({ payment_method: e.target.value as any })}
                            />
                            <label htmlFor="bank_transfer">🏦 Bonifico Bancario</label>
                        </div>
                    </div>
                </div>
            </form>

            {quote && (
                <PriceBreakdown costs={quote.costs} isDeposit={formData.payment_type === 'deposit'} />
            )}

            {bookingError && (
                <div className="error-message">{bookingError}</div>
            )}

            <div className="step-actions">
                <button
                    onClick={() => setCurrentStep('dates')}
                    className="btn-secondary"
                >
                    Indietro
                </button>
                <button
                    onClick={proceedToPayment}
                    disabled={!isFormValid || isCreatingBooking}
                    className="btn-primary"
                >
                    {isCreatingBooking ? 'Creazione...' : 'Procedi al Pagamento'}
                </button>
            </div>
        </div>
    );

    // Render payment step
    const renderPaymentStep = () => {
        if (!bookingResult) {
            return (
                <div className="booking-step-content">
                    <h2>Errore</h2>
                    <p>Prenotazione non trovata. Riprova dall'inizio.</p>
                    <button onClick={startNewBooking} className="btn-primary">
                        Nuova Prenotazione
                    </button>
                </div>
            );
        }

        if (formData.payment_method === 'bank_transfer') {
            return (
                <div className="booking-step-content">
                    <h2>Prenotazione Confermata</h2>
                    <div className="bank-transfer-instructions">
                        <h3>Istruzioni per il Bonifico</h3>
                        <div className="bank-details">
                            <p><strong>Beneficiario:</strong> Vincanto</p>
                            <p><strong>IBAN:</strong> IT00 0000 0000 0000 0000 0000 000</p>
                            <p><strong>Causale:</strong> Prenotazione {bookingResult.booking_id}</p>
                            <p><strong>Importo:</strong> €{bookingResult.payment_amount.toFixed(2)}</p>
                        </div>
                        <p className="bank-note">
                            Ti abbiamo inviato una email con tutti i dettagli. 
                            La prenotazione sarà confermata dopo la ricezione del pagamento.
                        </p>
                    </div>
                    <button onClick={startNewBooking} className="btn-primary">
                        Nuova Prenotazione
                    </button>
                </div>
            );
        }

        if (showPayment && formData.payment_method === 'stripe') {
            return (
                <div className="booking-step-content">
                    <StripePayment
                        bookingId={bookingResult.booking_id}
                        amount={bookingResult.payment_amount}
                        customerEmail={formData.guest_email}
                        customerName={`${formData.guest_name} ${formData.guest_surname}`}
                        onSuccess={handlePaymentSuccess}
                        onError={(error) => setError(`Errore pagamento: ${error.message}`)}
                    />
                </div>
            );
        }

        if (showPayment && formData.payment_method === 'paypal') {
            return (
                <div className="booking-step-content">
                    <PayPalPayment
                        amount={bookingResult.payment_amount}
                        bookingData={{
                            tempId: bookingResult.booking_id,
                            checkIn: formData.start_date,
                            checkOut: formData.end_date,
                            guestName: `${formData.guest_name} ${formData.guest_surname}`,
                            guestEmail: formData.guest_email,
                            guestPhone: formData.guest_phone,
                            guestAddress: formData.guest_address,
                            adults: formData.adults,
                            children: formData.children,
                            childrenAges: formData.children_ages,
                            specialRequests: formData.special_requests
                        }}
                        onSuccess={handlePaymentSuccess}
                        onError={(error) => setError(`Errore pagamento PayPal: ${error.message || 'Errore sconosciuto'}`)}
                        onCancel={() => setError('Pagamento PayPal annullato')}
                    />
                </div>
            );
        }
                        onPaymentSuccess={handlePaymentSuccess}
                        onPaymentError={handlePaymentError}
                        onCancel={cancelPayment}
                    />
                </div>
            );
        }

        return null;
    };

    // Render confirmation step
    const renderConfirmationStep = () => (
        <div className="booking-step-content">
            <div className="confirmation-success">
                <div className="success-icon">✅</div>
                <h2>Prenotazione Completata!</h2>
                <p>
                    Grazie per aver scelto Vincanto. La tua prenotazione è stata confermata 
                    e riceverai a breve una email con tutti i dettagli.
                </p>
                
                {bookingResult && (
                    <div className="booking-summary">
                        <h3>Riepilogo Prenotazione</h3>
                        <p><strong>ID Prenotazione:</strong> {bookingResult.booking_id}</p>
                        <p><strong>Email:</strong> {formData.guest_email}</p>
                    </div>
                )}
                
                <button onClick={startNewBooking} className="btn-primary">
                    Nuova Prenotazione
                </button>
            </div>
        </div>
    );

    return (
        <div className="booking-system">
            {renderStepIndicator()}
            
            <div className="booking-content">
                {currentStep === 'dates' && renderDateStep()}
                {currentStep === 'details' && renderDetailsStep()}
                {currentStep === 'payment' && renderPaymentStep()}
                {currentStep === 'confirmation' && renderConfirmationStep()}
            </div>
        </div>
    );
};

export default BookingSystem;