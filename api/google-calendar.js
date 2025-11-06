import { Pool } from 'pg';

// Configurazione database
let pool;
try {
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });
} catch (poolError) {
  console.error('Pool creation error:', poolError);
}

/**
 * Google Calendar Integration API
 * Gestisce OAuth2, lettura e scrittura eventi su Google Calendar
 * 
 * Setup richiesto:
 * 1. Google Cloud Console - abilita Google Calendar API
 * 2. Credenziali OAuth2 per applicazione web
 * 3. Variabili ambiente: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI
 */
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { action } = req.query;
  let client;

  try {
    client = await pool.connect();
    
    switch (action) {
      case 'auth-url':
        return await getGoogleAuthUrl(req, res);
      case 'callback':
        return await handleOAuthCallback(req, res, client);
      case 'sync':
        return await syncGoogleCalendar(req, res, client);
      case 'create-event':
        return await createGoogleEvent(req, res, client);
      case 'delete-event':
        return await deleteGoogleEvent(req, res, client);
      case 'status':
        return await getGoogleCalendarStatus(req, res, client);
      default:
        return res.status(400).json({ success: false, error: 'Azione non supportata' });
    }
    
  } catch (error) {
    console.error('Google Calendar API error:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Errore Google Calendar',
      details: error.message 
    });
  } finally {
    if (client) client.release();
  }
}

/**
 * Genera URL per autorizzazione OAuth2 Google
 */
async function getGoogleAuthUrl(req, res) {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_REDIRECT_URI) {
    return res.status(400).json({ 
      success: false, 
      error: 'Configurazione Google Calendar mancante' 
    });
  }

  const scopes = [
    'https://www.googleapis.com/auth/calendar',
    'https://www.googleapis.com/auth/calendar.events'
  ];

  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
    `client_id=${process.env.GOOGLE_CLIENT_ID}&` +
    `redirect_uri=${encodeURIComponent(process.env.GOOGLE_REDIRECT_URI)}&` +
    `scope=${encodeURIComponent(scopes.join(' '))}&` +
    `response_type=code&` +
    `access_type=offline&` +
    `prompt=consent`;

  return res.json({
    success: true,
    authUrl,
    message: 'Visita questo URL per autorizzare l\'accesso a Google Calendar'
  });
}

/**
 * Gestisce il callback OAuth2 e salva i token
 */
async function handleOAuthCallback(req, res, client) {
  const { code } = req.query;
  
  if (!code) {
    return res.status(400).json({ 
      success: false, 
      error: 'Codice autorizzazione mancante' 
    });
  }

  try {
    console.log('🔐 Scambio codice autorizzazione con token...');
    
    // Scambia il codice con i token
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: process.env.GOOGLE_REDIRECT_URI,
        grant_type: 'authorization_code'
      })
    });

    const tokens = await tokenResponse.json();
    
    if (!tokens.access_token) {
      throw new Error('Token di accesso non ricevuto');
    }

    // Salva i token nel database
    await client.query(`
      INSERT INTO admin_calendar_configs (
        calendar_name, platform, access_token, refresh_token, 
        token_expires_at, is_active, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
      ON CONFLICT (platform, calendar_name) 
      DO UPDATE SET 
        access_token = $3,
        refresh_token = $4,
        token_expires_at = $5,
        updated_at = NOW()
    `, [
      'Google Calendar Principale',
      'google',
      tokens.access_token,
      tokens.refresh_token || null,
      tokens.expires_in ? new Date(Date.now() + tokens.expires_in * 1000) : null,
      true
    ]);

    console.log('✅ Token Google Calendar salvati con successo');

    return res.json({
      success: true,
      message: 'Google Calendar collegato con successo!',
      expiresIn: tokens.expires_in
    });

  } catch (error) {
    console.error('Errore callback OAuth:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Errore durante l\'autorizzazione' 
    });
  }
}

/**
 * Sincronizza eventi da Google Calendar
 */
async function syncGoogleCalendar(req, res, client) {
  try {
    console.log('📅 Avvio sincronizzazione Google Calendar...');
    
    // Recupera token di accesso
    const tokenQuery = await client.query(`
      SELECT access_token, refresh_token, token_expires_at 
      FROM admin_calendar_configs 
      WHERE platform = 'google' AND is_active = true
      LIMIT 1
    `);

    if (tokenQuery.rows.length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Google Calendar non configurato' 
      });
    }

    const { access_token, refresh_token, token_expires_at } = tokenQuery.rows[0];
    
    // Controlla se il token è scaduto
    if (token_expires_at && new Date() >= new Date(token_expires_at)) {
      console.log('🔄 Token scaduto, refresh...');
      // TODO: Implementare refresh token
      return res.status(401).json({ 
        success: false, 
        error: 'Token Google scaduto, riautorizzazione necessaria' 
      });
    }

    // Sincronizza eventi dal calendario primario
    const eventsResponse = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events?` +
      `timeMin=${new Date().toISOString()}&` +
      `maxResults=250&` +
      `singleEvents=true&` +
      `orderBy=startTime`,
      {
        headers: {
          'Authorization': `Bearer ${access_token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!eventsResponse.ok) {
      throw new Error(`Google API error: ${eventsResponse.status}`);
    }

    const eventsData = await eventsResponse.json();
    const events = eventsData.items || [];

    console.log(`📊 Trovati ${events.length} eventi su Google Calendar`);

    // Sincronizza eventi nel database locale (opzionale)
    let syncedEvents = 0;
    for (const event of events) {
      if (event.start?.date || event.start?.dateTime) {
        const startDate = new Date(event.start.date || event.start.dateTime);
        const endDate = new Date(event.end?.date || event.end?.dateTime || startDate);
        
        // Salva evento nel database locale per cache
        try {
          await client.query(`
            INSERT INTO admin_calendar_events (
              external_id, calendar_source, title, start_date, end_date, 
              is_blocking, created_at
            ) VALUES ($1, $2, $3, $4, $5, $6, NOW())
            ON CONFLICT (external_id, calendar_source) 
            DO UPDATE SET 
              title = $3, start_date = $4, end_date = $5, 
              updated_at = NOW()
          `, [
            event.id,
            'google',
            event.summary || 'Evento Google Calendar',
            startDate,
            endDate,
            true
          ]);
          syncedEvents++;
        } catch (insertError) {
          console.log('Skip evento duplicato:', event.id);
        }
      }
    }

    // Aggiorna timestamp sincronizzazione
    await client.query(`
      UPDATE admin_calendar_configs 
      SET last_sync_at = NOW() 
      WHERE platform = 'google'
    `);

    return res.json({
      success: true,
      message: 'Sincronizzazione Google Calendar completata',
      eventsFound: events.length,
      eventsSynced: syncedEvents,
      lastSync: new Date().toISOString()
    });

  } catch (error) {
    console.error('Errore sincronizzazione Google:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Errore sincronizzazione Google Calendar' 
    });
  }
}

/**
 * Crea nuovo evento su Google Calendar quando viene confermata una prenotazione
 */
async function createGoogleEvent(req, res, client) {
  const { 
    startDate, 
    endDate, 
    guestName, 
    guestEmail, 
    bookingId, 
    summary 
  } = req.body;

  if (!startDate || !endDate || !guestName) {
    return res.status(400).json({ 
      success: false, 
      error: 'Dati evento incompleti' 
    });
  }

  try {
    // Recupera token di accesso
    const tokenQuery = await client.query(`
      SELECT access_token FROM admin_calendar_configs 
      WHERE platform = 'google' AND is_active = true
      LIMIT 1
    `);

    if (tokenQuery.rows.length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Google Calendar non configurato' 
      });
    }

    const { access_token } = tokenQuery.rows[0];

    // Crea evento
    const event = {
      summary: summary || `Prenotazione Vincanto - ${guestName}`,
      description: `Prenotazione #${bookingId}\\nOspite: ${guestName}\\nEmail: ${guestEmail || 'Non fornita'}`,
      start: {
        date: startDate,
        timeZone: 'Europe/Rome'
      },
      end: {
        date: endDate,
        timeZone: 'Europe/Rome'
      },
      attendees: guestEmail ? [{ email: guestEmail }] : [],
      colorId: '2' // Verde per prenotazioni confermate
    };

    console.log(`📅 Creazione evento Google Calendar: ${startDate} → ${endDate}`);

    const createResponse = await fetch(
      'https://www.googleapis.com/calendar/v3/calendars/primary/events',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(event)
      }
    );

    if (!createResponse.ok) {
      const errorData = await createResponse.json();
      throw new Error(`Google Calendar API: ${errorData.error?.message || createResponse.status}`);
    }

    const createdEvent = await createResponse.json();

    // Salva riferimento evento nel database
    try {
      await client.query(`
        INSERT INTO admin_calendar_events (
          external_id, calendar_source, title, start_date, end_date, 
          booking_reference, is_blocking, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
      `, [
        createdEvent.id,
        'google',
        event.summary,
        startDate,
        endDate,
        bookingId,
        true
      ]);
    } catch (dbError) {
      console.log('Errore salvataggio evento locale:', dbError);
    }

    return res.json({
      success: true,
      eventId: createdEvent.id,
      eventUrl: createdEvent.htmlLink,
      message: 'Evento creato su Google Calendar',
      bookingId
    });

  } catch (error) {
    console.error('Errore creazione evento Google:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Errore creazione evento Google Calendar',
      details: error.message
    });
  }
}

/**
 * Elimina evento da Google Calendar (per cancellazioni)
 */
async function deleteGoogleEvent(req, res, client) {
  const { eventId, bookingId } = req.body;
  
  if (!eventId) {
    return res.status(400).json({ 
      success: false, 
      error: 'Event ID richiesto' 
    });
  }

  try {
    // Recupera token
    const tokenQuery = await client.query(`
      SELECT access_token FROM admin_calendar_configs 
      WHERE platform = 'google' AND is_active = true
      LIMIT 1
    `);

    if (tokenQuery.rows.length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Google Calendar non configurato' 
      });
    }

    const { access_token } = tokenQuery.rows[0];

    // Elimina evento
    const deleteResponse = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`,
      {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${access_token}`
        }
      }
    );

    if (!deleteResponse.ok) {
      throw new Error(`Errore eliminazione: ${deleteResponse.status}`);
    }

    // Rimuovi dal database locale
    await client.query(`
      DELETE FROM admin_calendar_events 
      WHERE external_id = $1 AND calendar_source = 'google'
    `, [eventId]);

    return res.json({
      success: true,
      message: 'Evento eliminato da Google Calendar',
      eventId,
      bookingId
    });

  } catch (error) {
    console.error('Errore eliminazione evento Google:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Errore eliminazione evento Google Calendar' 
    });
  }
}

/**
 * Stato configurazione Google Calendar
 */
async function getGoogleCalendarStatus(req, res, client) {
  try {
    const statusQuery = await client.query(`
      SELECT calendar_name, access_token IS NOT NULL as has_token, 
             last_sync_at, token_expires_at, is_active
      FROM admin_calendar_configs 
      WHERE platform = 'google'
    `);

    const isConfigured = statusQuery.rows.length > 0 && statusQuery.rows[0].has_token;
    const config = statusQuery.rows[0] || {};

    return res.json({
      success: true,
      configured: isConfigured,
      active: config.is_active || false,
      lastSync: config.last_sync_at,
      tokenExpires: config.token_expires_at,
      needsReauth: config.token_expires_at && new Date() >= new Date(config.token_expires_at),
      setupUrl: isConfigured ? null : '/api/google-calendar?action=auth-url'
    });

  } catch (error) {
    console.error('Errore status Google Calendar:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Errore verifica status Google Calendar' 
    });
  }
}