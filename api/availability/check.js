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
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Metodo non consentito' });
  }

  let client;

  try {
    const { check_in_date, check_out_date } = req.query;

    if (!check_in_date || !check_out_date) {
      return res.status(400).json({
        success: false,
        error: 'Parametri richiesti: check_in_date, check_out_date'
      });
    }

    // Validazione date
    const checkIn = new Date(check_in_date);
    const checkOut = new Date(check_out_date);
    const today = new Date();
    
    if (checkIn <= today) {
      return res.status(400).json({
        success: false,
        available: false,
        error: 'Data di check-in non può essere nel passato'
      });
    }

    if (checkOut <= checkIn) {
      return res.status(400).json({
        success: false,
        available: false,
        error: 'Data di check-out deve essere successiva al check-in'
      });
    }

    // Connessione al database
    if (!pool) {
      return res.status(500).json({ success: false, error: 'Database non disponibile' });
    }

    client = await pool.connect();

    // Controlla date bloccate e prenotazioni esistenti
    const availabilityQuery = `
      SELECT 
        COUNT(*) as conflicts
      FROM (
        -- Date bloccate manualmente (admin_calendar_events)
        SELECT event_date as blocked_date
        FROM admin_calendar_events 
        WHERE event_type = 'blocked' 
        AND event_date >= $1::date 
        AND event_date < $2::date
        
        UNION
        
        -- Prenotazioni esistenti (admin_bookings)
        SELECT generate_series(
          check_in_date::date, 
          check_out_date::date - interval '1 day', 
          interval '1 day'
        )::date as blocked_date
        FROM admin_bookings 
        WHERE status IN ('confirmed', 'pending')
        AND NOT (
          check_out_date <= $1::date OR check_in_date >= $2::date
        )
      ) conflicts
    `;

    console.log('🗓️ Controllo disponibilità:', { check_in_date, check_out_date });

    const result = await client.query(availabilityQuery, [check_in_date, check_out_date]);
    const conflicts = parseInt(result.rows[0].conflicts) || 0;
    const available = conflicts === 0;

    console.log('✅ Risultato disponibilità:', { available, conflicts });

    // Calcola notti
    const nights = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));

    return res.status(200).json({
      success: true,
      available,
      check_in_date,
      check_out_date,
      nights,
      conflicts,
      message: available 
        ? 'Date disponibili per la prenotazione'
        : 'Una o più date non sono disponibili'
    });

  } catch (error) {
    console.error('❌ Errore check availability:', error);
    return res.status(500).json({
      success: false,
      available: false,
      error: 'Errore interno del server'
    });
  } finally {
    if (client) {
      client.release();
    }
  }
}