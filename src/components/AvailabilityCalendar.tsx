import React, { useState, useEffect } from 'react';
import './AvailabilityCalendar.css';

interface CalendarEvent {
  date: string;
  reason?: string;
  type: 'booking' | 'blocked';
  source?: string;
}

interface AvailabilityCalendarProps {
  onDateSelect?: (date: string) => void;
  selectedDate?: string;
  minDate?: string;
  maxDate?: string;
  className?: string;
}

const AvailabilityCalendar: React.FC<AvailabilityCalendarProps> = ({
  onDateSelect,
  selectedDate,
  minDate,
  maxDate,
  className = ''
}) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [blockedDates, setBlockedDates] = useState<string[]>([]);
  const [bookings, setBookings] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const today = new Date();
  const minDateObj = minDate ? new Date(minDate) : today;
  const maxDateObj = maxDate ? new Date(maxDate) : new Date(today.getFullYear() + 1, today.getMonth(), today.getDate());

  // Carica date bloccate e prenotazioni per il mese corrente
  useEffect(() => {
    loadCalendarData();
  }, [currentMonth]);

  const loadCalendarData = async () => {
    setLoading(true);
    setError(null);

    try {
      const year = currentMonth.getFullYear();
      const month = currentMonth.getMonth() + 1;

      // Carica date bloccate
      const blockedResponse = await fetch('/api/blocked-dates');
      if (blockedResponse.ok) {
        const blockedData = await blockedResponse.json();
        if (blockedData.success) {
          const dates = blockedData.blocked_dates.map((item: any) => 
            new Date(item.date).toISOString().split('T')[0]
          );
          setBlockedDates(dates);
        }
      }

      // Carica calendario con prenotazioni
      const calendarResponse = await fetch(`/api/availability?action=calendar&year=${year}&month=${month}`);
      if (calendarResponse.ok) {
        const calendarData = await calendarResponse.json();
        if (calendarData.success) {
          setBookings(calendarData.events || []);
        }
      }

    } catch (err) {
      console.error('Errore caricamento calendario:', err);
      setError('Errore nel caricamento del calendario');
    } finally {
      setLoading(false);
    }
  };

  // Genera i giorni del mese
  const generateCalendarDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay()); // Inizio settimana
    
    const days = [];
    const endDate = new Date(lastDay);
    endDate.setDate(endDate.getDate() + (6 - lastDay.getDay())); // Fine settimana
    
    for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
      days.push(new Date(date));
    }
    
    return days;
  };

  const isDateBlocked = (date: Date): boolean => {
    const dateStr = date.toISOString().split('T')[0];
    return blockedDates.includes(dateStr);
  };

  const isDateBooked = (date: Date): boolean => {
    const dateStr = date.toISOString().split('T')[0];
    return bookings.some(booking => {
      const checkIn = new Date(booking.date || booking.check_in_date);
      const checkOut = new Date(booking.check_out_date || booking.date);
      return date >= checkIn && date < checkOut;
    });
  };

  const isDateAvailable = (date: Date): boolean => {
    return date >= minDateObj && 
           date <= maxDateObj && 
           !isDateBlocked(date) && 
           !isDateBooked(date);
  };

  const handleDateClick = (date: Date) => {
    if (isDateAvailable(date) && onDateSelect) {
      const dateStr = date.toISOString().split('T')[0];
      onDateSelect(dateStr);
    }
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newMonth = new Date(currentMonth);
    if (direction === 'prev') {
      newMonth.setMonth(newMonth.getMonth() - 1);
    } else {
      newMonth.setMonth(newMonth.getMonth() + 1);
    }
    setCurrentMonth(newMonth);
  };

  const getDateClassName = (date: Date): string => {
    const isCurrentMonth = date.getMonth() === currentMonth.getMonth();
    const isToday = date.toDateString() === today.toDateString();
    const isSelected = selectedDate === date.toISOString().split('T')[0];
    const isAvailable = isDateAvailable(date);
    const isBlocked = isDateBlocked(date);
    const isBooked = isDateBooked(date);

    let className = 'calendar-day';
    
    if (!isCurrentMonth) className += ' other-month';
    if (isToday) className += ' today';
    if (isSelected) className += ' selected';
    if (isAvailable) className += ' available';
    if (isBlocked) className += ' blocked';
    if (isBooked) className += ' booked';
    if (date < minDateObj) className += ' past';
    
    return className;
  };

  const monthYear = currentMonth.toLocaleDateString('it-IT', { 
    month: 'long', 
    year: 'numeric' 
  });

  const weekDays = ['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab'];

  return (
    <div className={`availability-calendar ${className}`}>
      {/* Header del calendario */}
      <div className="calendar-header">
        <button 
          className="nav-button"
          onClick={() => navigateMonth('prev')}
          disabled={loading}
        >
          ←
        </button>
        
        <h3 className="month-year">
          {monthYear.charAt(0).toUpperCase() + monthYear.slice(1)}
        </h3>
        
        <button 
          className="nav-button"
          onClick={() => navigateMonth('next')}
          disabled={loading}
        >
          →
        </button>
      </div>

      {/* Giorni della settimana */}
      <div className="calendar-weekdays">
        {weekDays.map(day => (
          <div key={day} className="weekday">
            {day}
          </div>
        ))}
      </div>

      {/* Griglia calendario */}
      <div className="calendar-grid">
        {loading ? (
          <div className="loading-overlay">
            <div className="loading-spinner">🔄</div>
            <span>Caricamento...</span>
          </div>
        ) : (
          generateCalendarDays().map((date, index) => (
            <button
              key={index}
              className={getDateClassName(date)}
              onClick={() => handleDateClick(date)}
              disabled={!isDateAvailable(date)}
              title={
                isDateBlocked(date) ? 'Data non disponibile' :
                isDateBooked(date) ? 'Data già prenotata' :
                isDateAvailable(date) ? 'Data disponibile' : 
                'Data non selezionabile'
              }
            >
              {date.getDate()}
            </button>
          ))
        )}
      </div>

      {/* Legenda */}
      <div className="calendar-legend">
        <div className="legend-item">
          <span className="legend-dot available"></span>
          Disponibile
        </div>
        <div className="legend-item">
          <span className="legend-dot booked"></span>
          Prenotato
        </div>
        <div className="legend-item">
          <span className="legend-dot blocked"></span>
          Non disponibile
        </div>
      </div>

      {error && (
        <div className="error-message">
          ⚠️ {error}
          <button onClick={loadCalendarData} className="retry-button">
            Riprova
          </button>
        </div>
      )}
    </div>
  );
};

export default AvailabilityCalendar;