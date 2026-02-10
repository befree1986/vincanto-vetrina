import React, { useState, useEffect, useCallback } from 'react';
import DatePicker from 'react-datepicker';
import { format, isBefore, addDays } from 'date-fns';
import { it, enUS, de, fr } from 'date-fns/locale';
import 'react-datepicker/dist/react-datepicker.css';
import './BookingCalendar.css';
import { useTranslation } from 'react-i18next';
import { useBookingRules } from '../hooks/useBookingRules';

interface OccupiedDate {
    start: string;
    end: string;
    type: 'booking' | 'blocked';
    status: string;
}

interface BookingCalendarProps {
    selectedCheckIn: Date | null;
    selectedCheckOut: Date | null;
    onDateChange: (checkIn: Date | null, checkOut: Date | null) => void;
    occupiedDates: OccupiedDate[];
    isLoading?: boolean;
    className?: string;
}

const BookingCalendar: React.FC<BookingCalendarProps> = ({
    selectedCheckIn,
    selectedCheckOut,
    onDateChange,
    occupiedDates = [],
    isLoading = false,
    className = ''
}) => {
    const { t, i18n } = useTranslation();
    const { getMinStayForDate } = useBookingRules(); // 1. Inizializza l'hook qui
    const [startDate, setStartDate] = useState<Date | null>(selectedCheckIn);
    const [endDate, setEndDate] = useState<Date | null>(selectedCheckOut);
    const [minStayError, setMinStayError] = useState<string | null>(null);

    const localeMap = {
        it: it,
        en: enUS,
        de: de,
        fr: fr,
    };
    const currentLocale = localeMap[i18n.language as keyof typeof localeMap] || it;

    useEffect(() => {
        setStartDate(selectedCheckIn);
        setEndDate(selectedCheckOut);
    }, [selectedCheckIn, selectedCheckOut]);

    const handleDateChange = (dates: [Date | null, Date | null]) => {
        const [start, end] = dates;

        if (start && !end) {
            setStartDate(start);
            setEndDate(null);
            return;
        }

        setStartDate(start);
        setEndDate(end);

        if (start && end) {
            const nights = Math.ceil((end.getTime() - start.getTime()) / (1000 * 3600 * 24));

            if (nights < 1) {
                setMinStayError(t('bookingCalendar.error.checkoutAfterCheckin', 'Il check-out deve essere almeno il giorno dopo il check-in.'));
                setStartDate(null);
                setEndDate(null);
                onDateChange(null, null);
                return;
            }

            // 2. Calcola il soggiorno minimo dinamico in base alla data di check-in
            const requiredMinStay = getMinStayForDate(start);

            if (nights < requiredMinStay) {
                // 3. Mostra il messaggio specifico per Agosto se necessario
                const isAugustRule = requiredMinStay >= 6; // Euristica: se min è 6 o più, è la regola di Agosto
                const errorKey = isAugustRule ? 'bookingCalendar.error.minStayAugust' : 'bookingCalendar.error.minStay';
                
                setMinStayError(t(errorKey, `Il soggiorno minimo è di {{count}} notti.`, { count: requiredMinStay, nights }));
                setStartDate(null);
                setEndDate(null);
                onDateChange(null, null);
                return;
            }

            setMinStayError(null);
            onDateChange(start, end);
        } else {
            setMinStayError(null);
        }
    };

    const isDateDisabled = useCallback((date: Date): boolean => {
        const tomorrow = new Date();
        tomorrow.setHours(0, 0, 0, 0);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        const checkDate = new Date(date);
        checkDate.setHours(0, 0, 0, 0);
        
        if (isBefore(checkDate, tomorrow)) {
            return true;
        }

        return occupiedDates.some(occupied => {
            const startOccupied = new Date(occupied.start);
            const endOccupied = new Date(occupied.end);
            return date >= startOccupied && date <= endOccupied;
        });
    }, [occupiedDates]);

    const calculateNights = useCallback((): number => {
        if (startDate && endDate) {
            const timeDiff = endDate.getTime() - startDate.getTime();
            return Math.ceil(timeDiff / (1000 * 3600 * 24));
        }
        return 0;
    }, [startDate, endDate]);

    const getDayClassName = useCallback((date: Date) => {
        if (isDateDisabled(date)) return 'disabled-date';
        if (startDate && endDate && date >= startDate && date <= endDate) {
            return 'selected-range';
        }
        return '';
    }, [isDateDisabled, startDate, endDate]);

    return (
        <>
            {isLoading ? (
                <div className="booking-calendar-container loading">
                    <div className="calendar-loading">
                        <div className="spinner"></div>
                        <p>{t('bookingCalendar.loading', 'Caricamento calendario...')}</p>
                    </div>
                </div>
            ) : (
                <div className={`booking-calendar-container ${className}`}>
                    <div className="calendar-header">
                        <h3>{t('bookingCalendar.title', '📅 Seleziona le Date del Soggiorno')}</h3>
                        <p>{t('bookingCalendar.subtitle', 'Scegli la data di arrivo e partenza per il tuo soggiorno')}</p>
                    </div>

                    <div className="calendar-wrapper">
                        <DatePicker
                            selected={startDate}
                            onChange={handleDateChange}
                            startDate={startDate}
                            endDate={endDate}
                            selectsRange
                            inline
                            locale={currentLocale}
                            minDate={addDays(new Date(), 1)}
                            excludeDates={occupiedDates.map(date => new Date(date.start))}
                            filterDate={(date) => !isDateDisabled(date)}
                            monthsShown={2}
                            showDisabledMonthNavigation
                            calendarClassName="vincanto-calendar"
                            dayClassName={getDayClassName}
                            shouldCloseOnSelect={false}
                            preventOpenOnFocus={true}
                        />
                    </div>

                    {minStayError && (
                        <div className="min-stay-error">
                            ⚠️ {minStayError}
                        </div>
                    )}

                    {startDate && endDate && !minStayError && (
                        <div className="selection-info">
                            <div className="date-display">
                                <div className="check-in">
                                    <strong>{t('bookingCalendar.checkin', 'Check-in')}:</strong> {format(startDate, 'dd MMMM yyyy', { locale: currentLocale })}
                                </div>
                                <div className="check-out">
                                    <strong>{t('bookingCalendar.checkout', 'Check-out')}:</strong> {format(endDate, 'dd MMMM yyyy', { locale: currentLocale })}
                                </div>
                            </div>
                            <div className="nights-count">
                                🌙 {t('bookingCalendar.nights', '{{count}} notte', { count: calculateNights() })}
                            </div>
                        </div>
                    )}

                    {startDate && !endDate && (
                        <div className="selection-help">
                            <p>{t('bookingCalendar.selectCheckout', '📍 Data di arrivo selezionata. Ora scegli la data di partenza.')}</p>
                        </div>
                    )}

                    {!startDate && (
                        <div className="selection-help">
                            <p>{t('bookingCalendar.selectCheckin', '👆 Clicca per selezionare la data di arrivo')}</p>
                        </div>
                    )}

                    <div className="calendar-legend">
                        <div className="legend-item">
                            <div className="legend-color available"></div>
                            <span>{t('bookingCalendar.legend.available', 'Disponibile')}</span>
                        </div>
                        <div className="legend-item">
                            <div className="legend-color selected"></div>
                            <span>{t('bookingCalendar.legend.selected', 'Selezionato')}</span>
                        </div>
                        <div className="legend-item">
                            <div className="legend-color booked"></div>
                            <span>{t('bookingCalendar.legend.occupied', 'Occupato')}</span>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default BookingCalendar;