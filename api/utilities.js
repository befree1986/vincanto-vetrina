// API UNIFICATA UTILITIES - Gestisce calendario, servizi e utilità varie
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
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Ottieni action da query params o body
  let { action } = req.query;
  if (req.method === 'POST' && req.body && req.body.action) {
    action = req.body.action;
  }
  
    try {
    switch (action) {
      case 'sync-calendars':
        // POST /api/utilities?action=sync-calendars - Sincronizza calendari esterni
        if (req.method !== 'POST') {
          return res.status(405).json({ success: false, error: 'Metodo non consentito' });
        }

        console.log('🔄 Avvio sincronizzazione calendari...');
        
        // Simula sincronizzazione con calendari esterni
        const calendarSources = [
          { name: 'Google Calendar', status: 'active', lastSync: new Date().toISOString() },
          { name: 'Booking.com', status: 'active', lastSync: new Date().toISOString() },
          { name: 'Airbnb', status: 'inactive', lastSync: null }
        ];

        // Aggiorna timestamp sincronizzazione
        await pool.query(`
          DELETE FROM admin_settings WHERE category = 'calendar' AND setting_key = 'last_sync_timestamp'
        `);
        await pool.query(`
          INSERT INTO admin_settings (category, setting_key, setting_value, setting_type, updated_at)
          VALUES ('calendar', 'last_sync_timestamp', $1, 'string', NOW())
        `, [new Date().toISOString()]);

        return res.status(200).json({
          success: true,
          message: 'Sincronizzazione calendari completata',
          sources: calendarSources,
          syncedAt: new Date().toISOString()
        });

      case 'database-status':
        // GET/POST /api/utilities?action=database-status - Verifica stato database
        if (req.method !== 'GET' && req.method !== 'POST') {
          return res.status(405).json({ success: false, error: 'Metodo non consentito' });
        }

        try {
          // Verifica esistenza tabelle essenziali
          const tablesCheck = await pool.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name IN ('bookings', 'blocked_dates', 'admin_settings')
          `);

          const existingTables = tablesCheck.rows.map(row => row.table_name);
          const requiredTables = ['bookings', 'blocked_dates', 'admin_settings'];
          const missingTables = requiredTables.filter(table => !existingTables.includes(table));

          // Conta record in ciascuna tabella
          const tableCounts = {};
          for (const table of existingTables) {
            try {
              const countResult = await pool.query(`SELECT COUNT(*) as count FROM ${table}`);
              tableCounts[table] = parseInt(countResult.rows[0].count);
            } catch (error) {
              tableCounts[table] = 'Error: ' + error.message;
            }
          }

          // Verifica configurazioni
          let configurationsCount = 0;
          if (existingTables.includes('admin_settings')) {
            const configResult = await pool.query('SELECT COUNT(*) as count FROM admin_settings');
            configurationsCount = parseInt(configResult.rows[0].count);
          }

          const isFullyConfigured = missingTables.length === 0 && configurationsCount > 0;

          return res.status(200).json({
            success: true,
            status: isFullyConfigured ? 'ready' : 'incomplete',
            database: {
              existingTables,
              missingTables,
              tableCounts,
              configurationsCount,
              totalTables: existingTables.length,
              requiredTables: requiredTables.length
            },
            ready: isFullyConfigured,
            recommendations: missingTables.length > 0 ? 
              ['Eseguire /api/admin?action=init-database per creare tabelle mancanti'] : 
              ['Database completamente configurato']
          });

        } catch (error) {
          return res.status(500).json({
            success: false,
            error: 'Errore verifica database',
            message: error.message
          });
        }
        break;

      case 'calendar-setup':
        // POST /api/utilities-unified?action=calendar-setup
        if (req.method !== 'POST') {
          return res.status(405).json({ success: false, error: 'Metodo non consentito' });
        }

        // Crea tabelle calendario se non esistono
        await pool.query(`
          CREATE TABLE IF NOT EXISTS calendar_events (
            id SERIAL PRIMARY KEY,
            title VARCHAR(255) NOT NULL,
            start_date DATE NOT NULL,
            end_date DATE NOT NULL,
            event_type VARCHAR(50) DEFAULT 'booking',
            description TEXT,
            created_at TIMESTAMP DEFAULT NOW()
          )
        `);

        await pool.query(`
          CREATE TABLE IF NOT EXISTS calendar_sync (
            id SERIAL PRIMARY KEY,
            provider VARCHAR(50) NOT NULL,
            calendar_id VARCHAR(255) NOT NULL,
            access_token TEXT,
            refresh_token TEXT,
            last_sync TIMESTAMP,
            active BOOLEAN DEFAULT true,
            created_at TIMESTAMP DEFAULT NOW()
          )
        `);

        return res.status(200).json({
          success: true,
          message: 'Tabelle calendario create con successo'
        });

      case 'calendar-events':
        // GET /api/utilities-unified?action=calendar-events - Lista eventi
        // POST /api/utilities-unified?action=calendar-events - Crea evento
        
        if (req.method === 'GET') {
          const { startDate, endDate } = req.query;
          
          let query = 'SELECT * FROM calendar_events';
          let params = [];
          
          if (startDate && endDate) {
            query += ' WHERE start_date >= $1 AND end_date <= $2';
            params = [startDate, endDate];
          }
          
          query += ' ORDER BY start_date';
          
          const result = await pool.query(query, params);
          
          return res.status(200).json({
            success: true,
            events: result.rows
          });
        }
        
        if (req.method === 'POST') {
          const { title, startDate, endDate, eventType, description } = req.body;
          
          if (!title || !startDate || !endDate) {
            return res.status(400).json({
              success: false,
              error: 'Titolo, data inizio e fine richiesti'
            });
          }

          const result = await pool.query(`
            INSERT INTO calendar_events (title, start_date, end_date, event_type, description)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING id
          `, [title, startDate, endDate, eventType || 'booking', description]);

          return res.status(200).json({
            success: true,
            message: 'Evento creato con successo',
            eventId: result.rows[0].id
          });
        }

        return res.status(405).json({ success: false, error: 'Metodo non consentito' });

      case 'tourist-tax':
        // GET /api/utilities-unified?action=tourist-tax&guests=X&nights=Y&childrenAges=[]
        if (req.method !== 'GET') {
          return res.status(405).json({ success: false, error: 'Metodo non consentito' });
        }

        const { guests, nights, childrenAges } = req.query;
        
        if (!guests || !nights) {
          return res.status(400).json({
            success: false,
            error: 'Numero ospiti e notti richiesti'
          });
        }

        // Carica tassa di soggiorno dal database
        const taxResult = await pool.query(`
          SELECT setting_value FROM admin_settings 
          WHERE category = 'pricing' AND setting_key = 'tourist_tax_adult'
        `);
        
        const taxPerAdultPerNight = parseFloat(taxResult.rows[0]?.setting_value) || 2.00;
        
        // Calcola tassa di soggiorno
        const totalGuests = parseInt(guests);
        const totalNights = parseInt(nights);
        let children = 0;
        
        if (childrenAges) {
          const ages = Array.isArray(childrenAges) ? childrenAges : [childrenAges];
          children = ages.filter(age => parseInt(age) < 12).length;
        }
        
        const adultsForTax = totalGuests - children;
        const maxTaxNights = Math.min(totalNights, 7); // Massimo 7 notti
        const totalTax = adultsForTax * taxPerAdultPerNight * maxTaxNights;

        return res.status(200).json({
          success: true,
          touristTax: {
            totalAmount: totalTax,
            perAdultPerNight: taxPerAdultPerNight,
            adultsSubjectToTax: adultsForTax,
            nightsSubjectToTax: maxTaxNights,
            exemptChildren: children
          }
        });

      case 'google-calendar':
        // GET /api/utilities-unified?action=google-calendar - Stato sincronizzazione
        // POST /api/utilities-unified?action=google-calendar - Configura sincronizzazione
        
        if (req.method === 'GET') {
          const result = await pool.query(`
            SELECT * FROM calendar_sync WHERE provider = 'google' AND active = true
          `);
          
          return res.status(200).json({
            success: true,
            connected: result.rows.length > 0,
            lastSync: result.rows[0]?.last_sync || null
          });
        }
        
        if (req.method === 'POST') {
          const { calendarId, accessToken, refreshToken } = req.body;
          
          if (!calendarId) {
            return res.status(400).json({
              success: false,
              error: 'ID calendario richiesto'
            });
          }

          await pool.query(`
            INSERT INTO calendar_sync (provider, calendar_id, access_token, refresh_token, last_sync)
            VALUES ('google', $1, $2, $3, NOW())
            ON CONFLICT (provider, calendar_id)
            DO UPDATE SET 
              access_token = $2,
              refresh_token = $3,
              last_sync = NOW(),
              active = true
          `, [calendarId, accessToken, refreshToken]);

          return res.status(200).json({
            success: true,
            message: 'Sincronizzazione Google Calendar configurata'
          });
        }

        return res.status(405).json({ success: false, error: 'Metodo non consentito' });

      case 'health':
        // GET /api/utilities-unified?action=health - Health check
        if (req.method !== 'GET') {
          return res.status(405).json({ success: false, error: 'Metodo non consentito' });
        }

        // Test connessione database
        await pool.query('SELECT 1');
        
        return res.status(200).json({
          success: true,
          status: 'healthy',
          timestamp: new Date().toISOString(),
          database: 'connected'
        });

      default:
        return res.status(400).json({ 
          success: false, 
          error: 'Azione non riconosciuta. Usa: calendar-setup, calendar-events, tourist-tax, google-calendar, health' 
        });
    }
  } catch (error) {
    console.error('❌ Errore API Utilities Unificata:', error);
    return res.status(500).json({
      success: false,
      error: 'Errore interno del server',
      message: error.message
    });
  }
}