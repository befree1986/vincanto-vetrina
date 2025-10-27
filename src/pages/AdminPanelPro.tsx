/* eslint-disable jsx-a11y/label-has-associated-control, jsx-a11y/no-autofocus */
import React, { useState, useEffect } from 'react';
import './AdminPanelPro.css';
import '../styles/AdminSuperAdmin.css';
import * as AdminAPI from '../services/adminApi';

const AdminPanelPro: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [activeSubTab, setActiveSubTab] = useState('pricing');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Stati per gestione dati con API reali
  const [dashboardStats, setDashboardStats] = useState<AdminAPI.DashboardStats | null>(null);
  const [calendars, setCalendars] = useState<AdminAPI.AdminCalendar[]>([]);
  const [bookings, setBookings] = useState<AdminAPI.AdminBooking[]>([]);
  const [blockedDates, setBlockedDates] = useState<AdminAPI.BlockedDate[]>([]);
  const [pricingConfig, setPricingConfig] = useState<AdminAPI.PricingConfig | null>(null);
  const [notifications, setNotifications] = useState<AdminAPI.AdminNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  
  // Stati SuperAdmin
  const [newCalendar, setNewCalendar] = useState({
    name: '',
    platform: '',
    url: ''
  });
  const [editingBooking, setEditingBooking] = useState<string | null>(null);
  const [editBookingData, setEditBookingData] = useState<any>({});
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [templateData, setTemplateData] = useState({
    subject: '',
    htmlContent: ''
  });

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

  // === FUNZIONI SUPERADMIN AVANZATE ===
  
  // Gestione Prezzi
  const savePricingConfig = async () => {
    try {
      if (pricingConfig) {
        await AdminAPI.updatePricingConfig(pricingConfig);
        alert('✅ Configurazione prezzi salvata con successo!');
      }
    } catch (error) {
      console.error('Errore salvataggio configurazione prezzi:', error);
      alert('❌ Errore nel salvataggio configurazione prezzi');
    }
  };

  // Gestione Calendari
  const addNewCalendar = async () => {
    try {
      if (newCalendar.name && newCalendar.platform) {
        await AdminAPI.createCalendar({
          name: newCalendar.name,
          platform: newCalendar.platform,
          url: newCalendar.url || null,
          isActive: true
        });
        
        await loadCalendars();
        setNewCalendar({ name: '', platform: '', url: '' });
        alert('✅ Calendario aggiunto con successo!');
      } else {
        alert('⚠️ Inserire almeno nome e piattaforma');
      }
    } catch (error) {
      console.error('Errore aggiunta calendario:', error);
      alert('❌ Errore nell\'aggiunta del calendario');
    }
  };

  const updateCalendarName = async (calendarId: string, newName: string) => {
    try {
      await AdminAPI.updateCalendar(calendarId, { name: newName });
      setCalendars(calendars.map(cal => 
        cal.id === calendarId ? { ...cal, name: newName } : cal
      ));
    } catch (error) {
      console.error('Errore aggiornamento nome calendario:', error);
    }
  };

  const toggleCalendarStatus = async (calendarId: string) => {
    try {
      const calendar = calendars.find(cal => cal.id === calendarId);
      if (calendar) {
        const newStatus = !calendar.isActive;
        await AdminAPI.updateCalendar(calendarId, { isActive: newStatus });
        setCalendars(calendars.map(cal => 
          cal.id === calendarId ? { ...cal, isActive: newStatus } : cal
        ));
      }
    } catch (error) {
      console.error('Errore toggle status calendario:', error);
    }
  };

  const updateSyncFrequency = async (calendarId: string, frequency: number) => {
    try {
      await AdminAPI.updateCalendar(calendarId, { syncFrequency: frequency });
      setCalendars(calendars.map(cal => 
        cal.id === calendarId ? { ...cal, syncFrequency: frequency } : cal
      ));
    } catch (error) {
      console.error('Errore aggiornamento frequenza sync:', error);
    }
  };

  const syncCalendarNow = async (calendarId: string) => {
    try {
      await AdminAPI.syncCalendar(calendarId);
      await loadCalendars();
      alert('✅ Sincronizzazione completata!');
    } catch (error) {
      console.error('Errore sincronizzazione calendario:', error);
      alert('❌ Errore nella sincronizzazione');
    }
  };

  const deleteCalendar = async (calendarId: string) => {
    if (window.confirm('Sei sicuro di voler eliminare questo calendario?')) {
      try {
        await AdminAPI.deleteCalendar(calendarId);
        setCalendars(calendars.filter(cal => cal.id !== calendarId));
        alert('✅ Calendario eliminato con successo!');
      } catch (error) {
        console.error('Errore eliminazione calendario:', error);
        alert('❌ Errore nell\'eliminazione del calendario');
      }
    }
  };

  // Gestione Prenotazioni
  const exportBookings = async () => {
    try {
      const exportData = await AdminAPI.exportData('bookings');
      const dataStr = JSON.stringify(exportData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `prenotazioni_${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Errore esportazione prenotazioni:', error);
      alert('❌ Errore nell\'esportazione');
    }
  };

  const startEditBooking = (booking: AdminAPI.AdminBooking) => {
    setEditingBooking(booking.id);
    setEditBookingData({
      guestName: booking.guestName,
      guestEmail: booking.guestEmail,
      guestPhone: booking.guestPhone,
      checkIn: booking.checkIn.split('T')[0],
      checkOut: booking.checkOut.split('T')[0],
      guests: booking.guests,
      status: booking.status,
      totalAmount: booking.totalAmount
    });
  };

  const saveBookingEdit = async (bookingId: string) => {
    try {
      await AdminAPI.updateBooking(bookingId, editBookingData);
      await loadBookings();
      setEditingBooking(null);
      setEditBookingData({});
      alert('✅ Prenotazione aggiornata con successo!');
    } catch (error) {
      console.error('Errore aggiornamento prenotazione:', error);
      alert('❌ Errore nell\'aggiornamento della prenotazione');
    }
  };

  const cancelBookingEdit = () => {
    setEditingBooking(null);
    setEditBookingData({});
  };

  const sendBookingEmail = async (bookingId: string, templateType: string) => {
    try {
      await AdminAPI.sendBookingEmail(bookingId, templateType);
      alert(`✅ Email ${templateType} inviata con successo!`);
    } catch (error) {
      console.error('Errore invio email:', error);
      alert('❌ Errore nell\'invio dell\'email');
    }
  };

  const getStatusLabel = (status: string) => {
    const labels = {
      'pending': 'In Attesa',
      'confirmed': 'Confermata', 
      'cancelled': 'Cancellata',
      'completed': 'Completata'
    };
    return labels[status as keyof typeof labels] || status;
  };

  // Gestione Template Email
  const saveEmailTemplate = async () => {
    try {
      if (selectedTemplate && templateData.subject && templateData.htmlContent) {
        await AdminAPI.saveEmailTemplate(selectedTemplate, templateData);
        alert('✅ Template email salvato con successo!');
      } else {
        alert('⚠️ Inserire tutti i campi richiesti');
      }
    } catch (error) {
      console.error('Errore salvataggio template:', error);
      alert('❌ Errore nel salvataggio del template');
    }
  };

  const previewEmailTemplate = () => {
    if (templateData.htmlContent) {
      const previewWindow = window.open('', '_blank');
      previewWindow?.document.write(`
        <html>
          <head><title>Anteprima Email</title></head>
          <body style="font-family: Arial, sans-serif; padding: 20px;">
            <h1>${templateData.subject}</h1>
            ${templateData.htmlContent}
          </body>
        </html>
      `);
    }
  };

  const testEmailTemplate = async () => {
    try {
      if (selectedTemplate && templateData.subject && templateData.htmlContent) {
        await AdminAPI.testEmailTemplate(selectedTemplate, templateData);
        alert('✅ Email di test inviata!');
      }
    } catch (error) {
      console.error('Errore invio email di test:', error);
      alert('❌ Errore nell\'invio dell\'email di test');
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

        {/* SuperAdmin - Configurazione Avanzata Completa */}
        {activeTab === 'config' && (
          <div className="admin-superadmin">
            <h2>⚡ SuperAdmin Configuration</h2>
            
            {/* Navigazione Sub-tabs per SuperAdmin */}
            <div className="superadmin-nav">
              <button 
                className={`superadmin-tab ${activeSubTab === 'pricing' ? 'active' : ''}`}
                onClick={() => setActiveSubTab('pricing')}
              >
                💰 Prezzi
              </button>
              <button 
                className={`superadmin-tab ${activeSubTab === 'calendars-mgmt' ? 'active' : ''}`}
                onClick={() => setActiveSubTab('calendars-mgmt')}
              >
                🗓️ Calendari
              </button>
              <button 
                className={`superadmin-tab ${activeSubTab === 'bookings-mgmt' ? 'active' : ''}`}
                onClick={() => setActiveSubTab('bookings-mgmt')}
              >
                📋 Prenotazioni
              </button>
              <button 
                className={`superadmin-tab ${activeSubTab === 'payments' ? 'active' : ''}`}
                onClick={() => setActiveSubTab('payments')}
              >
                💳 Pagamenti
              </button>
              <button 
                className={`superadmin-tab ${activeSubTab === 'emails' ? 'active' : ''}`}
                onClick={() => setActiveSubTab('emails')}
              >
                📧 Email
              </button>
              <button 
                className={`superadmin-tab ${activeSubTab === 'settings' ? 'active' : ''}`}
                onClick={() => setActiveSubTab('settings')}
              >
                ⚙️ Sistema
              </button>
            </div>

            {/* Configurazione Prezzi */}
            {activeSubTab === 'pricing' && pricingConfig && (
              <div className="admin-section">
                <h3>💰 Configurazione Prezzi e Tariffe</h3>
                <div className="config-form">
                  <div className="config-row">
                    <div className="config-item">
                      <label htmlFor="basePrice">Prezzo Base (per notte)</label>
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
                  </div>
                  
                  <div className="config-row">
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
                  </div>
                  
                  <div className="config-row">
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
                  
                  <button 
                    className="admin-btn-primary"
                    onClick={() => savePricingConfig()}
                  >
                    💾 Salva Configurazione Prezzi
                  </button>
                </div>
              </div>
            )}

            {/* Gestione Calendari Avanzata */}
            {activeSubTab === 'calendars-mgmt' && (
              <div className="admin-section">
                <h3>🗓️ Gestione Avanzata Calendari</h3>
                
                {/* Aggiungi Nuovo Calendario */}
                <div className="add-calendar-form">
                  <h4>➕ Aggiungi Nuovo Calendario</h4>
                  <div className="config-form">
                    <div className="config-row">
                      <div className="config-item">
                        <label>Nome Calendario</label>
                        <input 
                          type="text" 
                          placeholder="es. Airbnb Principale"
                          value={newCalendar.name}
                          onChange={(e) => setNewCalendar({...newCalendar, name: e.target.value})}
                        />
                      </div>
                      <div className="config-item">
                        <label>Piattaforma</label>
                        <select 
                          value={newCalendar.platform}
                          onChange={(e) => setNewCalendar({...newCalendar, platform: e.target.value})}
                          aria-label="Seleziona piattaforma calendario"
                        >
                          <option value="">Seleziona Piattaforma</option>
                          <option value="airbnb">Airbnb</option>
                          <option value="booking_com">Booking.com</option>
                          <option value="vrbo">VRBO</option>
                          <option value="manual">Manuale</option>
                        </select>
                      </div>
                    </div>
                    
                    <div className="config-item">
                      <label>URL Calendar iCal</label>
                      <input 
                        type="url" 
                        placeholder="https://calendar.airbnb.com/calendar/ical/..."
                        value={newCalendar.url}
                        onChange={(e) => setNewCalendar({...newCalendar, url: e.target.value})}
                      />
                    </div>
                    
                    <button 
                      className="admin-btn-primary"
                      onClick={() => addNewCalendar()}
                    >
                      ➕ Aggiungi Calendario
                    </button>
                  </div>
                </div>
                
                {/* Lista Calendari con Gestione */}
                <div className="calendars-management">
                  <h4>📋 Calendari Esistenti</h4>
                  <div className="admin-table-container">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Nome</th>
                          <th>Piattaforma</th>
                          <th>Stato</th>
                          <th>Ultima Sync</th>
                          <th>Freq. Sync</th>
                          <th>Azioni</th>
                        </tr>
                      </thead>
                      <tbody>
                        {calendars.map(calendar => (
                          <tr key={calendar.id}>
                            <td>
                              <input 
                                type="text" 
                                value={calendar.name}
                                onChange={(e) => updateCalendarName(calendar.id, e.target.value)}
                                className="inline-edit"
                                aria-label="Nome calendario"
                                title="Modifica nome calendario"
                              />
                            </td>
                            <td>{calendar.platform}</td>
                            <td>
                              <button 
                                className={`status-toggle ${calendar.isActive ? 'active' : 'inactive'}`}
                                onClick={() => toggleCalendarStatus(calendar.id)}
                              >
                                {calendar.isActive ? '✅ Attivo' : '❌ Inattivo'}
                              </button>
                            </td>
                            <td>{calendar.lastSync ? new Date(calendar.lastSync).toLocaleString() : 'Mai'}</td>
                            <td>
                              <select 
                                value={calendar.syncFrequency || 60}
                                onChange={(e) => updateSyncFrequency(calendar.id, parseInt(e.target.value))}
                                aria-label="Frequenza sincronizzazione"
                              >
                                <option value={15}>15 min</option>
                                <option value={30}>30 min</option>
                                <option value={60}>1 ora</option>
                                <option value={180}>3 ore</option>
                                <option value={360}>6 ore</option>
                              </select>
                            </td>
                            <td>
                              <div className="action-buttons">
                                <button 
                                  className="admin-btn-small"
                                  onClick={() => syncCalendarNow(calendar.id)}
                                >
                                  🔄 Sync
                                </button>
                                <button 
                                  className="admin-btn-small danger"
                                  onClick={() => deleteCalendar(calendar.id)}
                                >
                                  🗑️ Elimina
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Gestione Prenotazioni Avanzata */}
            {activeSubTab === 'bookings-mgmt' && (
              <div className="admin-section">
                <h3>📋 Gestione Avanzata Prenotazioni</h3>
                
                {/* Azioni Rapide */}
                <div className="quick-actions">
                  <button 
                    className="admin-btn-primary"
                    onClick={() => alert('Funzionalità in sviluppo')}
                  >
                    ➕ Nuova Prenotazione
                  </button>
                  <button 
                    className="admin-btn-secondary"
                    onClick={() => exportBookings()}
                  >
                    📊 Esporta Prenotazioni
                  </button>
                </div>
                
                {/* Tabella Prenotazioni Editabile */}
                <div className="bookings-management">
                  <div className="admin-table-container">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>ID</th>
                          <th>Ospite</th>
                          <th>Email</th>
                          <th>Telefono</th>
                          <th>Check-in</th>
                          <th>Check-out</th>
                          <th>Ospiti</th>
                          <th>Stato</th>
                          <th>Importo</th>
                          <th>Piattaforma</th>
                          <th>Azioni</th>
                        </tr>
                      </thead>
                      <tbody>
                        {bookings.map(booking => (
                          <tr key={booking.id} className={editingBooking === booking.id ? 'editing' : ''}>
                            <td>{booking.id}</td>
                            <td>
                              {editingBooking === booking.id ? (
                                <input 
                                  type="text"
                                  value={editBookingData.guestName}
                                  onChange={(e) => setEditBookingData({...editBookingData, guestName: e.target.value})}
                                />
                              ) : (
                                booking.guestName
                              )}
                            </td>
                            <td>
                              {editingBooking === booking.id ? (
                                <input 
                                  type="email"
                                  value={editBookingData.guestEmail}
                                  onChange={(e) => setEditBookingData({...editBookingData, guestEmail: e.target.value})}
                                />
                              ) : (
                                booking.guestEmail
                              )}
                            </td>
                            <td>
                              {editingBooking === booking.id ? (
                                <input 
                                  type="tel"
                                  value={editBookingData.guestPhone}
                                  onChange={(e) => setEditBookingData({...editBookingData, guestPhone: e.target.value})}
                                />
                              ) : (
                                booking.guestPhone
                              )}
                            </td>
                            <td>
                              {editingBooking === booking.id ? (
                                <input 
                                  type="date"
                                  value={editBookingData.checkIn}
                                  onChange={(e) => setEditBookingData({...editBookingData, checkIn: e.target.value})}
                                />
                              ) : (
                                new Date(booking.checkIn).toLocaleDateString()
                              )}
                            </td>
                            <td>
                              {editingBooking === booking.id ? (
                                <input 
                                  type="date"
                                  value={editBookingData.checkOut}
                                  onChange={(e) => setEditBookingData({...editBookingData, checkOut: e.target.value})}
                                />
                              ) : (
                                new Date(booking.checkOut).toLocaleDateString()
                              )}
                            </td>
                            <td>
                              {editingBooking === booking.id ? (
                                <input 
                                  type="number"
                                  min="1"
                                  value={editBookingData.guests}
                                  onChange={(e) => setEditBookingData({...editBookingData, guests: parseInt(e.target.value)})}
                                />
                              ) : (
                                booking.guests
                              )}
                            </td>
                            <td>
                              {editingBooking === booking.id ? (
                                <select 
                                  value={editBookingData.status}
                                  onChange={(e) => setEditBookingData({...editBookingData, status: e.target.value})}
                                  aria-label="Stato prenotazione"
                                >
                                  <option value="pending">In Attesa</option>
                                  <option value="confirmed">Confermata</option>
                                  <option value="cancelled">Cancellata</option>
                                  <option value="completed">Completata</option>
                                </select>
                              ) : (
                                <span className={`status-badge ${booking.status}`}>
                                  {getStatusLabel(booking.status)}
                                </span>
                              )}
                            </td>
                            <td>
                              {editingBooking === booking.id ? (
                                <input 
                                  type="number"
                                  step="0.01"
                                  value={editBookingData.totalAmount}
                                  onChange={(e) => setEditBookingData({...editBookingData, totalAmount: parseFloat(e.target.value)})}
                                />
                              ) : (
                                `€${booking.totalAmount.toFixed(2)}`
                              )}
                            </td>
                            <td>{booking.platform}</td>
                            <td>
                              <div className="action-buttons">
                                {editingBooking === booking.id ? (
                                  <>
                                    <button 
                                      className="admin-btn-small success"
                                      onClick={() => saveBookingEdit(booking.id)}
                                    >
                                      ✅ Salva
                                    </button>
                                    <button 
                                      className="admin-btn-small"
                                      onClick={() => cancelBookingEdit()}
                                    >
                                      ❌ Annulla
                                    </button>
                                  </>
                                ) : (
                                  <>
                                    <button 
                                      className="admin-btn-small"
                                      onClick={() => startEditBooking(booking)}
                                    >
                                      ✏️ Modifica
                                    </button>
                                    <button 
                                      className="admin-btn-small"
                                      onClick={() => sendBookingEmail(booking.id, 'confirmation')}
                                    >
                                      📧 Email
                                    </button>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Gestione Metodi di Pagamento */}
            {activeSubTab === 'payments' && (
              <div className="admin-section">
                <h3>💳 Gestione Metodi di Pagamento</h3>
                
                <div className="payment-methods">
                  <div className="method-card">
                    <h4>💳 Stripe</h4>
                    <div className="config-form">
                      <div className="config-item">
                        <label>Stripe Public Key</label>
                        <input type="text" placeholder="pk_live_..." />
                      </div>
                      <div className="config-item">
                        <label>Stripe Secret Key</label>
                        <input type="password" placeholder="sk_live_..." />
                      </div>
                      <div className="config-item">
                        <label>Commissione (%)</label>
                        <input type="number" step="0.01" defaultValue="2.9" />
                      </div>
                      <button className="admin-btn-primary">💾 Salva Stripe</button>
                    </div>
                  </div>
                  
                  <div className="method-card">
                    <h4>🅿️ PayPal</h4>
                    <div className="config-form">
                      <div className="config-item">
                        <label>PayPal Client ID</label>
                        <input type="text" placeholder="Client ID PayPal" />
                      </div>
                      <div className="config-item">
                        <label>PayPal Client Secret</label>
                        <input type="password" placeholder="Client Secret" />
                      </div>
                      <div className="config-item">
                        <label>Commissione (%)</label>
                        <input type="number" step="0.01" defaultValue="3.4" />
                      </div>
                      <button className="admin-btn-primary">💾 Salva PayPal</button>
                    </div>
                  </div>
                  
                  <div className="method-card">
                    <h4>🏦 Bonifico Bancario</h4>
                    <div className="config-form">
                      <div className="config-item">
                        <label>IBAN</label>
                        <input type="text" placeholder="IT60 X054 2811 1010 0000 0123 456" />
                      </div>
                      <div className="config-item">
                        <label>Intestatario</label>
                        <input type="text" placeholder="Nome Intestatario" />
                      </div>
                      <div className="config-item">
                        <label>Banca</label>
                        <input type="text" placeholder="Nome Banca" />
                      </div>
                      <button className="admin-btn-primary">💾 Salva Bonifico</button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Gestione Template Email */}
            {activeSubTab === 'emails' && (
              <div className="admin-section">
                <h3>📧 Gestione Template Email</h3>
                
                <div className="email-templates">
                  <div className="template-selector">
                    <label>Seleziona Template</label>
                    <select 
                      value={selectedTemplate}
                      onChange={(e) => setSelectedTemplate(e.target.value)}
                      aria-label="Seleziona template email"
                    >
                      <option value="">Seleziona Template</option>
                      <option value="booking_confirmation">Conferma Prenotazione</option>
                      <option value="booking_reminder">Promemoria Check-in</option>
                      <option value="payment_reminder">Promemoria Pagamento</option>
                      <option value="checkout_instructions">Istruzioni Check-out</option>
                      <option value="cancellation">Cancellazione</option>
                    </select>
                  </div>
                  
                  {selectedTemplate && (
                    <div className="template-editor">
                      <div className="template-form">
                        <div className="config-item">
                          <label>Oggetto Email</label>
                          <input 
                            type="text" 
                            placeholder="Oggetto dell'email"
                            value={templateData.subject}
                            onChange={(e) => setTemplateData({...templateData, subject: e.target.value})}
                          />
                        </div>
                        
                        <div className="config-item">
                          <label>Contenuto HTML</label>
                          <textarea 
                            rows={10}
                            placeholder="Contenuto dell'email in HTML"
                            value={templateData.htmlContent}
                            onChange={(e) => setTemplateData({...templateData, htmlContent: e.target.value})}
                          />
                        </div>
                        
                        <div className="template-variables">
                          <h5>Variabili Disponibili:</h5>
                          <div className="variables-list">
                            <span className="variable">{'{{guest_name}}'}</span>
                            <span className="variable">{'{{check_in_date}}'}</span>
                            <span className="variable">{'{{check_out_date}}'}</span>
                            <span className="variable">{'{{total_amount}}'}</span>
                            <span className="variable">{'{{confirmation_code}}'}</span>
                            <span className="variable">{'{{property_address}}'}</span>
                          </div>
                        </div>
                        
                        <div className="template-actions">
                          <button 
                            className="admin-btn-primary"
                            onClick={() => saveEmailTemplate()}
                          >
                            💾 Salva Template
                          </button>
                          <button 
                            className="admin-btn-secondary"
                            onClick={() => previewEmailTemplate()}
                          >
                            👁️ Anteprima
                          </button>
                          <button 
                            className="admin-btn-secondary"
                            onClick={() => testEmailTemplate()}
                          >
                            📧 Test Email
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Impostazioni Sistema */}
            {activeSubTab === 'settings' && (
              <div className="admin-section">
                <h3>⚙️ Impostazioni Sistema</h3>
                
                <div className="system-settings">
                  <div className="setting-group">
                    <h4>🏠 Informazioni Proprietà</h4>
                    <div className="config-form">
                      <div className="config-item">
                        <label>Nome Proprietà</label>
                        <input type="text" defaultValue="Vincanto Maori" />
                      </div>
                      <div className="config-item">
                        <label>Indirizzo</label>
                        <input type="text" placeholder="Via, Città, CAP" />
                      </div>
                      <div className="config-item">
                        <label>Telefono</label>
                        <input type="tel" placeholder="+39 123 456 789" />
                      </div>
                      <div className="config-item">
                        <label>Email</label>
                        <input type="email" placeholder="info@vincanto.com" />
                      </div>
                    </div>
                  </div>
                  
                  <div className="setting-group">
                    <h4>🕐 Check-in / Check-out</h4>
                    <div className="config-form">
                      <div className="config-row">
                        <div className="config-item">
                          <label>Orario Check-in</label>
                          <input type="time" defaultValue="15:00" />
                        </div>
                        <div className="config-item">
                          <label>Orario Check-out</label>
                          <input type="time" defaultValue="11:00" />
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="setting-group">
                    <h4>🔄 Automazioni</h4>
                    <div className="config-form">
                      <div className="config-item checkbox-item">
                        <label>
                          <input type="checkbox" defaultChecked />
                          Conferma automatica prenotazioni
                        </label>
                      </div>
                      <div className="config-item checkbox-item">
                        <label>
                          <input type="checkbox" defaultChecked />
                          Email automatiche di benvenuto
                        </label>
                      </div>
                      <div className="config-item checkbox-item">
                        <label>
                          <input type="checkbox" />
                          Promemoria pagamento automatici
                        </label>
                      </div>
                      <div className="config-item checkbox-item">
                        <label>
                          <input type="checkbox" defaultChecked />
                          Sincronizzazione calendari automatica
                        </label>
                      </div>
                    </div>
                  </div>
                  
                  <button className="admin-btn-primary">💾 Salva Impostazioni</button>
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