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
    const depositWithExtras = isDeposit ? totalWithExtras * 0.20 : totalWithExtras;

    return (
        <div className="price-breakdown-professional">
            <div className="breakdown-header">
                <h4>{getSafeTranslation(t, 'booking.priceBreakdown', 'Riepilogo Prenotazione')}</h4>
                <span className="breakdown-subtitle">{t('booking.priceBreakdownSubtitle', 'Dettaglio costi del soggiorno')}</span>
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
                            <span>{t('booking.extraServicesSelected', 'Servizi Extra Selezionati')}</span>
                        </div>
                        {allExtraServices.map(service => (
                            <div key={service.id} className={`breakdown-item ${service.included ? 'included' : ''}`}>
                                <div className="item-label">
                                    <span>{service.name}</span>
                                    {service.included && <span className="badge-included">{t('booking.included', 'Incluso')}</span>}
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
                        <span>{t('booking.additionalCosts', 'Costi Aggiuntivi')}</span>
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
                        <span className="total-label">{t('booking.totalStay', 'Totale Soggiorno')}</span>
                        <span className="total-value">€{Number(totalWithExtras || 0).toFixed(2)}</span>
                    </div>

                    {isDeposit && (
                        <div className="deposit-item">
                            <div className="deposit-badge">
                                <span className="deposit-label">{getSafeTranslation(t, 'booking.deposit', 'Acconto richiesto (20%)')}</span>
                                <span className="deposit-percentage">{t('booking.payNow', 'Da pagare ora')}</span>
                            </div>
                            <span className="deposit-value">€{Number(depositWithExtras || 0).toFixed(2)}</span>
                        </div>
                    )}
                </div>
            </div>

            <div className="breakdown-footer">
                <div className="footer-note">
                    <span className="note-icon">✓</span>
                    <span>{t('booking.noHiddenCosts', 'Prezzi finali tutto incluso. Nessun costo nascosto.')}</span>
                </div>
                {allExtraServices.length > 0 && (
                    <div className="footer-services">
                        {t('booking.extraServicesCount', '{{count}} servizio extra selezionato', { count: allExtraServices.length })}
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
    const [paymentPopup, setPaymentPopup] = useState<{show: boolean, message: string}>({show: false, message: ''});
    const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
    // 💰 Payment amount - stored before submitBooking to avoid quote state issues
    const [paymentAmount, setPaymentAmount] = useState<number>(0);
    
    // 🎯 Custom hooks (dopo tutti gli useState)
    const {
        formData,
        setFormData,
        quote,
        isLoadingQuote,
        submitBooking,
        isCreatingBooking,
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

    useEffect(() => {
        const fetchPaymentMethods = async () => {
            try {
                const apiUrl = import.meta.env.VITE_API_BASE_URL || 'https://vincanto-vetrina.vercel.app/api';
                const response = await fetch(`${apiUrl}/unified?action=payment-methods`);
                const data = await response.json();
                if (data.success) {
                    setPaymentMethods(data.methods);
                }
            } catch (e) {
                console.error("Failed to fetch payment methods", e);
                // Fallback in caso di errore API
                setPaymentMethods([
                    { id: 'stripe_card', name: 'Carta di Credito/Debito', enabled: false },
                    { id: 'paypal', name: 'PayPal', enabled: false },
                    { id: 'bank_transfer', name: 'Bonifico Bancario', enabled: true },
                ]);
            }
        };
        fetchPaymentMethods();
    }, []);

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

            // Dati riepilogo costi per email (recuperati dallo stato corrente)
            const breakdownData = quote ? {
                accommodationCost: (quote as any).accommodationCost,
                cleaningFee: quote.cleaningFee,
                parkingCost: quote.parkingCost,
                touristTax: quote.touristTax,
                extraServicesCost: extraServicesCost,
                nights: quote.nights
            } : {};

            // Calcola l'importo pagato (acconto o totale) INCLUSI SERVIZI EXTRA
            const totalWithExtras = (quote?.totalAmount || 0) + extraServicesCost;
            const isDeposit = formData.payment_type === 'deposit';
            const amountPaid = isDeposit && quote
                ? Math.round(totalWithExtras * 0.2 * 100) / 100 // Corretto a 20% per coerenza
                : totalWithExtras;
            
            const dbPaymentStatus = isDeposit ? 'deposit_paid' : 'paid_full';

            // Aggiorna booking da DRAFT a CONFIRMED con dati pagamento
            const updateResult = await updateBookingStatus(
                bookingResult.booking_id,
                'confirmed',
                {
                    payment_id: data?.payment_intent_id || data?.paymentId || null,
                    payment_status: dbPaymentStatus, // Invia stato specifico invece di 'success' generico
                    amount_paid: amountPaid,
                    // 🛎️ Passa i servizi extra per includerli nell'email di conferma
                    extra_services: selectedExtraServices.map(s => ({ id: s.id, name: s.name, price: s.price, included: !!s.included })),
                    language: i18n.language || 'it',
                    ...breakdownData
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
            setError(`${t('booking.error.paymentSuccessSaveFailed')} ${bookingResult?.booking_id || 'N/A'}.`);
        }
    };

    const handlePaymentError = async (errorMessage: string, reason?: string) => {
        try {
            // Quando pagamento fallisce, cancella il booking draft
            if (bookingResult?.booking_id) {
                console.log(`🚫 Cancellazione booking ${bookingResult.booking_id} per errore pagamento: ${errorMessage}`);
                await cancelBooking(bookingResult.booking_id, reason || `${t('booking.error.paymentFailedReason')}: ${errorMessage}`);
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
                <div className="step-label">{t('booking.step.dates', 'Date')}</div>
            </div>
            <div className={`step ${currentStep === 'details' ? 'active' : ''} ${['payment', 'confirmation'].includes(currentStep) ? 'completed' : ''}`}>
                <div className="step-number">2</div>
                <div className="step-label">{t('booking.step.details', 'Dettagli')}</div>
            </div>
            <div className={`step ${currentStep === 'payment' ? 'active' : ''} ${currentStep === 'confirmation' ? 'completed' : ''}`}>
                <div className="step-number">3</div>
                <div className="step-label">{t('booking.step.payment', 'Pagamento')}</div>
            </div>
            <div className={`step ${currentStep === 'confirmation' ? 'active' : ''}`}>
                <div className="step-number">4</div>
                <div className="step-label">{t('booking.step.confirmation', 'Conferma')}</div>
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
            <h2>{t('booking.selectDates', 'Seleziona le Date')}</h2>
            {dynamicPricing.minStay > 0 && (
                <div className="min-stay-info" dangerouslySetInnerHTML={{ __html: t('booking.minStayInfo', 'ℹ️ Soggiorno minimo richiesto: <strong>{{count}} notte</strong>', { count: dynamicPricing.minStay }) }} />
            )}
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
        // ✅ VALIDAZIONE COMPLETA FORM
        const errors = validateForm();
        if (Object.keys(errors).length > 0) {
            const errorMessages = Object.values(errors).join(', ');
            setError(`${t('booking.error.missingFields')}: ${errorMessages}`);
            // Scroll al primo errore
            const firstErrorField = document.querySelector('.form-group.error');
            firstErrorField?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            return;
        }
        
        // ✅ VALIDAZIONE CAMPI ESSENZIALI
        if (!formData.guest_name?.trim()) {
            setError(t('booking.error.firstNameRequired', 'Nome obbligatorio'));
            return;
        }
        if (!formData.guest_surname?.trim()) {
            setError(t('booking.error.lastNameRequired', 'Cognome obbligatorio'));
            return;
        }
        if (!formData.guest_email?.trim() || !formData.guest_email.includes('@')) {
            setError(t('booking.error.emailRequired', 'Email valida obbligatoria'));
            return;
        }
        if (!formData.guest_phone?.trim() || formData.guest_phone.length < 8) {
            setError(t('booking.error.phoneRequired', 'Telefono valido obbligatorio (min 8 cifre)'));
            return;
        }
        if (!formData.payment_method) {
            setError(t('booking.error.paymentMethodRequired', 'Seleziona un metodo di pagamento'));
            return;
        }
        try {
            // ✅ Calcola totale completo (quote + servizi extra)
            const totalAmount = quote ? (quote.totalAmount + extraServicesCost) : 0;
            
            // Dati riepilogo costi per email
            const breakdownData = quote ? {
                accommodationCost: (quote as any).accommodationCost,
                cleaningFee: quote.cleaningFee,
                parkingCost: quote.parkingCost,
                touristTax: quote.touristTax,
                extraServicesCost: extraServicesCost,
                nights: quote.nights
            } : {};

            console.log('📧 Invio breakdown costi per email:', breakdownData);

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
                    { 
                        status: 'draft',
                        ...breakdownData
                    },
                    selectedExtraServices.map(s => ({ id: s.id, name: s.name, price: s.price, included: !!s.included }))
                );
                setBookingResult(result || null);
                setShowPayment(true);
                setCurrentStep('payment');
            } else if (formData.payment_method === 'bank_transfer') {
                // Bonifico bancario: crea booking subito come PENDING (pagamento offline)
                const result: any = await submitBooking(
                    totalAmount,
                    { 
                        status: 'pending',
                        ...breakdownData
                    },
                    selectedExtraServices.map(s => ({ id: s.id, name: s.name, price: s.price, included: !!s.included }))
                );
                setBookingResult(result || null);
                setCurrentStep('confirmation');
            } else {
                // Metodo non riconosciuto: errore
                setError(t('booking.error.invalidPaymentMethod', 'Metodo di pagamento non valido. Seleziona Carta, PayPal o Bonifico.'));
            }
        } catch (e: any) {
            setError(e.message || t('booking.error.unexpected', 'Errore inatteso'));
        }
    };

    const renderDetailsStep = (): JSX.Element => {
        // ⚡ FIX: Rimuovo useTranslation() da qui - usiamo il t definito al top level del componente

        const handlePaymentMethodClick = (methodId: string) => {
            const method = paymentMethods.find(m => m.id === methodId);
            if (method && !method.enabled) {
                setPaymentPopup({
                    show: true, 
                    message: t('booking.paymentDisabled.message', 'Questo metodo di pagamento è temporaneamente non disponibile. Ci scusiamo per il disagio.')
                });
            } else if (method) {
                let formMethodId = methodId;
                if (methodId === 'stripe_card') formMethodId = 'stripe';
        
                setFormData({ payment_method: formMethodId as 'stripe' | 'paypal' | 'bank_transfer' });
                setPaymentCompleted(false);
                setShowPayment(false);
            }
        };

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
                            {getSafeTranslation(t, 'booking.privateParking', 'Parcheggio privato')}
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
                            <label htmlFor="deposit">{getSafeTranslation(t, 'booking.deposit30', 'Acconto 20%')} {quote && <span className="amount">€{((quote.totalAmount + extraServicesCost)*0.20).toFixed(2)}</span>}</label>
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
                                className={`payment-card ${formData.payment_method === 'stripe' ? 'active' : ''} ${!paymentMethods.find(m=>m.id === 'stripe_card')?.enabled ? 'disabled' : ''}`}
                                onClick={() => handlePaymentMethodClick('stripe_card')}
                            >
                                <input type="radio" id="stripe" name="payment_method" value="stripe" checked={formData.payment_method==='stripe'} readOnly aria-label="Carta di Credito/Debito" />
                                <div className="payment-card-content">
                                    <img src="/icons/stripe_icon.webp" alt="Stripe" className="payment-logo" />
                                    <div className="payment-info">
                                        <span className="payment-title">{getSafeTranslation(t, 'booking.card', 'Carta di Credito/Debito')}</span>
                                        <span className="payment-subtitle">{t('booking.cardSubtitle', 'Visa, Mastercard, Amex')}</span>
                                    </div>
                                </div>
                                <div className="payment-checkmark">✓</div>
                            </div>

                            <div
                                className={`payment-card ${formData.payment_method === 'paypal' ? 'active' : ''} ${!paymentMethods.find(m=>m.id === 'paypal')?.enabled ? 'disabled' : ''}`}
                                onClick={() => handlePaymentMethodClick('paypal')}
                            >
                                <input type="radio" id="paypal" name="payment_method" value="paypal" checked={formData.payment_method==='paypal'} readOnly aria-label="PayPal" />
                                <div className="payment-card-content">
                                    <img src="/icons/PayPal_icon.webp" alt="PayPal" className="payment-logo" />
                                    <div className="payment-info">
                                        <span className="payment-title">PayPal</span>
                                        <span className="payment-subtitle">{t('booking.paypalSubtitle', 'Pagamento sicuro')}</span>
                                    </div>
                                </div>
                                <div className="payment-checkmark">✓</div>
                            </div>

                            <div
                                className={`payment-card ${formData.payment_method === 'bank_transfer' ? 'active' : ''} ${!paymentMethods.find(m=>m.id === 'bank_transfer')?.enabled ? 'disabled' : ''}`}
                                onClick={() => handlePaymentMethodClick('bank_transfer')}
                            >
                                <input type="radio" id="bank_transfer" name="payment_method" value="bank_transfer" checked={formData.payment_method==='bank_transfer'} readOnly aria-label="Bonifico Bancario" />
                                <div className="payment-card-content">
                                    <img src="/icons/bonifico_icon.webp" alt="Bonifico" className="payment-logo" />
                                    <div className="payment-info">
                                        <span className="payment-title">{getSafeTranslation(t, 'booking.bankTransfer', 'Bonifico Bancario')}</span>
                                        <span className="payment-subtitle">{t('booking.bankTransferSubtitle', 'Conferma in 24-48h')}</span>
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
                                    <span className="price-label">{getSafeTranslation(t, 'booking.accommodation', 'Soggiorno')} ({quote.nights} {t('booking.night', 'notte', { count: quote.nights })})</span>
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
                                        <span className="deposit-label">{getSafeTranslation(t, 'booking.depositRequired', 'Acconto 20%')}</span>
                                        <span className="deposit-value">€{Number(((quote.totalAmount || 0) + (extraServicesCost || 0)) * 0.20).toFixed(2)}</span>
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
                        disabled={isLoadingQuote || isCreatingBooking || !isFormValid()} 
                        onClick={handleDetailsSubmit}
                        title={!isFormValid() ? t('booking.error.fillAllFields', 'Compila tutti i campi obbligatori') : ''}
                    >
                        {isLoadingQuote || isCreatingBooking ? getSafeTranslation(t, 'booking.processing', 'Elaborazione...') : getSafeTranslation(t, 'booking.continueToPayment', 'Continua al Pagamento')}
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

                {paymentPopup.show && (
                    <div className="payment-popup-overlay" onClick={() => setPaymentPopup({show: false, message: ''})}>
                        <div className="payment-popup-content" onClick={(e) => e.stopPropagation()}>
                            <h4>{t('booking.paymentDisabled.title', 'Metodo non disponibile')}</h4>
                            <p>{paymentPopup.message}</p>
                            <button onClick={() => setPaymentPopup({show: false, message: ''})} className="btn-primary">
                                {t('booking.close', 'Chiudi')}
                            </button>
                        </div>
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
                                <strong className="booking-payment-title">{t('booking.confirmationPending', 'La tua prenotazione sarà confermata solo dopo il pagamento.')}</strong>
                                <div className="booking-payment-subtitle">
                                    {t('booking.datesHeldUntilPayment', 'Le date selezionate restano disponibili fino al completamento del pagamento.')}
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
                                {showEditOptions ? t('booking.closeEdits', 'Chiudi modifiche') : t('booking.editServices', 'Modifica servizi e parcheggio')}
                            </button>

                            {showEditOptions && (
                                <div className="edit-options-content">
                                    <h3>{t('booking.parkingOptions', 'Opzioni Parcheggio')}</h3>
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
                                            {t('booking.noParking', 'Nessun parcheggio')}
                                            <small className="service-note">{t('booking.canArriveOnFoot', 'Puoi arrivare a piedi')}</small>
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
                                            {t('booking.streetParking', 'Parcheggio su strada')}
                                            <small className="service-note">{t('booking.subjectToAvailability', 'Soggetto a disponibilità')}</small>
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
                                            {t('booking.privateParking', 'Parcheggio privato')}
                                        </label>
                                    </div>

                                    {/* Servizi extra compatti */}
                                    <h3>{t('booking.extraServices', 'Servizi Extra')}</h3>
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
                                    const depositAmount = Math.round(paymentAmount * 0.20 * 100) / 100;
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
                                            onPaymentError={(error) => handlePaymentError(error, t('booking.error.stripeError', 'Errore durante il pagamento Stripe'))}
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
                                    const depositAmount = Math.round(paymentAmount * 0.20 * 100) / 100;
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
                                            onPaymentError={(error) => handlePaymentError(error, t('booking.error.paypalError', 'Errore durante il pagamento PayPal'))}
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
                                    <h3 className="booking-error-title">{t('booking.error.invalidAmountTitle', '❌ Errore: Importo non valido')}</h3>
                                    <p>{t('booking.error.invalidAmountMessage', 'L\'importo della prenotazione non è stato calcolato correttamente.')}</p>
                                    <p><strong>{t('booking.error.technicalDetails', 'Dettagli tecnici:')}</strong></p>
                                    <ul>
                                        <li>paymentAmount: {paymentAmount}</li>
                                        <li>quote exists: {quote ? t('common.yes', 'Sì') : t('common.no', 'No')}</li>
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
                                        {t('booking.backToDetails', 'Torna ai Dettagli')}
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
                                        <p><strong>{getSafeTranslation(t, 'booking.guests', 'Ospiti')}:</strong> {t('booking.summary.guestsCount', '{{adults}} adulti, {{children}} bambini', { adults: formData.num_adults, children: formData.num_children })}</p>
                                        <p><strong>{formData.payment_method === 'bank_transfer' 
                                        ? getSafeTranslation(t, 'booking.summary.amountToPay', 'Importo da Pagare') 
                                        : getSafeTranslation(t, 'booking.summary.totalPaid', 'Totale Pagato')
                                        }:
                                        </strong> €{(bookingResult.amountToPay || (formData.payment_type === 'deposit' ? bookingResult.booking?.deposit_amount : bookingResult.booking?.total_amount) || 0).toFixed(2)}
                                        </p>
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
                                            <p><strong>{getSafeTranslation(t, 'booking.bank.amountToTransfer', 'Importo da versare')}:</strong> €{bookingResult?.amountToPay?.toFixed(2)}</p>
                                            <p><strong>{getSafeTranslation(t, 'booking.bank.amountToTransfer', 'Importo da versare')}:</strong> €{(bookingResult?.amountToPay || (formData.payment_type === 'deposit' ? bookingResult?.booking?.deposit_amount : bookingResult?.booking?.total_amount) || 0).toFixed(2)}</p>
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
