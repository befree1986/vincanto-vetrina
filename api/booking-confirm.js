// api/booking-confirm.js
// Endpoint per confermare e salvare una prenotazione dopo pagamento (Stripe, PayPal, Bonifico)
import { Pool } from 'pg';
import { sendEmailWithAdminCopy } from '../email/emailSender.js';
import { renderEmailTemplate } from '../email/templates/index.js';
import { detectLanguage } from '../email/i18n.js';
import { parse } from 'path';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

/**
 * POST /api/booking/confirm
 * Body: {
 *   payment_method: 'stripe' | 'paypal' | 'bank_transfer',
 *   payment_status: 'success' | 'pending' | 'failed',
 *   payment_id: string | null,
 *   amount: number,
 *   total_amount: number,
 *   booking_data: { ... }
 * }
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    console.log('📝 Ricevuto booking/confirm:', JSON.stringify(req.body, null, 2));
    const { payment_method, payment_status, payment_id, amount, total_amount, booking_data } = req.body;
    
    // Validazione dati
    if (!payment_method || !payment_status || !booking_data || typeof booking_data !== 'object') {
      console.error('❌ Validazione fallita:', { payment_method, payment_status, booking_data });
      return res.status(400).json({ 
        success: false, 
        error: 'Dati mancanti o non validi', 
        received: req.body 
      });
    }

    // Estrai dati prenotazione con mapping multipli formati
    const checkin = booking_data.check_in_date || booking_data.checkin || booking_data.check_in;
    const checkout = booking_data.check_out_date || booking_data.checkout || booking_data.check_out;
    const guests = booking_data.guests || (booking_data.adults || 0) + (booking_data.children || 0) || 1;
    const adults = booking_data.adults || booking_data.guests || 1;
    const children = booking_data.children || 0;
    const email = booking_data.guest_email || booking_data.email;
    const phone = booking_data.guest_phone || booking_data.phone || '';
    const totalAmount = Number(total_amount || amount) || 0;
    const notes = booking_data.special_requests || booking_data.notes || '';

    // Parsing nome/cognome
    let firstName = 'Nome';
    let lastName = 'Cognome';
    
    if (booking_data.guest_name) {
      const nameParts = booking_data.guest_name.trim().split(' ');
      firstName = nameParts[0] || 'Nome';
      lastName = nameParts.slice(1).join(' ') || 'Cognome';
    } else if (booking_data.guest_surname) {
      firstName = booking_data.guest_name || booking_data.first_name || 'Nome';
      lastName = booking_data.guest_surname || booking_data.last_name || 'Cognome';
    } else if (booking_data.first_name || booking_data.last_name) {
      firstName = booking_data.first_name || 'Nome';
      lastName = booking_data.last_name || 'Cognome';
    }

    // Validazione campi obbligatori
    if (!checkin || !checkout) {
      console.error('❌ Date mancanti:', { checkin, checkout });
      return res.status(400).json({ success: false, error: 'Date check-in/out obbligatorie' });
    }
    if (!email) {
      console.error('❌ Email mancante');
      return res.status(400).json({ success: false, error: 'Email obbligatoria' });
    }
    if (!totalAmount || totalAmount <= 0) {
      console.error('❌ Importo non valido:', totalAmount);
      return res.status(400).json({ success: false, error: 'Importo totale non valido' });
    }

    // Determina stato prenotazione
    let bookingStatus = 'pending';
    let paymentStatusDb = 'pending';
    
    if (payment_status === 'success') {
      bookingStatus = 'confirmed';
      paymentStatusDb = booking_data.payment_type === 'deposit' ? 'deposit_paid' : 'paid_full';
    } else if (payment_status === 'pending') {
      bookingStatus = 'pending';
      paymentStatusDb = 'pending';
    }

    //Calcola il valore da salvare come "acconto": se è saldo completp, è uguale al totale.
    const isFullPayment = paymentStatusDb === 'paid_full';
    const depositValue = isFullPayment ? totalAmount : Math.round(totalAmount * 0.3 * 100) / 100;

    console.log('✅ Dati validati:', { 
      checkin, checkout, guests, adults, children, 
      firstName, lastName, email, phone, totalAmount,
      bookingStatus, paymentStatusDb
    });

    // Salva prenotazione nel database
    const bookingId = `VIN${Date.now()}`;
    const result = await pool.query(`
      INSERT INTO bookings (
        booking_id, check_in, check_out, guests, adults, children,
        first_name, last_name, email, phone, total_amount, 
        deposit_amount, notes, status, payment_status, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, NOW(), NOW())
      RETURNING *
    `, [
      bookingId,
      checkin,
      checkout,
      guests,
      adults,
      children,
      firstName,
      lastName,
      email,
      phone,
      totalAmount,
      depositValue,
      notes,
      bookingStatus,
      paymentStatusDb
    ]);

    const savedBooking = result.rows[0];
    console.log('✅ Prenotazione salvata:', savedBooking);

    // Inserisci date bloccate nel calendario
    try {
      await pool.query(`
        INSERT INTO blocked_dates (start_date, end_date, reason, description)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT DO NOTHING
      `, [
        checkin,
        checkout,
        'booking',
        `Prenotazione ${bookingId} - ${firstName} ${lastName}`
      ]);
      console.log('✅ Date bloccate nel calendario');
    } catch (blockError) {
      console.warn('⚠️ Errore blocco date (non-critico):', blockError.message);
    }

    // Invia email di conferma (se pagamento successo o bonifico in attesa)
    // Per il bonifico, l'email con i dettagli per pagare viene inviata subito.
    const isBankTransfer = payment_method.toLowerCase().includes('bank');
    if ((payment_status === 'success' || isBankTransfer) && process.env.SMTP_HOST) {
      try {
        const guestLanguage = detectLanguage(email, booking_data.language);
        const emailHtml = renderEmailTemplate('booking_confirmation', {
          firstName,
          lastName,
          bookingId,
          checkin,
          checkout,
          guests,
          adults,
          children,
          totalAmount,
          depositAmount: depositValue, // passa il valore corretto al template
          fromEmail: process.env.SMTP_FROM,
          language: guestLanguage,
          paymentMethod: payment_method,
          // 🛎️ Servizi extra opzionali dal payload del frontend
          extraServices: Array.isArray(booking_data.extra_services) ? booking_data.extra_services : []
        });

        await sendEmailWithAdminCopy({
          to: email,
          subject: `Conferma Prenotazione ${bookingId}`,
          html: emailHtml,
          templateName: 'booking_confirmation',
          metadata: { 
            bookingId, 
            totalAmount, 
            paymentMethod: payment_method, 
            language: guestLanguage,
            extraServices: Array.isArray(booking_data.extra_services) ? booking_data.extra_services : []
          }
        });

        console.log('✅ Email conferma inviata');
      } catch (emailError) {
        console.error('⚠️ Errore invio email (non-bloccante):', emailError.message);
      }
    }

    return res.status(200).json({
      success: true,
      bookingId: savedBooking.booking_id,
      id: savedBooking.id,
      message: 'Prenotazione salvata con successo',
      booking: {
        id: savedBooking.id,
        bookingId: savedBooking.booking_id,
        status: savedBooking.status,
        paymentStatus: savedBooking.payment_status,
        totalAmount: parseFloat(savedBooking.total_amount),
        depositAmount: parseFloat(savedBooking.deposit_amount),
        amountToPay: isFullPayment
          ? parseFloat(savedBooking.total_amount)
          : parseFloat(savedBooking.deposit_amount)
      }
    });

  } catch (err) {
    console.error('❌ Errore booking/confirm:', err);
    return res.status(500).json({ 
      success: false, 
      error: 'Errore salvataggio prenotazione',
      details: err.message 
    });
  }
}
