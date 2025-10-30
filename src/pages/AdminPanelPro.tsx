/* eslint-disable jsx-a11y/label-has-associated-control, jsx-a11y/no-autofocus */
import React, { useState, useEffect } from 'react';
import './AdminPanelPro.css';
import '../styles/AdminSuperAdmin.css';
import GoogleCalendarService, { type CalendarEvent } from '../services/googleCalendarService';
// import GoogleCalendarApiService from '../services/googleCalendarApiService';
import GoogleCalendarAuth from '../components/GoogleCalendarAuth';
import MockBookingService from '../services/mockBookingService';
import AdminApiService from '../services/adminApiService';

const AdminPanelPro: React.FC = () => {
  console.log('🚀 AdminPanelPro component rendering...');
  
  // Stati principali
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Stati Google Calendar
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [calendarStats, setCalendarStats] = useState({
    totalBookings: 0,
    thisMonth: 0,
    nextMonth: 0,
    occupancyRate: 0,
    revenueThisMonth: 0
  });
  const [isLoadingCalendar, setIsLoadingCalendar] = useState(false);
  
  // Stati per prenotazioni e pagamenti
  const [recentBookings, setRecentBookings] = useState<any[]>([]);
  const [paymentTransactions, setPaymentTransactions] = useState<any[]>([]);
  
  // Servizi Google Calendar con lazy initialization
  const [calendarService] = useState(() => {
    try {
      console.log('📅 Inizializzazione GoogleCalendarService...');
      return new GoogleCalendarService();
    } catch (error) {
      console.error('❌ Errore GoogleCalendarService:', error);
      return null;
    }
  });

  // Servizio Admin API
  const [adminApiService] = useState(() => {
    try {
      console.log('🔌 Inizializzazione AdminApiService...');
      return new AdminApiService();
    } catch (error) {
      console.error('❌ Errore AdminApiService:', error);
      return null;
    }
  });

  // Stati per i dati API
  const [dashboardStats, setDashboardStats] = useState<any>({});
  const [realBookings, setRealBookings] = useState<any[]>([]);
  const [pricingConfig, setPricingConfig] = useState<any>({});
  const [systemSettings, setSystemSettings] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  
  // Servizio API - temporaneamente commentato
  // const [calendarApiService] = useState(() => {
  //   try {
  //     console.log('📅 Inizializzazione GoogleCalendarApiService...');
  //     return new GoogleCalendarApiService();
  //   } catch (error) {
  //     console.error('❌ Errore GoogleCalendarApiService:', error);
  //     return null;
  //   }
  // });
  
  // Stati autenticazione admin
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  
  // Stati autenticazione Google
  const [isGoogleAuthenticated, setIsGoogleAuthenticated] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Effect per caricare dati all'avvio
  useEffect(() => {
    if (isAuthenticated) {
      loadRealApiData();
    }
  }, [isAuthenticated]);
  
  // === AUTENTICAZIONE ===
  const handleLogin = async () => {
    console.log('🔐 Tentativo di login...');
    if (password === 'vincanto2025') {
      console.log('✅ Login riuscito, imposto autenticazione...');
      setIsAuthenticated(true);
      setError('');
      console.log('🎯 Stato autenticazione impostato');
      // Carica dati calendario dopo il login
      loadCalendarData();
    } else {
      console.log('❌ Password errata');
      setError('Password non corretta');
    }
  };

  // === FUNZIONI GOOGLE CALENDAR ===
  
  // Carica i dati del calendario
  const loadCalendarData = async () => {
    if (!calendarService) {
      console.warn('⚠️ CalendarService non disponibile');
      return;
    }
    
    setIsLoadingCalendar(true);
    try {
      const [events, stats] = await Promise.all([
        calendarService.fetchCalendarEvents(),
        calendarService.getCalendarStats()
      ]);
      
      setCalendarEvents(events);
      setCalendarStats(stats);
      
      // Carica anche dati mock per prenotazioni e pagamenti
      setRecentBookings(MockBookingService.getRecentBookings());
      setPaymentTransactions(MockBookingService.getPaymentTransactions());
      
      // Carica dati reali dalle API
      loadRealApiData();
      
      console.log('📅 Dati calendario caricati:', { eventsCount: events.length, stats });
    } catch (error) {
      console.error('❌ Errore nel caricamento calendario:', error);
    } finally {
      setIsLoadingCalendar(false);
    }
  };

  // Carica dati reali dalle API backend
  const loadRealApiData = async () => {
    if (!adminApiService) {
      console.warn('⚠️ AdminApiService non disponibile');
      return;
    }

    try {
      console.log('🔄 Caricamento dati API reali...');
      
      // Carica tutti i dati in parallelo
      const [
        statsData,
        bookingsData,
        pricingData,
        settingsData,
        analyticsData,
        notificationsData
      ] = await Promise.all([
        adminApiService.getDashboardStats(),
        adminApiService.getBookings(),
        adminApiService.getPricingConfig(),
        adminApiService.getSystemSettings(),
        adminApiService.getAnalytics(),
        adminApiService.getNotifications()
      ]);

      // Aggiorna gli stati
      setDashboardStats(statsData);
      setRealBookings(bookingsData);
      setPricingConfig(pricingData);
      setSystemSettings(settingsData);
      setAnalytics(analyticsData);
      setNotifications(notificationsData);

      console.log('✅ Dati API reali caricati:', {
        stats: statsData,
        bookings: bookingsData.length,
        settings: settingsData.length,
        analytics: analyticsData.length,
        notifications: notificationsData.length
      });
    } catch (error) {
      console.error('❌ Errore nel caricamento dati API:', error);
    }
  };

  // Test connessione calendario
  const testCalendarConnection = async () => {
    if (!calendarService) {
      console.warn('⚠️ CalendarService non disponibile per test connessione');
      return;
    }
    
    const statusElement = document.getElementById('calendar-connection-status');
    if (statusElement) {
      statusElement.textContent = '🔄 Test in corso...';
      statusElement.className = 'sync-indicator pending';
    }

    try {
      const events = await calendarService.fetchCalendarEvents();
      if (statusElement) {
        statusElement.textContent = `✅ Connessione OK - ${events.length} eventi trovati`;
        statusElement.className = 'sync-indicator success';
      }
    } catch (error) {
      if (statusElement) {
        statusElement.textContent = '❌ Errore di connessione';
        statusElement.className = 'sync-indicator error';
      }
    }
  };

  // Forza sincronizzazione calendario
  const forceSyncCalendar = async () => {
    console.log('🔄 Forzando sincronizzazione calendario...');
    await loadCalendarData();
  };

  // === FUNZIONI GOOGLE AUTH ===
  
  const handleGoogleAuthSuccess = (authenticated: boolean) => {
    setIsGoogleAuthenticated(authenticated);
    setAuthError(null);
    
    if (authenticated) {
      console.log('✅ Google Calendar autenticato con successo');
      // Ricarica i dati del calendario con le API complete
      loadCalendarData();
    }
  };

  const handleGoogleAuthError = (error: string) => {
    setAuthError(error);
    setIsGoogleAuthenticated(false);
    console.error('❌ Errore autenticazione Google:', error);
  };

  // Effetto per controllare autenticazione Google all'avvio
  // COMMENTATO PER DEBUG
  // useEffect(() => {
  //   const authInfo = calendarApiService.getAuthInfo();
  //   setIsGoogleAuthenticated(authInfo.isAuthenticated);
  // }, []);

  // Effetto per caricare i dati all'avvio (se autenticato)
  // COMMENTATO PER DEBUG
  // useEffect(() => {
  //   if (isAuthenticated) {
  //     loadCalendarData();
  //   }
  // }, [isAuthenticated]);
  
  // === RENDER LOGIN ===
  if (!isAuthenticated) {
    console.log('🔐 Rendering login form...');
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
              aria-label="Password Admin"
              title="Inserisci password per accedere al pannello admin"
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

  // === RENDER DEBUG PRINCIPALE ===
  console.log('🎯 Rendering main admin panel...');
  
  // === RENDER ADMIN PANEL SEMPLIFICATO ===
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
          </div>
          
          <button 
            className="admin-btn-secondary"
            onClick={() => setIsAuthenticated(false)}
          >
            Logout
          </button>
        </div>
      </header>

      {/* Navigazione Tab SuperAdmin Completa */}
      <nav className="admin-nav">
        <div className="admin-nav-container">
          <button 
            className={`admin-nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            📊 Dashboard
          </button>
          
          <button 
            className={`admin-nav-item ${activeTab === 'prezzi' ? 'active' : ''}`}
            onClick={() => setActiveTab('prezzi')}
          >
            💰 Prezzi
          </button>
          
          <button 
            className={`admin-nav-item ${activeTab === 'calendari' ? 'active' : ''}`}
            onClick={() => setActiveTab('calendari')}
          >
            🗓️ Calendari
          </button>
          
          <button 
            className={`admin-nav-item ${activeTab === 'prenotazioni' ? 'active' : ''}`}
            onClick={() => setActiveTab('prenotazioni')}
          >
            📅 Prenotazioni
          </button>
          
          <button 
            className={`admin-nav-item ${activeTab === 'pagamenti' ? 'active' : ''}`}
            onClick={() => setActiveTab('pagamenti')}
          >
            💳 Pagamenti
          </button>
          
          <button 
            className={`admin-nav-item ${activeTab === 'email' ? 'active' : ''}`}
            onClick={() => setActiveTab('email')}
          >
            ✉️ Email
          </button>
          
          <button 
            className={`admin-nav-item ${activeTab === 'analytics' ? 'active' : ''}`}
            onClick={() => setActiveTab('analytics')}
          >
            📈 Analytics
          </button>
          
          <button 
            className={`admin-nav-item ${activeTab === 'sistema' ? 'active' : ''}`}
            onClick={() => setActiveTab('sistema')}
          >
            ⚙️ Sistema
          </button>
        </div>
      </nav>

      {/* Contenuto Principale */}
      <main className="admin-content">
        {error && <div className="admin-error-banner">{error}</div>}

        {/* Dashboard con Dati Google Calendar */}
        {activeTab === 'dashboard' && (
          <div className="admin-dashboard">
            <h2>📊 Dashboard Generale {isLoadingCalendar && '(Caricamento...)'}</h2>
            
            {/* Statistiche Backend Reali */}
            <div className="admin-section">
              <h3>🔥 Statistiche Live Backend</h3>
              <div className="admin-stats-grid">
                <div className="admin-stat-card">
                  <h3>Prenotazioni Backend</h3>
                  <div className="stat-value">{dashboardStats.totalBookings || 0}</div>
                  <small>Database reale</small>
                </div>
                
                <div className="admin-stat-card">
                  <h3>Ricavi Totali</h3>
                  <div className="stat-value">€{(dashboardStats.totalRevenue || 0).toFixed(2)}</div>
                  <small>Da API backend</small>
                </div>
                
                <div className="admin-stat-card">
                  <h3>Occupazione %</h3>
                  <div className="stat-value">{dashboardStats.occupancyRate || 0}%</div>
                  <small>Calcolo dinamico</small>
                </div>
                
                <div className="admin-stat-card">
                  <h3>Pagamenti Pending</h3>
                  <div className="stat-value">{dashboardStats.pendingPayments || 0}</div>
                  <small>In attesa</small>
                </div>
              </div>
            </div>
            
            {/* Statistiche Google Calendar */}
            <div className="admin-section">
              <h3>📅 Statistiche Google Calendar</h3>
              <div className="admin-stats-grid">
                <div className="admin-stat-card">
                  <h3>Prenotazioni Totali</h3>
                  <div className="stat-value">{calendarStats.totalBookings}</div>
                  <small>Dal calendario Google</small>
                </div>
                
                <div className="admin-stat-card">
                  <h3>Prenotazioni Mese</h3>
                  <div className="stat-value">{calendarStats.thisMonth}</div>
                  <small>Mese corrente</small>
                </div>
                
                <div className="admin-stat-card">
                  <h3>Ricavi Mese</h3>
                  <div className="stat-value">€{calendarStats.revenueThisMonth.toFixed(2)}</div>
                  <small>Fatturato mensile</small>
                </div>
                
                <div className="admin-stat-card">
                  <h3>Tasso Occupazione</h3>
                  <div className="stat-value">{calendarStats.occupancyRate}%</div>
                  <small>Occupazione mensile</small>
                </div>
              </div>
            </div>

            {/* Prossime Prenotazioni */}
            <div className="admin-pricing-section">
              <h3>📅 Prossime Prenotazioni</h3>
              <div className="admin-pricing-card">
                <div className="existing-services">
                  {calendarEvents.slice(0, 5).map((event, index) => (
                    <div key={event.id || index} className="service-row">
                      <span>{event.title}</span>
                      <span>{new Date(event.start).toLocaleDateString('it-IT')}</span>
                      <span className={`platform-badge ${event.source}`}>
                        {event.source === 'airbnb' && '🏠 Airbnb'}
                        {event.source === 'booking' && '🏨 Booking.com'}
                        {event.source === 'expedia' && '✈️ Expedia'}
                        {event.source === 'direct' && '📞 Diretto'}
                        {event.source === 'other' && '📅 Altro'}
                      </span>
                      <span>€{event.totalPrice}</span>
                    </div>
                  ))}
                  
                  {calendarEvents.length === 0 && !isLoadingCalendar && (
                    <div className="service-row">
                      <span className="no-data-message">
                        Nessuna prenotazione trovata nel calendario Google
                      </span>
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
        )}

        {/* Sezione Prezzi Completa */}
        {activeTab === 'prezzi' && (
          <div className="admin-prezzi">
            <h2>💰 Gestione Prezzi Completa</h2>
            
            {/* Tariffe Base Per Persona */}
            <div className="admin-pricing-section">
              <h3>👥 Tariffe Base a Persona/Notte</h3>
              <div className="admin-pricing-grid">
                <div className="admin-pricing-card">
                  <h4>Stagionalità (€ a persona/notte)</h4>
                  <div className="pricing-controls">
                    <label>Bassa Stagione (Nov-Feb):</label>
                    <input type="number" defaultValue="30" className="admin-input-small" aria-label="Prezzo persona bassa stagione" />
                    
                    <label>Media Stagione (Mar-Mag, Set-Ott):</label>
                    <input type="number" defaultValue="45" className="admin-input-small" aria-label="Prezzo persona media stagione" />
                    
                    <label>Alta Stagione (Giu-Ago):</label>
                    <input type="number" defaultValue="70" className="admin-input-small" aria-label="Prezzo persona alta stagione" />
                    
                    <label>Festivi/Eventi Speciali:</label>
                    <input type="number" defaultValue="85" className="admin-input-small" aria-label="Prezzo persona festivi" />
                  </div>
                </div>
                
                <div className="admin-pricing-card">
                  <h4>Configurazione Ospiti Flessibile</h4>
                  <div className="pricing-controls">
                    <label>Ospiti Inclusi (numero base):</label>
                    <input type="number" defaultValue="2" className="admin-input-small" aria-label="Numero ospiti base inclusi" />
                    
                    <label>Ospiti Aggiuntivi (dal 3° in poi):</label>
                    <input type="number" defaultValue="25" className="admin-input-small" aria-label="Costo ospiti aggiuntivi dal terzo" />
                    
                    <label>Capacità Massima:</label>
                    <input type="number" defaultValue="6" className="admin-input-small" aria-label="Capacità massima ospiti" />
                    
                    <div className="pricing-note">
                      💡 Tariffe calcolate automaticamente: (Ospiti Base × Tariffa) + (Ospiti Extra × Supplemento)
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Gestione Bambini */}
            <div className="admin-pricing-section">
              <h3>👶 Gestione Bambini (0-17 anni)</h3>
              <div className="admin-pricing-grid">
                <div className="admin-pricing-card">
                  <h4>Fasce di Età</h4>
                  <div className="pricing-controls">
                    <label>Bambini 0-2 anni (Infanti):</label>
                    <select className="admin-select" aria-label="Policy bambini 0-2">
                      <option>Gratuiti</option>
                      <option>€5/notte</option>
                      <option>€10/notte</option>
                    </select>
                    
                    <label>Bambini 3-11 anni:</label>
                    <input type="number" defaultValue="15" className="admin-input-small" aria-label="Tariffa bambini 3-11" />
                    
                    <label>Ragazzi 12-17 anni:</label>
                    <input type="number" defaultValue="20" className="admin-input-small" aria-label="Tariffa ragazzi 12-17" />
                  </div>
                </div>
                
                <div className="admin-pricing-card">
                  <h4>Politiche Speciali Bambini</h4>
                  <div className="pricing-controls">
                    <label>Culla (0-2 anni):</label>
                    <input type="number" defaultValue="10" className="admin-input-small" aria-label="Costo culla per soggiorno" />
                    
                    <label>Letto Aggiuntivo (3-17 anni):</label>
                    <input type="number" defaultValue="15" className="admin-input-small" aria-label="Costo letto aggiuntivo" />
                    
                    <label>Sconto Famiglie Numerose (4+ bambini):</label>
                    <input type="number" defaultValue="10" className="admin-input-small" aria-label="Sconto famiglie numerose percentuale" />
                    
                    <div className="pricing-note">
                      👨‍👩‍👧‍👦 I bambini non occupano il conteggio ospiti base se dormono con i genitori
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Servizi e Costi Extra */}
            <div className="admin-pricing-section">
              <h3>🚗 Servizi e Costi Extra</h3>
              <div className="admin-pricing-grid">
                <div className="admin-pricing-card">
                  <h4>Parcheggio</h4>
                  <div className="pricing-controls">
                    <label>Parcheggio Gratuito:</label>
                    <select className="admin-select" aria-label="Parcheggio gratuito">
                      <option>Incluso</option>
                      <option>A pagamento</option>
                      <option>Non disponibile</option>
                    </select>
                    
                    <label>Costo Parcheggio/Notte:</label>
                    <input type="number" defaultValue="15" className="admin-input-small" aria-label="Costo parcheggio per notte" />
                    
                    <label>Parcheggio Coperto (+):</label>
                    <input type="number" defaultValue="5" className="admin-input-small" aria-label="Supplemento parcheggio coperto" />
                  </div>
                </div>
                
                <div className="admin-pricing-card">
                  <h4>Servizi Standard</h4>
                  <div className="pricing-controls">
                    <label>Pulizia Finale:</label>
                    <input type="number" defaultValue="80" className="admin-input-small" aria-label="Costo pulizia finale" />
                    
                    <label>Tassa di Soggiorno:</label>
                    <input type="number" defaultValue="3" className="admin-input-small" aria-label="Tassa soggiorno per persona" />
                    
                    <label>WiFi:</label>
                    <select className="admin-select" aria-label="Costo WiFi">
                      <option>Incluso</option>
                      <option>€5/giorno</option>
                      <option>€15/settimana</option>
                    </select>
                    
                    <label>Aria Condizionata:</label>
                    <select className="admin-select" aria-label="Costo aria condizionata">
                      <option>Inclusa</option>
                      <option>€8/giorno</option>
                      <option>€25/settimana</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Servizi Premium e Personalizzati */}
            <div className="admin-pricing-section">
              <h3>⭐ Servizi Premium e Personalizzati</h3>
              <div className="admin-pricing-grid">
                <div className="admin-pricing-card">
                  <h4>Servizi Premium</h4>
                  <div className="pricing-controls">
                    <label>Check-in Anticipato (prima 15:00):</label>
                    <input type="number" defaultValue="30" className="admin-input-small" aria-label="Costo check-in anticipato" />
                    
                    <label>Check-out Posticipato (dopo 11:00):</label>
                    <input type="number" defaultValue="25" className="admin-input-small" aria-label="Costo check-out posticipato" />
                    
                    <label>Colazione (per persona):</label>
                    <input type="number" defaultValue="15" className="admin-input-small" aria-label="Costo colazione" />
                    
                    <label>Transfer Aeroporto:</label>
                    <input type="number" defaultValue="45" className="admin-input-small" aria-label="Costo transfer aeroporto" />
                  </div>
                </div>
                
                <div className="admin-pricing-card">
                  <h4>Servizi Personalizzati</h4>
                  <div className="pricing-controls">
                    <div className="custom-service-item">
                      <input type="text" placeholder="Nome servizio..." className="admin-input" aria-label="Nome servizio personalizzato" />
                      <input type="number" placeholder="Prezzo" className="admin-input-small" aria-label="Prezzo servizio personalizzato" />
                      <button className="admin-btn-small">➕</button>
                    </div>
                    
                    <div className="existing-services">
                      <div className="service-row">
                        <span>Culla per bambini</span>
                        <span>€20/soggiorno</span>
                        <button className="admin-btn-small">✏️</button>
                        <button className="admin-btn-small">🗑️</button>
                      </div>
                      
                      <div className="service-row">
                        <span>Animali domestici</span>
                        <span>€15/notte</span>
                        <button className="admin-btn-small">✏️</button>
                        <button className="admin-btn-small">🗑️</button>
                      </div>
                    </div>
                    
                    <button className="admin-btn-secondary">➕ Aggiungi Servizio</button>
                  </div>
                </div>
              </div>
            </div>

            {/* Sconti e Promozioni */}
            <div className="admin-pricing-section">
              <h3>🎯 Sconti e Promozioni</h3>
              <div className="admin-pricing-grid">
                <div className="admin-pricing-card">
                  <h4>Sconti per Durata</h4>
                  <div className="pricing-controls">
                    <label>Sconto Settimanale (7+ notti):</label>
                    <input type="number" defaultValue="15" className="admin-input-small" aria-label="Sconto settimanale percentuale" />
                    
                    <label>Sconto Mensile (30+ notti):</label>
                    <input type="number" defaultValue="25" className="admin-input-small" aria-label="Sconto mensile percentuale" />
                    
                    <label>Sconto Last Minute (7gg prima):</label>
                    <input type="number" defaultValue="10" className="admin-input-small" aria-label="Sconto last minute" />
                  </div>
                </div>
                
                <div className="admin-pricing-card">
                  <h4>Promozioni Speciali</h4>
                  <div className="pricing-controls">
                    <label>Promo Prima Prenotazione:</label>
                    <input type="number" defaultValue="20" className="admin-input-small" aria-label="Sconto prima prenotazione" />
                    
                    <label>Sconto Clienti Fedeli:</label>
                    <input type="number" defaultValue="12" className="admin-input-small" aria-label="Sconto clienti fedeli" />
                    
                    <div className="promo-dates">
                      <label>Promo Periodo Specifico:</label>
                      <input type="date" className="admin-input-small" aria-label="Data inizio promo" />
                      <input type="date" className="admin-input-small" aria-label="Data fine promo" />
                      <input type="number" placeholder="% sconto" className="admin-input-small" aria-label="Percentuale sconto promo" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Azioni Finali */}
            <div className="admin-pricing-actions">
              <button className="admin-btn-primary">💾 Salva Configurazione Completa</button>
              <button className="admin-btn-secondary">🔄 Aggiorna Tutti i Prezzi</button>
              <button className="admin-btn-secondary">📊 Anteprima Listino</button>
              <button className="admin-btn-secondary">📤 Esporta Configurazione</button>
            </div>
          </div>
        )}

        {/* Sezione Calendari Completa */}
        {activeTab === 'calendari' && (
          <div className="admin-calendari">
            <h2>🗓️ Gestione Calendari Professionale</h2>
            
            {/* Autenticazione Google Calendar */}
            <div className="admin-pricing-section">
              <h3>🔐 Autenticazione Google Calendar</h3>
              <GoogleCalendarAuth 
                onAuthSuccess={handleGoogleAuthSuccess}
                onAuthError={handleGoogleAuthError}
              />
              
              {authError && (
                <div className="auth-error-message">
                  ❌ {authError}
                </div>
              )}
            </div>

            {/* Calendario Google Master */}
            <div className="admin-pricing-section">
              <h3>🎯 Calendario Master Google</h3>
              <div className="admin-calendar-card">
                <h3>📅 Google Calendar - Vincanto Master</h3>
                <div className="calendar-status active">🟢 Connesso e Sincronizzato</div>
                <div className="calendar-info">
                  <p>📧 Email: vincantomaiori@gmail.com</p>
                  <p>🔄 Ultima sincronizzazione: {new Date().toLocaleString('it-IT')}</p>
                  <p>📊 Eventi sincronizzati: {calendarStats.totalBookings}</p>
                  <div className={`sync-indicator ${isGoogleAuthenticated ? 'success' : 'warning'}`} id="calendar-connection-status">
                    {isGoogleAuthenticated 
                      ? '✅ Autenticato - Sincronizzazione attiva' 
                      : '🟡 Non autenticato - Usando dati demo'}
                  </div>
                </div>
                <div className="calendar-controls">
                  <button className="admin-btn-primary admin-btn-small" onClick={() => forceSyncCalendar()}>🔄 Sincronizza Ora</button>
                  <button className="admin-btn-secondary admin-btn-small" onClick={() => testCalendarConnection()}>⚙️ Test Connessione</button>
                  <button className="admin-btn-secondary admin-btn-small">📱 Condividi Calendario</button>
                  <button className="admin-btn-secondary admin-btn-small">📊 Report Sincronizzazione</button>
                </div>
              </div>
            </div>
            
            {/* Calendari Piattaforme Esterne */}
            <div className="admin-pricing-section">
              <h3>🌐 Calendari Piattaforme Esterne</h3>
              <div className="admin-calendar-grid">
                <div className="admin-calendar-card">
                  <h3>📱 Airbnb Calendar</h3>
                  <div className="calendar-status active">🟢 Sincronizzato</div>
                  <div className="calendar-info">
                    <p>📧 Account: mario@vincanto.com</p>
                    <p>🔄 Ultima sincronizzazione: Oggi 14:30</p>
                    <p>📊 Prenotazioni attive: 5</p>
                    <div className="sync-indicator success">
                      ✅ Sincronizzazione automatica ogni 2 ore
                    </div>
                  </div>
                  <div className="calendar-controls">
                    <button className="admin-btn-secondary admin-btn-small">🔄 Sincronizza</button>
                    <button className="admin-btn-secondary admin-btn-small">✏️ Modifica</button>
                    <button className="admin-btn-warning admin-btn-small">⏸️ Sospendi</button>
                    <button className="admin-btn-danger admin-btn-small">🗑️ Elimina</button>
                  </div>
                </div>
                
                <div className="admin-calendar-card">
                  <h3>🏨 Booking.com Calendar</h3>
                  <div className="calendar-status active">🟢 Sincronizzato</div>
                  <div className="calendar-info">
                    <p>📧 Account: booking@vincanto.com</p>
                    <p>🔄 Ultima sincronizzazione: Oggi 14:25</p>
                    <p>📊 Prenotazioni attive: 3</p>
                    <div className="sync-indicator success">
                      ✅ Sincronizzazione automatica ogni 3 ore
                    </div>
                  </div>
                  <div className="calendar-controls">
                    <button className="admin-btn-secondary admin-btn-small">🔄 Sincronizza</button>
                    <button className="admin-btn-secondary admin-btn-small">✏️ Modifica</button>
                    <button className="admin-btn-warning admin-btn-small">⏸️ Sospendi</button>
                    <button className="admin-btn-danger admin-btn-small">🗑️ Elimina</button>
                  </div>
                </div>
                
                <div className="admin-calendar-card">
                  <h3>🌐 Expedia Calendar</h3>
                  <div className="calendar-status syncing">🟡 Configurazione in corso</div>
                  <div className="calendar-info">
                    <p>� Account: expedia@vincanto.com</p>
                    <p>⚙️ Configurazione: 75% completata</p>
                    <p>📊 Test API: In corso...</p>
                    <div className="sync-indicator pending">
                      ⏳ Configurazione API in fase di test
                    </div>
                  </div>
                  <div className="calendar-controls">
                    <button className="admin-btn-primary admin-btn-small">⚙️ Completa Setup</button>
                    <button className="admin-btn-secondary admin-btn-small">🔧 Test API</button>
                    <button className="admin-btn-danger admin-btn-small">❌ Annulla</button>
                  </div>
                </div>
                
                <div className="admin-calendar-card">
                  <h3>🏠 VRBO Calendar</h3>
                  <div className="calendar-status inactive">🔴 Sospeso</div>
                  <div className="calendar-info">
                    <p>📧 Account: vrbo@vincanto.com</p>
                    <p>⏸️ Sospeso da: 15/10/2025</p>
                    <p>📊 Ultimo sync: 14/10/2025</p>
                    <div className="sync-indicator error">
                      ⚠️ Calendario temporaneamente sospeso per manutenzione
                    </div>
                  </div>
                  <div className="calendar-controls">
                    <button className="admin-btn-success admin-btn-small">▶️ Riattiva</button>
                    <button className="admin-btn-secondary admin-btn-small">✏️ Modifica</button>
                    <button className="admin-btn-danger admin-btn-small">🗑️ Elimina</button>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Configurazioni Generali */}
            <div className="admin-pricing-section">
              <h3>⚙️ Configurazioni Sincronizzazione</h3>
              <div className="admin-pricing-grid">
                <div className="admin-pricing-card">
                  <h4>Impostazioni Globali</h4>
                  <div className="pricing-controls">
                    <label>Frequenza Sincronizzazione Automatica:</label>
                    <select className="admin-select" aria-label="Frequenza sincronizzazione">
                      <option>Ogni ora</option>
                      <option>Ogni 2 ore</option>
                      <option>Ogni 6 ore</option>
                      <option>Solo manuale</option>
                    </select>
                    
                    <label>Notifiche Email per Errori:</label>
                    <select className="admin-select" aria-label="Notifiche errori">
                      <option>Abilitate</option>
                      <option>Solo errori critici</option>
                      <option>Disabilitate</option>
                    </select>
                    
                    <label>Fuso Orario:</label>
                    <select className="admin-select" aria-label="Fuso orario">
                      <option>Europe/Rome (GMT+1)</option>
                      <option>Europe/London (GMT+0)</option>
                      <option>America/New_York (GMT-5)</option>
                    </select>
                  </div>
                </div>
                
                <div className="admin-pricing-card">
                  <h4>Google Calendar API</h4>
                  <div className="pricing-controls">
                    <label>API Key Status:</label>
                    <div className="sync-indicator success">✅ API Key valida e attiva</div>
                    
                    <label>Calendario ID:</label>
                    <input type="text" defaultValue="vincanto.master@gmail.com" className="admin-input" aria-label="Google Calendar ID" readOnly />
                    
                    <label>Ultima Verifica API:</label>
                    <span className="pricing-note">27/10/2025 - 15:45 ✅</span>
                    
                    <button className="admin-btn-secondary admin-btn-small">🔧 Test Connessione</button>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Azioni Avanzate */}
            <div className="admin-pricing-actions">
              <button className="admin-btn-primary">➕ Aggiungi Nuovo Calendario</button>
              <button className="admin-btn-secondary">� Sincronizza Tutti</button>
              <button className="admin-btn-secondary">📊 Dashboard Occupazione</button>
              <button className="admin-btn-secondary">📈 Report Sincronizzazioni</button>
              <button className="admin-btn-secondary">📤 Esporta Configurazione</button>
              <button className="admin-btn-secondary">⚙️ Impostazioni Avanzate</button>
            </div>
          </div>
        )}

        {/* Sezione Prenotazioni Professionale */}
        {activeTab === 'prenotazioni' && (
          <div className="admin-prenotazioni">
            <h2>📅 Gestione Prenotazioni Avanzata</h2>
            
            {/* Statistiche Rapide */}
            <div className="admin-pricing-section">
              <h3>📊 Panoramica Prenotazioni</h3>
              <div className="admin-pricing-grid">
                <div className="admin-pricing-card">
                  <h4>Stato Attuale</h4>
                  <div className="pricing-controls">
                    <div className="stat-row">
                      <span>🏠 Occupazione Oggi:</span>
                      <span className="stat-value">100%</span>
                    </div>
                    <div className="stat-row">
                      <span>📅 Prossimi Check-in:</span>
                      <span className="stat-value">2</span>
                    </div>
                    <div className="stat-row">
                      <span>🚪 Prossimi Check-out:</span>
                      <span className="stat-value">1</span>
                    </div>
                    <div className="stat-row">
                      <span>💰 Ricavo Settimana:</span>
                      <span className="stat-value">€2,450</span>
                    </div>
                  </div>
                </div>
                
                <div className="admin-pricing-card">
                  <h4>Filtri Avanzati</h4>
                  <div className="pricing-controls">
                    <label>Stato Prenotazione:</label>
                    <select className="admin-select" aria-label="Filtro stato prenotazioni">
                      <option>Tutte le prenotazioni</option>
                      <option>✅ Confermate</option>
                      <option>⏳ In Attesa</option>
                      <option>🏠 Check-in Oggi</option>
                      <option>🚪 Check-out Oggi</option>
                      <option>🔄 In Soggiorno</option>
                      <option>✅ Completate</option>
                      <option>❌ Cancellate</option>
                    </select>
                    
                    <label>Periodo:</label>
                    <input type="date" className="admin-input-small" aria-label="Data inizio filtro" />
                    <input type="date" className="admin-input-small" aria-label="Data fine filtro" />
                    
                    <label>Piattaforma:</label>
                    <select className="admin-select" aria-label="Filtro piattaforma">
                      <option>Tutte le piattaforme</option>
                      <option>🌐 Sito Diretto</option>
                      <option>📱 Airbnb</option>
                      <option>🏨 Booking.com</option>
                      <option>🌐 Expedia</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Prenotazioni Backend Reali */}
            <div className="admin-pricing-section">
              <h3>🔥 Prenotazioni Backend (Dati Reali)</h3>
              <div className="bookings-table-container">
                {realBookings.length > 0 ? (
                  <table className="bookings-table">
                    <thead>
                      <tr>
                        <th>ID Backend</th>
                        <th>Cliente</th>
                        <th>Email</th>
                        <th>Check-in</th>
                        <th>Check-out</th>
                        <th>Ospiti</th>
                        <th>Stato</th>
                        <th>Totale</th>
                        <th>Azioni API</th>
                      </tr>
                    </thead>
                    <tbody>
                      {realBookings.map((booking) => (
                        <tr key={booking.id} className="booking-row">
                          <td><strong>#{booking.id}</strong></td>
                          <td>{booking.customer_name || booking.guestName || 'N/A'}</td>
                          <td>{booking.customer_email || booking.email || 'N/A'}</td>
                          <td>{booking.check_in || booking.checkIn}</td>
                          <td>{booking.check_out || booking.checkOut}</td>
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
                            <div className="action-buttons">
                              <button 
                                className="admin-btn-small" 
                                onClick={() => adminApiService?.updateBooking(booking.id, { status: 'confirmed' })}
                              >
                                ✅ Conferma
                              </button>
                              <button 
                                className="admin-btn-small" 
                                onClick={() => adminApiService?.deleteBooking(booking.id)}
                              >
                                ❌ Elimina
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="admin-pricing-card">
                    <p>📊 Nessuna prenotazione trovata nel database backend</p>
                    <button 
                      className="admin-btn-primary" 
                      onClick={loadRealApiData}
                    >
                      🔄 Ricarica Dati API
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Tabella Prenotazioni Mock */}
            <div className="admin-pricing-section">
              <h3>📋 Lista Prenotazioni (Demo/Mock)</h3>
              <div className="bookings-table-container">
                <table className="bookings-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Cliente</th>
                      <th>Ospiti</th>
                      <th>Check-in</th>
                      <th>Check-out</th>
                      <th>Piattaforma</th>
                      <th>Stato</th>
                      <th>Totale</th>
                      <th>Azioni</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentBookings.map((booking) => (
                      <tr key={booking.id} className="booking-row">
                        <td>#{booking.id.toUpperCase()}</td>
                        <td>
                          <div className="customer-info">
                            <strong>{booking.guestName}</strong>
                            <small>{booking.guestName.toLowerCase().replace(' ', '.')}@email.com</small>
                          </div>
                        </td>
                        <td>{booking.guests} {booking.guests === 1 ? 'ospite' : 'ospiti'}</td>
                        <td>{new Date(booking.checkIn).toLocaleDateString('it-IT')}</td>
                        <td>{new Date(booking.checkOut).toLocaleDateString('it-IT')}</td>
                        <td>
                          <span className={`platform-badge ${booking.platform}`}>
                            {booking.platform === 'airbnb' && '📱 Airbnb'}
                            {booking.platform === 'booking' && '🏨 Booking.com'}
                            {booking.platform === 'expedia' && '✈️ Expedia'}
                            {booking.platform === 'direct' && '📞 Diretto'}
                          </span>
                        </td>
                        <td>
                          <span className={`status ${booking.status}`}>
                            {booking.status === 'confirmed' && '✅ Confermata'}
                            {booking.status === 'pending' && '🟡 In attesa'}
                            {booking.status === 'cancelled' && '❌ Cancellata'}
                          </span>
                        </td>
                        <td>€{booking.totalPrice.toFixed(2)}</td>
                        <td>
                          <div className="action-buttons">
                            <button className="admin-btn-small">✏️ Modifica</button>
                            <button className="admin-btn-small">✉️ Email</button>
                            <button className="admin-btn-small">📄 Fattura</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    
                    {recentBookings.length === 0 && (
                      <tr className="booking-row">
                        <td colSpan={9}>
                          <div>Nessuna prenotazione trovata</div>
                        </td>
                      </tr>
                    )}
                    
                    <tr className="booking-row">
                      <td>#VIN_DEMO</td>
                      <td>
                        <div className="customer-info">
                          <strong>Anna Bianchi</strong>
                          <small>anna.bianchi@gmail.com</small>
                        </div>
                      </td>
                      <td>2 adulti, 1 bambino</td>
                      <td>05/11/2025</td>
                      <td>12/11/2025</td>
                      <td><span className="platform-badge booking">🏨 Booking.com</span></td>
                      <td><span className="status pending">⏳ In Attesa Pagamento</span></td>
                      <td>€1,250.00</td>
                      <td>
                        <div className="action-buttons">
                          <button className="admin-btn-small admin-btn-warning">💳 Richiedi Pag.</button>
                          <button className="admin-btn-small">✏️ Modifica</button>
                          <button className="admin-btn-small">✉️ Email</button>
                        </div>
                      </td>
                    </tr>
                    
                    <tr className="booking-row">
                      <td>#VIN003</td>
                      <td>
                        <div className="customer-info">
                          <strong>Luigi Verde</strong>
                          <small>luigi.verde@hotmail.com</small>
                        </div>
                      </td>
                      <td>6 adulti</td>
                      <td>15/11/2025</td>
                      <td>20/11/2025</td>
                      <td><span className="platform-badge direct">🌐 Sito Diretto</span></td>
                      <td><span className="status completed">✅ Completata</span></td>
                      <td>€1,625.00</td>
                      <td>
                        <div className="action-buttons">
                          <button className="admin-btn-small">📄 Fattura</button>
                          <button className="admin-btn-small">⭐ Recensione</button>
                          <button className="admin-btn-small">🔁 Prenota Ancora</button>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
            
            {/* Azioni Avanzate */}
            <div className="admin-pricing-actions">
              <button className="admin-btn-primary">➕ Nuova Prenotazione</button>
              <button className="admin-btn-secondary">📊 Report Dettagliato</button>
              <button className="admin-btn-secondary">📧 Email di Massa</button>
              <button className="admin-btn-secondary">📅 Calendario Occupazione</button>
              <button className="admin-btn-secondary">💾 Esporta Excel</button>
              <button className="admin-btn-secondary">🔄 Sincronizza Piattaforme</button>
            </div>
          </div>
        )}

        {/* Sezione Pagamenti Professionale */}
        {activeTab === 'pagamenti' && (
          <div className="admin-pagamenti">
            <h2>💳 Gestione Pagamenti Avanzata</h2>
            
            {/* Dashboard Finanziaria */}
            <div className="admin-pricing-section">
              <h3>📊 Dashboard Finanziaria</h3>
              <div className="admin-pricing-grid">
                <div className="admin-pricing-card">
                  <h4>💰 Ricavi Periodo</h4>
                  <div className="pricing-controls">
                    <div className="stat-row">
                      <span>Oggi:</span>
                      <span className="stat-value">€420.00</span>
                    </div>
                    <div className="stat-row">
                      <span>Questa Settimana:</span>
                      <span className="stat-value">€2,450.00</span>
                    </div>
                    <div className="stat-row">
                      <span>Questo Mese:</span>
                      <span className="stat-value">€12,450.00</span>
                    </div>
                    <div className="stat-row">
                      <span>Quest'Anno:</span>
                      <span className="stat-value">€78,320.00</span>
                    </div>
                  </div>
                </div>
                
                <div className="admin-pricing-card">
                  <h4>📈 Statistiche Live</h4>
                  <div className="pricing-controls">
                    <div className="stat-row">
                      <span>⏳ In Sospeso:</span>
                      <span className="stat-value warning">
                        €{paymentTransactions
                          .filter(t => t.status === 'pending')
                          .reduce((sum, t) => sum + t.amount, 0)
                          .toFixed(2)}
                      </span>
                    </div>
                    <div className="stat-row">
                      <span>✅ Completati:</span>
                      <span className="stat-value success">
                        €{paymentTransactions
                          .filter(t => t.status === 'completed')
                          .reduce((sum, t) => sum + t.amount, 0)
                          .toFixed(2)}
                      </span>
                    </div>
                    <div className="stat-row">
                      <span>📊 Tasso Successo:</span>
                      <span className="stat-value">
                        {paymentTransactions.length > 0 
                          ? Math.round((paymentTransactions.filter(t => t.status === 'completed').length / paymentTransactions.length) * 100)
                          : 0}%
                      </span>
                    </div>
                    <div className="stat-row">
                      <span>⚡ Tempo Medio Pagam.:</span>
                      <span className="stat-value">2.3 giorni</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Metodi di Pagamento */}
            <div className="admin-pricing-section">
              <h3>🎯 Metodi di Pagamento</h3>
              <div className="admin-pricing-grid">
                <div className="admin-pricing-card">
                  <h4>💳 Stripe Integration</h4>
                  <div className="pricing-controls">
                    <div className="sync-indicator success">✅ Connesso e Attivo</div>
                    <label>Commissione Stripe:</label>
                    <input type="number" defaultValue="2.9" className="admin-input-small" aria-label="Commissione Stripe" step="0.1" />
                    <label>Valute Accettate:</label>
                    <div className="pricing-note">EUR, USD, GBP</div>
                    <button className="admin-btn-secondary admin-btn-small">⚙️ Configura</button>
                  </div>
                </div>
                
                <div className="admin-pricing-card">
                  <h4>🏦 Bonifico Bancario</h4>
                  <div className="pricing-controls">
                    <div className="sync-indicator success">✅ Attivo</div>
                    <label>IBAN:</label>
                    <input type="text" defaultValue="IT02 L012 3456 789012345678901" className="admin-input" aria-label="IBAN" readOnly />
                    <label>Tempo Liquidazione:</label>
                    <input type="number" defaultValue="2" className="admin-input-small" aria-label="Giorni liquidazione" />
                    <button className="admin-btn-secondary admin-btn-small">✏️ Modifica</button>
                  </div>
                </div>
                
                <div className="admin-pricing-card">
                  <h4>💰 PayPal Business</h4>
                  <div className="pricing-controls">
                    <div className="sync-indicator active">🟡 Configurazione</div>
                    <label>Email PayPal:</label>
                    <input type="email" defaultValue="vincanto@paypal.com" className="admin-input" aria-label="Email PayPal" />
                    <label>Commissione PayPal:</label>
                    <input type="number" defaultValue="3.4" className="admin-input-small" aria-label="Commissione PayPal" step="0.1" />
                    <button className="admin-btn-primary admin-btn-small">⚙️ Completa Setup</button>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Lista Transazioni Recenti */}
            <div className="admin-pricing-section">
              <h3>💳 Transazioni Recenti</h3>
              <div className="admin-pricing-card">
                <div className="existing-services">
                  {paymentTransactions.map((transaction) => (
                    <div key={transaction.id} className="service-row">
                      <span>{transaction.guestName}</span>
                      <span>€{transaction.amount.toFixed(2)}</span>
                      <span className={`platform-badge ${transaction.method}`}>
                        {transaction.method === 'stripe' && '💳 Stripe'}
                        {transaction.method === 'paypal' && '💰 PayPal'}
                        {transaction.method === 'bank_transfer' && '🏦 Bonifico'}
                      </span>
                      <span className={`status ${transaction.status}`}>
                        {transaction.status === 'completed' && '✅ Completato'}
                        {transaction.status === 'pending' && '🟡 In attesa'}
                        {transaction.status === 'failed' && '❌ Fallito'}
                      </span>
                      <span>{new Date(transaction.date).toLocaleDateString('it-IT')}</span>
                    </div>
                  ))}
                  
                  {paymentTransactions.length === 0 && (
                    <div className="service-row">
                      <span>Nessuna transazione trovata</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Azioni Finanziarie */}
            <div className="admin-pricing-actions">
              <button className="admin-btn-primary">➕ Aggiungi Metodo Pagamento</button>
              <button className="admin-btn-secondary">📊 Report Finanziario Completo</button>
              <button className="admin-btn-secondary">📈 Analisi Trend</button>
              <button className="admin-btn-secondary">💾 Esporta Contabilità</button>
              <button className="admin-btn-secondary">🔔 Configura Notifiche</button>
            </div>
          </div>
        )}

        {/* Sezione Email */}
        {activeTab === 'email' && (
          <div className="admin-email">
            <h2>✉️ Sistema Email Marketing</h2>
            
            {/* Dashboard Email */}
            <div className="admin-pricing-section">
              <h3>📊 Performance Email</h3>
              <div className="admin-pricing-grid">
                <div className="admin-pricing-card">
                  <h4>📈 Statistiche Generali</h4>
                  <div className="pricing-controls">
                    <div className="stat-row">
                      <span>📤 Totale Inviate:</span>
                      <span className="stat-value">1,247</span>
                    </div>
                    <div className="stat-row">
                      <span>📖 Tasso Apertura:</span>
                      <span className="stat-value success">87.5%</span>
                    </div>
                    <div className="stat-row">
                      <span>🔗 Click Through Rate:</span>
                      <span className="stat-value">42.3%</span>
                    </div>
                    <div className="stat-row">
                      <span>❌ Bounce Rate:</span>
                      <span className="stat-value warning">1.2%</span>
                    </div>
                  </div>
                </div>
                
                <div className="admin-pricing-card">
                  <h4>⚡ Automazioni Attive</h4>
                  <div className="pricing-controls">
                    <div className="sync-indicator success">✅ Conferma Prenotazione: Attiva</div>
                    <div className="sync-indicator success">✅ Check-in Reminder: Attiva</div>
                    <div className="sync-indicator success">✅ Richiesta Recensione: Attiva</div>
                    <div className="sync-indicator pending">🟡 Follow-up Post Soggiorno: Test</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Template Email */}
            <div className="admin-pricing-section">
              <h3>� Template Email</h3>
              <div className="admin-pricing-grid">
                <div className="admin-pricing-card">
                  <h4>🎯 Template Principali</h4>
                  <div className="existing-services">
                    <div className="service-row">
                      <span>📧 Conferma Prenotazione</span>
                      <span>87% apertura</span>
                      <button className="admin-btn-small">✏️ Modifica</button>
                      <button className="admin-btn-small">📊 Stats</button>
                    </div>
                    
                    <div className="service-row">
                      <span>🏠 Istruzioni Check-in</span>
                      <span>95% apertura</span>
                      <button className="admin-btn-small">✏️ Modifica</button>
                      <button className="admin-btn-small">📊 Stats</button>
                    </div>
                    
                    <div className="service-row">
                      <span>👋 Messaggio Benvenuto</span>
                      <span>78% apertura</span>
                      <button className="admin-btn-small">✏️ Modifica</button>
                      <button className="admin-btn-small">� Stats</button>
                    </div>
                    
                    <div className="service-row">
                      <span>⭐ Richiesta Recensione</span>
                      <span>65% apertura</span>
                      <button className="admin-btn-small">✏️ Modifica</button>
                      <button className="admin-btn-small">📊 Stats</button>
                    </div>
                  </div>
                </div>
                
                <div className="admin-pricing-card">
                  <h4>⚙️ Configurazione SMTP</h4>
                  <div className="pricing-controls">
                    <label>Provider Email:</label>
                    <select className="admin-select" aria-label="Provider email">
                      <option>Gmail SMTP</option>
                      <option>SendGrid</option>
                      <option>Mailgun</option>
                      <option>SMTP Personalizzato</option>
                    </select>
                    
                    <label>Email Mittente:</label>
                    <input type="email" defaultValue="noreply@vincantomaori.it" className="admin-input" aria-label="Email mittente" />
                    
                    <div className="sync-indicator success">✅ Connessione SMTP attiva</div>
                    
                    <button className="admin-btn-secondary admin-btn-small">🔧 Test Invio</button>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Azioni Email */}
            <div className="admin-pricing-actions">
              <button className="admin-btn-primary">✏️ Nuovo Template</button>
              <button className="admin-btn-secondary">📊 Report Dettagliato</button>
              <button className="admin-btn-secondary">📧 Invio Massivo</button>
              <button className="admin-btn-secondary">⚡ Gestisci Automazioni</button>
              <button className="admin-btn-secondary">🎨 Editor Avanzato</button>
            </div>
          </div>
        )}

        {/* Sezione Sistema Professionale */}
        {activeTab === 'sistema' && (
          <div className="admin-sistema">
            <h2>⚙️ Configurazione Sistema Avanzata</h2>
            
            {/* Impostazioni Backend Reali */}
            <div className="admin-pricing-section">
              <h3>🔥 Impostazioni Backend Live</h3>
              <div className="admin-pricing-grid">
                <div className="admin-pricing-card">
                  <h4>Configurazioni Sistema</h4>
                  <div className="pricing-controls">
                    {systemSettings.length > 0 ? (
                      systemSettings.map((setting) => (
                        <div key={setting.id || setting.key} className="setting-row">
                          <label>{setting.label || setting.key}:</label>
                          <input 
                            type="text" 
                            defaultValue={setting.value} 
                            className="admin-input" 
                            onChange={(e) => {
                              if (adminApiService) {
                                adminApiService.updateSystemSetting(setting.key, e.target.value);
                              }
                            }}
                            aria-label={setting.label || setting.key}
                          />
                          <small>Categoria: {setting.category}</small>
                        </div>
                      ))
                    ) : (
                      <div>
                        <p>📊 Nessuna impostazione caricata dal backend</p>
                        <button 
                          className="admin-btn-primary" 
                          onClick={loadRealApiData}
                        >
                          🔄 Carica Impostazioni API
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="admin-pricing-card">
                  <h4>Statistiche API</h4>
                  <div className="pricing-controls">
                    <div className="stat-row">
                      <span>📊 Prenotazioni Backend:</span>
                      <span className="stat-value">{realBookings.length}</span>
                    </div>
                    <div className="stat-row">
                      <span>⚙️ Impostazioni Attive:</span>
                      <span className="stat-value">{systemSettings.length}</span>
                    </div>
                    <div className="stat-row">
                      <span>📈 Analytics Records:</span>
                      <span className="stat-value">{analytics.length}</span>
                    </div>
                    <div className="stat-row">
                      <span>🔔 Notifiche:</span>
                      <span className="stat-value">{notifications.length}</span>
                    </div>
                  </div>
                  
                  <button 
                    className="admin-btn-primary" 
                    onClick={loadRealApiData}
                  >
                    🔄 Ricarica Tutti i Dati API
                  </button>
                </div>
              </div>
            </div>
            
            {/* Informazioni Proprietà */}
            <div className="admin-pricing-section">
              <h3>🏠 Informazioni Struttura</h3>
              <div className="admin-pricing-grid">
                <div className="admin-pricing-card">
                  <h4>Dati Principali</h4>
                  <div className="pricing-controls">
                    <label>Nome Struttura:</label>
                    <input type="text" defaultValue="Vincanto Maori" className="admin-input" aria-label="Nome struttura" />
                    
                    <label>Indirizzo Completo:</label>
                    <input type="text" defaultValue="Via dei Maori 25, 00185 Roma RM" className="admin-input" aria-label="Indirizzo" />
                    
                    <label>Codice CIR/CIN:</label>
                    <input type="text" defaultValue="15146004C217" className="admin-input" aria-label="Codice identificativo" />
                    
                    <label>Capacità Massima:</label>
                    <input type="number" defaultValue="6" className="admin-input-small" aria-label="Capacità ospiti" />
                  </div>
                </div>
                
                <div className="admin-pricing-card">
                  <h4>Contatti e Legal</h4>
                  <div className="pricing-controls">
                    <label>Telefono Principale:</label>
                    <input type="tel" defaultValue="+39 06 1234567" className="admin-input" aria-label="Telefono" />
                    
                    <label>Email Gestione:</label>
                    <input type="email" defaultValue="info@vincantomaori.it" className="admin-input" aria-label="Email gestione" />
                    
                    <label>Partita IVA:</label>
                    <input type="text" defaultValue="12345678901" className="admin-input" aria-label="Partita IVA" />
                    
                    <label>Codice Fiscale:</label>
                    <input type="text" defaultValue="RSSMRA80A01H501X" className="admin-input" aria-label="Codice fiscale" />
                  </div>
                </div>
              </div>
            </div>

            {/* Sicurezza e Backup */}
            <div className="admin-pricing-section">
              <h3>🔐 Sicurezza e Backup</h3>
              <div className="admin-pricing-grid">
                <div className="admin-pricing-card">
                  <h4>Autenticazione</h4>
                  <div className="pricing-controls">
                    <label>Password Amministratore:</label>
                    <input type="password" defaultValue="vincanto2025" className="admin-input" aria-label="Password admin" />
                    
                    <label>Autenticazione 2FA:</label>
                    <select className="admin-select" aria-label="Two factor auth">
                      <option>Disabilitata</option>
                      <option>SMS</option>
                      <option>App Authenticator</option>
                    </select>
                    
                    <label>Timeout Sessione (minuti):</label>
                    <input type="number" defaultValue="120" className="admin-input-small" aria-label="Timeout sessione" />
                    
                    <button className="admin-btn-secondary admin-btn-small">🔑 Cambia Password</button>
                  </div>
                </div>
                
                <div className="admin-pricing-card">
                  <h4>Backup e Sicurezza</h4>
                  <div className="pricing-controls">
                    <label>Backup Automatici:</label>
                    <select className="admin-select" aria-label="Frequenza backup">
                      <option>Giornaliero</option>
                      <option>Ogni 12 ore</option>
                      <option>Settimanale</option>
                    </select>
                    
                    <label>Conservazione Backup:</label>
                    <input type="number" defaultValue="30" className="admin-input-small" aria-label="Giorni conservazione" />
                    
                    <div className="sync-indicator success">✅ Ultimo backup: Oggi 03:00</div>
                    
                    <button className="admin-btn-secondary admin-btn-small">💾 Backup Manuale</button>
                  </div>
                </div>
              </div>
            </div>

            {/* Monitoraggio Sistema */}
            <div className="admin-pricing-section">
              <h3>📊 Monitoraggio Sistema</h3>
              <div className="admin-pricing-grid">
                <div className="admin-pricing-card">
                  <h4>Stato Servizi</h4>
                  <div className="pricing-controls">
                    <div className="sync-indicator success">🟢 Server Web: Operativo (99.9% uptime)</div>
                    <div className="sync-indicator success">🟢 Database: Connesso (12ms latenza)</div>
                    <div className="sync-indicator success">🟢 Email Service: Attivo</div>
                    <div className="sync-indicator success">🟢 API Google Calendar: Funzionante</div>
                    <div className="sync-indicator warning">🟡 Cache Redis: Alto utilizzo (78%)</div>
                  </div>
                </div>
                
                <div className="admin-pricing-card">
                  <h4>Performance</h4>
                  <div className="pricing-controls">
                    <div className="stat-row">
                      <span>💾 Utilizzo Disco:</span>
                      <span className="stat-value">45.2 GB / 100 GB</span>
                    </div>
                    <div className="stat-row">
                      <span>🚀 RAM:</span>
                      <span className="stat-value">2.1 GB / 4 GB</span>
                    </div>
                    <div className="stat-row">
                      <span>📊 CPU:</span>
                      <span className="stat-value">12.3%</span>
                    </div>
                    <div className="stat-row">
                      <span>🌐 Traffico Oggi:</span>
                      <span className="stat-value">847 visite</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Azioni Sistema */}
            <div className="admin-pricing-actions">
              <button className="admin-btn-primary">💾 Salva Tutte le Configurazioni</button>
              <button className="admin-btn-secondary">🔄 Riavvia Servizi</button>
              <button className="admin-btn-secondary">📋 Log Sistema Completo</button>
              <button className="admin-btn-secondary">🛡️ Test Sicurezza</button>
              <button className="admin-btn-secondary">📊 Report Performance</button>
              <button className="admin-btn-secondary">⚙️ Manutenzione Programmata</button>
            </div>
          </div>
        )}

        {/* Sezione Analytics Professionale */}
        {activeTab === 'analytics' && (
          <div className="admin-analytics">
            <h2>📈 Analytics e Statistiche Avanzate</h2>
            
            {/* Analytics Backend Reali */}
            <div className="admin-pricing-section">
              <h3>🔥 Analytics Backend (Dati Reali 30 Giorni)</h3>
              <div className="admin-pricing-grid">
                {analytics.length > 0 ? (
                  <div className="admin-pricing-card">
                    <h4>📊 Dati Giornalieri</h4>
                    <div className="analytics-table">
                      <table className="bookings-table">
                        <thead>
                          <tr>
                            <th>Data</th>
                            <th>Prenotazioni</th>
                            <th>Ricavi</th>
                            <th>Occupancy %</th>
                            <th>Trend</th>
                          </tr>
                        </thead>
                        <tbody>
                          {analytics.slice(0, 10).map((day, index) => (
                            <tr key={index}>
                              <td>{day.date}</td>
                              <td>{day.bookings}</td>
                              <td>€{day.revenue}</td>
                              <td>{day.occupancy}%</td>
                              <td>
                                {day.occupancy > 70 ? '🔥' : day.occupancy > 40 ? '📈' : '📉'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <div className="admin-pricing-card">
                    <h4>📊 Nessun Dato Analytics</h4>
                    <p>Non sono stati trovati dati analytics dal backend</p>
                    <button 
                      className="admin-btn-primary" 
                      onClick={loadRealApiData}
                    >
                      🔄 Ricarica Analytics API
                    </button>
                  </div>
                )}
                
                <div className="admin-pricing-card">
                  <h4>📈 Statistiche Aggregate</h4>
                  <div className="pricing-controls">
                    <div className="stat-row">
                      <span>📊 Totale Record Analytics:</span>
                      <span className="stat-value">{analytics.length}</span>
                    </div>
                    <div className="stat-row">
                      <span>💰 Ricavo Medio Giornaliero:</span>
                      <span className="stat-value">
                        €{analytics.length > 0 
                          ? (analytics.reduce((sum, day) => sum + (day.revenue || 0), 0) / analytics.length).toFixed(2)
                          : '0.00'}
                      </span>
                    </div>
                    <div className="stat-row">
                      <span>🏠 Occupancy Media:</span>
                      <span className="stat-value">
                        {analytics.length > 0 
                          ? Math.round(analytics.reduce((sum, day) => sum + (day.occupancy || 0), 0) / analytics.length)
                          : 0}%
                      </span>
                    </div>
                    <div className="stat-row">
                      <span>📅 Giorni con Prenotazioni:</span>
                      <span className="stat-value">
                        {analytics.filter(day => day.bookings > 0).length}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Grafici e Trend */}
            <div className="admin-pricing-section">
              <h3>📊 Trend Visuali (Simulati)</h3>
              <div className="admin-pricing-card">
                <h4>📈 Andamento Ricavi</h4>
                <div className="trend-chart">
                  {analytics.slice(0, 7).map((day, index) => (
                    <div key={index} className="chart-bar" style={{ 
                      height: `${Math.max(10, (day.revenue || 0) / 10)}px`,
                      backgroundColor: day.revenue > 300 ? '#4CAF50' : day.revenue > 150 ? '#FF9800' : '#f44336'
                    }}>
                      <small>{day.date?.split('-')[2] || index + 1}</small>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Azioni Analytics */}
            <div className="admin-pricing-actions">
              <button className="admin-btn-primary" onClick={loadRealApiData}>
                🔄 Aggiorna Dati Analytics
              </button>
              <button className="admin-btn-secondary">📊 Esporta CSV</button>
              <button className="admin-btn-secondary">📈 Report Mensile</button>
              <button className="admin-btn-secondary">📧 Invia Report Email</button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminPanelPro;