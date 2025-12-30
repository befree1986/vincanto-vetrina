import React from 'react';
import AdminApiService from '../../services/adminApiService';

// Component per azioni su selezione calendario (crea prenotazione o blocco)
const CalendarActions: React.FC<{
  selectedStart: string;
  selectedEnd: string | null;
  onDone: () => void;
}> = ({ selectedStart, selectedEnd, onDone }) => {
  const api = React.useMemo(() => new AdminApiService(), []);
  const [mode, setMode] = React.useState<'booking'|'block'>('booking');
  const [form, setForm] = React.useState<any>({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    guests: 2,
    totalPrice: 0,
    reason: 'manutenzione',
    description: ''
  });

  const handleSubmit = async () => {
    const start = selectedStart;
    const end = selectedEnd || selectedStart;
    if (mode === 'booking') {
      await api.createBooking({
        check_in: start,
        check_out: end,
        customer_name: form.customerName,
        customer_email: form.customerEmail,
        customer_phone: form.customerPhone,
        guests: form.guests,
        total_amount: form.totalPrice,
        notes: form.description,
      });
    } else {
      await api.addBlockedDate({ start_date: start, end_date: end, reason: form.reason, description: form.description });
    }
    onDone();
  };

  return (
    <div className="calendar-action-panel">
      <div className="action-mode">
        <label>
          <input type="radio" name="mode" checked={mode==='booking'} onChange={() => setMode('booking')} /> Prenotazione
        </label>
        <label>
          <input type="radio" name="mode" checked={mode==='block'} onChange={() => setMode('block')} /> Chiusura
        </label>
      </div>
      {mode==='booking' ? (
        <div className="action-form">
          <input placeholder="Nome" value={form.customerName} onChange={e=>setForm({...form, customerName:e.target.value})} />
          <input placeholder="Email" value={form.customerEmail} onChange={e=>setForm({...form, customerEmail:e.target.value})} />
          <input placeholder="Telefono" value={form.customerPhone} onChange={e=>setForm({...form, customerPhone:e.target.value})} />
          <input type="number" placeholder="Ospiti" value={form.guests} onChange={e=>setForm({...form, guests:parseInt(e.target.value)})} />
          <input type="number" placeholder="Totale €" value={form.totalPrice} onChange={e=>setForm({...form, totalPrice:parseFloat(e.target.value)})} />
          <input placeholder="Note" value={form.description} onChange={e=>setForm({...form, description:e.target.value})} />
        </div>
      ) : (
        <div className="action-form">
          <input placeholder="Motivo (es. manutenzione)" value={form.reason} onChange={e=>setForm({...form, reason:e.target.value})} />
          <input placeholder="Descrizione" value={form.description} onChange={e=>setForm({...form, description:e.target.value})} />
        </div>
      )}
      <div className="action-buttons">
        <button className="admin-btn-primary admin-btn-small" onClick={handleSubmit}>Salva</button>
        <button className="admin-btn-secondary admin-btn-small" onClick={onDone}>Annulla</button>
      </div>
    </div>
  );
};

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
  const [viewStart, setViewStart] = React.useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [monthsToShow, setMonthsToShow] = React.useState<number>(2);
  const [selectedStart, setSelectedStart] = React.useState<string | null>(null);
  const [selectedEnd, setSelectedEnd] = React.useState<string | null>(null);
  // Calcolo date occupate dai calendarEvents
  const {
    busyDates,
    closedDates,
    closedReasonsByDate,
    checkInDates,
    checkOutDates,
    singleDayBookings,
    closedStartDates,
    closedEndDates,
    closedSingleDates,
  } = React.useMemo(() => {
    const busy = new Set<string>();
    const closed = new Set<string>();
    const reasons = new Map<string, string[]>();
    const checkIn = new Set<string>();
    const checkOut = new Set<string>();
    const singleBookings = new Set<string>();
    const closedStart = new Set<string>();
    const closedEnd = new Set<string>();
    const closedSingle = new Set<string>();
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
      const startIso = cur.toISOString().slice(0,10);
      const endIso = last.toISOString().slice(0,10);
      if (startIso === endIso) {
        singleBookings.add(startIso);
        busy.add(startIso);
      } else {
        checkIn.add(startIso);
        checkOut.add(endIso);
        while (cur <= last) {
          busy.add(cur.toISOString().slice(0,10));
          cur.setDate(cur.getDate() + 1);
        }
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
      const startIso = cur.toISOString().slice(0,10);
      const endIso = last.toISOString().slice(0,10);
      const label = [bd.reason, bd.description].filter(Boolean).join(' - ');
      if (startIso === endIso) {
        closedSingle.add(startIso);
        closed.add(startIso);
        busy.add(startIso);
        if (label) reasons.set(startIso, [label]);
      } else {
        closedStart.add(startIso);
        closedEnd.add(endIso);
        while (cur <= last) {
          const iso = cur.toISOString().slice(0,10);
          closed.add(iso);
          busy.add(iso);
          if (label) {
            const arr = reasons.get(iso) || [];
            arr.push(label);
            reasons.set(iso, arr);
          }
          cur.setDate(cur.getDate() + 1);
        }
      }
    }
    return {
      busyDates: busy,
      closedDates: closed,
      closedReasonsByDate: reasons,
      checkInDates: checkIn,
      checkOutDates: checkOut,
      singleDayBookings: singleBookings,
      closedStartDates: closedStart,
      closedEndDates: closedEnd,
      closedSingleDates: closedSingle,
    };
  }, [calendarEvents, blockedDates]);

  // Handler per modificare prenotazione (TODO: implementare UI modifica)
  const handleEditBooking = (event: any, index: number) => {
    // Future: aprire modal o form di modifica
    console.log('Edit booking:', event.id || index, event);
  };

  // Handler per annullare prenotazione
  const handleDeleteBooking = async (event: any, index: number) => {
    const id = event.id || String(index);
    if (confirm(`Annullare la prenotazione di ${event.customer_name || 'Cliente'}?`)) {
      try {
        const api = new AdminApiService();
        const result = await api.deleteBooking(id);
        if (result.success) {
          alert('Prenotazione annullata');
          // Ricarica dati
          if (loadCalendarData) await loadCalendarData();
        } else {
          alert('Errore: ' + (result.message || 'Impossibile annullare'));
        }
      } catch (error) {
        console.error('Errore annullamento:', error);
        alert('Errore annullamento prenotazione');
      }
    }
  };

  // Handler per modificare chiusura (TODO: implementare UI modifica)
  const handleEditClosure = (bd: any, idx: number) => {
    // Future: aprire modal o form di modifica chiusura
    console.log('Edit closure:', bd.id || idx, bd);
  };

  // Handler per rimuovere chiusura
  const handleRemoveClosure = async (bd: any, idx: number) => {
    const id = bd.id || String(idx);
    const reason = bd.reason || 'Chiusura';
    if (confirm(`Rimuovere ${reason} (${new Date(bd.start_date || bd.start).toLocaleDateString('it-IT')})?`)) {
      try {
        const api = new AdminApiService();
        const result = await api.removeBlockedDate(id);
        if (result.success) {
          alert('Chiusura rimossa');
          // Ricarica dati
          if (loadCalendarData) await loadCalendarData();
        } else {
          alert('Errore: ' + (result.message || 'Impossibile rimuovere'));
        }
      } catch (error) {
        console.error('Errore rimozione:', error);
        alert('Errore rimozione chiusura');
      }
    }
  };

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
    const cells: Array<{ day?: number; busy?: boolean; closed?: boolean; title?: string; checkIn?: boolean; checkOut?: boolean; singleBooking?: boolean; closedStart?: boolean; closedEnd?: boolean; closedSingle?: boolean; selected?: boolean }> = [];
    for (let i=0;i<firstWeekday;i++) cells.push({});
    for (let d=1; d<=daysInMonth; d++) {
      const iso = new Date(month.getFullYear(), month.getMonth(), d).toISOString().slice(0,10);
      const isClosed = closedDates.has(iso);
      const title = isClosed ? (closedReasonsByDate.get(iso) || []).join('\n') : undefined;
      const inSelection = selectedStart && selectedEnd ? (iso >= selectedStart && iso <= selectedEnd) : (selectedStart === iso);
      cells.push({
        day: d,
        busy: busyDates.has(iso),
        closed: isClosed,
        title,
        checkIn: checkInDates.has(iso),
        checkOut: checkOutDates.has(iso),
        singleBooking: singleDayBookings.has(iso),
        closedStart: closedStartDates.has(iso),
        closedEnd: closedEndDates.has(iso),
        closedSingle: closedSingleDates.has(iso),
        selected: !!inSelection,
      });
    }
    return (
      <div className="admin-calendar-month">
        <h4 className="admin-calendar-title">{monthName}</h4>
        <div className="admin-calendar-grid">
          {['Lu','Ma','Me','Gi','Ve','Sa','Do'].map((w) => (
            <div key={w} className="admin-calendar-cell admin-calendar-head">{w}</div>
          ))}
          {cells.map((c, idx) => (
            <div
              key={idx}
              className={`admin-calendar-cell ${c.day===undefined ? 'empty' : ''} ${c.busy ? 'busy' : ''} ${c.closed ? 'closed' : ''} ${c.checkIn ? 'check-in' : ''} ${c.checkOut ? 'check-out' : ''} ${c.singleBooking ? 'single-booking' : ''} ${c.closedStart ? 'closed-start' : ''} ${c.closedEnd ? 'closed-end' : ''} ${c.closedSingle ? 'closed-single' : ''} ${c.selected ? 'selected' : ''}`}
              title={c.title || undefined}
              onClick={() => {
                if (c.day === undefined) return;
                const iso = new Date(month.getFullYear(), month.getMonth(), c.day).toISOString().slice(0,10);
                if (!selectedStart || (selectedStart && selectedEnd)) {
                  setSelectedStart(iso);
                  setSelectedEnd(null);
                } else {
                  if (iso < selectedStart) {
                    setSelectedEnd(selectedStart);
                    setSelectedStart(iso);
                  } else {
                    setSelectedEnd(iso);
                  }
                }
              }}
            >
              <span className="day-number">{c.day ?? ''}</span>
              {(c.checkIn || c.singleBooking) && <span className="cell-indicator in">IN</span>}
              {(c.checkOut || c.singleBooking) && <span className="cell-indicator out">OUT</span>}
              {c.closedStart && <span className="cell-indicator closed">START</span>}
              {c.closedEnd && <span className="cell-indicator closed end">END</span>}
              {c.closedSingle && <span className="cell-indicator closed single">CLOSED</span>}
            </div>
          ))}
        </div>
        <div className="admin-calendar-legend">
          <span className="legend-item busy">Occupato</span>
          <span className="legend-item closed">Chiuso</span>
          <span className="legend-item in">Check-in</span>
          <span className="legend-item out">Check-out</span>
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

        {/* Calendario Occupazioni con controlli */}
        <div className="admin-section">
          <div className="calendar-header">
            <h3>📅 Calendario Occupazioni</h3>
            <div className="calendar-controls">
              <button className="admin-btn-small admin-btn-secondary" onClick={() => setViewStart(new Date(viewStart.getFullYear(), viewStart.getMonth()-1, 1))}>◀︎ Prec</button>
              <button className="admin-btn-small admin-btn-secondary" onClick={() => setViewStart(new Date(viewStart.getFullYear(), viewStart.getMonth()+1, 1))}>Succ ▶︎</button>
              <select className="admin-select" value={monthsToShow} onChange={(e) => setMonthsToShow(parseInt(e.target.value))} aria-label="Numero di mesi da visualizzare">
                <option value={1}>1 mese</option>
                <option value={2}>2 mesi</option>
                <option value={3}>3 mesi</option>
                <option value={6}>6 mesi</option>
              </select>
              <button className="admin-btn-small admin-btn-warning" onClick={() => { setSelectedStart(null); setSelectedEnd(null); }}>Pulisci selezione</button>
            </div>
          </div>
          <div className="admin-calendar-two-months">
            {Array.from({ length: monthsToShow }).map((_, i) => (
              renderMonthCalendar(new Date(viewStart.getFullYear(), viewStart.getMonth()+i, 1))
            ))}
          </div>

          {(selectedStart) && (
            <div className="calendar-actions">
              <span>Intervallo selezionato: {selectedStart} {selectedEnd ? `→ ${selectedEnd}` : ''}</span>
              <CalendarActions selectedStart={selectedStart} selectedEnd={selectedEnd} onDone={() => { setSelectedStart(null); setSelectedEnd(null); loadCalendarData(); }} />
            </div>
          )}
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
                <div className="row-actions">
                  <button className="admin-btn-small admin-btn-secondary" onClick={() => handleEditBooking(event, index)}>Modifica</button>
                  <button className="admin-btn-small admin-btn-danger" onClick={() => handleDeleteBooking(event, index)}>Annulla</button>
                </div>
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
                <div className="row-actions">
                  <button className="admin-btn-small admin-btn-secondary" onClick={() => handleEditClosure(bd, idx)}>Modifica</button>
                  <button className="admin-btn-small admin-btn-danger" onClick={() => handleRemoveClosure(bd, idx)}>Rimuovi</button>
                </div>
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