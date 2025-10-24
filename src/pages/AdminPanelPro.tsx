import React, { useState } from 'react';
import './AdminPanelPro.css';
// import * as AdminAPI from '../services/adminApi';

// Tipi locali per ora (TODO: sostituire con AdminAPI quando PostgreSQL funziona)
type Calendar = {
  id: string;
  name: string;
  platform: string;
  url: string;
  isActive: boolean;
  lastSync: string;
};

type Booking = {
  id: string;
  guestName: string;
  checkIn: string;
  checkOut: string;
  status: 'confirmed' | 'pending';
  totalAmount: number;
  created: string;
};

type SystemConfig = {
  pricing: {
    basePrice: number;
    additionalGuestPrice: number;
    cleaningFee: number;
    parkingFeePerNight: number;
    touristTaxPerPersonPerNight: number;
    minimumNights: number;
    depositPercentage: number;
    currency: string;
  };
  email: {
    smtpHost: string;
    smtpPort: number;
    fromEmail: string;
  };
  payments: {
    stripe: {
      enabled: boolean;
      publicKey: string;
      secretKey: string;
    };
    paypal: {
      enabled: boolean;
      clientId: string;
      clientSecret: string;
    };
    bankTransfer: {
      enabled: boolean;
      iban: string;
      bankName: string;
      accountHolder: string;
    };
  };
};

const AdminPanelPro: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  
  // SuperAdmin nascosto
  const [showSuperAdmin, setShowSuperAdmin] = useState(false);
  
  // Stati per gestione calendari
  const [calendars, setCalendars] = useState<Calendar[]>([]);
  
  // Stati per gestione prenotazioni
  const [bookings, setBookings] = useState<Booking[]>([]);
  
  // Stati per configurazione sistema (SuperAdmin)
  const [systemConfig, setSystemConfig] = useState<SystemConfig | null>(null);
  const [configSection, setConfigSection] = useState<string>('pricing');

  // === AUTENTICAZIONE ===
  
  const handleLogin = async () => {
    if (password === 'vincanto2025') { // Password admin principale
      setIsAuthenticated(true);
      setError('');
      await loadInitialData();
    } else {
      setError('Password non corretta');
    }
  };

  // === FUNZIONI CARICAMENTO DATI ===

  const loadInitialData = async () => {
    await Promise.all([
      loadCalendars(),
      loadBookings()
    ]);
  };

  const loadCalendars = async () => {
    try {
      // Mock data per ora - TODO: sostituire con API reale quando PostgreSQL funziona
      setCalendars([
        { id: '1', name: 'Airbnb Vincanto', platform: 'Airbnb', url: 'https://airbnb.com/calendar/123', isActive: true, lastSync: new Date().toISOString() },
        { id: '2', name: 'Booking.com', platform: 'Booking.com', url: 'https://booking.com/ical/456', isActive: true, lastSync: new Date().toISOString() }
      ]);
    } catch (error) {
      console.error('Errore caricamento calendari:', error);
      setError('Errore caricamento calendari');
    }
  };

  const loadBookings = async () => {
    try {
      // Mock data per ora - TODO: sostituire con API reale
      setBookings([
        { 
          id: '1', 
          guestName: 'Mario Rossi', 
          checkIn: '2025-11-01', 
          checkOut: '2025-11-04', 
          status: 'confirmed', 
          totalAmount: 572,
          created: new Date().toISOString()
        }
      ]);
    } catch (error) {
      console.error('Errore caricamento prenotazioni:', error);
      setError('Errore caricamento prenotazioni');
    }
  };

  const loadSystemConfig = async () => {
    try {
      // Mock config per ora - TODO: sostituire con API reale
      setSystemConfig({
        pricing: {
          basePrice: 80.00,
          additionalGuestPrice: 20.00,
          cleaningFee: 50.00,
          parkingFeePerNight: 10.00,
          touristTaxPerPersonPerNight: 2.00,
          minimumNights: 2,
          depositPercentage: 0.30,
          currency: 'EUR'
        },
        email: {
          smtpHost: 'smtp.gmail.com',
          smtpPort: 587,
          fromEmail: 'noreply@vincantomaori.it'
        },
        payments: {
          stripe: {
            enabled: true,
            publicKey: '',
            secretKey: ''
          },
          paypal: {
            enabled: true,
            clientId: '',
            clientSecret: ''
          },
          bankTransfer: {
            enabled: true,
            iban: '',
            bankName: '',
            accountHolder: ''
          }
        }
      });
    } catch (error) {
      console.error('Errore caricamento configurazione:', error);
      setError('Errore caricamento configurazione');
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
              onClick={() => {
                const show = !showSuperAdmin;
                if (show && !showSuperAdmin) {
                  const pwd = prompt('Password SuperAdmin:');
                  if (pwd === 'superadmin2025') {
                    setShowSuperAdmin(true);
                    loadSystemConfig();
                  } else {
                    setError('Password SuperAdmin errata');
                  }
                } else {
                  setShowSuperAdmin(false);
                }
              }}
              className="admin-btn-ghost"
              title="SuperAdmin Access"
            >
              ⚙️
            </button>
            
            <button 
              onClick={() => {
                setIsAuthenticated(false);
                setShowSuperAdmin(false);
                setPassword('');
              }} 
              className="admin-btn-secondary"
            >
              Esci
            </button>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="admin-nav">
        <div className="admin-nav-tabs">
          <button 
            className={`admin-tab ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            📊 Dashboard
          </button>
          
          <button 
            className={`admin-tab ${activeTab === 'bookings' ? 'active' : ''}`}
            onClick={() => setActiveTab('bookings')}
          >
            📝 Prenotazioni
          </button>
          
          <button 
            className={`admin-tab ${activeTab === 'calendars' ? 'active' : ''}`}
            onClick={() => setActiveTab('calendars')}
          >
            📅 Calendari
          </button>
          
          <button 
            className={`admin-tab ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveTab('settings')}
          >
            ⚙️ Impostazioni
          </button>
          
          {showSuperAdmin && (
            <button 
              className={`admin-tab superadmin ${activeTab === 'superadmin' ? 'active' : ''}`}
              onClick={() => setActiveTab('superadmin')}
            >
              🔧 SuperAdmin
            </button>
          )}
        </div>
      </nav>

      {/* Main Content */}
      <main className="admin-main">
        {error && (
          <div className="admin-alert admin-alert-error">
            ⚠️ {error}
            <button onClick={() => setError('')} className="admin-alert-close">×</button>
          </div>
        )}

        {/* Dashboard */}
        {activeTab === 'dashboard' && (
          <div className="admin-section">
            <h2>📊 Dashboard Vincanto</h2>
            
            <div className="admin-stats-grid">
              <div className="admin-stat-card">
                <div className="admin-stat-icon">📝</div>
                <div className="admin-stat-info">
                  <h3>{bookings.length}</h3>
                  <p>Prenotazioni Totali</p>
                </div>
              </div>
              
              <div className="admin-stat-card">
                <div className="admin-stat-icon">📅</div>
                <div className="admin-stat-info">
                  <h3>{calendars.length}</h3>
                  <p>Calendari Attivi</p>
                </div>
              </div>
              
              <div className="admin-stat-card">
                <div className="admin-stat-icon">💰</div>
                <div className="admin-stat-info">
                  <h3>€{bookings.reduce((sum, b) => sum + b.totalAmount, 0)}</h3>
                  <p>Fatturato Totale</p>
                </div>
              </div>
              
              <div className="admin-stat-card">
                <div className="admin-stat-icon">✅</div>
                <div className="admin-stat-info">
                  <h3>{bookings.filter(b => b.status === 'confirmed').length}</h3>
                  <p>Confermate</p>
                </div>
              </div>
            </div>
            
            <div className="admin-recent-activity">
              <h3>📋 Attività Recente</h3>
              <div className="admin-activity-list">
                <div className="admin-activity-item">
                  <span className="admin-activity-icon">📝</span>
                  <span>Nuova prenotazione di Mario Rossi</span>
                  <span className="admin-activity-time">2 ore fa</span>
                </div>
                <div className="admin-activity-item">
                  <span className="admin-activity-icon">📅</span>
                  <span>Sincronizzazione calendario Airbnb</span>
                  <span className="admin-activity-time">4 ore fa</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Prenotazioni */}
        {activeTab === 'bookings' && (
          <div className="admin-section">
            <div className="admin-section-header">
              <h2>📝 Gestione Prenotazioni</h2>
              <button className="admin-btn-primary">
                + Nuova Prenotazione
              </button>
            </div>
            
            <div className="admin-table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Ospite</th>
                    <th>Check-in</th>
                    <th>Check-out</th>
                    <th>Stato</th>
                    <th>Totale</th>
                    <th>Azioni</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map(booking => (
                    <tr key={booking.id}>
                      <td>#{booking.id}</td>
                      <td>{booking.guestName}</td>
                      <td>{new Date(booking.checkIn).toLocaleDateString()}</td>
                      <td>{new Date(booking.checkOut).toLocaleDateString()}</td>
                      <td>
                        <span className={`admin-status ${booking.status}`}>
                          {booking.status === 'confirmed' ? '✅ Confermata' : '⏳ In attesa'}
                        </span>
                      </td>
                      <td>€{booking.totalAmount}</td>
                      <td>
                        <button className="admin-btn-small">👁️</button>
                        <button className="admin-btn-small">✏️</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Calendari */}
        {activeTab === 'calendars' && (
          <div className="admin-section">
            <div className="admin-section-header">
              <h2>📅 Gestione Calendari</h2>
              <button className="admin-btn-primary">
                + Nuovo Calendario
              </button>
            </div>
            
            <div className="admin-cards-grid">
              {calendars.map(calendar => (
                <div key={calendar.id} className="admin-calendar-card">
                  <div className="admin-card-header">
                    <h3>{calendar.name}</h3>
                    <span className={`admin-status ${calendar.isActive ? 'active' : 'inactive'}`}>
                      {calendar.isActive ? '🟢 Attivo' : '🔴 Inattivo'}
                    </span>
                  </div>
                  
                  <div className="admin-card-content">
                    <p><strong>Piattaforma:</strong> {calendar.platform}</p>
                    <p><strong>URL:</strong> <code>{calendar.url}</code></p>
                    <p><strong>Ultima Sync:</strong> {new Date(calendar.lastSync).toLocaleString()}</p>
                  </div>
                  
                  <div className="admin-card-actions">
                    <button className="admin-btn-small admin-btn-primary">🔄 Sincronizza</button>
                    <button className="admin-btn-small">⚙️ Configura</button>
                    <button className="admin-btn-small admin-btn-danger">🗑️</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Impostazioni */}
        {activeTab === 'settings' && (
          <div className="admin-section">
            <h2>⚙️ Impostazioni Generali</h2>
            
            <div className="admin-settings-grid">
              <div className="admin-settings-card">
                <h3>📧 Email</h3>
                <p>Configurazione notifiche email</p>
                <button className="admin-btn-secondary">Configura</button>
              </div>
              
              <div className="admin-settings-card">
                <h3>💳 Pagamenti</h3>
                <p>Stripe, PayPal, Bonifico</p>
                <button className="admin-btn-secondary">Configura</button>
              </div>
              
              <div className="admin-settings-card">
                <h3>🌐 Sito Web</h3>
                <p>Configurazioni frontend</p>
                <button className="admin-btn-secondary">Configura</button>
              </div>
              
              <div className="admin-settings-card">
                <h3>🔒 Sicurezza</h3>
                <p>Password e accessi</p>
                <button className="admin-btn-secondary">Configura</button>
              </div>
            </div>
          </div>
        )}

        {/* SuperAdmin - NASCOSTO */}
        {activeTab === 'superadmin' && showSuperAdmin && (
          <div className="admin-section superadmin-section">
            <div className="admin-section-header">
              <h2>🔧 SuperAdmin - Configurazione Sistema</h2>
              <span className="admin-badge admin-badge-danger">ACCESSO RISERVATO</span>
            </div>
            
            <div className="admin-superadmin-nav">
              <button 
                className={`admin-btn-tab ${configSection === 'pricing' ? 'active' : ''}`}
                onClick={() => setConfigSection('pricing')}
              >
                💰 Prezzi
              </button>
              <button 
                className={`admin-btn-tab ${configSection === 'email' ? 'active' : ''}`}
                onClick={() => setConfigSection('email')}
              >
                📧 Email
              </button>
              <button 
                className={`admin-btn-tab ${configSection === 'payments' ? 'active' : ''}`}
                onClick={() => setConfigSection('payments')}
              >
                💳 Pagamenti
              </button>
            </div>
            
            {systemConfig && configSection === 'pricing' && (
              <div className="admin-config-form">
                <h3>💰 Configurazione Prezzi</h3>
                <div className="admin-form-grid">
                  <div className="admin-form-group">
                    <label htmlFor="basePrice">Prezzo Base per Adulto (€/notte)</label>
                    <input 
                      id="basePrice"
                      type="number" 
                      value={systemConfig.pricing.basePrice} 
                      className="admin-input"
                      placeholder="80.00"
                      onChange={(e) => setSystemConfig({
                        ...systemConfig,
                        pricing: {...systemConfig.pricing, basePrice: parseFloat(e.target.value)}
                      })}
                    />
                  </div>
                  
                  <div className="admin-form-group">
                    <label htmlFor="additionalPrice">Prezzo Ospite Aggiuntivo (€/notte)</label>
                    <input 
                      id="additionalPrice"
                      type="number" 
                      value={systemConfig.pricing.additionalGuestPrice} 
                      className="admin-input"
                      placeholder="20.00"
                      onChange={(e) => setSystemConfig({
                        ...systemConfig,
                        pricing: {...systemConfig.pricing, additionalGuestPrice: parseFloat(e.target.value)}
                      })}
                    />
                  </div>
                  
                  <div className="admin-form-group">
                    <label htmlFor="cleaningFee">Pulizia Finale (€)</label>
                    <input 
                      id="cleaningFee"
                      type="number" 
                      value={systemConfig.pricing.cleaningFee} 
                      className="admin-input"
                      placeholder="50.00"
                      onChange={(e) => setSystemConfig({
                        ...systemConfig,
                        pricing: {...systemConfig.pricing, cleaningFee: parseFloat(e.target.value)}
                      })}
                    />
                  </div>
                  
                  <div className="admin-form-group">
                    <label htmlFor="parkingFee">Parcheggio Privato (€/notte)</label>
                    <input 
                      id="parkingFee"
                      type="number" 
                      value={systemConfig.pricing.parkingFeePerNight} 
                      className="admin-input"
                      placeholder="10.00"
                      onChange={(e) => setSystemConfig({
                        ...systemConfig,
                        pricing: {...systemConfig.pricing, parkingFeePerNight: parseFloat(e.target.value)}
                      })}
                    />
                  </div>
                  
                  <div className="admin-form-group">
                    <label htmlFor="touristTax">Tassa Soggiorno (€/persona/notte)</label>
                    <input 
                      id="touristTax"
                      type="number" 
                      value={systemConfig.pricing.touristTaxPerPersonPerNight} 
                      className="admin-input"
                      placeholder="2.00"
                      onChange={(e) => setSystemConfig({
                        ...systemConfig,
                        pricing: {...systemConfig.pricing, touristTaxPerPersonPerNight: parseFloat(e.target.value)}
                      })}
                    />
                  </div>
                  
                  <div className="admin-form-group">
                    <label htmlFor="minNights">Notti Minime</label>
                    <input 
                      id="minNights"
                      type="number" 
                      value={systemConfig.pricing.minimumNights} 
                      className="admin-input"
                      placeholder="2"
                      onChange={(e) => setSystemConfig({
                        ...systemConfig,
                        pricing: {...systemConfig.pricing, minimumNights: parseInt(e.target.value)}
                      })}
                    />
                  </div>
                  
                  <div className="admin-form-group">
                    <label htmlFor="deposit">Percentuale Acconto (%)</label>
                    <input 
                      id="deposit"
                      type="number" 
                      step="0.01"
                      value={systemConfig.pricing.depositPercentage} 
                      className="admin-input"
                      placeholder="0.30"
                      onChange={(e) => setSystemConfig({
                        ...systemConfig,
                        pricing: {...systemConfig.pricing, depositPercentage: parseFloat(e.target.value)}
                      })}
                    />
                  </div>
                </div>
                
                <div className="admin-form-actions">
                  <button className="admin-btn-primary">
                    💾 Salva Configurazione
                  </button>
                  <button className="admin-btn-secondary">
                    🔄 Ripristina
                  </button>
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