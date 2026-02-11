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
    isAdminCopy,

    // 🔥 NUOVI CAMPI DAL BACKEND
    accommodationCost,
    cleaningFee,
    parkingCost,
    touristTax,
    extraServicesCost,
    nights
  } = data;

  const t = getEmailStrings('booking_confirmation', language);
  const formatDate = (d) => formatDateByLanguage(d, language);

  // Logica pagamento completo vs acconto
  const isFullPayment = Number(depositAmount) >= (Number(totalAmount) - 0.01);
  const saldo = isFullPayment ? 0 : (Number(totalAmount) - Number(depositAmount));

  // Extra services
  const extraServices = Array.isArray(extraServicesRaw)
    ? extraServicesRaw
    : Array.isArray(extraServicesAlt)
    ? extraServicesAlt
    : [];

  const paidServices = extraServices.filter(s => !s.included && Number(s.price) > 0);
  const includedServices = extraServices.filter(s => s.included);
  const extrasTotal = paidServices.reduce((sum, s) => sum + Number(s.price || 0), 0);

  // Metodo pagamento
  const pm = String(paymentMethod || '').toLowerCase();
  const isBankTransfer = pm.includes('bank');
  const baseUrl = 'https://www.vincantomaori.it';

  const methodIcon = pm.includes('paypal')
    ? baseUrl + '/icons/paypal_icon.webp'
    : isBankTransfer
      ? baseUrl + '/icons/bank_icon.webp'
      : baseUrl + '/icons/stripe_icon.webp';

  const methodLabel = pm.includes('paypal')
    ? t.method_paypal
    : isBankTransfer
      ? t.method_bank_transfer
      : t.method_card;

  const bankDetails = {
    iban: 'IT04D3608105038288844288937',
    bic: 'PPAYITR1XXX',
    account_holder: 'Guida Antonio',
    bank_name: 'PostePay S.p.A.'
  };

  return `
    <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 680px; margin: 0 auto; background: #ffffff; color:#444;">

      <!-- HEADER -->
      <div style="width:100%; height:260px; background:url('https://vincanto-vetrina.vercel.app/limoneto.webp') center/cover no-repeat;">
        <div style="background:linear-gradient(135deg, rgba(10,18,60,0.85), rgba(10,18,60,0.35)); width:100%; height:100%; display:flex; flex-direction:column; align-items:center; justify-content:center; text-align:center; padding:0 20px;">
        
          <img src="https://vincanto-vetrina.vercel.app/logo.svg" alt="Vincanto Maiori" width="70" style="margin-bottom:10px; filter:drop-shadow(0 2px 4px rgba(0,0,0,0.5));">

          <div style="color:#FDFBF7; font-size:24px; letter-spacing:2px; text-transform:uppercase; margin-bottom:6px;">
            Vincanto Maiori
          </div>

          <div style="color:#FDFBF7; font-size:16px; opacity:0.9;">
            ${t.title}
          </div>

        </div>
      </div>
20%
      <!-- INTRO -->
      <div style="padding:22px 20px 10px;">
        <p style="font-size:16px; line-height:1.6; margin:0 0 10px 0;">
          ${t.greeting} <strong>${escapeHtml(firstName)} ${escapeHtml(lastName)}</strong>,
        </p>
        <p style="font-size:15px; line-height:1.6; margin:0 0 10px 0;">
          ${t.intro}
        </p>
      </div>

      <!-- CARD RIEPILOGO PRENOTAZIONE -->
      <div style="
        background:#FFFFFF;
        border-radius:14px;
        padding:20px 20px 18px;
        margin:18px 20px;
        box-shadow:0 6px 18px rgba(0,0,0,0.08);
        border-top:4px solid #C5A572;
      ">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px">
          <h2 style="margin:0; color:#1A237E; font-size:18px; text-transform:uppercase; letter-spacing:1px;">
            ${t.booking_code}: ${bookingId}
          </h2>
          <span style="font-size:12px; color:#777; text-transform:uppercase; letter-spacing:1px;">
            ${formatDate(checkin)} • ${formatDate(checkout)}
          </span>
        </div>

        <div style="border-top:1px solid #E5E5E5; padding-top:10px; margin-top:8px;">
          <p style="margin:4px 0;"><strong>${t.check_in}:</strong> ${formatDate(checkin)}</p>
          <p style="margin:4px 0;"><strong>${t.check_out}:</strong> ${formatDate(checkout)}</p>
          <p style="margin:4px 0;"><strong>${t.guests}:</strong> 
            ${guests} (${adults} ${t.adults.toLowerCase()}${children > 0 ? `, ${children} ${t.children.toLowerCase()}` : ''})
          </p>

          <!-- METODO DI PAGAMENTO -->
          <p style="margin:12px 0 4px 0;">
            <strong>${t.payment_method}:</strong>
            <img src="${methodIcon}" alt="${methodLabel}" width="22" style="vertical-align:middle; margin:0 6px;">
            ${methodLabel}
          </p>

          <!-- 🔥 RIEPILOGO COSTI COMPLETO (VERSIONE PREMIUM) -->
          <h3 style="margin:20px 0 10px 0; color:#1A237E; font-size:17px; border-bottom:1px solid #EEE; padding-bottom:6px;">
            ${t.cost_breakdown}
          </h3>

          <p style="margin:6px 0;">
            <strong>${t.accommodation_base}:</strong>
            €${Number(accommodationCost).toFixed(2)}
          </p>

          <p style="margin:6px 0;">
            <strong>${t.cleaning_fee}:</strong>
            €${Number(cleaningFee).toFixed(2)}
          </p>

          ${Number(parkingCost) > 0 ? `
          <p style="margin:6px 0;">
            <strong>${t.private_parking}:</strong>
            €${Number(parkingCost).toFixed(2)}
          </p>
          ` : ''}

          <p style="margin:6px 0;">
            <strong>${t.tourist_tax}:</strong>
            €${Number(touristTax).toFixed(2)}
          </p>

          ${Number(extraServicesCost) > 0 ? `
          <p style="margin:6px 0;">
            <strong>${t.extra_services}:</strong>
            €${Number(extraServicesCost).toFixed(2)}
          </p>
          ` : ''}

          <hr style="border:none; border-top:1px solid #DDD; margin:16px 0;">

          <!-- TOTALE -->
          <p style="margin:8px 0 4px 0; font-size:16px;">
            <strong>${t.total_amount}:</strong>
            €${Number(totalAmount).toFixed(2)}
          </p>

          ${!isFullPayment ? `
            <p style="margin:4px 0;">
              <strong>${t.deposit_amount}:</strong>
              €${Number(depositAmount).toFixed(2)}
            </p>

            <p style="margin:4px 0;">
              <strong>${t.remaining_balance}:</strong>
              €${saldo.toFixed(2)}
            </p>
          ` : `
            <p style="margin:4px 0;">
              <strong>${t.amount_paid}:</strong>
              €${Number(totalAmount).toFixed(2)}
            </p>
          `}
        </div>
      </div>

      <!-- EXTRA SERVICES (resto invariato) -->
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

      <!-- INFO, CONTATTI, FOOTER (resto invariato) -->
      ...
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