import React, { useState, useEffect } from 'react';
import './AdminPage.css';
import * as AdminAPI from '../services/adminApi';
import { useAdminRealTimeSync } from '../hooks/useRealTimeSync';

// Usa i tipi dall'API service
type Calendar = AdminAPI.Calendar;
type Booking = AdminAPI.Booking;

const AdminPageSimple: React.FC = () => {
  const [activeTab, setActiveTab] = useState('calendars');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Stati per gestione calendari
  const [calendars, setCalendars] = useState<Calendar[]>([]);
  
  // Stati per gestione prenotazioni
  const [bookings, setBookings] = useState<Booking[]>([]);
  
  // Form per nuovo calendario
  const [newCalendar, setNewCalendar] = useState({
    name: '',
    platform: 'Airbnb',
    url: ''
  });

  // Stati per configurazione sistema (SuperAdmin)
  const [systemConfig, setSystemConfig] = useState<AdminAPI.SystemConfig | null>(null);
  const [configSection, setConfigSection] = useState<string>('pricing');

  // === FUNZIONI API ===

  const loadCalendars = async () => {
    try {
      setLoading(true);
      const calendarsData = await AdminAPI.getCalendars();
      setCalendars(calendarsData);
    } catch (error) {
      console.error('Errore caricamento calendari:', error);
      setError(AdminAPI.handleApiError(error));
    } finally {
      setLoading(false);
    }
  };

  const loadBookings = async () => {
    try {
      const bookingsData = await AdminAPI.getBookings();
      setBookings(bookingsData);
    } catch (error) {
      console.error('Errore caricamento prenotazioni:', error);
      setError(AdminAPI.handleApiError(error));
    }
  };

  const loadSystemConfig = async () => {
    try {
      setLoading(true);
      const config = await AdminAPI.getSystemConfig();
      setSystemConfig(config);
    } catch (error) {
      console.error('Errore caricamento configurazione:', error);
      setError(AdminAPI.handleApiError(error));
    } finally {
      setLoading(false);
    }
  };

  const updateSystemConfig = async (section: string, data: any) => {
    try {
      setLoading(true);
      const updatedConfig = await AdminAPI.updateSystemConfig(section, data);
      setSystemConfig(updatedConfig);
      alert(`Configurazione ${section} aggiornata con successo!`);
    } catch (error) {
      console.error('Errore aggiornamento configurazione:', error);
      setError(AdminAPI.handleApiError(error));
    } finally {
      setLoading(false);
    }
  };

  // Funzioni per gestione calendari
  const addCalendar = async () => {
    if (!newCalendar.name || !newCalendar.url) {
      alert('Nome e URL sono obbligatori');
      return;
    }
    
    try {
      setLoading(true);
      const calendar = await AdminAPI.createCalendar({
        name: newCalendar.name,
        platform: newCalendar.platform,
        url: newCalendar.url,
        active: true
      });
      
      setCalendars([...calendars, calendar]);
      setNewCalendar({ name: '', platform: 'Airbnb', url: '' });
      alert('Calendario aggiunto con successo!');
    } catch (error) {
      console.error('Errore aggiunta calendario:', error);
      setError(AdminAPI.handleApiError(error));
    } finally {
      setLoading(false);
    }
  };
  
  const toggleCalendar = async (id: string) => {
    try {
      const calendar = calendars.find(cal => cal.id === id);
      if (!calendar) return;

      const updatedCalendar = await AdminAPI.updateCalendar(id, {
        active: !calendar.active
      });

      setCalendars(calendars.map(cal => 
        cal.id === id ? updatedCalendar : cal
      ));
    } catch (error) {
      console.error('Errore toggle calendario:', error);
      setError(AdminAPI.handleApiError(error));
    }
  };
  
  const removeCalendar = async (id: string) => {
    if (!confirm('Sei sicuro di voler rimuovere questo calendario?')) return;
    
    try {
      await AdminAPI.deleteCalendar(id);
      setCalendars(calendars.filter(cal => cal.id !== id));
      alert('Calendario rimosso con successo!');
    } catch (error) {
      console.error('Errore rimozione calendario:', error);
      setError(AdminAPI.handleApiError(error));
    }
  };
  
  const syncCalendar = async (id: string) => {
    try {
      setLoading(true);
      const updatedCalendar = await AdminAPI.syncCalendar(id);
      
      setCalendars(calendars.map(cal =>
        cal.id === id ? updatedCalendar : cal
      ));
      alert('Sincronizzazione completata!');
    } catch (error) {
      console.error('Errore sincronizzazione:', error);
      setError(AdminAPI.handleApiError(error));
    } finally {
      setLoading(false);
    }
  };
  
  // Funzioni per gestione prenotazioni
  const updateBookingStatus = async (id: string, status: 'pending' | 'confirmed' | 'cancelled') => {
    try {
      const updatedBooking = await AdminAPI.updateBookingStatus(id, status);
      setBookings(bookings.map(booking =>
        booking.id === id ? updatedBooking : booking
      ));
      alert(`Stato prenotazione aggiornato a: ${status}`);
    } catch (error) {
      console.error('Errore aggiornamento prenotazione:', error);
      setError(AdminAPI.handleApiError(error));
    }
  };

  // Password semplice per demo - in produzione usare autenticazione robusta
  const adminPassword = 'vincanto2024';

  // Controlla se l'utente era già autenticato
  useEffect(() => {
    const savedAuth = localStorage.getItem('vincanto_admin_auth');
    if (savedAuth === 'authenticated') {
      setIsAuthenticated(true);
    }
  }, []);

  // Carica i dati quando l'admin è autenticato
  useEffect(() => {
    if (isAuthenticated) {
      loadCalendars();
      loadBookings();
      loadSystemConfig();
    }
  }, [isAuthenticated]);

  // Sincronizzazione real-time
  const { forceSync, isActive } = useAdminRealTimeSync(
    setCalendars,
    setBookings,
    setError,
    isAuthenticated // Attiva solo quando autenticato
  );

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === adminPassword) {
      setIsAuthenticated(true);
      setError('');
      localStorage.setItem('vincanto_admin_auth', 'authenticated');
    } else {
      setError('Password non corretta');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setPassword('');
    localStorage.removeItem('vincanto_admin_auth');
  };

  if (!isAuthenticated) {
    return (
      <div className="admin-login">
        <div className="login-container">
          <h1>Accesso Admin</h1>
          <form onSubmit={handleLogin}>
            <input
              type="password"
              placeholder="Inserisci password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="login-input"
            />
            <button type="submit" className="login-button">
              Accedi
            </button>
            {error && <p className="error-message">{error}</p>}
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <div className="admin-header">
        <h1>Admin Panel - Vincanto</h1>
        <div className="header-controls">
          <div className="sync-status">
            <span className={`sync-indicator ${isActive ? 'active' : 'inactive'}`}>
              {isActive ? '🟢' : '🔴'}
            </span>
            <span>Real-time: {isActive ? 'Attivo' : 'Inattivo'}</span>
            <button 
              onClick={forceSync} 
              className="sync-button"
              title="Sincronizza ora"
            >
              🔄
            </button>
          </div>
          <button onClick={handleLogout} className="logout-button">
            Logout
          </button>
        </div>
      </div>

      <div className="admin-tabs">
        <button
          className={activeTab === 'calendars' ? 'active' : ''}
          onClick={() => setActiveTab('calendars')}
        >
          Calendari
        </button>
        <button
          className={activeTab === 'bookings' ? 'active' : ''}
          onClick={() => setActiveTab('bookings')}
        >
          Prenotazioni
        </button>
        <button
          className={activeTab === 'settings' ? 'active' : ''}
          onClick={() => setActiveTab('settings')}
        >
          Impostazioni
        </button>
        <button
          className={activeTab === 'superadmin' ? 'active' : ''}
          onClick={() => setActiveTab('superadmin')}
        >
          SuperAdmin
        </button>
      </div>

      <div className="admin-content">
        {error && (
          <div className="error-message">
            {error}
            <button 
              onClick={() => setError('')} 
              className="close-button"
            >
              ×
            </button>
          </div>
        )}

        {loading && (
          <div className="loading-indicator">
            🔄 Caricamento...
          </div>
        )}

        {activeTab === 'calendars' && (
          <div className="admin-section">
            <h2>Gestione Calendari</h2>
            
            {/* Form per aggiungere nuovo calendario */}
            <div className="calendar-form">
              <h3>Aggiungi Calendario</h3>
              <div className="form-row">
                <input
                  type="text"
                  placeholder="Nome calendario"
                  value={newCalendar.name}
                  onChange={(e) => setNewCalendar({...newCalendar, name: e.target.value})}
                />
                <select
                  value={newCalendar.platform}
                  onChange={(e) => setNewCalendar({...newCalendar, platform: e.target.value})}
                  aria-label="Seleziona piattaforma"
                >
                  <option value="Airbnb">Airbnb</option>
                  <option value="Booking.com">Booking.com</option>
                  <option value="Google Calendar">Google Calendar</option>
                  <option value="Altro">Altro</option>
                </select>
                <input
                  type="url"
                  placeholder="URL iCal"
                  value={newCalendar.url}
                  onChange={(e) => setNewCalendar({...newCalendar, url: e.target.value})}
                />
                <button onClick={addCalendar} className="btn-primary">Aggiungi</button>
              </div>
            </div>
            
            {/* Lista calendari */}
            <div className="calendar-list">
              <h3>Calendari Attivi ({calendars.filter(cal => cal.active).length})</h3>
              {calendars.map(calendar => (
                <div key={calendar.id} className={`calendar-item ${calendar.active ? 'active' : 'inactive'}`}>
                  <div className="calendar-info">
                    <h4>{calendar.name}</h4>
                    <p>Piattaforma: {calendar.platform}</p>
                    <p>URL: {calendar.url}</p>
                    <p>Ultima sincronizzazione: {calendar.lastSync}</p>
                  </div>
                  <div className="calendar-actions">
                    <button 
                      onClick={() => toggleCalendar(calendar.id)}
                      className={calendar.active ? 'btn-warning' : 'btn-success'}
                    >
                      {calendar.active ? 'Disattiva' : 'Attiva'}
                    </button>
                    <button 
                      onClick={() => syncCalendar(calendar.id)}
                      className="btn-info"
                      disabled={!calendar.active}
                    >
                      Sincronizza
                    </button>
                    <button 
                      onClick={() => removeCalendar(calendar.id)}
                      className="btn-danger"
                    >
                      Rimuovi
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'bookings' && (
          <div className="admin-section">
            <h2>Gestione Prenotazioni</h2>
            
            <div className="bookings-stats">
              <div className="stat-card">
                <h3>{bookings.filter(b => b.status === 'confirmed').length}</h3>
                <p>Confermate</p>
              </div>
              <div className="stat-card">
                <h3>{bookings.filter(b => b.status === 'pending').length}</h3>
                <p>In Attesa</p>
              </div>
              <div className="stat-card">
                <h3>€{bookings.reduce((sum, b) => sum + b.amount, 0).toFixed(2)}</h3>
                <p>Totale Fatturato</p>
              </div>
            </div>
            
            <div className="bookings-list">
              <h3>Prenotazioni Recenti</h3>
              {bookings.map(booking => (
                <div key={booking.id} className={`booking-item status-${booking.status}`}>
                  <div className="booking-info">
                    <h4>{booking.guestName}</h4>
                    <p>Check-in: {booking.checkIn}</p>
                    <p>Check-out: {booking.checkOut}</p>
                    <p>Importo: €{booking.amount.toFixed(2)}</p>
                  </div>
                  <div className="booking-status">
                    <span className={`status-badge ${booking.status}`}>
                      {booking.status === 'confirmed' ? 'Confermata' : 
                       booking.status === 'pending' ? 'In Attesa' : 'Cancellata'}
                    </span>
                    <div className="status-actions">
                      <button 
                        onClick={() => updateBookingStatus(booking.id, 'confirmed')}
                        className="btn-success btn-sm"
                        disabled={booking.status === 'confirmed'}
                      >
                        Conferma
                      </button>
                      <button 
                        onClick={() => updateBookingStatus(booking.id, 'cancelled')}
                        className="btn-danger btn-sm"
                        disabled={booking.status === 'cancelled'}
                      >
                        Cancella
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="admin-section">
            <h2>Impostazioni Sistema</h2>
            
            <div className="settings-grid">
              <div className="setting-card">
                <h3>Configurazione Prezzi</h3>
                <p>Prezzo base per adulto: €80/notte</p>
                <p>Prezzo ospite aggiuntivo: €20/notte</p>
                <p>Pulizia finale: €50</p>
                <p>Parcheggio privato: €10/notte</p>
                <button className="btn-primary">Modifica Prezzi</button>
              </div>
              
              <div className="setting-card">
                <h3>Tasse e Commissioni</h3>
                <p>Tassa di soggiorno: €2/persona/notte</p>
                <p>Soggiorno minimo: 2 notti</p>
                <p>Commissione deposito: 30%</p>
                <button className="btn-primary">Modifica Tasse</button>
              </div>
              
              <div className="setting-card">
                <h3>Notifiche Email</h3>
                <p>Email notifiche: abilitata</p>
                <p>Email admin: info@vincantomaiori.it</p>
                <p>Template email: personalizzato</p>
                <button className="btn-primary">Configura Email</button>
              </div>
              
              <div className="setting-card">
                <h3>Backup e Sicurezza</h3>
                <p>Ultimo backup: oggi ore 02:00</p>
                <p>Backup automatico: attivo</p>
                <p>Sessioni attive: 1</p>
                <button className="btn-primary">Gestisci Backup</button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'superadmin' && (
          <div className="admin-section">
            <h2>SuperAdmin - Configurazione Sistema</h2>
            
            {!systemConfig ? (
              <div className="loading-indicator">Caricamento configurazione...</div>
            ) : (
              <>
                {/* Menu sezioni configurazione */}
                <div className="config-menu">
                  <button 
                    className={configSection === 'pricing' ? 'active' : ''}
                    onClick={() => setConfigSection('pricing')}
                  >
                    💰 Prezzi
                  </button>
                  <button 
                    className={configSection === 'payments' ? 'active' : ''}
                    onClick={() => setConfigSection('payments')}
                  >
                    💳 Pagamenti
                  </button>
                  <button 
                    className={configSection === 'apis' ? 'active' : ''}
                    onClick={() => setConfigSection('apis')}
                  >
                    🔗 API
                  </button>
                  <button 
                    className={configSection === 'features' ? 'active' : ''}
                    onClick={() => setConfigSection('features')}
                  >
                    ⚙️ Funzioni
                  </button>
                </div>

                {/* Sezione Prezzi */}
                {configSection === 'pricing' && (
                  <div className="config-section">
                    <h3>Configurazione Prezzi</h3>
                    <div className="pricing-form">
                      <div className="form-group">
                        <label htmlFor="basePrice">Prezzo Base (€/notte)</label>
                        <input 
                          id="basePrice"
                          type="number" 
                          value={systemConfig.pricing.basePrice}
                          onChange={(e) => setSystemConfig({
                            ...systemConfig,
                            pricing: { ...systemConfig.pricing, basePrice: Number(e.target.value) }
                          })}
                        />
                      </div>
                      <div className="form-group">
                        <label htmlFor="additionalGuestPrice">Prezzo Ospite Aggiuntivo (€/notte)</label>
                        <input 
                          id="additionalGuestPrice"
                          type="number" 
                          value={systemConfig.pricing.additionalGuestPrice}
                          onChange={(e) => setSystemConfig({
                            ...systemConfig,
                            pricing: { ...systemConfig.pricing, additionalGuestPrice: Number(e.target.value) }
                          })}
                        />
                      </div>
                      <div className="form-group">
                        <label htmlFor="cleaningFee">Pulizia Finale (€)</label>
                        <input 
                          id="cleaningFee"
                          type="number" 
                          value={systemConfig.pricing.cleaningFee}
                          onChange={(e) => setSystemConfig({
                            ...systemConfig,
                            pricing: { ...systemConfig.pricing, cleaningFee: Number(e.target.value) }
                          })}
                        />
                      </div>
                      <div className="form-group">
                        <label htmlFor="parkingFee">Parcheggio (€/notte)</label>
                        <input 
                          id="parkingFee"
                          type="number" 
                          value={systemConfig.pricing.parkingFeePerNight}
                          onChange={(e) => setSystemConfig({
                            ...systemConfig,
                            pricing: { ...systemConfig.pricing, parkingFeePerNight: Number(e.target.value) }
                          })}
                        />
                      </div>
                      <div className="form-group">
                        <label htmlFor="touristTax">Tassa Soggiorno (€/persona/notte)</label>
                        <input 
                          id="touristTax"
                          type="number" 
                          value={systemConfig.pricing.touristTaxPerPersonPerNight}
                          onChange={(e) => setSystemConfig({
                            ...systemConfig,
                            pricing: { ...systemConfig.pricing, touristTaxPerPersonPerNight: Number(e.target.value) }
                          })}
                        />
                      </div>
                      <div className="form-group">
                        <label htmlFor="minimumNights">Soggiorno Minimo (notti)</label>
                        <input 
                          id="minimumNights"
                          type="number" 
                          value={systemConfig.pricing.minimumNights}
                          onChange={(e) => setSystemConfig({
                            ...systemConfig,
                            pricing: { ...systemConfig.pricing, minimumNights: Number(e.target.value) }
                          })}
                        />
                      </div>
                      <button 
                        className="btn-primary"
                        onClick={() => updateSystemConfig('pricing', systemConfig.pricing)}
                      >
                        Salva Configurazione Prezzi
                      </button>
                    </div>
                  </div>
                )}

                {/* Sezione Pagamenti */}
                {configSection === 'payments' && (
                  <div className="config-section">
                    <h3>Configurazione Pagamenti</h3>
                    <div className="payments-config">
                      
                      {/* Stripe */}
                      <div className="payment-provider">
                        <h4>
                          <label>
                            <input 
                              id="stripeEnabled"
                              type="checkbox" 
                              checked={systemConfig.payments.stripe.enabled}
                              onChange={(e) => setSystemConfig({
                                ...systemConfig,
                                payments: { 
                                  ...systemConfig.payments,
                                  stripe: { ...systemConfig.payments.stripe, enabled: e.target.checked }
                                }
                              })}
                            />
                            Stripe
                          </label>
                        </h4>
                        {systemConfig.payments.stripe.enabled && (
                          <div className="provider-config">
                            <div className="form-group">
                              <label htmlFor="stripePublicKey">Public Key</label>
                              <input 
                                id="stripePublicKey"
                                type="text" 
                                value={systemConfig.payments.stripe.publicKey}
                                onChange={(e) => setSystemConfig({
                                  ...systemConfig,
                                  payments: { 
                                    ...systemConfig.payments,
                                    stripe: { ...systemConfig.payments.stripe, publicKey: e.target.value }
                                  }
                                })}
                              />
                            </div>
                            <div className="form-group">
                              <label htmlFor="stripeSecretKey">Secret Key</label>
                              <input 
                                id="stripeSecretKey"
                                type="password" 
                                value={systemConfig.payments.stripe.secretKey}
                                onChange={(e) => setSystemConfig({
                                  ...systemConfig,
                                  payments: { 
                                    ...systemConfig.payments,
                                    stripe: { ...systemConfig.payments.stripe, secretKey: e.target.value }
                                  }
                                })}
                              />
                            </div>
                          </div>
                        )}
                      </div>

                      {/* PayPal */}
                      <div className="payment-provider">
                        <h4>
                          <label>
                            <input 
                              id="paypalEnabled"
                              type="checkbox" 
                              checked={systemConfig.payments.paypal.enabled}
                              onChange={(e) => setSystemConfig({
                                ...systemConfig,
                                payments: { 
                                  ...systemConfig.payments,
                                  paypal: { ...systemConfig.payments.paypal, enabled: e.target.checked }
                                }
                              })}
                            />
                            PayPal
                          </label>
                        </h4>
                        {systemConfig.payments.paypal.enabled && (
                          <div className="provider-config">
                            <div className="form-group">
                              <label htmlFor="paypalClientId">Client ID</label>
                              <input 
                                id="paypalClientId"
                                type="text" 
                                value={systemConfig.payments.paypal.clientId}
                                onChange={(e) => setSystemConfig({
                                  ...systemConfig,
                                  payments: { 
                                    ...systemConfig.payments,
                                    paypal: { ...systemConfig.payments.paypal, clientId: e.target.value }
                                  }
                                })}
                              />
                            </div>
                            <div className="form-group">
                              <label htmlFor="paypalClientSecret">Client Secret</label>
                              <input 
                                id="paypalClientSecret"
                                type="password" 
                                value={systemConfig.payments.paypal.clientSecret}
                                onChange={(e) => setSystemConfig({
                                  ...systemConfig,
                                  payments: { 
                                    ...systemConfig.payments,
                                    paypal: { ...systemConfig.payments.paypal, clientSecret: e.target.value }
                                  }
                                })}
                              />
                            </div>
                          </div>
                        )}
                      </div>

                      <button 
                        className="btn-primary"
                        onClick={() => updateSystemConfig('payments', systemConfig.payments)}
                      >
                        Salva Configurazione Pagamenti
                      </button>
                    </div>
                  </div>
                )}

                {/* Sezione API */}
                {configSection === 'apis' && (
                  <div className="config-section">
                    <h3>Configurazione API</h3>
                    <div className="apis-config">
                      
                      {/* Google Calendar */}
                      <div className="api-provider">
                        <h4>
                          <label>
                            <input 
                              id="googleEnabled"
                              type="checkbox" 
                              checked={systemConfig.apis.google.enabled}
                              onChange={(e) => setSystemConfig({
                                ...systemConfig,
                                apis: { 
                                  ...systemConfig.apis,
                                  google: { ...systemConfig.apis.google, enabled: e.target.checked }
                                }
                              })}
                            />
                            Google Calendar
                          </label>
                        </h4>
                        {systemConfig.apis.google.enabled && (
                          <div className="form-group">
                            <label htmlFor="googleApiKey">API Key</label>
                            <input 
                              id="googleApiKey"
                              type="password" 
                              value={systemConfig.apis.google.calendarApiKey}
                              onChange={(e) => setSystemConfig({
                                ...systemConfig,
                                apis: { 
                                  ...systemConfig.apis,
                                  google: { ...systemConfig.apis.google, calendarApiKey: e.target.value }
                                }
                              })}
                            />
                          </div>
                        )}
                      </div>

                      {/* Email SMTP */}
                      <div className="api-provider">
                        <h4>
                          <label>
                            <input 
                              id="emailEnabled"
                              type="checkbox" 
                              checked={systemConfig.apis.email.enabled}
                              onChange={(e) => setSystemConfig({
                                ...systemConfig,
                                apis: { 
                                ...systemConfig.apis,
                                email: { ...systemConfig.apis.email, enabled: e.target.checked }
                              }
                            })}
                          />
                          Email SMTP
                          </label>
                        </h4>
                        {systemConfig.apis.email.enabled && (
                          <div className="provider-config">
                            <div className="form-group">
                              <label htmlFor="smtpHost">SMTP Host</label>
                              <input 
                                id="smtpHost"
                                type="text" 
                                value={systemConfig.apis.email.smtpHost}
                                onChange={(e) => setSystemConfig({
                                  ...systemConfig,
                                  apis: { 
                                    ...systemConfig.apis,
                                    email: { ...systemConfig.apis.email, smtpHost: e.target.value }
                                  }
                                })}
                              />
                            </div>
                            <div className="form-group">
                              <label htmlFor="smtpUser">SMTP User</label>
                              <input 
                                id="smtpUser"
                                type="text" 
                                value={systemConfig.apis.email.smtpUser}
                                onChange={(e) => setSystemConfig({
                                  ...systemConfig,
                                  apis: { 
                                    ...systemConfig.apis,
                                    email: { ...systemConfig.apis.email, smtpUser: e.target.value }
                                  }
                                })}
                              />
                            </div>
                          </div>
                        )}
                      </div>

                      <button 
                        className="btn-primary"
                        onClick={() => updateSystemConfig('apis', systemConfig.apis)}
                      >
                        Salva Configurazione API
                      </button>
                    </div>
                  </div>
                )}

                {/* Sezione Funzioni */}
                {configSection === 'features' && (
                  <div className="config-section">
                    <h3>Funzioni Sistema</h3>
                    <div className="features-config">
                      {Object.entries(systemConfig.features).map(([key, value]) => (
                        <div key={key} className="feature-toggle">
                          <label>
                            <input 
                              type="checkbox" 
                              checked={value as boolean}
                              onChange={(e) => setSystemConfig({
                                ...systemConfig,
                                features: { 
                                  ...systemConfig.features,
                                  [key]: e.target.checked
                                }
                              })}
                            />
                            {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                          </label>
                        </div>
                      ))}
                      
                      <button 
                        className="btn-primary"
                        onClick={() => updateSystemConfig('features', systemConfig.features)}
                      >
                        Salva Configurazione Funzioni
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPageSimple;