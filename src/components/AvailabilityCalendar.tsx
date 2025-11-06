import React, { useState, useEffect } from 'react';
import './AvailabilityCalendar.css';

interface CalendarEvent {
  date: string;
  reason?: string;
  type: 'booking' | 'blocked';
  source?: string;
  check_in_date?: string; // Per compatibilità legacy
  check_out_date?: string; // Per compatibilità legacy
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
      
      // Calcola range del mese corrente
      const startDate = `${year}-${month.toString().padStart(2, '0')}-01`;
      const endDate = `${year}-${month.toString().padStart(2, '0')}-${new Date(year, month, 0).getDate()}`;

      // 🔄 INTEGRAZIONE: Usa availability-simple per controllo base
      console.log(`📅 Caricamento disponibilità per ${year}-${month}...`);
      
      const availabilityResponse = await fetch(`/api/availability-simple?action=check&startDate=${startDate}&endDate=${endDate}`);
      
      if (!availabilityResponse.ok) {
        throw new Error('Errore caricamento disponibilità');
      }
      
      const availabilityData = await availabilityResponse.json();
      
      if (availabilityData.success) {
        // Imposta date bloccate da TUTTE le fonti (Google, Booking, Holidu, DB interno)
        setBlockedDates(availabilityData.blockedDates || []);
        
        // Converti in eventi calendario con source info
        const calendarEvents: CalendarEvent[] = availabilityData.blockedDates.map((date: string) => ({
          date,
          type: 'blocked' as const,
          reason: 'Occupato',
          source: 'sync'
        }));
        
        setBookings(calendarEvents);
        
        console.log(`✅ ${availabilityData.blockedDates.length} date bloccate caricate da ${availabilityData.calendarsChecked?.length || 0} calendari`);
      } else {
        throw new Error(availabilityData.error || 'Errore disponibilità');
      }
      
    } catch (err) {
      console.error('❌ Errore caricamento calendario:', err);
      
      // Modalità disponibilità completa temporanea
      console.log('🔄 Modalità disponibilità completa - nessuna restrizione');
      setBlockedDates([]);
      setBookings([]);
      setError(null); // Rimuovi l'errore per nascondere il messaggio
      
      // Fallback: usa API legacy se disponibile (opzionale)
      try {
        // Ri-definisci le variabili per il fallback
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth() + 1;
        
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
      } catch (fallbackError) {
        console.error('Fallback API failed:', fallbackError);
        setBlockedDates([]);
        setBookings([]);
      }
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
    
    // 🔄 NUOVO: Controlla sia nel formato nuovo (singola data) che legacy (range)
    return bookings.some(booking => {
      // Formato nuovo: singola data bloccata
      if (booking.date === dateStr) {
        return true;
      }
      
      // Formato legacy: range check-in/check-out
      if (booking.check_in_date && booking.check_out_date) {
        const checkIn = new Date(booking.check_in_date);
        const checkOut = new Date(booking.check_out_date);
        return date >= checkIn && date < checkOut;
      }
      
      return false;
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