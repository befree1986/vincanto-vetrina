import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
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
  checkOutDate?: string; // Aggiunto per range selection
  minDate?: string;
  maxDate?: string;
  monthsShown?: number;
  className?: string;
}

const AvailabilityCalendar: React.FC<AvailabilityCalendarProps> = ({
  onDateSelect,
  selectedDate,
  checkOutDate,
  minDate,
  maxDate,
  monthsShown = 1,
  className = ''
}) => {
  const { t, i18n } = useTranslation();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [blockedDates, setBlockedDates] = useState<string[]>([]);
  const [bookings, setBookings] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hoveredDate, setHoveredDate] = useState<Date | null>(null);

  const today = new Date();
  today.setHours(0, 0, 0, 0); // Reset ore per confronto preciso
  
  // Minimo check-in: domani (NO same-day booking)
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const minDateObj = minDate ? new Date(minDate) : tomorrow;
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

      // 🎯 AGGIORNATO: Usa endpoint unificato per tutti i servizi calendario
      console.log(`📅 Caricamento disponibilità per ${year}-${month}...`);
      
      // Carica date bloccate, prenotazioni dirette E prenotazioni calendari esterni (Airbnb/Booking/etc)
      const [blockedResponse, bookingsResponse, externalBookingsResponse] = await Promise.all([
        fetch(`/api/unified?action=blocked-dates&start_date=${startDate}&end_date=${endDate}`),
        fetch(`/api/unified?action=booking&start_date=${startDate}&end_date=${endDate}`),
        fetch(`/api/unified?action=calendar-bookings&futureOnly=true&limit=200`)
      ]);
      
      if (!blockedResponse.ok || !bookingsResponse.ok) {
        throw new Error('Errore caricamento calendario');
      }
      
      const blockedData = await blockedResponse.json();
      const bookingsData = await bookingsResponse.json();
      const externalBookingsData = externalBookingsResponse.ok ? await externalBookingsResponse.json() : { success: true, bookings: [] };
      
      if (blockedData.success && bookingsData.success) {
        // Crea array date bloccate da date manuali
        const manualBlockedDates = (blockedData.blockedDates || []).map((block: any) => block.start_date);
        
        // Crea array date bloccate da prenotazioni dirette
        const bookingBlockedDates = (bookingsData.bookings || []).map((booking: any) => {
          const checkIn = new Date(booking.check_in);
          const checkOut = new Date(booking.check_out);
          const dates = [];
          for (let d = new Date(checkIn); d < checkOut; d.setDate(d.getDate() + 1)) {
            dates.push(d.toISOString().split('T')[0]);
          }
          return dates;
        }).flat();

        // Crea array date bloccate da calendari esterni (Airbnb/Booking/Holidu)
        const externalBlockedDates = (externalBookingsData.bookings || []).map((booking: any) => {
          const checkIn = new Date(booking.checkIn);
          const checkOut = new Date(booking.checkOut);
          const dates = [];
          for (let d = new Date(checkIn); d < checkOut; d.setDate(d.getDate() + 1)) {
            dates.push(d.toISOString().split('T')[0]);
          }
          return dates;
        }).flat();
        
        // Combina tutte le date bloccate (manuali + dirette + esterne)
        const allBlockedDates = [...manualBlockedDates, ...bookingBlockedDates, ...externalBlockedDates];
        setBlockedDates(allBlockedDates);
        
        // Crea eventi calendario combinati
        const manualEvents: CalendarEvent[] = (blockedData.blockedDates || []).map((block: any) => ({
          date: block.start_date,
          type: 'blocked' as const,
          reason: block.description || 'Bloccato',
          source: 'manual'
        }));
        
        const bookingEvents: CalendarEvent[] = (bookingsData.bookings || []).map((booking: any) => ({
          date: booking.check_in.split('T')[0],
          type: 'booking' as const,
          reason: `Prenotato - ${booking.customer_name}`,
          source: 'booking',
          check_in_date: booking.check_in.split('T')[0],
          check_out_date: booking.check_out.split('T')[0]
        }));

        const externalEvents: CalendarEvent[] = (externalBookingsData.bookings || []).map((booking: any) => ({
          date: booking.checkIn.split('T')[0],
          type: 'booking' as const,
          reason: `${booking.platformName} - ${booking.title || 'Prenotazione'}`,
          source: 'external',
          check_in_date: booking.checkIn.split('T')[0],
          check_out_date: booking.checkOut.split('T')[0]
        }));
        
        const allEvents = [...manualEvents, ...bookingEvents, ...externalEvents];
        setBookings(allEvents);
        
        console.log(`✅ ${allBlockedDates.length} date bloccate caricate (${manualBlockedDates.length} manuali + ${bookingBlockedDates.length} dirette + ${externalBlockedDates.length} esterne)`);
      } else {
        // Se success è false, usa modalità aperta senza errore
        console.log('⚠️ API non disponibile, modalità calendario aperto');
        setBlockedDates([]);
        setBookings([]);
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
        
        const blockedResponse = await fetch('/api/unified?action=blocked-dates');
        if (blockedResponse.ok) {
          const blockedData = await blockedResponse.json();
          if (blockedData.success) {
            const dates = blockedData.blockedDates.map((item: any) => 
              new Date(item.start_date).toISOString().split('T')[0]
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
    const isCheckOut = checkOutDate === date.toISOString().split('T')[0];
    const isAvailable = isDateAvailable(date);
    const isBlocked = isDateBlocked(date);
    const isBooked = isDateBooked(date);

    // Range hover effect: se c'è check-in selezionato ma non check-out, evidenzia range al mouse
    let isInHoverRange = false;
    if (selectedDate && !checkOutDate && hoveredDate && isAvailable) {
      const checkIn = new Date(selectedDate);
      const hovered = hoveredDate;
      if (date > checkIn && date <= hovered) {
        isInHoverRange = true;
      }
    }

    // Range selezionato: tra check-in e check-out
    let isInSelectedRange = false;
    if (selectedDate && checkOutDate) {
      const checkIn = new Date(selectedDate);
      const checkOut = new Date(checkOutDate);
      if (date > checkIn && date < checkOut) {
        isInSelectedRange = true;
      }
    }

    let className = 'calendar-day';
    
    if (!isCurrentMonth) className += ' other-month';
    if (isToday) className += ' today';
    if (isSelected) className += ' selected check-in';
    if (isCheckOut) className += ' selected check-out';
    if (isInSelectedRange) className += ' in-range';
    if (isInHoverRange) className += ' in-hover-range';
    if (isAvailable) className += ' available';
    if (isBlocked) className += ' blocked';
    if (isBooked) className += ' booked';
    if (date < minDateObj) className += ' past';
    
    return className;
  };

  const weekDays = [
    t('calendar.weekdays.sun', 'Dom'),
    t('calendar.weekdays.mon', 'Lun'),
    t('calendar.weekdays.tue', 'Mar'),
    t('calendar.weekdays.wed', 'Mer'),
    t('calendar.weekdays.thu', 'Gio'),
    t('calendar.weekdays.fri', 'Ven'),
    t('calendar.weekdays.sat', 'Sab'),
  ];

  // Genera array di mesi da visualizzare
  const getMonthsToShow = () => {
    const months = [];
    for (let i = 0; i < monthsShown; i++) {
      const month = new Date(currentMonth);
      month.setMonth(month.getMonth() + i);
      months.push(month);
    }
    return months;
  };

  // Genera i giorni per un mese specifico
  const generateCalendarDaysForMonth = (monthDate: Date) => {
    const year = monthDate.getFullYear();
    const month = monthDate.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const days = [];
    const endDate = new Date(lastDay);
    endDate.setDate(endDate.getDate() + (6 - lastDay.getDay()));
    
    for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
      days.push(new Date(date));
    }
    
    return days;
  };

  return (
    <div className={`availability-calendar ${className} ${monthsShown > 1 ? 'multi-month' : ''}`}>
      {/* Container per più mesi */}
      <div className="calendars-container">
        {getMonthsToShow().map((monthDate, monthIndex) => {
          const monthYear = monthDate.toLocaleDateString(i18n.language, {
            month: 'long',
            year: 'numeric'
          });

          return (
            <div key={monthIndex} className="single-calendar">
              {/* Header del calendario */}
              <div className="calendar-header">
                {monthIndex === 0 && (
                  <button 
                    className="nav-button"
                    onClick={() => navigateMonth('prev')}
                    disabled={loading}
                  >
                    ←
                  </button>
                )}
                
                {monthIndex === 0 && monthsShown === 1 && (
                  <>
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
                  </>
                )}
                
                {(monthsShown > 1 || monthIndex > 0) && (
                  <h3 className="month-year centered">
                    {monthYear.charAt(0).toUpperCase() + monthYear.slice(1)}
                  </h3>
                )}
                
                {monthIndex === monthsShown - 1 && monthsShown > 1 && (
                  <button 
                    className="nav-button"
                    onClick={() => navigateMonth('next')}
                    disabled={loading}
                  >
                    →
                  </button>
                )}
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
                  monthIndex === 0 && (
                    <div className="loading-overlay">
                      <div className="loading-spinner">🔄</div>
                      <span>{t('calendar.loading', 'Caricamento...')}</span>
                    </div>
                  )
                ) : (
                  generateCalendarDaysForMonth(monthDate).map((date, index) => (
                    <button
                      key={index}
                      className={getDateClassName(date)}
                      onClick={() => handleDateClick(date)}
                      onMouseEnter={() => setHoveredDate(date)}
                      onMouseLeave={() => setHoveredDate(null)}
                      disabled={!isDateAvailable(date)}
                      title={
                        isDateBlocked(date) ? t('calendar.tooltip.notAvailable', 'Data non disponibile') :
                        isDateBooked(date) ? t('calendar.tooltip.booked', 'Data già prenotata') :
                        isDateAvailable(date) ? t('calendar.tooltip.available', 'Data disponibile') : 
                        t('calendar.tooltip.notSelectable', 'Data non selezionabile')
                      }
                    >
                      {date.getDate()}
                    </button>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Legenda */}
      <div className="calendar-legend">
        <div className="legend-item">
          <span className="legend-dot available"></span>
          {t('calendar.legend.available', 'Disponibile')}
        </div>
        <div className="legend-item">
          <span className="legend-dot booked"></span>
          {t('calendar.legend.booked', 'Prenotato')}
        </div>
        <div className="legend-item">
          <span className="legend-dot blocked"></span>
          {t('calendar.legend.notAvailable', 'Non disponibile')}
        </div>
      </div>

      {error && (
        <div className="error-message">
          ⚠️ {error}
          <button onClick={loadCalendarData} className="retry-button">
            {t('calendar.retry', 'Riprova')}
          </button>
        </div>
      )}
    </div>
  );
};

export default AvailabilityCalendar;