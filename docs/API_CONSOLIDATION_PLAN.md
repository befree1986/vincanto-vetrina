# Piano di Consolidamento API Vincanto

## Consolidamenti Possibili (libererebbe 4 slots):

### 1. api/calendar-hub.js (consolida 3 API)
- calendar-sync.js
- booking-sync.js  
- availability-sync.js
- google-calendar.js
→ Endpoint: /api/calendar-hub?type=sync&action=...

### 2. api/business-logic.js (consolida 2 API)
- pricing.js
- quote.js
→ Endpoint: /api/business-logic?type=pricing&action=...

### 3. api/system-setup.js (consolida 2 API)  
- setup-calendars-db.js
- blocked-dates.js
→ Endpoint: /api/system-setup?type=calendar&action=...

## Risultato: 
- Da 12 API → 8 API
- Liberi 4 slots per pagamenti/sicurezza
- Struttura più organizzata