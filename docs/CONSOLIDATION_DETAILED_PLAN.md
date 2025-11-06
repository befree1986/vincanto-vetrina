# Piano Consolidamento API Vincanto
# Obiettivo: Da 12 API → 8 API (libera 4 slots)

## CONSOLIDAMENTO 1: Calendar Hub
**File risultante:** `api/calendar-hub.js`
**API unificate:**
- calendar-sync.js
- booking-sync.js  
- availability-sync.js
- google-calendar.js

**Nuove chiamate:**
- `/api/calendar-hub?service=sync&action=list`
- `/api/calendar-hub?service=availability&action=check&startDate=X&endDate=Y`
- `/api/calendar-hub?service=booking-sync&action=sync`
- `/api/calendar-hub?service=google&action=auth`

**Risparmio: 4 → 1 = -3 functions**

## CONSOLIDAMENTO 2: Business Logic Hub  
**File risultante:** `api/business-hub.js`
**API unificate:**
- pricing.js
- quote.js

**Nuove chiamate:**
- `/api/business-hub?service=pricing&action=calculate`
- `/api/business-hub?service=quote&action=generate`

**Risparmio: 2 → 1 = -1 function**

## CONSOLIDAMENTO 3: System Hub
**File risultante:** `api/system-hub.js` 
**API unificate:**
- setup-calendars-db.js
- blocked-dates.js

**Nuove chiamate:**
- `/api/system-hub?service=setup&action=calendars`  
- `/api/system-hub?service=blocked-dates&action=list`

**Risparmio: 2 → 1 = -1 function**

## RISULTATO FINALE:
- **Prima:** 12 functions (limite raggiunto)
- **Dopo:** 7 functions  
- **Spazio libero:** 5 functions per pagamenti/sicurezza
- **APIs rimanenti:** admin.js, availability.js, booking.js, extra-services.js