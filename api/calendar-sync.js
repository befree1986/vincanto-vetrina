export default function handler(req, res) {
  // Gestione CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method === 'POST') {
    // Simula la sincronizzazione forzata di tutti i calendari
    res.status(200).json({
      success: true,
      message: 'Sincronizzazione calendari avviata',
      data: {
        calendars: [
          { id: 'airbnb', name: 'Airbnb', status: 'syncing' },
          { id: 'booking', name: 'Booking.com', status: 'syncing' },
          { id: 'vrbo', name: 'VRBO', status: 'syncing' }
        ],
        syncId: 'sync_' + Date.now(),
        startedAt: new Date().toISOString()
      }
    });
  } else if (req.method === 'GET') {
    // Restituisce lo stato della sincronizzazione
    res.status(200).json({
      success: true,
      message: 'Status sincronizzazione calendari',
      data: {
        lastSync: new Date().toISOString(),
        status: 'completed',
        calendars: [
          { id: 'airbnb', name: 'Airbnb', status: 'synchronized', lastSync: new Date().toISOString() },
          { id: 'booking', name: 'Booking.com', status: 'synchronized', lastSync: new Date().toISOString() },
          { id: 'vrbo', name: 'VRBO', status: 'error', error: 'Connection timeout' }
        ]
      }
    });
  } else {
    res.status(405).json({
      success: false,
      error: 'Metodo non supportato'
    });
  }
}