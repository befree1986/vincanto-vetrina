import React, { useState, useEffect, useMemo, useCallback } from 'react';
import AdminApiService, { Booking } from '../../services/adminApiService';
import BookingDetailModal from './BookingDetailModal'; // Import the modal
import './BookingCalendarView.css';

// Combined event type for the calendar
interface CalendarEvent {
    id: string | number;
    start: Date;
    end: Date;
    title: string;
    type: 'booking' | 'external' | 'blocked';
    platform?: string;
    email?: string;
    phone?: string;
    status?: string;
    raw: any; // Keep original object
}

const BookingCalendarView: React.FC = () => {
    const [events, setEvents] = useState<CalendarEvent[]>([]);
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
    const apiService = useMemo(() => new AdminApiService(), []);

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const data = await apiService.getCalendarViewData();
            const allEvents: CalendarEvent[] = [];

            // Process direct bookings
            data.bookings.forEach((b: Booking) => {
                allEvents.push({
                    id: b.id,
                    start: new Date(b.check_in),
                    end: new Date(b.check_out),
                    title: b.customer_name,
                    type: 'booking',
                    platform: b.platform || 'Vincanto',
                    email: b.customer_email,
                    phone: b.phone,
                    status: b.status,
                    raw: b,
                });
            });

            // Process external events
            data.externalEvents.forEach((e: any) => {
                allEvents.push({
                    id: e.id || e.uid,
                    start: new Date(e.start_date),
                    end: new Date(e.end_date),
                    title: e.summary,
                    type: 'external',
                    platform: e.platform || 'Esterno',
                    status: 'confirmed',
                    raw: e,
                });
            });

            // Process blocked dates
            data.blockedDates.forEach((b: any) => {
                allEvents.push({
                    id: b.id,
                    start: new Date(b.start_date),
                    end: new Date(b.end_date),
                    title: b.reason || 'Chiuso',
                    type: 'blocked',
                    platform: 'Admin',
                    status: 'closed',
                    raw: b,
                });
            });
            setEvents(allEvents);
        } catch (err) {
            setError('Impossibile caricare i dati del calendario.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [apiService]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleEventClick = (event: CalendarEvent) => {
        setSelectedEvent(event);
    };

    const handleCloseModal = () => {
        setSelectedEvent(null);
    };

    const handleModalUpdate = () => {
        fetchData();
        handleCloseModal();
    };

    const { monthGrid, monthName } = useMemo(() => {
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth();
        const name = new Date(year, month).toLocaleString('it-IT', { month: 'long', year: 'numeric' });

        const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0=Sun, 1=Mon
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        const dayOffset = (firstDayOfMonth === 0) ? 6 : firstDayOfMonth - 1;

        const grid: { date: Date; events: CalendarEvent[] }[][] = [];
        let week: { date: Date; events: CalendarEvent[] }[] = [];

        for (let i = 0; i < dayOffset; i++) {
            week.push(null as any);
        }

        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, month, day);
            const dayEvents = events.filter(e => {
                const start = new Date(e.start);
                start.setHours(0, 0, 0, 0);
                const end = new Date(e.end);
                end.setHours(0, 0, 0, 0);
                return date >= start && date < end;
            });
            week.push({ date, events: dayEvents });

            if (week.length === 7) {
                grid.push(week);
                week = [];
            }
        }

        if (week.length > 0) {
            while (week.length < 7) week.push(null as any);
            grid.push(week);
        }

        return { monthGrid: grid, monthName: name };
    }, [currentMonth, events]);

    const eventsInMonth = useMemo(() => {
        const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
        const endOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
        return events
            .filter(e => new Date(e.start) <= endOfMonth && new Date(e.end) >= startOfMonth)
            .sort((a, b) => a.start.getTime() - b.start.getTime());
    }, [currentMonth, events]);

    const getPlatformClass = (platform: string = 'default') => {
        const p = platform.toLowerCase();
        if (p.includes('airbnb')) return 'platform-airbnb';
        if (p.includes('booking')) return 'platform-booking';
        if (p.includes('vincanto') || p.includes('direct')) return 'platform-direct';
        if (p.includes('admin')) return 'platform-admin';
        return 'platform-external';
    };

    if (loading) return <div className="admin-section">Caricamento calendario...</div>;
    if (error) return <div className="admin-section admin-error">{error}</div>;

    return (
        <div className="admin-section">
            <div className="calendar-controls-header">
                <h2>📅 Calendario Prenotazioni</h2>
                <div className="calendar-navigation">
                    <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))}>&lt; Mese Prec.</button>
                    <h3>{monthName}</h3>
                    <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))}>Mese Succ. &gt;</button>
                </div>
            </div>

            <div className="calendar-view">
                <div className="calendar-weekdays">
                    {['Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato', 'Domenica'].map(day => (
                        <div key={day}>{day}</div>
                    ))}
                </div>
                <div className="calendar-grid-body">
                    {monthGrid.flat().map((day, index) => {
                        if (!day) return <div key={`blank-${index}`} className="calendar-day-cell empty"></div>;

                        const isToday = new Date().toDateString() === day.date.toDateString();
                        const isOccupied = day.events.length > 0;
                        const eventType = isOccupied ? day.events[0].type : 'free';

                        return (
                            <div key={day.date.toISOString()} className={`calendar-day-cell ${isOccupied ? 'occupied' : 'free'} type-${eventType} ${isToday ? 'today' : ''}`}>
                                <span className="day-number">{day.date.getDate()}</span>
                                {day.events.map(event => (
                                    <div
                                        key={event.id}
                                        className={`calendar-event-chip ${getPlatformClass(event.platform)}`}
                                        title={`${event.platform}: ${event.title}`}
                                        onClick={() => handleEventClick(event)}
                                    >
                                        {event.title}
                                        {(event.raw.internal_notes || (event.type === 'external' && event.raw.description)) && <span className="notes-indicator-calendar">📝</span>}
                                    </div>
                                ))}
                            </div>
                        );
                    })}
                </div>
            </div>
            <div className="calendar-legend">
                <span className="legend-item"><span className="legend-color platform-direct"></span>Sito Web</span>
                <span className="legend-item"><span className="legend-color platform-booking"></span>Booking.com</span>
                <span className="legend-item"><span className="legend-color platform-airbnb"></span>Airbnb</span>
                <span className="legend-item"><span className="legend-color platform-external"></span>Altro Esterno</span>
                <span className="legend-item"><span className="legend-color platform-admin"></span>Chiuso (Admin)</span>
            </div>

            <div className="calendar-summary">
                <h3>Riepilogo Eventi per {monthName}</h3>
                <div className="table-responsive">
                    <table className="bookings-table">
                        <thead>
                            <tr>
                                <th>Piattaforma</th>
                                <th>Ospite / Motivo</th>
                                <th>Contatti</th>
                                <th>Periodo</th>
                                <th>Stato</th>
                            </tr>
                        </thead>
                        <tbody>
                            {eventsInMonth.length > 0 ? (
                                eventsInMonth.map(event => (
                                    <tr key={event.id} onClick={() => handleEventClick(event)} style={{ cursor: 'pointer' }}>
                                        <td><span className={`platform-badge ${getPlatformClass(event.platform)}`}>{event.platform}</span></td>
                                        <td>{event.title}</td>
                                        <td>
                                            {event.email && <div>📧 {event.email}</div>}
                                            {event.phone && <div>📞 {event.phone}</div>}
                                        </td>
                                        <td>{event.start.toLocaleDateString('it-IT')} - {event.end.toLocaleDateString('it-IT')}</td>
                                        <td><span className={`status-badge-table status-${event.status}`}>{event.status}</span></td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={5} className="text-center">Nessun evento per questo mese.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {selectedEvent && (
                <BookingDetailModal
                    booking={{
                        id: selectedEvent.id,
                        booking_id: selectedEvent.raw.uid || String(selectedEvent.id),
                        customer_name: selectedEvent.title,
                        check_in: selectedEvent.start.toISOString(),
                        check_out: selectedEvent.end.toISOString(),
                        status: selectedEvent.status || 'confirmed',
                        payment_status: selectedEvent.type === 'booking' ? selectedEvent.raw.payment_status : 'external',
                        total_amount: selectedEvent.raw.total_amount || 0,
                        customer_email: selectedEvent.email,
                        phone: selectedEvent.phone,
                        internal_notes: selectedEvent.raw.internal_notes || (selectedEvent.type === 'external' ? selectedEvent.raw.description : ''),
                        platform: selectedEvent.platform,
                    } as Booking}
                    onClose={handleCloseModal}
                    onUpdate={handleModalUpdate}
                />
            )}
        </div>
    );
};

export default BookingCalendarView;