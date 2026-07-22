import React from 'react';
import './BookingCalendarView.css';

const BookingCalendarView: React.FC = () => {
    return (
        <div className="admin-section">
            <h2>📅 Calendario Prenotazioni</h2>
            <div className="admin-notice">
                <p>Questa sezione mostrerà una vista calendario di tutte le prenotazioni confermate e degli eventi, permettendo una gestione visuale della disponibilità.</p>
                <p><strong>Funzionalità in sviluppo.</strong></p>
            </div>
            <div className="calendar-placeholder">
                <div className="calendar-header">Mese Corrente</div>
                <div className="calendar-grid">
                    {/* Placeholder for days */}
                    {Array.from({ length: 35 }).map((_, index) => (
                        <div key={index} className="calendar-day">
                            {index + 1 <= 31 ? index + 1 : ''}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default BookingCalendarView;