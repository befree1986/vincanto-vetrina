// Sistema di Sincronizzazione Calendario REALE SOLO
// Supporta: Airbnb, Booking.com, VRBO, Google Calendar
import { RealCalendarSync, validateCalendarConfig } from './calendar-real-sync.js';

export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  console.log('🗓️ Calendar Sync REAL - Method:', req.method, 'Body:', req.body);

  try {
    if (req.method === 'POST') {
      // SINCRONIZZAZIONE REALE SOLO
      const { calendarId, force } = req.body || {};
      
      console.log('🔄 Avvio sincronizzazione REALE calendario:', calendarId);
      
      // Verifica configurazione
      const configValidation = validateCalendarConfig();
      
      if (!configValidation.isValid) {
        return res.status(400).json({
          success: false,
          error: 'Configurazione calendario mancante',
          configIssues: configValidation.issues,
          message: 'Configurare le API keys nei file .env per abilitare la sincronizzazione'
        });
      }

      // USA SOLO SINCRONIZZAZIONE REALE
      const realSync = new RealCalendarSync();
      const syncResults = await realSync.syncAll();
      
      return res.status(200).json({
        success: true,
        message: 'Sincronizzazione REALE calendari completata',
        data: {
          syncId: 'real_sync_' + Date.now(),
          startedAt: new Date().toISOString(),
          results: syncResults,
          totalCalendars: syncResults.length,
          successfulSyncs: syncResults.filter(r => r.status === 'success').length,
          failedSyncs: syncResults.filter(r => r.status === 'error').length,
          disabledCalendars: syncResults.filter(r => r.status === 'disabled').length
        }
      });
      
    } else if (req.method === 'GET') {
      // STATO SINCRONIZZAZIONE REALE
      const realSync = new RealCalendarSync();
      const statusData = await realSync.getStatus();
      
      return res.status(200).json({
        success: true,
        message: 'Status sincronizzazione calendari REALE',
        data: statusData
      });
    }
    
    return res.status(405).json({
      success: false,
      error: 'Metodo non supportato'
    });
    
  } catch (error) {
    console.error('❌ Calendar Sync REAL Error:', error);
    return res.status(500).json({
      success: false,
      error: 'Errore durante sincronizzazione REALE',
      details: error.message
    });
  }
}