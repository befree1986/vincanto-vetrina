const { Pool } = require('pg');
const nodemailer = require('nodemailer');

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Email transporter
const transporter = nodemailer.createTransporter({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Email templates
const generateBookingConfirmationHTML = (bookingDetails) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
        .container { max-width: 600px; margin: 0 auto; background: #f9f9f9; padding: 30px; border-radius: 10px; }
        .header { background: #2563eb; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: white; padding: 20px; margin: 0; }
        .booking-details { background: #f8fafc; padding: 15px; border-left: 4px solid #2563eb; margin: 20px 0; }
        .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>✅ Prenotazione Confermata - Vincanto Maiori</h1>
        </div>
        <div class="content">
          <p>Gentile ${bookingDetails.guestName},</p>
          <p>La sua prenotazione è stata confermata con successo!</p>
          
          <div class="booking-details">
            <h3>📋 Dettagli Prenotazione:</h3>
            <p><strong>Nome:</strong> ${bookingDetails.guestName}</p>
            <p><strong>Email:</strong> ${bookingDetails.guestEmail}</p>
            <p><strong>Telefono:</strong> ${bookingDetails.guestPhone}</p>
            <p><strong>Check-in:</strong> ${bookingDetails.checkInDate}</p>
            <p><strong>Check-out:</strong> ${bookingDetails.checkOutDate}</p>
            <p><strong>Ospiti:</strong> ${bookingDetails.guests}</p>
            <p><strong>Parcheggio:</strong> ${bookingDetails.parking ? 'Sì' : 'No'}</p>
            <p><strong>Totale:</strong> €${bookingDetails.totalPrice}</p>
            <p><strong>Codice Prenotazione:</strong> <code>${bookingDetails.bookingId}</code></p>
          </div>
          
          <p>Riceverà ulteriori informazioni via email prima del check-in.</p>
          <p>Per qualsiasi domanda, non esiti a contattarci.</p>
          
          <p>Cordiali saluti,<br>
          <strong>Team Vincanto Maiori</strong></p>
        </div>
        <div class="footer">
          <p>📍 Via Nuova Chiunzi, 44 - 84010 Maiori (SA)<br>
          📧 vincantomaiori@gmail.com | 🌐 www.vincantomaori.it</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

const generateAdminNotificationHTML = (bookingDetails) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
        .container { max-width: 600px; margin: 0 auto; background: #fff3cd; padding: 30px; border-radius: 10px; }
        .header { background: #856404; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: white; padding: 20px; margin: 0; }
        .booking-details { background: #fff3cd; padding: 15px; border-left: 4px solid #856404; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🔔 NUOVA PRENOTAZIONE - Admin Alert</h1>
        </div>
        <div class="content">
          <p><strong>È stata ricevuta una nuova prenotazione!</strong></p>
          
          <div class="booking-details">
            <h3>📋 Dettagli Cliente:</h3>
            <p><strong>Nome:</strong> ${bookingDetails.guestName}</p>
            <p><strong>Email:</strong> ${bookingDetails.guestEmail}</p>
            <p><strong>Telefono:</strong> ${bookingDetails.guestPhone}</p>
            <p><strong>Check-in:</strong> ${bookingDetails.checkInDate}</p>
            <p><strong>Check-out:</strong> ${bookingDetails.checkOutDate}</p>
            <p><strong>Ospiti:</strong> ${bookingDetails.guests}</p>
            <p><strong>Parcheggio:</strong> ${bookingDetails.parking ? 'Sì' : 'No'}</p>
            <p><strong>Totale:</strong> €${bookingDetails.totalPrice}</p>
            <p><strong>ID Prenotazione:</strong> <code>${bookingDetails.bookingId}</code></p>
            <p><strong>Data Prenotazione:</strong> ${new Date().toLocaleString('it-IT')}</p>
          </div>
          
          <p>⚡ Azione richiesta: Confermare disponibilità e preparare accoglienza ospite.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

// Send emails function
async function sendBookingEmails(bookingDetails) {
  try {
    // Send confirmation to guest
    const guestEmailOptions = {
      from: process.env.EMAIL_USER,
      to: bookingDetails.guestEmail,
      subject: '✅ Prenotazione Confermata - Vincanto Maiori',
      html: generateBookingConfirmationHTML(bookingDetails)
    };
    
    await transporter.sendMail(guestEmailOptions);
    console.log('✅ Email confermata inviata a:', bookingDetails.guestEmail);
    
    // Send notification to admin
    const adminEmailOptions = {
      from: process.env.EMAIL_USER,
      to: process.env.ADMIN_EMAIL,
      subject: `🔔 NUOVA PRENOTAZIONE - ${bookingDetails.guestName}`,
      html: generateAdminNotificationHTML(bookingDetails)
    };
    
    await transporter.sendMail(adminEmailOptions);
    console.log('✅ Notifica admin inviata a:', process.env.ADMIN_EMAIL);
    
    // Log emails sent
    await pool.query(`
      INSERT INTO admin_email_logs (type, recipient, subject, sent_at, booking_id)
      VALUES 
        ('confirmation', $1, $2, NOW(), $3),
        ('admin_notification', $4, $5, NOW(), $3)
    `, [
      bookingDetails.guestEmail,
      'Prenotazione Confermata - Vincanto Maiori',
      bookingDetails.bookingId,
      process.env.ADMIN_EMAIL,
      `NUOVA PRENOTAZIONE - ${bookingDetails.guestName}`
    ]);
    
    return { success: true, message: 'Email inviate con successo' };
  } catch (error) {
    console.error('❌ Errore invio email:', error);
    throw error;
  }
}

module.exports = async (req, res) => {
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
      case 'create':
        if (req.method !== 'POST') {
          return res.status(405).json({ error: 'Method not allowed' });
        }

        const {
          guestName, guestEmail, guestPhone,
          checkInDate, checkOutDate, guests,
          parking, totalPrice, notes
        } = req.body;

        // Validate required fields
        if (!guestName || !guestEmail || !checkInDate || !checkOutDate || !guests) {
          return res.status(400).json({ 
            error: 'Campi obbligatori mancanti',
            required: ['guestName', 'guestEmail', 'checkInDate', 'checkOutDate', 'guests']
          });
        }

        // Check availability
        const availabilityQuery = `
          SELECT COUNT(*) as conflicts FROM admin_bookings 
          WHERE status != 'cancelled' 
          AND (
            (check_in_date <= $1 AND check_out_date > $1) OR
            (check_in_date < $2 AND check_out_date >= $2) OR
            (check_in_date >= $1 AND check_out_date <= $2)
          )
        `;
        
        const conflicts = await pool.query(availabilityQuery, [checkInDate, checkOutDate]);
        
        if (parseInt(conflicts.rows[0].conflicts) > 0) {
          return res.status(409).json({
            error: 'Date non disponibili',
            message: 'Le date selezionate non sono disponibili'
          });
        }

        // Generate booking ID
        const bookingId = `VIN${Date.now()}${Math.floor(Math.random() * 1000)}`;

        // Insert booking
        const insertQuery = `
          INSERT INTO admin_bookings (
            booking_id, guest_name, guest_email, guest_phone,
            check_in_date, check_out_date, guests, parking,
            total_price, notes, status, created_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'confirmed', NOW())
          RETURNING *
        `;

        const newBooking = await pool.query(insertQuery, [
          bookingId, guestName, guestEmail, guestPhone,
          checkInDate, checkOutDate, guests, parking || false,
          totalPrice, notes || '', 'confirmed'
        ]);

        // Prepare booking details for emails
        const bookingDetails = {
          bookingId,
          guestName,
          guestEmail,
          guestPhone: guestPhone || 'Non fornito',
          checkInDate: new Date(checkInDate).toLocaleDateString('it-IT'),
          checkOutDate: new Date(checkOutDate).toLocaleDateString('it-IT'),
          guests,
          parking: parking || false,
          totalPrice,
          notes: notes || ''
        };

        // Send emails
        try {
          await sendBookingEmails(bookingDetails);
        } catch (emailError) {
          console.error('⚠️ Errore invio email (prenotazione comunque creata):', emailError);
        }

        return res.status(201).json({
          success: true,
          message: 'Prenotazione creata con successo',
          booking: newBooking.rows[0],
          emailSent: true
        });

      case 'list':
        if (req.method !== 'GET') {
          return res.status(405).json({ error: 'Method not allowed' });
        }

        const bookings = await pool.query(`
          SELECT * FROM admin_bookings 
          ORDER BY created_at DESC
        `);

        return res.json({
          success: true,
          bookings: bookings.rows
        });

      case 'availability':
        if (req.method !== 'GET') {
          return res.status(405).json({ error: 'Method not allowed' });
        }

        const { startDate, endDate } = req.query;
        
        if (!startDate || !endDate) {
          return res.status(400).json({
            error: 'Date richieste',
            required: ['startDate', 'endDate']
          });
        }

        const availQuery = `
          SELECT 
            check_in_date, check_out_date, guest_name, status
          FROM admin_bookings 
          WHERE status != 'cancelled'
          AND (
            (check_in_date <= $2 AND check_out_date > $1)
          )
          ORDER BY check_in_date
        `;

        const bookingsInRange = await pool.query(availQuery, [startDate, endDate]);

        return res.json({
          success: true,
          available: bookingsInRange.rows.length === 0,
          conflictingBookings: bookingsInRange.rows
        });

      default:
        return res.status(400).json({ error: 'Azione non valida' });
    }

  } catch (error) {
    console.error('❌ Errore API booking:', error);
    return res.status(500).json({ 
      error: 'Errore del server',
      message: error.message 
    });
  }
};