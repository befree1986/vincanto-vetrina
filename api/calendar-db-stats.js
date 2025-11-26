// API: Query Database Calendario Real-time
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL,
  ssl: { rejectUnauthorized: false }
});

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    // Verifica esistenza tabella
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'calendar_events'
      );
    `);

    if (!tableCheck.rows[0].exists) {
      return res.status(200).json({
        success: true,
        message: 'Tabella calendar_events non ancora creata (nessun sync eseguito)',
        stats: {
          tableExists: false,
          totalEvents: 0,
          futureEvents: 0,
          platforms: []
        }
      });
    }

    // Statistiche per piattaforma
    const platformStats = await pool.query(`
      SELECT 
        calendar_source,
        COUNT(*) as totale_eventi,
        COUNT(CASE WHEN start_date >= CURRENT_DATE THEN 1 END) as eventi_futuri,
        MIN(CASE WHEN start_date >= CURRENT_DATE THEN start_date END) as prossima_prenotazione,
        MAX(updated_at) as ultimo_sync
      FROM calendar_events
      GROUP BY calendar_source
      ORDER BY calendar_source;
    `);

    // Totali generali
    const totals = await pool.query(`
      SELECT 
        COUNT(*) as totale,
        COUNT(CASE WHEN start_date >= CURRENT_DATE THEN 1 END) as futuri,
        COUNT(CASE WHEN start_date < CURRENT_DATE THEN 1 END) as passati
      FROM calendar_events;
    `);

    // Prossimi 10 eventi
    const upcomingEvents = await pool.query(`
      SELECT 
        calendar_source,
        summary,
        start_date,
        end_date,
        EXTRACT(DAY FROM (end_date - start_date)) as notti,
        location,
        uid
      FROM calendar_events
      WHERE start_date >= CURRENT_DATE
      ORDER BY start_date
      LIMIT 10;
    `);

    // Eventi oggi/in corso
    const currentEvents = await pool.query(`
      SELECT 
        calendar_source,
        summary,
        start_date,
        end_date
      FROM calendar_events 
      WHERE CURRENT_DATE BETWEEN start_date::date AND end_date::date;
    `);

    // Costruisci risposta
    const platforms = platformStats.rows.map(row => ({
      platform: row.calendar_source,
      totalEvents: parseInt(row.totale_eventi),
      futureEvents: parseInt(row.eventi_futuri),
      nextBooking: row.prossima_prenotazione ? new Date(row.prossima_prenotazione).toISOString() : null,
      lastSync: row.ultimo_sync ? new Date(row.ultimo_sync).toISOString() : null
    }));

    const upcoming = upcomingEvents.rows.map(event => ({
      platform: event.calendar_source,
      title: event.summary,
      checkIn: new Date(event.start_date).toISOString(),
      checkOut: new Date(event.end_date).toISOString(),
      nights: parseInt(event.notti) || 0,
      location: event.location,
      uid: event.uid
    }));

    const current = currentEvents.rows.map(event => ({
      platform: event.calendar_source,
      title: event.summary,
      checkIn: new Date(event.start_date).toISOString(),
      checkOut: new Date(event.end_date).toISOString()
    }));

    return res.status(200).json({
      success: true,
      timestamp: new Date().toISOString(),
      stats: {
        tableExists: true,
        totalEvents: parseInt(totals.rows[0].totale),
        futureEvents: parseInt(totals.rows[0].futuri),
        pastEvents: parseInt(totals.rows[0].passati),
        currentEvents: current.length,
        platforms: platforms
      },
      upcomingBookings: upcoming,
      currentBookings: current
    });

  } catch (error) {
    console.error('❌ Errore query database calendario:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
      hint: 'Verificare DATABASE_URL configurato correttamente'
    });
  }
}
