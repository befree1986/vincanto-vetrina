import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useBooking } from '../hooks/useBooking';
import { useDynamicPricing } from '../hooks/useDynamicPricing';
import BookingCalendar from './BookingCalendar';
import ExtraServices from './ExtraServices';
import './BookingSystem.css';
import StripePayment from './StripePayment';
import PayPalPayment from './PayPalPayment';
import { getSafeTranslation } from '../i18n';

interface PriceBreakdownProps {
    costs: any;
    isDeposit: boolean;
    extraServicesCost?: number;
    allExtraServices?: any[];
}

const PriceBreakdown: React.FC<PriceBreakdownProps> = ({ 
    costs, 
    isDeposit, 
    extraServicesCost = 0,
    allExtraServices = []
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
                    <span>€{(costs.accommodationCost || costs.baseCost || costs.basePrice || 0).toFixed(2)}</span>
                </div>
                
                {/* 🎯 MOSTRA SCONTO SE APPLICATO */}
                {costs.discount && (
                    <div className="breakdown-item discount">
                        <span>🎉 {costs.discount.type} (-{costs.discount.percentage}%)</span>
                        <span className="discount-amount">-€{costs.discount.amount.toFixed(2)}</span>
                    </div>
                )}
                
                    {/* 🛎️ SERVIZI EXTRA - MOSTRA TUTTI (inclusi quelli inclusi a €0) */}
                    {allExtraServices.length > 0 && (
                        <>
                            <div className="breakdown-separator"></div>
                            <div className="breakdown-section-title">
                                <span>🛎️ Servizi Extra</span>
                            </div>
                            {allExtraServices.map(service => (
                                <div key={service.id} className={`breakdown-item extra-service ${service.included ? 'included-service' : ''}`}>
                                    <span>
                                        {service.name}
                                        {service.included && ' ✨'}
                                    </span>
                                    <span className={service.included ? 'included-price' : ''}>
                                        {service.included ? '€0.00 (Incluso)' : `€${service.price.toFixed(2)}`}
                                    </span>
                                </div>
                            ))}
                        </>
                    )}
                
                    <div className="breakdown-separator"></div>
                
                    {/* 🚗 PARCHEGGIO - MOSTRA SEMPRE */}
                    <div className="breakdown-item">
                        <span>{getSafeTranslation(t, 'booking.parking', 'Parcheggio privato')}</span>
                        <span>€{(costs.parkingCost || 0).toFixed(2)}</span>
                    </div>
                
                    {/* 🧹 PULIZIA FINALE - MOSTRA SEMPRE */}
                <div className="breakdown-item">
                    <span>{getSafeTranslation(t, 'booking.cleaning', 'Pulizia finale')}</span>
                    <span>€{costs.cleaningFee.toFixed(2)}</span>
                </div>
                
                <div className="breakdown-item">
                    <span>{getSafeTranslation(t, 'booking.touristTax', 'Tassa di soggiorno')}</span>
                    <span>€{costs.touristTax.toFixed(2)}</span>
                </div>

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
                {allExtraServices.length > 0 && (
                    <p className="extra-services-note">
                    ✅ {allExtraServices.length} servizio{allExtraServices.length > 1 ? 'i' : ''} extra disponibil{allExtraServices.length > 1 ? 'i' : 'e'}
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
    // quoteError rimosso (non utilizzato)
    
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
    const [showPayment, setShowPayment] = useState(false);
    const [showEditOptions, setShowEditOptions] = useState(false);
    const [bookingResult, setBookingResult] = useState<any | null>(null);

    // Aggiorna il costo extra ogni volta che cambia la quote o i servizi selezionati
    useEffect(() => {
        if (!quote) return;
        // Calcola il costo extra usando i dati reali della quote
        if (selectedExtraServices.length > 0 && selectedExtraServices[0]?.getTotalCost) {
            // fallback, non usato normalmente
            setExtraServicesCost(selectedExtraServices[0].getTotalCost({
                nights: quote.nights,
                adults: quote.guests,
                children: 0,
                guests: quote.guests
            }));
        } else {
            // Ricerca hook useExtraServices
            try {
                // Import dinamico per evitare errori
                const { useExtraServices } = require('../hooks/useExtraServices');
                const hook = useExtraServices();
                setExtraServicesCost(hook.getTotalCost({
                    nights: quote.nights,
                    adults: quote.guests,
                    children: 0,
                    guests: quote.guests
                }));
            } catch {
                // fallback: somma semplice
                setExtraServicesCost(selectedExtraServices.reduce((tot, s) => tot + (s.price || 0), 0));
            }
        }
    }, [quote, selectedExtraServices]);

    // 📅 CARICA CALENDARIO AL MOUNT
    React.useEffect(() => {
        loadCalendar();
    }, [loadCalendar]);

    const handleDateSelection = async (checkIn: Date | null, checkOut: Date | null) => {
        if (!checkIn || !checkOut) return;
        setIsTransitioning(true);
        setFormData({
            check_in_date: checkIn,
            check_out_date: checkOut
        });
        // Blocco scroll automatico: forzo lo scroll in alto (o dove vuoi tu) solo se necessario
        // window.scrollTo({ top: 0, behavior: 'auto' }); // decommenta se vuoi forzare in alto
        setTimeout(() => setIsTransitioning(false), 100); // reset transizione
        setCurrentStep('details');
    };

    const handlePaymentSuccess = (data: any) => {
        if (data) {
            setBookingResult({ ...bookingResult, ...data });
        }
        setShowPayment(false);
        setCurrentStep('confirmation');
    };

    const startNewBooking = () => {
        resetForm();
        setCurrentStep('dates');
        setError(null);
    };

    const renderStepIndicator = (): JSX.Element => (
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

    // Pannelli sidebar / trust card rimossi nella versione semplificata

    const renderDateStep = (): JSX.Element => (
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

    const handleDetailsSubmit = async () => {
        const errors = validateForm();
        if (Object.keys(errors).length > 0) {
            setError('Per favore completa tutti i campi obbligatori');
            return;
        }
        try {
            const result: any = await submitBooking();
            setBookingResult(result || null);
            if (formData.payment_method === 'stripe' || formData.payment_method === 'paypal') {
                setShowPayment(true);
                setCurrentStep('payment');
            } else {
                setCurrentStep('confirmation');
            }
        } catch (e: any) {
            setError(e.message || 'Errore inatteso');
        }
    };

    const renderDetailsStep = (): JSX.Element => {
        const { t } = useTranslation();
        return (
            <div className="booking-step-content step-transition">
                <h2>{getSafeTranslation(t, 'booking.detailsTitle', 'Dettagli Prenotazione')}</h2>
                {isLoadingQuote && (
                    <div className="quote-loading-modern">
                        <div className="loading-spinner" />
                        <div className="loading-content">
                            <h4>{getSafeTranslation(t, 'booking.calculatingQuote', 'Calcolo preventivo...')}</h4>
                            <p>{getSafeTranslation(t, 'booking.applyingBestRates', 'Applichiamo le migliori tariffe disponibili')}</p>
                        </div>
                    </div>
                )}
                {quote && !isLoadingQuote && (
                    <div className="price-banner-horizontal">
                        <div className="price-banner-content">
                            <div className="price-summary">
                                <div className="price-item">
                                    <span className="price-label">{getSafeTranslation(t, 'booking.accommodation', 'Soggiorno')} ({quote.nights} {quote.nights === 1 ? getSafeTranslation(t, 'booking.night', 'notte') : getSafeTranslation(t, 'booking.nights', 'notti')})</span>
                                    <span className="price-value">€{quote.basePrice.toFixed(2)}</span>
                                </div>
                                {formData.parking_option === 'private' && quote.parkingCost > 0 && (
                                    <div className="price-item">
                                        <span className="price-label">🚗 {getSafeTranslation(t, 'booking.parking', 'Parcheggio')}</span>
                                        <span className="price-value">€{quote.parkingCost.toFixed(2)}</span>
                                    </div>
                                )}
                                {extraServicesCost > 0 && (
                                    <div className="price-item">
                                        <span className="price-label">🛎️ {getSafeTranslation(t, 'booking.extraServices', 'Servizi Extra')}</span>
                                        <span className="price-value">€{extraServicesCost.toFixed(2)}</span>
                                    </div>
                                )}
                                <div className="price-item">
                                    <span className="price-label">🧹 {getSafeTranslation(t, 'booking.cleaning', 'Pulizia')}</span>
                                    <span className="price-value">€{quote.cleaningFee.toFixed(2)}</span>
                                </div>
                                <div className="price-item">
                                    <span className="price-label">🏛️ {getSafeTranslation(t, 'booking.touristTax', 'Tassa soggiorno')}</span>
                                    <span className="price-value">€{quote.touristTax.toFixed(2)}</span>
                                </div>
                            </div>
                            <div className="price-total-section">
                                <div className="price-total">
                                    <span className="total-label">{getSafeTranslation(t, 'booking.total', 'Totale')}</span>
                                    <span className="total-value">€{(quote.totalAmount + extraServicesCost).toFixed(2)}</span>
                                </div>
                                {formData.payment_type === 'deposit' && (
                                    <div className="price-deposit">
                                        <span className="deposit-label">{getSafeTranslation(t, 'booking.depositRequired', 'Acconto 30%')}</span>
                                        <span className="deposit-value">€{((quote.totalAmount + extraServicesCost) * 0.30).toFixed(2)}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
                <div className="guests-selection-modern">
                    <h3>👥 {getSafeTranslation(t, 'booking.guests', 'Ospiti')}</h3>
                    <div className="guests-grid">
                        <div className="guest-card">
                            <div className="guest-icon">👨‍👩‍👧‍👦</div>
                            <div className="guest-info">
                                <label htmlFor="adults">{getSafeTranslation(t, 'booking.adults', 'Adulti')}</label>
                                <p className="guest-desc">{getSafeTranslation(t, 'booking.age18Plus', 'Età 18+')}</p>
                            </div>
                            <select id="adults" value={formData.num_adults} onChange={(e)=>setFormData({ num_adults: parseInt(e.target.value) })} className="guest-select">
                                {[1,2,3,4,5,6].map(n=> <option key={n} value={n}>{n}</option>)}
                            </select>
                        </div>
                        <div className="guest-card">
                            <div className="guest-icon">👶</div>
                            <div className="guest-info">
                                <label htmlFor="children">{getSafeTranslation(t, 'booking.children', 'Bambini')}</label>
                                <p className="guest-desc">{getSafeTranslation(t, 'booking.age0to17', 'Età 0-17')}</p>
                            </div>
                            <select id="children" value={formData.num_children} onChange={(e)=>setFormData({ num_children: parseInt(e.target.value) })} className="guest-select">
                                {[0,1,2,3,4].map(n=> <option key={n} value={n}>{n}</option>)}
                            </select>
                        </div>
                    </div>
                    {formData.num_children > 0 && (
                        <div className="children-ages">
                            <h4>{getSafeTranslation(t, 'booking.childrenAges', 'Età bambini')}</h4>
                            <div className="ages-inputs">
                                {Array.from({ length: formData.num_children }, (_, i) => (
                                    <div key={i} className="input-group age-input">
                                        <label htmlFor={`child-${i}`}>{getSafeTranslation(t, 'booking.child', 'Bambino')} {i+1}</label>
                                        <select id={`child-${i}`} value={formData.children_ages[i] || ''} onChange={(e)=>{
                                            const ages=[...formData.children_ages];
                                            ages[i]=parseInt(e.target.value);
                                            setFormData({ children_ages: ages });
                                        }}>
                                            <option value="">{getSafeTranslation(t, 'booking.age', 'Età')}</option>
                                            {Array.from({ length: 18 }, (_, age) => <option key={age} value={age}>{age}</option>)}
                                        </select>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
                <div className="parking-selection">
                    <h3>🚗 {getSafeTranslation(t, 'booking.parkingOptions', 'Opzioni Parcheggio')}</h3>
                    <div className="service-options">
                        <div className="radio-group">
                            <input type="radio" id="parking-none" name="parking_option" value="none" checked={formData.parking_option==='none'} onChange={(e)=>setFormData({ parking_option: e.target.value as any })} />
                            <label htmlFor="parking-none">{getSafeTranslation(t, 'booking.noParking', 'Nessun parcheggio')} <span className="service-price">{getSafeTranslation(t, 'booking.free', 'Gratuito')}</span></label>
                        </div>
                        <div className="radio-group">
                            <input type="radio" id="parking-street" name="parking_option" value="street" checked={formData.parking_option==='street'} onChange={(e)=>setFormData({ parking_option: e.target.value as any })} />
                            <label htmlFor="parking-street">{getSafeTranslation(t, 'booking.streetParking', 'Parcheggio pubblico')} <span className="service-price">{getSafeTranslation(t, 'booking.free', 'Gratuito')}</span></label>
                        </div>
                        <div className="radio-group">
                            <input type="radio" id="parking-private" name="parking_option" value="private" checked={formData.parking_option==='private'} onChange={(e)=>setFormData({ parking_option: e.target.value as any })} />
                            <label htmlFor="parking-private">{getSafeTranslation(t, 'booking.privateParking', 'Parcheggio privato riservato')} <span className="service-price highlight">+€{dynamicPricing.loading ? '...' : dynamicPricing.error ? '20' : dynamicPricing.parkingFee}/{getSafeTranslation(t, 'booking.day', 'giorno')}</span></label>
                        </div>
                    </div>
                </div>
                <ExtraServices
                    childrenAges={formData.children_ages}
                    onServicesChange={(services,total)=>{setSelectedExtraServices(services);setExtraServicesCost(total);}}
                    calcOptions={quote ? { nights: quote.nights, adults: quote.guests, guests: quote.guests } : undefined}
                />
                <div className="guest-form">
                    <h3>{getSafeTranslation(t, 'booking.guestInfo', 'Informazioni Ospite')}</h3>
                    <div className="form-row">
                        <div className="input-group">
                            <label htmlFor="name">{getSafeTranslation(t, 'booking.firstName', 'Nome')} *</label>
                            <input id="name" value={formData.guest_name} onChange={(e)=>setFormData({ guest_name: e.target.value })} className={formErrors.guest_name? 'error':''} />
                            {formErrors.guest_name && <span className="error-text">{formErrors.guest_name}</span>}
                        </div>
                        <div className="input-group">
                            <label htmlFor="surname">{getSafeTranslation(t, 'booking.lastName', 'Cognome')} *</label>
                            <input id="surname" value={formData.guest_surname} onChange={(e)=>setFormData({ guest_surname: e.target.value })} className={formErrors.guest_surname? 'error':''} />
                            {formErrors.guest_surname && <span className="error-text">{formErrors.guest_surname}</span>}
                        </div>
                    </div>
                    <div className="form-row">
                        <div className="input-group">
                            <label htmlFor="email">Email *</label>
                            <input id="email" type="email" value={formData.guest_email} onChange={(e)=>setFormData({ guest_email: e.target.value })} className={formErrors.guest_email? 'error':''} />
                            {formErrors.guest_email && <span className="error-text">{formErrors.guest_email}</span>}
                        </div>
                        <div className="input-group">
                            <label htmlFor="phone">{getSafeTranslation(t, 'booking.phone', 'Telefono')} *</label>
                            <input id="phone" value={formData.guest_phone} onChange={(e)=>setFormData({ guest_phone: e.target.value })} className={formErrors.guest_phone? 'error':''} />
                            {formErrors.guest_phone && <span className="error-text">{formErrors.guest_phone}</span>}
                        </div>
                    </div>
                    <div className="input-group">
                        <label htmlFor="message">{getSafeTranslation(t, 'booking.specialRequests', 'Richieste Speciali')}</label>
                        <textarea id="message" rows={3} value={formData.guest_message} onChange={(e)=>setFormData({ guest_message: e.target.value })} />
                    </div>
                </div>
                <div className="payment-options">
                    <h3>{getSafeTranslation(t, 'booking.paymentOptions', 'Modalità di Pagamento')}</h3>
                    <div className="payment-type-selection">
                        <div className="radio-group">
                            <input type="radio" id="deposit" name="payment_type" value="deposit" checked={formData.payment_type==='deposit'} onChange={(e)=>setFormData({ payment_type: e.target.value as any })} />
                            <label htmlFor="deposit">{getSafeTranslation(t, 'booking.deposit30', 'Acconto 30%')} {quote && <span className="amount">€{((quote.totalAmount)*0.30).toFixed(2)}</span>}</label>
                        </div>
                        <div className="radio-group">
                            <input type="radio" id="full" name="payment_type" value="full" checked={formData.payment_type==='full'} onChange={(e)=>setFormData({ payment_type: e.target.value as any })} />
                            <label htmlFor="full">{getSafeTranslation(t, 'booking.fullPayment', 'Saldo Completo')} {quote && <span className="amount">€{quote.totalAmount.toFixed(2)}</span>}</label>
                        </div>
                    </div>
                    <div className="payment-method-selection">
                        <h4>{getSafeTranslation(t, 'booking.paymentMethod', 'Metodo di Pagamento')}</h4>
                        <div className="radio-group">
                            <input type="radio" id="stripe" name="payment_method" value="stripe" checked={formData.payment_method==='stripe'} onChange={(e)=>setFormData({ payment_method: e.target.value as any })} />
                            <label htmlFor="stripe">💳 {getSafeTranslation(t, 'booking.card', 'Carta')}</label>
                        </div>
                        <div className="radio-group">
                            <input type="radio" id="paypal" name="payment_method" value="paypal" checked={formData.payment_method==='paypal'} onChange={(e)=>setFormData({ payment_method: e.target.value as any })} />
                            <label htmlFor="paypal">🟡 PayPal</label>
                        </div>
                        <div className="radio-group">
                            <input type="radio" id="bank_transfer" name="payment_method" value="bank_transfer" checked={formData.payment_method==='bank_transfer'} onChange={(e)=>setFormData({ payment_method: e.target.value as any })} />
                            <label htmlFor="bank_transfer">🏦 {getSafeTranslation(t, 'booking.bankTransfer', 'Bonifico Bancario')}</label>
                        </div>
                    </div>
                </div>
                <div className="step-actions">
                    <button type="button" className="btn-secondary" onClick={()=>setCurrentStep('dates')}>{getSafeTranslation(t, 'booking.back', 'Indietro')}</button>
                    <button type="button" className="btn-primary" disabled={isLoadingQuote} onClick={handleDetailsSubmit}>{isLoadingQuote ? getSafeTranslation(t, 'booking.processing', 'Elaborazione...') : getSafeTranslation(t, 'booking.continueToPayment', 'Continua al Pagamento')}</button>
                </div>
            </div>
        );
    };

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
                {currentStep === 'payment' && (
                    <div className="booking-step-content step-transition">
                        <h2>Pagamento</h2>

                        {/* Riepilogo costi sempre visibile anche nel pagamento */}
                        {quote && (
                            <PriceBreakdown 
                                costs={quote}
                                isDeposit={formData.payment_type === 'deposit'}
                                extraServicesCost={extraServicesCost}
                                allExtraServices={selectedExtraServices}
                            />
                        )}

                        {/* Pannello modifica servizi e parcheggio */}
                        <div className="edit-options-panel">
                            <button 
                                type="button" 
                                className="btn-secondary"
                                onClick={() => setShowEditOptions(v => !v)}
                            >
                                {showEditOptions ? 'Chiudi modifiche' : 'Modifica servizi e parcheggio'}
                            </button>

                            {showEditOptions && (
                                <div className="edit-options-content">
                                    <h3>Opzioni Parcheggio</h3>
                                    <div className="radio-group">
                                        <input
                                            type="radio"
                                            id="parking-none-pay"
                                            name="parking_option_pay"
                                            value="none"
                                            checked={formData.parking_option === 'none'}
                                            onChange={(e) => setFormData({ parking_option: e.target.value as any })}
                                        />
                                        <label htmlFor="parking-none-pay">
                                            Nessun parcheggio
                                            <small className="service-note">Puoi arrivare a piedi</small>
                                        </label>
                                    </div>

                                    <div className="radio-group">
                                        <input
                                            type="radio"
                                            id="parking-street-pay"
                                            name="parking_option_pay"
                                            value="street"
                                            checked={formData.parking_option === 'street'}
                                            onChange={(e) => setFormData({ parking_option: e.target.value as any })}
                                        />
                                        <label htmlFor="parking-street-pay">
                                            Parcheggio su strada
                                            <small className="service-note">Soggetto a disponibilità</small>
                                        </label>
                                    </div>

                                    <div className="radio-group">
                                        <input
                                            type="radio"
                                            id="parking-private-pay"
                                            name="parking_option_pay"
                                            value="private"
                                            checked={formData.parking_option === 'private'}
                                            onChange={(e) => setFormData({ parking_option: e.target.value as any })}
                                        />
                                        <label htmlFor="parking-private-pay">
                                            Parcheggio privato riservato e custodito
                                        </label>
                                    </div>

                                    {/* Servizi extra compatti */}
                                    <h3>Servizi Extra</h3>
                                    <ExtraServices 
                                        showHeader={false}
                                        childrenAges={formData.children_ages}
                                        onServicesChange={(services, totalCost) => {
                                            setSelectedExtraServices(services);
                                            setExtraServicesCost(totalCost);
                                        }}
                                        calcOptions={quote ? { nights: quote.nights, adults: quote.guests, guests: quote.guests } : undefined}
                                    />
                                </div>
                            )}
                        </div>

                        {/* Azioni per tornare ai dettagli o procedere */}
                        <div className="step-actions">
                            <button 
                                onClick={(e) => {
                                    e.preventDefault();
                                    setIsTransitioning(true);
                                    setCurrentStep('details');
                                }} 
                                className="btn-secondary"
                                type="button"
                            >
                                Indietro ai Dettagli
                            </button>
                        </div>
                    </div>
                )}
                
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