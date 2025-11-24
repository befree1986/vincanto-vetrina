import React, { useState, useEffect } from 'react';
import DatePicker from 'react-datepicker';
import { format, isBefore, addDays } from 'date-fns';
import { it } from 'date-fns/locale';
import 'react-datepicker/dist/react-datepicker.css';
import './BookingCalendar.css';

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
    minNights?: number;
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
    const [startDate, setStartDate] = useState<Date | null>(selectedCheckIn);
    const [endDate, setEndDate] = useState<Date | null>(selectedCheckOut);

    // Aggiorna lo stato interno quando cambiano le props
    useEffect(() => {
        setStartDate(selectedCheckIn);
        setEndDate(selectedCheckOut);
    }, [selectedCheckIn, selectedCheckOut]);

    // Gestione selezione date
    const handleDateChange = (dates: [Date | null, Date | null]) => {
        const [start, end] = dates;
        setStartDate(start);
        setEndDate(end);
        
        // 🔥 FIX: Chiama il callback SOLO quando abbiamo entrambe le date complete
        if (start && end) {
            console.log('📅 Range completo selezionato:', { start, end });
            onDateChange(start, end);
        }
        // Non chiamiamo onDateChange con date incomplete
    };

    // Verifica se una data è disabilitata
    const isDateDisabled = (date: Date): boolean => {
        // Non permettere date nel passato
        if (isBefore(date, new Date())) {
            return true;
        }

        // Controlla se la data è occupata
        return occupiedDates.some(occupied => {
            const startOccupied = new Date(occupied.start);
            const endOccupied = new Date(occupied.end);
            return date >= startOccupied && date <= endOccupied;
        });
    };

    // Calcola il numero di notti
    const calculateNights = (): number => {
        if (startDate && endDate) {
            const timeDiff = endDate.getTime() - startDate.getTime();
            return Math.ceil(timeDiff / (1000 * 3600 * 24));
        }
        return 0;
    };

    const isRangeAvailable = (start: Date, end: Date): boolean => {
        let current = start;
        while (current < end) {
            if (isDateDisabled(current)) {
                return false;
            }
            current = addDays(current, 1);
        }
        return true;
    };

    const getNextAvailableRange = (nights: number) => {
        let start = addDays(new Date(), 1);
        for (let i = 0; i < 120; i++) {
            if (!isDateDisabled(start)) {
                const end = addDays(start, nights);
                if (isRangeAvailable(start, end)) {
                    return { start, end };
                }
            }
            start = addDays(start, 1);
        }
        return null;
    };

    const handleQuickSelect = (nights: number) => {
        const range = getNextAvailableRange(nights);
        if (!range) return;
        setStartDate(range.start);
        setEndDate(range.end);
        onDateChange(range.start, range.end);
    };

    const resetSelection = () => {
        setStartDate(null);
        setEndDate(null);
        onDateChange(null, null);
    };

    const quickOptions = [
        { label: 'Weekend romantico', nights: 2, caption: '2 notti' },
        { label: 'Settimana relax', nights: 7, caption: '7 notti' },
        { label: 'Smart working stay', nights: 14, caption: '14 notti' }
    ];

    if (isLoading) {
        return (
            <div className="booking-calendar-container loading">
                <div className="calendar-loading">
                    <div className="spinner"></div>
                    <p>Caricamento calendario...</p>
                </div>
            </div>
        );
    }

    return (
        <div className={`booking-calendar-container ${className}`}>
            <div className="calendar-header">
                <h3>📅 Seleziona le Date del Soggiorno</h3>
                <p>Scegli la data di arrivo e partenza per il tuo soggiorno</p>
            </div>

            <div className="calendar-toolbar">
                <div className="quick-select-group">
                    <p className="calendar-eyebrow">Scelte rapide</p>
                    <div className="calendar-quick-actions">
                        {quickOptions.map(option => (
                            <button
                                type="button"
                                key={option.label}
                                className="quick-option"
                                onClick={() => handleQuickSelect(option.nights)}
                            >
                                <span>{option.label}</span>
                                <small>{option.caption}</small>
                            </button>
                        ))}
                    </div>
                </div>
                <button type="button" className="calendar-reset" onClick={resetSelection}>
                    Reset date
                </button>
            </div>

            <div className="calendar-wrapper">
                <DatePicker
                    selected={startDate}
                    onChange={handleDateChange}
                    startDate={startDate}
                    endDate={endDate}
                    selectsRange
                    inline
                    locale={it}
                    minDate={new Date()}
                    excludeDates={occupiedDates.map(date => new Date(date.start))}
                    filterDate={(date) => !isDateDisabled(date)}
                    monthsShown={2}
                    showDisabledMonthNavigation
                    calendarClassName="vincanto-calendar"
                    dayClassName={(date) => {
                        if (isDateDisabled(date)) return 'disabled-date';
                        if (startDate && endDate && date >= startDate && date <= endDate) {
                            return 'selected-range';
                        }
                        return '';
                    }}
                    // 🔥 FIX: Previeni autoScroll del DatePicker
                    shouldCloseOnSelect={false}
                    preventOpenOnFocus={true}
                />
            </div>

            {/* Informazioni selezione */}
            {startDate && endDate && (
                <div className="selection-info">
                    <div className="date-display">
                        <div className="check-in">
                            <strong>Check-in:</strong> {format(startDate, 'dd MMMM yyyy', { locale: it })}
                        </div>
                        <div className="check-out">
                            <strong>Check-out:</strong> {format(endDate, 'dd MMMM yyyy', { locale: it })}
                        </div>
                    </div>
                    <div className="nights-count">
                        🌙 {calculateNights()} {calculateNights() === 1 ? 'notte' : 'notti'}
                    </div>
                </div>
            )}

            {startDate && !endDate && (
                <div className="selection-help">
                    <p>📍 Data di arrivo selezionata. Ora scegli la data di partenza.</p>
                </div>
            )}

            {!startDate && (
                <div className="selection-help">
                    <p>👆 Clicca per selezionare la data di arrivo</p>
                </div>
            )}

            {/* Legenda */}
            <div className="calendar-legend">
                <div className="legend-item">
                    <div className="legend-color available"></div>
                    <span>Disponibile</span>
                </div>
                <div className="legend-item">
                    <div className="legend-color selected"></div>
                    <span>Selezionato</span>
                </div>
                <div className="legend-item">
                    <div className="legend-color booked"></div>
                    <span>Occupato</span>
                </div>
            </div>
        </div>
    );
};

export default BookingCalendar;