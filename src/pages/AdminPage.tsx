import React, { useState, useEffect } from 'react';
import CalendarManager from '../components/CalendarManager';
import './AdminPage.css';

const AdminPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('calendars');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  // La password non deve essere qui. Usiamo una variabile d'ambiente.
  // In un file .env.local (che è in .gitignore) aggiungi:
  // VITE_ADMIN_PASSWORD="la_tua_password_segreta"
  const adminPassword = import.meta.env.VITE_ADMIN_PASSWORD;

  // Controlla se l'utente era già autenticato
  useEffect(() => {
    const savedAuth = localStorage.getItem('vincanto_admin_auth');
    if (savedAuth === 'authenticated') {
      setIsAuthenticated(true);
    }
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === adminPassword) {
      setIsAuthenticated(true);
      setError('');
      // Salva l'autenticazione nel localStorage
      localStorage.setItem('vincanto_admin_auth', 'authenticated');
    } else {
      setError('Password non corretta');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setPassword('');
    // Rimuovi l'autenticazione dal localStorage
    localStorage.removeItem('vincanto_admin_auth');
  };

  if (!isAuthenticated) {
    return (
      <div className="admin-login">
        <div className="login-container">
          <h2>🔐 Accesso Amministrazione</h2>
          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label htmlFor="password">Password:</label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Inserisci la password"
                autoFocus
              />
            </div>
            {error && <div className="error-message">{error}</div>}
            <button type="submit" className="btn-login">
              Accedi
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <div className="admin-header">
        <h1>🏨 Amministrazione Vincanto</h1>
        <button
          className="btn-logout"
          onClick={handleLogout}
        >
          🚪 Logout
        </button>
      </div>

      <div className="admin-tabs">
        <button
          className={`tab-button ${activeTab === 'calendars' ? 'active' : ''}`}
          onClick={() => setActiveTab('calendars')}
        >
          📅 Calendari Esterni
        </button>
        <button
          className={`tab-button ${activeTab === 'bookings' ? 'active' : ''}`}
          onClick={() => setActiveTab('bookings')}
        >
          📋 Prenotazioni
        </button>
        <button
          className={`tab-button ${activeTab === 'settings' ? 'active' : ''}`}
          onClick={() => setActiveTab('settings')}
        >
          ⚙️ Impostazioni
        </button>
      </div>

      <div className="admin-content">
        {activeTab === 'calendars' && <CalendarManager />}

        {activeTab === 'bookings' && (
          <div className="bookings-panel">
            <h2>📋 Gestione Prenotazioni</h2>
            <div className="coming-soon">
              <p>🚧 Sezione in sviluppo</p>
              <p>Qui sarà possibile gestire tutte le prenotazioni interne ed esterne</p>
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="settings-panel">
            <h2>⚙️ Impostazioni Sistema</h2>
            <div className="coming-soon">
              <p>🚧 Sezione in sviluppo</p>
              <p>Qui sarà possibile configurare:</p>
              <ul>
                <li>Prezzi e politiche di prenotazione</li>
                <li>Notifiche email</li>
                <li>Parametri di sistema</li>
                <li>Backup e manutenzione</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPage;