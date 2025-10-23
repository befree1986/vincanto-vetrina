# 🎛️ Guida Pannello Admin - Vincanto

## Accesso al Pannello Admin

### 📍 URL di Accesso
```
http://localhost:5174/admin
```
oppure in produzione:
```
https://vincanto.vercel.app/admin
```

### 🔐 Credenziali di Accesso
Le credenziali admin sono definite nel file `src/components/AdminPanel.tsx`:
- **Username**: `admin`
- **Password**: `vincanto2024`

---

## 🔧 Configurazione API

### 📅 API Calendar Manager
Il pannello admin gestisce calendari esterni tramite:

**1. Google Calendar API**
- Accesso: [Google Cloud Console](https://console.cloud.google.com/)
- Servizi richiesti: Google Calendar API
- Credenziali: Service Account JSON

**2. Airbnb/Booking.com iCal**
- Formato: URL iCal pubblico
- Esempio: `https://calendar.airbnb.com/calendar/ics/123456.ics`

**3. VRBO/HomeAway**
- URL iCal del listing
- Sincronizzazione bidirezionale

### 🛠️ Configurazione nel Codice

**File**: `vincanto-backend/server.js`

```javascript
// Configurazione Calendari Esterni
const CALENDAR_CONFIGS = {
  airbnb: {
    icalUrl: "IL_TUO_URL_ICAL_AIRBNB",
    enabled: true
  },
  booking: {
    icalUrl: "IL_TUO_URL_ICAL_BOOKING",
    enabled: true
  },
  google: {
    credentialsPath: "./config/google-calendar-service.json",
    calendarId: "IL_TUO_CALENDAR_ID@gmail.com",
    enabled: false
  }
};
```

---

## 🔑 Chiavi API da Configurare

### 1. 💳 Stripe (Pagamenti)
**File**: `vincanto-backend/server.js`
```javascript
const stripe = require('stripe')('sk_test_TUA_CHIAVE_SEGRETA');
```

**Dove trovarle**:
- Dashboard: [stripe.com/dashboard](https://dashboard.stripe.com/)
- Sezione: Developers → API keys
- **Test**: `sk_test_...` e `pk_test_...`
- **Live**: `sk_live_...` e `pk_live_...`

### 2. 💰 PayPal (Pagamenti Alternativi)
**File**: Frontend `src/components/PaymentForm.tsx`
```javascript
const PAYPAL_CLIENT_ID = "TUO_PAYPAL_CLIENT_ID";
```

**Dove trovarle**:
- Dashboard: [developer.paypal.com](https://developer.paypal.com/)
- Sezione: My Apps & Credentials
- **Sandbox**: Per test
- **Live**: Per produzione

### 3. 📧 Nodemailer (Email)
**File**: `vincanto-backend/server.js`
```javascript
const transporter = nodemailer.createTransporter({
  service: 'gmail',
  auth: {
    user: 'tua-email@gmail.com',
    pass: 'app-password-generata'
  }
});
```

**Setup Gmail**:
1. Attiva autenticazione a 2 fattori
2. Genera App Password specifiche
3. Usa quella invece della password normale

### 4. 🗄️ Database (Neon PostgreSQL)
**File**: `vincanto-backend/server.js`
```javascript
const pool = new Pool({
  connectionString: 'postgresql://username:password@host:5432/database',
  ssl: { rejectUnauthorized: false }
});
```

**Dove trovarle**:
- Dashboard: [neon.tech](https://neon.tech)
- Sezione: Connection Details
- Formato completo connection string

---

## 🎯 Funzioni del Pannello Admin

### 📊 Dashboard Principale
- **Statistiche booking** in tempo reale
- **Calendari sincronizzati** da piattaforme esterne
- **Revenue tracking** mensile/annuale
- **Occupancy rate** per periodo

### 📅 Calendar Manager
- **Importa da Airbnb**: URL iCal automatico
- **Importa da Booking.com**: Sincronizzazione bidirezionale
- **Blocca date**: Per manutenzione/pulizie
- **Prezzi dinamici**: Per alta/bassa stagione

### 📈 Reporting
- **Export Excel** di tutte le prenotazioni
- **Analytics** con grafici dettagliati
- **Email reports** automatici
- **Revenue per canale** di prenotazione

### ⚙️ Impostazioni
- **Tariffe stagionali**
- **Regole di cancellazione**
- **Check-in/out** automatici
- **Comunicazioni ospiti**

---

## 🚀 Setup Iniziale Rapido

### 1. Database Setup
```bash
# Connessione database
psql "postgresql://username:password@host:5432/database"

# Verifica tabelle
\dt

# Test query
SELECT * FROM bookings LIMIT 5;
```

### 2. Verifica API
```bash
# Test backend
curl http://localhost:5000/api/health

# Test calendar
curl http://localhost:5000/api/calendar/availability
```

### 3. Test Pagamenti
```bash
# Test Stripe
curl -X POST http://localhost:5000/api/payment/create-intent \
  -H "Content-Type: application/json" \
  -d '{"amount": 5000, "currency": "eur"}'
```

---

## 🔍 Troubleshooting Comune

### ❌ Errore Database Connection
```
Error: Database connection failed
```
**Soluzione**: Verifica connection string Neon PostgreSQL

### ❌ Stripe API Error
```
Error: No API key provided
```
**Soluzione**: Aggiungi chiave Stripe in variabili ambiente

### ❌ Calendar Sync Failed
```
Error: iCal URL not accessible
```
**Soluzione**: Verifica URL iCal da Airbnb/Booking.com

### ❌ Email Not Sending
```
Error: Gmail authentication failed
```
**Soluzione**: Usa App Password invece della password normale

---

## 📞 Supporto

Per problemi con la configurazione:
1. Verifica che tutti i servizi siano attivi
2. Controlla i log nel terminale backend
3. Testa ogni API singolarmente
4. Usa le credenziali di test prima di quelle live

**Log Backend in Tempo Reale**:
```bash
cd vincanto-backend && npm run dev
```

**Console Browser per Errori Frontend**:
```javascript
// Apri DevTools (F12) e guarda la console
console.log("Errors:", window.errors);
```

---

## 🎯 Prossimi Passi

1. **Configura le API** di produzione (Stripe Live, PayPal Live)
2. **Testa il calendario** con date reali
3. **Importa prenotazioni** esistenti da altre piattaforme
4. **Setup monitoring** e backup automatici
5. **Deploy in produzione** con credenziali live

Il sistema è completamente funzionale - ora serve solo inserire le tue chiavi API reali! 🚀