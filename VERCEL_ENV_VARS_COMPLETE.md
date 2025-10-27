# Configurazione variabili d'ambiente per Vercel - AMMINISTRAZIONE COMPLETA

## Per configurare su Vercel Dashboard:

### 1. Database
DATABASE_URL=postgresql://neondb_owner:npg_5TBySVaU7Ktf@ep-sweet-glitter-ag53yugd-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require

### 2. Configurazione App
NODE_ENV=production

### 3. Email (opzionali - per futuro sistema email)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password

### 4. Pagamenti (opzionali - per futuro sistema pagamenti)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
PAYPAL_CLIENT_ID=your_paypal_client_id
PAYPAL_CLIENT_SECRET=your_paypal_client_secret

## IMPORTANTE:
## 1. Copiare DATABASE_URL su Vercel Dashboard > Settings > Environment Variables
## 2. Il sistema admin è ora 100% operativo con database reale
## 3. Tutti i dati sono persistenti e modificabili dall'admin panel