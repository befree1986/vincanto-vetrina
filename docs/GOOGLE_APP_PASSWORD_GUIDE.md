# Google App Password - Guida Completa

## 🔐 Cos'è una App Password?

Le App Password sono codici di 16 caratteri che permettono ad app meno sicure (come nodemailer) di accedere al tuo account Google senza usare la password principale.

## 📝 Come Crearla (Passo per Passo)

### Step 1: Attiva la Verifica in Due Passaggi
1. Vai su: https://myaccount.google.com/security
2. Scorri fino a "Accesso a Google"
3. Click su **"Verifica in due passaggi"**
4. Segui la procedura per attivarla (SMS o App Authenticator)

### Step 2: Genera l'App Password
1. Vai su: https://myaccount.google.com/apppasswords
   - **Oppure**: Google Account → Sicurezza → Verifica in due passaggi → App password (in fondo)
2. Potrebbe chiederti di reinserire la password
3. Nella pagina "App password":
   - **Seleziona app**: Scegli "Posta"
   - **Seleziona dispositivo**: Scegli "Altro (nome personalizzato)"
   - **Nome**: Scrivi "Vincanto Admin Panel"
4. Click su **"Genera"**
5. **IMPORTANTE**: Copia il codice a 16 caratteri (es: `abcd efgh ijkl mnop`)

### Step 3: Configurala su Vercel

1. Vai su: https://vercel.com/befree1986/vincanto-vetrina/settings/environment-variables
2. Aggiungi/Modifica queste variabili:

```
SMTP_HOST = smtp.gmail.com
SMTP_PORT = 587
SMTP_USER = tua-email@gmail.com
SMTP_PASS = abcdefghijklmnop  (i 16 caratteri SENZA spazi)
SMTP_SECURE = false
```

3. **IMPORTANTE**: Rimuovi gli spazi dall'App Password quando la incolli:
   - ❌ Errato: `abcd efgh ijkl mnop`
   - ✅ Corretto: `abcdefghijklmnop`

4. Click su **"Save"**
5. Vercel farà un redeploy automatico (aspetta 1-2 minuti)

## 🧪 Test della Configurazione

Dopo il redeploy, testa con:
```bash
node scripts/quick-api-test.mjs
```

Oppure via browser:
```
https://vincantomaiori.it/api/emails?action=test
```

Dovresti vedere:
```json
{
  "success": true,
  "message": "Connessione SMTP verificata"
}
```

## ⚠️ Problemi Comuni

### Errore: "Invalid login"
- L'App Password non è corretta
- Hai copiato con gli spazi → Rimuovili
- Non hai attivato la Verifica in Due Passaggi

### Errore: "Missing credentials"
- SMTP_USER o SMTP_PASS non sono configurate su Vercel
- Controlla che le variabili esistano nella dashboard Vercel

### Errore: "Connection timeout"
- SMTP_PORT deve essere 587 (non 465)
- SMTP_SECURE deve essere "false"

## 🔒 Sicurezza

- ✅ Le App Password sono sicure e revocabili
- ✅ Non danno accesso completo all'account
- ✅ Puoi revocarle in qualsiasi momento da: https://myaccount.google.com/apppasswords
- ❌ NON usare mai la password principale dell'account

## 📚 Riferimenti

- Guida Google ufficiale: https://support.google.com/accounts/answer/185833
- Nodemailer Gmail: https://nodemailer.com/usage/using-gmail/
