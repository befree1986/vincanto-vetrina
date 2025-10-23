import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useBooking } from '../hooks/useBooking';
import BookingCalendar from './BookingCalendar';
import { BookingStep2, BookingStep3 } from './BookingSteps';
import './BookingSystemEnhanced.css';
import { getSafeTranslation } from '../i18n';

// 🎯 Componente ottimizzato per il breakdown dei prezzi
interface PriceBreakdownProps {
    costs: any;
    loading: boolean;
}

const PriceBreakdown: React.FC<PriceBreakdownProps> = ({ costs, loading }) => {
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

    const remainingAmount = costs.total_amount - costs.deposit_amount;

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
                        <span className="item-value">€{costs.accommodation_amount?.toFixed(2) || '0.00'}</span>
                    </div>

                    {costs.parking_amount > 0 && (
                        <div className="breakdown-item">
                            <span className="item-label">
                                <span className="icon">🚗</span>
                                {getSafeTranslation(t, 'booking.parkingFee', 'Parcheggio privato')}
                            </span>
                            <span className="item-value">€{costs.parking_amount.toFixed(2)}</span>
                        </div>
                    )}

                    <div className="breakdown-item">
                        <span className="item-label">
                            <span className="icon">🏛️</span>
                            {getSafeTranslation(t, 'booking.touristTax', 'Tassa di soggiorno')}
                        </span>
                        <span className="item-value">€{costs.tourist_tax_amount?.toFixed(2) || '0.00'}</span>
                    </div>
                </div>

                <div className="breakdown-separator"></div>

                <div className="breakdown-total">
                    <div className="breakdown-item total">
                        <span className="item-label">
                            <span className="icon">💰</span>
                            {getSafeTranslation(t, 'booking.total', 'Totale')}
                        </span>
                        <span className="item-value total-amount">€{costs.total_amount?.toFixed(2) || '0.00'}</span>
                    </div>

                    <div className="payment-info">
                        <div className="breakdown-item deposit">
                            <span className="item-label">
                                <span className="icon">💳</span>
                                {getSafeTranslation(t, 'booking.deposit', 'Acconto richiesto (30%)')}
                            </span>
                            <span className="item-value">€{costs.deposit_amount?.toFixed(2) || '0.00'}</span>
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
    const { t } = useTranslation();
    const booking = useBooking();
    const [currentStep, setCurrentStep] = useState(1);

    // 🔄 Calcolo del numero di notti
    const nights = useMemo(() => {
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
            title: getSafeTranslation(t, 'booking.step2.title', 'Dati Personali'), 
            icon: '📝' 
        },
        { 
            id: 3, 
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
                            <BookingCalendar 
                                selectedCheckIn={booking.formData.check_in_date}
                                selectedCheckOut={booking.formData.check_out_date}
                                onDateChange={(checkIn, checkOut) => {
                                    booking.setFormData({
                                        check_in_date: checkIn,
                                        check_out_date: checkOut
                                    });
                                }}
                                occupiedDates={[]}
                            />
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

                        <div className="services-section">
                            <h4>
                                <span className="icon">🚗</span>
                                {getSafeTranslation(t, 'booking.additionalServices', 'Servizi Aggiuntivi')}
                            </h4>
                            
                            <div className="parking-options">
                                <label className="radio-option">
                                    <input
                                        type="radio"
                                        name="parking"
                                        value="none"
                                        checked={booking.formData.parking_option === 'none'}
                                        onChange={(e) => booking.setFormData({ parking_option: e.target.value as any })}
                                    />
                                    <span className="radio-label">
                                        <span className="icon">🚫</span>
                                        {getSafeTranslation(t, 'booking.parking.none', 'Non necessario')}
                                    </span>
                                </label>

                                <label className="radio-option">
                                    <input
                                        type="radio"
                                        name="parking"
                                        value="street"
                                        checked={booking.formData.parking_option === 'street'}
                                        onChange={(e) => booking.setFormData({ parking_option: e.target.value as any })}
                                    />
                                    <span className="radio-label">
                                        <span className="icon">🛣️</span>
                                        {getSafeTranslation(t, 'booking.parking.street', 'Parcheggio strada (Gratuito)')}
                                    </span>
                                </label>

                                <label className="radio-option">
                                    <input
                                        type="radio"
                                        name="parking"
                                        value="private"
                                        checked={booking.formData.parking_option === 'private'}
                                        onChange={(e) => booking.setFormData({ parking_option: e.target.value as any })}
                                    />
                                    <span className="radio-label">
                                        <span className="icon">🅿️</span>
                                        {getSafeTranslation(t, 'booking.parking.private', 'Parcheggio privato (+€15/notte)')}
                                    </span>
                                </label>
                            </div>
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

                {/* Step 2: Dati Personali */}
                {currentStep === 2 && (
                    <BookingStep2 
                        onNext={() => setCurrentStep(3)}
                        onBack={() => setCurrentStep(1)}
                    />
                )}

                {/* Step 3: Pagamento */}
                {currentStep === 3 && (
                    <BookingStep3 
                        onBack={() => setCurrentStep(2)}
                    />
                )}

                {/* Sidebar con preventivo - sempre visibile */}
                <div className="booking-sidebar">
                    <PriceBreakdown 
                        costs={booking.quote} 
                        loading={booking.isLoadingQuote}
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