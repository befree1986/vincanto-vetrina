# API UNIFICATE VINCANTO - DOCUMENTAZIONE

## 🚀 **RIDUZIONE DA 17 A 4 API PER VERCEL HOBBY**

Per rispettare il limite di 12 Serverless Functions di Vercel Hobby, abbiamo unificato tutte le API in 4 endpoint principali.

---

## 📋 **API DISPONIBILI**

### 1. **`/api/pricing.js`** - Gestione Prezzi
Unifica: `pricing.js`, `pricing-groups.js`, `quote.js`, `quote-groups.js`

**Endpoints:**
- `GET /api/pricing?action=config` - Configurazione prezzi
- `GET /api/pricing?action=calculate&guests=4&nights=3` - Calcolo prezzo
- `GET /api/pricing?action=quote&checkIn=2025-01-15&checkOut=2025-01-18&guests=4` - Preventivo completo

**Esempio:**
```javascript
// Calcolo prezzo 4 persone, 3 notti
fetch('/api/pricing?action=calculate&guests=4&nights=3')
  .then(res => res.json())
  .then(data => console.log(data.pricing));
```

---

### 2. **`/api/admin.js`** - Gestione Amministrativa
Unifica: `admin.js`, `update-pricing.js`, `force-pricing-reset.js`, `cleanup-database.js`, `extra-services.js`

**Endpoints:**
- `POST /api/admin?action=login` - Login admin
- `GET /api/admin?action=settings` - Carica impostazioni
- `POST /api/admin?action=settings` - Salva impostazioni
- `POST /api/admin?action=update-pricing` - Aggiorna prezzi
- `POST /api/admin?action=reset-pricing` - Reset prezzi default
- `POST /api/admin?action=cleanup-database` - Pulizia database
- `GET /api/admin?action=extra-services` - Lista servizi extra
- `POST /api/admin?action=extra-services` - Crea/aggiorna servizio
- `DELETE /api/admin?action=extra-services&id=X` - Elimina servizio

**Esempio:**
```javascript
// Aggiorna prezzi
fetch('/api/admin?action=update-pricing', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    basePrice: 75,
    additionalGuest3to4: 30,
    additionalGuest5to6: 25,
    additionalGuest7to8: 20
  })
});
```

---

### 3. **`/api/booking.js`** - Gestione Prenotazioni
Unifica: `booking.js`, `availability.js`, `blocked-dates.js`

**Endpoints:**
- `GET /api/booking?action=availability&checkIn=X&checkOut=Y` - Verifica disponibilità
- `GET /api/booking?action=blocked-dates` - Lista date bloccate
- `POST /api/booking?action=blocked-dates` - Blocca date
- `DELETE /api/booking?action=blocked-dates&date=X` - Sblocca data
- `POST /api/booking?action=create` - Crea prenotazione
- `GET /api/booking?action=list` - Lista prenotazioni
- `POST /api/booking?action=update-status` - Aggiorna status prenotazione

**Esempio:**
```javascript
// Verifica disponibilità
fetch('/api/booking?action=availability&checkIn=2025-01-15&checkOut=2025-01-18')
  .then(res => res.json())
  .then(data => console.log(data.available));
```

---

### 4. **`/api/utilities.js`** - Servizi Vari
Unifica: `calendar-hub.js`, `google-calendar.js`, `setup-calendars-db.js`, `tourist-tax.js`

**Endpoints:**
- `POST /api/utilities?action=calendar-setup` - Setup tabelle calendario
- `GET /api/utilities?action=calendar-events` - Lista eventi calendario
- `POST /api/utilities?action=calendar-events` - Crea evento
- `GET /api/utilities?action=tourist-tax&guests=4&nights=3` - Calcola tassa soggiorno
- `GET /api/utilities?action=google-calendar` - Stato sincronizzazione Google
- `POST /api/utilities?action=google-calendar` - Configura Google Calendar
- `GET /api/utilities?action=health` - Health check

**Esempio:**
```javascript
// Calcola tassa di soggiorno
fetch('/api/utilities?action=tourist-tax&guests=4&nights=3&childrenAges=[8,10]')
  .then(res => res.json())
  .then(data => console.log(data.touristTax));
```

---

## 🔄 **MIGRAZIONE DAL VECCHIO SISTEMA**

### **Sostituzioni API:**

**PRIMA (17 API):**
```javascript
// Vecchio sistema
fetch('/api/pricing-groups?guests=4&nights=3')
fetch('/api/quote-groups?checkIn=X&checkOut=Y&guests=4')
fetch('/api/admin-settings')
fetch('/api/update-pricing')
fetch('/api/availability?checkIn=X&checkOut=Y')
```

**DOPO (4 API):**
```javascript
// Nuovo sistema unificato
fetch('/api/pricing?action=calculate&guests=4&nights=3')
fetch('/api/pricing?action=quote&checkIn=X&checkOut=Y&guests=4')
fetch('/api/admin?action=settings')
fetch('/api/admin?action=update-pricing')
fetch('/api/booking?action=availability&checkIn=X&checkOut=Y')
```

---

## ⚙️ **SISTEMA PREZZI BASE + AGGIUNTIVE**

**Logica Implementata:**
- **Base:** €75/persona × 2 = €150/notte (1-2 persone)
- **3-4 persone:** +€30/persona aggiuntiva
- **5-6 persone:** +€25/persona aggiuntiva  
- **7-8 persone:** +€20/persona aggiuntiva

**Esempio 4 persone × 3 notti:**
```
Base 2 persone: €75 × 2 = €150
Aggiuntive 3-4: 2 × €30 = €60
----------------------------
Totale notte: €210
3 notti: €210 × 3 = €630
+ Tassa soggiorno: €24
+ Pulizie: €50
----------------------------
TOTALE: €704
```

---

## 🎯 **VANTAGGI UNIFICAZIONE**

✅ **Riduzione Functions:** Da 17 a 4 API  
✅ **Vercel Hobby Compatible:** Sotto il limite di 12 functions  
✅ **Logica Centralizzata:** Calcoli prezzi unificati  
✅ **Manutenzione Semplificata:** Meno file da gestire  
✅ **Performance Migliore:** Meno cold starts  
✅ **Compatibilità Completa:** Mantiene tutte le funzionalità  

---

## 🚀 **DEPLOYMENT**

Le API unificate sono **pronte per il deploy** su Vercel Hobby senza limiti di functions!

```bash
git add .
git commit -m "MAJOR: API unificate per Vercel Hobby - Da 17 a 4 functions"
git push origin master
```