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
    language = 'it'
  } = data;

  const t = getEmailStrings('booking_confirmation', language);
  const formatDate = (d) => formatDateByLanguage(d, language);
  const saldo = Number(totalAmount) - Number(depositAmount);

  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2c5282;">${t.title}</h2>
      <p>${t.greeting} <strong>${escapeHtml(firstName)} ${escapeHtml(lastName)}</strong>,</p>
      <p>${t.intro}</p>
      <div style="background: #f7fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p><strong>${t.booking_code}:</strong> ${bookingId}</p>
        <p><strong>${t.check_in}:</strong> ${formatDate(checkin)}</p>
        <p><strong>${t.check_out}:</strong> ${formatDate(checkout)}</p>
        <p><strong>${t.guests}:</strong> ${guests} (${adults} ${t.adults.toLowerCase()}${children > 0 ? `, ${children} ${t.children.toLowerCase()}` : ''})</p>
        <p><strong>${t.total_amount}:</strong> €${Number(totalAmount).toFixed(2)}</p>
        <p><strong>${t.deposit_amount}:</strong> €${Number(depositAmount).toFixed(2)}</p>
        <p><strong>${t.remaining_balance}:</strong> €${saldo.toFixed(2)}</p>
      </div>
      <div style="background:#e6fffa;padding:16px;border-left:4px solid #319795;margin:16px 0;">
        <h3 style="margin-top:0;color:#234e52;">${t.important_info}</h3>
        <ul style="margin:8px 0;padding-left:20px;">
          <li>${t.checkin_time}</li>
          <li>${t.checkout_time}</li>
          <li>${t.bring_id}</li>
        </ul>
      </div>
      <p>${t.contact_us}: <a href="mailto:${fromEmail}">${fromEmail}</a></p>
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
