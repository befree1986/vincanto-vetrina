/* eslint-disable */
// @ts-nocheck
import React, { useState, useEffect } from 'react';
import '../pages/AdminPanelPro.css';
import '../styles/AdminSuperAdmin.css';
import './AdminPanelBasic.css';
import ExtraServicesAdmin from './admin/ExtraServicesAdmin';
import AdminDashboard from './admin/AdminDashboard';
import { useAdminRole } from '../hooks/useAdminRole';
import { devLog, devError } from '../utils/debug';
import { log } from '../utils/logger';
import AdminApiService from '../services/adminApiService';

/**
 * Pannello Amministratore Completo (Basic)
 * Accessibile agli admin ordinari
 * Include: Dashboard, Prenotazioni, Calendari, Servizi Extra
 */
const AdminPanelBasic = (): JSX.Element => {
  devLog('🚀 AdminPanelBasic component rendering...');
  
  const { role, isLoading: roleLoading, isAdmin } = useAdminRole();
  
  // Tab navigation
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Data states
  const [dashboardStats, setDashboardStats] = useState<any>({});
  const [realBookings, setRealBookings] = useState<any[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<any[]>([]);
  const [blockedDates, setBlockedDates] = useState<any[]>([]);
  const [systemSettings, setSystemSettings] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [paymentTransactions, setPaymentTransactions] = useState<any[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [isLoadingCalendar, setIsLoadingCalendar] = useState(false);
  
  // Stati per Calendario Visuale
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Stati per Form Manuali
  const [showManualForm, setShowManualForm] = useState(false);
  const [showBlockForm, setShowBlockForm] = useState(false);
  const [manualBooking, setManualBooking] = useState({
    customer_name: '',
    customer_email: '',
    check_in: '',
    check_out: '',
    guests: 2,
    total_amount: 0,
    status: 'confirmed',
    platform: 'manual' // Identifica prenotazioni manuali
  });
  const [blockDate, setBlockDate] = useState({ start_date: '', end_date: '', reason: 'maintenance' });

  // Admin API Service
  const [adminApiService] = useState(() => {
    try {
      devLog('🔧 Inizializzazione AdminApiService...');
      return new AdminApiService();
    } catch (error) {
      devError('❌ Errore AdminApiService:', error);
      return null;
    }
  });
  
  // Load real API data
  const loadRealApiData = async () => {
    if (!adminApiService) {
      console.warn('âš ï¸ AdminApiService non disponibile');
      return;
    }

    setIsLoadingData(true);
    try {
      log('📄 Caricamento dati API...');
      
      const [stats, bookings, calendarBookings, settings, analyticsData, notifs, transactions, blocks] = await Promise.allSettled([
        adminApiService.getDashboardStats(),
        adminApiService.getBookings(),
        adminApiService.getCalendarBookings({ futureOnly: true, limit: 100 }),
        adminApiService.getSystemSettings(),
        adminApiService.getAnalytics(),
        adminApiService.getNotifications(),
        adminApiService.getPayments(),
        adminApiService.getBlockedDates()
      ]);

      if (stats.status === 'fulfilled') setDashboardStats(stats.value || {});
      if (bookings.status === 'fulfilled') setRealBookings(bookings.value || []);
      if (calendarBookings.status === 'fulfilled') setCalendarEvents(calendarBookings.value?.bookings || []);
      if (settings.status === 'fulfilled') setSystemSettings(settings.value || []);
      if (analyticsData.status === 'fulfilled') setAnalytics(analyticsData.value || []);
      if (notifs.status === 'fulfilled') setNotifications(notifs.value || []);
      if (transactions.status === 'fulfilled') setPaymentTransactions(transactions.value || []);
      if (blocks.status === 'fulfilled') setBlockedDates(blocks.value || []);

      log('✅ Dati caricati con successo');
    } catch (error) {
      devError('❌ Errore caricamento dati:', error);
    } finally {
      setIsLoadingData(false);
    }
  };

  // ✨ NUOVE FUNZIONI PER GESTIONE PAGAMENTI E CANCELLAZIONI
  const handleConfirmPayment = async (bookingId: string, paymentType: 'deposit' | 'full') => {
    const typeLabel = paymentType === 'deposit' ? "l'acconto" : "il saldo completo";
    if (!confirm(`Sei sicuro di voler confermare la ricezione del${typeLabel}? Verrà inviata l'email di conferma al cliente.`)) {
      return;
    }

    try {
      setIsLoadingData(true);
      // Usa l'endpoint unificato
      const response = await fetch('/api/unified?action=capture-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          booking_id: bookingId,
          paymentType: paymentType
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        alert('✅ Pagamento confermato con successo!');
        await loadRealApiData();
      } else {
        alert('❌ Errore: ' + (result.error || result.message));
      }
    } catch (error) {
      console.error('❌ Errore conferma pagamento:', error);
      alert('❌ Errore di comunicazione con il server');
    } finally {
      setIsLoadingData(false);
    }
  };

  const handleDeleteBooking = async (id: string) => {
    if (!confirm('⚠️ Sei sicuro di voler ELIMINARE definitivamente questa prenotazione? Questa azione rimuoverà anche le date bloccate.')) {
      return;
    }
    try {
      setIsLoadingData(true);
      await adminApiService?.deleteBooking(id);
      await loadRealApiData();
      alert('✅ Prenotazione eliminata con successo!');
    } catch (error) {
      alert('❌ Errore nell\'eliminazione della prenotazione');
    } finally {
      setIsLoadingData(false);
    }
  };

  const handleCancelBookingAction = async (bookingId: string) => {
    const reason = prompt("Inserisci il motivo della cancellazione (es. Mancato pagamento, Richiesta cliente):");
    if (reason === null) return;

    try {
      setIsLoadingData(true);
      const response = await fetch('/api/unified?action=cancel-booking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId: bookingId,
          reason: reason
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        alert('✅ Prenotazione annullata e date liberate dal calendario!');
        await loadRealApiData();
      } else {
        alert('❌ Errore: ' + (result.error || result.message));
      }
    } catch (error) {
      console.error('❌ Errore cancellazione:', error);
      alert('❌ Errore di comunicazione con il server');
    } finally {
      setIsLoadingData(false);
    }
  };

  // ✨ NUOVE FUNZIONI: Creazione Manuale e Blocco Date
  const handleCreateManualBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualBooking.check_in || !manualBooking.check_out || !manualBooking.customer_name) {
      alert('Compila tutti i campi obbligatori');
      return;
    }
    try {
      setIsLoadingData(true);
      // Usa l'endpoint unificato per creare la prenotazione
      const response = await fetch('/api/unified?action=booking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(manualBooking)
      });
      const result = await response.json();
      if (result.success) {
        alert('✅ Prenotazione manuale creata con successo!');
        setShowManualForm(false);
        setManualBooking({ customer_name: '', customer_email: '', check_in: '', check_out: '', guests: 2, total_amount: 0, status: 'confirmed', platform: 'manual' });
        await loadRealApiData();
      } else {
        alert('❌ Errore: ' + (result.error || result.message));
      }
    } catch (error) {
      console.error('Errore creazione manuale:', error);
      alert('Errore di comunicazione');
    } finally {
      setIsLoadingData(false);
    }
  };

  const handleBlockDates = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!blockDate.start_date || !blockDate.end_date) {
      alert('Seleziona le date');
      return;
    }
    try {
      setIsLoadingData(true);
      const response = await fetch('/api/unified?action=blocked-dates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(blockDate)
      });
      const result = await response.json();
      if (result.success) {
        alert('✅ Date bloccate con successo!');
        setShowBlockForm(false);
        setBlockDate({ start_date: '', end_date: '', reason: 'maintenance' });
        await loadRealApiData();
      } else {
        alert('❌ Errore: ' + result.error);
      }
    } catch (error) {
      console.error('Errore blocco date:', error);
    } finally {
      setIsLoadingData(false);
    }
  };

  // 📅 LOGICA CALENDARIO VISUALE
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const days = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay(); // 0 = Dom, 1 = Lun...
    return { days, firstDay };
  };

  // Helper per visualizzare nomi piattaforma leggibili (es. cal_3 -> Holidu)
  const getPlatformLabel = (platform: string) => {
    if (!platform) return 'Altro';
    const p = platform.toLowerCase();
    if (p === 'direct' || p === 'manual') return 'Sito';
    if (p === 'cal_3' || p === 'holidu') return 'Holidu';
    if (p === 'airbnb') return 'Airbnb';
    if (p === 'booking' || p === 'booking.com') return 'Booking';
    return p.charAt(0).toUpperCase() + p.slice(1);
  };

  const renderCalendar = () => {
    const { days, firstDay } = getDaysInMonth(currentMonth);
    const monthName = currentMonth.toLocaleString('it-IT', { month: 'long', year: 'numeric' });
    const daysArray = Array.from({ length: days }, (_, i) => i + 1);
    const blanks = Array.from({ length: firstDay === 0 ? 6 : firstDay - 1 }, (_, i) => i); // Adjust for Monday start

    // Unifica tutti gli eventi per il calendario
    const allEvents = [
      ...realBookings.map(b => ({ ...b, type: 'booking', start: new Date(b.check_in), end: new Date(b.check_out) })),
      ...calendarEvents.map(e => ({ ...e, type: 'external', start: new Date(e.checkIn || e.start_date), end: new Date(e.checkOut || e.end_date), customer_name: e.title || 'Esterno', platform: e.platform })),
      ...blockedDates.map(b => ({ ...b, type: 'blocked', start: new Date(b.start_date), end: new Date(b.end_date), customer_name: 'Chiuso', platform: 'admin' }))
    ];

    return (
      <div className="admin-calendar-wrapper">
        <div className="calendar-controls">
          <button className="admin-btn-secondary" onClick={() => setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() - 1)))}>◀ Mese Prec.</button>
          <h3>{monthName}</h3>
          <button className="admin-btn-secondary" onClick={() => setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() + 1)))}>Mese Succ. ▶</button>
        </div>
        <div className="calendar-grid">
          {['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'].map(d => <div key={d} className="calendar-header-cell">{d}</div>)}
          {blanks.map(b => <div key={`blank-${b}`} className="calendar-day-cell empty"></div>)}
          {daysArray.map(day => {
            const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
            const dateStr = date.toISOString().split('T')[0];
            
            // Trova eventi per questo giorno
            const dayEvents = allEvents.filter(ev => {
              const start = new Date(ev.start);
              const end = new Date(ev.end);
              start.setHours(0,0,0,0);
              end.setHours(0,0,0,0);
              // Mostra se il giorno è compreso nel range (inclusivo start, esclusivo end per checkout, ma mostriamo checkout come evento parziale)
              return date >= start && date <= end;
            });

            return (
              <div key={day} className="calendar-day-cell">
                <span className="day-number">{day}</span>
                {dayEvents.map((ev, idx) => {
                  const isStart = new Date(ev.start).getDate() === day && new Date(ev.start).getMonth() === currentMonth.getMonth();
                  const isEnd = new Date(ev.end).getDate() === day && new Date(ev.end).getMonth() === currentMonth.getMonth();
                  
                  let eventClass = 'calendar-event';
                  if (ev.type === 'booking') eventClass += ' event-booking';
                  if (ev.type === 'external') eventClass += ' event-external';
                  if (ev.type === 'blocked') eventClass += ' event-blocked';
                  if (isStart) eventClass += ' event-checkin';
                  if (isEnd) eventClass += ' event-checkout';

                  // Non mostrare se è solo checkout e non checkin (per evitare confusione visiva, o gestiscilo come preferisci)
                  // Qui mostriamo tutto per chiarezza "Occupato"
                  
                  return (
                    <div key={idx} className={eventClass} title={`${ev.customer_name} (${getPlatformLabel(ev.platform)})`}>
                      <div className="event-info">
                        <span>{isStart ? '📥' : isEnd ? '📤' : '🔒'}</span>
                        <span>{getPlatformLabel(ev.platform)}</span>
                      </div>
                      <div className="calendar-event-name">{ev.customer_name || ev.guestName}</div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
        <div className="calendar-legend calendar-legend-container">
          <span className="legend-item-flex"><div className="legend-color-box legend-color-blue"></div> Prenotazione Sito</span>
          <span className="legend-item-flex"><div className="legend-color-box legend-color-purple"></div> Esterno (Airbnb/Booking)</span>
          <span className="legend-item-flex"><div className="legend-color-box legend-color-red"></div> Chiuso/Bloccato</span>
          <span className="legend-item-flex"><div className="legend-color-box legend-color-checkin"></div> Check-in</span>
          <span className="legend-item-flex"><div className="legend-color-box legend-color-checkout"></div> Check-out</span>
        </div>
      </div>
    );
  };

  const loadCalendarData = async () => {
    setIsLoadingCalendar(true);
    try {
      await loadRealApiData();
    } finally {
      setIsLoadingCalendar(false);
    }
  };

  // Load data on mount
  useEffect(() => {
    if (!roleLoading && isAdmin()) {
      loadRealApiData();
    }
  }, [roleLoading]);

  // === RENDER ADMIN ROLE GUARD ===
  if (!roleLoading && !isAdmin()) {
    return (
      <div className="admin-access-denied-container">
        <div className="admin-access-denied-card">
          <h1 className="admin-access-denied-icon">🔒</h1>
          <h2 className="admin-access-denied-title">Accesso Negato</h2>
          <p className="admin-access-denied-text">
            Questo pannello richiede i diritti di <strong>amministratore</strong>.
          </p>
          <p className="admin-access-denied-role">
            Ruolo attuale: <strong>{role || 'Non disponibile'}</strong>
          </p>
          <p className="admin-access-denied-hint">
            Contatta il SuperAdmin per ottenere i diritti necessari.
          </p>
        </div>
      </div>
    );
  }

  // Nessun login client-side: accesso gestito da `/admin/login` e ProtectedRoute

  // === RENDER MAIN PANEL ===
  devLog('🎯 Rendering basic admin panel...');
  
  return (
    <div className="admin-panel-pro admin-container">
      {/* Header */}
      <header className="admin-header">
        <div className="admin-header-left">
          <h1>⚙️ Pannello Amministratore</h1>
          <span className="admin-version admin-badge admin-badge-info">v2.0</span>
        </div>
        
        <div className="admin-header-actions">
          <div className="admin-flex admin-items-center admin-gap-md">
            {/* Indicatore Status */}
            <div className="admin-badge admin-badge-success">
              ✅ Online
            </div>
            
            {/* User Info */}
            <div className="admin-flex admin-items-center admin-gap-sm">
              <span className="admin-text-muted admin-hidden-mobile">👤 Amministratore</span>
              <div className="admin-badge admin-badge-warning" title="Modalità Admin">
                ⚡ Admin
              </div>
            </div>
          </div>
          
          <div className="admin-flex admin-items-center admin-gap-sm">
            {role === 'superadmin' && (
              <button 
                className="admin-btn admin-btn-info admin-btn-sm"
                onClick={() => window.location.href = '/admin'}
                title="Torna al pannello SuperAdmin"
              >
                <span className="admin-hidden-mobile">⚡ SuperAdmin</span>
                <span className="admin-visible-mobile">⚡</span>
              </button>
            )}
            
            <button 
              className="admin-btn admin-btn-secondary"
              onClick={() => {
                localStorage.removeItem('vincanto_admin_token');
                localStorage.removeItem('vincanto_admin_role');
                window.location.href = '/admin/login';
              }}
            >
              <span className="admin-hidden-mobile">🚪 Logout</span>
              <span className="admin-visible-mobile">🚪</span>
            </button>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="admin-nav">
        <button 
          className={`admin-nav-link ${activeTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => setActiveTab('dashboard')}
        >
          📊 Dashboard
        </button>
        <button 
          className={`admin-nav-link ${activeTab === 'prenotazioni' ? 'active' : ''}`}
          onClick={() => setActiveTab('prenotazioni')}
        >
          📅 Prenotazioni
        </button>
        <button 
          className={`admin-nav-link ${activeTab === 'calendari' ? 'active' : ''}`}
          onClick={() => setActiveTab('calendari')}
        >
          📆 Calendari
        </button>
        <button 
          className={`admin-nav-link ${activeTab === 'servizi' ? 'active' : ''}`}
          onClick={() => setActiveTab('servizi')}
        >
          🛎️ Servizi Extra
        </button>
      </nav>

      {/* Main Content */}
      <main className="admin-main">
        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div className="admin-dashboard-wrapper">
            <AdminDashboard
              dashboardStats={dashboardStats}
              realBookings={realBookings}
              paymentTransactions={paymentTransactions}
              notifications={notifications}
              systemSettings={systemSettings}
              analytics={analytics}
              calendarEvents={calendarEvents}
              blockedDates={blockedDates}
              isLoadingData={isLoadingData}
              isLoadingCalendar={isLoadingCalendar}
              loadCalendarData={loadCalendarData}
              setActiveTab={setActiveTab}
            />
            
            {/* Calendario aggiunto anche nella Dashboard */}
            <div className="admin-pricing-section admin-mt-20">
              <h3>📅 Calendario Occupazioni</h3>
              <p className="admin-section-description">
                Panoramica rapida delle disponibilità.
              </p>
              {renderCalendar()}
            </div>
          </div>
        )}

        {/* Prenotazioni Tab */}
        {activeTab === 'prenotazioni' && (
          <div className="admin-prenotazioni">
            <h2>📅 Gestione Prenotazioni {isLoadingData && '(Caricamento...)'}</h2>
            
            {/* SEZIONE AZIONI RAPIDE: NUOVA PRENOTAZIONE E BLOCCO DATE */}
            <div className="admin-forms-container">
              {/* Card Nuova Prenotazione */}
              <div className="admin-form-card">
                <div className="admin-flex-between">
                  <h3>➕ Nuova Prenotazione Manuale</h3>
                  <button className="admin-btn-small" onClick={() => setShowManualForm(!showManualForm)}>{showManualForm ? 'Chiudi' : 'Apri'}</button>
                </div>
                {showManualForm && (
                  <form onSubmit={handleCreateManualBooking}>
                    <div className="form-group">
                      <label htmlFor="manual_customer_name">Nome Cliente:</label>
                      <input id="manual_customer_name" type="text" className="admin-input" value={manualBooking.customer_name} onChange={e => setManualBooking({...manualBooking, customer_name: e.target.value})} required />
                    </div>
                    <div className="form-group admin-grid-2-col">
                      <div><label htmlFor="manual_check_in">Check-in:</label><input id="manual_check_in" type="date" className="admin-input" value={manualBooking.check_in} onChange={e => setManualBooking({...manualBooking, check_in: e.target.value})} required /></div>
                      <div><label htmlFor="manual_check_out">Check-out:</label><input id="manual_check_out" type="date" className="admin-input" value={manualBooking.check_out} onChange={e => setManualBooking({...manualBooking, check_out: e.target.value})} required /></div>
                    </div>
                    <div className="form-group admin-grid-2-col">
                      <div><label htmlFor="manual_guests">Ospiti:</label><input id="manual_guests" type="number" className="admin-input" value={manualBooking.guests} onChange={e => setManualBooking({...manualBooking, guests: parseInt(e.target.value)})} min="1" /></div>
                      <div><label htmlFor="manual_total_amount">Totale (€):</label><input id="manual_total_amount" type="number" className="admin-input" value={manualBooking.total_amount} onChange={e => setManualBooking({...manualBooking, total_amount: parseFloat(e.target.value)})} /></div>
                    </div>
                    <div className="form-group">
                      <label htmlFor="manual_customer_email">Email (opzionale):</label>
                      <input id="manual_customer_email" type="email" className="admin-input" value={manualBooking.customer_email} onChange={e => setManualBooking({...manualBooking, customer_email: e.target.value})} />
                    </div>
                    <button type="submit" className="admin-btn-primary admin-w-full">Salva Prenotazione</button>
                  </form>
                )}
              </div>

              {/* Card Blocca Date */}
              <div className="admin-form-card">
                <div className="admin-flex-between">
                  <h3>🚫 Blocca/Chiudi Date</h3>
                  <button className="admin-btn-small" onClick={() => setShowBlockForm(!showBlockForm)}>{showBlockForm ? 'Chiudi' : 'Apri'}</button>
                </div>
                {showBlockForm && (
                  <form onSubmit={handleBlockDates}>
                    <div className="form-group admin-grid-2-col">
                      <div><label htmlFor="block_start_date">Dal:</label><input id="block_start_date" type="date" className="admin-input" value={blockDate.start_date} onChange={e => setBlockDate({...blockDate, start_date: e.target.value})} required /></div>
                      <div><label htmlFor="block_end_date">Al:</label><input id="block_end_date" type="date" className="admin-input" value={blockDate.end_date} onChange={e => setBlockDate({...blockDate, end_date: e.target.value})} required /></div>
                    </div>
                    <div className="form-group">
                      <label htmlFor="block_reason">Motivo:</label>
                      <select id="block_reason" className="admin-input" value={blockDate.reason} onChange={e => setBlockDate({...blockDate, reason: e.target.value})}>
                        <option value="maintenance">Manutenzione</option>
                        <option value="closed">Chiusura Stagionale</option>
                        <option value="private">Uso Privato</option>
                        <option value="other">Altro</option>
                      </select>
                    </div>
                    <button type="submit" className="admin-btn-danger admin-w-full">Blocca Date</button>
                  </form>
                )}
              </div>
            </div>

            <div className="admin-pricing-section">
              <div className="admin-flex-between margin-bottom">
                <h3>📥 Prenotazioni Attive</h3>
                <button 
                  className="admin-btn-secondary" 
                  onClick={loadRealApiData}
                >
                  🔄 Ricarica Dati
                </button>
              </div>
              <div className="bookings-table-container">
                {realBookings.length > 0 ? (
                  <table className="bookings-table">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Cliente</th>
                        <th>Check-in</th>
                        <th>Check-out</th>
                        <th>Ospiti</th>
                        <th>Stato</th>
                        <th>Totale</th>
                        <th>Azioni</th>
                      </tr>
                    </thead>
                    <tbody>
                      {realBookings.map((booking) => (
                        <tr key={booking.id} className="booking-row">
                          <td><strong>#{booking.id}</strong></td>
                          <td>{booking.customer_name || booking.guestName || 'N/A'}</td>
                          <td>{booking.customer_email || booking.email || 'N/A'}</td>
                          <td>{booking.check_in ? new Date(booking.check_in).toLocaleDateString('it-IT') : 'N/A'}</td>
                          <td>{booking.check_out ? new Date(booking.check_out).toLocaleDateString('it-IT') : 'N/A'}</td>
                          <td>{booking.guests}</td>
                          <td>
                            <span className={`status ${booking.status}`}>
                              {booking.status === 'confirmed' && '✅ Confermata'}
                              {booking.status === 'pending' && '🟡 In attesa'}
                              {booking.status === 'cancelled' && '❌ Cancellata'}
                              {!booking.status && '📊 Backend'}
                            </span>
                          </td>
                          <td>€{(booking.total_amount || booking.totalPrice || 0).toFixed(2)}</td>
                          <td>
                            <div className="action-buttons action-buttons-flex">
                              {/* Pulsanti Conferma Pagamento */}
                              {booking.status !== 'cancelled' && booking.payment_method !== 'paid_full' && (
                                <>
                                  {booking.payment_method !== 'deposit_paid' && (
                                    <button
                                      className="admin-btn-small admin-btn-warning admin-btn-custom admin-btn-custom-warning"
                                      onClick={() => handleConfirmPayment(booking.booking_id || booking.id, 'deposit')}
                                      title="Conferma Acconto"
                                    >
                                      💰 Acconto
                                    </button>
                                  )}
                                  <button
                                    className="admin-btn-small admin-btn-success admin-btn-custom admin-btn-custom-success"
                                    onClick={() => handleConfirmPayment(booking.booking_id || booking.id, 'full')}
                                    title="Conferma Saldo"
                                  >
                                    ✅ Saldo
                                  </button>
                                </>
                              )}

                              {/* Pulsante Annulla */}
                              {booking.status !== 'cancelled' ? (
                                <button
                                  className="admin-btn-small admin-btn-danger admin-btn-custom admin-btn-custom-danger"
                                  onClick={() => handleCancelBookingAction(booking.booking_id || booking.id)}
                                  title="Annulla"
                                >
                                  ❌ Annulla
                                </button>
                              ) : (
                                <span className="admin-text-muted admin-text-cancelled-small">Già cancellata</span>
                              )}

                              {/* Pulsante Elimina */}
                              <button
                                className="admin-btn-small admin-btn-danger admin-btn-custom admin-btn-custom-danger admin-ml-5px"
                                onClick={() => handleDeleteBooking(booking.id)}
                                title="Elimina definitivamente"
                              >
                                🗑️
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="admin-pricing-card">
                    <p>📊 Nessuna prenotazione trovata</p>
                    <button className="admin-btn-primary" onClick={loadRealApiData}>
                      🔄 Ricarica Prenotazioni
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Calendari Tab */}
        {activeTab === 'calendari' && (
          <div className="admin-calendari">
            <h2>📋 Gestione Calendari {isLoadingCalendar && '(Caricamento...)'}</h2>
            
            <div className="admin-pricing-actions margin-bottom">
              <button 
                className="admin-btn-primary" 
                onClick={loadCalendarData}
              >
                🔄 Ricarica Calendari
              </button>
            </div>

            <div className="admin-pricing-section">
              <h3> Calendario Occupazioni</h3>
              <p className="admin-section-description">
                Visualizza tutte le occupazioni: prenotazioni dal sito (blu), calendari esterni (viola) e date chiuse manualmente (rosso).
              </p>
              {renderCalendar()}
            </div>
          </div>
        )}

        {/* Servizi Extra Tab */}
        {activeTab === 'servizi' && (
          <div className="admin-section admin-animate-fade-in">
            <h2>🛎️ Gestione Servizi Extra</h2>
            <p className="admin-section-description">
              Modifica e configura i servizi aggiuntivi disponibili per gli ospiti.
            </p>
            
            <ExtraServicesAdmin />
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminPanelBasic;
