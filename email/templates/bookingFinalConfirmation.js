// Email template: final confirmation after successful payment
export function bookingFinalConfirmationTemplate(data) {
  const {
    firstName,
    lastName,
    bookingId,
    checkin,
    checkout,
    totalAmount,
    amountPaid,
    fromEmail
  } = data;
  const formatDate = (d) => { try { return new Date(d).toLocaleDateString('it-IT'); } catch { return d; } };
  return `
    <div style="font-family: Arial, sans-serif; max-width:600px; margin:0 auto;">
      <h2 style="color:#2c5282;">Pagamento Ricevuto - Prenotazione Confermata</h2>
      <p>Ciao <strong>${escapeHtml(firstName)} ${escapeHtml(lastName)}</strong>,</p>
      <p>Il tuo pagamento è stato ricevuto con successo e la prenotazione è ora <strong>CONFERMATA</strong>.</p>
      <div style="background:#f7fafc;padding:18px;border-radius:8px;margin:16px 0;">
        <p><strong>Codice Prenotazione:</strong> ${bookingId}</p>
        <p><strong>Check-in:</strong> ${formatDate(checkin)}</p>
        <p><strong>Check-out:</strong> ${formatDate(checkout)}</p>
        <p><strong>Importo Totale:</strong> €${Number(totalAmount).toFixed(2)}</p>
        <p><strong>Pagato ora:</strong> €${Number(amountPaid).toFixed(2)}</p>
        <p><strong>Saldo restante:</strong> €${(Number(totalAmount) - Number(amountPaid)).toFixed(2)}</p>
      </div>
      <p>Ti aspettiamo a Maiori! Conserva questa email per riferimento.</p>
      <p>Per richieste o modifiche rispondi direttamente a questa email: <a href="mailto:${fromEmail}">${fromEmail}</a></p>
      <hr style="margin:30px 0;border:none;border-top:1px solid #e2e8f0;" />
      <p style="font-size:12px;color:#718096;">Vincanto Maori • www.vincantomaori.it</p>
    </div>
  `;
}
function escapeHtml(str){ if(!str) return ''; return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;'); }
