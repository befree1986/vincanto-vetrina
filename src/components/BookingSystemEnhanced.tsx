import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useBooking } from '../hooks/useBooking';
import AvailabilityCalendar from './AvailabilityCalendar';
import { BookingStep3 } from './BookingSteps';
import ExtraServices from './ExtraServices';
import './BookingSystemEnhanced.css';
import { getSafeTranslation } from '../i18n';

// 🎯 Componente ottimizzato per il breakdown dei prezzi
interface PriceBreakdownProps {
    costs: any;
    loading: boolean;
    extraServicesCost?: number;
    selectedExtraServices?: any[];
}

const PriceBreakdown: React.FC<PriceBreakdownProps> = ({ 
    costs, 
    loading, 
    extraServicesCost = 0, 
    selectedExtraServices = [] 
}) => {
    const { t } = useTranslation();
    
    if (loading) {
        return (
            <div className="price-breakdown enhanced loading">
                <div className="loading-skeleton">
                    <div className="skeleton-line"></div>
                    <div className="skeleton-line short"></div>
                    <div className="skeleton-line"></div>
                    <div className="skeleton-line short"></div>
                </div>
            </div>
        );
    }
    
    if (!costs) return null;

    const totalWithExtras = costs.totalAmount + extraServicesCost;
    const depositWithExtras = totalWithExtras * 0.30;
    const remainingAmount = totalWithExtras - depositWithExtras;

    return (
        <div className="price-breakdown enhanced">
            <div className="breakdown-header">
                <h4>
                    <span className="icon">💰</span>
                    {getSafeTranslation(t, 'booking.quote', 'Preventivo')}
                </h4>
                <div className="nights-badge">
                    {costs.nights} {getSafeTranslation(t, 'booking.nights', 'notti')}
                </div>
            </div>

            <div className="breakdown-content">
                <div className="breakdown-section">
                    <div className="breakdown-item">
                        <span className="item-label">
                            <span className="icon">🏠</span>
                            {getSafeTranslation(t, 'booking.basePrice', 'Prezzo base')}
                        </span>
                        <span className="item-value">€{costs.basePrice?.toFixed(2) || '0.00'}</span>
                    </div>

                    {costs.parkingCost > 0 && (
                        <div className="breakdown-item">
                            <span className="item-label">
                                <span className="icon">🚗</span>
                                {getSafeTranslation(t, 'booking.parkingFee', 'Parcheggio privato')}
                            </span>
                            <span className="item-value">€{costs.parkingCost.toFixed(2)}</span>
                        </div>
                    )}

                    {costs.cleaningFee > 0 && (
                        <div className="breakdown-item">
                            <span className="item-label">
                                <span className="icon">🧽</span>
                                {getSafeTranslation(t, 'booking.cleaningFee', 'Pulizia finale')}
                            </span>
                            <span className="item-value">€{costs.cleaningFee.toFixed(2)}</span>
                        </div>
                    )}

                    <div className="breakdown-item">
                        <span className="item-label">
                            <span className="icon">🏛️</span>
                            {getSafeTranslation(t, 'booking.touristTax', 'Tassa di soggiorno')}
                        </span>
                        <span className="item-value">€{costs.touristTax?.toFixed(2) || '0.00'}</span>
                    </div>

                    {/* Servizi Extra */}
                    {selectedExtraServices.length > 0 && (
                        <>
                            <div className="breakdown-subtitle">
                                <span className="icon">🛎️</span>
                                Servizi Extra
                            </div>
                            {selectedExtraServices.map(service => (
                                <div key={service.id} className="breakdown-item extra-service">
                                    <span className="item-label">
                                        <span className="icon">✨</span>
                                        {service.name}
                                    </span>
                                    <span className="item-value">€{service.price.toFixed(2)}</span>
                                </div>
                            ))}
                        </>
                    )}
                </div>

                <div className="breakdown-separator"></div>

                <div className="breakdown-total">
                    <div className="breakdown-item total">
                        <span className="item-label">
                            <span className="icon">💰</span>
                            {getSafeTranslation(t, 'booking.total', 'Totale')}
                        </span>
                        <span className="item-value total-amount">€{totalWithExtras?.toFixed(2) || '0.00'}</span>
                    </div>

                    <div className="payment-info">
                        <div className="breakdown-item deposit">
                            <span className="item-label">
                                <span className="icon">💳</span>
                                {getSafeTranslation(t, 'booking.deposit', 'Acconto richiesto (30%)')}
                            </span>
                            <span className="item-value">€{depositWithExtras?.toFixed(2) || '0.00'}</span>
                        </div>

                        <div className="breakdown-item">
                            <span className="item-label">
                                <span className="icon">🏨</span>
                                {getSafeTranslation(t, 'booking.remaining', 'Saldo al check-in')}
                            </span>
                            <span className="item-value">€{remainingAmount?.toFixed(2) || '0.00'}</span>
                        </div>
                    </div>

                    <div className="payment-note">
                        <small>
                            {getSafeTranslation(t, 'booking.depositNote', 'L\'acconto del 30% è richiesto per confermare la prenotazione. Il saldo rimanente sarà pagato al momento del check-in.')}
                        </small>
                    </div>
                </div>
            </div>
        </div>
    );
};

// 🎯 Componente principale ottimizzato
const BookingSystemEnhanced: React.FC = () => {
    console.log('🔍 BookingSystemEnhanced: Componente inizializzato');
    
    const { t } = useTranslation();
    const booking = useBooking();
    
    console.log('🔍 BookingSystemEnhanced: Booking hook caricato', booking);
    
    const [currentStep, setCurrentStep] = useState(1);
    
    // 🛎️ Stati per servizi extra
    const [selectedExtraServices, setSelectedExtraServices] = useState<any[]>([]);
    const [extraServicesCost, setExtraServicesCost] = useState(0);

    // 🔄 Calcolo del numero di notti
    const nights = useMemo(() => {
        console.log('🔍 BookingSystemEnhanced: Calcolo notti', {
            checkIn: booking.formData.check_in_date,
            checkOut: booking.formData.check_out_date
        });
        
        if (booking.formData.check_in_date && booking.formData.check_out_date) {
            const checkIn = new Date(booking.formData.check_in_date);
            const checkOut = new Date(booking.formData.check_out_date);
            const diffTime = checkOut.getTime() - checkIn.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            return diffDays;
        }
        return 0;
    }, [booking.formData.check_in_date, booking.formData.check_out_date]);

    // ⚠️ Validazione soggiorno minimo
    const hasMinimumStay = nights >= 3;
    const stayValidationError = nights > 0 && nights < 3 ? 
        `Soggiorno minimo richiesto: 3 notti (attualmente ${nights} notte${nights !== 1 ? 'i' : ''})` : null;

    // ✅ Validazione step 1
    const validateStep1 = () => {
        return booking.formData.check_in_date && 
               booking.formData.check_out_date && 
               booking.formData.num_adults > 0 &&
               hasMinimumStay;
    };

    // 📊 Configurazione degli step
    const steps = [
        { 
            id: 1, 
            title: getSafeTranslation(t, 'booking.step1.title', 'Date e Ospiti'), 
            icon: '📅' 
        },
        { 
            id: 2, 
            title: getSafeTranslation(t, 'booking.extraServices', 'Servizi Extra'), 
            icon: '🛎️' 
        },
        { 
            id: 3, 
            title: getSafeTranslation(t, 'booking.step2.title', 'Dati Personali'), 
            icon: '📝' 
        },
        { 
            id: 4, 
            title: getSafeTranslation(t, 'booking.step3.title', 'Pagamento'), 
            icon: '💳' 
        }
    ];

    return (
        <div className="booking-system-enhanced">
            {/* Indicatore di progresso */}
            <div className="booking-progress">
                <div className="progress-steps">
                    {steps.map(step => (
                        <div 
                            key={step.id}
                            className={`progress-step ${currentStep >= step.id ? 'active' : ''} ${currentStep === step.id ? 'current' : ''}`}
                        >
                            <div className="step-circle">
                                <span className="step-icon">{step.icon}</span>
                            </div>
                            <span className="step-title">{step.title}</span>
                        </div>
                    ))}
                </div>
                <div className="progress-bar">
                    <div 
                        className={`progress-fill step-${currentStep}`}
                    ></div>
                </div>
            </div>

            <div className="booking-content">
                {/* Step 1: Date e Ospiti */}
                {currentStep === 1 && (
                    <div className="booking-step step-dates">
                        <div className="step-header">
                            <h3>
                                <span className="step-icon">📅</span>
                                {getSafeTranslation(t, 'booking.step1.title', 'Seleziona Date e Ospiti')}
                            </h3>
                            <p>{getSafeTranslation(t, 'booking.step1.subtitle', 'Quando vuoi soggiornare da noi?')}</p>
                        </div>

                        <div className="dates-section">
                            {/* Nuovo calendario con disponibilità */}
                            <AvailabilityCalendar 
                                selectedDate={booking.formData.check_in_date ? booking.formData.check_in_date.toISOString().split('T')[0] : undefined}
                                onDateSelect={(date) => {
                                    if (!booking.formData.check_in_date || booking.formData.check_out_date) {
                                        // Seleziona check-in
                                        booking.setFormData({
                                            check_in_date: new Date(date),
                                            check_out_date: null
                                        });
                                    } else {
                                        // Seleziona check-out
                                        const checkIn = new Date(booking.formData.check_in_date);
                                        const checkOut = new Date(date);
                                        
                                        if (checkOut > checkIn) {
                                            booking.setFormData({
                                                check_out_date: new Date(date)
                                            });
                                        } else {
                                            // Se la data è prima del check-in, resetta
                                            booking.setFormData({
                                                check_in_date: new Date(date),
                                                check_out_date: null
                                            });
                                        }
                                    }
                                }}
                                minDate={new Date().toISOString().split('T')[0]}
                                maxDate={new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0]}
                                className="booking-calendar"
                            />

                            {/* Riepilogo date selezionate */}
                            {booking.formData.check_in_date && (
                                <div className="selected-dates-summary">
                                    <div className="date-selection">
                                        <span className="label">Check-in:</span>
                                        <span className="date">{new Date(booking.formData.check_in_date).toLocaleDateString('it-IT')}</span>
                                    </div>
                                    {booking.formData.check_out_date && (
                                        <div className="date-selection">
                                            <span className="label">Check-out:</span>
                                            <span className="date">{new Date(booking.formData.check_out_date).toLocaleDateString('it-IT')}</span>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Avviso soggiorno minimo */}
                        {stayValidationError && (
                            <div className="minimum-stay-warning">
                                <span className="icon">⚠️</span>
                                <div className="warning-content">
                                    <strong>{getSafeTranslation(t, 'booking.minimumStay.title', 'Soggiorno minimo non rispettato')}</strong>
                                    <p>
                                        {getSafeTranslation(t, 'booking.minimumStay.message', 'Il soggiorno minimo richiesto è di 3 notti')}. 
                                        {' '}Attualmente hai selezionato {nights} notte{nights !== 1 ? 'i' : ''}.
                                    </p>
                                </div>
                            </div>
                        )}

                        <div className="guests-section">
                            <h4>
                                <span className="icon">👥</span>
                                {getSafeTranslation(t, 'booking.guests', 'Ospiti')}
                            </h4>
                            
                            <div className="guests-controls">
                                <div className="guest-control">
                                    <label htmlFor="adults">
                                        <span className="icon">👩‍🦳</span>
                                        {getSafeTranslation(t, 'booking.adults', 'Adulti')}
                                    </label>
                                    <div className="number-input">
                                        <button 
                                            type="button"
                                            onClick={() => booking.setFormData({ 
                                                num_adults: Math.max(1, booking.formData.num_adults - 1) 
                                            })}
                                            disabled={booking.formData.num_adults <= 1}
                                            aria-label="Diminuisci adulti"
                                        >
                                            -
                                        </button>
                                        <input
                                            id="adults"
                                            type="number"
                                            min="1"
                                            max="8"
                                            value={booking.formData.num_adults}
                                            onChange={(e) => booking.setFormData({ 
                                                num_adults: parseInt(e.target.value) || 1 
                                            })}
                                            aria-label="Numero adulti"
                                        />
                                        <button 
                                            type="button"
                                            onClick={() => booking.setFormData({ 
                                                num_adults: Math.min(8, booking.formData.num_adults + 1) 
                                            })}
                                            disabled={booking.formData.num_adults >= 8}
                                            aria-label="Aumenta adulti"
                                        >
                                            +
                                        </button>
                                    </div>
                                </div>

                                <div className="guest-control">
                                    <label htmlFor="children">
                                        <span className="icon">👶</span>
                                        {getSafeTranslation(t, 'booking.children', 'Bambini')}
                                    </label>
                                    <div className="number-input">
                                        <button 
                                            type="button"
                                            onClick={() => booking.setFormData({ 
                                                num_children: Math.max(0, booking.formData.num_children - 1) 
                                            })}
                                            disabled={booking.formData.num_children <= 0}
                                            aria-label="Diminuisci bambini"
                                        >
                                            -
                                        </button>
                                        <input
                                            id="children"
                                            type="number"
                                            min="0"
                                            max="4"
                                            value={booking.formData.num_children}
                                            onChange={(e) => booking.setFormData({ 
                                                num_children: parseInt(e.target.value) || 0 
                                            })}
                                            aria-label="Numero bambini"
                                        />
                                        <button 
                                            type="button"
                                            onClick={() => booking.setFormData({ 
                                                num_children: Math.min(4, booking.formData.num_children + 1) 
                                            })}
                                            disabled={booking.formData.num_children >= 4}
                                            aria-label="Aumenta bambini"
                                        >
                                            +
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Età bambini */}
                            {booking.formData.num_children > 0 && (
                                <div className="children-ages">
                                    <h5>{getSafeTranslation(t, 'booking.childrenAges', 'Età dei bambini')}</h5>
                                    <div className="ages-grid">
                                        {Array.from({ length: booking.formData.num_children }, (_, index) => (
                                            <div key={index} className="age-input">
                                                <label htmlFor={`child-age-${index}`}>
                                                    {getSafeTranslation(t, 'booking.child', 'Bambino')} {index + 1}
                                                </label>
                                                <select
                                                    id={`child-age-${index}`}
                                                    value={booking.formData.children_ages[index] || ''}
                                                    onChange={(e) => {
                                                        const newAges = [...booking.formData.children_ages];
                                                        newAges[index] = parseInt(e.target.value);
                                                        booking.setFormData({ children_ages: newAges });
                                                    }}
                                                >
                                                    <option value="">Età</option>
                                                    {Array.from({ length: 18 }, (_, age) => (
                                                        <option key={age} value={age}>
                                                            {age} anni
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="booking-navigation">
                            <button 
                                type="button"
                                disabled={true}
                                className="btn btn-secondary"
                            >
                                <span className="icon">⬅️</span>
                                {getSafeTranslation(t, 'booking.navigation.back', 'Indietro')}
                            </button>
                            
                            <button 
                                type="button"
                                onClick={() => setCurrentStep(2)}
                                disabled={!validateStep1()}
                                className={`btn btn-primary ${!validateStep1() ? 'disabled-with-reason' : ''}`}
                                title={!validateStep1() ? 'Completa tutti i campi obbligatori e rispetta il soggiorno minimo di 3 notti' : ''}
                            >
                                {getSafeTranslation(t, 'booking.navigation.next', 'Continua')}
                                <span className="icon">➡️</span>
                            </button>
                        </div>
                    </div>
                )}

                {/* Step 2: Servizi Extra */}
                {currentStep === 2 && (
                    <div className="booking-step step-services">
                        <div className="step-header">
                            <h3>
                                <span className="step-icon">🛎️</span>
                                {getSafeTranslation(t, 'booking.extraServices', 'Servizi Extra')}
                            </h3>
                            <p>{getSafeTranslation(t, 'booking.extraServicesDesc', 'Personalizza il tuo soggiorno con i nostri servizi aggiuntivi')}</p>
                        </div>

                        <ExtraServices
                            childrenAges={booking.formData.children_ages}
                            showHeader={false}
                            onServicesChange={(services, totalCost) => {
                                setSelectedExtraServices(services);
                                setExtraServicesCost(totalCost);
                                
                                // Sincronizza la selezione del parcheggio con parking_option
                                const parkingService = services.find(service => service.isParking || service.category === 'parcheggio');
                                if (parkingService) {
                                    booking.setFormData({ parking_option: 'private' });
                                } else {
                                    // Se non c'è parcheggio selezionato, imposta su "none" per default
                                    booking.setFormData({ parking_option: 'none' });
                                }
                            }}
                        />

                        <div className="step-navigation">
                            <button 
                                type="button"
                                onClick={() => setCurrentStep(1)}
                                className="btn btn-secondary"
                            >
                                <span className="icon">⬅️</span>
                                {getSafeTranslation(t, 'booking.navigation.back', 'Indietro')}
                            </button>
                            
                            <button 
                                type="button"
                                onClick={() => setCurrentStep(3)}
                                className="btn btn-primary"
                            >
                                {getSafeTranslation(t, 'booking.navigation.next', 'Continua')}
                                <span className="icon">➡️</span>
                            </button>
                        </div>
                    </div>
                )}

                {/* Step 3: Dati Personali */}
                {/* Step 3: Dati Personali */}
                {currentStep === 3 && (
                    <div className="booking-step step-personal">
                        <div className="step-header">
                            <h3>
                                <span className="step-icon">📝</span>
                                {getSafeTranslation(t, 'booking.step2.title', 'Dati Personali')}
                            </h3>
                            <p>{getSafeTranslation(t, 'booking.step2.subtitle', 'Inserisci i tuoi dati personali per la prenotazione')}</p>
                        </div>
                        <form
                            className="personal-form"
                            onSubmit={e => {
                                e.preventDefault();
                                setCurrentStep(4);
                            }}
                        >
                            <div className="form-group">
                                <label htmlFor="guest_name">Nome</label>
                                <input
                                    id="guest_name"
                                    type="text"
                                    value={booking.formData.guest_name || ''}
                                    onChange={e => booking.setFormData({ guest_name: e.target.value })}
                                    required
                                    placeholder="Mario"
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="guest_surname">Cognome</label>
                                <input
                                    id="guest_surname"
                                    type="text"
                                    value={booking.formData.guest_surname || ''}
                                    onChange={e => booking.setFormData({ guest_surname: e.target.value })}
                                    required
                                    placeholder="Rossi"
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="guest_email">Email</label>
                                <input
                                    id="guest_email"
                                    type="email"
                                    value={booking.formData.guest_email || ''}
                                    onChange={e => booking.setFormData({ guest_email: e.target.value })}
                                    required
                                    placeholder="mario.rossi@email.com"
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="guest_phone">Telefono</label>
                                <input
                                    id="guest_phone"
                                    type="tel"
                                    value={booking.formData.guest_phone || ''}
                                    onChange={e => booking.setFormData({ guest_phone: e.target.value })}
                                    required
                                    placeholder="+39 333 1234567"
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="special_requests">Note (opzionale)</label>
                                <textarea
                                    id="special_requests"
                                    value={booking.formData.special_requests || ''}
                                    onChange={e => booking.setFormData({ special_requests: e.target.value })}
                                    placeholder="Richieste particolari, allergie, orari..."
                                />
                            </div>
                            <div className="step-navigation">
                                <button
                                    type="button"
                                    onClick={() => setCurrentStep(2)}
                                    className="btn btn-secondary"
                                >
                                    <span className="icon">⬅️</span>
                                    {getSafeTranslation(t, 'booking.navigation.back', 'Indietro')}
                                </button>
                                <button
                                    type="submit"
                                    className="btn btn-primary"
                                    disabled={
                                        !booking.formData.guest_name ||
                                        !booking.formData.guest_surname ||
                                        !booking.formData.guest_email ||
                                        !booking.formData.guest_phone
                                    }
                                >
                                    {getSafeTranslation(t, 'booking.navigation.next', 'Continua')}
                                    <span className="icon">➡️</span>
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* Step 4: Pagamento */}
                {currentStep === 4 && (
                    <BookingStep3 
                        booking={booking}
                        onBack={() => setCurrentStep(3)}
                    />
                )}

                {/* Sidebar con preventivo - sempre visibile */}
                <div className="booking-sidebar">
                    <PriceBreakdown 
                        costs={booking.quote} 
                        loading={booking.isLoadingQuote}
                        extraServicesCost={extraServicesCost}
                        selectedExtraServices={selectedExtraServices}
                    />
                    
                    {booking.quoteError && (
                        <div className="error-message">
                            <span className="icon">⚠️</span>
                            {booking.quoteError}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default BookingSystemEnhanced;