# Email i18n - Multi-Language Support

## Overview

Il sistema email di Vincanto supporta ora **4 lingue**:
- 🇮🇹 **Italiano (it)** - Default
- 🇬🇧 **Inglese (en)**
- 🇩🇪 **Tedesco (de)**
- 🇫🇷 **Francese (fr)**

## Rilevamento Automatico Lingua

La lingua viene rilevata automaticamente con **priorità gerarchica**:

1. **Preferenza utente esplicita** (dal frontend i18n)
2. **Dominio email** (.de → tedesco, .fr → francese, .uk/.com → inglese)
3. **Default italiano** (fallback)

### Esempi Rilevamento

```javascript
// Email .de → Tedesco
detectLanguage('max.mueller@gmail.de') // → 'de'

// Email .fr → Francese
detectLanguage('jean.dupont@orange.fr') // → 'fr'

// Email .com + preferenza utente → Utente vince
detectLanguage('john@gmail.com', 'en') // → 'en'

// Email italiana generica → Default
detectLanguage('mario.rossi@gmail.com') // → 'it'
```

## Template Supportati

### 1. Booking Confirmation (`booking_confirmation`)
**Trigger**: Prima email dopo creazione prenotazione

**Contenuto localizzato**:
- Titolo email
- Saluto personalizzato
- Messaggio di ringraziamento
- Etichette campi (Check-in, Check-out, Ospiti, etc.)
- Informazioni importanti (orari, documenti)
- Footer

**Esempio Output**:

**Italiano**:
```
Oggetto: Conferma Prenotazione VIN123456
Ciao Mario Rossi,
Grazie per aver scelto Vincanto Maori!
```

**English**:
```
Subject: Booking Confirmation VIN123456
Hello Mario Rossi,
Thank you for choosing Vincanto Maori!
```

**Deutsch**:
```
Betreff: Buchungsbestätigung VIN123456
Hallo Mario Rossi,
Vielen Dank, dass Sie sich für Vincanto Maori entschieden haben!
```

**Français**:
```
Objet: Confirmation de Réservation VIN123456
Bonjour Mario Rossi,
Merci d'avoir choisi Vincanto Maori !
```

### 2. Final Payment Confirmation (`booking_final`)
**Trigger**: Email post-pagamento completato

**Contenuto localizzato**:
- Titolo "Pagamento Ricevuto"
- Conferma prenotazione
- Dettagli importo pagato/saldo
- Messaggio attesa cliente
- Istruzioni contatto

## Formattazione Date Localizzata

Le date vengono formattate secondo il locale della lingua:

```javascript
formatDateByLanguage('2025-12-01', 'it') // → "1 dicembre 2025"
formatDateByLanguage('2025-12-01', 'en') // → "December 1, 2025"
formatDateByLanguage('2025-12-01', 'de') // → "1. Dezember 2025"
formatDateByLanguage('2025-12-01', 'fr') // → "1 décembre 2025"
```

## Integrazione Frontend

### Passare Lingua Esplicitamente

Il frontend passa automaticamente la lingua corrente di i18next:

```typescript
// BookingSteps.tsx
import i18n from '../i18n';

await fetch('/api/send-final-email', {
  method: 'POST',
  body: JSON.stringify({
    ...bookingData,
    language: i18n.language || 'it' // Lingua corrente frontend
  })
});
```

## Integrazione Backend

### Unified API

```javascript
// api/unified.js
import { detectLanguage } from '../email/i18n.js';

const guestLanguage = detectLanguage(email);
const emailHtml = renderEmailTemplate('booking_confirmation', {
  ...data,
  language: guestLanguage
});
```

### Booking Confirm API

```javascript
// api/booking-confirm.js
const guestLanguage = detectLanguage(email, booking_data.language);
const emailHtml = renderEmailTemplate('booking_confirmation', {
  ...data,
  language: guestLanguage
});
```

### Final Email API

```javascript
// api/send-final-email.js
const { language: userLanguage } = req.body;
const guestLanguage = detectLanguage(guestEmail, userLanguage);
```

## Aggiungere Una Nuova Lingua

### 1. Aggiorna `email/i18n.js`

```javascript
export const emailStrings = {
  // ... lingue esistenti
  
  es: { // Spagnolo
    booking_confirmation: {
      subject: 'Confirmación de Reserva',
      title: 'Reserva Confirmada',
      greeting: 'Hola',
      intro: '¡Gracias por elegir Vincanto Maori!',
      booking_code: 'Código de Reserva',
      check_in: 'Entrada',
      check_out: 'Salida',
      guests: 'Huéspedes',
      adults: 'Adultos',
      children: 'Niños',
      total_amount: 'Importe Total',
      deposit_amount: 'Depósito (30%)',
      remaining_balance: 'Saldo a pagar en el check-in',
      important_info: 'Información Importante',
      checkin_time: 'Check-in: 15:00 - 20:00',
      checkout_time: 'Check-out: antes de las 10:00',
      bring_id: 'Traiga un documento de identidad válido',
      contact_us: 'Para consultas o cambios, responda a este email',
      footer: 'Vincanto Maori • Maiori, Costa Amalfitana',
      website: 'www.vincantomaori.it'
    },
    booking_final: {
      // ... stringhe template finale
    }
  }
};
```

### 2. Aggiorna `detectLanguage()`

```javascript
export function detectLanguage(email, userLanguage) {
  if (userLanguage && emailStrings[userLanguage]) {
    return userLanguage;
  }
  
  if (email) {
    const domain = email.toLowerCase().split('@')[1];
    if (domain) {
      if (domain.endsWith('.de')) return 'de';
      if (domain.endsWith('.fr')) return 'fr';
      if (domain.endsWith('.es')) return 'es'; // NUOVO
      if (domain.endsWith('.uk') || domain.endsWith('.com')) return 'en';
    }
  }
  
  return 'it';
}
```

### 3. Aggiorna `formatDateByLanguage()`

```javascript
const locales = {
  it: 'it-IT',
  en: 'en-US',
  de: 'de-DE',
  fr: 'fr-FR',
  es: 'es-ES' // NUOVO
};
```

## Customizzazione Template

### Override Template per Lingua Specifica

Se vuoi un template completamente custom per una lingua:

```javascript
// email/templates/bookingConfirmation.js
export function bookingConfirmationTemplate(data) {
  const { language = 'it' } = data;
  
  // Template custom per tedesco
  if (language === 'de') {
    return customGermanTemplate(data);
  }
  
  // Template standard multi-lingua per altre lingue
  const t = getEmailStrings('booking_confirmation', language);
  return standardTemplate(data, t);
}
```

## Testing Multi-Lingua

### Test Manuale per Lingua

```bash
# Test email tedesca
curl -X POST http://localhost:5173/api/send-final-email \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Max",
    "lastName": "Müller",
    "bookingId": "VIN123456",
    "checkin": "2025-12-01",
    "checkout": "2025-12-07",
    "totalAmount": 900,
    "amountPaid": 270,
    "guestEmail": "max@gmail.de",
    "language": "de"
  }'
```

### Test Rilevamento Automatico

```javascript
// Test in Node.js
import { detectLanguage } from './email/i18n.js';

console.log(detectLanguage('user@gmail.de')); // → 'de'
console.log(detectLanguage('user@gmail.com', 'fr')); // → 'fr'
console.log(detectLanguage('user@gmail.it')); // → 'it'
```

## Statistiche Uso Lingua

Le email inviate tracciano la lingua usata nei metadata:

```sql
SELECT 
  metadata->>'language' as language,
  COUNT(*) as count
FROM email_logs
WHERE template_name = 'booking_confirmation'
GROUP BY metadata->>'language'
ORDER BY count DESC;
```

Output esempio:
```
 language | count
----------+-------
 it       |   145
 en       |    42
 de       |    18
 fr       |     7
```

## Best Practices

### 1. Mantieni Coerenza Terminologica
Usa gli stessi termini per concetti identici in tutte le lingue.

### 2. Considera Differenze Culturali
- Formale vs informale (tedesco usa "Sie", italiano "tu")
- Formato date (US: MM/DD/YYYY, EU: DD/MM/YYYY)
- Valuta (simbolo € posizione varia)

### 3. Traduzioni Professionali
Per lingue ufficiali, considera revisione da madrelingua per:
- Tono professionale
- Terminologia turistica corretta
- Espressioni idiomatiche appropriate

### 4. Fallback Sicuro
Il sistema usa sempre italiano come fallback se:
- Lingua richiesta non disponibile
- Errore nel rilevamento
- Dati mancanti

## Troubleshooting

### Email Sempre in Italiano
**Causa**: Lingua non rilevata correttamente  
**Fix**: Verifica che frontend passi `language` o email abbia dominio riconosciuto

### Stringhe Mancanti
**Causa**: Template richiede chiave non definita per quella lingua  
**Fix**: Assicurati che tutte le chiavi siano presenti in `emailStrings[lang]`

### Date Formato Errato
**Causa**: Locale non supportato da `Intl.DateTimeFormat`  
**Fix**: Verifica mapping locale in `formatDateByLanguage()`

---

**Implementato**: 24 Novembre 2025  
**Lingue Supportate**: IT, EN, DE, FR  
**Auto-Detection**: ✅ Attivo  
**Fallback**: ✅ Italiano
