import React, { useState, useEffect } from 'react';

interface ExternalCalendar {
  id: number;
  name: string;
  platform: string;
  ical_url: string;
  owner_email: string;
  is_active: boolean;
  last_sync: string | null;
  last_sync_error: string | null;
  created_at: string;
}

interface SyncStats {
  platform: string;
  calendar_count: number;
  booking_count: number;
  last_sync: string | null;
  error_count: number;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const CalendarManager: React.FC = () => {
  const [calendars, setCalendars] = useState<ExternalCalendar[]>([]);
  const [stats, setStats] = useState<SyncStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [adding, setAdding] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [backendConnected, setBackendConnected] = useState<boolean | null>(null);

  const [newCalendar, setNewCalendar] = useState({
    name: '',
    platform: 'booking.com',
    ical_url: '',
    owner_email: ''
  });

  useEffect(() => {
    checkBackendConnection();
    loadCalendars();
    loadStats();
  }, []);

  const checkBackendConnection = async () => {
    try {
      // Prima prova la connessione reale
      console.log('🔍 Controllo connessione backend:', API_BASE_URL);
      const response = await fetch(`${API_BASE_URL}/api/calendars`);
      if (response.ok) {
        setBackendConnected(true);
        console.log('✅ Backend connesso');
      } else {
        setBackendConnected(false);
        console.log('❌ Backend non risponde correttamente');
      }
    } catch (err) {
      setBackendConnected(false);
      console.error('❌ Backend non raggiungibile:', err);
    }
  };

  const loadCalendars = async () => {
    try {
      console.log('📅 Caricamento calendari da:', `${API_BASE_URL}/api/calendars`);
      const response = await fetch(`${API_BASE_URL}/api/calendars`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('📊 Risposta API calendari:', data);
      
      if (data.success) {
        setCalendars(data.data);
        console.log('✅ Calendari caricati:', data.data.length, 'calendari');
        setError(null); // Rimuove errori precedenti
      } else {
        setError(`Errore API: ${data.error || 'Errore sconosciuto'}`);
      }
    } catch (err) {
      console.error('❌ Errore caricamento calendari:', err);
      
      // Modalità Demo: carica dati fittizi quando il backend non è raggiungibile
      console.log('📱 Attivazione modalità DEMO');
      setCalendars([
        {
          id: 1,
          name: 'Booking.com Demo',
          platform: 'booking.com',
          ical_url: 'https://ical.booking.com/v1/export?t=demo',
          owner_email: 'demo@vincanto.it',
          is_active: true,
          created_at: new Date().toISOString(),
          last_sync: new Date().toISOString(),
          last_sync_error: null
        }
      ]);
      
      setError('⚠️ Modalità Demo: Backend non disponibile. Vengono mostrati dati di esempio.');
    }
  };

  const loadStats = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/calendars/sync-stats`);
      const data = await response.json();
      
      if (data.success) {
        setStats(data.data);
      }
    } catch (err) {
      console.error('Error loading stats:', err);
      
      // Modalità Demo: statistiche fittizie
      setStats([
        {
          platform: 'booking.com',
          calendar_count: 1,
          booking_count: 8,
          last_sync: new Date().toISOString(),
          error_count: 0
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const addCalendar = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setAdding(true);

    // Validazione lato client
    if (!newCalendar.name.trim()) {
      setError('Il nome del calendario è obbligatorio');
      setAdding(false);
      return;
    }
    
    if (!newCalendar.ical_url.trim()) {
      setError('L\'URL iCal è obbligatorio');
      setAdding(false);
      return;
    }

    try {
      console.log('➕ Aggiunta calendario:', newCalendar);
      const response = await fetch(`${API_BASE_URL}/api/calendars`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newCalendar),
      });

      console.log('🌐 Status response:', response.status, response.statusText);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('📤 Risposta server:', data);

      if (data.success) {
        setCalendars([...calendars, data.data]);
        setNewCalendar({
          name: '',
          platform: 'booking.com',
          ical_url: '',
          owner_email: ''
        });
        setShowAddForm(false);
        setSuccess('Calendario aggiunto con successo!');
        console.log('✅ Calendario aggiunto con successo');
        
        // Ricarica anche le statistiche
        loadStats();
      } else {
        setError(data.error || 'Errore nell\'aggiunta del calendario');
      }
    } catch (err) {
      console.error('❌ Errore aggiunta calendario:', err);
      setError(`Errore: ${err instanceof Error ? err.message : 'Connessione al server fallita'}`);
    } finally {
      setAdding(false);
    }
  };

  const removeCalendar = async (id: number) => {
    if (!confirm('Sei sicuro di voler rimuovere questo calendario?')) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/calendars/${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        setCalendars(calendars.filter(cal => cal.id !== id));
        setSuccess('Calendario rimosso con successo!');
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Errore di connessione');
    }
  };

  const toggleCalendar = async (id: number) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/calendars/${id}/toggle`, {
        method: 'PATCH',
      });

      const data = await response.json();

      if (data.success) {
        setCalendars(calendars.map(cal => 
          cal.id === id ? data.data : cal
        ));
        setSuccess(`Calendario ${data.data.is_active ? 'attivato' : 'disattivato'} con successo!`);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Errore di connessione');
    }
  };

  const syncCalendars = async () => {
    setSyncing(true);
    setError(null);
    setSuccess(null);

    try {
      console.log('🔄 Avvio sincronizzazione...');
      const response = await fetch(`${API_BASE_URL}/api/calendars/sync`, {
        method: 'POST',
      });

      const data = await response.json();
      console.log('📊 Risultati sincronizzazione:', data);

      if (data.success) {
        // Ricarica i calendari per aggiornare i timestamp
        await loadCalendars();
        await loadStats();
        setSuccess('Sincronizzazione completata con successo!');
      } else {
        setError(data.error);
      }
    } catch (err) {
      console.error('❌ Errore sincronizzazione:', err);
      setError('Errore durante la sincronizzazione');
    } finally {
      setSyncing(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Mai';
    return new Date(dateString).toLocaleString('it-IT');
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'booking.com': return '🏨';
      case 'airbnb': return '🏡';
      case 'vrbo': return '🏘️';
      case 'google': return '📅';
      default: return '📋';
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-6 bg-gray-50 min-h-screen">
        <div className="flex flex-col items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mb-4"></div>
          <p className="text-gray-600 text-lg">Caricamento calendari...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-600 to-orange-700 text-white rounded-2xl p-8 mb-8 shadow-xl">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold mb-2">📅 Gestione Calendari Esterni</h2>
            <div className="flex items-center gap-3">
              <p className="text-orange-100">Sincronizza automaticamente con tutte le piattaforme</p>
              {backendConnected !== null && (
                <span className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${
                  backendConnected 
                    ? 'bg-green-500 text-white' 
                    : 'bg-red-500 text-white'
                }`}>
                  {backendConnected ? '🟢 Backend Online' : '🔴 Backend Offline'}
                </span>
              )}
            </div>
          </div>
          <div className="flex gap-4">
            <button
              className="bg-white text-orange-600 px-6 py-3 rounded-full font-semibold hover:bg-gray-100 transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={syncCalendars}
              disabled={syncing}
            >
              {syncing ? '🔄 Sincronizzando...' : '🔄 Sincronizza Tutti'}
            </button>
            <button
              className="bg-white text-orange-600 px-6 py-3 rounded-full font-semibold hover:bg-gray-100 transition-all duration-300 transform hover:scale-105"
              onClick={() => setShowAddForm(true)}
            >
              ➕ Aggiungi Calendario
            </button>
            {!backendConnected && (
              <button
                className="bg-red-500 text-white px-4 py-2 rounded-full text-sm font-semibold hover:bg-red-600 transition-colors duration-300"
                onClick={checkBackendConnection}
              >
                🔄 Testa Connessione
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Messaggi */}
      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded-lg flex justify-between items-center">
          <span>❌ {error}</span>
          <button 
            onClick={() => setError(null)}
            className="text-red-500 hover:text-red-700 font-bold text-xl"
          >
            ✕
          </button>
        </div>
      )}

      {success && (
        <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-6 rounded-lg flex justify-between items-center">
          <span>✅ {success}</span>
          <button 
            onClick={() => setSuccess(null)}
            className="text-green-500 hover:text-green-700 font-bold text-xl"
          >
            ✕
          </button>
        </div>
      )}

      {/* Statistiche */}
      {stats.length > 0 && (
        <div className="mb-8">
          <h3 className="text-2xl font-bold text-gray-800 mb-6">📊 Statistiche Sincronizzazione</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {stats.map((stat) => (
              <div key={stat.platform} className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-300">
                <div className="flex items-center mb-4">
                  <span className="text-3xl mr-3">{getPlatformIcon(stat.platform)}</span>
                  <h4 className="text-lg font-semibold text-gray-800 capitalize">{stat.platform}</h4>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Calendari:</span>
                    <span className="font-semibold text-orange-600">{stat.calendar_count}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Prenotazioni:</span>
                    <span className="font-semibold text-green-600">{stat.booking_count}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Ultima sync:</span>
                    <span className="font-semibold text-blue-600 text-sm">{formatDate(stat.last_sync)}</span>
                  </div>
                  {stat.error_count > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Errori:</span>
                      <span className="font-semibold text-red-600">{stat.error_count}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal Aggiunta Calendario */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-8 w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl transform transition-all duration-300">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-gray-800">➕ Aggiungi Nuovo Calendario</h3>
              <button 
                onClick={() => setShowAddForm(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={addCalendar} className="space-y-6">
              <div>
                <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-2">
                  Nome Calendario *
                </label>
                <input
                  type="text"
                  id="name"
                  value={newCalendar.name}
                  onChange={(e) => setNewCalendar({...newCalendar, name: e.target.value})}
                  placeholder="es. Villa Maiori - Booking.com"
                  required
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-orange-500 focus:outline-none transition-colors duration-300"
                />
              </div>

              <div>
                <label htmlFor="platform" className="block text-sm font-semibold text-gray-700 mb-2">
                  Piattaforma *
                </label>
                <select
                  id="platform"
                  value={newCalendar.platform}
                  onChange={(e) => setNewCalendar({...newCalendar, platform: e.target.value})}
                  required
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-orange-500 focus:outline-none transition-colors duration-300"
                >
                  <option value="booking.com">🏨 Booking.com</option>
                  <option value="airbnb">🏡 Airbnb</option>
                  <option value="vrbo">🏘️ VRBO</option>
                  <option value="google">📅 Google Calendar</option>
                  <option value="altro">📋 Altro</option>
                </select>
              </div>

              <div>
                <label htmlFor="ical_url" className="block text-sm font-semibold text-gray-700 mb-2">
                  URL iCal *
                </label>
                <input
                  type="url"
                  id="ical_url"
                  value={newCalendar.ical_url}
                  onChange={(e) => setNewCalendar({...newCalendar, ical_url: e.target.value})}
                  placeholder="https://calendar.booking.com/calendar/ics/xxxxx.ics"
                  required
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-orange-500 focus:outline-none transition-colors duration-300"
                />
                <p className="text-sm text-gray-500 mt-1">URL del calendario iCal fornito dalla piattaforma</p>
              </div>

              <div>
                <label htmlFor="owner_email" className="block text-sm font-semibold text-gray-700 mb-2">
                  Email Proprietario
                </label>
                <input
                  type="email"
                  id="owner_email"
                  value={newCalendar.owner_email}
                  onChange={(e) => setNewCalendar({...newCalendar, owner_email: e.target.value})}
                  placeholder="proprietario@email.com"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-orange-500 focus:outline-none transition-colors duration-300"
                />
              </div>

              <div className="flex gap-4 pt-4">
                <button 
                  type="button" 
                  onClick={() => setShowAddForm(false)}
                  className="flex-1 bg-gray-500 text-white py-3 px-6 rounded-lg font-semibold hover:bg-gray-600 transition-colors duration-300"
                >
                  Annulla
                </button>
                <button 
                  type="submit"
                  disabled={adding}
                  className={`flex-1 py-3 px-6 rounded-lg font-semibold transition-colors duration-300 ${
                    adding 
                      ? 'bg-gray-400 text-gray-700 cursor-not-allowed' 
                      : 'bg-orange-600 text-white hover:bg-orange-700'
                  }`}
                >
                  {adding ? '⏳ Aggiungendo...' : 'Aggiungi Calendario'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Lista Calendari */}
      <div className="mb-8">
        <h3 className="text-2xl font-bold text-gray-800 mb-6">📋 Calendari Configurati ({calendars.length})</h3>
        
        {calendars.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center shadow-lg">
            <div className="text-6xl mb-4">📅</div>
            <h4 className="text-xl font-semibold text-gray-700 mb-3">Nessun calendario configurato</h4>
            <p className="text-gray-500 mb-6">Aggiungi il tuo primo calendario esterno per iniziare la sincronizzazione automatica</p>
            <button 
              onClick={() => setShowAddForm(true)} 
              className="bg-orange-600 text-white px-8 py-3 rounded-full font-semibold hover:bg-orange-700 transition-colors duration-300"
            >
              ➕ Aggiungi Primo Calendario
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {calendars.map((calendar) => (
              <div key={calendar.id} className={`bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border-l-4 ${calendar.is_active ? 'border-green-500' : 'border-red-500'}`}>
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center">
                    <span className="text-2xl mr-3">{getPlatformIcon(calendar.platform)}</span>
                    <div>
                      <h4 className="text-lg font-semibold text-gray-800">{calendar.name}</h4>
                      <span className="text-sm text-gray-500 capitalize bg-gray-100 px-2 py-1 rounded-full">{calendar.platform}</span>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold ${calendar.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {calendar.is_active ? '🟢 Attivo' : '🔴 Inattivo'}
                  </span>
                </div>

                <div className="space-y-3 mb-4">
                  <div>
                    <span className="text-sm text-gray-600 font-medium">URL iCal:</span>
                    <p className="text-xs text-gray-800 bg-gray-50 p-2 rounded mt-1 break-all font-mono">{calendar.ical_url}</p>
                  </div>
                  
                  {calendar.owner_email && (
                    <div>
                      <span className="text-sm text-gray-600 font-medium">Proprietario:</span>
                      <p className="text-sm text-gray-800">{calendar.owner_email}</p>
                    </div>
                  )}
                  
                  <div>
                    <span className="text-sm text-gray-600 font-medium">Ultima sincronizzazione:</span>
                    <p className="text-sm text-gray-800">{formatDate(calendar.last_sync)}</p>
                  </div>
                  
                  {calendar.last_sync_error && (
                    <div>
                      <span className="text-sm text-red-600 font-medium">Ultimo errore:</span>
                      <p className="text-sm text-red-700 bg-red-50 p-2 rounded mt-1">{calendar.last_sync_error}</p>
                    </div>
                  )}
                  
                  <div>
                    <span className="text-sm text-gray-600 font-medium">Creato il:</span>
                    <p className="text-sm text-gray-800">{formatDate(calendar.created_at)}</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => toggleCalendar(calendar.id)}
                    className={`flex-1 py-2 px-4 rounded-lg font-semibold transition-colors duration-300 ${
                      calendar.is_active 
                        ? 'bg-yellow-500 text-white hover:bg-yellow-600' 
                        : 'bg-green-500 text-white hover:bg-green-600'
                    }`}
                  >
                    {calendar.is_active ? '⏸️ Disattiva' : '▶️ Attiva'}
                  </button>
                  <button
                    onClick={() => removeCalendar(calendar.id)}
                    className="flex-1 bg-red-500 text-white py-2 px-4 rounded-lg font-semibold hover:bg-red-600 transition-colors duration-300"
                  >
                    🗑️ Rimuovi
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Guida Veloce */}
      <div className="bg-white rounded-2xl p-8 shadow-lg">
        <h3 className="text-2xl font-bold text-gray-800 mb-6">📚 Guida Veloce</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl">
            <h4 className="text-lg font-semibold text-blue-800 mb-3">🏨 Booking.com</h4>
            <p className="text-sm text-blue-700">Vai su Extranet → Calendario → iCal → Copia URL esportazione</p>
          </div>
          <div className="bg-gradient-to-br from-pink-50 to-pink-100 p-6 rounded-xl">
            <h4 className="text-lg font-semibold text-pink-800 mb-3">🏡 Airbnb</h4>
            <p className="text-sm text-pink-700">Host Dashboard → Calendar → Sync calendar → Export calendar</p>
          </div>
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-xl">
            <h4 className="text-lg font-semibold text-purple-800 mb-3">🏘️ VRBO</h4>
            <p className="text-sm text-purple-700">Owner Dashboard → Calendar → Export → Copy iCal link</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalendarManager;