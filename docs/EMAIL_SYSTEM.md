# Sistema Email - Vincanto

## Panoramica

Il sistema email di Vincanto utilizza un'architettura modulare con template HTML, logging automatico su database, e retry logic per garantire l'affidabilità degli invii.

## Componenti Principali

### 1. **Email Templates** (`email/templates/`)
Template HTML riutilizzabili per diversi tipi di email:

- **`bookingConfirmation.js`**: Email di conferma iniziale dopo creazione prenotazione
- **`bookingFinalConfirmation.js`**: Email finale dopo pagamento completato
- **`index.js`**: Registry centrale dei template

#### Utilizzo Template
```javascript
import { renderEmailTemplate } from '../email/templates/index.js';

const html = renderEmailTemplate('booking_confirmation', {
  firstName: 'Mario',
  lastName: 'Rossi',
  bookingId: 'VIN123456',
  checkin: '2025-06-01',
  checkout: '2025-06-07',
  totalAmount: 450,
  depositAmount: 135
});
```

### 2. **Email Sender** (`email/emailSender.js`)
Sistema di invio con retry automatico e gestione errori:

- **Retry Logic**: Fino a 3 tentativi con exponential backoff (2s → 4s → 8s)
- **Connection Pooling**: Riutilizzo connessioni SMTP per efficienza
- **Error Detection**: Distingue errori transienti (timeout, connessione) da permanenti
- **Admin Copy**: Invio automatico copia admin quando configurato

#### Funzioni Principali
```javascript
import { sendEmailWithRetry, sendEmailWithAdminCopy } from '../email/emailSender.js';

// Invio singolo con retry
await sendEmailWithRetry({
  to: 'guest@example.com',
  subject: 'Conferma Prenotazione',
  html: '<p>Email content</p>',
  templateName: 'booking_confirmation',
  metadata: { bookingId: 'VIN123456' }
});

// Invio con copia admin automatica
await sendEmailWithAdminCopy({
  to: 'guest@example.com',
  subject: 'Conferma Prenotazione',
  html,
  templateName: 'booking_confirmation',
  metadata: {}
});
```

### 3. **Email Logger** (`email/emailLogger.js`)
Logging persistente su database PostgreSQL:

- Tabella `email_logs` con status, retry count, error messages
- Statistiche aggregate (totale invii, successi, fallimenti)
- Metadata JSON per tracciamento avanzato

#### Schema Database
```sql
CREATE TABLE email_logs (
  id SERIAL PRIMARY KEY,
  recipient VARCHAR(255) NOT NULL,
  subject VARCHAR(500) NOT NULL,
  template_name VARCHAR(100),
  status VARCHAR(50) NOT NULL,  -- 'pending', 'sent', 'failed'
  error_message TEXT,
  metadata JSONB,
  sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  retry_count INTEGER DEFAULT 0
);
```

## Configurazione

### Variabili d'Ambiente Richieste
```env
# SMTP Server Configuration
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your-email@example.com
SMTP_PASSWORD=your-password
SMTP_FROM=noreply@vincantomaori.it
SMTP_FROM_NAME=Vincanto Maori

# Optional: Admin notifications
ADMIN_EMAIL=admin@vincantomaori.it

# Database (required for logging)
DATABASE_URL=postgresql://user:password@host:5432/database
```

### Validazione Ambiente
Il sistema controlla automaticamente le variabili SMTP all'avvio:
- Se mancanti: logging warning, invio email disabilitato (graceful degradation)
- Se presenti: test connessione SMTP e creazione tabella `email_logs`

## Flussi Email

### 1. **Conferma Prenotazione Iniziale**
**Trigger**: Creazione prenotazione in `api/unified.js` (action `booking` POST)

**Contenuto**:
- Dati ospite e prenotazione (check-in, check-out, ospiti)
- Dettagli pagamento (totale, acconto)
- Codice prenotazione

**Destinatari**:
- Cliente (email principale)
- Admin (copia automatica se `ADMIN_EMAIL` configurato)

### 2. **Conferma Post-Pagamento**
**Trigger**: Successo pagamento Stripe/PayPal in `BookingSteps.tsx`

**Endpoint**: `/api/send-final-email`

**Contenuto**:
- Conferma pagamento ricevuto
- Riepilogo importo pagato e saldo residuo
- Link e istruzioni check-in

**Destinatari**:
- Cliente (email principale)
- Admin (copia automatica)

## Personalizzazione Template

### Aggiungere un Nuovo Template

1. **Crea file template** in `email/templates/`:
```javascript
// email/templates/cancellationConfirmation.js
export function cancellationConfirmationTemplate(data) {
  const { firstName, lastName, bookingId, refundAmount } = data;
  return `
    <div style="font-family: Arial, sans-serif; max-width:600px; margin:0 auto;">
      <h2>Cancellazione Confermata</h2>
      <p>Ciao ${escapeHtml(firstName)},</p>
      <p>La tua prenotazione ${bookingId} è stata cancellata.</p>
      <p><strong>Rimborso:</strong> €${refundAmount.toFixed(2)}</p>
    </div>
  `;
}
function escapeHtml(str){ 
  if(!str) return ''; 
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); 
}
```

2. **Registra template** in `email/templates/index.js`:
```javascript
import { cancellationConfirmationTemplate } from './cancellationConfirmation.js';

const templates = {
  booking_confirmation: bookingConfirmationTemplate,
  booking_final_confirmation: bookingFinalConfirmationTemplate,
  cancellation_confirmation: cancellationConfirmationTemplate
};
```

3. **Usa nel codice**:
```javascript
const html = renderEmailTemplate('cancellation_confirmation', {
  firstName: 'Mario',
  bookingId: 'VIN123456',
  refundAmount: 135
});
```

## Sicurezza

### Sanitizzazione Input
Tutti i dati utente vengono sanitizzati con `escapeHtml()` nei template per prevenire XSS:
```javascript
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
```

### Rate Limiting
Implementare rate limiting a livello applicativo per prevenire abusi:
```javascript
// Esempio con express-rate-limit
import rateLimit from 'express-rate-limit';

const emailLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minuti
  max: 5 // Max 5 email per IP
});

app.post('/api/send-final-email', emailLimiter, handler);
```

## Monitoraggio e Debug

### Visualizza Statistiche Email
```javascript
import { getEmailStats } from '../email/emailLogger.js';

const stats = await getEmailStats();
console.log(stats); 
// { total: 145, sent: 140, failed: 5, total_retries: 12 }
```

### Query Log Email Fallite
```sql
SELECT * FROM email_logs 
WHERE status = 'failed' 
ORDER BY sent_at DESC 
LIMIT 10;
```

### Console Logging
Il sistema logga dettagli in console:
- ✅ Email inviata con successo
- ⚠️ Tentativo fallito (con retry)
- ❌ Email fallita definitivamente
- ⏳ Retry schedulato

## Espansioni Future

### 1. **Supporto Multi-Lingua**
```javascript
// Aggiungere parametro lingua
const html = renderEmailTemplate('booking_confirmation', {
  ...data,
  language: 'en'
});

// Template con stringhe localizzate
const strings = {
  it: { greeting: 'Ciao', thanks: 'Grazie' },
  en: { greeting: 'Hello', thanks: 'Thank you' }
};
```

### 2. **Template HTML Avanzati**
- CSS inline per compatibilità client email
- Immagini embedded (base64)
- Responsive design per mobile

### 3. **Webhook Tracking**
- Notifiche apertura email (pixel tracking)
- Click tracking su link
- Bounce e complaint handling

### 4. **Queue System**
Per alto volume, integrare sistema di code (Bull, BullMQ):
```javascript
import Queue from 'bull';
const emailQueue = new Queue('email');

emailQueue.process(async (job) => {
  return sendEmailWithRetry(job.data);
});
```

## Troubleshooting

### Email Non Inviate
1. Verifica variabili ambiente SMTP
2. Controlla log `email_logs` per errori
3. Test connessione SMTP manuale
4. Controlla firewall/porte (587, 465)

### Timeout SMTP
- Aumenta timeout in `emailSender.js` (default 5000ms)
- Verifica latenza rete verso SMTP server
- Considera SMTP relay service (SendGrid, Mailgun)

### Rate Limit Provider
- Monitora limiti orari/giornalieri SMTP provider
- Implementa throttling a livello applicativo
- Usa queue system per gestire picchi

---

**Ultimo Aggiornamento**: 24 Novembre 2025  
**Manutenzione**: Antonio Guida (befree1986)
