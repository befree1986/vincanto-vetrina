import React, { useState, useEffect } from 'react';
import './AdminPanelPro.css';
import * as AdminAPI from '../services/adminApi';

const AdminPanelPro: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  // SuperAdmin nascosto
  const [showSuperAdmin, setShowSuperAdmin] = useState(false);
  
  // Stati per gestione dati con API reali
  const [dashboardStats, setDashboardStats] = useState<AdminAPI.DashboardStats | null>(null);
  const [calendars, setCalendars] = useState<AdminAPI.AdminCalendar[]>([]);
  const [bookings, setBookings] = useState<AdminAPI.AdminBooking[]>([]);
  const [blockedDates, setBlockedDates] = useState<AdminAPI.BlockedDate[]>([]);
  const [pricingConfig, setPricingConfig] = useState<AdminAPI.PricingConfig | null>(null);
  const [notifications, setNotifications] = useState<AdminAPI.AdminNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // === useEffect per caricamento iniziale ===
  useEffect(() => {
    if (isAuthenticated) {
      loadInitialData();
    }
  }, [isAuthenticated]);

  // === AUTENTICAZIONE ===
  const handleLogin = async () => {
    if (password === 'vincanto2025') {
      setIsAuthenticated(true);
      setError('');
    } else {
      setError('Password non corretta');
    }
  };

  // === FUNZIONI CARICAMENTO DATI CON API REALI ===
  const loadInitialData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadDashboardStats(),
        loadCalendars(), 
        loadBookings(),
        loadBlockedDates(),
        loadPricingConfig(),
        loadNotifications()
      ]);
    } catch (error) {
      console.error('Errore caricamento dati iniziali:', error);
      setError('Errore nel caricamento dei dati');
    } finally {
      setLoading(false);
    }
  };

  const loadDashboardStats = async () => {
    try {
      const stats = await AdminAPI.getDashboardStats();
      setDashboardStats(stats);
    } catch (error) {
      console.error('Errore caricamento statistiche:', error);
    }
  };

  const loadCalendars = async () => {
    try {
      const calendarsData = await AdminAPI.getCalendars();
      setCalendars(calendarsData);
    } catch (error) {
      console.error('Errore caricamento calendari:', error);
      setError('Errore caricamento calendari');
    }
  };

  const loadBookings = async () => {
    try {
      const bookingsData = await AdminAPI.getBookings();
      setBookings(bookingsData);
    } catch (error) {
      console.error('Errore caricamento prenotazioni:', error);
      setError('Errore caricamento prenotazioni');
    }
  };

  const loadBlockedDates = async () => {
    try {
      const blockedDatesData = await AdminAPI.getBlockedDates();
      setBlockedDates(blockedDatesData);
    } catch (error) {
      console.error('Errore caricamento date bloccate:', error);
    }
  };

  const loadPricingConfig = async () => {
    try {
      const config = await AdminAPI.getPricingConfig();
      setPricingConfig(config);
    } catch (error) {
      console.error('Errore caricamento configurazione prezzi:', error);
    }
  };

  const loadNotifications = async () => {
    try {
      const { notifications: notificationsData, unreadCount: count } = await AdminAPI.getNotifications();
      setNotifications(notificationsData);
      setUnreadCount(count);
    } catch (error) {
      console.error('Errore caricamento notifiche:', error);
    }
  };

  // === GESTORI EVENTI ===
  const handleAddCalendar = async (name: string, platform: string, url: string) => {
    try {
      await AdminAPI.addCalendar({ 
        name, 
        platform, 
        url, 
        isActive: true, 
        syncStatus: 'manual' as const, 
        blockedDates: [], 
        lastSync: new Date().toISOString() 
      });
      await loadCalendars();
    } catch (error) {
      console.error('Errore aggiunta calendario:', error);
      setError('Errore nell\'aggiunta del calendario');
    }
  };

  const handleSyncCalendar = async (calendarId: string) => {
    try {
      await AdminAPI.syncCalendar(calendarId);
      await loadCalendars();
    } catch (error) {
      console.error('Errore sincronizzazione calendario:', error);
      setError('Errore nella sincronizzazione del calendario');
    }
  };

  const handleAddBlockedDate = async (date: string, reason: string, type: string) => {
    try {
      await AdminAPI.addBlockedDate(date, reason, type);
      await loadBlockedDates();
    } catch (error) {
      console.error('Errore aggiunta data bloccata:', error);
      setError('Errore nell\'aggiunta della data bloccata');
    }
  };

  const handleUpdatePricingConfig = async (newConfig: AdminAPI.PricingConfig) => {
    try {
      await AdminAPI.updatePricingConfig(newConfig);
      await loadPricingConfig();
    } catch (error) {
      console.error('Errore aggiornamento configurazione prezzi:', error);
      setError('Errore nell\'aggiornamento della configurazione');
    }
  };

  // === RENDER LOGIN ===
  if (!isAuthenticated) {
    return (
      <div className="admin-login-container">
        <div className="admin-login-card">
          <div className="admin-logo">
            <h1>🏡 Vincanto Admin</h1>
            <p>Pannello di gestione professionale</p>
          </div>
          
          <div className="admin-login-form">
            <input
              type="password"
              placeholder="Password Admin"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
              className="admin-input"
            />
            
            <button onClick={handleLogin} className="admin-btn-primary">
              Accedi al Pannello
            </button>
            
            {error && <div className="admin-error">{error}</div>}
          </div>
        </div>
      </div>
    );
  }

  // === RENDER ADMIN PANEL ===
  return (
    <div className="admin-panel-pro">
      {/* Header Professionale */}
      <header className="admin-header">
        <div className="admin-header-left">
          <h1>🏡 Vincanto Admin</h1>
          <span className="admin-version">v2.0 Pro</span>
        </div>
        
        <div className="admin-header-right">
          <div className="admin-user-info">
            <span>👤 Administrator</span>
            
            {/* Pulsante SuperAdmin nascosto */}
            <button 
              className="admin-btn-ghost"
              onClick={() => setShowSuperAdmin(!showSuperAdmin)}
              title="SuperAdmin"
            >
              ⚙️
            </button>
            
            {/* Notifiche */}
            <div className="admin-notifications">
              <button className="admin-btn-ghost">
                🔔 {unreadCount > 0 && <span className="notification-badge">{unreadCount}</span>}
              </button>
            </div>
          </div>
          
          <button 
            className="admin-btn-secondary"
            onClick={() => setIsAuthenticated(false)}
          >
            Logout
          </button>
        </div>
      </header>

      {/* Navigazione Tab */}
      <nav className="admin-nav">
        <div className="admin-nav-container">
          <button 
            className={`admin-nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            📊 Dashboard
          </button>
          
          <button 
            className={`admin-nav-item ${activeTab === 'bookings' ? 'active' : ''}`}
            onClick={() => setActiveTab('bookings')}
          >
            📅 Prenotazioni
          </button>
          
          <button 
            className={`admin-nav-item ${activeTab === 'calendars' ? 'active' : ''}`}
            onClick={() => setActiveTab('calendars')}
          >
            🗓️ Calendari
          </button>
          
          {showSuperAdmin && (
            <button 
              className={`admin-nav-item super-admin ${activeTab === 'config' ? 'active' : ''}`}
              onClick={() => setActiveTab('config')}
            >
              ⚡ SuperAdmin
            </button>
          )}
        </div>
      </nav>

      {/* Contenuto Principale */}
      <main className="admin-content">
        {loading && <div className="admin-loading">Caricamento dati...</div>}
        {error && <div className="admin-error-banner">{error}</div>}

        {/* Dashboard */}
        {activeTab === 'dashboard' && (
          <div className="admin-dashboard">
            <h2>📊 Dashboard Generale</h2>
            
            {/* Statistiche Principali */}
            {dashboardStats && (
              <div className="admin-stats-grid">
                <div className="admin-stat-card">
                  <h3>Prenotazioni Totali</h3>
                  <div className="stat-value">{dashboardStats.totalBookings}</div>
                </div>
                
                <div className="admin-stat-card">
                  <h3>Calendari Attivi</h3>
                  <div className="stat-value">{dashboardStats.activeCalendars}</div>
                </div>
                
                <div className="admin-stat-card">
                  <h3>Ricavi Totali</h3>
                  <div className="stat-value">€{dashboardStats.totalRevenue.toFixed(2)}</div>
                </div>
                
                <div className="admin-stat-card">
                  <h3>Tasso Occupazione</h3>
                  <div className="stat-value">{dashboardStats.occupancyRate}%</div>
                </div>
              </div>
            )}
            
            {/* Prenotazioni Recenti */}
            <div className="admin-section">
              <h3>📋 Prenotazioni Recenti</h3>
              <div className="admin-table-container">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Ospite</th>
                      <th>Check-in</th>
                      <th>Check-out</th>
                      <th>Stato</th>
                      <th>Importo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bookings.slice(0, 5).map(booking => (
                      <tr key={booking.id}>
                        <td>{booking.guestName}</td>
                        <td>{new Date(booking.checkIn).toLocaleDateString()}</td>
                        <td>{new Date(booking.checkOut).toLocaleDateString()}</td>
                        <td>
                          <span className={`status-badge ${booking.status}`}>
                            {booking.status === 'confirmed' ? '✅ Confermata' : '⏳ In attesa'}
                          </span>
                        </td>
                        <td>€{booking.totalAmount.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Gestione Prenotazioni */}
        {activeTab === 'bookings' && (
          <div className="admin-bookings">
            <h2>📅 Gestione Prenotazioni</h2>
            
            <div className="admin-table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Ospite</th>
                    <th>Email</th>
                    <th>Check-in</th>
                    <th>Check-out</th>
                    <th>Ospiti</th>
                    <th>Stato</th>
                    <th>Totale</th>
                    <th>Azioni</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map(booking => (
                    <tr key={booking.id}>
                      <td>{booking.id}</td>
                      <td>{booking.guestName}</td>
                      <td>{booking.guestEmail}</td>
                      <td>{new Date(booking.checkIn).toLocaleDateString()}</td>
                      <td>{new Date(booking.checkOut).toLocaleDateString()}</td>
                      <td>{booking.guests}</td>
                      <td>
                        <span className={`status-badge ${booking.status}`}>
                          {booking.status === 'confirmed' ? 'Confermata' : 
                           booking.status === 'pending' ? 'In attesa' : 'Cancellata'}
                        </span>
                      </td>
                      <td>€{booking.totalAmount.toFixed(2)}</td>
                      <td>
                        <button className="admin-btn-small">Dettagli</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Gestione Calendari */}
        {activeTab === 'calendars' && (
          <div className="admin-calendars">
            <h2>🗓️ Gestione Calendari</h2>
            
            {/* Calendari Esistenti */}
            <div className="admin-section">
              <h3>Calendari Collegati</h3>
              <div className="admin-table-container">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Nome</th>
                      <th>Piattaforma</th>
                      <th>Stato</th>
                      <th>Ultima Sync</th>
                      <th>Azioni</th>
                    </tr>
                  </thead>
                  <tbody>
                    {calendars.map(calendar => (
                      <tr key={calendar.id}>
                        <td>{calendar.name}</td>
                        <td>{calendar.platform}</td>
                        <td>
                          <span className={`status-badge ${calendar.isActive ? 'active' : 'inactive'}`}>
                            {calendar.isActive ? '✅ Attivo' : '❌ Inattivo'}
                          </span>
                        </td>
                        <td>{new Date(calendar.lastSync).toLocaleDateString()}</td>
                        <td>
                          <button 
                            className="admin-btn-small"
                            onClick={() => handleSyncCalendar(calendar.id)}
                          >
                            🔄 Sync
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Date Bloccate */}
            <div className="admin-section">
              <h3>Date Bloccate</h3>
              <div className="admin-blocked-dates">
                {blockedDates.map(date => (
                  <div key={date.id} className="blocked-date-item">
                    <span className="date">{new Date(date.date).toLocaleDateString()}</span>
                    <span className="reason">{date.reason}</span>
                    <span className={`type-badge ${date.type}`}>{date.type}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* SuperAdmin Configuration */}
        {activeTab === 'config' && showSuperAdmin && (
          <div className="admin-config">
            <h2>⚡ SuperAdmin Configuration</h2>
            
            {/* Configurazione Prezzi */}
            {pricingConfig && (
              <div className="admin-section">
                <h3>💰 Configurazione Prezzi</h3>
                <div className="config-grid">
                  <div className="config-item">
                    <label>Prezzo Base (notte)</label>
                    <input 
                      type="number" 
                      step="0.01"
                      value={pricingConfig.basePrice}
                      onChange={(e) => handleUpdatePricingConfig({
                        ...pricingConfig,
                        basePrice: parseFloat(e.target.value)
                      })}
                    />
                  </div>
                  
                  <div className="config-item">
                    <label>Prezzo Ospite Aggiuntivo</label>
                    <input 
                      type="number" 
                      step="0.01"
                      value={pricingConfig.additionalGuestPrice}
                      onChange={(e) => handleUpdatePricingConfig({
                        ...pricingConfig,
                        additionalGuestPrice: parseFloat(e.target.value)
                      })}
                    />
                  </div>
                  
                  <div className="config-item">
                    <label>Tassa di Pulizia</label>
                    <input 
                      type="number" 
                      step="0.01"
                      value={pricingConfig.cleaningFee}
                      onChange={(e) => handleUpdatePricingConfig({
                        ...pricingConfig,
                        cleaningFee: parseFloat(e.target.value)
                      })}
                    />
                  </div>
                  
                  <div className="config-item">
                    <label>Parcheggio (per notte)</label>
                    <input 
                      type="number" 
                      step="0.01"
                      value={pricingConfig.parkingFeePerNight}
                      onChange={(e) => handleUpdatePricingConfig({
                        ...pricingConfig,
                        parkingFeePerNight: parseFloat(e.target.value)
                      })}
                    />
                  </div>
                  
                  <div className="config-item">
                    <label>Notti Minime</label>
                    <input 
                      type="number" 
                      min="1"
                      value={pricingConfig.minimumNights}
                      onChange={(e) => handleUpdatePricingConfig({
                        ...pricingConfig,
                        minimumNights: parseInt(e.target.value)
                      })}
                    />
                  </div>
                  
                  <div className="config-item">
                    <label>Percentuale Deposito (%)</label>
                    <input 
                      type="number" 
                      step="0.01"
                      min="0"
                      max="1"
                      value={pricingConfig.depositPercentage}
                      onChange={(e) => handleUpdatePricingConfig({
                        ...pricingConfig,
                        depositPercentage: parseFloat(e.target.value)
                      })}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminPanelPro;