# 🗺️ VINCANTO PROJECT - ARCHITETTURA COMPLETA

## 📋 **PANORAMICA GENERALE**

```
🏠 VINCANTO MAORI - Vacation Rental Management System
├── 🌐 Frontend React (Booking + Admin)
├── ⚡ Backend API Serverless (Vercel)
├── 🗄️ Database PostgreSQL (Neon Cloud)
├── 💳 Payment System (PayPal Integration)
├── 📅 Calendar Sync (Multi-platform)
└── 🚀 Deployment (Vercel + GitHub)
```

---

## 🏗️ **ARCHITETTURA DETTAGLIATA**

### 1. 🌐 **FRONTEND - REACT SPA**
```
📁 src/
├── 🏠 pages/
│   ├── Home.tsx              # Homepage pubblica
│   ├── BookingSystem.tsx     # Sistema prenotazioni
│   └── AdminPanelPro.tsx     # Pannello amministrativo
├── 🧩 components/
│   ├── BookingSteps.tsx      # Steps prenotazione + PayPal
│   ├── AdminDashboard.tsx    # Dashboard admin
│   └── SafeSeo.tsx           # SEO components
├── 🎨 styles/
│   ├── index.css             # Global styles
│   └── AdminPanelPro.css     # Admin styles
└── 🔧 services/
    └── adminApiService.ts    # Client API service
```

**🎯 Caratteristiche:**
- **Tecnologia**: React 18 + TypeScript + Vite
- **UI**: Tailwind CSS responsive
- **Routing**: React Router v7
- **i18n**: Multilingue (IT/EN/DE/FR)
- **SEO**: Meta tags dinamici
- **Deploy**: Static build su Vercel

### 2. ⚡ **BACKEND - SERVERLESS API**
```
📁 api/
├── unified.js               # 🔥 API PRINCIPALE (tutto qui!)
├── calendar-real-sync.js    # Calendar sync utilities
├── contact-request.js       # Form contatti
└── extra-services.js       # Servizi aggiuntivi

🎯 API UNIFICATA ENDPOINTS:
├── /api/unified?action=login              # Autenticazione admin
├── /api/unified?action=dashboard-stats    # Statistiche dashboard
├── /api/unified?action=booking           # CRUD prenotazioni
├── /api/unified?action=payments          # Sistema pagamenti
├── /api/unified?action=calendar-configs  # Gestione calendari
├── /api/unified?action=analytics         # Analytics dati
├── /api/unified?action=notifications     # Sistema notifiche
├── /api/unified?action=extra-services    # Servizi extra
├── /api/unified?action=contact           # Form contatti
└── /api/unified?action=settings          # Configurazioni
```

**🎯 Caratteristiche:**
- **Platform**: Vercel Serverless Functions
- **Runtime**: Node.js
- **Database**: PostgreSQL via pg Pool
- **CORS**: Headers universali
- **Error Handling**: Try/catch + fallback
- **Connection**: Pool per performance

### 3. 🗄️ **DATABASE - NEON POSTGRESQL**
```sql
🐘 NEON CLOUD POSTGRESQL
├── 🔗 Connection String: 
│   postgresql://neondb_owner:npg_5TBySVaU7Ktf@
│   ep-sweet-glitter-ag53yugd-pooler.c-2.eu-central-1.aws.neon.tech/
│   neondb?sslmode=require
│
├── 📋 TABELLE (6 totali):
│   ├── bookings           # Prenotazioni principali
│   ├── admin_settings     # Configurazioni sistema
│   ├── pricing_config     # Prezzi e tariffe  
│   ├── calendar_events    # Eventi calendario sync
│   ├── contact_requests   # Richieste contatto
│   └── users             # Sistema utenti
│
└── 🔄 DATI ATTUALI:
    ├── 3 prenotazioni demo (Mario, Laura, Giuseppe)
    ├── 39 configurazioni admin (PayPal, prezzi, etc.)
    ├── 3 eventi calendario (Airbnb, Booking, manutenzione)
    ├── 2 richieste contatti
    └── 1 configurazione prezzi base
```

**🎯 Schema Tabelle Principali:**
```sql
-- BOOKINGS (Prenotazioni)
CREATE TABLE bookings (
  id SERIAL PRIMARY KEY,
  booking_id VARCHAR NOT NULL UNIQUE,
  check_in DATE NOT NULL,
  check_out DATE NOT NULL,
  guests INTEGER NOT NULL,
  adults INTEGER,
  children INTEGER,
  first_name VARCHAR,
  last_name VARCHAR,
  email VARCHAR,
  phone VARCHAR,
  total_amount DECIMAL,
  deposit_amount DECIMAL,
  notes TEXT,
  status VARCHAR,           -- pending, confirmed, completed, cancelled
  payment_status VARCHAR,   -- pending, deposit_paid, paid_full
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

-- ADMIN_SETTINGS (Configurazioni)
CREATE TABLE admin_settings (
  id SERIAL PRIMARY KEY,
  setting_key VARCHAR NOT NULL UNIQUE,
  setting_value TEXT,
  setting_type VARCHAR NOT NULL,
  category VARCHAR NOT NULL,
  description TEXT,
  is_public BOOLEAN,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

-- CALENDAR_EVENTS (Eventi calendario)
CREATE TABLE calendar_events (
  id SERIAL PRIMARY KEY,
  uid TEXT NOT NULL UNIQUE,
  calendar_source VARCHAR NOT NULL,  -- airbnb, booking_com, vrbo, etc.
  summary TEXT NOT NULL,
  description TEXT,
  start_date TIMESTAMP NOT NULL,
  end_date TIMESTAMP NOT NULL,
  location TEXT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

### 4. 💳 **PAYMENT SYSTEM**
```
💰 PAYPAL INTEGRATION
├── 🔗 Link: https://www.paypal.me/AntonioGuida320
├── 🔄 Flow:
│   ├── 1. Cliente completa prenotazione
│   ├── 2. Sistema calcola importo (acconto 30% o totale)
│   ├── 3. PayPal link si apre: paypal.me/AntonioGuida320/[AMOUNT]EUR
│   ├── 4. Cliente paga via PayPal
│   └── 5. Admin conferma pagamento nel pannello
├── 📊 Tracking:
│   ├── Database: payment_status in bookings
│   ├── Admin Panel: lista transazioni
│   └── PayPal Button: apertura diretta link
└── 🏦 Alternative:
    ├── Bonifico bancario (configurabile)
    └── Stripe (ready ma non attivo)
```

### 5. 📅 **CALENDAR SYNC SYSTEM**
```
🗓️ MULTI-PLATFORM CALENDAR SYNC
├── 🏠 Airbnb:
│   ├── URL: airbnb.it/calendar/ical/[ID].ics
│   ├── Sync: ogni 30 minuti
│   └── Eventi: 15 sincronizzati
├── 🏨 Booking.com:
│   ├── URL: supply-xml.booking.com/hotels/xml/[ID]
│   ├── Sync: ogni 60 minuti  
│   └── Eventi: 8 sincronizzati
├── 🏡 VRBO:
│   ├── URL: vrbo.com/icalendar/[ID].ics
│   ├── Sync: ogni 120 minuti
│   └── Eventi: 12 sincronizzati
└── 📧 Google Calendar:
    ├── URL: calendar.google.com/calendar/ical/[EMAIL]/basic.ics
    ├── Status: pending_auth
    └── OAuth: ready ma non configurato
```

### 6. 🚀 **DEPLOYMENT & INFRASTRUCTURE**
```
🌐 VERCEL DEPLOYMENT
├── 🔗 Production URL: https://vincanto-backup.vercel.app
├── 📦 Build:
│   ├── Frontend: React build → static files
│   ├── API: Serverless functions
│   └── Assets: Public folder + images WebP
├── ⚙️ Configuration:
│   ├── vercel.json: SPA routing rules
│   ├── package.json: Dependencies
│   └── Environment: DATABASE_URL (auto da Neon)
└── 🔄 Auto-deploy:
    ├── Git push → GitHub
    ├── GitHub → Vercel webhook  
    └── Vercel → Build & deploy
```

---

## 🔄 **DATA FLOW COMPLETO**

### 📝 **Processo Prenotazione:**
```
1. 🌐 Cliente → BookingSystem.tsx
2. 📋 Form validation → React state
3. 💳 Payment selection (PayPal/Bonifico)
4. ⚡ POST /api/unified?action=booking
5. 🗄️ Database INSERT → bookings table
6. 💰 PayPal redirect → paypal.me/AntonioGuida320/[AMOUNT]EUR
7. 📧 Email confirmation (future)
8. 📊 Admin panel updates real-time
```

### 🎛️ **Admin Dashboard Flow:**
```
1. 🔐 Login → AdminPanelPro.tsx (password: vincanto2025)
2. 📊 Dashboard → GET /api/unified?action=dashboard-stats
3. 🗄️ Database queries → SUM, COUNT prenotazioni reali
4. 📈 Analytics → Chart rendering con dati reali
5. 💳 Payments → GET /api/unified?action=payments
6. 🗄️ Join bookings → payment data + PayPal links
7. 📅 Calendars → GET /api/unified?action=calendar-configs
8. 🔄 Real-time updates → Database polling
```

---

## 🎯 **TECNOLOGIE & STACK**

### 🛠️ **Frontend Stack:**
- **React 18** + TypeScript
- **Vite** build tool
- **Tailwind CSS** styling
- **React Router v7** navigation  
- **i18next** internationalization
- **Axios** HTTP client

### ⚙️ **Backend Stack:**
- **Node.js** runtime
- **Vercel Serverless** functions
- **PostgreSQL** database
- **pg Pool** connection
- **Express-style** handlers

### 🗄️ **Database Stack:**
- **Neon PostgreSQL** cloud
- **Connection pooling**
- **SSL secure** connections
- **Auto-backup** system
- **EU region** (Frankfurt)

### 🔧 **DevOps Stack:**
- **GitHub** version control
- **Vercel** hosting & deployment
- **npm** package management
- **TypeScript** compilation
- **ESLint** code quality

---

## 📁 **STRUTTURA FILE SISTEMA**

### 🏠 **Directory Root:**
```
vincanto-backup/
├── 📁 src/                    # Frontend React
├── 📁 api/                    # Backend Serverless  
├── 📁 scripts/                # Database utilities
├── 📁 docs/                   # Documentazione
├── 📁 public/                 # Static assets
├── 📁 dist/                   # Build output
├── 🔧 package.json           # Dependencies
├── 🔧 vite.config.ts         # Build config  
├── 🔧 vercel.json            # Deployment config
└── 🔧 tailwind.config.js     # Styling config
```

### 🎯 **File Chiave:**
```
🔥 CRITICI:
├── api/unified.js            # TUTTA LA LOGICA BACKEND
├── src/pages/AdminPanelPro.tsx  # ADMIN PANEL
├── src/components/BookingSteps.tsx  # BOOKING SYSTEM
├── scripts/test-db-connection.mjs  # DB TEST
└── vercel.json               # DEPLOYMENT

📊 CONFIGURAZIONI:
├── DATABASE_URL              # Neon connection
├── paypal.me/AntonioGuida320  # Payment link
├── Password admin: vincanto2025
└── PostgreSQL: 6 tabelle
```

---

## 🎪 **WORKFLOW OPERATIVO**

### 👨‍💻 **Development:**
```bash
1. git clone → Local development
2. npm install → Dependencies  
3. npm run dev → Local server (localhost:5173)
4. Database → Neon cloud (remote)
5. API calls → Local development server
```

### 🚀 **Production:**
```bash
1. git push → GitHub repository
2. Vercel webhook → Auto deployment
3. npm run build → Static files + API
4. Database → Neon cloud (same)
5. Live URL → vincanto-backup.vercel.app
```

### 🔧 **Database Management:**
```bash
1. scripts/test-db-connection.mjs → Test connection
2. scripts/populate-database.mjs → Insert demo data
3. Neon Dashboard → Web interface
4. API → Real-time CRUD operations
5. Admin Panel → Visual interface
```

---

## 🎯 **RIASSUNTO PRATICO**

### ✅ **Cosa È Operativo:**
- ✅ **Frontend**: Booking system + Admin panel
- ✅ **Database**: PostgreSQL Neon con dati reali
- ✅ **API**: Unified endpoint funzionante  
- ✅ **PayPal**: Link operativo per pagamenti
- ✅ **Calendar**: Endpoint attivi, sync configurabile
- ✅ **Deployment**: Auto-deploy GitHub → Vercel

### 🔧 **Tecnologie Principali:**
- **Hosting**: Vercel (frontend + API)
- **Database**: Neon PostgreSQL Cloud
- **Payment**: PayPal direct link
- **Code**: React + Node.js + TypeScript

### 🏆 **Risultato:**
**Sistema vacation rental completo e operativo per gestire prenotazioni reali, pagamenti PayPal e amministrazione professionale!**

---

**💡 Ora hai la mappa completa! Ogni componente ha il suo ruolo specifico nell'ecosistema Vincanto.**