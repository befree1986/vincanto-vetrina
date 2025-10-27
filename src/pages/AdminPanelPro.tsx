import React, { useState, useEffect } from 'react';
import './AdminPanelPro.css';
import * as AdminAPI from '../services/adminApi';

const AdminPanelPro: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Tutti i pannelli sempre disponibili (SuperAdmin sempre attivo)
  
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
  const handleSyncCalendar = async (calendarId: string) => {
    try {
      await AdminAPI.syncCalendar(calendarId);
      await loadCalendars();
    } catch (error) {
      console.error('Errore sincronizzazione calendario:', error);
      setError('Errore nella sincronizzazione del calendario');
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
            
            {/* Indicatore SuperAdmin attivo */}
            <div className="admin-super-indicator" title="Modalità SuperAdmin Attiva">
              ⚡ SuperAdmin
            </div>
            
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

      {/* Navigazione Tab Completa */}
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
          
          <button 
            className={`admin-nav-item ${activeTab === 'analytics' ? 'active' : ''}`}
            onClick={() => setActiveTab('analytics')}
          >
            📈 Analytics
          </button>
          
          <button 
            className={`admin-nav-item ${activeTab === 'notifications' ? 'active' : ''}`}
            onClick={() => setActiveTab('notifications')}
          >
            🔔 Notifiche
          </button>
          
          <button 
            className={`admin-nav-item ${activeTab === 'export' ? 'active' : ''}`}
            onClick={() => setActiveTab('export')}
          >
            💾 Esporta
          </button>
          
          <button 
            className={`admin-nav-item super-admin ${activeTab === 'config' ? 'active' : ''}`}
            onClick={() => setActiveTab('config')}
          >
            ⚡ SuperAdmin
          </button>
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

        {/* Analytics */}
        {activeTab === 'analytics' && (
          <div className="admin-analytics">
            <h2>📈 Analytics e Statistiche</h2>
            
            <div className="admin-section">
              <h3>📊 Panoramica Performance</h3>
              <div className="admin-stats-grid">
                <div className="admin-stat-card">
                  <h3>Tasso di Occupazione</h3>
                  <div className="stat-value">87%</div>
                </div>
                <div className="admin-stat-card">
                  <h3>Revenue per Notte</h3>
                  <div className="stat-value">€142</div>
                </div>
                <div className="admin-stat-card">
                  <h3>Giorni Prenotati (30gg)</h3>
                  <div className="stat-value">26</div>
                </div>
                <div className="admin-stat-card">
                  <h3>Rating Medio</h3>
                  <div className="stat-value">4.8⭐</div>
                </div>
              </div>
              
              <div className="analytics-charts">
                <div className="chart-placeholder">
                  📊 Grafici Analytics (Integration con Chart.js)
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Notifiche */}
        {activeTab === 'notifications' && (
          <div className="admin-notifications-panel">
            <h2>🔔 Centro Notifiche</h2>
            
            <div className="admin-section">
              <div className="notifications-header">
                <h3>Notifiche Recenti ({unreadCount} non lette)</h3>
                <button className="admin-btn-secondary">Segna tutte come lette</button>
              </div>
              
              <div className="notifications-list">
                {notifications.length === 0 ? (
                  <div className="empty-state">
                    <p>✅ Tutte le notifiche sono state lette</p>
                  </div>
                ) : (
                  notifications.map(notification => (
                    <div key={notification.id} className={`notification-item ${notification.read ? 'read' : 'unread'}`}>
                      <div className="notification-icon">
                        {notification.type === 'booking' && '📅'}
                        {notification.type === 'calendar' && '🗓️'}
                        {notification.type === 'system' && '⚙️'}
                        {notification.type === 'payment' && '💳'}
                      </div>
                      <div className="notification-content">
                        <h4>{notification.title}</h4>
                        <p>{notification.message}</p>
                        <small>{new Date(notification.timestamp).toLocaleString()}</small>
                      </div>
                      {!notification.read && <div className="unread-indicator"></div>}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* Esportazione Dati */}
        {activeTab === 'export' && (
          <div className="admin-export">
            <h2>💾 Esportazione Dati</h2>
            
            <div className="admin-section">
              <h3>📋 Esporta Report</h3>
              <div className="export-options">
                <div className="export-card">
                  <h4>📅 Report Prenotazioni</h4>
                  <p>Esporta tutte le prenotazioni con dettagli completi</p>
                  <button className="admin-btn-primary">Esporta Excel</button>
                  <button className="admin-btn-secondary">Esporta PDF</button>
                </div>
                
                <div className="export-card">
                  <h4>💰 Report Ricavi</h4>
                  <p>Analisi finanziaria dettagliata per periodo</p>
                  <button className="admin-btn-primary">Esporta Excel</button>
                  <button className="admin-btn-secondary">Esporta PDF</button>
                </div>
                
                <div className="export-card">
                  <h4>🗓️ Report Calendario</h4>
                  <p>Disponibilità e occupazione per periodo</p>
                  <button className="admin-btn-primary">Esporta Excel</button>
                  <button className="admin-btn-secondary">Esporta PDF</button>
                </div>
                
                <div className="export-card">
                  <h4>👥 Report Ospiti</h4>
                  <p>Database completo degli ospiti e statistiche</p>
                  <button className="admin-btn-primary">Esporta Excel</button>
                  <button className="admin-btn-secondary">Esporta PDF</button>
                </div>
              </div>
              
              <div className="backup-section">
                <h3>💾 Backup Completo</h3>
                <p>Crea un backup completo di tutti i dati del sistema</p>
                <button className="admin-btn-danger">Genera Backup Completo</button>
              </div>
            </div>
          </div>
        )}

        {/* SuperAdmin Configuration */}
        {activeTab === 'config' && (
          <div className="admin-config">
            <h2>⚡ SuperAdmin Configuration</h2>
            
            {/* Configurazione Prezzi */}
            {pricingConfig && (
              <div className="admin-section">
                <h3>💰 Configurazione Prezzi</h3>
                <div className="config-grid">
                  <div className="config-item">
                    <label htmlFor="basePrice">Prezzo Base (notte)</label>
                    <input 
                      id="basePrice"
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
                    <label htmlFor="additionalGuestPrice">Prezzo Ospite Aggiuntivo</label>
                    <input 
                      id="additionalGuestPrice"
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
                    <label htmlFor="cleaningFee">Tassa di Pulizia</label>
                    <input 
                      id="cleaningFee"
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
                    <label htmlFor="parkingFee">Parcheggio (per notte)</label>
                    <input 
                      id="parkingFee"
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
                    <label htmlFor="minimumNights">Notti Minime</label>
                    <input 
                      id="minimumNights"
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
                    <label htmlFor="depositPercentage">Percentuale Deposito (%)</label>
                    <input 
                      id="depositPercentage"
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