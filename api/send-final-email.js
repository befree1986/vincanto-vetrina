import nodemailer from 'nodemailer';
import { renderEmailTemplate } from '../email/templates/index.js';

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

  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASSWORD || !process.env.SMTP_FROM) {
    return res.status(500).json({ success: false, error: 'SMTP non configurato' });
  }

  try {
    const smtpPort = parseInt(process.env.SMTP_PORT) || 587;
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD }
    });

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

    const mailOptions = {
      from: `"${process.env.SMTP_FROM_NAME || 'Vincanto Maori'}" <${process.env.SMTP_FROM}>`,
      to: guestEmail,
      subject: `Pagamento ricevuto - Prenotazione ${bookingId}`,
      html
    };

    await transporter.sendMail(mailOptions);

    const adminEmail = process.env.ADMIN_EMAIL || process.env.SMTP_FROM;
    if (adminEmail && adminEmail !== guestEmail) {
      await transporter.sendMail({ ...mailOptions, to: adminEmail, subject: `[ADMIN] Pagamento ricevuto - Prenotazione ${bookingId}` });
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('Errore invio email finale:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
}
