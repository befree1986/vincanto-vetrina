# ⚙️ Configurazione Variabili d'Ambiente Vercel

## 🚀 Setup Rapido (5 minuti)

### 1. Accedi a Vercel Dashboard
```
https://vercel.com/befree1986/vincanto-vetrina/settings/environment-variables
```

### 2. Aggiungi Variabili d'Ambiente

#### 💳 Stripe (Obbligatorio per pagamenti)
```env
STRIPE_SECRET_KEY=sk_live_xxxxxxxxxxxxxxxxxxxxx
STRIPE_PUBLISHABLE_KEY=pk_live_xxxxxxxxxxxxxxxxxxxxx
```

**Dove trovarle:**
1. Vai su https://dashboard.stripe.com/apikeys
2. Copia "Secret key" e "Publishable key"
3. Per testing usa `sk_test_xxx` e `pk_test_xxx`

#### ✉️ SMTP Gmail (Obbligatorio per email)
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=tua-email@gmail.com
SMTP_PASS=xxxx xxxx xxxx xxxx
```

**Come ottenere SMTP_PASS (App Password):**
1. Vai su https://myaccount.google.com/security
2. Abilita "2-Step Verification"
3. Vai su "App passwords" → Genera
4. Seleziona "Mail" e "Windows Computer"
5. Copia la password generata (16 caratteri)

**Alternative a Gmail:**
- **SendGrid**: SMTP_HOST=smtp.sendgrid.net, SMTP_USER=apikey, SMTP_PASS=[your-api-key]
- **Mailgun**: SMTP_HOST=smtp.mailgun.org, SMTP_USER=[username], SMTP_PASS=[password]

#### 💰 PayPal (Opzionale)
```env
PAYPAL_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxx
PAYPAL_CLIENT_SECRET=xxxxxxxxxxxxxxxxxxxxx
PAYPAL_MODE=sandbox
```

**Dove trovarle:**
1. Vai su https://developer.paypal.com/dashboard
2. My Apps & Credentials → Create App
3. Copia Client ID e Secret
4. Per produzione: cambia `PAYPAL_MODE=live`

### 3. Redeploy Vercel

Dopo aver aggiunto le variabili:

**Via Dashboard:**
1. Vai su Deployments tab
2. Click sui tre puntini (•••) dell'ultimo deploy
3. Click "Redeploy"

**Via CLI:**
```bash
vercel --prod
```

## 🧪 Test Configurazione

### Test Locale (con .env.local)
```bash
# Crea .env.local nella root del progetto
cp .env.example .env.local

# Modifica con le tue credenziali
nano .env.local

# Testa
node scripts/test-admin-apis.mjs
```

### Test Produzione
```bash
# Imposta URL di produzione
export VERCEL_URL=https://vincantomaiori.it

# Esegui test
node scripts/test-admin-apis.mjs
```

## ✅ Checklist Verifica

- [ ] `DATABASE_URL` - Già configurato ✓
- [ ] `STRIPE_SECRET_KEY` - Per pagamenti
- [ ] `STRIPE_PUBLISHABLE_KEY` - Per frontend Stripe
- [ ] `SMTP_HOST` - Per email
- [ ] `SMTP_PORT` - Per email
- [ ] `SMTP_USER` - Per email
- [ ] `SMTP_PASS` - Per email (App Password)
- [ ] `PAYPAL_CLIENT_ID` - Opzionale
- [ ] `PAYPAL_CLIENT_SECRET` - Opzionale

## 🔍 Troubleshooting

### Errore: "SMTP connection failed"
- ✅ Verifica che SMTP_PASS sia una App Password (non la password Gmail normale)
- ✅ Verifica 2FA attivato su Gmail
- ✅ Prova con SendGrid o Mailgun come alternativa

### Errore: "Stripe API key invalid"
- ✅ Usa chiavi test (sk_test_xxx) per testing
- ✅ Verifica che le chiavi siano copiate completamente
- ✅ Controlla su https://dashboard.stripe.com/apikeys

### Email non arrivano
- ✅ Controlla spam/posta indesiderata
- ✅ Verifica email_logs table nel database
- ✅ Testa SMTP con Admin Panel → Email → Test Invio

### Pagamenti non funzionano
- ✅ Verifica payment_transactions table esista
- ✅ Controlla Stripe Dashboard per eventi
- ✅ Usa Stripe test cards: 4242 4242 4242 4242

## 📊 Monitoring

### Vercel Logs
```
https://vercel.com/befree1986/vincanto-vetrina/logs
```

### Database Query (Neon Console)
```sql
-- Check email logs
SELECT * FROM email_logs ORDER BY created_at DESC LIMIT 10;

-- Check payments
SELECT * FROM payment_transactions ORDER BY created_at DESC LIMIT 10;

-- Check notifications
SELECT * FROM notifications WHERE read = false ORDER BY created_at DESC;

-- Check analytics
SELECT * FROM analytics ORDER BY date DESC LIMIT 7;
```

## 🎯 Test Rapidi

### 1. Test SMTP
```bash
curl -X GET "https://vincantomaiori.it/api/emails?action=test"
```

### 2. Test Stripe
```bash
curl -X POST "https://vincantomaiori.it/api/payments?action=create-intent" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 10,
    "booking_id": 1,
    "customer_email": "test@example.com",
    "customer_name": "Test"
  }'
```

### 3. Test Analytics
```bash
curl "https://vincantomaiori.it/api/analytics?action=get-summary&days=30"
```

## 🔐 Sicurezza

**IMPORTANTE:**
- ❌ NON committare mai le chiavi nel repository
- ✅ Usa solo variabili d'ambiente Vercel
- ✅ Ruota le chiavi regolarmente
- ✅ Usa chiavi test per sviluppo
- ✅ Abilita Stripe webhooks per notifiche real-time

---

**Setup completato?** Passa ai test funzionali nel pannello admin! 🚀
