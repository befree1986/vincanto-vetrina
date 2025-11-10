# 🔧 CONFIGURAZIONE VERCEL ENVIRONMENT VARIABLES

Per abilitare la sincronizzazione calendario reale, devi aggiungere queste variabili d'ambiente nel dashboard Vercel:

## 📝 ISTRUZIONI VERCEL SETUP

1. **Vai su Vercel Dashboard**: https://vercel.com/dashboard
2. **Seleziona il progetto**: vincanto-backup
3. **Settings** > **Environment Variables**
4. **Aggiungi le seguenti variabili**:

### 🗓️ CALENDAR SYNC VARIABLES

```
AIRBNB_ICAL_URL
Value: https://calendar.google.com/calendar/ical/en.italian%23holiday%40group.v.calendar.google.com/public/basic.ics
Environment: Production, Preview, Development

BOOKING_ICAL_URL  
Value: https://calendar.google.com/calendar/ical/en.italian%23holiday%40group.v.calendar.google.com/public/basic.ics
Environment: Production, Preview, Development

VRBO_ICAL_URL
Value: https://calendar.google.com/calendar/ical/en.italian%23holiday%40group.v.calendar.google.com/public/basic.ics  
Environment: Production, Preview, Development

DATABASE_URL
Value: postgresql://neondb_owner:npg_5TBySVaU7Ktf@ep-sweet-glitter-ag53yugd-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require
Environment: Production, Preview, Development

CALENDAR_TIMEZONE
Value: Europe/Rome
Environment: Production, Preview, Development
```

## 🔄 DOPO LA CONFIGURAZIONE

1. **Redeploy**: Vercel farà automaticamente redeploy
2. **Test**: Prova `POST /api/calendar-sync` 
3. **Verifica**: Controlla `GET /api/calendar-sync` per status

## 🎯 URL REALI PER PRODUZIONE

Quando avrai accesso ai calendari reali, sostituisci con:

```
# Airbnb - Ottieni da: Host Dashboard > Calendar > Export
AIRBNB_ICAL_URL=https://www.airbnb.it/calendar/ical/[YOUR_LISTING_ID].ics

# Booking.com - Ottieni da: Partner Hub > Calendar > Export  
BOOKING_ICAL_URL=https://admin.booking.com/hotel/hoteladmin/calendar/ical.xml?[YOUR_PARAMS]

# VRBO - Ottieni da: Owner Dashboard > Calendar > Export
VRBO_ICAL_URL=https://www.vrbo.com/icalendar/[YOUR_PROPERTY_ID]/calendar.ics
```

## 🔑 GOOGLE CALENDAR (OPZIONALE)

Per Google Calendar bidirezionale:
```
GOOGLE_CALENDAR_CLIENT_ID=[from Google Cloud Console]
GOOGLE_CALENDAR_CLIENT_SECRET=[from Google Cloud Console] 
GOOGLE_CALENDAR_REFRESH_TOKEN=[from OAuth2 flow]
GOOGLE_CALENDAR_ID=[your calendar ID]
```

Configurando queste variabili, la sincronizzazione calendario diventerà completamente operativa!