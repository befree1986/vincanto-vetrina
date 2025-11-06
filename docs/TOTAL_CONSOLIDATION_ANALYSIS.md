# ANALISI CONSOLIDAMENTO TOTALE - PROGETTO VINCANTO COMPLETO
# Scenario: Sistema completo con pagamenti, sicurezza, notifiche, analytics

## SITUAZIONE FUTURA SENZA CONSOLIDAMENTO
### API Necessarie per Sistema Completo:

**CALENDARIO (4 API):**
- calendar-sync.js
- booking-sync.js  
- availability-sync.js
- google-calendar.js

**PAGAMENTI (6 API):**
- payments-stripe.js
- payments-paypal.js
- payments-webhooks.js
- payments-status.js
- invoices.js
- refunds.js

**SICUREZZA (4 API):**
- auth-login.js
- auth-register.js
- auth-reset-password.js
- security-rate-limit.js

**NOTIFICHE (3 API):**
- notifications-email.js
- notifications-sms.js
- webhooks-booking.js

**BUSINESS LOGIC (4 API):**
- pricing.js
- quote.js
- booking.js
- extra-services.js

**ADMIN & SYSTEM (4 API):**
- admin.js
- setup-calendars-db.js
- blocked-dates.js
- availability.js

**TOTALE SENZA CONSOLIDAMENTO: 25 API** ❌ (Vercel Hobby limit = 12)

## CONSOLIDAMENTO MASSIMO POSSIBILE
### Raggruppamento Strategico per Aree Funzionali:

### 1. **calendar-hub.js** (Consolida 4 → 1)
**Unifica tutto il calendario:**
```javascript
/api/calendar-hub?service=sync&action=list
/api/calendar-hub?service=availability&action=check&startDate=X&endDate=Y
/api/calendar-hub?service=booking-sync&action=sync
/api/calendar-hub?service=google&action=auth
```

### 2. **payments-hub.js** (Consolida 6 → 1)  
**Unifica tutto i pagamenti:**
```javascript
/api/payments-hub?service=stripe&action=create-session
/api/payments-hub?service=paypal&action=create-order
/api/payments-hub?service=webhooks&provider=stripe
/api/payments-hub?service=status&transactionId=xyz
/api/payments-hub?service=invoices&action=generate
/api/payments-hub?service=refunds&action=process
```

### 3. **auth-hub.js** (Consolida 4 → 1)
**Unifica autenticazione e sicurezza:**
```javascript
/api/auth-hub?service=login&action=authenticate
/api/auth-hub?service=register&action=create-user
/api/auth-hub?service=password&action=reset
/api/auth-hub?service=security&action=rate-check
```

### 4. **notifications-hub.js** (Consolida 3 → 1)
**Unifica notifiche:**
```javascript
/api/notifications-hub?service=email&action=send
/api/notifications-hub?service=sms&action=send  
/api/notifications-hub?service=webhooks&action=booking-confirmed
```

### 5. **business-hub.js** (Consolida 4 → 1)
**Unifica logica business:**
```javascript
/api/business-hub?service=pricing&action=calculate
/api/business-hub?service=quote&action=generate
/api/business-hub?service=booking&action=create
/api/business-hub?service=extras&action=list
```

### 6. **system-hub.js** (Consolida 4 → 1)
**Unifica admin e sistema:**
```javascript
/api/system-hub?service=admin&action=dashboard
/api/system-hub?service=setup&action=calendars
/api/system-hub?service=blocked&action=list-dates
/api/system-hub?service=availability&action=legacy-check
```

## RISULTATO CONSOLIDAMENTO TOTALE:
**Da 25 API → 6 API HUB** ✅ (50% sotto il limite Vercel!)

**API Vercel utilizzate: 6/12 (6 libere per espansioni future)**