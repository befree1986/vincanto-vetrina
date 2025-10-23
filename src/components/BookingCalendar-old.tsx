import React, { useState, useEffect } from 'react';
import DatePicker from 'react-datepicker';
import { format, isSameDay, isAfter, isBefore, parseISO } from 'date-fns';
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
    occupiedDates,
    isLoading = false,
    minNights = 2,
    className = ''
}) => {
    const [startDate, setStartDate] = useState<Date | null>(selectedCheckIn);
    const [endDate, setEndDate] = useState<Date | null>(selectedCheckOut);

    // Converti le date occupate in oggetti Date per performance
    const occupiedRanges = occupiedDates.map(occupied => ({
        start: parseISO(occupied.start),
        end: parseISO(occupied.end),
        type: occupied.type,
        status: occupied.status
    }));

    // Verifica se una data è occupata
    const isDateOccupied = (date: Date): boolean => {
        return occupiedRanges.some(range => 
            (isSameDay(date, range.start) || isAfter(date, range.start)) &&
            (isSameDay(date, range.end) || isBefore(date, range.end))
        );
    };

    // Gestione selezione date
    const handleDateChange = (dates: [Date | null, Date | null]) => {
        const [start, end] = dates;
        setStartDate(start);
        setEndDate(end);
        onDateChange(start, end);
    };

    // Verifica se una data è disabilitata
    const isDateDisabled = (date: Date): boolean => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        // Date passate
        if (isBefore(date, today)) {
            return true;
        }
        
        // Date occupate
        if (isDateOccupied(date)) {
            return true;
        }
        
        // Se stiamo selezionando check-out, verifica distanza minima e date intermedie occupate
        if (isSelectingCheckOut && selectedCheckIn) {
            const daysDiff = Math.ceil((date.getTime() - selectedCheckIn.getTime()) / (1000 * 60 * 60 * 24));
            
            // Soggiorno troppo breve
            if (daysDiff < minNights) {
                return true;
            }
            
            // Verifica che non ci siano date occupate tra check-in e check-out
            const checkDate = new Date(selectedCheckIn);
            checkDate.setDate(checkDate.getDate() + 1); // Inizia dal giorno dopo il check-in
            
            while (isBefore(checkDate, date)) {
                if (isDateOccupied(checkDate)) {
                    return true;
                }
                checkDate.setDate(checkDate.getDate() + 1);
            }
        }
        
        return false;
    };

    // Gestisce la selezione delle date
    const handleDateSelect = (date: Date | null) => {
        if (!date || isDateDisabled(date)) {
            return;
        }

        if (!selectedCheckIn || isSelectingCheckOut) {
            // Selecting check-out or first date
            if (selectedCheckIn && isAfter(date, selectedCheckIn)) {
                // Valid check-out selection
                onDateChange(selectedCheckIn, date);
                setIsSelectingCheckOut(false);
            } else {
                // New check-in selection
                onDateChange(date, null);
                setIsSelectingCheckOut(true);
            }
        } else {
            // Selecting check-out
            if (isAfter(date, selectedCheckIn)) {
                onDateChange(selectedCheckIn, date);
                setIsSelectingCheckOut(false);
            } else {
                // New check-in selection
                onDateChange(date, null);
                setIsSelectingCheckOut(true);
            }
        }
    };

    // Reset quando cambiano le props
    useEffect(() => {
        if (!selectedCheckIn) {
            setIsSelectingCheckOut(false);
        } else if (selectedCheckIn && !selectedCheckOut) {
            setIsSelectingCheckOut(true);
        } else {
            setIsSelectingCheckOut(false);
        }
    }, [selectedCheckIn, selectedCheckOut]);

    // Stile personalizzato per le date
    const getDayClassName = (date: Date): string => {
        const baseClass = 'react-datepicker__day';
        const classes = [baseClass];

        if (isDateOccupied(date)) {
            classes.push('react-datepicker__day--occupied');
        }

        if (selectedCheckIn && isSameDay(date, selectedCheckIn)) {
            classes.push('react-datepicker__day--check-in');
        }

        if (selectedCheckOut && isSameDay(date, selectedCheckOut)) {
            classes.push('react-datepicker__day--check-out');
        }

        // Selected range
        if (selectedCheckIn && selectedCheckOut) {
            const isInRange = isAfter(date, selectedCheckIn) && isBefore(date, selectedCheckOut);
            if (isInRange) {
                classes.push('react-datepicker__day--in-range');
            }
        }

        return classes.join(' ');
    };

    // Render custom day content
    const renderDayContents = (day: number, date: Date) => {
        const occupiedRange = occupiedRanges.find(range =>
            (isSameDay(date, range.start) || isAfter(date, range.start)) &&
            (isSameDay(date, range.end) || isBefore(date, range.end))
        );

        return (
            <div className="booking-calendar-day">
                <span className="day-number">{day}</span>
                {occupiedRange && (
                    <div className={`occupied-indicator ${occupiedRange.type}`}>
                        {occupiedRange.type === 'booking' ? '●' : '■'}
                    </div>
                )}
            </div>
        );
    };

    if (isLoading) {
        return (
            <div className={`booking-calendar-container ${className}`}>
                <div className="booking-calendar-loading">
                    <div className="spinner"></div>
                    <p>Caricamento calendario...</p>
                </div>
            </div>
        );
    }

    return (
        <div className={`booking-calendar-container ${className}`}>
            <div className="booking-calendar-header">
                <h3>Seleziona le date del soggiorno</h3>
                <div className="calendar-legend">
                    <div className="legend-item">
                        <span className="legend-indicator booking">●</span>
                        <span>Prenotato</span>
                    </div>
                    <div className="legend-item">
                        <span className="legend-indicator blocked">■</span>
                        <span>Non disponibile</span>
                    </div>
                </div>
            </div>

            <div className="booking-calendar">
                <DatePicker
                    selected={selectedCheckIn}
                    onChange={handleDateSelect}
                    startDate={selectedCheckIn}
                    endDate={selectedCheckOut}
                    inline
                    monthsShown={2}
                    locale={it}
                    dayClassName={getDayClassName}
                    renderDayContents={renderDayContents}
                    filterDate={(date) => !isDateDisabled(date)}
                    minDate={new Date()}
                    calendarClassName="vincanto-calendar"
                    showPopperArrow={false}
                    fixedHeight
                />
            </div>

            <div className="selected-dates-summary">
                {selectedCheckIn && (
                    <div className="date-selection">
                        <div className="check-in-date">
                            <strong>Check-in:</strong> {format(selectedCheckIn, 'dd MMMM yyyy', { locale: it })}
                        </div>
                        {selectedCheckOut && (
                            <div className="check-out-date">
                                <strong>Check-out:</strong> {format(selectedCheckOut, 'dd MMMM yyyy', { locale: it })}
                            </div>
                        )}
                        {selectedCheckIn && selectedCheckOut && (
                            <div className="nights-count">
                                <strong>Durata:</strong> {Math.ceil((selectedCheckOut.getTime() - selectedCheckIn.getTime()) / (1000 * 60 * 60 * 24))} notti
                            </div>
                        )}
                    </div>
                )}
                
                {isSelectingCheckOut && selectedCheckIn && (
                    <div className="selection-help">
                        <p>Ora seleziona la data di check-out (minimo {minNights} notti)</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default BookingCalendar;