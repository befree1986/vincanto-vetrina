import ejs from 'ejs';
import path from 'path';
import { Booking, BookingDocument } from '@models/Booking';
import { CreateBookingRequestInput } from '@schemas/booking.schema';
import { transporter } from '@config/mailer';

// Dettagli per il pagamento tramite bonifico letti dall'ambiente
const bankDetails = {
  beneficiary: process.env.BANK_BENEFICIARY,
  iban: process.env.BANK_IBAN,
};

/**
 * Invia le email di richiesta prenotazione sia al cliente che all'admin.
 * Utilizza i template EJS per generare il corpo delle email.
 * @param booking Documento Mongoose della prenotazione salvata
 * @param requestBody Il corpo della richiesta originale, che contiene dati aggiuntivi per i template
 */
export const sendBookingRequestEmails = async (
  booking: BookingDocument,
  requestBody: CreateBookingRequestInput
) => {
  try {
    // --- 1. Prepara e invia email al CLIENTE ---
    const customerTemplateData = {
      booking: booking.toObject(), // ✅ ora è correttamente tipizzato
      costs: requestBody.costs,
      paymentMethod: requestBody.paymentMethod,
      bankDetails: requestBody.paymentMethod === 'bonifico' ? bankDetails : null,
    };

    const customerEmailHtml = await ejs.renderFile(
      path.join(__dirname, '..', 'views', 'booking-confirmation.ejs'),
      customerTemplateData
    );

    await transporter.sendMail({
      from: `"Vincanto" <${process.env.EMAIL_USER}>`,
      to: booking.guest_email,
      subject: 'Conferma Richiesta di Prenotazione per Vincanto',
      html: customerEmailHtml,
    });
    console.log(`✅ Email di conferma inviata a: ${booking.guest_email}`);

    // --- 2. Prepara e invia email all'ADMIN ---
    const adminEmailHtml = await ejs.renderFile(
      path.join(__dirname, '..', 'views', 'admin-notification.ejs'),
      { ...requestBody, bookingId: booking._id.toString() }
    );

    await transporter.sendMail({
      from: `"Notifica Vincanto" <${process.env.EMAIL_USER}>`,
      to: process.env.ADMIN_EMAIL,
      subject: `Nuova Richiesta di Prenotazione da ${booking.guest_name} ${booking.guest_surname}`,
      html: adminEmailHtml,
    });
    console.log(`✅ Email di notifica inviata all'admin: ${process.env.ADMIN_EMAIL}`);
  } catch (error) {
    console.error('❌ Errore durante l\'invio delle email di prenotazione:', error);
  }
};