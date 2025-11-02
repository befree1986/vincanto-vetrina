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

  const { action } = req.query;
  let client;

  try {
    if (!pool) {
      return res.status(500).json({ success: false, error: 'Database non disponibile' });
    }

    client = await pool.connect();

    switch (action) {
      case 'check':
        return await handleAvailabilityCheck(client, req, res);
      case 'calendar':
        return await handleCalendar(client, req, res);
      case 'next-available':
        return await handleNextAvailable(client, req, res);
      default:
        return res.status(400).json({ 
          success: false, 
          error: 'Azione richiesta: check, calendar, next-available' 
        });
    }

  } catch (error) {
    console.error('❌ Errore API availability:', error);
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

// Verifica disponibilità date specifiche
async function handleAvailabilityCheck(client, req, res) {
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

  // Controlla conflitti
  const availabilityQuery = `
    SELECT COUNT(*) as conflicts
    FROM (
      -- Date bloccate manualmente
      SELECT event_date as blocked_date
      FROM admin_calendar_events 
      WHERE event_type = 'blocked' 
      AND event_date >= $1::date 
      AND event_date < $2::date
      
      UNION
      
      -- Prenotazioni esistenti
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

  const result = await client.query(availabilityQuery, [check_in_date, check_out_date]);
  const conflicts = parseInt(result.rows[0].conflicts) || 0;
  const available = conflicts === 0;

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
}

// Carica calendario con date occupate
async function handleCalendar(client, req, res) {
  const { start_date, end_date } = req.query;

  // Date di default: prossimi 6 mesi
  const today = new Date();
  const defaultStart = today.toISOString().split('T')[0];
  const sixMonthsLater = new Date(today);
  sixMonthsLater.setMonth(sixMonthsLater.getMonth() + 6);
  const defaultEnd = sixMonthsLater.toISOString().split('T')[0];

  const startDate = start_date || defaultStart;
  const endDate = end_date || defaultEnd;

  // Query date occupate
  const occupiedDatesQuery = `
    SELECT 
      occupied_date,
      reason,
      type
    FROM (
      -- Date bloccate manualmente
      SELECT 
        event_date::date as occupied_date,
        COALESCE(event_title, 'Data bloccata') as reason,
        'blocked' as type
      FROM admin_calendar_events 
      WHERE event_type = 'blocked' 
      AND event_date >= $1::date 
      AND event_date <= $2::date
      
      UNION
      
      -- Date occupate da prenotazioni
      SELECT 
        generate_series(
          check_in_date::date, 
          check_out_date::date - interval '1 day', 
          interval '1 day'
        )::date as occupied_date,
        'Prenotazione: ' || guest_name || ' ' || guest_surname as reason,
        'booking' as type
      FROM admin_bookings 
      WHERE status IN ('confirmed', 'pending')
      AND check_in_date <= $2::date 
      AND check_out_date > $1::date
    ) occupied_dates
    ORDER BY occupied_date ASC
  `;

  const result = await client.query(occupiedDatesQuery, [startDate, endDate]);
  
  // Raggruppa per data
  const occupiedDates = {};
  result.rows.forEach(row => {
    const dateStr = row.occupied_date.toISOString().split('T')[0];
    if (!occupiedDates[dateStr]) {
      occupiedDates[dateStr] = {
        date: dateStr,
        available: false,
        reasons: [],
        types: []
      };
    }
    occupiedDates[dateStr].reasons.push(row.reason);
    occupiedDates[dateStr].types.push(row.type);
  });

  // Statistiche
  const totalDays = Math.ceil((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24)) + 1;
  const occupiedDays = Object.keys(occupiedDates).length;
  const availableDays = totalDays - occupiedDays;
  const occupancyRate = Math.round((occupiedDays / totalDays) * 100);

  return res.status(200).json({
    success: true,
    calendar: {
      start_date: startDate,
      end_date: endDate,
      occupied_dates: Object.values(occupiedDates),
      statistics: {
        total_days: totalDays,
        occupied_days: occupiedDays,
        available_days: availableDays,
        occupancy_rate: occupancyRate
      }
    }
  });
}

// Trova prossime date disponibili
async function handleNextAvailable(client, req, res) {
  const { nights = 2, from_date } = req.query;
  const minNights = parseInt(nights) || 2;
  
  const startDate = from_date || new Date().toISOString().split('T')[0];
  
  // Cerchiamo fino a 3 mesi in avanti
  const maxSearchDate = new Date(startDate);
  maxSearchDate.setMonth(maxSearchDate.getMonth() + 3);
  const maxDate = maxSearchDate.toISOString().split('T')[0];

  const availabilityQuery = `
    WITH date_range AS (
      SELECT generate_series(
        $1::date, 
        $2::date, 
        interval '1 day'
      )::date as check_date
    ),
    occupied_dates AS (
      -- Date bloccate
      SELECT event_date::date as occupied_date
      FROM admin_calendar_events 
      WHERE event_type = 'blocked'
      AND event_date >= $1::date 
      AND event_date <= $2::date
      
      UNION
      
      -- Prenotazioni
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

  const result = await client.query(availabilityQuery, [startDate, maxDate, minNights]);
  
  const availableSlots = result.rows.map(row => ({
    check_in_date: row.check_in.toISOString().split('T')[0],
    check_out_date: row.check_out.toISOString().split('T')[0],
    nights: minNights,
    available: true
  }));

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
}