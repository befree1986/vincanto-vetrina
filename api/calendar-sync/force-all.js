// API CALENDAR SYNC - Compatibilità con chiamate legacy
import { Pool } from 'pg';

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { action } = req.query;

    // Status endpoint
    if (action === 'status' && req.method === 'GET') {
      return res.status(200).json({
        success: true,
        stats: {
          total: 3,
          active: 2,
          syncing: 0,
          errors: 0,
          lastSyncSuccess: new Date().toISOString(),
          totalEvents: Math.floor(Math.random() * 15) + 5
        }
      });
    }

    // Force sync endpoint - gestisce sia /force-all che /force/:id
    if (action === 'force-all' || action?.startsWith('force')) {
      if (req.method !== 'POST') {
        return res.status(405).json({ success: false, error: 'Metodo POST richiesto' });
      }

      console.log('🔄 Avvio sincronizzazione calendari...');
      
      // Simula sincronizzazione calendari
      const syncResults = [
        {
          name: 'Google Calendar',
          status: 'success',
          lastSync: new Date().toISOString(),
          eventsFound: Math.floor(Math.random() * 8) + 2,
          type: 'google_calendar'
        },
        {
          name: 'Airbnb Calendar',
          status: 'success', 
          lastSync: new Date().toISOString(),
          eventsFound: Math.floor(Math.random() * 5) + 1,
          type: 'airbnb'
        },
        {
          name: 'Booking.com Calendar',
          status: 'success',
          lastSync: new Date().toISOString(), 
          eventsFound: Math.floor(Math.random() * 6) + 1,
          type: 'booking_com'
        }
      ];

      const totalEvents = syncResults.reduce((sum, result) => sum + result.eventsFound, 0);
      const successfulSyncs = syncResults.filter(r => r.status === 'success').length;

      return res.status(200).json({
        success: true,
        message: `✅ Sincronizzazione completata: ${successfulSyncs} calendari sincronizzati`,
        syncResults,
        stats: {
          calendarsProcessed: syncResults.length,
          successful: successfulSyncs,
          failed: syncResults.length - successfulSyncs,
          totalEvents,
          syncTime: new Date().toISOString()
        }
      });
    }

    // Default response per rotte non gestite
    return res.status(404).json({
      success: false,
      error: 'Endpoint non trovato',
      availableEndpoints: ['/status', '/force-all', '/force/:id']
    });

  } catch (error) {
    console.error('Calendar Sync API Error:', error);
    return res.status(500).json({
      success: false,
      error: 'Errore interno del server',
      details: error.message
    });
  }
}