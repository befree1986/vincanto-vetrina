// Script: invia due email di test (conferma e conferma finale) all'ADMIN_EMAIL
import { renderEmailTemplate } from '../email/templates/index.js';
import { sendEmailWithAdminCopy } from '../email/emailSender.js';

const baseUrl = process.env.BASE_URL || 'https://www.vincantomaori.it';
const to = process.env.TEST_EMAIL || process.env.ADMIN_EMAIL || process.env.SMTP_FROM;

if (!process.env.SMTP_HOST) {
  console.warn('⚠️ SMTP non configurato: setta SMTP_HOST/SMTP_USER/SMTP_PASSWORD prima di inviare');
}

if (!to) {
  console.error('❌ Nessun destinatario: specifica TEST_EMAIL o ADMIN_EMAIL o SMTP_FROM nelle env');
  process.exit(1);
}

const sampleExtras = [
  { id: 1, name: 'Colazione Italiana', price: 15, included: true },
  { id: 2, name: 'Late Check-out', price: 30, included: false }
];

const paymentMethods = ['stripe', 'paypal', 'bank_transfer'];

async function main() {
  console.log(`📧 Invio 3 email di test (una per metodo) a ${to}\n`);
  
  for (const method of paymentMethods) {
    const bookingId = 'VINTEST' + Date.now() + '-' + method.toUpperCase();
    
    const dataCommon = {
      firstName: 'Mario',
      lastName: 'Rossi',
      bookingId,
      checkin: new Date().toISOString().split('T')[0],
      checkout: new Date(Date.now() + 2*86400000).toISOString().split('T')[0],
      fromEmail: process.env.SMTP_FROM,
      language: process.env.TEST_LANG || 'it',
      extraServices: sampleExtras,
      paymentMethod: method
    };

    // Conferma prenotazione
    const html1 = renderEmailTemplate('booking_confirmation', {
      ...dataCommon,
      guests: 2,
      adults: 2,
      children: 0,
      totalAmount: 240,
      depositAmount: 72
    });

    console.log(`📧 [${method.toUpperCase()}] Inviando conferma prenotazione...`);
    await sendEmailWithAdminCopy({
      to,
      subject: `TEST ${method.toUpperCase()} - Conferma Prenotazione`,
      html: html1,
      templateName: 'booking_confirmation',
      metadata: { bookingId, totalAmount: 240, paymentMethod: method, language: dataCommon.language, extraServices: sampleExtras }
    });

    // Conferma finale pagamento
    const html2 = renderEmailTemplate('booking_final_confirmation', {
      ...dataCommon,
      totalAmount: 240,
      amountPaid: 72
    });

    console.log(`📧 [${method.toUpperCase()}] Inviando conferma pagamento...`);
    await sendEmailWithAdminCopy({
      to,
      subject: `TEST ${method.toUpperCase()} - Pagamento Ricevuto`,
      html: html2,
      templateName: 'booking_final_confirmation',
      metadata: { bookingId, totalAmount: 240, amountPaid: 72, paymentMethod: method, language: dataCommon.language, extraServices: sampleExtras }
    });

    console.log(`✅ [${method.toUpperCase()}] Inviate\n`);
    
    // Pausa tra metodi per evitare rate limiting
    if (method !== paymentMethods[paymentMethods.length - 1]) {
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  console.log('✅ Tutte le email di test inviate con successo!');
}

main().catch(err => { console.error('❌ Errore invio test:', err); process.exit(1); });
