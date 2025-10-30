# 🎯 VINCANTO - GUIDA CONFIGURAZIONE PRODUZIONE

**Sistema di configurazione completo per la produzione Vercel**

---

## 🚀 CONFIGURAZIONE INIZIALE

Il sistema è ora **completamente pulito** da file mock e test. Per configurare Vincanto per la produzione:

### **1. Accedi al Setup**
Vai a: `https://vincanto-vetrina.vercel.app/admin/setup`

### **2. Configurazione Guidata**
Il sistema ti guiderà attraverso 6 step:

#### **📅 Step 1: Calendari**
- URL iCal Booking.com
- URL iCal Airbnb  
- URL iCal VRBO
- Sincronizzazione Google Calendar

#### **💳 Step 2: Pagamenti**
- **Stripe**: Inserire chiavi LIVE `pk_live_...` e `sk_live_...`
- **PayPal**: Client ID e Secret per ambiente LIVE
- **Bonifico**: Dati bancari reali IBAN/BIC

#### **💰 Step 3: Prezzi**
- Prezzo base per notte
- Tassa di pulizia
- Surcharge weekend
- Soggiorno minimo/massimo
- Orari check-in/out

#### **📧 Step 4: Email**
- Provider SMTP (Gmail raccomandato)
- Email amministratore
- Password app Gmail

#### **👤 Step 5: Admin**
- Email amministratore
- Password sicura

#### **✅ Step 6: Conferma**
- Riepilogo configurazione
- Test automatici
- Attivazione sistema

---

## 🔧 CONFIGURAZIONI MANUALI NECESSARIE

### **Database Vercel Postgres**
```bash
# Nel dashboard Vercel, crea database Postgres e aggiorna:
DATABASE_URL=postgres://username:password@host:port/vincanto_production
```

### **Stripe Live Keys**
1. Accedi a Stripe Dashboard
2. Attiva account Live
3. Copia le chiavi Live:
   - `pk_live_...` (Publishable Key)
   - `sk_live_...` (Secret Key)
   - `whsec_...` (Webhook Secret)

### **PayPal Live**
1. Accedi a PayPal Developer
2. Crea app per produzione
3. Ottieni credenziali LIVE

### **Google Calendar API**
1. Google Cloud Console
2. Abilita Calendar API
3. Crea credenziali OAuth 2.0
4. Configura redirect URI: `https://vincanto-vetrina.vercel.app/auth/google/callback`

### **Email Gmail**
1. Attiva autenticazione a 2 fattori
2. Genera "Password per le app"
3. Usa questa password nel setup

---

## 🎯 FILE DI CONFIGURAZIONE CREATI

### **.env.production** (Frontend)
Configurazione per build di produzione Vite

### **vincanto-backend/.env.production** (Backend)
Configurazione per deployment Vercel Functions

---

## 🔍 VERIFICA POST-SETUP

Dopo il setup, verifica:

### **✅ Test API**
```bash
curl https://vincanto-vetrina.vercel.app/api/admin/dashboard-stats
```

### **✅ Test Pagamenti**
- Stripe: Test con carte di credito reali
- PayPal: Test con account PayPal reale
- Bonifico: Verifica IBAN visualizzato

### **✅ Test Calendari**
- Sincronizzazione automatica
- Anti-overbooking
- Visualizzazione disponibilità

### **✅ Test Email**
- Notifiche admin
- Conferme prenotazione
- Email di pagamento

---

## 🚨 SICUREZZA PRODUZIONE

### **Credenziali Sicure**
- Password admin forte (min 12 caratteri)
- JWT secret univoco
- Chiavi API mai condivise

### **Rate Limiting**
- 100 richieste/15 min per IP
- 10 tentativi login/15 min
- Protection anti-DDoS

### **HTTPS Everywhere**
- Tutti i redirect forzati HTTPS
- Headers di sicurezza abilitati
- CORS configurato per dominio specifico

---

## 🎛️ ADMIN PANEL FUNZIONALITÀ

Una volta configurato, avrai accesso a:

### **📊 Dashboard**
- Statistiche prenotazioni
- Revenue tracking
- Calendario occupazione

### **📋 Prenotazioni**
- Gestione completa
- Stati (pending/confirmed/cancelled)
- Dettagli cliente

### **💰 Pagamenti**
- Tracking transazioni
- Rimborsi
- Report finanziari

### **📅 Calendario**
- Visualizzazione unificata
- Sync multi-piattaforma
- Blocchi manuali

### **⚙️ Impostazioni**
- Prezzi dinamici
- Regole prenotazione
- Configurazione email

---

## 🔄 DEPLOY AUTOMATICO

Il sistema è configurato per:
- **Build automatico** su push a master
- **Deploy Vercel** seamless
- **Database migration** automatiche
- **Backup** configurazioni

---

## 📞 SUPPORTO

Una volta attivato il sistema, avrai:
- Sistema **100% funzionale**
- **Zero mock data**
- **Produzione ready**
- **Scalabile Vercel**

**Il tuo Vincanto è pronto per accogliere i primi ospiti!** 🏠✨