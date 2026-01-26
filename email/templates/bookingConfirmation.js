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
    account_holder: ' Guida Antonio'
  };

  return `
    <div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto; background:#ffffff;">
      <div style="padding:16px 20px;border-bottom:1px solid #e2e8f0;display:flex;align-items:center;gap:12px;background:#f8fafc;">
        <img src="${baseUrl}/logo.svg" alt="Vincanto Maori" width="40" height="40" style="display:block"/>
        <div style="font-weight:700;color:#2c5282;font-size:18px;line-height:1;">Vincanto Maori</div>
      </div>
      <h2 style="color: #2c5282;">${t.title}</h2>
      <p>${t.greeting} <strong>${escapeHtml(firstName)} ${escapeHtml(lastName)}</strong>,</p>
      <p>${t.intro}</p>
      <div style="background: #f7fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p><strong>${t.booking_code}:</strong> ${bookingId}</p>
        <p><strong>${t.check_in}:</strong> ${formatDate(checkin)}</p>
        <p><strong>${t.check_out}:</strong> ${formatDate(checkout)}</p>
        <p><strong>${t.guests}:</strong> ${guests} (${adults} ${t.adults.toLowerCase()}${children > 0 ? `, ${children} ${t.children.toLowerCase()}` : ''})</p>
        ${paymentMethod ? `<p><strong>${t.payment_method}:</strong> <img src="${methodIcon}" alt="${methodLabel}" width="20" height="20" style="vertical-align:middle;margin-right:6px;"/> ${methodLabel}</p>` : ''}
        <p><strong>${t.total_amount}:</strong> €${Number(totalAmount).toFixed(2)}</p>
        ${!isFullPayment ? `<p><strong>${t.deposit_amount}:</strong> €${Number(depositAmount).toFixed(2)}</p>
        <p><strong>${t.remaining_balance}:</strong> €${saldo.toFixed(2)}</p>
        ` : `
        <p><strong>${t.payment_status}:</strong> ${t.paid_in_full}</p>`
      }
      </div>
      ${isBankTransfer ? `
        <div style="background:#f0f4f8;padding:16px;border-left:4px solid #2c5282;margin:16px 0;border-radius:6px;">
          <h3 style="margin-top:0;color:#2c5282;">${t.bank_transfer_details}</h3>
          <p style="margin:4px 0;"><strong>${t.bank_beneficiary}:</strong> ${bankDetails.account_holder}</p>
          <p style="margin:4px 0;"><strong>${t.bank_iban}:</strong> ${bankDetails.iban}</p>
          <p style="margin:4px 0;"><strong>${t.bank_bic}:</strong> ${bankDetails.bic}</p>
          <p style="margin:4px 0;"><strong>${t.bank_bank}:</strong> ${t.bankDetails.bank_name}</p>
          <p style="margin:4px 0;"><strong>${t.bank_reason}:</strong> ${t.bank_reason_reason_val} ${bookingId} - ${firstName} ${lastName}</p>
        </div>
      ` : ''}
      
      ${extraServices.length > 0 ? `
      <div style="background:#f0f4f8;padding:16px;border-left:4px solid #2c5282;margin:16px 0;border-radius:6px;">
        <h3 style="margin:0 0 8px 0;color:#2c5282;">${t.extra_services}</h3>
        ${includedServices.length > 0 ? `
        <div style="margin:8px 0 4px 0;font-weight:bold;">${t.included_services}</div>
        <ul style="margin:4px 0 12px 16px;padding:0;">
          ${includedServices.map(s => `<li>${escapeHtml(s.name || '')} <span style="background:#e6fffa;color:#234e52;border:1px solid #81e6d9;border-radius:10px;padding:2px 6px;font-size:11px;margin-left:6px;vertical-align:middle;">${t.included_badge}</span></li>`).join('')}
        </ul>
        ` : ''}
        ${paidServices.length > 0 ? `
        <div style="margin:8px 0 4px 0;font-weight:bold;">${t.extra_services}</div>
        <ul style="margin:4px 0 8px 16px;padding:0;">
          ${paidServices.map(s => `<li>${escapeHtml(s.name || '')}: €${Number(s.price || 0).toFixed(2)}</li>`).join('')}
        </ul>
        <div style="text-align:right;color:#2d3748;font-weight:bold;">${t.extras_total}: €${extrasTotal.toFixed(2)}</div>
        ` : `<div style="color:#4a5568;">${t.no_extras}</div>`}
      </div>
      ` : ''}
      <div style="background:#e6fffa;padding:16px;border-left:4px solid #319795;margin:16px 0;">
        <h3 style="margin-top:0;color:#234e52;">${t.important_info}</h3>
        <ul style="margin:8px 0;padding-left:20px;">
          <li>${t.checkin_time}</li>
          <li>${t.checkout_time}</li>
          <li>${t.bring_id}</li>
        </ul>
      </div>
      <p>${t.contact_us}: <a href="mailto:${fromEmail}">${fromEmail}</a></p>
      <!--ADMIN_EXTRA-->
      <hr style="margin: 30px 0; border: none; border-top: 1px solid #e2e8f0;">
      <p style="font-size: 12px; color: #718096;">${t.footer}</p>
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
