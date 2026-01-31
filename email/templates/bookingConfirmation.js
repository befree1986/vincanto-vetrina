// Email template: booking confirmation with i18n support
import { getEmailStrings, formatDateByLanguage } from '../i18n.js';

export function bookingConfirmationTemplate(data) {
  const {
    firstName,
    lastName,
    bookingId,
    checkin,
    checkout,
    guests,
    adults,
    children,
    totalAmount,
    depositAmount,
    fromEmail,
    language = 'it',
    extraServices: extraServicesRaw,
    extra_services: extraServicesAlt,
    paymentMethod,
    isAdminCopy
  } = data;

  const t = getEmailStrings('booking_confirmation', language);
  const formatDate = (d) => formatDateByLanguage(d, language);
  

  //Logia: se l'acconto è >= al totale (meno 1 cent per arrotandamenti), è un pagamento completo
  const isFullPayment = Number(depositAmount) >= (Number(totalAmount) - 0.01);
  const saldo = isFullPayment ? 0 : (Number(totalAmount) - Number(depositAmount));

  const extraServices = Array.isArray(extraServicesRaw) ? extraServicesRaw
                      : Array.isArray(extraServicesAlt) ? extraServicesAlt
                      : [];
  const paidServices = extraServices.filter(s => !s.included && Number(s.price) > 0);
  const includedServices = extraServices.filter(s => s.included);
  const extrasTotal = paidServices.reduce((sum, s) => sum + Number(s.price || 0), 0);

  const pm = String(paymentMethod || '').toLowerCase();
  const isBankTransfer = pm.includes('bank');
  const baseUrl = 'https://www.vincantomaori.it';
  const methodIcon = pm.includes('paypal')
    ? baseUrl + '/icons/paypal_icon.webp'
    : isBankTransfer
      ? baseUrl + '/icons/bank_icon.webp'
      : baseUrl + '/icons/stripe_icon.webp';
  const methodLabel = pm.includes('paypal') ? t.method_paypal : isBankTransfer ? t.method_bank_transfer : t.method_card;

  const bankDetails = {
    iban: 'IT04D3608105038288844288937',
    bic: 'PPAYITR1XXX',
    account_holder: 'Guida Antonio',
    bank_name: 'PostePay S.p.A.'
  };

  return `
    <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 680px; margin: 0 auto; background: #ffffff; color:#A1A1A1;">
      <div style="width:100%; height:260px; background:url('https://vincanto-vetrina.vercel.app/1.avif') center/cover no-repeat;">
        <div style="background:linear-gradient(135deg, rgba(10,18,60,0.85), rgba(10,18,60,0.35)); width:100%; height:100%; display:felx; felx-direction:column; align-items:center; justify-content:center; text-align:center; padding:0 20px;">
        
        <img src="https://vincantomaiori.it/logo.svg" alt="Vincanto Maiori" width="70" style="margin-bottom:10px; filter:drop-shadow(0 2px 4px rgba(0,0,0,0.5));">

        <div style="color:#FDFBF7; font-size:24px; letter-spacing:2px; text-transform:uppercase; margin-bottom:6px;">
         Vincanto Maiori
         </div>
         <div style="color:#FDFB7; font-size:16px; opacity:0.9;">
          ${t.title}
          </div>
        </div>
      </div>

      <!-- INTRO -->
      <div style="padding:22px 20px 10px;">
        <p style=font-size:16px; line-height:1.6; margin:0 0 10px 0;">
          ${t.greeting} <strong>${escapeHtml(firstName)} ${escapeHtml(lastName)}</strong>,
        </p>
        <p style="font-size:15px; line-height:1.6; margin:0 0 10px 0;">
          ${t.intro}
        </p>
      </div>

      <!--CARD RIEPLOGO PRENOTAZIONE-->
      <div style="
        background:#FFFFFF;
        border-radius:14px;
        padding:20px 20px 18px;
        margin:18px 20px;
        box-shadow:0 6px 18px rgba(0,0,0,0.08);
        border-top:4px solid #C5A572;
      ">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px">
          <h2 style="margin:0; color:#01A237E; font-size:18px; text-transform:uppercase; letter-spacing:1px;">
            ${t.booking_code}: ${bookingId}
          </h2>
          <span style="font-size:12px; color:#777; text-transform:uppercase; letter-spacing:1px;">
            ${formatDate(checkin)} • ${formatDate(checkout)}
          </span>
        </div>

        <div style="border-top:1px solid #E5E5E5; padding-top:10px; margin-top:8px;">
          <p style="margin:4px 0;"><strong>${t.checkin}:</strong> ${formatDate(checkin)}</p>
          <p style="margin:4px 0;"><strong>${t.checkout}:</strong> ${formatDate(checkout)}</p>
          <p style="margin:4px 0;"><strong>${t.guests}:</strong> 
          ${guests} (${adults} ${t.adults.toLowerCase()}${children > 0 ? `, ${children} ${t.children.toLowerCase()}` : ''})
          </p>
        
          <!--METODO DI PAGAMENTO-->
          <p style="margin:8px 0 4px 0;">
            <strong>${t.payment_method}:</strong>
            <img src="${methodIcon}" alt="${methodLabel}" width="22" style="vertical-align:middle; margin0 6px 0 6px;">
            ${methodLabel}
          </p>

          <p style="margin:8px 0 4px 0;"><strong>${t.total_amount}:</strong> €${Number(totalAmount).toFixed(2)}</p>

          ${!isFullPayment ? `
            <p style="margin:4px 0;"><strong>${t.deposit_amount}:</strong> €${Number(depositAmount).toFixed(2)}</p>
            <p style="margin:4px 0;"><strong>${t.remaining_balance}:</strong> €${saldo.toFixed(2)}</p>
          ` : `
            <p style="margin:4px 0;"><strong>${t.amount_paid}:</strong> €${Number(totalAmount).toFixed(2)}</p>
         `}
      </div>
    </div>

     ${isBankTransfer ? `
    <div style="
      background:#F7F7F9;
      border-radius:14px;
      padding:20px;
      margin:18px 20px;
      border-left:5px solid #1A237E;
    ">
      <h3 style="margin:0 0 10px 0; color:#1A237E; font-size:17px;">
        ${t.bank_transfer_details}
      </h3>
      <p style="margin:4px 0;"><strong>${t.bank_beneficiary}:</strong> ${bankDetails.account_holder}</p>
      <p style="margin:4px 0;"><strong>${t.bank_iban}:</strong> ${bankDetails.iban}</p>
      <p style="margin:4px 0;"><strong>${t.bank_bic}:</strong> ${bankDetails.bic}</p>
      <p style="margin:4px 0;"><strong>${t.bank_bank}:</strong> ${bankDetails.bank_name}</p>
      <p style="margin:4px 0;"><strong>${t.bank_reason}:</strong> ${t.bank_reason_val} ${bookingId} - ${firstName} ${lastName}</p>
    </div>
    ` : ''}

    ${extraServices.length > 0 ? `
    <div style="
      background:#FFFFFF;
      border-radius:14px;
      padding:20px;
      margin:18px 20px;
      box-shadow:0 4px 14px rgba(0,0,0,0.06);
    ">
      <h3 style="margin:0 0 10px 0; color:#1A237E; font-size:17px;">
        ${t.extra_services}
      </h3>

      ${includedServices.length > 0 ? `
        <div style="font-weight:bold; margin:8px 0 4px 0;">${t.included_services}</div>
        <ul style="margin:4px 0 10px 18px; padding:0;">
          ${includedServices.map(s => `
            <li style="margin:2px 0;">
              ${escapeHtml(s.name || '')}
            </li>
          `).join('')}
        </ul>
      ` : ''}

      ${paidServices.length > 0 ? `
        <div style="font-weight:bold; margin:8px 0 4px 0;">${t.extra_services}</div>
        <ul style="margin:4px 0 10px 18px; padding:0;">
          ${paidServices.map(s => `
            <li style="margin:2px 0;">
              ${escapeHtml(s.name || '')}: €${Number(s.price || 0).toFixed(2)}
            </li>
          `).join('')}
        </ul>
        <div style="text-align:right; font-weight:bold; color:#1A1A1A;">
          ${t.extras_total}: €${extrasTotal.toFixed(2)}
        </div>
      ` : `
        <div style="color:#555; margin-top:6px;">${t.no_extras}</div>
      `}
    </div>
    ` : ''}

    <div style="
      background:#FFFFFF;
      border-radius:14px;
      padding:20px;
      margin:18px 20px;
      box-shadow:0 4px 14px rgba(0,0,0,0.04);
      border-left:4px solid #C5A572;
    ">
      <h3 style="margin:0 0 10px 0; color:#1A237E; font-size:17px;">
        📍 ${t.important_info}
      </h3>
      <p style="margin:4px 0;">
        Vincanto Maori, Maiori (SA), Costiera Amalfitana
      </p>
      <p style="margin:4px 0;">
        <a href="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3026.138502828421!2d14.64101131568713!3d40.65196497933509!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x133bbf759bd276b7%3A0x49b8fbf1f67d6fb7!2sVia%20Torre%20di%20Milo%2C%207%2C%2084010%20Maiori%20SA%2C%20Italia!5e0!3m2!1sit!2sit!4v1716300000000!5m2!1sit!2sit" style="color:#1A237E; text-decoration:underline;">
          Apri in Google Maps
        </a>
      </p>
    </div>


    <div style="
      background:#F7F7F9;
      border-radius:14px;
      padding:20px;
      margin:18px 20px;
      border-left:4px solid #1A237E;
    ">
      <h3 style="margin:0 0 10px 0; color:#1A237E; font-size:17px;">
        📞 ${t.contact_us}
      </h3>
      <p style="margin:4px 0;">
        Email: <a href="mailto:${fromEmail}" style="color:#1A237E;">${fromEmail}</a>
      </p>
      <p style="margin:4px 0;">
        Telefono: +39 333 148 1677
      </p>
      <p style="margin:4px 0;">
        WhatsApp: +39 333 148 1677
      </p>
    </div>

    <div style="
      background:#EDE7D9;
      border-left:6px solid #C5A572;
      padding:20px;
      margin:18px 20px 10px;
      border-radius:14px;
    ">
      <h3 style="margin:0 0 10px 0; color:#5A4A3A; font-size:17px;">
        ${t.important_info}
      </h3>
      <ul style="margin:8px 0 0 18px; padding:0;">
        <li style="margin:3px 0;">${t.checkin_time}</li>
        <li style="margin:3px 0;">${t.checkout_time}</li>
        <li style="margin:3px 0;">${t.bring_id}</li>
      </ul>
    </div>

    <!-- FOOTER -->
    <hr style="margin:26px 20px 10px; border:none; border-top:1px solid #E0E0E0;">

    <p style="font-size:12px; color:#777; text-align:center; margin:0 20px 16px;">
      ${t.footer}<br>
      ${t.website}
    </p>

  </div>
`;

}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
