// API: Export iCal per sincronizzazione con piattaforme esterne
// Genera file .ics standard con prenotazioni dirette + date bloccate admin
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL,
  ssl: { rejectUnauthorized: false }
});

export default async function handler(req, res) {
  // Solo GET
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    // Genera UID unico per gli eventi
    const generateUID = (type, id, date) => {
      return `${type}-${id}-${date}@vincantomaori.it`;
    };

    // Formatta data per iCal (YYYYMMDDTHHMMSSZ)
    const formatICalDate = (dateStr) => {
      const date = new Date(dateStr);
      return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };

    // Formatta data per iCal (solo data YYYYMMDD)
    const formatICalDateOnly = (dateStr) => {
      const date = new Date(dateStr);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}${month}${day}`;
    };

    // Carica prenotazioni dirette dal database
    const bookingsQuery = await pool.query(`
      SELECT 
        id,
        customer_name,
        customer_email,
        check_in,
        check_out,
        guests,
        status,
        created_at,
        updated_at
      FROM bookings 
      WHERE status IN ('confirmed', 'completed')
        AND check_out >= CURRENT_DATE
      ORDER BY check_in ASC;
    `);

    // Carica date bloccate manualmente dall'admin
    const blockedDatesQuery = await pool.query(`
      SELECT 
        id,
        start_date,
        end_date,
        reason,
        description,
        created_at
      FROM blocked_dates
      WHERE end_date >= CURRENT_DATE
      ORDER BY start_date ASC;
    `);

    const now = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

    // Inizia file iCal
    let ical = 'BEGIN:VCALENDAR\r\n';
    ical += 'VERSION:2.0\r\n';
    ical += 'PRODID:-//Vincanto Maori//Booking System//IT\r\n';
    ical += 'CALSCALE:GREGORIAN\r\n';
    ical += 'METHOD:PUBLISH\r\n';
    ical += 'X-WR-CALNAME:Vincanto Maori - Prenotazioni e Date Bloccate\r\n';
    ical += 'X-WR-TIMEZONE:Europe/Rome\r\n';
    ical += 'X-WR-CALDESC:Calendario prenotazioni dirette e date non disponibili per Vincanto Maori\r\n';

    // Timezone (opzionale ma consigliato)
    ical += 'BEGIN:VTIMEZONE\r\n';
    ical += 'TZID:Europe/Rome\r\n';
    ical += 'BEGIN:STANDARD\r\n';
    ical += 'DTSTART:19701025T030000\r\n';
    ical += 'RRULE:FREQ=YEARLY;BYMONTH=10;BYDAY=-1SU\r\n';
    ical += 'TZOFFSETFROM:+0200\r\n';
    ical += 'TZOFFSETTO:+0100\r\n';
    ical += 'TZNAME:CET\r\n';
    ical += 'END:STANDARD\r\n';
    ical += 'BEGIN:DAYLIGHT\r\n';
    ical += 'DTSTART:19700329T020000\r\n';
    ical += 'RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=-1SU\r\n';
    ical += 'TZOFFSETFROM:+0100\r\n';
    ical += 'TZOFFSETTO:+0200\r\n';
    ical += 'TZNAME:CEST\r\n';
    ical += 'END:DAYLIGHT\r\n';
    ical += 'END:VTIMEZONE\r\n';

    // Aggiungi prenotazioni dirette come eventi
    bookingsQuery.rows.forEach(booking => {
      const uid = generateUID('booking', booking.id, booking.check_in);
      const dtstart = formatICalDateOnly(booking.check_in);
      const dtend = formatICalDateOnly(booking.check_out);
      const summary = `Prenotato - ${booking.customer_name}`;
      const description = `Prenotazione diretta\\nOspiti: ${booking.guests}\\nEmail: ${booking.customer_email}\\nStato: ${booking.status}`;
      const created = formatICalDate(booking.created_at);
      const lastMod = formatICalDate(booking.updated_at || booking.created_at);

      ical += 'BEGIN:VEVENT\r\n';
      ical += `UID:${uid}\r\n`;
      ical += `DTSTAMP:${now}\r\n`;
      ical += `DTSTART;VALUE=DATE:${dtstart}\r\n`;
      ical += `DTEND;VALUE=DATE:${dtend}\r\n`;
      ical += `SUMMARY:${summary}\r\n`;
      ical += `DESCRIPTION:${description}\r\n`;
      ical += `STATUS:CONFIRMED\r\n`;
      ical += `TRANSP:OPAQUE\r\n`;
      ical += `CREATED:${created}\r\n`;
      ical += `LAST-MODIFIED:${lastMod}\r\n`;
      ical += `SEQUENCE:0\r\n`;
      ical += 'END:VEVENT\r\n';
    });

    // Aggiungi date bloccate come eventi
    blockedDatesQuery.rows.forEach(blocked => {
      const uid = generateUID('blocked', blocked.id, blocked.start_date);
      const dtstart = formatICalDateOnly(blocked.start_date);
      const dtend = formatICalDateOnly(blocked.end_date);
      const summary = blocked.reason || 'Non disponibile';
      const description = blocked.description || 'Data bloccata manualmente dall\'amministratore';
      const created = formatICalDate(blocked.created_at);

      ical += 'BEGIN:VEVENT\r\n';
      ical += `UID:${uid}\r\n`;
      ical += `DTSTAMP:${now}\r\n`;
      ical += `DTSTART;VALUE=DATE:${dtstart}\r\n`;
      ical += `DTEND;VALUE=DATE:${dtend}\r\n`;
      ical += `SUMMARY:${summary}\r\n`;
      ical += `DESCRIPTION:${description}\r\n`;
      ical += `STATUS:CONFIRMED\r\n`;
      ical += `TRANSP:OPAQUE\r\n`;
      ical += `CREATED:${created}\r\n`;
      ical += `LAST-MODIFIED:${created}\r\n`;
      ical += `SEQUENCE:0\r\n`;
      ical += 'END:VEVENT\r\n';
    });

    // Chiudi calendario
    ical += 'END:VCALENDAR\r\n';

    // Imposta headers per download file .ics
    res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="vincanto-calendar.ics"');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    console.log(`✅ iCal export generato: ${bookingsQuery.rows.length} prenotazioni + ${blockedDatesQuery.rows.length} blocchi`);

    return res.status(200).send(ical);

  } catch (error) {
    console.error('❌ Errore export iCal:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
      hint: 'Verificare DATABASE_URL configurato correttamente'
    });
  }
}
