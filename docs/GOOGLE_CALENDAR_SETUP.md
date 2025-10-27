# 🗓️ Google Calendar API Integration Guide

## Configurazione Google Cloud Console

### 1. Crea/Configura Progetto Google Cloud

1. Vai su [Google Cloud Console](https://console.cloud.google.com/)
2. Crea un nuovo progetto o seleziona uno esistente
3. Assicurati che la fatturazione sia abilitata (necessaria per le API)

### 2. Abilita Google Calendar API

1. Nella console, vai su **APIs & Services > Library**
2. Cerca "Google Calendar API"
3. Clicca su "Google Calendar API" e premi **ENABLE**

### 3. Configura OAuth 2.0 Credentials

1. Vai su **APIs & Services > Credentials**
2. Clicca **+ CREATE CREDENTIALS > OAuth client ID**
3. Se richiesto, configura prima la **OAuth consent screen**:
   - **User Type**: External (per uso pubblico) o Internal (solo Google Workspace)
   - **App name**: Vincanto Calendar Integration
   - **User support email**: il tuo email
   - **Developer contact info**: il tuo email
   - **Scopes**: Aggiungi `https://www.googleapis.com/auth/calendar`

4. Crea OAuth client ID:
   - **Application type**: Web application
   - **Name**: Vincanto Calendar Client
   - **Authorized JavaScript origins**: 
     - `http://localhost:5173` (sviluppo)
     - `http://localhost:5174` (sviluppo)
     - `http://localhost:5175` (sviluppo)
     - `https://tuodominio.com` (produzione)
   - **Authorized redirect URIs**:
     - `http://localhost:5173/oauth/callback`
     - `http://localhost:5174/oauth/callback`  
     - `http://localhost:5175/oauth/callback`
     - `https://tuodominio.com/oauth/callback`

### 4. Scarica Credenziali

1. Dopo aver creato le credenziali, scarica il file JSON
2. Copia il **Client ID** e **Client Secret**

## Configurazione Ambiente

### 1. File .env

Crea un file `.env` nella root del progetto:

```bash
# Google Calendar API
REACT_APP_GOOGLE_CLIENT_ID=942707810608-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx.apps.googleusercontent.com
REACT_APP_GOOGLE_CLIENT_SECRET=GOCSPX-xxxxxxxxxxxxxxxxxxxxxxxx
REACT_APP_GOOGLE_REDIRECT_URI=http://localhost:5175/oauth/callback

# Configurazioni opzionali
REACT_APP_GOOGLE_CALENDAR_ID=vincantomaiori@gmail.com
REACT_APP_CALENDAR_TIMEZONE=Europe/Rome
```

⚠️ **IMPORTANTE**: Non committare mai il file `.env` con le credenziali reali!

### 2. Produzione

Per la produzione, configura le variabili d'ambiente nel tuo hosting:
- Vercel: Dashboard > Settings > Environment Variables  
- Netlify: Site Settings > Environment Variables
- Altri: Segui la documentazione del provider

## Test dell'Integrazione

### 1. Avvia il Server di Sviluppo

```bash
npm run dev
```

### 2. Accedi al Pannello Admin

1. Vai su `http://localhost:5175/admin`
2. Login con password: `vincanto2025`
3. Vai nella sezione **Calendari**
4. Troverai il componente di **Autenticazione Google Calendar**

### 3. Processo di Autenticazione

1. Clicca **"Connetti Google Calendar"**
2. Verrai reindirizzato a Google per l'autorizzazione
3. Accetta i permessi richiesti
4. Verrai reindirizzato indietro all'admin panel
5. Dovresti vedere "✅ Connesso a Google Calendar"

### 4. Test Funzionalità

- **Test Connessione**: Verifica che le API funzionino
- **Visualizza Eventi**: I tuoi eventi Google Calendar dovrebbero apparire
- **Crea Evento**: Testa la sincronizzazione bidirezionale

## Funzionalità Implementate

### 📖 Lettura Eventi
- ✅ Recupero eventi esistenti dal calendario
- ✅ Parsing automatico delle informazioni
- ✅ Rilevamento piattaforma di booking (Airbnb, Booking.com, etc.)
- ✅ Fallback ai dati mock se non autenticato

### ✏️ Scrittura Eventi  
- ✅ Creazione nuovi eventi calendario
- ✅ Aggiornamento eventi esistenti
- ✅ Eliminazione eventi (solo quelli creati dall'app)
- ✅ Sincronizzazione prenotazioni con colori per piattaforma

### 🔐 Autenticazione
- ✅ OAuth 2.0 completo con Google
- ✅ Gestione automatica refresh token
- ✅ Salvataggio sicuro token in localStorage
- ✅ Controllo scadenza e rinnovo automatico

### 📊 Dashboard & Analytics
- ✅ Statistiche in tempo reale
- ✅ Calcolo tasso di occupazione
- ✅ Ricavi per periodo
- ✅ Previsioni occupazione

## Struttura Codice

```
src/
├── services/
│   ├── googleCalendarApiService.ts     # Servizio API completo con OAuth2
│   ├── googleCalendarService.ts        # Servizio legacy (ICS)
│   └── mockBookingService.ts           # Dati mock per demo
├── components/
│   └── GoogleCalendarAuth.tsx          # Componente autenticazione
├── hooks/
│   └── useGoogleCalendar.ts            # Hook personalizzato
├── pages/
│   ├── AdminPanelPro.tsx              # Admin panel principale  
│   └── OAuthCallback.tsx              # Pagina callback OAuth
└── .env.example                       # Template variabili ambiente
```

## Sicurezza

### ⚠️ Considerazioni Importanti

1. **Client Secret**: In produzione, dovrebbe essere gestito lato server
2. **Token Storage**: I token sono salvati in localStorage (considerare alternative più sicure per produzione)
3. **HTTPS**: In produzione, usare sempre HTTPS per OAuth
4. **Scopes**: Richiedi solo i permessi necessari

### 🛡️ Best Practices

- Non esporre mai le credenziali nel codice
- Usa variabili d'ambiente per tutte le configurazioni
- Implementa gestione errori robusta
- Monitora l'uso delle API per evitare rate limiting
- Considera l'implementazione di un proxy server per maggiore sicurezza

## Troubleshooting

### Errori Comuni

1. **"Invalid client ID"**
   - Verifica che il Client ID sia corretto in `.env`
   - Controlla che il dominio sia autorizzato in Google Console

2. **"Redirect URI mismatch"**
   - Assicurati che l'URI di redirect in `.env` corrisponda a quello in Google Console
   - Verifica che non ci siano spazi o caratteri extra

3. **"Access blocked"**
   - Completa la configurazione OAuth consent screen
   - Aggiungi gli utenti test se l'app è in modalità testing

4. **"Token expired"**
   - L'app gestisce automaticamente il refresh
   - Se persiste, disconnetti e riautentica

### Log e Debug

Il sistema include logging dettagliato:
- Controlla la console del browser per errori
- I messaggi sono prefissati con emoji per facile identificazione
- Errori di rete mostrano dettagli specifici

## Prossimi Passi

1. **Backend Integration**: Creare endpoint API per persistenza
2. **Webhook Integration**: Ricevere notifiche per modifiche calendario
3. **Batch Operations**: Operazioni multiple ottimizzate
4. **Advanced Analytics**: Dashboard più avanzata con grafici
5. **Multi-Calendar Support**: Supporto per calendari multipli

---

## 📞 Supporto

Per problemi o domande:
1. Controlla i log della console del browser
2. Verifica la configurazione OAuth in Google Console  
3. Assicurati che le variabili d'ambiente siano corrette
4. Testa prima in ambiente di sviluppo

## 🎯 Status Integrazione

- ✅ **OAuth2 Authentication**: Implementato e testato
- ✅ **Read Events**: Funzionante con fallback mock
- ✅ **Create Events**: Implementato con sincronizzazione
- ✅ **Update/Delete Events**: Funzionalità complete
- ✅ **Admin UI Integration**: Interfaccia utente completa
- 🔄 **Backend API**: In sviluppo (prossimo step)
- 🔄 **Production Deploy**: Da configurare con credenziali reali