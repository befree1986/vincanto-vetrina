import React, { useState, useEffect } from 'react';
import './AdminPage.css';

interface Calendar {
  id: string;
  name: string;
  platform: string;
  url: string;
  active: boolean;
  lastSync: string;
}

interface Booking {
  id: string;
  guestName: string;
  checkIn: string;
  checkOut: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  amount: number;
}

const AdminPageSimple: React.FC = () => {
  const [activeTab, setActiveTab] = useState('calendars');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  
  // Stati per gestione calendari
  const [calendars, setCalendars] = useState<Calendar[]>([
    {
      id: '1',
      name: 'Airbnb - Vincanto',
      platform: 'Airbnb',
      url: 'https://calendar.google.com/calendar/ical/example1/basic.ics',
      active: true,
      lastSync: '2025-10-23 10:30:00'
    },
    {
      id: '2', 
      name: 'Booking.com - Vincanto',
      platform: 'Booking.com',
      url: 'https://calendar.google.com/calendar/ical/example2/basic.ics',
      active: false,
      lastSync: '2025-10-22 15:45:00'
    }
  ]);
  
  // Stati per gestione prenotazioni
  const [bookings, setBookings] = useState<Booking[]>([
    {
      id: '1',
      guestName: 'Mario Rossi',
      checkIn: '2025-11-15',
      checkOut: '2025-11-18',
      status: 'confirmed',
      amount: 450.00
    },
    {
      id: '2',
      guestName: 'Laura Bianchi',
      checkIn: '2025-12-01',
      checkOut: '2025-12-05',
      status: 'pending',
      amount: 680.00
    }
  ]);
  
  // Form per nuovo calendario
  const [newCalendar, setNewCalendar] = useState({
    name: '',
    platform: 'Airbnb',
    url: ''
  });

  // Funzioni per gestione calendari
  const addCalendar = () => {
    if (!newCalendar.name || !newCalendar.url) {
      alert('Nome e URL sono obbligatori');
      return;
    }
    
    const calendar: Calendar = {
      id: Date.now().toString(),
      name: newCalendar.name,
      platform: newCalendar.platform,
      url: newCalendar.url,
      active: true,
      lastSync: new Date().toLocaleString('it-IT')
    };
    
    setCalendars([...calendars, calendar]);
    setNewCalendar({ name: '', platform: 'Airbnb', url: '' });
  };
  
  const toggleCalendar = (id: string) => {
    setCalendars(calendars.map(cal => 
      cal.id === id ? { ...cal, active: !cal.active } : cal
    ));
  };
  
  const removeCalendar = (id: string) => {
    if (confirm('Sei sicuro di voler rimuovere questo calendario?')) {
      setCalendars(calendars.filter(cal => cal.id !== id));
    }
  };
  
  const syncCalendar = (id: string) => {
    setCalendars(calendars.map(cal =>
      cal.id === id ? { ...cal, lastSync: new Date().toLocaleString('it-IT') } : cal
    ));
    alert('Sincronizzazione completata!');
  };
  
  // Funzioni per gestione prenotazioni
  const updateBookingStatus = (id: string, status: 'pending' | 'confirmed' | 'cancelled') => {
    setBookings(bookings.map(booking =>
      booking.id === id ? { ...booking, status } : booking
    ));
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
      </div>
    </div>
  );
};

export default AdminPageSimple;