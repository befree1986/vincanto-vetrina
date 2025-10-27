# ISTRUZIONI SETUP VERCEL DATABASE

## ⚠️ IMPORTANTE: CONFIGURARE DATABASE_URL SU VERCEL

Il sito è bianco perché manca la variabile d'ambiente DATABASE_URL su Vercel.

### 🔧 PROCEDURA SETUP:

1. **Vai su Vercel Dashboard**: https://vercel.com/dashboard
2. **Seleziona il progetto**: vincanto-backup o vincanto-vetrina
3. **Vai in Settings > Environment Variables**
4. **Aggiungi questa variabile**:

   **Name:** `DATABASE_URL`
   **Value:** `postgresql://neondb_owner:npg_5TBySVaU7Ktf@ep-sweet-glitter-ag53yugd-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require`
   **Environment:** Production (e opzionalmente Preview/Development)

5. **Clicca "Save"**
6. **Redeploy**: Vai su Deployments > click sui 3 puntini dell'ultimo deploy > "Redeploy"

### 🚀 DOPO IL SETUP:
- ✅ Il pannello admin sarà completamente funzionale
- ✅ Nessun dato demo, solo dati reali dal database
- ✅ Tutte le modifiche saranno persistenti
- ✅ Sistema 100% operativo per test autonomi

### 📱 URL FINALE:
- **Sito:** https://vincanto-backup-fni9ydy7a-giuseppes-projects-d960f976.vercel.app
- **Admin:** https://vincanto-backup-fni9ydy7a-giuseppes-projects-d960f976.vercel.app/admin

## ⚡ ALTERNATIVA RAPIDA:
Esegui da terminale: `npx vercel env add DATABASE_URL production`
E incolla il valore del database quando richiesto.