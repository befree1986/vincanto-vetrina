/* eslint-disable jsx-a11y/label-has-associated-control, jsx-a11y/no-autofocus */
import React, { useState } from 'react';
import './AdminPanelPro.css';
import '../styles/AdminSuperAdmin.css';

const AdminPanelPro: React.FC = () => {
  console.log('🚀 AdminPanelPro component rendering...');
  
  // Stati principali
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  
  // === AUTENTICAZIONE ===
  const handleLogin = async () => {
    console.log('🔐 Tentativo di login...');
    if (password === 'vincanto2025') {
      console.log('✅ Login riuscito, imposto autenticazione...');
      setIsAuthenticated(true);
      setError('');
      console.log('🎯 Stato autenticazione impostato');
    } else {
      console.log('❌ Password errata');
      setError('Password non corretta');
    }
  };
  
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

      {/* Navigazione Tab Semplificata */}
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
        </div>
      </nav>

      {/* Contenuto Principale */}
      <main className="admin-content">
        {error && <div className="admin-error-banner">{error}</div>}

        {/* Dashboard */}
        {activeTab === 'dashboard' && (
          <div className="admin-dashboard">
            <h2>📊 Dashboard Generale</h2>
            <div className="admin-stats-grid">
              <div className="admin-stat-card">
                <h3>Prenotazioni Totali</h3>
                <div className="stat-value">3</div>
              </div>
              
              <div className="admin-stat-card">
                <h3>Calendari Attivi</h3>
                <div className="stat-value">2</div>
              </div>
              
              <div className="admin-stat-card">
                <h3>Ricavi Totali</h3>
                <div className="stat-value">€850.00</div>
              </div>
              
              <div className="admin-stat-card">
                <h3>Tasso Occupazione</h3>
                <div className="stat-value">75%</div>
              </div>
            </div>
          </div>
        )}

        {/* Prenotazioni */}
        {activeTab === 'bookings' && (
          <div className="admin-bookings">
            <h2>📅 Gestione Prenotazioni</h2>
            <p>Sistema di gestione prenotazioni - In sviluppo</p>
          </div>
        )}

        {/* Calendari */}
        {activeTab === 'calendars' && (
          <div className="admin-calendars">
            <h2>🗓️ Gestione Calendari</h2>
            <p>Sistema di gestione calendari - In sviluppo</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminPanelPro;