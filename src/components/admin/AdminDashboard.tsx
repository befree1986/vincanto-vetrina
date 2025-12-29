import React from 'react';

interface AdminDashboardProps {
  dashboardStats: any;
  realBookings: any[];
  paymentTransactions: any[];
  notifications: any[];
  systemSettings: any[];
  analytics: any[];
  calendarEvents: any[];
  blockedDates?: any[];
  isLoadingData: boolean;
  isLoadingCalendar: boolean;
  loadCalendarData: () => void;
  setActiveTab: (tab: string) => void;
}

/**
 * Componente Dashboard Admin - Statistiche e panoramica generale
 */
const AdminDashboard: React.FC<AdminDashboardProps> = ({
  dashboardStats,
  realBookings,
  paymentTransactions,
  notifications,
  systemSettings,
  analytics,
  calendarEvents,
  blockedDates = [],
  isLoadingData,
  isLoadingCalendar,
  loadCalendarData,
  setActiveTab,
}) => {
  // Calcolo date occupate dai calendarEvents
  const { busyDates, closedDates, closedReasonsByDate } = React.useMemo(() => {
    const busy = new Set<string>();
    const closed = new Set<string>();
    const reasons = new Map<string, string[]>();
    // Eventi di prenotazione
    for (const ev of calendarEvents || []) {
      const startStr = ev.start || ev.check_in || ev.start_date;
      const endStr = ev.end || ev.check_out || ev.end_date || startStr;
      if (!startStr) continue;
      const start = new Date(startStr);
      const end = endStr ? new Date(endStr) : new Date(startStr);
      if (isNaN(start.getTime())) continue;
      const cur = new Date(start);
      const last = isNaN(end.getTime()) ? new Date(start) : new Date(end);
      cur.setHours(0,0,0,0);
      last.setHours(0,0,0,0);
      while (cur <= last) {
        busy.add(cur.toISOString().slice(0,10));
        cur.setDate(cur.getDate() + 1);
      }
    }
    // Date di chiusura
    for (const bd of blockedDates || []) {
      const startStr = bd.start_date || bd.start || bd.begin;
      const endStr = bd.end_date || bd.end || bd.finish || startStr;
      if (!startStr) continue;
      const start = new Date(startStr);
      const end = endStr ? new Date(endStr) : new Date(startStr);
      if (isNaN(start.getTime())) continue;
      const cur = new Date(start);
      const last = isNaN(end.getTime()) ? new Date(start) : new Date(end);
      cur.setHours(0,0,0,0);
      last.setHours(0,0,0,0);
      while (cur <= last) {
        const iso = cur.toISOString().slice(0,10);
        closed.add(iso);
        busy.add(iso);
        const label = [bd.reason, bd.description].filter(Boolean).join(' - ');
        if (label) {
          const arr = reasons.get(iso) || [];
          arr.push(label);
          reasons.set(iso, arr);
        }
        cur.setDate(cur.getDate() + 1);
      }
    }
    return { busyDates: busy, closedDates: closed, closedReasonsByDate: reasons };
  }, [calendarEvents, blockedDates]);

  // Restituisce una classe CSS in base al motivo della chiusura
  const getReasonBadgeClass = (reason?: string) => {
    if (!reason) return 'reason-generic';
    const r = String(reason).toLowerCase();
    if (r.includes('manut')) return 'reason-maintenance';
    if (r.includes('fest') || r.includes('holiday')) return 'reason-holiday';
    if (r.includes('priv') || r.includes('owner')) return 'reason-private';
    if (r.includes('lavor') || r.includes('work')) return 'reason-work';
    return 'reason-generic';
  };

  // Render semplice calendario per un mese
  const renderMonthCalendar = (monthDate: Date) => {
    const month = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
    const monthName = month.toLocaleString('it-IT', { month: 'long', year: 'numeric' });
    const firstWeekday = (month.getDay() + 6) % 7; // lun=0
    const daysInMonth = new Date(month.getFullYear(), month.getMonth()+1, 0).getDate();
    const cells: Array<{ day?: number; busy?: boolean; closed?: boolean; title?: string }> = [];
    for (let i=0;i<firstWeekday;i++) cells.push({});
    for (let d=1; d<=daysInMonth; d++) {
      const iso = new Date(month.getFullYear(), month.getMonth(), d).toISOString().slice(0,10);
      const isClosed = closedDates.has(iso);
      const title = isClosed ? (closedReasonsByDate.get(iso) || []).join('\n') : undefined;
      cells.push({ day: d, busy: busyDates.has(iso), closed: isClosed, title });
    }
    return (
      <div className="admin-calendar-month">
        <h4 className="admin-calendar-title">{monthName}</h4>
        <div className="admin-calendar-grid">
          {['Lu','Ma','Me','Gi','Ve','Sa','Do'].map((w) => (
            <div key={w} className="admin-calendar-cell admin-calendar-head">{w}</div>
          ))}
          {cells.map((c, idx) => (
            <div key={idx} className={`admin-calendar-cell ${c.day===undefined ? 'empty' : ''} ${c.busy ? 'busy' : ''} ${c.closed ? 'closed' : ''}`} title={c.title || undefined}>
              {c.day ?? ''}
            </div>
          ))}
        </div>
        <div className="admin-calendar-legend">
          <span className="legend-item busy">Occupato</span>
          <span className="legend-item closed">Chiuso</span>
        </div>
      </div>
    );
  };
  return (
    <div className="admin-dashboard">
      <h2>📊 Dashboard Backend Reale {isLoadingData && '(Caricamento...)'}</h2>
      
      {/* Statistiche Principali */}
      <div className="admin-section">
        <h3>📈 Statistiche Live (Database)</h3>
        <div className="admin-stats-grid">
          <div className="admin-stat-card">
            <h3>Prenotazioni Totali</h3>
            <div className="stat-value">{dashboardStats.totalBookings || realBookings.length}</div>
            <small>Database PostgreSQL</small>
          </div>
          
          <div className="admin-stat-card">
            <h3>Ricavi Totali</h3>
            <div className="stat-value">€{(dashboardStats.totalRevenue || 0).toFixed(2)}</div>
            <small>Calcolo backend</small>
          </div>
          
          <div className="admin-stat-card">
            <h3>Occupazione Media</h3>
            <div className="stat-value">{dashboardStats.occupancyRate || 0}%</div>
            <small>Calcolo dinamico</small>
          </div>
          
          <div className="admin-stat-card">
            <h3>Pagamenti Pending</h3>
            <div className="stat-value">{dashboardStats.pendingPayments || paymentTransactions.filter(t => t.status === 'pending').length}</div>
            <small>In attesa</small>
          </div>
        </div>
      </div>

      {/* Statistiche Aggiuntive */}
      <div className="admin-section">
        <h3>🔧 Metriche Sistema</h3>
        <div className="admin-stats-grid">
          <div className="admin-stat-card">
            <h3>Notifiche Attive</h3>
            <div className="stat-value">{notifications.length}</div>
            <small>Sistema notifiche</small>
          </div>
          
          <div className="admin-stat-card">
            <h3>Configurazioni</h3>
            <div className="stat-value">{systemSettings.length}</div>
            <small>Settings attive</small>
          </div>
          
          <div className="admin-stat-card">
            <h3>Analytics Records</h3>
            <div className="stat-value">{analytics.length}</div>
            <small>Dati raccolti</small>
          </div>
          
          <div className="admin-stat-card">
            <h3>Transazioni</h3>
            <div className="stat-value">{paymentTransactions.length}</div>
            <small>Pagamenti totali</small>
          </div>
        </div>
      </div>

        {/* Calendario Occupazioni (2 mesi) */}
        <div className="admin-section">
          <h3>📅 Calendario Occupazioni (2 mesi)</h3>
          <div className="admin-calendar-two-months">
            {renderMonthCalendar(new Date())}
            {renderMonthCalendar(new Date(new Date().getFullYear(), new Date().getMonth()+1, 1))}
          </div>
        </div>

      {/* Prossime Prenotazioni */}
      <div className="admin-pricing-section">
        <h3>📅 Prossime Prenotazioni</h3>
        {/* Prossime Prenotazioni + Chiusure */}
        <div className="admin-pricing-card">
          <div className="existing-services">
            {calendarEvents.slice(0, 5).map((event, index) => (
              <div key={event.id || index} className="service-row">
                <span>{event.title}</span>
                <span>{new Date(event.start || event.check_in || event.start_date).toLocaleDateString('it-IT')}</span>
                <span className={`platform-badge ${event.source}`}>
                  {event.source === 'booking' && '🏨 Booking.com'}
                  {event.source === 'expedia' && '✈️ Expedia'}
                  {event.source === 'direct' && '📞 Diretto'}
                  {event.source === 'other' && '📅 Altro'}
                </span>
                <span>€{event.totalPrice}</span>
              </div>
            ))}

            {blockedDates.slice(0,5).map((bd, idx) => (
              <div key={`bd-${idx}`} className="service-row">
                <span>Chiusura</span>
                <span>{new Date(bd.start_date || bd.start).toLocaleDateString('it-IT')} → {new Date(bd.end_date || bd.end || bd.start).toLocaleDateString('it-IT')}</span>
                <span className="platform-badge closed">{bd.reason ? bd.reason : '🔧 Manutenzione'}</span>
                {bd.reason && <span className={`reason-badge ${getReasonBadgeClass(bd.reason)}`}>{bd.reason}</span>}
                {bd.description && (<span className="closed-description">{bd.description}</span>)}
                <span>€</span>
              </div>
            ))}

            {calendarEvents.length === 0 && blockedDates.length === 0 && !isLoadingCalendar && (
              <div className="service-row">
                <span className="no-data-message">Nessuna prenotazione trovata nel calendario Google</span>
              </div>
            )}
          </div>
          
          <div className="admin-pricing-actions dashboard-actions">
            <button className="admin-btn-secondary" onClick={() => loadCalendarData()}>
              🔄 Ricarica Calendario
            </button>
            <button className="admin-btn-secondary" onClick={() => setActiveTab('calendari')}>
              📅 Gestisci Calendari
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;