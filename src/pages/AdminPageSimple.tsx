import React, { useState, useEffect } from 'react';
import './AdminPage.css';

const AdminPageSimple: React.FC = () => {
  const [activeTab, setActiveTab] = useState('calendars');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  // Password semplice per demo - in produzione usare autenticazione robusta
  const adminPassword = 'vincanto2024';

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
        <button onClick={handleLogout} className="logout-button">
          Logout
        </button>
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
      </div>

      <div className="admin-content">
        {activeTab === 'calendars' && (
          <div className="admin-section">
            <h2>Gestione Calendari</h2>
            <p>Sistema di sincronizzazione calendari temporaneamente non disponibile.</p>
            <div className="admin-placeholder">
              <p>Funzionalità in fase di sviluppo:</p>
              <ul>
                <li>Sincronizzazione Airbnb</li>
                <li>Sincronizzazione Booking.com</li>
                <li>Gestione date bloccate</li>
                <li>Import/Export iCal</li>
              </ul>
            </div>
          </div>
        )}

        {activeTab === 'bookings' && (
          <div className="admin-section">
            <h2>Gestione Prenotazioni</h2>
            <p>Elenco prenotazioni e gestione stato.</p>
            <div className="admin-placeholder">
              <p>Funzionalità in fase di sviluppo:</p>
              <ul>
                <li>Visualizzazione prenotazioni</li>
                <li>Cambio stato prenotazioni</li>
                <li>Gestione pagamenti</li>
                <li>Export report</li>
              </ul>
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="admin-section">
            <h2>Impostazioni Sistema</h2>
            <p>Configurazione prezzi e parametri di sistema.</p>
            <div className="admin-placeholder">
              <p>Funzionalità in fase di sviluppo:</p>
              <ul>
                <li>Configurazione prezzi</li>
                <li>Gestione tasse</li>
                <li>Impostazioni email</li>
                <li>Backup database</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPageSimple;