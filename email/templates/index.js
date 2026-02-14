import { getEmailStrings, formatDateByLanguage } from '../i18n.js';

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(amount);
};

const getPaymentMethodLabel = (method, t) => {
  const methods = {
    'stripe': t.method_card,
    'paypal': t.method_paypal,
    'bank_transfer': t.method_bank_transfer,
    'cash': 'Contanti'
  };
  return methods[method] || method || 'N/A';
};

// Layout base per tutte le email (Header + Content + Footer)
const baseLayout = (content, logoUrl, siteUrl) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f9f9f9; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 20px auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
    .header { background-color: #1e3a8a; padding: 20px; text-align: center; }
    .header img { max-height: 80px; width: auto; }
    .content { padding: 30px; }
    .footer { background-color: #f1f1f1; padding: 20px; text-align: center; font-size: 12px; color: #666; }
    .button { display: inline-block; padding: 12px 24px; background-color: #d2691e; color: #ffffff; text-decoration: none; border-radius: 4px; font-weight: bold; margin-top: 20px; }
    .info-box { background-color: #f8f9fa; border-left: 4px solid #d2691e; padding: 15px; margin: 20px 0; }
    .price-table { width: 100%; border-collapse: collapse; margin-top: 20px; }
    .price-table td { padding: 8px 0; border-bottom: 1px solid #eee; }
    .price-table .total { font-weight: bold; font-size: 1.2em; border-top: 2px solid #333; border-bottom: none; }
    h1 { color: #1e3a8a; margin-top: 0; }
    h2 { color: #d2691e; font-size: 18px; margin-top: 25px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <a href="${siteUrl}">
        <img src="${logoUrl}" alt="Vincanto Maori Logo" style="display: block; margin: 0 auto; border: 0;">
      </a>
    </div>
    <div class="content">
      ${content}
    </div>
    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} Vincanto Maori. Tutti i diritti riservati.</p>
      <p>Via Torre di Milo, 7, 84010 Maiori (SA), Italia</p>
      <p><a href="${siteUrl}" style="color: #1e3a8a; text-decoration: none;">www.vincantomaiori.it</a></p>
      <p style="font-size: 11px; margin-top: 10px; color: #888;">
        <a href="${siteUrl}/privacy-policy" style="color: #666; text-decoration: underline;">Privacy Policy</a> &bull; 
        <a href="${siteUrl}/cookie-policy" style="color: #666; text-decoration: underline;">Cookie Policy</a>
      </p>
    </div>
  </div>
</body>
</html>
`;

const templates = {
  // Template 1: Conferma Prenotazione (Acconto)
  booking_confirmation: (data) => {
    const t = getEmailStrings('booking_confirmation', data.language);
    const formatDate = (d) => formatDateByLanguage(d, data.language);
    const { firstName, lastName, bookingId, checkin, checkout, guests, totalAmount, depositAmount, paymentMethod, extraServices, accommodationCost, cleaningFee, parkingCost, touristTax, extraServicesCost, notes, fromEmail } = data;
    
    // Fallback email se non presente nei dati
    const contactEmail = fromEmail || 'info@vincantomaiori.it';
    const mailtoSubject = encodeURIComponent(`Assistenza Prenotazione ${bookingId}`);

    const content = `
      <h1>${t.title}</h1>
      <p>${t.greeting} <strong>${firstName} ${lastName}</strong>,</p>
      <p>${t.intro}</p>
      
      <div class="info-box">
        <p><strong>${t.booking_code}:</strong> ${bookingId}</p>
        <p><strong>${t.check_in}:</strong> ${formatDate(checkin)}</p>
        <p><strong>${t.check_out}:</strong> ${formatDate(checkout)}</p>
        <p><strong>${t.guests}:</strong> ${guests}</p>
      </div>

      ${notes ? `<div style="background-color: #fff3cd; padding: 15px; margin: 20px 0; border-radius: 4px; border-left: 4px solid #ffc107;">
        <strong>Messaggio dell'ospite:</strong><br>
        <i>${notes}</i>
      </div>` : ''}

      <h2>${t.cost_breakdown}</h2>
      <table class="price-table">
        <tr>
          <td>${t.accommodation_base}</td>
          <td style="text-align: right;">${formatCurrency(accommodationCost)}</td>
        </tr>
        <tr>
          <td>${t.cleaning_fee}</td>
          <td style="text-align: right;">${formatCurrency(cleaningFee)}</td>
        </tr>
        ${parkingCost > 0 ? `<tr><td>${t.private_parking}</td><td style="text-align: right;">${formatCurrency(parkingCost)}</td></tr>` : ''}
        <tr>
          <td>${t.tourist_tax}</td>
          <td style="text-align: right;">${formatCurrency(touristTax)}</td>
        </tr>
        ${extraServicesCost > 0 ? `<tr><td>Servizi Extra</td><td style="text-align: right;">${formatCurrency(extraServicesCost)}</td></tr>` : ''}
        ${extraServices && extraServices.length > 0 ? `<tr><td colspan="2" style="font-size: 0.85em; color: #666; padding-top: 0;"><em>${extraServices.map(s => s.name || s).join(', ')}</em></td></tr>` : ''}
        <tr class="total">
          <td>Totale</td>
          <td style="text-align: right;">${formatCurrency(totalAmount)}</td>
        </tr>
        <tr>
          <td>${t.deposit_amount}</td>
          <td style="text-align: right;">${formatCurrency(depositAmount)}</td>
        </tr>
        <tr>
          <td><strong>${t.remaining_balance}</strong></td>
          <td style="text-align: right;"><strong>${formatCurrency(totalAmount - depositAmount)}</strong></td>
        </tr>
      </table>

      <p style="margin-top: 20px;">
        <strong>${t.payment_method}:</strong> ${getPaymentMethodLabel(paymentMethod, t)}
      </p>

      <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
        <p style="font-size: 14px; color: #555;">${t.final_greeting}<br>${t.contact_info}</p>
        <a href="mailto:${contactEmail}?subject=${mailtoSubject}" class="button">Contattaci via Email</a>
      </div>
    `;
    return baseLayout(content, data.logoUrl, data.siteUrl);
  },

  // Template 2: Conferma Pagamento Finale (Saldo o Conferma definitiva)
  booking_final_confirmation: (data) => {
    const t = getEmailStrings('booking_final', data.language);
    const formatDate = (d) => formatDateByLanguage(d, data.language);
    const { firstName, lastName, bookingId, checkin, checkout, totalAmount, amountPaid, paymentMethod, notes } = data;
    
    const content = `
      <h1>${t.title}</h1>
      <p>${t.greeting} <strong>${firstName} ${lastName}</strong>,</p>
      <p>${t.intro} <strong>${t.confirmed}</strong>.</p>
      
      <div class="info-box">
        <p><strong>${t.check_in}:</strong> ${formatDate(checkin)}</p>
        <p><strong>${t.check_out}:</strong> ${formatDate(checkout)}</p>
      </div>

      ${notes ? `<div style="background-color: #fff3cd; padding: 15px; margin: 20px 0; border-radius: 4px; border-left: 4px solid #ffc107;">
        <strong>Note:</strong><br>
        <i>${notes}</i>
      </div>` : ''}

      <h2>Dettagli Pagamento</h2>
      <table class="price-table">
        <tr>
          <td>${t.total_amount}</td>
          <td style="text-align: right;">${formatCurrency(totalAmount)}</td>
        </tr>
        <tr>
          <td><strong>${t.amount_paid}</strong></td>
          <td style="text-align: right;"><strong>${formatCurrency(amountPaid)}</strong></td>
        </tr>
      </table>

      <p style="margin-top: 20px;">
        <strong>${t.payment_method}:</strong> ${getPaymentMethodLabel(paymentMethod, t)}
      </p>

      <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
        <p style="font-size: 14px; color: #555;">${t.final_greeting}<br>${t.contact_info}</p>
        <a href="https://www.vincantomaiori.it" class="button">Vai al Sito</a>
      </div>
    `;
    return baseLayout(content, data.logoUrl, data.siteUrl);
  },

  // Template 3: Notifica Richiesta Contatto (Admin)
  contact_notification: (data) => {
    const { name, email, phone, message, guests, checkin, checkout } = data;
    const content = `
      <h1>Nuova Richiesta dal Sito</h1>
      <div class="info-box">
        <p><strong>Nome:</strong> ${name}</p>
        <p><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
        <p><strong>Telefono:</strong> ${phone || 'N/A'}</p>
        ${guests ? `<p><strong>Ospiti:</strong> ${guests}</p>` : ''}
        ${checkin ? `<p><strong>Periodo:</strong> ${checkin} ${checkout ? '- ' + checkout : ''}</p>` : ''}
      </div>
      
      <h2>Messaggio</h2>
      <p style="background: #fff; padding: 15px; border: 1px solid #eee; border-radius: 4px; white-space: pre-wrap;">${message || 'Nessun messaggio'}</p>
      
      <p style="font-size: 12px; color: #888; margin-top: 20px; border-top: 1px solid #eee; padding-top: 10px;">Consenso Privacy: ✅ Accettato (Loggato nel sistema)</p>
    `;
    return baseLayout(content, data.logoUrl, data.siteUrl);
  }
};

export const renderEmailTemplate = (templateName, data) => {
  const template = templates[templateName];
  if (!template) {
    throw new Error(`Template '${templateName}' non trovato`);
  }
  return template(data);
};