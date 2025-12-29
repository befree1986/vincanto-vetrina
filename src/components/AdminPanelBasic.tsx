/* eslint-disable */
// @ts-nocheck
import React, { useState, useEffect } from 'react';
import '../pages/AdminPanelPro.css';
import '../styles/AdminSuperAdmin.css';
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
  devLog('ðŸš€ AdminPanelBasic component rendering...');
  
  const { role, isLoading: roleLoading, isAdmin } = useAdminRole();
  
  // Tab navigation
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Data states
  const [dashboardStats, setDashboardStats] = useState<any>({});
  const [realBookings, setRealBookings] = useState<any[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<any[]>([]);
  const [systemSettings, setSystemSettings] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [paymentTransactions, setPaymentTransactions] = useState<any[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [isLoadingCalendar, setIsLoadingCalendar] = useState(false);
  
  // Admin API Service
  const [adminApiService] = useState(() => {
    try {
      devLog('ðŸ”§ Inizializzazione AdminApiService...');
      return new AdminApiService();
    } catch (error) {
      devError('âŒ Errore AdminApiService:', error);
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
      log('ðŸ”„ Caricamento dati API...');
      
      const [stats, bookings, calendarBookings, settings, analyticsData, notifs, transactions] = await Promise.allSettled([
        adminApiService.getDashboardStats(),
        adminApiService.getBookings(),
        adminApiService.getCalendarBookings({ futureOnly: true, limit: 100 }),
        adminApiService.getSystemSettings(),
        adminApiService.getAnalytics(),
        adminApiService.getNotifications(),
        adminApiService.getPaymentTransactions()
      ]);

      if (stats.status === 'fulfilled') setDashboardStats(stats.value || {});
      if (bookings.status === 'fulfilled') setRealBookings(bookings.value || []);
      if (calendarBookings.status === 'fulfilled') setCalendarEvents(calendarBookings.value?.bookings || []);
      if (settings.status === 'fulfilled') setSystemSettings(settings.value || []);
      if (analyticsData.status === 'fulfilled') setAnalytics(analyticsData.value || []);
      if (notifs.status === 'fulfilled') setNotifications(notifs.value || []);
      if (transactions.status === 'fulfilled') setPaymentTransactions(transactions.value || []);

      log('âœ… Dati caricati con successo');
    } catch (error) {
      devError('âŒ Errore caricamento dati:', error);
    } finally {
      setIsLoadingData(false);
    }
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
          <h1 className="admin-access-denied-icon">ðŸ”</h1>
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
  devLog('ðŸŽ¯ Rendering basic admin panel...');
  
  return (
    <div className="admin-panel-pro admin-container">
      {/* Header */}
      <header className="admin-header">
        <div className="admin-header-left">
          <h1>ï¿½ Pannello Amministratore</h1>
          <span className="admin-version admin-badge admin-badge-info">v2.0</span>
        </div>
        
        <div className="admin-header-actions">
          <div className="admin-flex admin-items-center admin-gap-md">
            {/* Indicatore Status */}
            <div className="admin-badge admin-badge-success">
              âœ… Online
            </div>
            
            {/* User Info */}
            <div className="admin-flex admin-items-center admin-gap-sm">
              <span className="admin-text-muted admin-hidden-mobile">ðŸ‘¤ Amministratore</span>
              <div className="admin-badge admin-badge-warning" title="ModalitÃ  Admin">
                âš¡ Admin
              </div>
            </div>
          </div>
          
          <button 
            className="admin-btn admin-btn-secondary"
            onClick={() => {
              localStorage.removeItem('vincanto_admin_token');
              localStorage.removeItem('vincanto_admin_role');
              window.location.href = '/admin/login';
            }}
          >
            <span className="admin-hidden-mobile">ðŸ“¤ Logout</span>
            <span className="admin-visible-mobile">ðŸ“¤</span>
          </button>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="admin-nav">
        <button 
          className={`admin-nav-link ${activeTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => setActiveTab('dashboard')}
        >
          ðŸ“Š Dashboard
        </button>
        <button 
          className={`admin-nav-link ${activeTab === 'prenotazioni' ? 'active' : ''}`}
          onClick={() => setActiveTab('prenotazioni')}
        >
          ðŸ“… Prenotazioni
        </button>
        <button 
          className={`admin-nav-link ${activeTab === 'calendari' ? 'active' : ''}`}
          onClick={() => setActiveTab('calendari')}
        >
          ðŸ“† Calendari
        </button>
        <button 
          className={`admin-nav-link ${activeTab === 'servizi' ? 'active' : ''}`}
          onClick={() => setActiveTab('servizi')}
        >
          ðŸ›Žï¸ Servizi Extra
        </button>
      </nav>

      {/* Main Content */}
      <main className="admin-main">
        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <AdminDashboard
            dashboardStats={dashboardStats}
            realBookings={realBookings}
            paymentTransactions={paymentTransactions}
            notifications={notifications}
            systemSettings={systemSettings}
            analytics={analytics}
            calendarEvents={calendarEvents}
            isLoadingData={isLoadingData}
            isLoadingCalendar={isLoadingCalendar}
            loadCalendarData={loadCalendarData}
            setActiveTab={setActiveTab}
          />
        )}

        {/* Prenotazioni Tab */}
        {activeTab === 'prenotazioni' && (
          <div className="admin-prenotazioni">
            <h2>ðŸ“… Gestione Prenotazioni {isLoadingData && '(Caricamento...)'}</h2>
            
            <div className="admin-pricing-actions margin-bottom">
              <button 
                className="admin-btn-primary" 
                onClick={loadRealApiData}
              >
                ðŸ”„ Ricarica Dati
              </button>
            </div>

            <div className="admin-pricing-section">
              <h3>ðŸ”¥ Prenotazioni Attive</h3>
              <div className="bookings-table-container">
                {realBookings.length > 0 ? (
                  <table className="bookings-table">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Cliente</th>
                        <th>Email</th>
                        <th>Check-in</th>
                        <th>Check-out</th>
                        <th>Ospiti</th>
                        <th>Stato</th>
                        <th>Totale</th>
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
                              {booking.status === 'confirmed' && 'âœ… Confermata'}
                              {booking.status === 'pending' && 'ðŸŸ¡ In attesa'}
                              {booking.status === 'cancelled' && 'âŒ Cancellata'}
                              {!booking.status && 'ðŸ“Š Backend'}
                            </span>
                          </td>
                          <td>â‚¬{(booking.total_amount || booking.totalPrice || 0).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="admin-pricing-card">
                    <p>ðŸ“Š Nessuna prenotazione trovata</p>
                    <button className="admin-btn-primary" onClick={loadRealApiData}>
                      ðŸ”„ Ricarica Prenotazioni
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
            <h2>ðŸ“† Gestione Calendari {isLoadingCalendar && '(Caricamento...)'}</h2>
            
            <div className="admin-pricing-actions margin-bottom">
              <button 
                className="admin-btn-primary" 
                onClick={loadCalendarData}
              >
                ðŸ”„ Ricarica Calendari
              </button>
            </div>

            <div className="admin-pricing-section">
              <h3>ðŸ“‹ Eventi Calendario</h3>
              <div className="bookings-table-container">
                {calendarEvents.length > 0 ? (
                  <table className="bookings-table">
                    <thead>
                      <tr>
                        <th>Piattaforma</th>
                        <th>Titolo</th>
                        <th>Check-in</th>
                        <th>Check-out</th>
                        <th>Stato</th>
                      </tr>
                    </thead>
                    <tbody>
                      {calendarEvents.map((event, idx) => (
                        <tr key={idx}>
                          <td>
                            <span className={`platform-badge ${event.platform}`}>
                              {event.platform === 'holidu' && 'ðŸ  Holidu'}
                              {event.platform === 'airbnb' && 'ðŸ¡ Airbnb'}
                              {event.platform === 'booking' && 'ðŸ¨ Booking'}
                              {event.platform === 'google' && 'ðŸ“… Google'}
                              {!event.platform && 'â“ Altro'}
                            </span>
                          </td>
                          <td>{event.title || event.summary || 'Prenotazione'}</td>
                          <td>{event.check_in ? new Date(event.check_in).toLocaleDateString('it-IT') : 'N/A'}</td>
                          <td>{event.check_out ? new Date(event.check_out).toLocaleDateString('it-IT') : 'N/A'}</td>
                          <td>
                            <span className="status confirmed">âœ… Confermato</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="admin-pricing-card">
                    <p>ðŸ“Š Nessun evento calendario trovato</p>
                    <button className="admin-btn-primary" onClick={loadCalendarData}>
                      ðŸ”„ Ricarica Calendari
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Servizi Extra Tab */}
        {activeTab === 'servizi' && (
          <div className="admin-section admin-animate-fade-in">
            <h2>ðŸ›Žï¸ Gestione Servizi Extra</h2>
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
