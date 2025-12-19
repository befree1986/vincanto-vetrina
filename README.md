# 🏠 Vincanto - Sistema Completo di Gestione Prenotazioni

Sistema completo per la gestione di prenotazioni vacation rental con booking system, pannello admin, calendari sincronizzati e servizi extra.

## ✅ STATO SISTEMA

**Ultima Verifica**: 14 Novembre 2025

```
✅ Database Neon:        CONFIGURATO E FUNZIONANTE
✅ API Unificata:        OPERATIVA (api/unified.js)
✅ Frontend Booking:     FUNZIONANTE
✅ Pannello Admin:       OPERATIVO
✅ Servizi Extra:        CONFIGURATI (culla con età 0-7)
✅ Tabelle Database:     COMPLETE (9 tabelle)
```

## 🚀 Quick Start

### 1. Installazione
```bash
npm install
```

### 2. Verifica Sistema
```bash
node verify-system.mjs
```

### 3. Sviluppo Locale
```bash
npm run dev
# Server su http://localhost:5173
```

### 4. Pannello Admin
Apri: `http://localhost:5173/#admin`  
Password: `vincanto2025`

### 5. Deploy
```bash
git add .
git commit -m "update: sistema configurato"
git push
```

## 📁 Struttura Essenziale

```
vincanto-backup/
├── api/unified.js              # 🔥 API COMPLETA
├── src/
│   ├── components/
│   │   ├── BookingSystemEnhanced.tsx
│   │   ├── BookingSteps.tsx
│   │   └── ExtraServices.tsx
│   ├── hooks/
│   │   ├── useBooking.ts
│   │   └── useExtraServices.ts
│   ├── pages/
│   │   └── AdminPanelPro.tsx
│   └── services/api.ts
├── .env                        # DATABASE_URL configurato
├── vercel.json
├── verify-system.mjs           # Script verifica
└── package.json
```

## 🗃️ Database

### Tabelle
- **bookings** - Prenotazioni
- **extra_services** - Servizi extra (con min_age/max_age)
- **blocked_dates** - Date bloccate

### Servizi Extra (8 configurati)
1. Late Check-out - €30
2. Early Check-in - €25
3. Pulizia Extra - €50
4. Colazione Italiana - €25
5. Transfer Aeroporto - €45 (disattivo)
6. **Culla per Bambini** - €20 (0-7 anni) ✅
7. Parcheggio Privato - €20
8. Kit Welcome - €25

## 🔌 API Endpoints

Base: `/api/unified?action=...`

- `booking` - GET/POST prenotazioni
- `extra-services` - GET/POST/PUT/DELETE servizi
- `dashboard-stats` - Statistiche
- `blocked-dates` - Date bloccate
- `health` - Health check

## ⚙️ Configurazioni TODO

### Email
```env
SMTP_HOST=smtp.gmail.com
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=app-password
```

### Pagamenti
```env
STRIPE_SECRET_KEY=sk_...
PAYPAL_CLIENT_ID=...
```

### Calendari
```env
AIRBNB_ICAL_URL=https://...
BOOKING_ICAL_URL=https://...
```

## 🧪 Testing

```bash
# Verifica completa
node verify-system.mjs
```

## 🚨 Troubleshooting

**Database non connette:**
```bash
node verify-system.mjs
# Verifica DATABASE_URL in .env
```

**Culla non appare:**
- Verifica età bambini 0-7
- Check API: `/api/unified?action=extra-services`

**Booking non salva:**
- DevTools → Network → Verifica response
- Check database con verify-system.mjs

---

**Versione**: 2.0.0 ✅  
**Ultimo Update**: 14 Nov 2025
