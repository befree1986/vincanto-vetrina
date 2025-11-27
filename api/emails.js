import nodemailer from 'nodemailer';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

// Create transporter
const createTransporter = () => {
  // Use default export directly
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
};

export default async function handler(req, res) {
  const { action } = req.query;

  try {
    switch (action) {
      case 'send':
        return await sendEmail(req, res);
      case 'send-template':
        return await sendTemplateEmail(req, res);
      case 'test':
        return await testConnection(req, res);
      case 'get-logs':
        return await getEmailLogs(req, res);
      case 'track-open':
        return await trackEmailOpen(req, res);
      case 'track-click':
        return await trackEmailClick(req, res);
      default:
        return res.status(400).json({ error: 'Azione non valida' });
    }
  } catch (error) {
    console.error('❌ Errore API email:', error);
    return res.status(500).json({ error: error.message });
  }
}

async function sendEmail(req, res) {
  const { to, subject, html, text, booking_id } = req.body;

  const transporter = createTransporter();

  // Create email log entry
  const [emailLog] = await sql`
    INSERT INTO email_logs (
      recipient_email, subject, status, booking_id
    ) VALUES (
      ${to}, ${subject}, 'pending', ${booking_id || null}
    ) RETURNING id
  `;

  try {
    const info = await transporter.sendMail({
      from: `"Vincanto Maori" <${process.env.SMTP_USER}>`,
      to,
      subject,
      text,
      html: html || text
    });

    // Update log as sent
    await sql`
      UPDATE email_logs 
      SET status = 'sent', sent_at = NOW()
      WHERE id = ${emailLog.id}
    `;

    return res.status(200).json({
      success: true,
      messageId: info.messageId,
      logId: emailLog.id
    });
  } catch (error) {
    // Update log as failed
    await sql`
      UPDATE email_logs 
      SET status = 'failed', error_message = ${error.message}
      WHERE id = ${emailLog.id}
    `;

    throw error;
  }
}

async function sendTemplateEmail(req, res) {
  const { to, template, variables, booking_id } = req.body;

  const templates = {
    'booking_confirmation': {
      subject: 'Conferma Prenotazione - Vincanto Maori',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">✅ Prenotazione Confermata!</h2>
          <p>Gentile ${variables.customer_name},</p>
          <p>La tua prenotazione presso <strong>Vincanto Maori</strong> è confermata!</p>
          <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>📅 Check-in:</strong> ${variables.check_in}</p>
            <p><strong>📅 Check-out:</strong> ${variables.check_out}</p>
            <p><strong>👥 Ospiti:</strong> ${variables.guests}</p>
            <p><strong>💰 Totale:</strong> €${variables.total_amount}</p>
          </div>
          <p>Ti invieremo le istruzioni di check-in 24 ore prima del tuo arrivo.</p>
          <p>A presto!<br><strong>Il Team Vincanto</strong></p>
        </div>
      `
    },
    'checkin_instructions': {
      subject: 'Istruzioni Check-in - Vincanto Maori',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">🏠 Istruzioni Check-in</h2>
          <p>Ciao ${variables.customer_name}!</p>
          <p>Il tuo check-in è domani! Ecco tutte le informazioni:</p>
          <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>📍 Indirizzo:</strong> Via dei Maori 25, Roma</p>
            <p><strong>🕐 Orario Check-in:</strong> dalle 15:00</p>
            <p><strong>🔑 Codice Portone:</strong> ${variables.door_code || '1234'}</p>
            <p><strong>🚪 Appartamento:</strong> ${variables.apartment_number || '3° piano'}</p>
          </div>
          <p>Per qualsiasi necessità, contattaci al +39 06 1234567</p>
          <p>Buon viaggio!<br><strong>Il Team Vincanto</strong></p>
        </div>
      `
    },
    'payment_receipt': {
      subject: 'Ricevuta Pagamento - Vincanto Maori',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">💳 Ricevuta Pagamento</h2>
          <p>Gentile ${variables.customer_name},</p>
          <p>Il tuo pagamento è stato ricevuto con successo.</p>
          <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>💰 Importo:</strong> €${variables.amount}</p>
            <p><strong>📅 Data:</strong> ${variables.payment_date}</p>
            <p><strong>🆔 ID Transazione:</strong> ${variables.transaction_id}</p>
            <p><strong>📋 Metodo:</strong> ${variables.payment_method}</p>
          </div>
          <p>Conserva questa email come ricevuta del pagamento.</p>
          <p>Grazie!<br><strong>Il Team Vincanto</strong></p>
        </div>
      `
    },
    'review_request': {
      subject: '⭐ Lascia una recensione - Vincanto Maori',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">⭐ Ci è piaciuto ospitarti!</h2>
          <p>Ciao ${variables.customer_name},</p>
          <p>Speriamo che il tuo soggiorno presso Vincanto Maori sia stato fantastico!</p>
          <p>Ci farebbe molto piacere se potessi lasciare una recensione sulla tua esperienza.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${variables.review_url}" style="background: #2563eb; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block;">
              ⭐ Lascia una Recensione
            </a>
          </div>
          <p>Il tuo feedback ci aiuta a migliorare continuamente!</p>
          <p>Grazie,<br><strong>Il Team Vincanto</strong></p>
        </div>
      `
    }
  };

  const selectedTemplate = templates[template];
  if (!selectedTemplate) {
    return res.status(400).json({ error: 'Template non trovato' });
  }

  return sendEmail({
    body: {
      to,
      subject: selectedTemplate.subject,
      html: selectedTemplate.html,
      booking_id
    }
  }, res);
}

async function testConnection(req, res) {
  try {
    const transporter = createTransporter();
    await transporter.verify();
    return res.status(200).json({ success: true, message: 'Connessione SMTP verificata' });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
}

async function getEmailLogs(req, res) {
  const { limit = 50, offset = 0, status } = req.query;

  let query = sql`SELECT * FROM email_logs WHERE 1=1`;

  if (status && status !== 'all') {
    query = sql`${query} AND status = ${status}`;
  }

  const logs = await sql`
    ${query}
    ORDER BY created_at DESC
    LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}
  `;

  return res.status(200).json({ logs });
}

async function trackEmailOpen(req, res) {
  const { log_id } = req.query;

  await sql`
    UPDATE email_logs 
    SET opened = true, opened_at = NOW()
    WHERE id = ${log_id} AND opened = false
  `;

  // Return 1x1 transparent pixel
  const pixel = Buffer.from(
    'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
    'base64'
  );

  res.writeHead(200, {
    'Content-Type': 'image/gif',
    'Content-Length': pixel.length
  });
  res.end(pixel);
}

async function trackEmailClick(req, res) {
  const { log_id, url } = req.query;

  await sql`
    UPDATE email_logs 
    SET clicked = true, clicked_at = NOW()
    WHERE id = ${log_id} AND clicked = false
  `;

  res.redirect(url);
}
