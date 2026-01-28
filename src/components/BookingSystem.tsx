import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useBooking } from '../hooks/useBooking';
import { useDynamicPricing } from '../hooks/useDynamicPricing';
import { updateBookingStatus, cancelBooking } from '../services/api'; // ⚡ Import update function
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
        <div className="price-breakdown-professional">
            <div className="breakdown-header">
                <h4>{getSafeTranslation(t, 'booking.priceBreakdown', 'Riepilogo Prenotazione')}</h4>
                <span className="breakdown-subtitle">Dettaglio costi del soggiorno</span>
            </div>

            <div className="breakdown-body">
                {/* SOGGIORNO BASE */}
                <div className="breakdown-group">
                    <div className="breakdown-item primary">
                        <div className="item-label">
                            <span className="item-icon">🏠</span>
                            <span>{getSafeTranslation(t, 'booking.accommodationBase', 'Soggiorno base')}</span>
                        </div>
                        <span className="item-value">€{Number(costs.accommodationCost || costs.baseCost || costs.basePrice || 0).toFixed(2)}</span>
                    </div>

                    {/* SCONTO SE APPLICATO */}
                    {costs.discount && (
                        <div className="breakdown-item discount-applied">
                            <div className="item-label">
                                <span className="item-icon">🎉</span>
                                <span>{costs.discount.type} (-{costs.discount.percentage}%)</span>
                            </div>
                            <span className="item-value discount">-€{Number(costs.discount.amount || 0).toFixed(2)}</span>
                        </div>
                    )}
                </div>

                {/* SERVIZI EXTRA */}
                {allExtraServices.length > 0 && (
                    <div className="breakdown-group">
                        <div className="group-title">
                            <span className="group-icon">🛎️</span>
                            <span>Servizi Extra Selezionati</span>
                        </div>
                        {allExtraServices.map(service => (
                            <div key={service.id} className={`breakdown-item ${service.included ? 'included' : ''}`}>
                                <div className="item-label">
                                    <span>{service.name}</span>
                                    {service.included && <span className="badge-included">Incluso</span>}
                                </div>
                                <span className="item-value">
                                    {service.included ? '€0.00' : `€${Number(service.price || 0).toFixed(2)}`}
                                </span>
                            </div>
                        ))}
                    </div>
                )}

                {/* COSTI AGGIUNTIVI */}
                <div className="breakdown-group">
                    <div className="group-title">
                        <span className="group-icon">💼</span>
                        <span>Costi Aggiuntivi</span>
                    </div>

                    {costs.parkingCost > 0 && (
                        <div className="breakdown-item">
                            <div className="item-label">
                                <span className="item-icon">🚗</span>
                                <span>{getSafeTranslation(t, 'booking.parking', 'Parcheggio privato')}</span>
                            </div>
                            <span className="item-value">€{Number(costs.parkingCost || 0).toFixed(2)}</span>
                        </div>
                    )}

                    <div className="breakdown-item">
                        <div className="item-label">
                            <span className="item-icon">🧹</span>
                            <span>{getSafeTranslation(t, 'booking.cleaning', 'Pulizia finale')}</span>
                        </div>
                        <span className="item-value">€{Number(costs.cleaningFee || 0).toFixed(2)}</span>
                    </div>

                    <div className="breakdown-item">
                        <div className="item-label">
                            <span className="item-icon">🏛️</span>
                            <span>{getSafeTranslation(t, 'booking.touristTax', 'Tassa di soggiorno')}</span>
                        </div>
                        <span className="item-value">€{Number(costs.touristTax || 0).toFixed(2)}</span>
                    </div>
                </div>

                {/* TOTALE */}
                <div className="breakdown-total">
                    <div className="total-line"></div>
                    <div className="total-item">
                        <span className="total-label">Totale Soggiorno</span>
                        <span className="total-value">€{Number(totalWithExtras || 0).toFixed(2)}</span>
                    </div>

                    {isDeposit && (
                        <div className="deposit-item">
                            <div className="deposit-badge">
                                <span className="deposit-label">Acconto richiesto (30%)</span>
                                <span className="deposit-percentage">Da pagare ora</span>
                            </div>
                            <span className="deposit-value">€{Number(depositWithExtras || 0).toFixed(2)}</span>
                        </div>
                    )}
                </div>
            </div>

            <div className="breakdown-footer">
                <div className="footer-note">
                    <span className="note-icon">✓</span>
                    <span>Prezzi finali tutto incluso. Nessun costo nascosto.</span>
                </div>
                {allExtraServices.length > 0 && (
                    <div className="footer-services">
                        {allExtraServices.length} servizio{allExtraServices.length > 1 ? 'i' : ''} extra selezionat{allExtraServices.length > 1 ? 'i' : 'o'}
                    </div>
                )}
            </div>
        </div>
    );
};

type Step = 'dates' | 'details' | 'payment' | 'confirmation';

interface BookingSystemProps {
    onClose?: () => void;
}

const BookingSystem: React.FC<BookingSystemProps> = ({ onClose }) => {
    const { t, i18n } = useTranslation();
    
    // 🔍 DEBUG: Log mount/unmount
    React.useEffect(() => {
        console.log('✅ BookingSystem mounted');
        return () => console.log('❌ BookingSystem unmounted');
    }, []);
    
    // 📊 Stati base
    const [currentStep, setCurrentStep] = useState<Step>('dates');
    const [error, setError] = useState<string | null>(null);
    const [isTransitioning, setIsTransitioning] = useState(false);
    
    // 🛎️ Servizi extra - INIZIALIZZATI A ZERO
    const [extraServicesCost, setExtraServicesCost] = useState(0);
    const [selectedExtraServices, setSelectedExtraServices] = useState<any[]>([]);
    const [showPayment, setShowPayment] = useState(false);
    const [showEditOptions, setShowEditOptions] = useState(false);
    const [bookingResult, setBookingResult] = useState<any | null>(null);
    const [paymentCompleted, setPaymentCompleted] = useState(false);
    // 💰 Payment amount - stored before submitBooking to avoid quote state issues
    const [paymentAmount, setPaymentAmount] = useState<number>(0);
    
    // 🎯 Custom hooks (dopo tutti gli useState)
    const {
        formData,
        setFormData,
        quote,
        isLoadingQuote,
        submitBooking,
        formErrors,
        validateForm,
       // resetForm,
        calendar,
        isLoadingCalendar,
        loadCalendar
    } = useBooking();
    
    const dynamicPricing = useDynamicPricing();
    
    // 🔥 Effects (sempre dopo tutti gli hooks)
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

    // Calcola costo servizi extra
    useEffect(() => {
        if (!quote || selectedExtraServices.length === 0) {
            setExtraServicesCost(0);
            return;
        }
        
        // ❌ ESCLUDI servizi inclusi (gratuiti) dal calcolo - SICUREZZA DOPPIA
        const paidServices = selectedExtraServices.filter(s => !s.included && s.price > 0);
        const totalCost = paidServices.reduce((total, service) => {
            return total + (service.price || 0);
        }, 0);
        
        console.log('💰 BookingSystem extraCost:', { total: selectedExtraServices.length, paid: paidServices.length, cost: totalCost });
        setExtraServicesCost(totalCost);
    }, [quote, selectedExtraServices]);

    // Carica calendario al mount
    useEffect(() => {
        loadCalendar();
    }, [loadCalendar]);

    // 🛡️ Guard: quando si entra nello step pagamento, assicurati che paymentAmount sia valorizzato
    useEffect(() => {
        if (currentStep === 'payment') {
            const total = (quote ? quote.totalAmount : 0) + (extraServicesCost || 0);
            if (!paymentAmount || Number(paymentAmount) <= 0) {
                setPaymentAmount(total);
                console.log('🛡️ Guard set paymentAmount:', total);
            }
        }
    }, [currentStep, quote, extraServicesCost]);

    // 🎬 HANDLER FUNCTIONS
    
    // ⚡ FIX: Memoize onServicesChange to prevent infinite loop in ExtraServices
    const handleServicesChange = React.useCallback((services: any[], totalCost: number) => {
        console.log('🛎️ Services changed:', services.length, 'Total:', totalCost);
        setSelectedExtraServices(services);
        setExtraServicesCost(totalCost);
    }, []); // Empty deps: la funzione è stabile

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

    const handlePaymentSuccess = async (data: any) => {
        try {
            // ⚡ NUOVO FLUSSO: Aggiorna booking DRAFT → CONFIRMED dopo payment success
            // Non creare nuovo booking - esiste già come DRAFT da handleDetailsSubmit()
            
            
            if (!bookingResult?.booking_id) {
                throw new Error('Booking ID mancante - impossibile confermare pagamento');
            }

            // Calcola l'importo pagato (acconto o totale) INCLUSI SERVIZI EXTRA
            const totalWithExtras = (quote?.totalAmount || 0) + extraServicesCost;
            const amountPaid = formData.payment_type === 'deposit' && quote
                ? Math.round(totalWithExtras * 0.3 * 100) / 100
                : totalWithExtras;

            // Aggiorna booking da DRAFT a CONFIRMED con dati pagamento
            const updateResult = await updateBookingStatus(
                bookingResult.booking_id,
                'confirmed',
                {
                    payment_id: data?.payment_intent_id || data?.paymentId || null,
                    payment_status: 'success',
                    amount_paid: amountPaid,
                    // 🛎️ Passa i servizi extra per includerli nell'email di conferma
                    extra_services: selectedExtraServices.map(s => ({ id: s.id, name: s.name, price: s.price, included: !!s.included })),
                    language: i18n.language || 'it'
                }
            );

            if (!updateResult.success) {
                throw new Error(updateResult.message || 'Errore aggiornamento booking');
            }

            // Aggiorna stato locale con dati pagamento
            setBookingResult({
                ...bookingResult,
                ...data,
                payment_amount: amountPaid,
                payment_status: 'success'
            });

            // Segna il pagamento come completato
            setPaymentCompleted(true);
            setShowPayment(false);
            setCurrentStep('confirmation');
        } catch (error: any) {
            console.error('Errore conferma prenotazione:', error);
            setError(`Pagamento riuscito ma errore nel salvataggio: ${error.message}. Contattaci con il codice prenotazione ${bookingResult?.booking_id || 'N/A'}.`);
        }
    };

    const handlePaymentError = async (errorMessage: string, reason?: string) => {
        try {
            // Quando pagamento fallisce, cancella il booking draft
            if (bookingResult?.booking_id) {
                console.log(`🚫 Cancellazione booking ${bookingResult.booking_id} per errore pagamento: ${errorMessage}`);
                await cancelBooking(bookingResult.booking_id, reason || `Pagamento fallito: ${errorMessage}`);
                console.log(`✅ Booking ${bookingResult.booking_id} cancellato con successo`);
            }
        } catch (error: any) {
            console.error('Errore nella cancellazione del booking:', error);
        }
        // Comunque mostra l'errore all'utente
        setError(errorMessage);
    };

   // const startNewBooking = () => {
   //     resetForm();
   //     setCurrentStep('dates');
   //     setError(null);
   //     setPaymentCompleted(false);
   //     setShowPayment(false);   
        
   // };

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

    // ✅ VALIDAZIONE FORM IN TEMPO REALE
    const isFormValid = (): boolean => {
        return !!(
            formData.guest_name?.trim() &&
            formData.guest_surname?.trim() &&
            formData.guest_email?.trim() &&
            formData.guest_email.includes('@') &&
            formData.guest_phone?.trim() &&
            formData.guest_phone.length >= 8 &&
            formData.payment_method &&
            formData.num_adults > 0
        );
    };

    const renderDateStep = (): JSX.Element => (
        <div className="booking-step-content step-transition">
            <h2>Seleziona le Date</h2>
            {dynamicPricing.minStay > 0 && (
                <div className="min-stay-info">
                    ℹ️ Soggiorno minimo richiesto: <strong>{dynamicPricing.minStay} {dynamicPricing.minStay === 1 ? 'notte' : 'notti'}</strong>
                </div>
            )}
            <BookingCalendar
                selectedCheckIn={formData.check_in_date}
                selectedCheckOut={formData.check_out_date}
                onDateChange={handleDateSelection}
                occupiedDates={calendar?.occupied_dates || []}
                isLoading={isLoadingCalendar}
                minNights={dynamicPricing.minStay || 3}
            />
        </div>
    );

    const handleDetailsSubmit = async () => {
        // ✅ VALIDAZIONE COMPLETA FORM
        const errors = validateForm();
        if (Object.keys(errors).length > 0) {
            const errorMessages = Object.values(errors).join(', ');
            setError(`Campi obbligatori mancanti: ${errorMessages}`);
            // Scroll al primo errore
            const firstErrorField = document.querySelector('.form-group.error');
            firstErrorField?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            return;
        }
        
        // ✅ VALIDAZIONE CAMPI ESSENZIALI
        if (!formData.guest_name?.trim()) {
            setError('Nome obbligatorio');
            return;
        }
        if (!formData.guest_surname?.trim()) {
            setError('Cognome obbligatorio');
            return;
        }
        if (!formData.guest_email?.trim() || !formData.guest_email.includes('@')) {
            setError('Email valida obbligatoria');
            return;
        }
        if (!formData.guest_phone?.trim() || formData.guest_phone.length < 8) {
            setError('Telefono valido obbligatorio (min 8 cifre)');
            return;
        }
        if (!formData.payment_method) {
            setError('Seleziona un metodo di pagamento');
            return;
        }
        try {
            // ✅ Calcola totale completo (quote + servizi extra)
            const totalAmount = quote ? (quote.totalAmount + extraServicesCost) : 0;
            
            // 🔍 DEBUG: Verifica valori PRIMA di salvare paymentAmount
            console.log('🔍 PRE-PAYMENT DEBUG [v2.0]:', {
                quote_exists: !!quote,
                quote_totalAmount: quote?.totalAmount,
                extraServicesCost,
                calculated_totalAmount: totalAmount,
                payment_method: formData.payment_method,
                payment_type: formData.payment_type
            });
            
            // 💰 STORE AMOUNT BEFORE submitBooking - quote might become undefined after
            setPaymentAmount(totalAmount);
            console.log('💰 Saved paymentAmount:', totalAmount);
            
            // 🛟 Popola window.debugPaymentData per fallback Stripe/PayPal
            (window as any).debugPaymentData = {
                quote,
                extraServicesCost,
                totalAmount,
                timestamp: new Date().toISOString()
            };
            console.log('🛟 Populated debugPaymentData for fallback:', (window as any).debugPaymentData);
            
            // Reset flag pagamento completato quando si richiede un nuovo pagamento
            setPaymentCompleted(false);
            
            // Controlla il metodo di pagamento per determinare il flusso
            if (formData.payment_method === 'stripe' || formData.payment_method === 'paypal') {
                // ⚡ PAGAMENTI ONLINE: Crea booking DRAFT (serve bookingId per payment intent)
                // Verrà aggiornato a CONFIRMED in handlePaymentSuccess() dopo verifica pagamento
                const result: any = await submitBooking(
                    totalAmount,
                    { status: 'draft' },
                    selectedExtraServices.map(s => ({ id: s.id, name: s.name, price: s.price, included: !!s.included }))
                );
                setBookingResult(result || null);
                setShowPayment(true);
                setCurrentStep('payment');
            } else if (formData.payment_method === 'bank_transfer') {
                // Bonifico bancario: crea booking subito come PENDING (pagamento offline)
                const result: any = await submitBooking(
                    totalAmount,
                    { status: 'pending' },
                    selectedExtraServices.map(s => ({ id: s.id, name: s.name, price: s.price, included: !!s.included }))
                );
                setBookingResult(result || null);
                await handleBankTransferBooking();
            } else {
                // Metodo non riconosciuto: errore
                setError('Metodo di pagamento non valido. Seleziona Carta, PayPal o Bonifico.');
            }
        } catch (e: any) {
            setError(e.message || 'Errore inatteso');
        }
    };

    const handleBankTransferBooking = async () => {
        try {
            // Calcola importo INCLUSI SERVIZI EXTRA
            const totalWithExtras = (quote?.totalAmount || 0) + extraServicesCost;
            const amountPaid = formData.payment_type === 'deposit' && quote
                ? Math.round(totalWithExtras * 0.3 * 100) / 100
                : totalWithExtras;

            const bookingData = {
                guest_name: formData.guest_name,
                guest_surname: formData.guest_surname,
                guest_email: formData.guest_email,
                guest_phone: formData.guest_phone,
                check_in_date: formData.check_in_date?.toISOString().split('T')[0],
                check_out_date: formData.check_out_date?.toISOString().split('T')[0],
                adults: formData.num_adults,
                children: formData.num_children,
                children_ages: formData.children_ages,
                parking_option: formData.parking_option,
                payment_method: 'bank_transfer',
                payment_type: formData.payment_type,
                special_requests: formData.guest_message,
                email: formData.guest_email,
                phone: formData.guest_phone,
                guests: formData.num_adults + formData.num_children,
                // 🛎️ Inoltra i servizi extra selezionati per l'email del backend
                extra_services: selectedExtraServices.map(s => ({ id: s.id, name: s.name, price: s.price, included: !!s.included })),
                language: i18n.language || 'it'
            };

            // Salva la prenotazione come "pending" in attesa del bonifico
            const response = await fetch('/api/booking/confirm', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    payment_method: 'bank_transfer',
                    payment_status: 'pending',
                    payment_id: null,
                    amount: amountPaid,
                    total_amount: quote?.totalAmount || 0,
                    booking_data: bookingData
                })
            });

            const result = await response.json();
            
            if (!result.success) {
                throw new Error(result.error || 'Errore salvataggio prenotazione');
            }

            // Aggiorna il risultato con il booking ID reale
            setBookingResult({
                ...bookingResult,
                booking_id: result.bookingId || result.booking?.bookingId,
                id: result.id || result.booking?.id,
                payment_amount: amountPaid,
                payment_method: 'bank_transfer',
                payment_status: 'pending'
            });

            setCurrentStep('confirmation');
        } catch (error: any) {
            console.error('Errore prenotazione bonifico:', error);
            setError(`Errore nel salvataggio della prenotazione: ${error.message}`);
        }
    };

    const renderDetailsStep = (): JSX.Element => {
        // ⚡ FIX: Rimuovo useTranslation() da qui - usiamo il t definito al top level del componente
        return (
            <div className="booking-step-content step-transition">
                <h2>{getSafeTranslation(t, 'booking.detailsTitle', 'Dettagli Prenotazione')}</h2>
                
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
                {/* Scelta parcheggio (facoltativo) */}
                <div className="parking-selection">
                    <h3>🚗 {getSafeTranslation(t, 'booking.parking', 'Parcheggio')}</h3>
                    <div className="radio-group">
                        <input
                            type="radio"
                            id="parking-none-details"
                            name="parking_option_details"
                            value="none"
                            checked={formData.parking_option === 'none'}
                            onChange={(e) => setFormData({ parking_option: e.target.value as any })}
                        />
                        <label htmlFor="parking-none-details">
                            {getSafeTranslation(t, 'booking.noParking', 'Nessun parcheggio')}
                        </label>
                    </div>
                    <div className="radio-group">
                        <input
                            type="radio"
                            id="parking-street-details"
                            name="parking_option_details"
                            value="street"
                            checked={formData.parking_option === 'street'}
                            onChange={(e) => setFormData({ parking_option: e.target.value as any })}
                        />
                        <label htmlFor="parking-street-details">
                            {getSafeTranslation(t, 'booking.streetParking', 'Parcheggio su strada')}
                            <small className="service-note">{getSafeTranslation(t, 'booking.subjectToAvailability', 'Soggetto a disponibilità')}</small>
                        </label>
                    </div>
                    <div className="radio-group">
                        <input
                            type="radio"
                            id="parking-private-details"
                            name="parking_option_details"
                            value="private"
                            checked={formData.parking_option === 'private'}
                            onChange={(e) => setFormData({ parking_option: e.target.value as any })}
                        />
                        <label htmlFor="parking-private-details">
                            {getSafeTranslation(t, 'booking.privateParking', 'Parcheggio privato riservato e custodito')}
                        </label>
                    </div>
                </div>

                {/* SERVIZI EXTRA dopo scelta ospiti e parcheggio */}
                <div className="extra-services-section">
                    <h3>{getSafeTranslation(t, 'booking.extraServices', 'Servizi Extra')}</h3>
                    <ExtraServices
                        childrenAges={formData.children_ages}
                        onServicesChange={handleServicesChange}
                        calcOptions={quote ? { nights: quote.nights, adults: quote.guests, guests: quote.guests } : undefined}
                    />
                </div>
                {/* ExtraServices ora in step separato dopo le date */}
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
                            <input type="radio" id="deposit" name="payment_type" value="deposit" checked={formData.payment_type==='deposit'} onChange={(e)=>{
                                setFormData({ payment_type: e.target.value as any });
                                setPaymentCompleted(false);
                                setShowPayment(false);
                            }} />
                            <label htmlFor="deposit">{getSafeTranslation(t, 'booking.deposit30', 'Acconto 30%')} {quote && <span className="amount">€{((quote.totalAmount + extraServicesCost)*0.30).toFixed(2)}</span>}</label>
                        </div>
                        <div className="radio-group">
                            <input type="radio" id="full" name="payment_type" value="full" checked={formData.payment_type==='full'} onChange={(e)=>{
                                setFormData({ payment_type: e.target.value as any });
                                setPaymentCompleted(false);
                                setShowPayment(false);
                            }} />
                            <label htmlFor="full">{getSafeTranslation(t, 'booking.fullPayment', 'Saldo Completo')} {quote && <span className="amount">€{(quote.totalAmount + extraServicesCost).toFixed(2)}</span>}</label>
                        </div>
                    </div>
                    <div className="payment-method-selection-pro">
                        <h4>{getSafeTranslation(t, 'booking.paymentMethod', 'Metodo di Pagamento')}</h4>
                        <div className="payment-methods-grid">
                            <div 
                                className={`payment-card ${formData.payment_method === 'stripe' ? 'active' : ''}`}
                                onClick={() => {
                                    setFormData({ payment_method: 'stripe' });
                                    setPaymentCompleted(false);
                                    setShowPayment(false);
                                }}
                            >
                                <input type="radio" id="stripe" name="payment_method" value="stripe" checked={formData.payment_method==='stripe'} readOnly aria-label="Carta di Credito/Debito" />
                                <div className="payment-card-content">
                                    <img src="/icons/stripe_icon.webp" alt="Stripe" className="payment-logo" />
                                    <div className="payment-info">
                                        <span className="payment-title">{getSafeTranslation(t, 'booking.card', 'Carta di Credito/Debito')}</span>
                                        <span className="payment-subtitle">Visa, Mastercard, Amex</span>
                                    </div>
                                </div>
                                <div className="payment-checkmark">✓</div>
                            </div>

                            <div 
                                className={`payment-card ${formData.payment_method === 'paypal' ? 'active' : ''}`}
                                onClick={() => {
                                    setFormData({ payment_method: 'paypal' });
                                    setPaymentCompleted(false);
                                    setShowPayment(false);
                                }}
                            >
                                <input type="radio" id="paypal" name="payment_method" value="paypal" checked={formData.payment_method==='paypal'} readOnly aria-label="PayPal" />
                                <div className="payment-card-content">
                                    <img src="/icons/PayPal_icon.webp" alt="PayPal" className="payment-logo" />
                                    <div className="payment-info">
                                        <span className="payment-title">PayPal</span>
                                        <span className="payment-subtitle">Pagamento sicuro</span>
                                    </div>
                                </div>
                                <div className="payment-checkmark">✓</div>
                            </div>

                            <div 
                                className={`payment-card ${formData.payment_method === 'bank_transfer' ? 'active' : ''}`}
                                onClick={() => {
                                    setFormData({ payment_method: 'bank_transfer' });
                                    setPaymentCompleted(false);
                                    setShowPayment(false);
                                }}
                            >
                                <input type="radio" id="bank_transfer" name="payment_method" value="bank_transfer" checked={formData.payment_method==='bank_transfer'} readOnly aria-label="Bonifico Bancario" />
                                <div className="payment-card-content">
                                    <img src="/icons/bonifico_icon.webp" alt="Bonifico" className="payment-logo" />
                                    <div className="payment-info">
                                        <span className="payment-title">{getSafeTranslation(t, 'booking.bankTransfer', 'Bonifico Bancario')}</span>
                                        <span className="payment-subtitle">Conferma in 24-48h</span>
                                    </div>
                                </div>
                                <div className="payment-checkmark">✓</div>
                            </div>
                        </div>
                    </div>
                </div>
                {/* Riepilogo prezzi spostato in fondo per ridurre confusione */}
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
                                    <span className="price-value">€{Number(quote.basePrice || 0).toFixed(2)}</span>
                                </div>
                                {formData.parking_option === 'private' && quote.parkingCost > 0 && (
                                    <div className="price-item">
                                        <span className="price-label">🚗 {getSafeTranslation(t, 'booking.parking', 'Parcheggio')}</span>
                                        <span className="price-value">€{Number(quote.parkingCost || 0).toFixed(2)}</span>
                                    </div>
                                )}
                                {extraServicesCost > 0 && (
                                    <div className="price-item">
                                        <span className="price-label">🛎️ {getSafeTranslation(t, 'booking.extraServices', 'Servizi Extra')}</span>
                                        <span className="price-value">€{Number(extraServicesCost || 0).toFixed(2)}</span>
                                    </div>
                                )}
                                <div className="price-item">
                                    <span className="price-label">🧹 {getSafeTranslation(t, 'booking.cleaning', 'Pulizia')}</span>
                                    <span className="price-value">€{Number(quote.cleaningFee || 0).toFixed(2)}</span>
                                </div>
                                <div className="price-item">
                                    <span className="price-label">🏛️ {getSafeTranslation(t, 'booking.touristTax', 'Tassa soggiorno')}</span>
                                    <span className="price-value">€{Number(quote.touristTax || 0).toFixed(2)}</span>
                                </div>
                            </div>
                            <div className="price-total-section">
                                <div className="price-total">
                                    <span className="total-label">{getSafeTranslation(t, 'booking.total', 'Totale')}</span>
                                    <span className="total-value">€{Number((quote.totalAmount || 0) + (extraServicesCost || 0)).toFixed(2)}</span>
                                </div>
                                {formData.payment_type === 'deposit' && (
                                    <div className="price-deposit">
                                        <span className="deposit-label">{getSafeTranslation(t, 'booking.depositRequired', 'Acconto 30%')}</span>
                                        <span className="deposit-value">€{Number(((quote.totalAmount || 0) + (extraServicesCost || 0)) * 0.30).toFixed(2)}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
                <div className="step-actions">
                    <button type="button" className="btn-secondary" onClick={()=>setCurrentStep('dates')}>{getSafeTranslation(t, 'booking.back', 'Indietro')}</button>
                    <button 
                        type="button" 
                        className="btn-primary" 
                        disabled={isLoadingQuote || !isFormValid()} 
                        onClick={handleDetailsSubmit}
                        title={!isFormValid() ? 'Compila tutti i campi obbligatori' : ''}
                    >
                        {isLoadingQuote ? getSafeTranslation(t, 'booking.processing', 'Elaborazione...') : getSafeTranslation(t, 'booking.continueToPayment', 'Continua al Pagamento')}
                    </button>
                </div>
                {/* ℹ️ NOTA: PriceBreakdown nascosto qui - visibile solo in step payment/confirmation */}
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
                        <h2>{getSafeTranslation(t, 'booking.payment', 'Pagamento')}</h2>

                        {/* Messaggio visivo: conferma solo dopo pagamento */}
                        <div className="booking-payment-warning">
                            <span className="booking-payment-icon">⏳</span>
                            <div>
                                <strong className="booking-payment-title">La tua prenotazione sarà confermata solo dopo il pagamento.</strong>
                                <div className="booking-payment-subtitle">
                                    Le date selezionate restano disponibili fino al completamento del pagamento.
                                </div>
                            </div>
                        </div>

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
                                        onServicesChange={handleServicesChange}
                                        calcOptions={quote ? { nights: quote.nights, adults: quote.guests, guests: quote.guests } : undefined}
                                    />
                                </div>
                            )}
                        </div>

                        {/* Form di pagamento Stripe/PayPal */}
                        {showPayment && bookingResult && formData.payment_method === 'stripe' && paymentAmount > 0 && (
                            <div className="payment-form-section">
                                {(() => {
                                    // 💰 Use stored paymentAmount instead of recalculating
                                    const depositAmount = Math.round(paymentAmount * 0.30 * 100) / 100;
                                    const finalAmount = formData.payment_type === 'deposit' ? depositAmount : paymentAmount;
                                    
                                    console.log('💳 Stripe Amount Calculation:', {
                                        storedPaymentAmount: paymentAmount,
                                        depositAmount,
                                        payment_type: formData.payment_type,
                                        finalAmount
                                    });
                                    
                                    return (
                                        <StripePayment
                                            bookingId={bookingResult.booking_id || bookingResult.id?.toString() || ''}
                                            amount={finalAmount}
                                            customerEmail={formData.guest_email}
                                            customerName={`${formData.guest_name} ${formData.guest_surname}`}
                                            onPaymentSuccess={handlePaymentSuccess}
                                            onPaymentError={(error) => handlePaymentError(error, 'Errore durante il pagamento Stripe')}
                                            onCancel={() => {
                                                setShowPayment(false);
                                                setCurrentStep('details');
                                            }}
                                        />
                                    );
                                })()}
                            </div>
                        )}

                        {showPayment && bookingResult && formData.payment_method === 'paypal' && paymentAmount > 0 && (
                            <div className="payment-form-section">
                                {(() => {
                                    // 💰 Use stored paymentAmount instead of recalculating
                                    const depositAmount = Math.round(paymentAmount * 0.30 * 100) / 100;
                                    const finalAmount = formData.payment_type === 'deposit' ? depositAmount : paymentAmount;
                                    
                                    console.log('🅿️ PayPal Amount Calculation:', {
                                        storedPaymentAmount: paymentAmount,
                                        depositAmount,
                                        payment_type: formData.payment_type,
                                        finalAmount
                                    });
                                    
                                    return (
                                        <PayPalPayment
                                            bookingId={bookingResult.booking_id || bookingResult.id?.toString() || ''}
                                            amount={finalAmount}
                                            customerEmail={formData.guest_email}
                                            customerName={`${formData.guest_name} ${formData.guest_surname}`}
                                            onPaymentSuccess={handlePaymentSuccess}
                                            onPaymentError={(error) => handlePaymentError(error, 'Errore durante il pagamento PayPal')}
                                            onCancel={() => {
                                                setShowPayment(false);
                                                setCurrentStep('details');
                                            }}
                                        />
                                    );
                                })()}
                            </div>
                        )}

                        {/* Error message if paymentAmount is invalid */}
                        {showPayment && bookingResult && (formData.payment_method === 'stripe' || formData.payment_method === 'paypal') && (!paymentAmount || paymentAmount <= 0) && (
                            <div className="payment-form-section">
                                <div className="booking-payment-error">
                                    <h3 className="booking-error-title">❌ Errore: Importo non valido</h3>
                                    <p>L'importo della prenotazione non è stato calcolato correttamente.</p>
                                    <p><strong>Dettagli tecnici:</strong></p>
                                    <ul>
                                        <li>paymentAmount: {paymentAmount}</li>
                                        <li>quote exists: {quote ? 'Sì' : 'No'}</li>
                                        <li>quote.totalAmount: {quote?.totalAmount}</li>
                                        <li>extraServicesCost: {extraServicesCost}</li>
                                    </ul>
                                    <button 
                                        onClick={() => {
                                            setShowPayment(false);
                                            setCurrentStep('details');
                                        }}
                                        className="booking-error-back-btn"
                                    >
                                        Torna ai Dettagli
                                    </button>
                                </div>
                            </div>
                        )}

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
                                {getSafeTranslation(t, 'booking.backToDetails', 'Indietro ai Dettagli')}
                            </button>
                        </div>
                    </div>
                )}
                
                {currentStep === 'confirmation' && (
                    <div className="booking-step-content">
                        {/* Protezione contro bypass del pagamento */}
                        {!paymentCompleted && formData.payment_method !== 'bank_transfer' ? (
                            <div className="error-message">
                                <h3>⚠️ {getSafeTranslation(t, 'booking.paymentIncomplete.title', 'Pagamento non completato')}</h3>
                                <p>{getSafeTranslation(t, 'booking.paymentIncomplete.message', 'Non hai completato il processo di pagamento. Per confermare la prenotazione devi prima effettuare il pagamento.')}</p>
                                <button 
                                    onClick={() => {
                                        setCurrentStep('details');
                                        setShowPayment(false);
                                    }} 
                                    className="btn-primary"
                                >
                                    {getSafeTranslation(t, 'booking.backToDetails', 'Torna ai Dettagli')}
                                </button>
                            </div>
                        ) : (
                            <div className="confirmation-success">
                                <div className="success-icon">
                                    {formData.payment_method === 'bank_transfer' ? '⏳' : '✅'}
                                </div>
                                <h2>
                                    {formData.payment_method === 'bank_transfer' 
                                        ? getSafeTranslation(t, 'booking.confirmation.registeredTitle', 'Prenotazione Registrata!') 
                                        : getSafeTranslation(t, 'booking.confirmation.confirmedTitle', 'Prenotazione Confermata!')}
                                </h2>
                                <p>
                                    {formData.payment_method === 'bank_transfer'
                                        ? getSafeTranslation(t, 'booking.confirmation.registeredSubtitle', 'La tua prenotazione è stata registrata. Riceverai conferma dopo la verifica del bonifico.')
                                        : getSafeTranslation(t, 'booking.confirmation.confirmedSubtitle', 'Grazie per aver scelto Vincanto Maori. Ti abbiamo inviato una email di conferma.')}
                                </p>
                                
                                {bookingResult && (
                                    <div className="booking-summary">
                                        <h3>{getSafeTranslation(t, 'booking.summary.title', 'Riepilogo Prenotazione')}</h3>
                                        <p><strong>{getSafeTranslation(t, 'booking.summary.bookingId', 'ID Prenotazione')}:</strong> {bookingResult.booking_id}</p>
                                        <p><strong>{getSafeTranslation(t, 'booking.summary.checkIn', 'Check-in')}:</strong> {formData.check_in_date?.toLocaleDateString()}</p>
                                        <p><strong>{getSafeTranslation(t, 'booking.summary.checkOut', 'Check-out')}:</strong> {formData.check_out_date?.toLocaleDateString()}</p>
                                        <p><strong>{getSafeTranslation(t, 'booking.guests', 'Ospiti')}:</strong> {formData.num_adults} adulti {formData.num_children > 0 && `, ${formData.num_children} bambini`}</p>
                                        <p><strong>{formData.payment_method === 'bank_transfer' ? getSafeTranslation(t, 'booking.summary.amountToPay', 'Importo da Pagare') : getSafeTranslation(t, 'booking.summary.totalPaid', 'Totale Pagato')}:</strong> €{bookingResult.payment_amount?.toFixed(2)}</p>
                                        {formData.payment_method === 'bank_transfer' && (
                                            <p className="pending-status">{getSafeTranslation(t, 'booking.summary.statusPending', 'Stato: In attesa di pagamento')}</p>
                                        )}
                                    </div>
                                )}

                                {formData.payment_method === 'bank_transfer' && (
                                    <div className="bank-transfer-instructions">
                                        <h3>🏦 {getSafeTranslation(t, 'booking.bank.instructionsTitle', 'Istruzioni per il Bonifico')}</h3>
                                        <div className="bank-details">
                                            <p><strong>{getSafeTranslation(t, 'booking.bank.beneficiary', 'Beneficiario')}:</strong> Guida Antonio</p>
                                            <p><strong>{getSafeTranslation(t, 'booking.bank.iban', 'IBAN')}:</strong> IT04 D360 8105 038 288844288937</p>
                                            <p><strong>{getSafeTranslation(t, 'booking.bank.reason', 'Causale')}:</strong> {getSafeTranslation(t, 'booking.bank.reason.booking', 'Prenotazione')} {bookingResult?.booking_id}</p>
                                            <p><strong>{getSafeTranslation(t, 'booking.bank.amountToTransfer', 'Importo da versare')}:</strong> €{bookingResult?.payment_amount?.toFixed(2)}</p>
                                        </div>
                                        <p className="bank-note">⚠️ {getSafeTranslation(t, 'booking.bank.note', 'Importante: Ti abbiamo inviato una email con tutti i dettagli. La prenotazione sarà confermata definitivamente dopo la ricezione e verifica del bonifico bancario. Ti contatteremo entro 24-48 ore dalla ricezione del pagamento.')}</p>
                                    </div>
                                )}
                                
                                <button onClick={() => {
                                    if (onClose) onClose();
                                    else window.location.reload();
                                }} className="btn-primary">
                                    {getSafeTranslation(t, 'booking.close', 'Chiudi')}
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default BookingSystem;