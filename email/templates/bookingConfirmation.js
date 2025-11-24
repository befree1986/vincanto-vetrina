// Email template: booking confirmation
// Minimal template function; will be extended for i18n later.

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
    fromEmail
  } = data;

  const formatDate = (d) => {
    try { return new Date(d).toLocaleDateString('it-IT'); } catch { return d; }
  };

  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2c5282;">Conferma Prenotazione - Vincanto Maori</h2>
      <p>Gentile <strong>${escapeHtml(firstName)} ${escapeHtml(lastName)}</strong>,</p>
      <p>Grazie per la tua prenotazione! Ecco i dettagli:</p>
      <div style="background: #f7fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p><strong>Codice Prenotazione:</strong> ${bookingId}</p>
        <p><strong>Check-in:</strong> ${formatDate(checkin)}</p>
        <p><strong>Check-out:</strong> ${formatDate(checkout)}</p>
        <p><strong>Ospiti:</strong> ${guests} (${adults} adulti, ${children} bambini)</p>
        <p><strong>Totale:</strong> €${Number(totalAmount).toFixed(2)}</p>
        <p><strong>Acconto richiesto:</strong> €${Number(depositAmount).toFixed(2)}</p>
      </div>
      <p>Ti confermeremo la prenotazione entro 24 ore.</p>
      <p>Per qualsiasi domanda, contattaci a: <a href="mailto:${fromEmail}">${fromEmail}</a></p>
      <hr style="margin: 30px 0; border: none; border-top: 1px solid #e2e8f0;">
      <p style="font-size: 12px; color: #718096;">Vincanto Maori - Maiori (SA)<br>www.vincantomaori.it</p>
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
