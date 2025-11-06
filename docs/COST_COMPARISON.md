# CONFRONTO COSTI: Servizi Esterni vs Vercel Pro vs Consolidamento

## SCENARIO VINCANTO (Casa Vacanza - 50 prenotazioni/mese)

### OPZIONE 1: SERVIZI ESTERNI
**Costi mensili:**
- Stripe: 50 prenotazioni × €150 medio × 2.9% = €217.50
- Supabase: Gratuito (sotto 50k utenti)
- SendGrid: Gratuito (sotto 100 email/giorno)
- Twilio SMS: 50 SMS × €0.07 = €3.50
- **TOTALE: €221/mese**

**API Vercel utilizzate:** 8/12 (4 libere per futuro)
**Complessità:** Bassa (servizi gestiti)

### OPZIONE 2: VERCEL PRO + API CUSTOM
**Costi mensili:**
- Vercel Pro: €20/mese
- Stripe: 50 × €150 × 2.9% = €217.50 (stesso di sopra)
- Database hosting: €10-20/mese (se non Vercel)
- **TOTALE: €247.50-267.50/mese**

**API Vercel:** Illimitate
**Complessità:** Alta (tutto custom)

### OPZIONE 3: CONSOLIDAMENTO API (HOBBY)
**Costi mensili:**
- Vercel: €0 (piano Hobby)
- Stripe: €217.50 (stesso)
- Database: Gratis se Neon/Supabase
- **TOTALE: €217.50/mese**

**API Vercel:** 8/12 (4 libere)
**Complessità:** Media (refactoring necessario)

## VINCITORE: OPZIONE 3 (Consolidamento) 🏆