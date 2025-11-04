import { Pool } from 'pg';
import https from 'https';

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Parse iCal data function
function parseICalData(icalData) {
  const events = [];
  const lines = icalData.split('\n');
  let currentEvent = {};
  
  for (let line of lines) {
    line = line.trim();
    
    if (line === 'BEGIN:VEVENT') {
      currentEvent = {};
    } else if (line === 'END:VEVENT') {
      if (currentEvent.DTSTART && currentEvent.DTEND) {
        events.push({
          start: currentEvent.DTSTART,
          end: currentEvent.DTEND,
          summary: currentEvent.SUMMARY || 'Prenotazione esterna'
        });
      }
    } else if (line.startsWith('DTSTART')) {
      currentEvent.DTSTART = line.split(':')[1];
    } else if (line.startsWith('DTEND')) {
      currentEvent.DTEND = line.split(':')[1];
    } else if (line.startsWith('SUMMARY')) {
      currentEvent.SUMMARY = line.split(':')[1];
    }
  }
  
  return events;
}

// Sync external calendars function
async function syncExternalCalendars() {
  try {
    const calendarsQuery = 'SELECT * FROM admin_calendar_configs WHERE active = true';
    const calendars = await pool.query(calendarsQuery);
    
    for (const calendar of calendars.rows) {
      if (calendar.calendar_url && calendar.calendar_url.startsWith('http')) {
        try {
          // Fetch iCal data
          const icalData = await new Promise((resolve, reject) => {
            https.get(calendar.calendar_url, (res) => {
              let data = '';
              res.on('data', chunk => data += chunk);
              res.on('end', () => resolve(data));
            }).on('error', reject);
          });
          
          // Parse events
          const events = parseICalData(icalData);
          
          // Clear existing events for this calendar
          await pool.query(
            'DELETE FROM admin_calendar_events WHERE source = $1',
            [calendar.platform]
          );
          
          // Insert new events
          for (const event of events) {
            const startDate = new Date(event.start).toISOString().split('T')[0];
            const endDate = new Date(event.end).toISOString().split('T')[0];
            
            await pool.query(`
              INSERT INTO admin_calendar_events (blocked_date, reason, source, created_at)
              SELECT generate_series($1::date, $2::date - interval '1 day', '1 day'::interval), $3, $4, NOW()
            `, [startDate, endDate, event.summary, calendar.platform]);
          }
          
          console.log(`✅ Sync completed for ${calendar.platform}: ${events.length} events`);
          
        } catch (error) {
          console.error(`❌ Error syncing ${calendar.platform}:`, error.message);
        }
      }
    }
    
    return { success: true, message: 'Calendari sincronizzati' };
  } catch (error) {
    console.error('❌ Errore sync calendari:', error);
    throw error;
  }
}

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { action } = req.query;

  try {
    switch (action) {
      case 'check':
        // Check availability for specific dates
        const { startDate, endDate } = req.query;
        
        if (!startDate || !endDate) {
          return res.status(400).json({
            error: 'Date richieste',
            required: ['startDate', 'endDate']
          });
        }

        const availabilityQuery = `
          SELECT COUNT(*) as conflicts FROM admin_bookings 
          WHERE status != 'cancelled' 
          AND (
            (check_in_date <= $1 AND check_out_date > $1) OR
            (check_in_date < $2 AND check_out_date >= $2) OR
            (check_in_date >= $1 AND check_out_date <= $2)
          )
        `;
        
        const conflicts = await pool.query(availabilityQuery, [startDate, endDate]);
        
        return res.json({
          available: parseInt(conflicts.rows[0].conflicts) === 0,
          conflicts: parseInt(conflicts.rows[0].conflicts)
        });

      case 'calendar':
        // Get calendar view with bookings and blocked dates
        const { year, month } = req.query;
        
        const calendarQuery = `
          SELECT 
            check_in_date, check_out_date, guest_name, status, 'booking' as type
          FROM admin_bookings 
          WHERE status != 'cancelled'
          AND EXTRACT(YEAR FROM check_in_date) = $1 
          AND EXTRACT(MONTH FROM check_in_date) = $2
          
          UNION ALL
          
          SELECT 
            blocked_date as check_in_date, blocked_date as check_out_date, 
            reason as guest_name, 'blocked' as status, 'blocked' as type
          FROM admin_calendar_events 
          WHERE EXTRACT(YEAR FROM blocked_date) = $1 
          AND EXTRACT(MONTH FROM blocked_date) = $2
          
          ORDER BY check_in_date
        `;
        
        const calendarData = await pool.query(calendarQuery, [
          year || new Date().getFullYear(), 
          month || new Date().getMonth() + 1
        ]);
        
        return res.json({
          success: true,
          events: calendarData.rows
        });

      case 'next-available':
        // Find next available period
        const { duration = 1 } = req.query;
        const today = new Date().toISOString().split('T')[0];
        
        const nextAvailableQuery = `
          WITH date_series AS (
            SELECT generate_series($1::date, $1::date + interval '90 days', '1 day'::interval) AS check_date
          ),
          occupied_dates AS (
            SELECT DISTINCT date_trunc('day', d)::date as occupied_date
            FROM admin_bookings, 
            generate_series(check_in_date::date, check_out_date::date - interval '1 day', '1 day'::interval) d
            WHERE status != 'cancelled'
            
            UNION
            
            SELECT blocked_date as occupied_date 
            FROM admin_calendar_events
          )
          SELECT check_date 
          FROM date_series 
          LEFT JOIN occupied_dates ON date_series.check_date = occupied_dates.occupied_date
          WHERE occupied_dates.occupied_date IS NULL
          ORDER BY check_date
          LIMIT $2
        `;
        
        const availableDates = await pool.query(nextAvailableQuery, [today, duration]);
        
        return res.json({
          success: true,
          nextAvailable: availableDates.rows.map(row => row.check_date),
          duration: parseInt(duration)
        });

      case 'sync-calendars':
        // Sync external calendars (Booking.com, Holidu, etc.)
        if (req.method !== 'POST') {
          return res.status(405).json({ error: 'Method not allowed' });
        }
        
        const syncResult = await syncExternalCalendars();
        return res.json(syncResult);

      case 'block-dates':
        // Manage blocked dates
        if (req.method === 'POST') {
          const { dates, reason } = req.body;
          
          if (!dates || !Array.isArray(dates)) {
            return res.status(400).json({ error: 'Date richieste' });
          }
          
          for (const date of dates) {
            await pool.query(`
              INSERT INTO admin_calendar_events (blocked_date, reason, source, created_at)
              VALUES ($1, $2, 'manual', NOW())
              ON CONFLICT (blocked_date) DO UPDATE SET 
                reason = $2, source = 'manual'
            `, [date, reason || 'Bloccato manualmente']);
          }
          
          return res.json({
            success: true,
            message: `${dates.length} date bloccate`
          });
          
        } else if (req.method === 'DELETE') {
          const { dates } = req.body;
          
          if (!dates || !Array.isArray(dates)) {
            return res.status(400).json({ error: 'Date richieste' });
          }
          
          await pool.query(
            'DELETE FROM admin_calendar_events WHERE blocked_date = ANY($1)',
            [dates]
          );
          
          return res.json({
            success: true,
            message: `${dates.length} date sbloccate`
          });
        }
        
        return res.status(405).json({ error: 'Method not allowed' });

      default:
        return res.status(400).json({ error: 'Azione non valida' });
    }

  } catch (error) {
    console.error('❌ Errore API availability:', error);
    return res.status(500).json({ 
      error: 'Errore del server',
      message: error.message 
    });
  }
};