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

// Configurazione email
let transporter;
try {
  transporter = nodemailer.createTransporter({
    service: 'gmail', // Usa il servizio Gmail direttamente
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
  
  // Verifica la configurazione
  console.log('📧 Configurazione email Gmail:', {
    user: process.env.EMAIL_USER ? '✅ Configurato' : '❌ Mancante',
    pass: process.env.EMAIL_PASS ? '✅ Configurato' : '❌ Mancante'
  });
} catch (emailError) {
  console.error('Email transporter error:', emailError);
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { action } = req.query;
  let client;

  try {
    if (!pool) {
      return res.status(500).json({ success: false, error: 'Database non disponibile' });
    }

    client = await pool.connect();

    switch (action) {
      case 'send-booking-confirmation':
        return await sendBookingConfirmation(client, req, res);
      case 'send-admin-notification':
        return await sendAdminNotification(client, req, res);
      case 'send-booking-complete':
        return await sendCompleteBookingEmails(client, req, res);
      case 'test-email':
        return await testEmailService(client, req, res);
      default:
        return res.status(400).json({ 
          success: false, 
          error: 'Azione richiesta: send-booking-confirmation, send-admin-notification, send-booking-complete, test-email' 
        });
    }

  } catch (error) {
    console.error('❌ Errore API email notifications:', error);
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

// Invia email di conferma prenotazione all'utente
async function sendBookingConfirmation(client, req, res) {
  try {
    const { booking_id } = req.body;

    if (!booking_id) {
      return res.status(400).json({
        success: false,
        error: 'booking_id richiesto'
      });
    }

    // Carica dati prenotazione
    const bookingResult = await client.query(`
      SELECT 
        id, guest_name, guest_surname, guest_email, guest_phone,
        check_in_date, check_out_date, num_adults, num_children,
        total_amount, deposit_amount, parking_option, payment_method,
        status, created_at
      FROM admin_bookings 
      WHERE id = $1
    `, [booking_id]);

    if (bookingResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Prenotazione non trovata'
      });
    }

    const booking = bookingResult.rows[0];
    
    // Calcola notti
    const checkIn = new Date(booking.check_in_date);
    const checkOut = new Date(booking.check_out_date);
    const nights = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));

    // Email HTML per l'utente
    const userEmailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Conferma Prenotazione - Vincanto Maori</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #2c5530; color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .booking-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .detail-row { display: flex; justify-content: space-between; margin: 10px 0; padding: 8px 0; border-bottom: 1px solid #eee; }
          .highlight { background: #e8f5e8; padding: 15px; border-radius: 8px; margin: 15px 0; }
          .footer { text-align: center; color: #666; font-size: 14px; margin-top: 30px; }
          .contact-info { background: #fff; padding: 15px; border-radius: 8px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🏠 Vincanto Maori</h1>
            <h2>Conferma Prenotazione</h2>
          </div>
          
          <div class="content">
            <p><strong>Gentile ${booking.guest_name} ${booking.guest_surname},</strong></p>
            
            <p>La sua prenotazione è stata confermata con successo! Di seguito trova tutti i dettagli:</p>
            
            <div class="booking-details">
              <h3>📋 Dettagli Prenotazione</h3>
              <div class="detail-row">
                <span><strong>Codice Prenotazione:</strong></span>
                <span>#${booking.id}</span>
              </div>
              <div class="detail-row">
                <span><strong>Check-in:</strong></span>
                <span>${checkIn.toLocaleDateString('it-IT')} (dalle 15:00)</span>
              </div>
              <div class="detail-row">
                <span><strong>Check-out:</strong></span>
                <span>${checkOut.toLocaleDateString('it-IT')} (entro le 11:00)</span>
              </div>
              <div class="detail-row">
                <span><strong>Durata soggiorno:</strong></span>
                <span>${nights} notti</span>
              </div>
              <div class="detail-row">
                <span><strong>Ospiti:</strong></span>
                <span>${booking.num_adults} adulti${booking.num_children > 0 ? ` + ${booking.num_children} bambini` : ''}</span>
              </div>
              <div class="detail-row">
                <span><strong>Parcheggio:</strong></span>
                <span>${booking.parking_option === 'private' ? '🅿️ Incluso' : 'Non richiesto'}</span>
              </div>
            </div>

            <div class="highlight">
              <h3>💰 Riepilogo Costi</h3>
              <div class="detail-row">
                <span><strong>Totale soggiorno:</strong></span>
                <span><strong>€${booking.total_amount}</strong></span>
              </div>
              <div class="detail-row">
                <span><strong>Acconto versato:</strong></span>
                <span>€${booking.deposit_amount}</span>
              </div>
              <div class="detail-row">
                <span><strong>Saldo da versare all'arrivo:</strong></span>
                <span><strong>€${booking.total_amount - booking.deposit_amount}</strong></span>
              </div>
            </div>

            <div class="contact-info">
              <h3>📞 Informazioni di Contatto</h3>
              <p><strong>Indirizzo:</strong> Vincanto Maori, [Inserire indirizzo completo]</p>
              <p><strong>Telefono:</strong> [Inserire numero di telefono]</p>
              <p><strong>Email:</strong> info@vincantomaori.it</p>
              <p><strong>Check-in:</strong> Dalle 15:00 alle 20:00</p>
              <p><strong>Check-out:</strong> Entro le 11:00</p>
            </div>

            <div class="highlight">
              <h3>📝 Istruzioni Importanti</h3>
              <ul>
                <li>Conservi questa email come conferma della prenotazione</li>
                <li>In caso di arrivo dopo le 20:00, contatti preventivamente la struttura</li>
                <li>Il saldo potrà essere versato in contanti o con carta all'arrivo</li>
                <li>La pulizia finale è inclusa nel prezzo</li>
              </ul>
            </div>

            <p>Non vediamo l'ora di darle il benvenuto presso Vincanto Maori!</p>
            
            <p>Cordiali saluti,<br>
            <strong>Team Vincanto Maori</strong></p>
          </div>
          
          <div class="footer">
            <p>Questa email è stata generata automaticamente. Per assistenza, risponda a questa email o contatti la struttura.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Invia email all'utente
    if (!transporter) {
      throw new Error('Servizio email non configurato');
    }

    const userMailOptions = {
      from: `"Vincanto Maori" <${process.env.EMAIL_USER}>`,
      to: booking.guest_email,
      subject: `✅ Conferma Prenotazione #${booking.id} - Vincanto Maori`,
      html: userEmailHtml
    };

    console.log('📧 Invio email conferma a:', booking.guest_email);
    await transporter.sendMail(userMailOptions);

    // Salva log email nel database
    await client.query(`
      INSERT INTO admin_email_logs (
        booking_id, email_type, recipient, subject, sent_at, status
      )
      VALUES ($1, 'booking_confirmation', $2, $3, NOW(), 'sent')
    `, [booking_id, booking.guest_email, userMailOptions.subject]);

    return res.status(200).json({
      success: true,
      message: 'Email di conferma inviata con successo',
      recipient: booking.guest_email
    });

  } catch (error) {
    console.error('❌ Errore invio email conferma:', error);
    
    // Log errore nel database
    if (client) {
      try {
        await client.query(`
          INSERT INTO admin_email_logs (
            booking_id, email_type, error_message, sent_at, status
          )
          VALUES ($1, 'booking_confirmation', $2, NOW(), 'error')
        `, [req.body.booking_id, error.message]);
      } catch (logError) {
        console.error('❌ Errore log email:', logError);
      }
    }

    throw error;
  }
}

// Invia notifica email all'amministratore
async function sendAdminNotification(client, req, res) {
  try {
    const { booking_id } = req.body;

    if (!booking_id) {
      return res.status(400).json({
        success: false,
        error: 'booking_id richiesto'
      });
    }

    // Carica dati prenotazione
    const bookingResult = await client.query(`
      SELECT 
        id, guest_name, guest_surname, guest_email, guest_phone,
        check_in_date, check_out_date, num_adults, num_children,
        total_amount, deposit_amount, parking_option, payment_method,
        guest_message, status, created_at
      FROM admin_bookings 
      WHERE id = $1
    `, [booking_id]);

    if (bookingResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Prenotazione non trovata'
      });
    }

    const booking = bookingResult.rows[0];
    
    // Calcola notti
    const checkIn = new Date(booking.check_in_date);
    const checkOut = new Date(booking.check_out_date);
    const nights = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));

    // Email HTML per l'amministratore
    const adminEmailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>🔔 Nuova Prenotazione - Admin Vincanto</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 700px; margin: 0 auto; padding: 20px; }
          .header { background: #d32f2f; color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .booking-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .detail-row { display: flex; justify-content: space-between; margin: 8px 0; padding: 6px 0; border-bottom: 1px solid #eee; }
          .alert { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 8px; margin: 15px 0; }
          .guest-info { background: #e3f2fd; padding: 15px; border-radius: 8px; margin: 15px 0; }
          .actions { background: #e8f5e8; padding: 15px; border-radius: 8px; margin: 15px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔔 NUOVA PRENOTAZIONE</h1>
            <h2>Vincanto Maori - Admin Panel</h2>
          </div>
          
          <div class="content">
            <div class="alert">
              <h3>⚡ ATTENZIONE - Nuova prenotazione ricevuta!</h3>
              <p><strong>Prenotazione #${booking.id}</strong> ricevuta il ${new Date(booking.created_at).toLocaleString('it-IT')}</p>
            </div>
            
            <div class="guest-info">
              <h3>👤 Informazioni Ospite</h3>
              <div class="detail-row">
                <span><strong>Nome:</strong></span>
                <span>${booking.guest_name} ${booking.guest_surname}</span>
              </div>
              <div class="detail-row">
                <span><strong>Email:</strong></span>
                <span><a href="mailto:${booking.guest_email}">${booking.guest_email}</a></span>
              </div>
              <div class="detail-row">
                <span><strong>Telefono:</strong></span>
                <span><a href="tel:${booking.guest_phone}">${booking.guest_phone}</a></span>
              </div>
            </div>

            <div class="booking-details">
              <h3>📅 Dettagli Soggiorno</h3>
              <div class="detail-row">
                <span><strong>Check-in:</strong></span>
                <span>${checkIn.toLocaleDateString('it-IT')}</span>
              </div>
              <div class="detail-row">
                <span><strong>Check-out:</strong></span>
                <span>${checkOut.toLocaleDateString('it-IT')}</span>
              </div>
              <div class="detail-row">
                <span><strong>Notti:</strong></span>
                <span>${nights}</span>
              </div>
              <div class="detail-row">
                <span><strong>Adulti:</strong></span>
                <span>${booking.num_adults}</span>
              </div>
              <div class="detail-row">
                <span><strong>Bambini:</strong></span>
                <span>${booking.num_children}</span>
              </div>
              <div class="detail-row">
                <span><strong>Parcheggio:</strong></span>
                <span>${booking.parking_option === 'private' ? '🅿️ Richiesto' : 'Non richiesto'}</span>
              </div>
              <div class="detail-row">
                <span><strong>Metodo pagamento:</strong></span>
                <span>${booking.payment_method}</span>
              </div>
            </div>

            <div class="booking-details">
              <h3>💰 Informazioni Finanziarie</h3>
              <div class="detail-row">
                <span><strong>Totale:</strong></span>
                <span><strong>€${booking.total_amount}</strong></span>
              </div>
              <div class="detail-row">
                <span><strong>Acconto:</strong></span>
                <span>€${booking.deposit_amount}</span>
              </div>
              <div class="detail-row">
                <span><strong>Saldo:</strong></span>
                <span>€${booking.total_amount - booking.deposit_amount}</span>
              </div>
              <div class="detail-row">
                <span><strong>Status:</strong></span>
                <span><strong>${booking.status.toUpperCase()}</strong></span>
              </div>
            </div>

            ${booking.guest_message ? `
            <div class="guest-info">
              <h3>💬 Messaggio dell'ospite</h3>
              <p><em>"${booking.guest_message}"</em></p>
            </div>
            ` : ''}

            <div class="actions">
              <h3>✅ Azioni Richieste</h3>
              <ul>
                <li>✉️ Email di conferma inviata automaticamente all'ospite</li>
                <li>📅 Aggiornare calendario Google/esterni se necessario</li>
                <li>🏠 Preparare la struttura per l'arrivo</li>
                <li>💳 Verificare il pagamento dell'acconto</li>
                <li>📞 Contattare l'ospite se necessario</li>
              </ul>
            </div>

            <div class="alert">
              <p><strong>🔗 Link Admin Panel:</strong> 
              <a href="https://vincanto-vetrina.vercel.app/admin" target="_blank">Gestisci Prenotazione</a></p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    // Invia email all'amministratore
    const adminEmail = process.env.ADMIN_EMAIL || process.env.EMAIL_USER;
    
    const adminMailOptions = {
      from: `"Vincanto System" <${process.env.EMAIL_USER}>`,
      to: adminEmail,
      subject: `🔔 NUOVA PRENOTAZIONE #${booking.id} - ${booking.guest_name} ${booking.guest_surname}`,
      html: adminEmailHtml
    };

    console.log('📧 Invio notifica admin a:', adminEmail);
    await transporter.sendMail(adminMailOptions);

    // Salva log email nel database
    await client.query(`
      INSERT INTO admin_email_logs (
        booking_id, email_type, recipient, subject, sent_at, status
      )
      VALUES ($1, 'admin_notification', $2, $3, NOW(), 'sent')
    `, [booking_id, adminEmail, adminMailOptions.subject]);

    return res.status(200).json({
      success: true,
      message: 'Notifica admin inviata con successo',
      recipient: adminEmail
    });

  } catch (error) {
    console.error('❌ Errore invio notifica admin:', error);
    throw error;
  }
}

// Invia entrambe le email (conferma utente + notifica admin)
async function sendCompleteBookingEmails(client, req, res) {
  try {
    const { booking_id } = req.body;

    console.log('📧 Invio email complete per prenotazione:', booking_id);

    // Invia email conferma utente
    await sendBookingConfirmation(client, { body: { booking_id } }, { status: () => ({ json: () => {} }) });
    
    // Invia notifica admin
    await sendAdminNotification(client, { body: { booking_id } }, { status: () => ({ json: () => {} }) });

    return res.status(200).json({
      success: true,
      message: 'Email di conferma e notifica admin inviate con successo',
      booking_id
    });

  } catch (error) {
    console.error('❌ Errore invio email complete:', error);
    throw error;
  }
}

// Test servizio email
async function testEmailService(client, req, res) {
  try {
    const { test_email } = req.body;

    if (!test_email) {
      return res.status(400).json({
        success: false,
        error: 'test_email richiesto'
      });
    }

    const testMailOptions = {
      from: `"Vincanto Test" <${process.env.EMAIL_USER}>`,
      to: test_email,
      subject: '✅ Test Email Vincanto System',
      html: `
        <h2>🧪 Test Email Vincanto System</h2>
        <p>Questo è un test del sistema email di Vincanto Maori.</p>
        <p><strong>Timestamp:</strong> ${new Date().toLocaleString('it-IT')}</p>
        <p><strong>Status:</strong> ✅ Sistema email funzionante</p>
      `
    };

    await transporter.sendMail(testMailOptions);

    return res.status(200).json({
      success: true,
      message: 'Email di test inviata con successo',
      recipient: test_email
    });

  } catch (error) {
    console.error('❌ Errore test email:', error);
    throw error;
  }
}