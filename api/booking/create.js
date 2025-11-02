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
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Metodo non consentito' });
  }

  let client;

  try {
    if (!pool) {
      return res.status(500).json({ success: false, error: 'Database non disponibile' });
    }

    client = await pool.connect();

    const {
      guest_name,
      guest_surname,
      guest_email,
      guest_phone,
      check_in_date,
      check_out_date,
      num_adults,
      num_children = 0,
      children_ages = [],
      parking_option = 'none',
      payment_method = 'stripe',
      payment_type = 'deposit',
      guest_message = '',
      total_amount,
      deposit_amount
    } = req.body;

    // Validazione campi obbligatori
    const required = [
      'guest_name', 'guest_surname', 'guest_email', 'guest_phone',
      'check_in_date', 'check_out_date', 'num_adults', 'total_amount', 'deposit_amount'
    ];

    for (const field of required) {
      if (!req.body[field]) {
        return res.status(400).json({
          success: false,
          error: `Campo obbligatorio mancante: ${field}`
        });
      }
    }

    // Validazione email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(guest_email)) {
      return res.status(400).json({
        success: false,
        error: 'Formato email non valido'
      });
    }

    // Validazione date
    const checkIn = new Date(check_in_date);
    const checkOut = new Date(check_out_date);
    const today = new Date();
    
    if (checkIn <= today) {
      return res.status(400).json({
        success: false,
        error: 'Data di check-in non può essere nel passato'
      });
    }

    if (checkOut <= checkIn) {
      return res.status(400).json({
        success: false,
        error: 'Data di check-out deve essere successiva al check-in'
      });
    }

    // Controlla disponibilità delle date
    console.log('🔍 Controllo disponibilità per:', { check_in_date, check_out_date });
    
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

    const availabilityResult = await client.query(availabilityQuery, [check_in_date, check_out_date]);
    const conflicts = parseInt(availabilityResult.rows[0].conflicts) || 0;

    if (conflicts > 0) {
      return res.status(409).json({
        success: false,
        error: 'Le date selezionate non sono disponibili',
        conflicts
      });
    }

    console.log('✅ Date disponibili, procedo con la prenotazione');

    // Inserisci prenotazione nel database
    const insertQuery = `
      INSERT INTO admin_bookings (
        guest_name, guest_surname, guest_email, guest_phone,
        check_in_date, check_out_date, num_adults, num_children, children_ages,
        parking_option, payment_method, payment_type, guest_message,
        total_amount, deposit_amount, status, created_at, updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, 'pending', NOW(), NOW())
      RETURNING id, created_at
    `;

    const bookingResult = await client.query(insertQuery, [
      guest_name, guest_surname, guest_email, guest_phone,
      check_in_date, check_out_date, num_adults, num_children, JSON.stringify(children_ages),
      parking_option, payment_method, payment_type, guest_message,
      total_amount, deposit_amount
    ]);

    const bookingId = bookingResult.rows[0].id;
    const createdAt = bookingResult.rows[0].created_at;

    console.log('✅ Prenotazione creata con ID:', bookingId);

    // Calcola dettagli soggiorno
    const nights = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));

    // Invia email automatiche (senza bloccare la risposta)
    sendAutomaticEmails(bookingId).catch(emailError => {
      console.error('❌ Errore invio email automatiche:', emailError);
    });

    // Sincronizza calendari esterni (senza bloccare la risposta) 
    syncExternalCalendars(bookingId, {
      check_in_date, check_out_date, guest_name, guest_surname
    }).catch(syncError => {
      console.error('❌ Errore sincronizzazione calendari:', syncError);
    });

    return res.status(201).json({
      success: true,
      message: 'Prenotazione creata con successo',
      booking: {
        id: bookingId,
        guest_name,
        guest_surname,
        guest_email,
        check_in_date,
        check_out_date,
        nights,
        num_adults,
        num_children,
        total_amount,
        deposit_amount,
        status: 'pending',
        created_at: createdAt
      },
      next_steps: {
        email_confirmation: 'Inviata automaticamente',
        admin_notification: 'Inviata automaticamente',
        calendar_sync: 'Avviata automaticamente',
        payment_required: payment_type === 'deposit' ? deposit_amount : total_amount
      }
    });

  } catch (error) {
    console.error('❌ Errore creazione prenotazione:', error);
    return res.status(500).json({
      success: false,
      error: 'Errore interno del server',
      details: error.message
    });
  } finally {
    if (client) {
      client.release();
    }
  }
}

// Funzione asincrona per invio email automatiche
async function sendAutomaticEmails(bookingId) {
  try {
    console.log('📧 Avvio invio email automatiche per prenotazione:', bookingId);

    // Chiama l'API email-notifications
    const emailResponse = await fetch(`${process.env.VERCEL_URL || 'http://localhost:3000'}/api/email-notifications?action=send-booking-complete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ booking_id: bookingId })
    });

    if (emailResponse.ok) {
      console.log('✅ Email automatiche inviate con successo');
    } else {
      const errorData = await emailResponse.json();
      console.error('❌ Errore invio email automatiche:', errorData);
    }

  } catch (error) {
    console.error('❌ Errore chiamata API email:', error);
  }
}

// Funzione asincrona per sincronizzazione calendari esterni
async function syncExternalCalendars(bookingId, bookingData) {
  try {
    console.log('📅 Avvio sincronizzazione calendari per prenotazione:', bookingId);

    // Chiama l'API calendar-integration per export
    const calendarResponse = await fetch(`${process.env.VERCEL_URL || 'http://localhost:3000'}/api/calendar-integration?action=export-to-google`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        booking_id: bookingId,
        ...bookingData
      })
    });

    if (calendarResponse.ok) {
      console.log('✅ Sincronizzazione calendari avviata con successo');
    } else {
      const errorData = await calendarResponse.json();
      console.error('❌ Errore sincronizzazione calendari:', errorData);
    }

  } catch (error) {
    console.error('❌ Errore chiamata API calendari:', error);
  }
}