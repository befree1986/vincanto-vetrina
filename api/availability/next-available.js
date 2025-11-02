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

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Metodo non consentito' });
  }

  let client;

  try {
    const { nights = 2, from_date } = req.query;
    const minNights = parseInt(nights) || 2;
    
    // Data di partenza (default: oggi)
    const startDate = from_date || new Date().toISOString().split('T')[0];
    
    // Cerchiamo fino a 3 mesi in avanti
    const maxSearchDate = new Date(startDate);
    maxSearchDate.setMonth(maxSearchDate.getMonth() + 3);
    const maxDate = maxSearchDate.toISOString().split('T')[0];

    // Connessione al database
    if (!pool) {
      return res.status(500).json({ success: false, error: 'Database non disponibile' });
    }

    client = await pool.connect();

    // Query per trovare prossime date disponibili
    const availabilityQuery = `
      WITH date_range AS (
        SELECT generate_series(
          $1::date, 
          $2::date, 
          interval '1 day'
        )::date as check_date
      ),
      occupied_dates AS (
        -- Date bloccate manualmente
        SELECT event_date::date as occupied_date
        FROM admin_calendar_events 
        WHERE event_type = 'blocked'
        AND event_date >= $1::date 
        AND event_date <= $2::date
        
        UNION
        
        -- Date occupate da prenotazioni  
        SELECT generate_series(
          check_in_date::date, 
          check_out_date::date - interval '1 day', 
          interval '1 day'
        )::date as occupied_date
        FROM admin_bookings 
        WHERE status IN ('confirmed', 'pending')
        AND check_in_date <= $2::date
        AND check_out_date > $1::date
      ),
      available_dates AS (
        SELECT dr.check_date as available_date
        FROM date_range dr
        LEFT JOIN occupied_dates od ON dr.check_date = od.occupied_date
        WHERE od.occupied_date IS NULL
        ORDER BY dr.check_date
      )
      SELECT 
        available_date as check_in,
        available_date + interval '$3 days' as check_out
      FROM available_dates a1
      WHERE NOT EXISTS (
        SELECT 1 
        FROM occupied_dates od
        WHERE od.occupied_date >= a1.available_date 
        AND od.occupied_date < a1.available_date + interval '$3 days'
      )
      AND available_date + interval '$3 days' <= $2::date
      ORDER BY available_date
      LIMIT 10
    `;

    console.log('🔍 Ricerca prossime date disponibili:', { 
      startDate, 
      maxDate, 
      minNights 
    });

    const result = await client.query(availabilityQuery, [startDate, maxDate, minNights]);
    
    const availableSlots = result.rows.map(row => ({
      check_in_date: row.check_in.toISOString().split('T')[0],
      check_out_date: row.check_out.toISOString().split('T')[0],
      nights: minNights,
      available: true
    }));

    console.log('✅ Trovate', availableSlots.length, 'slot disponibili');

    return res.status(200).json({
      success: true,
      next_available: availableSlots,
      search_params: {
        from_date: startDate,
        max_date: maxDate,
        min_nights: minNights
      },
      found: availableSlots.length > 0,
      message: availableSlots.length > 0 
        ? `Trovate ${availableSlots.length} opzioni disponibili`
        : 'Nessuna disponibilità trovata nel periodo'
    });

  } catch (error) {
    console.error('❌ Errore ricerca date disponibili:', error);
    return res.status(500).json({
      success: false,
      error: 'Errore interno del server'
    });
  } finally {
    if (client) {
      client.release();
    }
  }
}