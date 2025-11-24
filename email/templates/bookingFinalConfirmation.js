// Email template: final confirmation after successful payment with i18n support
import { getEmailStrings, formatDateByLanguage } from '../i18n.js';

export function bookingFinalConfirmationTemplate(data) {
  const {
    firstName,
    lastName,
    bookingId,
    checkin,
    checkout,
    totalAmount,
    amountPaid,
    fromEmail,
    language = 'it'
  } = data;
  
  const t = getEmailStrings('booking_final', language);
  const formatDate = (d) => formatDateByLanguage(d, language);
  const saldo = Number(totalAmount) - Number(amountPaid);
  
  return `
    <div style="font-family: Arial, sans-serif; max-width:600px; margin:0 auto;">
      <h2 style="color:#2c5282;">${t.title}</h2>
      <p>${t.greeting} <strong>${escapeHtml(firstName)} ${escapeHtml(lastName)}</strong>,</p>
      <p>${t.intro} <strong>${t.confirmed}</strong>.</p>
      <div style="background:#f7fafc;padding:18px;border-radius:8px;margin:16px 0;">
        <p><strong>${t.booking_code}:</strong> ${bookingId}</p>
        <p><strong>${t.check_in}:</strong> ${formatDate(checkin)}</p>
        <p><strong>${t.check_out}:</strong> ${formatDate(checkout)}</p>
        <p><strong>${t.total_amount}:</strong> €${Number(totalAmount).toFixed(2)}</p>
        <p><strong>${t.amount_paid}:</strong> €${Number(amountPaid).toFixed(2)}</p>
        <p><strong>${t.remaining_balance}:</strong> €${saldo.toFixed(2)}</p>
      </div>
      <p>${t.waiting_for_you}</p>
      <p>${t.contact}: <a href="mailto:${fromEmail}">${fromEmail}</a></p>
      <hr style="margin:30px 0;border:none;border-top:1px solid #e2e8f0;" />
      <p style="font-size:12px;color:#718096;">${t.footer}</p>
    </div>
  `;
}
function escapeHtml(str){ if(!str) return ''; return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;'); }
