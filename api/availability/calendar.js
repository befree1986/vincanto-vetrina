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
    const { start_date, end_date } = req.query;

    // Date di default: prossimi 6 mesi da oggi
    const today = new Date();
    const defaultStart = today.toISOString().split('T')[0];
    const sixMonthsLater = new Date(today);
    sixMonthsLater.setMonth(sixMonthsLater.getMonth() + 6);
    const defaultEnd = sixMonthsLater.toISOString().split('T')[0];

    const startDate = start_date || defaultStart;
    const endDate = end_date || defaultEnd;

    // Connessione al database
    if (!pool) {
      return res.status(500).json({ success: false, error: 'Database non disponibile' });
    }

    client = await pool.connect();

    // Ottieni tutte le date occupate/bloccate nel periodo
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

    console.log('📅 Caricamento calendario:', { startDate, endDate });

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

    // Calcola statistiche
    const totalDays = Math.ceil((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24)) + 1;
    const occupiedDays = Object.keys(occupiedDates).length;
    const availableDays = totalDays - occupiedDays;
    const occupancyRate = Math.round((occupiedDays / totalDays) * 100);

    console.log('✅ Calendario caricato:', { 
      totalDays, 
      occupiedDays, 
      availableDays, 
      occupancyRate: occupancyRate + '%' 
    });

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

  } catch (error) {
    console.error('❌ Errore caricamento calendario:', error);
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