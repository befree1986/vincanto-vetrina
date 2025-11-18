import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useBooking } from '../hooks/useBooking';
import { useDynamicPricing } from '../hooks/useDynamicPricing';
import BookingCalendar from './BookingCalendar';
import ExtraServices from './ExtraServices';
import StripePayment from './StripePayment';
import PayPalPayment from './PayPalPayment';
import './BookingSystem.css';
import { getSafeTranslation } from '../i18n';

interface PriceBreakdownProps {
    costs: any;
    isDeposit: boolean;
    extraServicesCost?: number;
    selectedExtraServices?: any[];
}

const PriceBreakdown: React.FC<PriceBreakdownProps> = ({ 
    costs, 
    isDeposit, 
    extraServicesCost = 0, 
    selectedExtraServices = [] 
}) => {
    const { t } = useTranslation();
    
    if (!costs) return null;

    // Calcola totale inclusi servizi extra
    const totalWithExtras = costs.totalAmount + extraServicesCost;
    const depositWithExtras = isDeposit ? totalWithExtras * 0.30 : totalWithExtras;

    return (
        <div className="price-breakdown">
            <h4>{getSafeTranslation(t, 'booking.priceBreakdown', 'Riepilogo Costi')}</h4>
            <div className="breakdown-items">
                <div className="breakdown-item">
                    <span>{getSafeTranslation(t, 'booking.accommodationBase', 'Soggiorno base')}</span>
                    <span>€{costs.baseCost?.toFixed(2) || costs.basePrice?.toFixed(2)}</span>
                </div>
                
                {/* 🎯 MOSTRA SCONTO SE APPLICATO */}
                {costs.discount && (
                    <div className="breakdown-item discount">
                        <span>🎉 {costs.discount.type} (-{costs.discount.percentage}%)</span>
                        <span className="discount-amount">-€{costs.discount.amount.toFixed(2)}</span>
                    </div>
                )}
                
                {costs.parkingCost > 0 && (
                    <div className="breakdown-item">
                        <span>{getSafeTranslation(t, 'booking.parking', 'Parcheggio privato')}</span>
                        <span>€{costs.parkingCost.toFixed(2)}</span>
                    </div>
                )}
                
                <div className="breakdown-item">
                    <span>{getSafeTranslation(t, 'booking.cleaning', 'Pulizia finale')}</span>
                    <span>€{costs.cleaningFee.toFixed(2)}</span>
                </div>
                
                <div className="breakdown-item">
                    <span>{getSafeTranslation(t, 'booking.touristTax', 'Tassa di soggiorno')}</span>
                    <span>€{costs.touristTax.toFixed(2)}</span>
                </div>

                {/* 🛎️ SERVIZI EXTRA */}
                {selectedExtraServices.length > 0 && (
                    <>
                        <div className="breakdown-separator"></div>
                        <div className="breakdown-section-title">
                            <span>🛎️ Servizi Extra</span>
                        </div>
                        {selectedExtraServices.map(service => (
                            <div key={service.id} className="breakdown-item extra-service">
                                <span>{service.name}</span>
                                <span>€{service.price.toFixed(2)}</span>
                            </div>
                        ))}
                    </>
                )}
                
                <div className="breakdown-separator"></div>
                
                <div className="breakdown-item total">
                    <span>{getSafeTranslation(t, 'booking.total', 'Totale')}</span>
                    <span>€{totalWithExtras.toFixed(2)}</span>
                </div>
                
                {isDeposit && (
                    <div className="breakdown-item deposit">
                        <span>{getSafeTranslation(t, 'booking.depositRequired', 'Acconto richiesto (30%)')}</span>
                        <span className="highlight">€{depositWithExtras.toFixed(2)}</span>
                    </div>
                )}
            </div>
            
            <div className="breakdown-info">
                <p className="pricing-details">
                    {getSafeTranslation(t, 'booking.pricingNote', 'Prezzi finali tutto incluso. Pulizia e tassa di soggiorno incluse.')}
                </p>
                {selectedExtraServices.length > 0 && (
                    <p className="extra-services-note">
                        ✅ {selectedExtraServices.length} servizio{selectedExtraServices.length > 1 ? 'i' : ''} extra selezionato{selectedExtraServices.length > 1 ? 'i' : ''}
                    </p>
                )}
            </div>
        </div>
    );
};

type Step = 'dates' | 'details' | 'payment' | 'confirmation';

const BookingSystem: React.FC = () => {
    const [currentStep, setCurrentStep] = useState<Step>('dates');
    const [error, setError] = useState<string | null>(null);
    const [quoteError] = useState<string | null>(null);
    const [showPayment, setShowPayment] = useState(false);
    const [bookingResult, setBookingResult] = useState<any>(null);
    
    // 🔥 HOOK SCROLL LOCK - DISABILITATO TEMPORANEAMENTE
    const [isTransitioning, setIsTransitioning] = useState(false);
    
    useEffect(() => {
        // SCROLL LOCK DISABILITATO - causava problemi
        // if (isTransitioning) {
        //     document.body.style.overflow = 'hidden';
        //     const timer = setTimeout(() => {
        //         document.body.style.overflow = 'unset';
        //         setIsTransitioning(false);
        //     }, 100);
        //     return () => clearTimeout(timer);
        // }
    }, [isTransitioning]);
    
    const {
        formData,
        setFormData,
        quote,
        isLoadingQuote,
        submitBooking,
        formErrors,
        validateForm,
        resetForm,
        calendar,
        isLoadingCalendar,
        loadCalendar
    } = useBooking();
    
    // 🎯 PREZZI DINAMICI dal pannello admin
    const dynamicPricing = useDynamicPricing();
    
    // 🛎️ SERVIZI EXTRA
    const [extraServicesCost, setExtraServicesCost] = useState(0);
    const [selectedExtraServices, setSelectedExtraServices] = useState<any[]>([]);

    // 📅 CARICA CALENDARIO AL MOUNT
    React.useEffect(() => {
        loadCalendar();
    }, [loadCalendar]);

    const handleDateSelection = async (checkIn: Date | null, checkOut: Date | null) => {
        if (!checkIn || !checkOut) return;
        
        // 🔥 ATTIVA SCROLL LOCK
        setIsTransitioning(true);
        
        // Aggiorna le date nel form - il preventivo verrà calcolato automaticamente tramite useEffect
        setFormData({
            check_in_date: checkIn,
            check_out_date: checkOut
        });
        
        // Cambio step senza scroll
        setCurrentStep('details');
    };

    const handleDetailsSubmit = async () => {
        const errors = validateForm();
        if (Object.keys(errors).length > 0) {
            setError('Per favore completa tutti i campi obbligatori');
            return;
        }

        // DEBUG: mostra il metodo di pagamento selezionato
        console.log('DEBUG payment_method:', formData.payment_method);

        try {
            const result = await submitBooking();
            setBookingResult(result);

            if (formData.payment_method === 'bank_transfer') {
                setCurrentStep('confirmation');
            } else {
                setShowPayment(true);
                setCurrentStep('payment');
            }
        } catch (error: any) {
            setError(error.message);
        }
    };

    const handlePaymentSuccess = (result: any) => {
        setBookingResult((prev: any) => ({ ...prev, ...result }));
        setCurrentStep('confirmation');
        setShowPayment(false);
    };

    const startNewBooking = () => {
        resetForm();
        setCurrentStep('dates');
        setError(null);
        setShowPayment(false);
        setBookingResult(null);
    };

    const renderStepIndicator = () => (
        <div className="booking-steps">
            <div className={`step ${currentStep === 'dates' ? 'active' : ''} ${['details', 'payment', 'confirmation'].includes(currentStep) ? 'completed' : ''}`}>
                <div className="step-number">1</div>
                <div className="step-label">Date</div>
            </div>
            <div className={`step ${currentStep === 'details' ? 'active' : ''} ${['payment', 'confirmation'].includes(currentStep) ? 'completed' : ''}`}>
                <div className="step-number">2</div>
                <div className="step-label">Dettagli</div>
            </div>
            <div className={`step ${currentStep === 'payment' ? 'active' : ''} ${currentStep === 'confirmation' ? 'completed' : ''}`}>
                <div className="step-number">3</div>
                <div className="step-label">Pagamento</div>
            </div>
            <div className={`step ${currentStep === 'confirmation' ? 'active' : ''}`}>
                <div className="step-number">4</div>
                <div className="step-label">Conferma</div>
            </div>
        </div>
    );

    const renderDateStep = () => (
        <div className="booking-step-content step-transition">
            <h2>Seleziona le Date</h2>
            <BookingCalendar
                selectedCheckIn={formData.check_in_date}
                selectedCheckOut={formData.check_out_date}
                onDateChange={handleDateSelection}
                occupiedDates={calendar?.occupied_dates || []}
                isLoading={isLoadingCalendar}
            />
        </div>
    );

    const renderDetailsStep = () => (
        <div className="booking-step-content step-transition">
            <h2>Dettagli Prenotazione</h2>
            
            {/* Loading indicator per calcolo prezzi - Design Professionale */}
            {isLoadingQuote && (
                <div className="quote-loading-modern">
                    <div className="loading-spinner"></div>
                    <div className="loading-content">
                        <h4>Calcolando il tuo preventivo...</h4>
                        <p>Stiamo applicando le migliori tariffe disponibili</p>
                    </div>
                </div>
            )}
            
            {/* Errore nel calcolo prezzi - Design Professionale */}
            {quoteError && (
                <div className="quote-error-modern">
                    <div className="error-icon">⚠️</div>
                    <div className="error-content">
                        <h4>Problema nel calcolo del preventivo</h4>
                        <p>{quoteError}</p>
                        <button 
                            onClick={() => window.location.reload()} 
                            className="retry-btn"
                        >
                            🔄 Riprova
                        </button>
                    </div>
                </div>
            )}
            
            {/* Preventivo calcolato */}
            {quote && !isLoadingQuote && (
                <PriceBreakdown 
                    costs={quote} 
                    isDeposit={formData.payment_type === 'deposit'}
                    extraServicesCost={extraServicesCost}
                    selectedExtraServices={selectedExtraServices}
                />
            )}
            
            <div className="guests-selection">
                <h3>Ospiti</h3>
                <div className="guests-inputs">
                    <div className="input-group">
                        <label htmlFor="adults">Adulti *</label>
                        <select
                            id="adults"
                            value={formData.num_adults}
                            onChange={(e) => setFormData({ num_adults: parseInt(e.target.value) })}
                            aria-label="Numero di adulti"
                        >
                            {[1, 2, 3, 4, 5, 6].map(num => (
                                <option key={num} value={num}>{num}</option>
                            ))}
                        </select>
                    </div>

                    <div className="input-group">
                        <label htmlFor="children">Bambini</label>
                        <select
                            id="children"
                            value={formData.num_children}
                            onChange={(e) => setFormData({ num_children: parseInt(e.target.value) })}
                            aria-label="Numero di bambini"
                        >
                            {[0, 1, 2, 3, 4].map(num => (
                                <option key={num} value={num}>{num}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {formData.num_children > 0 && (
                    <div className="children-ages">
                        <h4>Età dei bambini</h4>
                        <div className="ages-inputs">
                            {Array.from({ length: formData.num_children }, (_, i) => (
                                <div key={i} className="input-group age-input">
                                    <label htmlFor={`child-${i}`}>Bambino {i + 1}</label>
                                    <select
                                        id={`child-${i}`}
                                        value={formData.children_ages[i] || ''}
                                        onChange={(e) => {
                                            const newAges = [...formData.children_ages];
                                            newAges[i] = parseInt(e.target.value);
                                            setFormData({ children_ages: newAges });
                                        }}
                                        aria-label={`Età bambino ${i + 1}`}
                                    >
                                        <option value="">Età</option>
                                        {Array.from({ length: 18 }, (_, age) => (
                                            <option key={age} value={age}>{age} anni</option>
                                        ))}
                                    </select>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            <div className="parking-selection">
                <h3>Servizi Extra</h3>
                <div className="service-options">
                    <div className="service-option">
                        <h4>🚗 Parcheggio</h4>
                        <div className="radio-group">
                            <input
                                type="radio"
                                id="parking-none"
                                name="parking_option"
                                value="none"
                                checked={formData.parking_option === 'none'}
                                onChange={(e) => setFormData({ parking_option: e.target.value as any })}
                            />
                            <label htmlFor="parking-none">
                                Nessun parcheggio
                                <span className="service-price">Gratuito</span>
                            </label>
                        </div>

                        <div className="radio-group">
                            <input
                                type="radio"
                                id="parking-street"
                                name="parking_option"
                                value="street"
                                checked={formData.parking_option === 'street'}
                                onChange={(e) => setFormData({ parking_option: e.target.value as any })}
                            />
                            <label htmlFor="parking-street">
                                Parcheggio pubblico nelle vicinanze
                                <span className="service-price">Gratuito</span>
                                <small className="service-note">Soggetto a disponibilità</small>
                            </label>
                        </div>

                        <div className="radio-group">
                            <input
                                type="radio"
                                id="parking-private"
                                name="parking_option"
                                value="private"
                                checked={formData.parking_option === 'private'}
                                onChange={(e) => setFormData({ parking_option: e.target.value as any })}
                            />
                            <label htmlFor="parking-private">
                                Parcheggio privato riservato e custodito
                                <span className="service-price highlight">
                                    +€{dynamicPricing.loading ? '...' : dynamicPricing.error ? '20' : dynamicPricing.parkingFee}/giorno
                                </span>
                                <small className="service-note">Prenotazione garantita</small>
                            </label>
                        </div>
                        
                        {quote && formData.parking_option === 'private' && (
                            <div className="parking-cost-preview">
                                <div className="cost-calculation">
                                    <span>Parcheggio per {quote.nights} {quote.nights === 1 ? 'notte' : 'notti'}:</span>
                                    <span className="cost-amount">€{quote.parkingCost.toFixed(2)}</span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* 🛎️ SERVIZI EXTRA DINAMICI */}
            <ExtraServices 
                childrenAges={formData.children_ages}
                onServicesChange={(services, totalCost) => {
                    setSelectedExtraServices(services);
                    setExtraServicesCost(totalCost);
                }}
            />

            <div className="guest-form">
                <h3>Informazioni Ospite</h3>
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
                        rows={3}
                    />
                </div>
            </div>

            <div className="payment-options">
                <h3>Modalità di Pagamento</h3>
                
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
                            Acconto 30% 
                            {quote && <span className="amount">€{quote.depositAmount.toFixed(2)}</span>}
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
                            Saldo Completo
                            {quote && <span className="amount">€{quote.totalAmount.toFixed(2)}</span>}
                        </label>
                    </div>
                </div>

                <div className="payment-method-selection">
                    <h4>Metodo di Pagamento</h4>
                    
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

            <div className="step-actions">
                <button 
                    onClick={(e) => {
                        e.preventDefault();
                        setIsTransitioning(true);
                        setCurrentStep('dates');
                    }} 
                    className="btn-secondary"
                    type="button"
                >
                    Indietro
                </button>
                <button 
                    onClick={(e) => {
                        e.preventDefault();
                        setIsTransitioning(true);
                        handleDetailsSubmit();
                    }}
                    className="btn-primary"
                    disabled={isLoadingQuote}
                    type="button"
                >
                    {isLoadingQuote ? 'Elaborazione...' : 'Continua al Pagamento'}
                </button>
            </div>
        </div>
    );

    return (
        <div className="booking-system">
            {renderStepIndicator()}
            
            <div className="booking-content">
                {error && (
                    <div className="error-message">
                        {error}
                        <button onClick={() => setError(null)}>✕</button>
                    </div>
                )}

                {currentStep === 'dates' && renderDateStep()}
                {currentStep === 'details' && renderDetailsStep()}
                
                {currentStep === 'confirmation' && (
                    <div className="booking-step-content">
                        <div className="confirmation-success">
                            <div className="success-icon">✅</div>
                            <h2>Prenotazione Confermata!</h2>
                            <p>Grazie per aver scelto Vincanto Maori. Ti abbiamo inviato una email di conferma.</p>
                            
                            {bookingResult && (
                                <div className="booking-summary">
                                    <h3>Riepilogo Prenotazione</h3>
                                    <p><strong>ID Prenotazione:</strong> {bookingResult.booking_id}</p>
                                    <p><strong>Check-in:</strong> {formData.check_in_date?.toLocaleDateString()}</p>
                                    <p><strong>Check-out:</strong> {formData.check_out_date?.toLocaleDateString()}</p>
                                    <p><strong>Ospiti:</strong> {formData.num_adults} adulti {formData.num_children > 0 && `, ${formData.num_children} bambini`}</p>
                                    <p><strong>Totale Pagato:</strong> €{bookingResult.payment_amount}</p>
                                </div>
                            )}

                            {formData.payment_method === 'bank_transfer' && (
                                <div className="bank-transfer-instructions">
                                    <h3>🏦 Istruzioni per il Bonifico</h3>
                                    <div className="bank-details">
                                        <p><strong>Beneficiario:</strong> Vincanto Maori S.r.l.</p>
                                        <p><strong>IBAN:</strong> IT60 X054 2811 101 000000123456</p>
                                        <p><strong>Causale:</strong> Prenotazione {bookingResult?.booking_id}</p>
                                        <p><strong>Importo:</strong> €{bookingResult?.payment_amount}</p>
                                    </div>
                                    <p className="bank-note">
                                        Ti abbiamo inviato una email con tutti i dettagli. 
                                        La prenotazione sarà confermata dopo la ricezione del pagamento.
                                    </p>
                                </div>
                            )}
                            
                            <button onClick={startNewBooking} className="btn-primary">
                                Nuova Prenotazione
                            </button>
                        </div>
                    </div>
                )}

                {showPayment && formData.payment_method === 'stripe' && bookingResult && (
                    <div className="booking-step-content">
                        <StripePayment
                            bookingId={bookingResult.booking_id}
                            amount={bookingResult.payment_amount}
                            customerEmail={formData.guest_email}
                            customerName={`${formData.guest_name} ${formData.guest_surname}`}
                            onPaymentSuccess={handlePaymentSuccess}
                            onPaymentError={(error: string) => setError(`Errore pagamento: ${error}`)}
                            onCancel={() => setError('Pagamento annullato')}
                        />
                    </div>
                )}

                {showPayment && formData.payment_method === 'paypal' && bookingResult && (
                    <div className="booking-step-content">
                        <PayPalPayment
                            amount={bookingResult.payment_amount}
                            bookingData={{
                                tempId: bookingResult.booking_id,
                                checkIn: formData.check_in_date?.toISOString().split('T')[0],
                                checkOut: formData.check_out_date?.toISOString().split('T')[0],
                                guestName: `${formData.guest_name} ${formData.guest_surname}`,
                                guestEmail: formData.guest_email,
                                guestPhone: formData.guest_phone,
                                adults: formData.num_adults,
                                children: formData.num_children,
                                childrenAges: formData.children_ages,
                                specialRequests: formData.guest_message
                            }}
                            onSuccess={handlePaymentSuccess}
                            onError={(error: any) => setError(`Errore pagamento PayPal: ${error.message || 'Errore sconosciuto'}`)}
                            onCancel={() => setError('Pagamento PayPal annullato')}
                        />
                    </div>
                )}
            </div>
        </div>
    );
};

export default BookingSystem;