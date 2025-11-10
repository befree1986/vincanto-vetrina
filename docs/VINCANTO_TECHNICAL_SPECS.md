# 🔧 VINCANTO TECHNICAL SPECIFICATIONS

## 🔗 **CONNESSIONI E CREDENZIALI**

### 🗄️ **DATABASE NEON POSTGRESQL**
```bash
# Connection String (Production)
postgresql://neondb_owner:npg_5TBySVaU7Ktf@ep-sweet-glitter-ag53yugd-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require

# Dettagli
Host: ep-sweet-glitter-ag53yugd-pooler.c-2.eu-central-1.aws.neon.tech
Database: neondb
User: neondb_owner
Region: EU Central 1 (Frankfurt)
SSL: Required
Connection Pool: Automatic
```

### 🌐 **URLS SISTEMA**
```bash
# Frontend Production
https://vincanto-backup.vercel.app

# Admin Panel
https://vincanto-backup.vercel.app/admin
Password: vincanto2025

# API Unified Endpoint
https://vincanto-backup.vercel.app/api/unified?action=[ACTION]

# PayPal Payment Link
https://www.paypal.me/AntonioGuida320

# Repository
https://github.com/befree1986/vincanto-vetrina
```

---

## 📋 **DATABASE SCHEMA DETTAGLIATO**

### 🏠 **Tabella BOOKINGS**
```sql
CREATE TABLE bookings (
    id SERIAL PRIMARY KEY,
    booking_id VARCHAR NOT NULL UNIQUE,        -- VIN001, VIN002, etc.
    check_in DATE NOT NULL,                    -- Data arrivo
    check_out DATE NOT NULL,                   -- Data partenza
    guests INTEGER NOT NULL,                   -- Numero ospiti totali
    adults INTEGER,                           -- Ospiti adulti
    children INTEGER,                         -- Ospiti bambini
    first_name VARCHAR,                       -- Nome cliente
    last_name VARCHAR,                        -- Cognome cliente
    email VARCHAR,                           -- Email cliente
    phone VARCHAR,                           -- Telefono cliente
    total_amount NUMERIC(10,2),              -- Importo totale €
    deposit_amount NUMERIC(10,2),            -- Acconto (30%)
    notes TEXT,                              -- Note speciali
    status VARCHAR DEFAULT 'pending',        -- pending|confirmed|completed|cancelled
    payment_status VARCHAR DEFAULT 'pending', -- pending|deposit_paid|paid_full
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Dati Correnti
INSERT INTO bookings VALUES 
(1, 'VIN001', '2025-11-15', '2025-11-18', 2, 2, 0, 'Mario', 'Rossi', 'mario.rossi@email.com', '+39 320 1234567', 450.00, 135.00, 'Arrivo serata', 'confirmed', 'deposit_paid'),
(2, 'VIN002', '2025-11-20', '2025-11-23', 4, 3, 1, 'Laura', 'Bianchi', 'laura.bianchi@email.com', '+39 347 9876543', 325.00, 97.50, 'Famiglia con bambino', 'pending', 'pending'),
(3, 'VIN003', '2025-11-12', '2025-11-14', 6, 4, 2, 'Giuseppe', 'Verdi', 'giuseppe.verdi@email.com', '+39 339 5555555', 280.00, 280.00, 'Pagamento completo', 'completed', 'paid_full');
```

### ⚙️ **Tabella ADMIN_SETTINGS**
```sql
CREATE TABLE admin_settings (
    id SERIAL PRIMARY KEY,
    setting_key VARCHAR NOT NULL UNIQUE,      -- Chiave configurazione
    setting_value TEXT,                       -- Valore configurazione
    setting_type VARCHAR NOT NULL,            -- string|number|boolean|json
    category VARCHAR NOT NULL,                -- payment|booking|general|pricing
    description TEXT,                         -- Descrizione opzionale
    is_public BOOLEAN DEFAULT false,          -- Visibile pubblicamente
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Configurazioni Chiave
INSERT INTO admin_settings VALUES 
('paypal_link', 'https://www.paypal.me/AntonioGuida320', 'string', 'payment', 'Link PayPal aziendale'),
('paypal_enabled', 'true', 'boolean', 'payment', 'PayPal attivo'),
('base_price', '75', 'string', 'pricing', 'Prezzo base per 1-2 persone'),
('max_guests', '8', 'string', 'booking', 'Massimo ospiti'),
('min_stay_nights', '2', 'string', 'booking', 'Soggiorno minimo'),
('site_name', 'Vincanto Maori', 'string', 'general', 'Nome sito'),
('admin_email', 'admin@vincantomaori.it', 'string', 'general', 'Email amministratore');
```

### 💰 **Tabella PRICING_CONFIG**
```sql
CREATE TABLE pricing_config (
    id SERIAL PRIMARY KEY,
    base_price_per_adult NUMERIC(8,2) DEFAULT 75.00,      -- €75 per adulto
    additional_guest_price NUMERIC(8,2) DEFAULT 20.00,    -- €20 ospite extra
    minimum_nights INTEGER DEFAULT 3,                     -- 3 notti minimo
    parking_fee_per_night NUMERIC(8,2) DEFAULT 20.00,     -- €20 parcheggio/notte
    tourist_tax_per_person NUMERIC(8,2) DEFAULT 3.00,     -- €3 tassa soggiorno
    cleaning_fee NUMERIC(8,2) DEFAULT 50.00,              -- €50 pulizie
    deposit_percentage NUMERIC(3,2) DEFAULT 0.30,         -- 30% acconto
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

### 📅 **Tabella CALENDAR_EVENTS**
```sql
CREATE TABLE calendar_events (
    id SERIAL PRIMARY KEY,
    uid TEXT NOT NULL UNIQUE,                 -- UID univoco evento
    calendar_source VARCHAR NOT NULL,         -- airbnb|booking_com|vrbo|google|manual
    summary TEXT NOT NULL,                    -- Titolo evento
    description TEXT,                         -- Descrizione dettagliata
    start_date TIMESTAMP NOT NULL,            -- Data/ora inizio
    end_date TIMESTAMP NOT NULL,              -- Data/ora fine
    location TEXT DEFAULT 'Vincanto Maori',   -- Location
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

---

## ⚡ **API ENDPOINTS SPECIFICATION**

### 🔐 **Authentication**
```javascript
POST /api/unified?action=login
Body: { "password": "vincanto2025" }
Response: {
  "success": true,
  "message": "Login effettuato con successo",
  "token": "admin-token-vincanto"
}
```

### 📊 **Dashboard Stats**
```javascript
GET /api/unified?action=dashboard-stats
Response: {
  "success": true,
  "stats": {
    "totalBookings": 3,          // COUNT(*) FROM bookings
    "totalRevenue": 1055.00,     // SUM(total_amount) FROM bookings
    "totalGuests": 12,           // SUM(guests) FROM bookings
    "occupancyRate": 10,         // Calculated percentage
    "monthlyBookings": 3,        // Monthly count
    "monthlyRevenue": 1055.00,   // Monthly sum
    "pendingBookings": 1,        // WHERE status='pending'
    "confirmedBookings": 1,      // WHERE status='confirmed'
    "cancelledBookings": 0       // WHERE status='cancelled'
  }
}
```

### 📋 **Bookings Management**
```javascript
// Get All Bookings
GET /api/unified?action=booking
Response: {
  "success": true,
  "bookings": [
    {
      "id": 3,
      "booking_id": "VIN003",
      "customer_name": "Giuseppe Verdi",
      "customer_email": "giuseppe.verdi@email.com",
      "check_in": "2025-11-12",
      "check_out": "2025-11-14",
      "guests": 6,
      "total_amount": 280,
      "status": "completed",
      "payment_method": "paid_full",
      "platform": "direct",
      "created_at": "2025-11-10T16:45:32.000Z"
    }
  ]
}

// Create New Booking
POST /api/unified?action=booking
Body: {
  "checkin": "2025-12-01",
  "checkout": "2025-12-03", 
  "guests": 2,
  "customerName": "Anna Rossi",
  "customerEmail": "anna@email.com",
  "totalPrice": 200
}
Response: {
  "success": true,
  "message": "Prenotazione creata con successo",
  "booking": { ... }
}
```

### 💳 **Payments System**
```javascript
GET /api/unified?action=payments
Response: {
  "success": true,
  "payments": [
    {
      "id": 3,
      "bookingId": "VIN003",
      "amount": 280,
      "currency": "EUR",
      "status": "completed",
      "method": "paypal",
      "date": "2025-11-10T16:45:32.000Z",
      "guest": "Giuseppe Verdi",
      "paypalLink": "https://www.paypal.me/AntonioGuida320",
      "description": "Pagamento completo prenotazione 2025-11-12 - 2025-11-14"
    }
  ]
}
```

---

## 🛠️ **DEVELOPMENT COMMANDS**

### 📦 **Local Development**
```bash
# Install Dependencies
npm install

# Start Development Server
npm run dev
# → http://localhost:5173

# Build for Production
npm run build
# → Creates dist/ folder

# Test Database Connection
node scripts/test-db-connection.mjs

# Populate Database with Demo Data
node scripts/populate-database.mjs

# Check API Syntax
node -c api/unified.js
```

### 🚀 **Deployment**
```bash
# Deploy to Vercel (automatic)
git add .
git commit -m "Update message"
git push

# Manual Vercel Deploy (if needed)
vercel --prod

# Check Production API
curl "https://vincanto-backup.vercel.app/api/unified?action=dashboard-stats"
```

### 🗄️ **Database Scripts**
```bash
# Test Database Connection
node scripts/test-db-connection.mjs

# Check Database Structure  
node scripts/check-table-structure.mjs

# View Database Data
node scripts/check-db-data.mjs

# Populate with Demo Data
node scripts/populate-database.mjs
```

---

## 🎯 **SYSTEM CONFIGURATION**

### 🔧 **Environment Variables**
```bash
# Vercel Environment (Automatic)
DATABASE_URL=postgresql://neondb_owner:npg_5TBySVaU7Ktf@...

# Local Development (.env)
VITE_API_BASE_URL=http://localhost:5173/api
DATABASE_URL=postgresql://neondb_owner:npg_5TBySVaU7Ktf@...
```

### 📁 **Key Configuration Files**
```bash
# Deployment Configuration
vercel.json                 # SPA routing + API functions

# Build Configuration  
vite.config.ts             # Frontend build settings
package.json               # Dependencies + scripts

# Styling Configuration
tailwind.config.js         # CSS framework config
postcss.config.js          # CSS processing

# TypeScript Configuration
tsconfig.json              # Main TS config
tsconfig.app.json          # App-specific TS config
tsconfig.node.json         # Node.js TS config
```

---

## 📊 **PERFORMANCE METRICS**

### ⚡ **Build Output**
```bash
dist/index.html                    6.19 kB │ gzip: 2.12 kB
dist/assets/index-C60Tx1sk.css    54.93 kB │ gzip: 11.45 kB  
dist/assets/index-ugUgknKN.js    154.42 kB │ gzip: 43.61 kB
Total Bundle Size: ~65 kB gzipped
```

### 🌐 **API Response Times**
```bash
/api/unified?action=dashboard-stats    ~200ms (database queries)
/api/unified?action=booking           ~150ms (simple select)
/api/unified?action=payments          ~180ms (join queries)
/api/unified?action=calendar-configs  ~100ms (mock data)
```

### 🗄️ **Database Performance**
```bash
Connection Pool: 10 concurrent connections
Query Performance: <200ms average
SSL Connection: TLS 1.3
Backup: Automatic every 24h
Uptime: 99.9% (Neon SLA)
```

---

## 🎯 **SUMMARY - TUTTO QUELLO CHE DEVI SAPERE**

1. **🏠 Sistema**: Vacation rental completo React + Node.js
2. **🗄️ Database**: PostgreSQL Neon cloud con 6 tabelle
3. **💳 Pagamenti**: PayPal direct link operativo
4. **📊 Admin**: Pannello real-time con dati database
5. **🚀 Deploy**: Auto-deploy GitHub → Vercel
6. **🔗 URLs**: vincanto-backup.vercel.app (live)

**💫 Tutto operativo e pronto per business reale! 💫**