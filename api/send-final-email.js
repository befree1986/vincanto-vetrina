import { renderEmailTemplate } from '../email/templates/index.js';
import { sendEmailWithAdminCopy } from '../email/emailSender.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }
  const {
    firstName,
    lastName,
    bookingId,
    checkin,
    checkout,
    totalAmount,
    amountPaid,
    guestEmail
  } = req.body || {};

  if (!guestEmail || !bookingId) {
    return res.status(400).json({ success: false, error: 'Parametri mancanti (guestEmail, bookingId)' });
  }

  if (!process.env.SMTP_HOST) {
    return res.status(500).json({ success: false, error: 'SMTP non configurato' });
  }

  try {
    const html = renderEmailTemplate('booking_final_confirmation', {
      firstName,
      lastName,
      bookingId,
      checkin,
      checkout,
      totalAmount,
      amountPaid,
      fromEmail: process.env.SMTP_FROM
    });

    const results = await sendEmailWithAdminCopy({
      to: guestEmail,
      subject: `Pagamento ricevuto - Prenotazione ${bookingId}`,
      html,
      templateName: 'booking_final_confirmation',
      metadata: { bookingId, totalAmount, amountPaid }
    });

    const primarySuccess = results.find(r => r.recipient === guestEmail)?.success;
    if (!primarySuccess) {
      return res.status(500).json({ success: false, error: 'Email send failed after retries' });
    }

    return res.status(200).json({ success: true, emailResults: results });
  } catch (err) {
    console.error('Errore invio email finale:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
}
