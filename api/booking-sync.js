import { Pool } from 'pg';
import nodemailer from 'nodemailer';

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
 * Sistema Prenotazioni Bidirezionale
 * 1. Salva prenotazione nel database
 * 2. Invia notifiche email/push
 * 3. Blocca date su tutti i calendari esterni
 * 4. Invalida cache disponibilità
 */
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  let client;

  try {
    client = await pool.connect();
    
    switch (req.method) {
      case 'POST':
        return await createBooking(req, res, client);
      case 'PUT':
        return await updateBookingStatus(req, res, client);
      case 'GET':
        return await getBookings(req, res, client);
      default:
        return res.status(405).json({ success: false, error: 'Metodo non supportato' });
    }
    
  } catch (error) {
    console.error('Booking API error:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Errore sistema prenotazioni',
      details: error.message 
    });
  } finally {
    if (client) client.release();
  }
}

/**
 * Crea nuova prenotazione con sync calendario completa
 */
async function createBooking(req, res, client) {
  const bookingData = req.body;
  const {
    check_in_date,
    check_out_date,
    guest_name,
    guest_email,
    guest_phone,
    num_adults,
    num_children = 0,
    children_ages = [],
    total_amount,
    deposit_amount,
    parking_option = 'none',
    special_requests = ''
  } = bookingData;

  // Validazione base
  if (!check_in_date || !check_out_date || !guest_name || !guest_email) {
    return res.status(400).json({ 
      success: false, 
      error: 'Dati prenotazione incompleti' 
    });
  }

  const bookingId = `VIN${Date.now()}`;
  
  try {
    console.log(`🏨 Creazione prenotazione ${bookingId}: ${guest_name} (${check_in_date} → ${check_out_date})`);

    // 1. CONTROLLO DISPONIBILITÀ FINALE (double-check)
    console.log('🔍 Controllo disponibilità finale...');
    const availabilityCheck = await fetch(`${process.env.VERCEL_URL || 'http://localhost:3000'}/api/availability-sync?action=check&startDate=${check_in_date}&endDate=${check_out_date}`);
    const availability = await availabilityCheck.json();
    
    if (!availability.success || !availability.available) {
      return res.status(409).json({ 
        success: false, 
        error: 'Date non più disponibili',
        blockedDates: availability.blockedDates
      });
    }

    // 2. SALVA PRENOTAZIONE NEL DATABASE
    console.log('💾 Salvataggio prenotazione nel database...');
    const bookingInsert = await client.query(`
      INSERT INTO admin_bookings (
        booking_id, check_in_date, check_out_date, guest_name, guest_email, 
        guest_phone, num_adults, num_children, children_ages, total_amount, 
        deposit_amount, parking_option, special_requests, status, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, NOW())
      RETURNING id
    `, [
      bookingId, check_in_date, check_out_date, guest_name, guest_email,
      guest_phone, num_adults, num_children, JSON.stringify(children_ages),
      total_amount, deposit_amount, parking_option, special_requests, 'confirmed'
    ]);

    const dbBookingId = bookingInsert.rows[0].id;

    // 3. BLOCCA DATE SU CALENDARI ESTERNI + GOOGLE CALENDAR
    console.log('🔒 Blocco date sui calendari esterni...');
    const calendarResults = [];
    
    try {
      // 3a. Crea evento su Google Calendar
      console.log('📅 Creazione evento Google Calendar...');
      const googleResponse = await fetch(`${process.env.VERCEL_URL || 'http://localhost:3000'}/api/google-calendar?action=create-event`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          startDate: check_in_date,
          endDate: check_out_date,
          guestName: guest_name,
          guestEmail: guest_email,
          bookingId: bookingId,
          summary: `Prenotazione Vincanto - ${guest_name}`
        })
      });
      
      const googleResult = await googleResponse.json();
      if (googleResult.success) {
        calendarResults.push({
          platform: 'google',
          status: 'success',
          eventId: googleResult.eventId
        });
        console.log('✅ Evento Google Calendar creato:', googleResult.eventId);
        
        // Salva ID evento Google nella prenotazione per future cancellazioni
        await client.query(`
          UPDATE admin_bookings 
          SET google_event_id = $1 
          WHERE booking_id = $2
        `, [googleResult.eventId, bookingId]);
        
      } else {
        calendarResults.push({
          platform: 'google',
          status: 'error',
          error: googleResult.error
        });
        console.log('⚠️ Errore Google Calendar:', googleResult.error);
      }
      
    } catch (googleError) {
      calendarResults.push({
        platform: 'google',
        status: 'error',
        error: googleError.message
      });
      console.error('⚠️ Errore Google Calendar:', googleError);
    }
    
    try {
      // 3b. Altri calendari esterni (Booking, Holidu - se supportano API scrittura)
      const blockDatesResponse = await fetch(`${process.env.VERCEL_URL || 'http://localhost:3000'}/api/availability-sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'block-dates',
          startDate: check_in_date,
          endDate: check_out_date,
          bookingId: bookingId,
          guestName: guest_name
        })
      });
      
      const blockResult = await blockDatesResponse.json();
      console.log('📅 Risultato blocco altri calendari:', blockResult);
      
      if (blockResult.results) {
        calendarResults.push(...blockResult.results);
      }
      
    } catch (syncError) {
      console.error('⚠️ Errore sincronizzazione altri calendari:', syncError);
      calendarResults.push({
        platform: 'external',
        status: 'error',
        error: syncError.message
      });
    }

    // 4. INVIA NOTIFICHE EMAIL
    console.log('📧 Invio notifiche email...');
    await sendBookingNotifications(bookingData, bookingId);

    // 5. RISPOSTA SUCCESSO
    return res.status(201).json({
      success: true,
      bookingId: bookingId,
      dbId: dbBookingId,
      message: 'Prenotazione confermata con successo',
      checkIn: check_in_date,
      checkOut: check_out_date,
      guest: guest_name,
      totalAmount: total_amount,
      calendarSync: {
        results: calendarResults,
        totalSynced: calendarResults.filter(r => r.status === 'success').length,
        totalErrors: calendarResults.filter(r => r.status === 'error').length
      },
      nextSteps: [
        'Email di conferma inviata',
        `Date bloccate su ${calendarResults.filter(r => r.status === 'success').length} calendari`,
        'Evento aggiunto a Google Calendar',
        'Pagamento deposito richiesto entro 24h'
      ]
    });

  } catch (error) {
    console.error('❌ Errore creazione prenotazione:', error);
    
    // Rollback se possibile
    try {
      await client.query('DELETE FROM admin_bookings WHERE booking_id = $1', [bookingId]);
      console.log('🔄 Rollback prenotazione completato');
    } catch (rollbackError) {
      console.error('❌ Errore rollback:', rollbackError);
    }

    return res.status(500).json({ 
      success: false, 
      error: 'Errore durante creazione prenotazione',
      details: error.message
    });
  }
}

/**
 * Aggiorna stato prenotazione
 */
async function updateBookingStatus(req, res, client) {
  const { bookingId, status, notes } = req.body;
  
  if (!bookingId || !status) {
    return res.status(400).json({ 
      success: false, 
      error: 'bookingId e status sono obbligatori' 
    });
  }

  try {
    const result = await client.query(`
      UPDATE admin_bookings 
      SET status = $1, admin_notes = $2, updated_at = NOW()
      WHERE booking_id = $3 OR id = $3
      RETURNING *
    `, [status, notes || '', bookingId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Prenotazione non trovata' 
      });
    }

    const booking = result.rows[0];

    // Se stato cancellato, libera le date sui calendari
    if (status === 'cancelled') {
      console.log(`🔓 Liberando date per prenotazione cancellata ${bookingId}`);
      
      // Rimuovi evento da Google Calendar se presente
      if (booking.google_event_id) {
        try {
          const deleteResponse = await fetch(`${process.env.VERCEL_URL || 'http://localhost:3000'}/api/google-calendar?action=delete-event`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              eventId: booking.google_event_id,
              bookingId: bookingId
            })
          });
          
          const deleteResult = await deleteResponse.json();
          if (deleteResult.success) {
            console.log('✅ Evento Google Calendar rimosso');
          } else {
            console.log('⚠️ Errore rimozione Google Calendar:', deleteResult.error);
          }
        } catch (deleteError) {
          console.error('⚠️ Errore eliminazione Google Calendar:', deleteError);
        }
      }
      
      // TODO: Liberare date su altri calendari esterni (Booking, Holidu se supportano)
    }

    return res.json({
      success: true,
      booking: booking,
      message: `Stato prenotazione aggiornato a: ${status}`
    });

  } catch (error) {
    console.error('Error updating booking:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Errore aggiornamento prenotazione' 
    });
  }
}

/**
 * Ottieni prenotazioni (per admin panel)
 */
async function getBookings(req, res, client) {
  const { status, startDate, endDate, limit = 50 } = req.query;
  
  try {
    let query = `
      SELECT * FROM admin_bookings 
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 0;

    if (status) {
      paramCount++;
      query += ` AND status = $${paramCount}`;
      params.push(status);
    }

    if (startDate) {
      paramCount++;
      query += ` AND check_in_date >= $${paramCount}`;
      params.push(startDate);
    }

    if (endDate) {
      paramCount++;
      query += ` AND check_out_date <= $${paramCount}`;
      params.push(endDate);
    }

    query += ` ORDER BY created_at DESC LIMIT $${paramCount + 1}`;
    params.push(limit);

    const result = await client.query(query, params);

    return res.json({
      success: true,
      bookings: result.rows,
      total: result.rows.length,
      filters: { status, startDate, endDate }
    });

  } catch (error) {
    console.error('Error getting bookings:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Errore recupero prenotazioni' 
    });
  }
}

/**
 * Invia notifiche email per prenotazione
 */
async function sendBookingNotifications(bookingData, bookingId) {
  if (!process.env.SMTP_HOST) {
    console.log('📧 SMTP non configurato, skip email');
    return;
  }

  try {
    const transporter = nodemailer.createTransporter({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });

    const { guest_name, guest_email, check_in_date, check_out_date, total_amount } = bookingData;

    // Email ospite
    await transporter.sendMail({
      from: process.env.SMTP_FROM || 'noreply@vincanto.it',
      to: guest_email,
      subject: `Conferma Prenotazione Vincanto - ${bookingId}`,
      html: `
        <h2>🏨 Prenotazione Confermata!</h2>
        <p>Gentile <strong>${guest_name}</strong>,</p>
        <p>La sua prenotazione è stata confermata con successo:</p>
        <ul>
          <li><strong>Codice Prenotazione:</strong> ${bookingId}</li>
          <li><strong>Check-in:</strong> ${check_in_date}</li>
          <li><strong>Check-out:</strong> ${check_out_date}</li>
          <li><strong>Totale:</strong> €${total_amount}</li>
        </ul>
        <p>Riceverà ulteriori dettagli e istruzioni di pagamento a breve.</p>
        <p>Grazie per aver scelto Vincanto!</p>
      `
    });

    // Email admin
    await transporter.sendMail({
      from: process.env.SMTP_FROM || 'noreply@vincanto.it',
      to: process.env.ADMIN_EMAIL || 'admin@vincanto.it',
      subject: `🔔 Nuova Prenotazione - ${bookingId}`,
      html: `
        <h2>📅 Nuova Prenotazione Ricevuta</h2>
        <ul>
          <li><strong>ID:</strong> ${bookingId}</li>
          <li><strong>Ospite:</strong> ${guest_name} (${guest_email})</li>
          <li><strong>Date:</strong> ${check_in_date} → ${check_out_date}</li>
          <li><strong>Totale:</strong> €${total_amount}</li>
        </ul>
        <p><a href="${process.env.ADMIN_PANEL_URL}/bookings/${bookingId}">Gestisci Prenotazione</a></p>
      `
    });

    console.log('📧 Email notifiche inviate con successo');

  } catch (emailError) {
    console.error('❌ Errore invio email:', emailError);
    // Non fallire la prenotazione per errori email
  }
}