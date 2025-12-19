// Script: genera anteprime HTML delle email di test (3 metodi × 2 tipi = 6 file)
import { renderEmailTemplate } from '../email/templates/index.js';
import { writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const outputDir = join(__dirname, '../preview-emails');

try {
  mkdirSync(outputDir, { recursive: true });
} catch {}

const sampleExtras = [
  { id: 1, name: 'Colazione Italiana', price: 15, included: true },
  { id: 2, name: 'Kit Welcome', price: 25, included: true },
  { id: 3, name: 'Late Check-out', price: 30, included: false },
  { id: 4, name: 'Transfer Aeroporto', price: 45, included: false }
];

const paymentMethods = [
  { key: 'stripe', label: 'Stripe Card' },
  { key: 'paypal', label: 'PayPal' },
  { key: 'bank_transfer', label: 'Bank Transfer' }
];

console.log('🎨 Generando anteprime HTML delle email...\n');

paymentMethods.forEach(({ key, label }) => {
  const bookingId = 'VINTEST' + Date.now() + '-' + key.toUpperCase();
  
  const dataCommon = {
    firstName: 'Mario',
    lastName: 'Rossi',
    bookingId,
    checkin: new Date().toISOString().split('T')[0],
    checkout: new Date(Date.now() + 3*86400000).toISOString().split('T')[0],
    fromEmail: 'prenotazioni@vincantomaori.it',
    language: 'it',
    extraServices: sampleExtras,
    paymentMethod: key
  };

  // 1. Conferma prenotazione
  const html1 = renderEmailTemplate('booking_confirmation', {
    ...dataCommon,
    guests: 2,
    adults: 2,
    children: 0,
    totalAmount: 315,
    depositAmount: 94.50
  });

  const filename1 = `booking_confirmation_${key}.html`;
  writeFileSync(join(outputDir, filename1), html1);
  console.log(`✅ ${filename1}`);

  // 2. Conferma finale pagamento
  const html2 = renderEmailTemplate('booking_final_confirmation', {
    ...dataCommon,
    totalAmount: 315,
    amountPaid: 94.50
  });

  const filename2 = `booking_final_${key}.html`;
  writeFileSync(join(outputDir, filename2), html2);
  console.log(`✅ ${filename2}`);
});

// 3. Genera indice HTML per visualizzazione rapida
const indexHtml = `
<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="UTF-8">
  <title>Anteprime Email Vincanto</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 1200px; margin: 40px auto; padding: 0 20px; background: #f5f5f5; }
    h1 { color: #2c5282; }
    .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; margin: 20px 0; }
    .card { background: white; border-radius: 8px; padding: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
    .card h3 { margin-top: 0; color: #2c5282; }
    .card a { display: inline-block; margin: 5px 0; padding: 8px 16px; background: #2c5282; color: white; text-decoration: none; border-radius: 4px; }
    .card a:hover { background: #1e3a5f; }
    .badge { display: inline-block; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold; }
    .badge.stripe { background: #635bff; color: white; }
    .badge.paypal { background: #0070ba; color: white; }
    .badge.bank { background: #2ecc71; color: white; }
  </style>
</head>
<body>
  <h1>📧 Anteprime Email Vincanto Maori</h1>
  <p>Visualizza le email di conferma prenotazione con i 3 metodi di pagamento.</p>
  
  <div class="grid">
    ${paymentMethods.map(({ key, label }) => `
      <div class="card">
        <h3><span class="badge ${key}">${label}</span></h3>
        <p><strong>Conferma Prenotazione</strong></p>
        <a href="booking_confirmation_${key}.html" target="_blank">Apri Cliente</a>
        <p><strong>Conferma Finale Pagamento</strong></p>
        <a href="booking_final_${key}.html" target="_blank">Apri Cliente</a>
      </div>
    `).join('')}
  </div>
  
  <hr style="margin: 40px 0;">
  
  <h2>📋 Dettagli Test</h2>
  <ul>
    <li><strong>Cliente:</strong> Mario Rossi</li>
    <li><strong>Periodo:</strong> 3 notti</li>
    <li><strong>Totale:</strong> €315.00</li>
    <li><strong>Acconto 30%:</strong> €94.50</li>
    <li><strong>Servizi Inclusi:</strong> Colazione Italiana, Kit Welcome</li>
    <li><strong>Servizi Extra:</strong> Late Check-out (€30), Transfer Aeroporto (€45)</li>
  </ul>
  
  <p style="color: #666; font-size: 14px; margin-top: 40px;">
    ℹ️ Queste sono anteprime HTML generate in locale. La versione admin (con blocco dettagli tecnici) viene inviata solo via email a ADMIN_EMAIL.
  </p>
</body>
</html>
`;

writeFileSync(join(outputDir, 'index.html'), indexHtml);
console.log(`\n✅ Indice: preview-emails/index.html`);
console.log(`\n🎨 Apri il file per visualizzare tutte le anteprime:`);
console.log(`   file:///${outputDir.replace(/\\/g, '/')}/index.html\n`);
