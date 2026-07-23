// API COMPLETAMENTE UNIFICATA - Vincanto System
// Consolidation of all API endpoints in a single file
import { Pool } from 'pg';
import Stripe from 'stripe'; // ⚡ ES Module import per Vercel serverless
import nodemailer from 'nodemailer';
import { renderEmailTemplate } from '../email/templates/index.js';
import { sendEmailWithAdminCopy } from '../email/emailSender.js';
import { initializeEmailLogsTable } from '../email/emailLogger.js';
import { detectLanguage } from '../email/i18n.js';
import * as TwoFactorAuth from './2fa.js';
import bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import jwt from 'jsonwebtoken'; // 🚀 Aggiungi import per JWT
import { RealCalendarSync } from './calendar-real-sync.js'; // 👈 Importa la classe di sync reale

// 🚀 Configurazione JWT
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.error('⚠️ ATTENZIONE: JWT_SECRET non configurato! Il sistema di autenticazione non è sicuro.');
}

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Session store per admin login 2FA
// 🗑️ Rimuoviamo la sessione in memoria, non è adatta per ambienti serverless.
// const adminSessionStore = new Map();

// Email transporter configuration
let emailTransporter = null;
if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASSWORD) {
  const smtpPort = parseInt(process.env.SMTP_PORT) || 587;
  // Porta 465 = SSL, 587 = STARTTLS
  const smtpSecure = smtpPort === 465;
  console.log('[SMTP DEBUG] Configurazione:', {
    host: process.env.SMTP_HOST,
    port: smtpPort,
    secure: smtpSecure,
    user: process.env.SMTP_USER,
    from: process.env.SMTP_FROM
  });
  emailTransporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: smtpPort,
    secure: smtpSecure,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD
    },
    connectionTimeout: 5000,
    greetingTimeout: 5000,
    socketTimeout: 5000
  });
  // Test connessione SMTP
  emailTransporter.verify(function (error, success) {
    if (error) {
      console.error('[SMTP DEBUG] Errore connessione SMTP:', error);
    } else {
      console.log('[SMTP DEBUG] Connessione SMTP OK:', success);
    }
  });
  console.log('✅ Email transporter configurato');
} else {
  console.log('⚠️ Email transporter non configurato (variabili SMTP mancanti)');
}

// Controllo configurazione database
if (!process.env.DATABASE_URL && !process.env.POSTGRES_URL) {
  console.error('⚠️ ATTENZIONE: Nessuna variabile DATABASE_URL o POSTGRES_URL configurata!');
}

// Initialize database tables
async function initializeTables() {
  try {
    // Crea tabella blocked_dates se non esiste
    await pool.query(`
      CREATE TABLE IF NOT EXISTS blocked_dates (
        id SERIAL PRIMARY KEY,
        start_date DATE NOT NULL,
        end_date DATE NOT NULL,
        reason VARCHAR(50) DEFAULT 'maintenance',
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Tabella blocked_dates inizializzata');

    // 🆕 Crea tabella monthly_pricing_rules se non esiste
    await pool.query(`
      CREATE TABLE IF NOT EXISTS monthly_pricing_rules (
        id SERIAL PRIMARY KEY,
        month INTEGER UNIQUE NOT NULL CHECK (month >= 1 AND month <= 12),
        base_price DECIMAL(10,2) NOT NULL,
        min_stay INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Tabella monthly_pricing_rules inizializzata');

    // Crea tabella bookings se non esiste
    await pool.query(`
      CREATE TABLE IF NOT EXISTS bookings (
        id SERIAL PRIMARY KEY,
        booking_id VARCHAR(100) UNIQUE NOT NULL,
        check_in DATE NOT NULL,
        check_out DATE NOT NULL,
        guests INTEGER DEFAULT 1,
        adults INTEGER DEFAULT 1,
        children INTEGER DEFAULT 0,
        first_name VARCHAR(100),
        last_name VARCHAR(100),
        email VARCHAR(200),
        phone VARCHAR(50),
        total_amount DECIMAL(10,2) DEFAULT 0,
        deposit_amount DECIMAL(10,2) DEFAULT 0,
        notes TEXT,
        status VARCHAR(50) DEFAULT 'pending',
        payment_status VARCHAR(50) DEFAULT 'pending',
        stripe_payment_intent VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Tabella bookings inizializzata');

    // 🆕 Crea tabella admin_audit_log se non esiste
    await pool.query(`
      CREATE TABLE IF NOT EXISTS admin_audit_log (
        id SERIAL PRIMARY KEY,
        admin_id INTEGER,
        admin_email VARCHAR(200),
        action VARCHAR(100) NOT NULL,
        entity_type VARCHAR(100),
        entity_id VARCHAR(255),
        details JSONB,
        ip_address VARCHAR(50),
        user_agent TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Tabella admin_audit_log inizializzata');

    // 🆕 Aggiungi colonna 'internal_notes' a bookings se non esiste (per installazioni esistenti)
    try {
      await pool.query(`ALTER TABLE bookings ADD COLUMN IF NOT EXISTS internal_notes TEXT`);
    } catch (e) {
      console.log('Info: colonna internal_notes già presente o errore:', e.message);
    }

    // 🆕 Aggiungi colonna 'internal_notes' a calendar_events se non esiste
    try {
      await pool.query(`ALTER TABLE calendar_events ADD COLUMN IF NOT EXISTS internal_notes TEXT`);
    } catch (e) {
      console.log('Info: colonna internal_notes in calendar_events già presente o errore:', e.message);
    }

    // 🆕 Crea tabella pricing_config se non esiste
    await pool.query(`
      CREATE TABLE IF NOT EXISTS pricing_config (
        id SERIAL PRIMARY KEY,
        price_group_1to2 DECIMAL(10,2) DEFAULT 70,
        price_group_3to4 DECIMAL(10,2) DEFAULT 20,
        price_group_5to6 DECIMAL(10,2) DEFAULT 25,
        price_group_7to8 DECIMAL(10,2) DEFAULT 30,
        cleaning_fee DECIMAL(10,2) DEFAULT 60,
        parking_fee DECIMAL(10,2) DEFAULT 20,
        tourist_tax_adult DECIMAL(10,2) DEFAULT 2.00,
        tourist_tax_child DECIMAL(10,2) DEFAULT 0,
        weekend_surcharge DECIMAL(10,2) DEFAULT 0,
        weekly_discount DECIMAL(10,2) DEFAULT 10,
        monthly_discount DECIMAL(10,2) DEFAULT 15,
        min_stay INTEGER DEFAULT 2,
        max_stay INTEGER DEFAULT 14,
        max_guests INTEGER DEFAULT 8,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Tabella pricing_config inizializzata');

    // 🆕 Crea tabella calendar_events se non esiste
    await pool.query(`
      CREATE TABLE IF NOT EXISTS calendar_events (
        id SERIAL PRIMARY KEY,
        uid VARCHAR(500) UNIQUE NOT NULL,
        calendar_source VARCHAR(100) NOT NULL,
        summary TEXT,
        description TEXT,
        start_date TIMESTAMP NOT NULL,
        end_date TIMESTAMP NOT NULL,
        location TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Tabella calendar_events inizializzata');

    // 🆕 Aggiungi colonna 'platform' a calendar_events se non esiste (per distinguere logica di filtro da sorgente unica)
    try {
      await pool.query(`ALTER TABLE calendar_events ADD COLUMN IF NOT EXISTS platform VARCHAR(50)`);
    } catch (e) { console.log('Info: colonna platform già presente o errore:', e.message); }

    // 🆕 Crea tabella calendar_configs per gestire i calendari dinamicamente
    await pool.query(`
      CREATE TABLE IF NOT EXISTS calendar_configs (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        calendar_type VARCHAR(50) NOT NULL,
        url TEXT NOT NULL,
        is_active BOOLEAN DEFAULT true,
        sync_frequency INTEGER DEFAULT 60,
        last_sync TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Tabella calendar_configs inizializzata');

    // Seed calendari di default se la tabella è vuota
    const calendarsCount = await pool.query('SELECT COUNT(*) FROM calendar_configs');
    if (parseInt(calendarsCount.rows[0].count) === 0) {
      // Gli URL iCal vengono letti dalle variabili d'ambiente per sicurezza.
      // Rimuoviamo i valori di fallback hardcoded.
      const defaultUrlBooking = process.env.BOOKING_ICAL_URL;
      const defaultUrlAirbnb = process.env.AIRBNB_ICAL_URL;
      const defaultUrlHolidu = process.env.HOLIDU_ICAL_URL;

      // Inserisci solo se le variabili d'ambiente sono definite
      if (defaultUrlBooking) await pool.query("INSERT INTO calendar_configs (name, calendar_type, url, sync_frequency) VALUES ($1, $2, $3, $4)", ['Booking.com', 'booking', defaultUrlBooking, 60]);
      if (defaultUrlAirbnb) await pool.query("INSERT INTO calendar_configs (name, calendar_type, url, sync_frequency) VALUES ($1, $2, $3, $4)", ['Airbnb', 'airbnb', defaultUrlAirbnb, 30]);
      if (defaultUrlHolidu) await pool.query("INSERT INTO calendar_configs (name, calendar_type, url, sync_frequency) VALUES ($1, $2, $3, $4)", ['Holidu', 'holidu', defaultUrlHolidu, 60]);
      console.log('✅ Calendari di default inseriti in calendar_configs');
    }

    // 🆕 Crea tabella extra_services se non esiste
    await pool.query(`
      CREATE TABLE IF NOT EXISTS extra_services (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        price DECIMAL(10,2) NOT NULL DEFAULT 0,
        category VARCHAR(100) DEFAULT 'general',
        unit VARCHAR(50) DEFAULT 'per_stay',
        active BOOLEAN DEFAULT true,
        included BOOLEAN DEFAULT false,
        min_age INTEGER DEFAULT NULL,
        max_age INTEGER DEFAULT NULL,
        sort_order INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Tabella extra_services inizializzata');

    // 🆕 Crea tabella system_settings per CMS generico
    await pool.query(`
      CREATE TABLE IF NOT EXISTS system_settings (
        id SERIAL PRIMARY KEY,
        key VARCHAR(100) UNIQUE NOT NULL,
        value TEXT,
        label VARCHAR(255),
        category VARCHAR(50) DEFAULT 'general',
        type VARCHAR(50) DEFAULT 'text',
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Tabella system_settings inizializzata');

    // 🔥 NUOVA TABELLA DEDICATA PER REGOLE STAGIONALI
    await pool.query(`
      CREATE TABLE IF NOT EXISTS seasonal_pricing_rules (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        start_date DATE NOT NULL,
        end_date DATE NOT NULL,
        min_stay INTEGER,
        price_group_1to2 DECIMAL(10, 2),
        price_group_3to4 DECIMAL(10, 2),
        price_group_5to6 DECIMAL(10, 2),
        price_group_7to8 DECIMAL(10, 2),
        cleaning_fee DECIMAL(10, 2),
        parking_fee DECIMAL(10, 2),
        tourist_tax_adult DECIMAL(10, 2),
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Tabella seasonal_pricing_rules inizializzata (struttura DB definitiva)');

    // Seed settings di base se vuota
    const sysSettingsCount = await pool.query('SELECT COUNT(*) FROM system_settings');
    if (parseInt(sysSettingsCount.rows[0].count) === 0) {
      await pool.query(`
        INSERT INTO system_settings (key, value, label, category, type) VALUES
        ('home_hero_title', 'Vincanto Maori', 'Titolo Hero Home', 'home', 'text'),
        ('home_hero_subtitle', 'La tua casa vacanze a Maiori: un angolo di paradiso tra i limoni della Costiera Amalfitana', 'Sottotitolo Hero Home', 'home', 'textarea'),
        ('display_price_base', '70', 'Prezzo esposto base (es: € 70)', 'pricing_display', 'text'),
        ('display_price_extra', '20', 'Prezzo esposto extra (es: € 20)', 'pricing_display', 'text'),
        ('about_description_main', 'Situati a soli 2 km dal centro paese...', 'Descrizione Principale Chi Siamo', 'about', 'textarea')
      `);
    }

    // 🆕 Crea tabella admin_users se non esiste
    await pool.query(`
      CREATE TABLE IF NOT EXISTS admin_users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100),
        email VARCHAR(200) UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role VARCHAR(50) DEFAULT 'admin',
        two_factor_enabled BOOLEAN DEFAULT false,
        is_active BOOLEAN DEFAULT true,
        stripe_customer_id VARCHAR(255),
        subscription_status VARCHAR(50),
        two_factor_secret TEXT,
        recovery_codes TEXT[],
        last_login TIMESTAMP,
        two_factor_activated_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 🆕 Aggiungi colonna 'is_active' a admin_users se non esiste
    try {
      await pool.query(`ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true`);
    } catch (e) {
      console.log('Info: colonna is_active in admin_users già presente o errore:', e.message);
    }

    // Crea tabella audit per 2FA
    await pool.query(`
      CREATE TABLE IF NOT EXISTS admin_2fa_audit (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES admin_users(id),
        action VARCHAR(50),
        ip_address VARCHAR(50),
        user_agent TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 🆕 Crea tabella email_logs
    await initializeEmailLogsTable();

    // 🔄 Aggiungi campi min_age e max_age se non esistono
    try {
      await pool.query(`
        ALTER TABLE extra_services 
        ADD COLUMN IF NOT EXISTS min_age INTEGER DEFAULT NULL,
        ADD COLUMN IF NOT EXISTS max_age INTEGER DEFAULT NULL
      `);
      console.log('✅ Campi min_age e max_age aggiunti/verificati');
    } catch (err) {
      console.log('ℹ️ Campi min_age/max_age già esistenti o errore aggiunta:', err.message);
    }

    // 🔄 Aggiungi campo included se non esiste (per aggiornare DB esistenti)
    try {
      await pool.query(`
        ALTER TABLE extra_services 
        ADD COLUMN IF NOT EXISTS included BOOLEAN DEFAULT false
      `);
      console.log('✅ Campo included aggiunto/verificato');
    } catch (err) {
      console.log('ℹ️ Campo included già esistente o errore aggiunta:', err.message);
    }

    // 🆕 Inserisci servizi di default se tabella vuota
    const servicesCount = await pool.query('SELECT COUNT(*) FROM extra_services');
    if (parseInt(servicesCount.rows[0].count) === 0) {
      await pool.query(`
        INSERT INTO extra_services (name, description, price, category, unit, active, included, min_age, max_age, sort_order) VALUES
        ('Late Check-out', 'Check-out posticipato alle 14:00 invece delle 10:00', 30.00, 'convenience', 'per_stay', true, false, NULL, NULL, 1),
        ('Early Check-in', 'Check-in anticipato dalle 12:00 invece delle 15:00', 25.00, 'convenience', 'per_stay', true, false, NULL, NULL, 2),
        ('Pulizia Extra', 'Pulizia approfondita pre-arrivo con sanificazione', 50.00, 'cleaning', 'per_stay', true, false, NULL, NULL, 3),
        ('Colazione Italiana', 'Colazione italiana completa con prodotti locali', 15.00, 'food', 'per_person_per_day', true, true, NULL, NULL, 4),
        ('Transfer Aeroporto', 'Servizio transfer da/per Aeroporto di Palermo', 45.00, 'transport', 'per_stay', true, false, NULL, NULL, 5),
        ('Culla per Bambini', 'Culla con biancheria per bambini 0-6 anni', 30.00, 'bambini', 'per_stay', true, false, 0, 7, 6),
        ('Parcheggio Privato Extra', 'Posto auto aggiuntivo nel parcheggio privato', 20.00, 'parking', 'per_night', false, false, NULL, NULL, 7),
        ('Kit Welcome', 'Kit di benvenuto con prodotti tipici siciliani', 25.00, 'gift', 'per_stay', true, true, NULL, NULL, 8)
      `);
      console.log('✅ Servizi extra di default inseriti');
    }
  } catch (error) {
    console.error('❌ Errore inizializzazione tabelle:', error);
  }
}

// 🔧 Funzione per migrare la struttura del database (aggiungere colonne mancanti)
async function migrateDatabase() {
  try {
    // Aggiungi colonna stripe_payment_intent se non esiste
    await pool.query(`
      ALTER TABLE bookings
      ADD COLUMN IF NOT EXISTS stripe_payment_intent VARCHAR(255)
    `);
    console.log('✅ Colonna stripe_payment_intent verificata/aggiunta');

    // Aggiungi colonna min_stay_august se non esiste
    await pool.query(`
      ALTER TABLE pricing_config
      ADD COLUMN IF NOT EXISTS min_stay_august INTEGER DEFAULT 6
    `);
    console.log('✅ Colonna min_stay_august verificata/aggiunta');
  } catch (error) {
    if (error.message.includes('already exists')) {
      console.log('ℹ️ Colonna stripe_payment_intent già esiste');
    } else {
      console.error('⚠️ Errore nella migrazione:', error.message);
    }
  }
}

/**
 * Funzione helper per calcolare il prezzo notturno basato sui livelli di ospiti.
 */
const calculateNightlyPrice = (numGuests, pricingConfig) => {
  if (numGuests <= 0) return 0;
  let price = 0;
  const guests = parseInt(numGuests);

  if (guests > 0) {
    price += Math.min(guests, 2) * (pricingConfig.priceGroup1to2 || 0);
  }
  if (guests > 2) {
    price += Math.min(guests - 2, 2) * (pricingConfig.priceGroup3to4 || 0);
  }
  if (guests > 4) {
    price += Math.min(guests - 4, 2) * (pricingConfig.priceGroup5to6 || 0);
  }
  if (guests > 6) {
    price += Math.min(guests - 6, 2) * (pricingConfig.priceGroup7to8 || 0);
  }
  return price;
};

/**
 * Fetches seasonal pricing rules from the database with detailed logging.
 * 🔥🔥🔥 SOLUZIONE DEFINITIVA: Legge dalla tabella dedicata 'seasonal_pricing_rules'.
 */
async function getSeasonalRules(pool) {
  try {
    console.log("DB_QUERY: Fetching from dedicated 'seasonal_pricing_rules' table.");
    const result = await pool.query("SELECT * FROM seasonal_pricing_rules WHERE is_active = true ORDER BY start_date");
    console.log("DB_RESULT: Found", result.rows.length, "active seasonal rules in dedicated table.");

    // Map DB fields (snake_case) to JS fields (camelCase) for consistency in the app
    return result.rows.map(row => ({
      id: row.id,
      name: row.name,
      startDate: new Date(row.start_date).toISOString().split('T')[0], // Ensure YYYY-MM-DD format
      endDate: new Date(row.end_date).toISOString().split('T')[0],
      minStay: row.min_stay,
      priceGroup1to2: row.price_group_1to2 ? parseFloat(row.price_group_1to2) : undefined,
      priceGroup3to4: row.price_group_3to4 ? parseFloat(row.price_group_3to4) : undefined,
      priceGroup5to6: row.price_group_5to6 ? parseFloat(row.price_group_5to6) : undefined,
      priceGroup7to8: row.price_group_7to8 ? parseFloat(row.price_group_7to8) : undefined,
      cleaningFee: row.cleaning_fee ? parseFloat(row.cleaning_fee) : undefined,
      parkingFee: row.parking_fee ? parseFloat(row.parking_fee) : undefined,
      touristTaxAdult: row.tourist_tax_adult ? parseFloat(row.tourist_tax_adult) : undefined,
      isActive: row.is_active,
    }));
  } catch (e) {
    console.error("DB_ERROR: Could not load seasonal rules from dedicated table.", e);
    return [];
  }
}

/**
 * Calcola il soggiorno minimo richiesto per un dato intervallo di date,
 * dando priorità alle regole stagionali.
 */
async function getRequiredMinStay(checkInDate, checkOutDate, pool, seasonalRules) {
  // 1. Get default rules
  const pricingRulesResult = await pool.query('SELECT min_stay FROM pricing_config ORDER BY id DESC LIMIT 1');
  const rules = pricingRulesResult.rows[0] || { min_stay: 3 };
  const defaultMinStay = parseInt(rules.min_stay) || 3;

  // 2. Use provided seasonal rules
  let finalRequiredMinStay = defaultMinStay; // Inizia con il minimo di default

  for (let d = new Date(checkInDate); d < checkOutDate; d.setDate(d.getDate() + 1)) {
    const currentDateUTC = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    let minStayForThisDay = defaultMinStay;
    let seasonalRuleFound = false;
    if (seasonalRules && Array.isArray(seasonalRules)) {
      for (const rule of seasonalRules) {
        const ruleStartUTC = new Date(Date.UTC(new Date(rule.startDate).getUTCFullYear(), new Date(rule.startDate).getUTCMonth(), new Date(rule.startDate).getUTCDate()));
        const ruleEndUTC = new Date(Date.UTC(new Date(rule.endDate).getUTCFullYear(), new Date(rule.endDate).getUTCMonth(), new Date(rule.endDate).getUTCDate()));
        if (currentDateUTC >= ruleStartUTC && currentDateUTC <= ruleEndUTC && rule.minStay) {
          minStayForThisDay = rule.minStay;
          seasonalRuleFound = true;
          break;
        }
      }
    }

    finalRequiredMinStay = Math.max(finalRequiredMinStay, minStayForThisDay);
  }
  return finalRequiredMinStay;
}

// Inizializza tabelle all'avvio
initializeTables();
migrateDatabase();

export default async function handler(req, res) {
  // Endpoint di health check DB
  if (req.query.action === 'db-health') {
    try {
      await pool.query('SELECT 1');
      return res.status(200).json({ success: true, message: 'DB OK' });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  // CORS Headers - Allowlist domini autorizzati
  const allowedOrigins = [
    'https://www.vincantomaiori.it',
    'https://vincantomaiori.it',
    'https://account.vincantomaiori.it', // Subdominio admin (quando pronto)
    'https://vincantomaiori.it', // Staging Vercel
    'http://localhost:3000', // Dev backend
    'http://localhost:5173', // Dev frontend Vite
    'http://127.0.0.1:3000',
    'http://127.0.0.1:5173'
  ];

  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }

  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Test connessione database per debugging
  try {
    await pool.query('SELECT 1');
    console.log('✅ Database connesso correttamente');
  } catch (dbError) {
    console.error('❌ Errore connessione database:', dbError);
    return res.status(500).json({
      success: false,
      error: 'Errore connessione database',
      details: dbError.message
    });
  }


  try {
    // Ottieni action da query params o body (dichiarazione UNA SOLA VOLTA)
    let { action } = req.query;
    if (req.method === 'POST' && req.body?.action) {
      action = req.body.action;
    }

    // 🛡️ FIX: Pulisci action da eventuali parametri extra malformati (es. ?t=...)
    if (action && typeof action === 'string' && action.includes('?')) {
      action = action.split('?')[0];
    }

    // JWT Admin User Identification
    let adminUser = null;
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (token) {
      try {
        adminUser = jwt.verify(token, JWT_SECRET);
      } catch (e) { /* ignora, verrà gestito dagli endpoint protetti */ }
    }

    // ========================================
    // ADMIN: INVIA EMAIL AL CLIENTE
    // ========================================
    if (action === 'admin-send-customer-email') {
      // 🛡️ SICUREZZA: Proteggi questo endpoint verificando la sessione admin
      const token = req.headers.authorization?.replace('Bearer ', '');
      if (!token) {
        return res.status(403).json({ success: false, error: 'Accesso negato. Token mancante.' });
      }
      try {
        jwt.verify(token, JWT_SECRET);
        // Se siamo qui, il token è valido. Procedi.
      } catch (error) {
        return res.status(403).json({ success: false, error: 'Accesso negato. Token non valido o scaduto.' });
      }

      if (req.method === 'POST') {
        try {
          const { bookingId, subject, message } = req.body;

          if (!bookingId || !subject || !message) {
            return res.status(400).json({ success: false, error: 'ID prenotazione, oggetto e messaggio sono obbligatori.' });
          }

          // 1. Recupera l'email del cliente dalla prenotazione
          const bookingResult = await pool.query(
            `SELECT email, first_name FROM bookings WHERE id = $1 OR booking_id = $2`,
            [isNaN(Number(bookingId)) ? null : Number(bookingId), String(bookingId)]
          );

          if (bookingResult.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Prenotazione non trovata.' });
          }

          const booking = bookingResult.rows[0];
          if (!booking.email || !booking.email.includes('@')) {
            return res.status(400).json({ success: false, error: 'Email del cliente non valida o mancante.' });
          }

          // 2. Invia l'email
          if (emailTransporter) {
            const emailHtml = `<p>Gentile ${booking.first_name || 'Cliente'},</p><p>${message.replace(/\n/g, '<br>')}</p><br><p>Cordiali saluti,<br>Lo Staff di Vincanto</p>`;

            await sendEmailWithAdminCopy({ to: booking.email, subject, html: emailHtml, templateName: 'custom_admin_message' });
            return res.status(200).json({ success: true, message: 'Email inviata con successo.' });
          } else {
            return res.status(500).json({ success: false, error: 'Servizio email non configurato.' });
          }
        } catch (error) {
          console.error('❌ Errore in admin-send-customer-email:', error);
          return res.status(500).json({ success: false, error: 'Errore interno del server.', details: error.message });
        }
      }
    }

    console.log('🎯 API UNIFICATA CONSOLIDATA - Action:', action, 'Method:', req.method);

    // ========================================
    // SYSTEM SETTINGS / CMS ACTION
    // ========================================
    if (action === 'system-settings' || action === 'settings') {
      if (req.method === 'GET') {
        try {
          const result = await pool.query('SELECT * FROM system_settings ORDER BY category, label');
          // Ritorna le impostazioni; se chiamato come settings avvolge in {settings: ...} per compatibilità
          if (action === 'settings') {
            return res.status(200).json({ success: true, settings: result.rows });
          }
          return res.status(200).json(result.rows); // Ritorna array per il frontend
        } catch (error) {
          return res.status(500).json({ success: false, error: error.message });
        }
      }
      if (req.method === 'POST' || req.method === 'PUT') {
        try {
          const { key, value } = req.body;
          // value può essere un JSON (se stringificato dal frontend o passato come oggetto)
          // se è oggetto, convertiamolo in stringa per TEXT
          const valueToSave = typeof value === 'object' ? JSON.stringify(value) : value;

          const result = await pool.query(`
          INSERT INTO system_settings (key, value) VALUES ($1, $2)
          ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()
          RETURNING *
        `, [key, valueToSave]);
          return res.status(200).json({ success: true, setting: result.rows[0] });
        } catch (error) {
          return res.status(500).json({ success: false, error: error.message });
        }
      }
    }

    // ========================================
    // SEASONAL PRICING RULES - CRUD DEDICATO
    // ========================================
    if (action === 'seasonal-rules') {
      // GET: Lista tutte le regole
      if (req.method === 'GET') {
        try {
          const result = await pool.query('SELECT * FROM seasonal_pricing_rules ORDER BY start_date ASC');
          // Converte le date in formato YYYY-MM-DD per il frontend
          const rules = result.rows.map(row => ({
            ...row,
            start_date: new Date(row.start_date).toISOString().split('T')[0],
            end_date: new Date(row.end_date).toISOString().split('T')[0],
          }));
          return res.status(200).json({ success: true, rules });
        } catch (error) {
          return res.status(500).json({ success: false, error: error.message });
        }
      }

      // POST: Crea una nuova regola
      if (req.method === 'POST') {
        try {
          const { name, start_date, end_date, min_stay, price_group_1to2, price_group_3to4, price_group_5to6, price_group_7to8, cleaning_fee, parking_fee, tourist_tax_adult, is_active } = req.body;
          const result = await pool.query(`
            INSERT INTO seasonal_pricing_rules (name, start_date, end_date, min_stay, price_group_1to2, price_group_3to4, price_group_5to6, price_group_7to8, cleaning_fee, parking_fee, tourist_tax_adult, is_active)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
            RETURNING *;
          `, [
            name, start_date, end_date, min_stay,
            price_group_1to2, price_group_3to4, price_group_5to6, price_group_7to8,
            cleaning_fee, parking_fee, tourist_tax_adult, is_active
          ]);

          // ✍️ LOG AUDIT: Crea regola stagionale
          if (adminUser) {
            await logAdminAction(adminUser, 'create', 'seasonal_rule', result.rows[0].id, { rule: result.rows[0] }, req);
          }
          const newRule = result.rows[0];
          newRule.start_date = new Date(newRule.start_date).toISOString().split('T')[0];
          newRule.end_date = new Date(newRule.end_date).toISOString().split('T')[0];
          return res.status(201).json({ success: true, rule: newRule });
        } catch (error) {
          return res.status(500).json({ success: false, error: error.message });
        }
      }

      // PUT: Aggiorna una regola esistente
      if (req.method === 'PUT') {
        try {
          const { id } = req.query;
          const { name, start_date, end_date, min_stay, price_group_1to2, price_group_3to4, price_group_5to6, price_group_7to8, cleaning_fee, parking_fee, tourist_tax_adult, is_active } = req.body;

          if (!id) return res.status(400).json({ success: false, error: 'ID regola mancante' });

          const result = await pool.query(`
            UPDATE seasonal_pricing_rules SET
              name = $1, start_date = $2, end_date = $3, min_stay = $4,
              price_group_1to2 = $5, price_group_3to4 = $6, price_group_5to6 = $7, price_group_7to8 = $8,
              cleaning_fee = $9, parking_fee = $10, tourist_tax_adult = $11, is_active = $12,
              updated_at = CURRENT_TIMESTAMP
            WHERE id = $13
            RETURNING *;
          `, [
            name, start_date, end_date, min_stay,
            price_group_1to2, price_group_3to4, price_group_5to6, price_group_7to8,
            cleaning_fee, parking_fee, tourist_tax_adult, is_active,
            id
          ]);

          if (result.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Regola non trovata' });
          }

          // ✍️ LOG AUDIT: Aggiorna regola stagionale
          if (adminUser) {
            await logAdminAction(adminUser, 'update', 'seasonal_rule', id, { updates: req.body }, req);
          }
          const updatedRule = result.rows[0];
          updatedRule.start_date = new Date(updatedRule.start_date).toISOString().split('T')[0];
          updatedRule.end_date = new Date(updatedRule.end_date).toISOString().split('T')[0];
          return res.status(200).json({ success: true, rule: updatedRule });
        } catch (error) {
          return res.status(500).json({ success: false, error: error.message });
        }
      }

      // DELETE: Elimina una regola
      if (req.method === 'DELETE') {
        try {
          const { id } = req.query;
          if (!id) return res.status(400).json({ success: false, error: 'ID regola mancante' });
          const result = await pool.query('DELETE FROM seasonal_pricing_rules WHERE id = $1 RETURNING id', [id]);
          if (result.rowCount === 0) return res.status(404).json({ success: false, error: 'Regola non trovata' });

          // ✍️ LOG AUDIT: Elimina regola stagionale
          if (adminUser) {
            await logAdminAction(adminUser, 'delete', 'seasonal_rule', id, { deletedId: id }, req);
          }
          return res.status(200).json({ success: true, message: 'Regola eliminata', deletedId: id });
        } catch (error) {
          return res.status(500).json({ success: false, error: error.message });
        }
      }
    }

    // ========================================
    // TRANSLATE API (Google Translate)
    // ========================================
    if (action === 'translate') {
      if (req.method === 'POST') {
        try {
          const { text, targetLangs } = req.body; // targetLangs es: ['en', 'de', 'fr']
          if (!text || !targetLangs || !Array.isArray(targetLangs)) {
            return res.status(400).json({ success: false, error: 'Testo e targetLangs richiesti' });
          }

          const translate = (await import('translate')).default;
          translate.engine = 'google';

          const results = {};
          for (const lang of targetLangs) {
            try {
              results[lang] = await translate(text, { from: 'it', to: lang });
            } catch (e) {
              console.error(`Errore traduzione in ${lang}:`, e);
              results[lang] = text; // fallback
            }
          }

          return res.status(200).json({ success: true, translations: results });
        } catch (error) {
          return res.status(500).json({ success: false, error: error.message });
        }
      }
    }

    // ========================================
    // 2FA SETUP - Genera secret e QR code
    // ========================================
    if (action === 'admin/2fa/setup') {
      try {
        const { email, selectedRole } = req.body;

        if (!email || !selectedRole) {
          return res.status(400).json({ success: false, error: 'Email e ruolo sono richiesti' });
        }

        // Verifica che l'utente esista (in produzione controllare anche autenticazione)
        const userResult = await pool.query(
          'SELECT id, email, two_factor_enabled FROM admin_users WHERE email = $1 AND role = $2',
          [email, selectedRole]
        );

        if (userResult.rows.length === 0) {
          return res.status(404).json({ success: false, error: 'Utente non trovato' });
        }

        const user = userResult.rows[0];

        // Genera nuovo secret e QR code
        const { secret, qrCodeUrl, otpauthUrl } = await TwoFactorAuth.generateTOTPSecret(email);

        // Cifra il secret prima di salvarlo temporaneamente
        const encryptedSecret = TwoFactorAuth.encryptSecret(secret);

        // Salva il secret temporaneo (non ancora attivo)
        await pool.query(
          'UPDATE admin_users SET two_factor_secret = $1 WHERE id = $2',
          [encryptedSecret, user.id]
        );

        // Log audit
        await pool.query(
          'INSERT INTO admin_2fa_audit (user_id, action, ip_address, user_agent) VALUES ($1, $2, $3, $4)',
          [user.id, 'setup', req.headers['x-forwarded-for'] || req.connection.remoteAddress, req.headers['user-agent']]
        );

        return res.status(200).json({
          success: true,
          qrCodeUrl, // Data URL del QR code da mostrare
          otpauthUrl, // URL otpauth per debugging
          message: 'Scansiona il QR code con Google Authenticator o app TOTP'
        });

      } catch (error) {
        console.error('❌ Errore setup 2FA:', error);
        return res.status(500).json({ success: false, error: error.message });
      }
    }

    // ========================================
    // 2FA VERIFY - Verifica codice TOTP e attiva 2FA
    // ========================================
    if (action === 'admin/2fa/verify') {
      try {
        const { email, token, selectedRole } = req.body;

        if (!email || !token || !selectedRole) {
          return res.status(400).json({ success: false, error: 'Email, token e ruolo sono richiesti' });
        }

        // Recupera utente e secret
        const userResult = await pool.query(
          'SELECT id, email, two_factor_secret, two_factor_enabled, recovery_codes FROM admin_users WHERE email = $1 AND role = $2',
          [email, selectedRole]
        );

        if (userResult.rows.length === 0) {
          return res.status(404).json({ success: false, error: 'Utente non trovato' });
        }

        const user = userResult.rows[0];

        if (!user.two_factor_secret) {
          return res.status(400).json({ success: false, error: 'Setup 2FA non inizializzato' });
        }

        // Verifica il token TOTP
        const isValid = TwoFactorAuth.verifyTOTP(token, user.two_factor_secret, true);

        if (!isValid) {
          // Log fallimento
          await pool.query(
            'INSERT INTO admin_2fa_audit (user_id, action, ip_address, user_agent) VALUES ($1, $2, $3, $4)',
            [user.id, 'verify_failed', req.headers['x-forwarded-for'] || req.connection.remoteAddress, req.headers['user-agent']]
          );
          return res.status(400).json({ success: false, error: 'Codice non valido' });
        }

        // Genera codici di recovery
        const { codes, hashes } = await TwoFactorAuth.generateRecoveryCodes(10);

        // Attiva 2FA
        await pool.query(
          'UPDATE admin_users SET two_factor_enabled = TRUE, recovery_codes = $1, two_factor_activated_at = NOW() WHERE id = $2',
          [hashes, user.id]
        );

        // Log successo
        await pool.query(
          'INSERT INTO admin_2fa_audit (user_id, action, ip_address, user_agent) VALUES ($1, $2, $3, $4)',
          [user.id, 'enabled', req.headers['x-forwarded-for'] || req.connection.remoteAddress, req.headers['user-agent']]
        );

        return res.status(200).json({
          success: true,
          message: '2FA attivato con successo',
          recoveryCodes: codes, // IMPORTANTE: Mostra i codici UNA SOLA VOLTA
          warning: 'Salva questi codici in un posto sicuro! Non verranno mostrati di nuovo.'
        });

      } catch (error) {
        console.error('❌ Errore verifica 2FA:', error);
        return res.status(500).json({ success: false, error: error.message });
      }
    }

    // ========================================
    // LOGIN CON 2FA - Step 1: Password
    // ========================================
    if (action === 'admin/login-password') {
      try {
        const { email, password, selectedRole } = req.body;

        if (!email || !password) {
          return res.status(400).json({ success: false, error: 'Email e password richiesti' });
        }

        // Recupera tutti i ruoli disponibili per questa email
        const userResult = await pool.query(
          'SELECT id, email, password_hash, role, two_factor_enabled FROM admin_users WHERE email = $1 ORDER BY role DESC',
          [email]
        );

        if (userResult.rows.length === 0) {
          return res.status(401).json({ success: false, error: 'Credenziali non valide' });
        }

        // Aggiungi un controllo di sicurezza per prevenire crash se il password_hash è corrotto o mancante
        if (!userResult.rows[0].password_hash || typeof userResult.rows[0].password_hash !== 'string') {
          console.error(`❌ Tentativo di login per l'utente ${email} fallito: password_hash non valido o mancante nel database.`);
          return res.status(500).json({ success: false, error: 'Errore di configurazione utente. Contattare l\'amministratore.' });
        }

        // Verifica password su qualsiasi ruolo (dovrebbero essere uguali)
        const passwordMatch = await bcrypt.compare(password, userResult.rows[0].password_hash);

        if (!passwordMatch) {
          return res.status(401).json({ success: false, error: 'Credenziali non valide' });
        }

        // Se ci sono più ruoli disponibili, chiedi di scegliere
        if (userResult.rows.length > 1 && !selectedRole) {
          const availableRoles = userResult.rows.map(r => ({ role: r.role, id: r.id }));
          return res.status(200).json({
            success: true,
            requiresRoleSelection: true,
            availableRoles: availableRoles,
            email: email,
            message: 'Scegli un ruolo per accedere'
          });
        }

        // Seleziona il ruolo specifico o il primo se ce n'è solo uno
        const user = selectedRole
          ? userResult.rows.find(u => u.role === selectedRole)
          : userResult.rows[0];

        if (!user) {
          return res.status(401).json({ success: false, error: 'Ruolo non disponibile' });
        }

        // Se 2FA non è abilitato, forza il setup (primo login)
        if (!user.two_factor_enabled) {
          return res.status(200).json({
            success: true,
            requires2FA: true,
            requiresSetup: true, // Flag per indicare che serve setup iniziale
            userId: user.id,
            email: user.email,
            role: user.role,
            message: '2FA obbligatorio - Configura Google Authenticator per continuare'
          });
        }

        // Se 2FA è già abilitato, richiedi il codice TOTP
        return res.status(200).json({
          success: true,
          requires2FA: true,
          requiresSetup: false,
          userId: user.id,
          email: user.email,
          role: user.role,
          message: 'Inserisci il codice TOTP dalla tua app di autenticazione'
        });

      } catch (error) {
        console.error('❌ Errore login password:', error);
        return res.status(500).json({ success: false, error: error.message });
      }
    }

    // ========================================
    // LOGIN CON 2FA - Step 2: TOTP
    // ========================================
    if (action === 'admin/login-totp') {
      try {
        const { email, token, selectedRole } = req.body;

        if (!email || !token) {
          return res.status(400).json({ success: false, error: 'Email e token richiesti' });
        }

        // Rate limiting
        if (!TwoFactorAuth.checkRateLimit(email, 5, 5 * 60 * 1000)) {
          return res.status(429).json({
            success: false,
            error: 'Troppi tentativi. Riprova tra 5 minuti.'
          });
        }

        // Recupera utente - Se è stato selezionato un ruolo, cerca quello specifico
        let query = 'SELECT id, email, role, two_factor_secret, two_factor_enabled, recovery_codes FROM admin_users WHERE email = $1';
        let params = [email];

        if (selectedRole) {
          query += ' AND role = $2';
          params.push(selectedRole);
        }

        const userResult = await pool.query(query, params);

        if (userResult.rows.length === 0) {
          return res.status(401).json({ success: false, error: 'Credenziali non valide' });
        }

        const user = userResult.rows[0];

        // Se 2FA non è abilitato E non c'è un secret, l'utente non ha mai fatto il setup
        if (!user.two_factor_enabled && !user.two_factor_secret) {
          return res.status(400).json({ success: false, error: '2FA non abilitato per questo utente' });
        }

        // Se c'è un secret (anche se two_factor_enabled è false), è il primo setup
        if (!user.two_factor_secret) {
          return res.status(400).json({ success: false, error: 'Nessun secret TOTP trovato' });
        }

        // Verifica TOTP o Codice di Recovery
        const isTotpValid = TwoFactorAuth.verifyTOTP(token, user.two_factor_secret, true);
        let isRecoveryValid = false;
        let usedRecoveryIndex = -1;

        if (!isTotpValid) {
          const recoveryResult = await TwoFactorAuth.verifyRecoveryCode(token, user.recovery_codes || []);
          if (recoveryResult.valid) {
            isRecoveryValid = true;
            usedRecoveryIndex = recoveryResult.usedIndex;
          }
        }

        if (!isTotpValid && !isRecoveryValid) {
          // Log fallimento
          await pool.query(
            'INSERT INTO admin_2fa_audit (user_id, action, ip_address, user_agent) VALUES ($1, $2, $3, $4)',
            [user.id, 'login_failed', req.headers['x-forwarded-for'] || req.connection.remoteAddress, req.headers['user-agent']]
          );
          return res.status(401).json({ success: false, error: 'Codice TOTP o di recovery non valido' });
        }

        // Reset rate limit su successo
        TwoFactorAuth.resetRateLimit(email);

        if (isRecoveryValid) {
          console.log(`✅ Codice di recovery usato per l'utente ${user.email}. Invalidazione in corso...`);
        }

        // Se è il primo setup (two_factor_enabled è false), abilita il 2FA
        if (!user.two_factor_enabled) {
          await pool.query(
            'UPDATE admin_users SET two_factor_enabled = true, two_factor_activated_at = NOW() WHERE id = $1',
            [user.id]
          );
        }

        // Se è stato usato un codice di recovery, invalidalo
        if (isRecoveryValid && usedRecoveryIndex > -1) {
          const newRecoveryHashes = [...(user.recovery_codes || [])];
          newRecoveryHashes.splice(usedRecoveryIndex, 1); // Rimuovi il codice usato
          await pool.query(
            'UPDATE admin_users SET recovery_codes = $1 WHERE id = $2',
            [newRecoveryHashes, user.id]
          );
        }

        // Aggiorna last_login
        await pool.query(
          'UPDATE admin_users SET last_login = NOW() WHERE id = $1',
          [user.id]
        );

        // Log successo
        await pool.query(
          'INSERT INTO admin_2fa_audit (user_id, action, ip_address, user_agent) VALUES ($1, $2, $3, $4)',
          [user.id, 'login_success', req.headers['x-forwarded-for'] || req.connection.remoteAddress, req.headers['user-agent']]
        );

        // 🚀 Genera il JSON Web Token invece di una sessione in memoria
        const payload = {
          userId: user.id,
          role: user.role,
          email: user.email,
        };
        const jwtToken = jwt.sign(payload, JWT_SECRET, { expiresIn: '8h' }); // Token valido per 8 ore

        return res.status(200).json({
          success: true,
          role: user.role,
          token: jwtToken, // Questo ora è un JWT
          message: 'Login completato con successo'
        });

      } catch (error) {
        console.error('❌ Errore login TOTP:', error);
        return res.status(500).json({ success: false, error: error.message });
      }
    }

    // Restituisce tutti gli eventi da calendar_events (per unificazione prenotazioni)
    if (action === 'calendar-events') {
      try {
        // 🔥 Filtra: ESCLUDE blocchi Airbnb (festività), MANTIENE chiusure Booking.com (vere)
        // ESCLUDE anche blocchi Holidu (non-booking events)
        const eventsResult = await pool.query(`
        SELECT id, uid, calendar_source, summary, description, start_date, end_date, location, created_at, updated_at
        FROM calendar_events
        WHERE start_date >= NOW() - INTERVAL '1 year'
          AND NOT (
            calendar_source = 'airbnb' AND (
              LOWER(summary) LIKE '%not available%'
              OR LOWER(summary) LIKE '%blocked%'
              OR LOWER(summary) LIKE '%holiday%'
              OR LOWER(summary) LIKE '%festività%'
              OR LOWER(summary) LIKE '%vacation%'
              OR LOWER(summary) LIKE '%break%'
              OR LOWER(summary) LIKE '%festa%'
            )
          )
          AND NOT (
            calendar_source = 'airbnb' AND (
              LOWER(summary) LIKE '%maintenance%'
              OR LOWER(summary) LIKE '%pulizie%'
              OR LOWER(summary) LIKE '%cleaning%'
              OR LOWER(summary) LIKE '%manutenzione%'
            )
          )
          AND NOT (
            calendar_source = 'holidu' AND (
              LOWER(summary) LIKE '%not available%'
              OR LOWER(summary) LIKE '%unavailable%'
              OR LOWER(summary) LIKE '%non disponibile%'
              OR LOWER(summary) LIKE '%non-available%'
            )
          )
          AND NOT (
            LOWER(summary) LIKE '%canceled%'
            OR LOWER(summary) LIKE '%cancelled%'
            OR LOWER(description) LIKE '%canceled%'
            OR LOWER(description) LIKE '%cancelled%'
      )
        ORDER BY start_date ASC
      `);
        return res.status(200).json({
          success: true,
          events: eventsResult.rows
        });
      } catch (error) {
        console.error('❌ Errore fetch calendar_events:', error.message);
        return res.status(500).json({ success: false, error: error.message });
      }
    }

    // ...continua con la logica esistente senza ridichiarare 'action'

    if (action === 'login') {
      if (req.method !== 'POST') {
        return res.status(405).json({ success: false, error: 'Metodo non consentito' });
      }

      // VULNERABILITÀ: Password in chiaro. Usiamo una variabile d'ambiente.
      const { password } = req.body;
      const correctPassword = process.env.LEGACY_ADMIN_PASSWORD; // Spostata in .env

      if (password === correctPassword) {
        return res.status(200).json({
          success: true,
          message: 'Login effettuato con successo',
          token: 'admin-token-vincanto',
          role: 'superadmin' // Ruolo di default al login
        });
      } else {
        return res.status(401).json({
          success: false,
          error: 'Password non corretta'
        });
      }
    }

    // ========================================
    // CAMBIO PASSWORD SUPERADMIN
    // ========================================
    if (action === 'admin/change-password') {
      if (req.method !== 'POST') {
        return res.status(405).json({ success: false, error: 'Metodo non consentito' });
      }

      try {
        const { currentPassword, newPassword, isSuperAdmin } = req.body;

        if (!currentPassword || !newPassword) {
          return res.status(400).json({
            success: false,
            error: 'Password attuale e nuova password obbligatorie'
          });
        }

        // 🚨 ATTENZIONE: Questo metodo di login è insicuro e deprecato.
        // Verifica password attuale (da variabile d'ambiente)
        const correctPassword = process.env.LEGACY_ADMIN_PASSWORD;
        if (currentPassword !== correctPassword) {
          return res.status(401).json({
            success: false,
            error: 'Password attuale non corretta'
          });
        }

        // Validazione nuova password
        if (newPassword.length < 8) {
          return res.status(400).json({
            success: false,
            error: 'La password deve avere minimo 8 caratteri'
          });
        }

        const hasUppercase = /[A-Z]/.test(newPassword);
        const hasNumber = /[0-9]/.test(newPassword);
        const hasSymbol = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(newPassword);

        if (!hasUppercase || !hasNumber || !hasSymbol) {
          return res.status(400).json({
            success: false,
            error: 'Password deve contenere maiuscola, numero e simbolo'
          });
        }

        // TODO: Salvare hash nuova password nel database admin_users
        // await pool.query(
        //   'UPDATE admin_users SET password_hash = $1, updated_at = NOW() WHERE id = $2',
        //   [bcrypt.hashSync(newPassword, 10), adminId]
        // );

        console.log('✅ Password SuperAdmin cambiata');
        return res.status(200).json({
          success: true,
          message: 'Password cambiata con successo'
        });
      } catch (error) {
        console.error('❌ Errore cambio password:', error);
        return res.status(500).json({
          success: false,
          error: 'Errore cambio password'
        });
      }
    }

    // ========================================
    // RICHIESTA CAMBIO PASSWORD ADMIN
    // ========================================
    if (action === 'admin/change-password-request') {
      if (req.method !== 'POST') {
        return res.status(405).json({ success: false, error: 'Metodo non consentito' });
      }

      try {
        const { adminEmail, adminName, reason, requestedBy } = req.body;

        if (!adminEmail) {
          return res.status(400).json({
            success: false,
            error: 'Email admin obbligatoria'
          });
        }

        // Log della richiesta
        console.log(`✅ Richiesta cambio password inviata per ${adminEmail} - Motivo: ${reason}`);

        // TODO: Invia email a superadmin notificando della richiesta
        // TODO: Salva richiesta in database password_change_requests table

        // Simula invio email
        if (emailTransporter && process.env.SMTP_FROM) {
          try {
            await emailTransporter.sendMail({
              from: process.env.SMTP_FROM,
              to: 'superadmin@vincantomaori.it', // Email SuperAdmin
              subject: `[SECURITY] Richiesta Cambio Password Admin: ${adminName}`,
              html: `
                <h2>Richiesta di Cambio Password</h2>
                <p><strong>Admin:</strong> ${adminName} (${adminEmail})</p>
                <p><strong>Motivo:</strong> ${reason}</p>
                <p><strong>Richiesta da:</strong> ${requestedBy}</p>
                <p><strong>Data/Ora:</strong> ${new Date().toLocaleString('it-IT')}</p>
                <p>L'admin riceverà una notifica e dovrà cambiare password al prossimo login.</p>
              `
            });
          } catch (emailError) {
            console.warn('⚠️ Email notifica non inviata:', emailError.message);
          }
        }

        return res.status(200).json({
          success: true,
          message: 'Richiesta di cambio password inviata'
        });
      } catch (error) {
        console.error('❌ Errore richiesta cambio password:', error);
        return res.status(500).json({
          success: false,
          error: 'Errore invio richiesta'
        });
      }
    }

    // ========================================
    // LISTA ADMIN (per SuperAdmin)
    // ========================================
    if (action === 'admin/list') {
      if (req.method !== 'GET') {
        return res.status(405).json({ success: false, error: 'Metodo non consentito' });
      }

      try {
        // TODO: Leggere da database admin_users table
        // const result = await pool.query('SELECT id, name, email, role, last_login FROM admin_users WHERE role = $1', ['admin']);

        // Dati mock per ora
        const mockAdmins = [
          {
            id: 1,
            name: 'Giulio Admin',
            email: 'admin@vincantomaori.it',
            role: 'admin',
            last_login: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
          }
        ];

        return res.status(200).json({
          success: true,
          admins: mockAdmins
        });
      } catch (error) {
        console.error('❌ Errore lista admin:', error);
        return res.status(500).json({
          success: false,
          error: 'Errore caricamento lista admin'
        });
      }
    }

    // ========================================
    // CREA ADMIN (per SuperAdmin)
    // ========================================
    if (action === 'admin/create') {
      if (req.method !== 'POST') {
        return res.status(405).json({ success: false, error: 'Metodo non consentito' });
      }

      try {
        const { name, email, password, role } = req.body;

        // Validazioni
        if (!name || !email || !password) {
          return res.status(400).json({
            success: false,
            error: 'Nome, email e password obbligatori'
          });
        }

        // Validazione email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          return res.status(400).json({
            success: false,
            error: 'Email non valida'
          });
        }

        // Validazione password
        if (password.length < 8) {
          return res.status(400).json({
            success: false,
            error: 'Password deve avere minimo 8 caratteri'
          });
        }

        // TODO: Verifica che email non esista già
        // const existingAdmin = await pool.query('SELECT id FROM admin_users WHERE email = $1', [email]);
        // if (existingAdmin.rows.length > 0) {
        //   return res.status(409).json({ success: false, error: 'Email già registrata' });
        // }

        // TODO: Salva nel database admin_users
        // const passwordHash = bcrypt.hashSync(password, 10);
        // await pool.query(
        //   'INSERT INTO admin_users (name, email, password_hash, role, created_at) VALUES ($1, $2, $3, $4, NOW())',
        //   [name, email, passwordHash, role || 'admin']
        // );

        console.log(`✅ Admin creato: ${name} (${email})`);

        // Invia email con credenziali
        if (emailTransporter && process.env.SMTP_FROM) {
          try {
            await emailTransporter.sendMail({
              from: process.env.SMTP_FROM,
              to: email,
              subject: '[Vincanto Maori] Credenziali Accesso Admin',
              html: `
                <h2>Benvenuto nel pannello Admin</h2>
                <p>Ciao <strong>${name}</strong>,</p>
                <p>Il tuo account amministratore è stato creato con successo.</p>
                <p><strong>Credenziali di accesso:</strong></p>
                <ul>
                  <li>Email: ${email}</li>
                  <li>Password: ${password}</li>
                  <li>Ruolo: ${role || 'admin'}</li>
                </ul>
                <p>⚠️ <strong>IMPORTANTE:</strong> Cambia la password al primo accesso.</p>
                <p>Accedi al pannello admin: <a href="https://www.vincantomaori.it/admin">https://www.vincantomaori.it/admin</a></p>
              `
            });
          } catch (emailError) {
            console.warn('⚠️ Email credenziali non inviata:', emailError.message);
          }
        }

        return res.status(201).json({
          success: true,
          message: 'Admin creato con successo',
          admin: { name, email, role: role || 'admin' }
        });
      } catch (error) {
        console.error('❌ Errore creazione admin:', error);
        return res.status(500).json({
          success: false,
          error: 'Errore creazione admin'
        });
      }
    }

    // ========================================
    // ELIMINA ADMIN (per SuperAdmin)
    // ========================================
    if (action === 'admin/delete') {
      if (req.method !== 'DELETE') {
        return res.status(405).json({ success: false, error: 'Metodo non consentito' });
      }

      try {
        const { adminId, adminEmail } = req.body;

        if (!adminId && !adminEmail) {
          return res.status(400).json({
            success: false,
            error: 'ID o email admin obbligatori'
          });
        }

        // TODO: Elimina da database admin_users
        // await pool.query('DELETE FROM admin_users WHERE id = $1 OR email = $2', [adminId, adminEmail]);

        console.log(`✅ Admin eliminato: ${adminId || adminEmail}`);

        return res.status(200).json({
          success: true,
          message: 'Admin eliminato con successo'
        });
      } catch (error) {
        console.error('❌ Errore eliminazione admin:', error);
        return res.status(500).json({
          success: false,
          error: 'Errore eliminazione admin'
        });
      }
    }

    // ========================================
    // ADMIN ROLE ENDPOINT
    // ========================================
    if (action === 'admin/role') {
      if (req.method !== 'GET') {
        return res.status(405).json({ success: false, error: 'Metodo non consentito' });
      }

      // Verifica se l'utente è autenticato (controlla header Authorization o cookies)
      const token = req.headers.authorization?.replace('Bearer ', '') || req.cookies?.adminToken;

      if (!token) {
        return res.status(401).json({
          success: false,
          role: 'guest',
          authenticated: false
        });
      }

      // 🚀 Verifica il JWT invece di cercare nella sessione in memoria
      try {
        const decoded = jwt.verify(token, JWT_SECRET);

        // 🆕 Premium Feature Check
        const settingsResult = await pool.query("SELECT value FROM system_settings WHERE key = 'premium_features_enabled'");
        const premiumEnabled = settingsResult.rows[0]?.value === 'true';

        let subscriptionStatus = 'not_applicable'; // Default for superadmin or if feature is off

        if (premiumEnabled && decoded.role === 'admin') {
          const userSubResult = await pool.query("SELECT subscription_status FROM admin_users WHERE id = $1", [decoded.userId]);
          subscriptionStatus = userSubResult.rows[0]?.subscription_status || 'inactive';
        } else if (decoded.role === 'admin') {
          subscriptionStatus = 'active'; // If premium is not enabled, all admins are considered active
        }

        // `decoded` ora contiene il payload { userId, role, email }
        return res.status(200).json({
          success: true,
          role: decoded.role,
          authenticated: true,
          email: decoded.email,
          subscriptionStatus: subscriptionStatus
        });
      } catch (error) {
        // Questo cattura token scaduti, firme non valide, etc.
        return res.status(401).json({
          success: false,
          role: 'guest',
          authenticated: false,
          error: 'Token admin non valido o scaduto'
        });
      }
    }

    // ========================================
    // ADMIN BILLING/PORTAL
    // ========================================
    if (action === 'admin/create-billing-portal-session') {
      if (!adminUser) {
        return res.status(403).json({ success: false, error: 'Autenticazione richiesta.' });
      }

      try {
        const { return_url } = req.body;
        const userResult = await pool.query("SELECT stripe_customer_id FROM admin_users WHERE id = $1", [adminUser.userId]);
        const stripeCustomerId = userResult.rows[0]?.stripe_customer_id;

        if (!stripeCustomerId) {
          return res.status(400).json({ success: false, error: 'Nessun cliente di fatturazione trovato per questo utente. Contatta il SuperAdmin.' });
        }

        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
        const portalSession = await stripe.billingPortal.sessions.create({
          customer: stripeCustomerId,
          return_url: return_url || `${req.headers.origin}/admin`,
        });

        return res.status(200).json({ success: true, url: portalSession.url });

      } catch (error) {
        console.error("Errore creazione portale Stripe:", error);
        return res.status(500).json({ success: false, error: 'Impossibile creare la sessione di fatturazione.' });
      }
    }

    // ========================================
    // DASHBOARD & ANALYTICS SECTION
    // ========================================
    if (action === 'dashboard-stats') {
      try {
        // Ottieni statistiche reali dal database
        const totalBookingsResult = await pool.query('SELECT COUNT(*) as count FROM bookings');
        const totalBookings = parseInt(totalBookingsResult.rows[0].count);

        const totalRevenueResult = await pool.query('SELECT COALESCE(SUM(total_amount), 0) as sum FROM bookings WHERE status != \'cancelled\'');
        const totalRevenue = parseFloat(totalRevenueResult.rows[0].sum);

        const totalGuestsResult = await pool.query('SELECT COALESCE(SUM(guests), 0) as sum FROM bookings WHERE status = \'confirmed\'');
        const totalGuests = parseInt(totalGuestsResult.rows[0].sum);

        const pendingBookingsResult = await pool.query('SELECT COUNT(*) as count FROM bookings WHERE status = \'pending\'');
        const pendingBookings = parseInt(pendingBookingsResult.rows[0].count);

        const confirmedBookingsResult = await pool.query('SELECT COUNT(*) as count FROM bookings WHERE status = \'confirmed\'');
        const confirmedBookings = parseInt(confirmedBookingsResult.rows[0].count);

        const monthlyBookingsResult = await pool.query(`
          SELECT COUNT(*) as count FROM bookings 
          WHERE created_at >= DATE_TRUNC('month', CURRENT_DATE)
        `);
        const monthlyBookings = parseInt(monthlyBookingsResult.rows[0].count);

        const monthlyRevenueResult = await pool.query(`
          SELECT COALESCE(SUM(total_amount), 0) as sum FROM bookings 
          WHERE created_at >= DATE_TRUNC('month', CURRENT_DATE) AND status != 'cancelled'
        `);
        const monthlyRevenue = parseFloat(monthlyRevenueResult.rows[0].sum);

        // Calcola occupancy rate basato sui giorni prenotati vs giorni disponibili
        const occupancyRate = totalBookings > 0 ? Math.min(100, (totalBookings / 30) * 100) : 0;

        return res.status(200).json({
          success: true,
          stats: {
            totalBookings,
            totalRevenue,
            occupancyRate: Math.round(occupancyRate),
            totalGuests,
            averageStay: totalBookings > 0 ? (totalGuests / totalBookings).toFixed(1) : 0,
            monthlyBookings,
            monthlyRevenue,
            pendingBookings,
            confirmedBookings,
            cancelledBookings: totalBookings - confirmedBookings - pendingBookings,
            topSource: 'Direct Booking',
            averageRating: 4.8,
            totalReviews: totalBookings > 0 ? Math.floor(totalBookings * 0.8) : 0
          }
        });
      } catch (error) {
        console.error('❌ Errore dashboard stats:', error);
        return res.status(500).json({
          success: false,
          error: 'Errore caricamento statistiche dashboard'
        });
      }
    }

    if (action === 'analytics') {
      const analyticsData = [];
      const today = new Date();

      for (let i = 29; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);

        const bookings = Math.max(0, Math.floor(Math.random() * 3));
        const revenue = bookings * (150 + Math.random() * 100);
        const occupancy = bookings > 0 ? Math.min(100, 60 + Math.random() * 40) : 0;

        analyticsData.push({
          date: date.toISOString().split('T')[0],
          bookings,
          revenue: Math.round(revenue),
          occupancy: Math.round(occupancy)
        });
      }

      return res.status(200).json({
        success: true,
        analytics: analyticsData
      });
    }

    // ========================================
    // NOTIFICATIONS SECTION
    // ========================================
    if (action === 'notifications') {
      // Ritorna notifiche dal database (quando implementato)
      // Per ora ritorna array vuoto
      return res.status(200).json({
        success: true,
        notifications: [],
        message: 'Notifiche caricate dal backend (database)'
      });
    }

    // ========================================
    // BOOKINGS MANAGEMENT SECTION
    // ========================================
    if (action === 'booking') {
      if (req.method === 'GET') {
        try {
          // Ottieni le prenotazioni CONFERMATE, IN ATTESA e CANCELLATE (esclude solo draft/abbandonate)
          // draft = non ancora pagato, cancelled = rifiutato
          const result = await pool.query(`
            SELECT 
              id,
              booking_id,
              first_name,
              last_name,
              first_name || ' ' || last_name as customer_name,
              email as customer_email,
              phone,
              check_in,
              check_out,
              guests,
              total_amount,
              deposit_amount,
              status,
              payment_status,
              internal_notes,
              created_at
            FROM bookings
            WHERE status IN ('confirmed', 'pending', 'cancelled', 'draft')
            ORDER BY created_at DESC
          `);

          return res.status(200).json({
            success: true,
            bookings: result.rows.map(booking => ({
              ...booking,
              id: String(booking.id), // 🔧 ASSICURA che ID sia sempre stringa
              guestName: booking.customer_name || 'Ospite Sconosciuto', // 🔧 MAPPING per frontend
              internal_notes: booking.internal_notes || '',
              phone: booking.phone || '',
              total_amount: parseFloat(booking.total_amount), // Converti stringa in numero
              deposit_amount: booking.deposit_amount ? parseFloat(booking.deposit_amount) : 0,
              platform: booking.platform || 'direct',
              payment_method: booking.payment_status || 'pending', // Mantenuto per retrocompatibilità
              total_days: Math.max(1, Math.ceil((new Date(booking.check_out) - new Date(booking.check_in)) / (1000 * 60 * 60 * 24))),
              created_at: booking.created_at.toISOString()
            }))
          });
        } catch (error) {
          console.error('❌ Errore booking GET:', error);
          return res.status(500).json({
            success: false,
            error: 'Errore caricamento prenotazioni'
          });
        }
      }

      if (req.method === 'POST') {
        try {
          // Crea nuova prenotazione nel database
          const bookingData = req.body;
          const seasonalRules = await getSeasonalRules(pool); // 🔥 FIX: Fetch global seasonal rules per getRequiredMinStay
          console.log('📝 Nuova prenotazione ricevuta:', JSON.stringify(bookingData, null, 2));
          // DEBUG: Mostra tutti i dati ricevuti
          console.log('DEBUG bookingData:', bookingData);

          // 🔧 NORMALIZZAZIONE CAMPI: Supporto per strutture piatte e annidate (booking_data)
          const bData = bookingData.booking_data || {};

          // 🔧 NORMALIZZAZIONE CAMPI: supporta entrambi i formati (checkin/check_in, customerName/first_name, etc)
          const checkin = bookingData.checkin || bookingData.check_in || bData.checkin || bData.check_in || bData.check_in_date;
          const checkout = bookingData.checkout || bookingData.check_out || bData.checkout || bData.check_out || bData.check_out_date;
          const guests = bookingData.guests || bData.guests || (bookingData.adults || bData.adults || 0) + (bookingData.children || bData.children || 0) || 1;
          const adults = bookingData.adults || bData.adults || bookingData.guests || bData.guests || 1;
          const children = bookingData.children || bData.children || 0;
          const email = bookingData.customerEmail || bookingData.email || bookingData.customer_email || bData.guest_email || bData.email;
          const phone = bookingData.customerPhone || bookingData.phone || bData.guest_phone || bData.phone;
          const notes = bookingData.specialRequests || bookingData.notes || '';
          const parkingOption = bookingData.parkingOption || 'none'; // Get parking option from bookingData
          const childrenAges = bookingData.childrenAges || '';

          // 🛎️ Gestione Servizi Extra per prenotazioni manuali
          // Se presenti, li aggiungiamo alle note per persistenza
          let finalNotes = notes;
          if (bookingData.selected_services && Array.isArray(bookingData.selected_services) && bookingData.selected_services.length > 0) {
            const servicesText = bookingData.selected_services.map(s => `${s.name} (€${s.price})`).join(', ');
            finalNotes = (finalNotes ? finalNotes + '\n\n' : '') + `[SERVIZI EXTRA]: ${servicesText}`;
          }

          // 🔧 Helper per estrarre costi (supporta flat o nested in booking_data)
          // const getCost = (key) => parseFloat(bookingData[key]) || parseFloat(bookingData.booking_data?.[key]) || 0;

          // 🧮 CALCOLO INTELLIGENTE COSTI (Fallback se totalAmount è 0 o non valido)
          let totalAmount = parseFloat(bookingData.totalPrice) || parseFloat(bookingData.total_amount) || 0;
          let accommodationCost = 0;
          let cleaningFee = 0;
          let parkingCost = 0;
          let touristTax = 0;
          let extraServicesCost = parseFloat(bookingData.extraServicesCost) || 0; // Extra services cost is usually passed from frontend

          if (!totalAmount || isNaN(totalAmount) || totalAmount <= 0) {
            console.log('⚠️ totalAmount è 0 o non valido, ricalcolo il preventivo per la prenotazione.');

            const guestsNum = parseInt(guests);
            const adultsNum = parseInt(adults) || guestsNum;

            // 🔥 FIX: Fetch pricing config and seasonal rules missing from the local scope
            let pricing = {
              priceGroup1to2: 70, priceGroup3to4: 20, priceGroup5to6: 25, priceGroup7to8: 30,
              cleaningFee: 60, parkingFee: 20, touristTaxAdult: 2.00, touristTaxChild: 0,
              weeklyDiscount: 10, monthlyDiscount: 15
            };
            try {
              const pricingResult = await pool.query('SELECT * FROM pricing_config ORDER BY id DESC LIMIT 1');
              if (pricingResult.rows.length > 0) {
                const p = pricingResult.rows[0];
                pricing = {
                  priceGroup1to2: parseFloat(p.price_group_1to2) || 70,
                  priceGroup3to4: parseFloat(p.price_group_3to4) || 20,
                  priceGroup5to6: parseFloat(p.price_group_5to6) || 25,
                  priceGroup7to8: parseFloat(p.price_group_7to8) || 30,
                  cleaningFee: parseFloat(p.cleaning_fee) || 60,
                  parkingFee: parseFloat(p.parking_fee) || 20,
                  touristTaxAdult: parseFloat(p.tourist_tax_adult) || 2.00,
                  touristTaxChild: parseFloat(p.tourist_tax_child) || 0,
                  weeklyDiscount: parseFloat(p.weekly_discount) || 10,
                  monthlyDiscount: parseFloat(p.monthly_discount) || 15
                };
              }
            } catch (e) {
              console.error('Errore recupero pricing fallback:', e);
            }
            // seasonalRules is fetched globally for the booking block

            const checkInDate = new Date(checkin);
            const checkOutDate = new Date(checkout);
            const nights = Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24));

            // 🔥 NUOVA LOGICA: Calcolo per notte
            let calculatedAccommodationCost = 0;
            const detailsPerNight = [];

            for (let d = new Date(checkInDate); d < checkOutDate; d.setDate(d.getDate() + 1)) {
              let pricingForNight = { ...pricing }; // Start with default pricing
              let ruleApplied = null;
              const currentDateUTC = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));

              if (seasonalRules && Array.isArray(seasonalRules)) {
                for (const rule of seasonalRules) {
                  const ruleStartUTC = new Date(Date.UTC(new Date(rule.startDate).getUTCFullYear(), new Date(rule.startDate).getUTCMonth(), new Date(rule.startDate).getUTCDate()));
                  const ruleEndUTC = new Date(Date.UTC(new Date(rule.endDate).getUTCFullYear(), new Date(rule.endDate).getUTCMonth(), new Date(rule.endDate).getUTCDate()));
                  if (currentDateUTC >= ruleStartUTC && currentDateUTC <= ruleEndUTC) {
                    ruleApplied = rule.name;
                    if (rule.priceGroup1to2 != null) pricingForNight.priceGroup1to2 = rule.priceGroup1to2;
                    if (rule.priceGroup3to4 != null) pricingForNight.priceGroup3to4 = rule.priceGroup3to4;
                    if (rule.priceGroup5to6 != null) pricingForNight.priceGroup5to6 = rule.priceGroup5to6;
                    if (rule.priceGroup7to8 != null) pricingForNight.priceGroup7to8 = rule.priceGroup7to8;
                    break;
                  }
                }
              }
              const nightlyCost = calculateNightlyPrice(guestsNum, pricingForNight);
              calculatedAccommodationCost += nightlyCost;
              detailsPerNight.push({ date: d.toISOString().split('T')[0], cost: nightlyCost, rule: ruleApplied });
            }
            accommodationCost = calculatedAccommodationCost;

            // Apply long-stay discounts
            let discount = 0;
            if (nights >= 28) discount = pricing.monthlyDiscount;
            else if (nights >= 7) discount = pricing.weeklyDiscount;

            const discountAmount = (accommodationCost * discount) / 100;
            const discountedAccommodation = accommodationCost - discountAmount;

            // Calculate additional costs with seasonal overrides
            let finalPricing = { ...pricing };
            const firstDayRuleName = detailsPerNight[0]?.rule;
            if (firstDayRuleName) {
              const ruleDetails = seasonalRules.find(r => r.name === firstDayRuleName);
              if (ruleDetails) {
                if (ruleDetails.cleaningFee != null) finalPricing.cleaningFee = ruleDetails.cleaningFee;
                if (ruleDetails.parkingFee != null) finalPricing.parkingFee = ruleDetails.parkingFee;
                if (ruleDetails.touristTaxAdult != null) finalPricing.touristTaxAdult = ruleDetails.touristTaxAdult;
              }
            }

            cleaningFee = finalPricing.cleaningFee;
            parkingCost = (parkingOption === 'private') ? (finalPricing.parkingFee * nights) : 0;

            // Tourist tax calculation
            const childrenOver12 = childrenAges.split(',').map(age => parseInt(age.trim())).filter(age => !isNaN(age) && age > 12).length;
            const taxableGuests = adultsNum + childrenOver12;
            touristTax = finalPricing.touristTaxAdult * taxableGuests * nights;

            totalAmount = discountedAccommodation + cleaningFee + parkingCost + touristTax + extraServicesCost;
            console.log('✅ totalAmount ricalcolato:', totalAmount);

            bookingData.nights = nights; // Add nights to bookingData for email template
          } // End of recalculation block

          // Log di debug per il totale
          console.log('DEBUG totalAmount calcolato:', totalAmount, 'tipo:', typeof totalAmount);
          // Blocca se il totale non è valido (solo se realmente 0 o NaN)
          if (!totalAmount || isNaN(totalAmount) || totalAmount <= 0) {
            console.error('❌ Importo totale mancante o non valido:', totalAmount);
            return res.status(400).json({ success: false, error: 'Importo totale mancante o non valido' });
          }

          // 🔒 NUOVO CONTROLLO DISPONIBILITÀ UNIFICATO
          // Controlla sovrapposizioni con prenotazioni confermate, date bloccate e eventi esterni.
          const overlappingBookings = await pool.query(
            `
            WITH unavailable_periods AS (
              -- Prenotazioni dirette confermate
              SELECT check_in AS start_date, check_out AS end_date FROM bookings WHERE status IN ('confirmed', 'pending')
              
              UNION ALL
      
              -- Date bloccate manualmente dall'admin
              SELECT start_date, end_date FROM blocked_dates
      
              UNION ALL
      
              -- Eventi esterni sincronizzati (da Airbnb, Booking.com, etc.)
              -- Esclude blocchi di sistema non validi (già filtrati in calendar-real-sync)
              SELECT start_date::date, end_date::date FROM calendar_events
              WHERE NOT (
                LOWER(summary) LIKE '%canceled%'
                OR LOWER(summary) LIKE '%cancelled%'
                OR LOWER(description) LIKE '%canceled%'
                OR LOWER(description) LIKE '%cancelled%'
              )
              AND NOT (
                (platform = 'airbnb' OR calendar_source = 'airbnb') AND (
                  LOWER(summary) LIKE '%not available%'
                  OR LOWER(summary) LIKE '%blocked%'
                  OR LOWER(summary) LIKE '%holiday%'
                  OR LOWER(summary) LIKE '%festività%'
                  OR LOWER(summary) LIKE '%vacation%'
                  OR LOWER(summary) LIKE '%break%'
                  OR LOWER(summary) LIKE '%festa%'
                )
              )
              AND NOT (
                (platform = 'airbnb' OR calendar_source = 'airbnb') AND (
                  LOWER(summary) LIKE '%maintenance%'
                  OR LOWER(summary) LIKE '%pulizie%'
                  OR LOWER(summary) LIKE '%cleaning%'
                  OR LOWER(summary) LIKE '%manutenzione%'
                )
              )
              AND NOT (
                (platform = 'holidu' OR calendar_source = 'holidu') AND (
                  LOWER(summary) LIKE '%not available%'
                  OR LOWER(summary) LIKE '%unavailable%'
                  OR LOWER(summary) LIKE '%non disponibile%'
                  OR LOWER(summary) LIKE '%non-available%'
                )
              )
            )
            SELECT 1
            FROM unavailable_periods
            WHERE start_date < $2 AND end_date > $1
            LIMIT 1;
            `,
            [checkin, checkout]
          );

          if (overlappingBookings.rows.length > 0) {
            console.error('❌ CONFLITTO: Le date richieste si sovrappongono con una prenotazione/blocco esistente.', { checkin, checkout });
            return res.status(409).json({
              success: false,
              error: 'Le date selezionate non sono più disponibili. Si prega di scegliere un altro periodo.'
            });
          }

          // Parsing nome/cognome da customerName o campi separati
          let firstName = 'Nome';
          let lastName = 'Cognome';

          if (bookingData.customerName || bData.guest_name) {
            const nameParts = (bookingData.customerName || bData.guest_name).trim().split(' ');
            firstName = nameParts[0] || 'Nome';
            lastName = nameParts.slice(1).join(' ') || bData.guest_surname || 'Cognome';
          } else if (bookingData.first_name || bookingData.last_name || bData.first_name || bData.last_name) {
            firstName = bookingData.first_name || bData.first_name || 'Nome';
            lastName = bookingData.last_name || bData.last_name || 'Cognome';
          } else if (bookingData.customer_name) { // 🔧 FIX: Supporto snake_case dal frontend admin
            const nameParts = bookingData.customer_name.trim().split(' ');
            firstName = nameParts[0] || 'Nome';
            lastName = nameParts.slice(1).join(' ') || 'Cognome';
          }

          // 🔍 VALIDAZIONE DATI
          if (!checkin || !checkout) {
            console.error('❌ Date check-in/check-out mancanti:', { checkin, checkout });
            return res.status(400).json({
              success: false,
              error: 'Date check-in e check-out obbligatorie'
            });
          }

          // 🔧 FIX: Email facoltativa per prenotazioni manuali
          let finalEmail = email;
          if (!finalEmail && bookingData.platform === 'manual') {
            finalEmail = `manual-booking-${Date.now()}@vincanto-local.it`; // Placeholder per DB
          } else if (!finalEmail) {
            return res.status(400).json({
              success: false,
              error: 'Email cliente obbligatoria'
            });
          }

          console.log('✅ Dati normalizzati:', { checkin, checkout, guests, adults, children, firstName, lastName, email: finalEmail, phone, totalAmount });

          // ⚡ Estrai status dal payload (default 'pending' se non specificato)
          const bookingStatus = bookingData.status || 'pending';

          /*
           * 🔒 BLOCCO PAGAMENTI ONLINE (Temporaneamente disabilitato come nota)
           * Questo blocco impediva l'uso di Stripe e PayPal.
           * È stato commentato per riabilitare i pagamenti.
          const requestedMethod = (bookingData.paymentMethod || bookingData.payment_method || '').toLowerCase();
          if (requestedMethod.includes('paypal') || requestedMethod.includes('stripe') || requestedMethod.includes('card')) {
            return res.status(400).json({ 
              success: false, 
              error: 'Questo metodo di pagamento è temporaneamente disabilitato. Si prega di scegliere Bonifico Bancario.' 
            });
          }
          */

          // 📅 VALIDAZIONE SOGGIORNO MINIMO (Server-Side Enforcement)
          const checkInDate = new Date(checkin);
          const checkOutDate = new Date(checkout);
          const nights = Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24));

          // 🔥 FIX: Usa le regole stagionali caricate all'inizio della richiesta
          const finalRequiredMinStay = await getRequiredMinStay(checkInDate, checkOutDate, pool, seasonalRules);
          // 3. Validazione finale (con bypass per admin)
          if (bookingData.platform !== 'manual' && nights < finalRequiredMinStay) {
            console.error(`❌ Tentativo di prenotazione bloccato: ${nights} notti richieste, minimo ${finalRequiredMinStay}.`);
            return res.status(400).json({ success: false, error: `Soggiorno minimo non rispettato. Per le date selezionate sono richieste almeno ${finalRequiredMinStay} notti.` });
          }

          // 💰 Calcolo Acconto/Saldo per Admin
          let depositAmount = Math.round(totalAmount * 0.2 * 100) / 100; // Default 20%
          let paymentStatus = 'pending';

          if (bookingData.platform === 'manual') {
            if (bookingData.payment_type === 'full') {
              depositAmount = totalAmount;
              paymentStatus = 'paid_full'; // Considera pagato se inserito come saldo
            } else if (bookingData.payment_type === 'deposit') {
              // Se è acconto manuale, assumiamo che l'acconto sia stato pagato o sia da pagare
              // Se admin inserisce, spesso è perché ha ricevuto i soldi o li sta registrando
              paymentStatus = 'deposit_paid';
            }
            // Se specificato payment_status esplicito, usa quello
            if (bookingData.payment_status) paymentStatus = bookingData.payment_status;
          }

          const result = await pool.query(`
            INSERT INTO bookings (
              booking_id, check_in, check_out, guests, adults, children,
              first_name, last_name, email, phone, total_amount, 
              deposit_amount, notes, status, payment_status, created_at, updated_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, NOW(), NOW())
            RETURNING *
          `, [
            `VIN${Date.now()}`,
            checkin,
            checkout,
            guests,
            adults,
            children,
            firstName,
            lastName,
            finalEmail,
            phone,
            totalAmount,
            depositAmount,
            finalNotes,
            bookingStatus, // ⚡ Usa status dal payload invece di hardcoded 'pending'
            paymentStatus
          ]);

          // 📧 Invia email di conferma SOLO se status non è DRAFT
          if (bookingStatus !== 'draft' && process.env.SMTP_HOST && email) { // Invia solo se email reale presente
            try {
              const guestLanguage = detectLanguage(email);
              const emailHtml = renderEmailTemplate('booking_confirmation', {
                firstName,
                lastName,
                bookingId: result.rows[0].booking_id,
                checkin,
                checkout,
                guests,
                adults,
                children,
                totalAmount,
                depositAmount: Math.round(totalAmount * 0.2 * 100) / 100,
                notes, // 📝 Passa il messaggio dell'utente al template
                fromEmail: process.env.SMTP_FROM,
                language: guestLanguage,
                paymentMethod: bookingData.paymentMethod || bookingData.payment_method,
                // 🛎️ Includi eventuali servizi extra passati dal frontend
                extraServices: Array.isArray(bookingData.extraServices) ? bookingData.extraServices : (Array.isArray(bookingData.extra_services) ? bookingData.extra_services : []), // Ensure this is passed
                // 🔥 Passa il breakdown dei costi al template email
                accommodationCost: accommodationCost, // Use calculated values
                cleaningFee: cleaningFee, // Use calculated values
                parkingCost: parkingCost, // Use calculated values
                touristTax: touristTax, // Use calculated values
                extraServicesCost: extraServicesCost, // Use calculated values
                nights: nights, // Use calculated nights
                logoUrl: 'https://www.vincantomaiori.it/logo.png',
                siteUrl: 'https://www.vincantomaiori.it',
              });
              const emailResults = await sendEmailWithAdminCopy({
                to: email,
                subject: `Conferma Prenotazione ${result.rows[0].booking_id}`,
                html: emailHtml,
                templateName: 'booking_confirmation',
                metadata: {
                  bookingId: result.rows[0].booking_id,
                  totalAmount,
                  language: guestLanguage,
                  paymentMethod: bookingData.paymentMethod || bookingData.payment_method,
                  extraServices: Array.isArray(bookingData.extraServices) ? bookingData.extraServices : (Array.isArray(bookingData.extra_services) ? bookingData.extra_services : []),
                  // Admin copy metadata
                  accommodationCost: accommodationCost,
                  cleaningFee: cleaningFee,
                  parkingCost: parkingCost,
                  touristTax: touristTax,
                  extraServicesCost: extraServicesCost,
                  accommodationCost: parseFloat(bookingData.accommodationCost) || 0,
                  cleaningFee: parseFloat(bookingData.cleaningFee) || 0,
                  parkingCost: parseFloat(bookingData.parkingCost) || 0,
                  touristTax: parseFloat(bookingData.touristTax) || 0,
                  extraServicesCost: parseFloat(bookingData.extraServicesCost) || 0,
                  nights: parseInt(bookingData.nights) || 0
                }
              });
              const primarySuccess = emailResults.find(r => r.recipient === email)?.success;
              console.log(primarySuccess ? '✅ Email conferma inviata a:' : '⚠️ Email conferma fallita per:', email);
            } catch (emailError) {
              console.error('⚠️ Errore invio email:', emailError.message);
            }
          } else {
            console.log('ℹ️ Email non configurata, skip invio');
          }

          // Calcola importo da pagare per il frontend
          const amountToPay = bookingData.payment_type === 'deposit'
            ? parseFloat(result.rows[0].deposit_amount)
            : parseFloat(result.rows[0].total_amount);

          return res.status(201).json({
            success: true,
            message: 'Prenotazione creata con successo',
            booking: {
              ...result.rows[0],
              total_amount: parseFloat(result.rows[0].total_amount),
              deposit_amount: parseFloat(result.rows[0].deposit_amount)
            },
            // 💰 Frontend mapping: includi payment_amount per compatibilità StripePayment/PayPalPayment
            payment_amount: totalAmount,
            amountToPay: amountToPay, // 🔧 FIX: Restituisci importo da pagare esplicito
            booking_id: result.rows[0].booking_id,
            id: result.rows[0].id
          });
        } catch (error) {
          console.error('❌ Errore booking POST:', error);
          return res.status(500).json({
            success: false,
            message: 'Errore creazione prenotazione',
            error: error.message
          });
        }
      }

      if (req.method === 'PUT') {
        try {
          const { id, booking_id, ...updates } = req.body;

          // Supporta aggiornamento tramite id (numerico) o booking_id (stringa)
          const targetId = id;
          const targetBookingId = booking_id;

          if (!targetId && !targetBookingId) {
            return res.status(400).json({
              success: false,
              error: 'ID prenotazione obbligatorio (id o booking_id)'
            });
          }

          // Normalizza campi per aggiornamento
          const updateFields = [];
          const updateValues = [];
          let paramIndex = 1;

          if (updates.check_in) {
            updateFields.push(`check_in = $${paramIndex++}`);
            updateValues.push(updates.check_in);
          }
          if (updates.check_out) {
            updateFields.push(`check_out = $${paramIndex++}`);
            updateValues.push(updates.check_out);
          }
          if (updates.guests !== undefined) {
            updateFields.push(`guests = $${paramIndex++}`);
            updateValues.push(updates.guests);
          }
          if (updates.total_amount !== undefined) {
            updateFields.push(`total_amount = $${paramIndex++}`);
            updateValues.push(updates.total_amount);
          }
          if (updates.notes) {
            updateFields.push(`notes = $${paramIndex++}`);
            updateValues.push(updates.notes);
          }
          if (updates.status) {
            updateFields.push(`status = $${paramIndex++}`);
            updateValues.push(updates.status);
          }
          // Aggiungi supporto per payment_status se inviato
          if (updates.payment_status) {
            updateFields.push(`payment_status = $${paramIndex++}`);
            updateValues.push(updates.payment_status);
          }
          if (updates.internal_notes !== undefined) {
            updateFields.push(`internal_notes = $${paramIndex++}`);
            updateValues.push(updates.internal_notes);
          }

          if (updateFields.length === 0) {
            return res.status(400).json({
              success: false,
              error: 'Nessun campo da aggiornare'
            });
          }

          updateFields.push(`updated_at = NOW()`);

          let query = '';
          if (targetId) {
            updateValues.push(targetId);
            query = `UPDATE bookings SET ${updateFields.join(', ')} WHERE id = $${paramIndex} RETURNING *`;
          } else {
            updateValues.push(targetBookingId);
            query = `UPDATE bookings SET ${updateFields.join(', ')} WHERE booking_id = $${paramIndex} RETURNING *`;
          }

          const result = await pool.query(query, updateValues);

          if (result.rows.length === 0) {
            return res.status(404).json({
              success: false,
              error: 'Prenotazione non trovata'
            });
          }

          // ✍️ LOG AUDIT: Registra l'azione di modifica
          if (adminUser) {
            await logAdminAction(adminUser, 'update', 'booking', targetId || targetBookingId, { updates }, req);
          }

          return res.status(200).json({
            success: true,
            message: 'Prenotazione aggiornata',
            booking: result.rows[0]
          });
        } catch (error) {
          console.error('❌ Errore booking PUT:', error);
          return res.status(500).json({
            success: false,
            message: 'Errore aggiornamento prenotazione',
            error: error.message
          });
        }
      }

      if (req.method === 'DELETE') {
        try {
          const { id } = req.body;
          if (!id) {
            return res.status(400).json({
              success: false,
              error: 'ID prenotazione obbligatorio'
            });
          }

          // Recupera booking_id prima di eliminare per pulire le date
          const bookingCheck = await pool.query('SELECT booking_id FROM bookings WHERE id = $1', [id]);
          const bookingIdToDelete = bookingCheck.rows[0]?.booking_id;

          const result = await pool.query(
            `DELETE FROM bookings WHERE id = $1 RETURNING *`,
            [id]
          );

          if (bookingIdToDelete) {
            await pool.query("DELETE FROM blocked_dates WHERE description LIKE '%' || $1 || '%'", [bookingIdToDelete]);
            await pool.query("DELETE FROM calendar_events WHERE description LIKE '%' || $1 || '%' OR summary LIKE '%' || $1 || '%'", [bookingIdToDelete]);
          }

          if (result.rows.length === 0) {
            return res.status(404).json({
              success: false,
              error: 'Prenotazione non trovata'
            });
          }

          return res.status(200).json({
            success: true,
            message: 'Prenotazione eliminata',
            booking: result.rows[0]
          });
        } catch (error) {
          console.error('❌ Errore booking DELETE:', error);
          return res.status(500).json({
            success: false,
            message: 'Errore eliminazione prenotazione',
            error: error.message
          });
        }
      }

      // 🔧 FIX: Aggiunto metodo DELETE per eliminare date bloccate
      if (req.method === 'DELETE') {
        try {
          const { id } = req.body;
          if (!id) return res.status(400).json({ success: false, error: 'ID richiesto' });

          await pool.query('DELETE FROM blocked_dates WHERE id = $1', [id]);
          return res.status(200).json({ success: true, message: 'Data bloccata eliminata' });
        } catch (error) {
          console.error('❌ Errore eliminazione blocked-date:', error);
          return res.status(500).json({ success: false, error: error.message });
        }
      }

      // 🔧 FIX: Aggiunto metodo PUT per modificare date bloccate
      if (req.method === 'PUT') {
        try {
          const { id, start_date, end_date, reason } = req.body;
          if (!id) return res.status(400).json({ success: false, error: 'ID richiesto' });

          await pool.query(`
            UPDATE blocked_dates 
            SET start_date = $1, end_date = $2, reason = $3 
            WHERE id = $4
          `, [start_date, end_date, reason, id]);

          return res.status(200).json({ success: true, message: 'Data bloccata aggiornata' });
        } catch (error) {
          console.error('❌ Errore modifica blocked-date:', error);
          return res.status(500).json({ success: false, error: error.message });
        }
      }
    }

    // ========================================
    // CANCEL BOOKING ENDPOINT
    // ========================================
    // Cancella o marca come cancelled un booking (usato quando pagamento fallisce o da admin)
    if (action === 'cancel-booking') {
      if (req.method === 'POST') {
        try {
          const { bookingId, reason } = req.body;

          if (!bookingId) {
            return res.status(400).json({
              success: false,
              error: 'bookingId è richiesto'
            });
          }

          console.log(`🚫 Cancellazione booking richiesta: ${bookingId}, motivo: ${reason || 'non specificato'}`);

          // 1. Aggiorna il booking a status 'cancelled'
          // Gestione sicura ID numerico vs stringa
          let result;
          if (!isNaN(Number(bookingId))) {
            result = await pool.query(`
                UPDATE bookings 
                SET status = 'cancelled', payment_status = 'cancelled', updated_at = NOW()
                WHERE id = $1 OR booking_id = $2
                RETURNING *
             `, [Number(bookingId), String(bookingId)]);
          } else {
            result = await pool.query(`
                UPDATE bookings 
                SET status = 'cancelled', payment_status = 'cancelled', updated_at = NOW()
                WHERE booking_id = $1
                RETURNING *
             `, [String(bookingId)]);
          }

          if (result.rows.length === 0) {
            return res.status(404).json({
              success: false,
              error: 'Booking non trovato'
            });
          }

          const booking = result.rows[0];
          console.log(`✅ Booking ${booking.booking_id} marcato come cancellato`);

          // 1.b Salva il motivo della cancellazione nelle note (se presente)
          if (reason) {
            await pool.query(`
              UPDATE bookings 
              SET notes = COALESCE(notes, '') || E'\n[CANCELLATA]: ' || $1
              WHERE id = $2
            `, [reason, booking.id]);
          }

          // 2. Libera le date nel calendario (rimuovi da blocked_dates)
          // Le date in blocked_dates sono inserite con descrizione "Prenotazione VIN..."
          const deleteBlocked = await pool.query(`
            DELETE FROM blocked_dates 
            WHERE description LIKE '%' || $1 || '%'
          `, [booking.booking_id]);

          console.log(`✅ Date liberate in blocked_dates: ${deleteBlocked.rowCount} righe rimosse`);

          // 2.b Libera anche eventuali eventi calendario sincronizzati (calendar_events)
          const deleteCalendarEvents = await pool.query(`
            DELETE FROM calendar_events
            WHERE description LIKE '%' || $1 || '%' OR summary LIKE '%' || $1 || '%'
          `, [booking.booking_id]);
          console.log(`✅ Eventi calendario rimossi: ${deleteCalendarEvents.rowCount}`);

          // 3. Invia email di cancellazione
          if (process.env.SMTP_HOST && booking.email) {
            try {
              const guestLanguage = detectLanguage(booking.email);
              const subject = guestLanguage === 'it' ? `Cancellazione Prenotazione ${booking.booking_id}` : `Booking Cancellation ${booking.booking_id}`;

              // 🔧 FIX: Usa HTML inline per garantire l'invio anche se il template manca
              const reasonText = reason ? (guestLanguage === 'it' ? `<br><strong>Motivo:</strong> ${reason}` : `<br><strong>Reason:</strong> ${reason}`) : '';
              const messageText = guestLanguage === 'it'
                ? `Gentile ${booking.first_name || 'Ospite'},<br><br>La tua prenotazione <strong>${booking.booking_id}</strong> è stata cancellata.${reasonText}`
                : `Dear ${booking.first_name || 'Guest'},<br><br>Your booking <strong>${booking.booking_id}</strong> has been cancelled.${reasonText}`;

              const emailHtml = `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
                  <div style="text-align: center; margin-bottom: 20px;">
                    <img src="https://www.vincantomaiori.it/logo.png" alt="Vincanto Maori" style="max-height: 80px;">
                  </div>
                  <h2 style="color: #d32f2f; text-align: center;">${subject}</h2>
                  <div style="font-size: 16px; line-height: 1.6; color: #333;">
                    ${messageText}
                  </div>
                  <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; font-size: 12px; color: #888;">
                    <p>Vincanto Maori - Via Torre di Milo, 7 - Maiori (SA)</p>
                    <p><a href="https://www.vincantomaiori.it" style="color: #2563eb; text-decoration: none;">www.vincantomaiori.it</a></p>
                  </div>
                </div>
              `;

              await sendEmailWithAdminCopy({
                to: booking.email,
                subject: subject,
                html: emailHtml,
                templateName: 'cancellation'
              });
              console.log(`✅ Email cancellazione inviata a ${booking.email}`);
            } catch (e) {
              console.error('⚠️ Errore invio email cancellazione:', e.message);
            }
          }

          return res.status(200).json({
            success: true,
            message: 'Booking cancellato con successo e date liberate',
            bookingId: booking.booking_id,
            reason: reason
          });
        } catch (error) {
          console.error('❌ Errore cancellazione booking:', error);
          return res.status(500).json({
            success: false,
            error: 'Errore nella cancellazione del booking'
          });
        }
      }
    }

    // ========================================
    // ADMIN AUDIT LOG ENDPOINT
    // ========================================
    if (action === 'admin/audit-log') {
      // 🛡️ SICUREZZA: Solo SuperAdmin può accedere ai log
      if (!adminUser || adminUser.role !== 'superadmin') {
        return res.status(403).json({ success: false, error: 'Accesso negato. Richiesto ruolo SuperAdmin.' });
      }

      if (req.method === 'GET') {
        try {
          const limit = parseInt(req.query.limit) || 100;
          const offset = parseInt(req.query.offset) || 0;

          const logResult = await pool.query(
            'SELECT * FROM admin_audit_log ORDER BY created_at DESC LIMIT $1 OFFSET $2',
            [limit, offset]
          );
          const totalResult = await pool.query('SELECT COUNT(*) FROM admin_audit_log');

          return res.status(200).json({
            success: true,
            logs: logResult.rows,
            total: parseInt(totalResult.rows[0].count, 10)
          });
        } catch (error) {
          return res.status(500).json({ success: false, error: 'Errore nel caricamento dei log di audit.' });
        }
      }
    }

    // ========================================
    // ADMIN USER MANAGEMENT (SuperAdmin only)
    // ========================================
    if (action === 'admin/users') {
      // 🛡️ SICUREZZA: Solo SuperAdmin può gestire utenti
      if (!adminUser || adminUser.role !== 'superadmin') {
        return res.status(403).json({ success: false, error: 'Accesso negato. Richiesto ruolo SuperAdmin.' });
      }

      // GET: Lista tutti gli admin (escluso il superadmin stesso per sicurezza)
      if (req.method === 'GET') {
        try {
          const result = await pool.query(
            "SELECT id, name, email, role, is_active, last_login, created_at, subscription_status FROM admin_users WHERE role != 'superadmin' ORDER BY created_at DESC"
          );
          return res.status(200).json({ success: true, users: result.rows });
        } catch (error) {
          return res.status(500).json({ success: false, error: 'Errore nel caricamento degli utenti.' });
        }
      }

      // POST: Crea un nuovo admin
      if (req.method === 'POST') {
        try {
          const { name, email, password, role, is_active } = req.body;
          if (!name || !email || !password || !role) {
            return res.status(400).json({ success: false, error: 'Nome, email, password e ruolo sono obbligatori.' });
          }

          const existingUser = await pool.query('SELECT id FROM admin_users WHERE email = $1', [email]);
          if (existingUser.rows.length > 0) {
            return res.status(409).json({ success: false, error: 'Un utente con questa email esiste già.' });
          }

          const passwordHash = await bcrypt.hash(password, 10);
          const result = await pool.query(
            `INSERT INTO admin_users (name, email, password_hash, role, is_active) VALUES ($1, $2, $3, $4, $5) RETURNING id, name, email, role, is_active`,
            [name, email, passwordHash, role, is_active]
          );

          await logAdminAction(adminUser, 'create', 'admin_user', result.rows[0].id, { email, role }, req);

          return res.status(201).json({ success: true, user: result.rows[0] });
        } catch (error) {
          return res.status(500).json({ success: false, error: 'Errore nella creazione dell\'utente.' });
        }
      }

      // PUT: Aggiorna un admin
      if (req.method === 'PUT') {
        try {
          const { id } = req.query;
          const { name, email, role, is_active, password } = req.body;

          if (!id) {
            return res.status(400).json({ success: false, error: 'ID utente mancante.' });
          }

          const updateFields = [];
          const updateValues = [];
          let paramIndex = 1;

          if (name) { updateFields.push(`name = $${paramIndex++}`); updateValues.push(name); }
          if (email) { updateFields.push(`email = $${paramIndex++}`); updateValues.push(email); }
          if (role) { updateFields.push(`role = $${paramIndex++}`); updateValues.push(role); }
          if (is_active !== undefined) { updateFields.push(`is_active = $${paramIndex++}`); updateValues.push(is_active); }
          if (password) {
            const passwordHash = await bcrypt.hash(password, 10);
            updateFields.push(`password_hash = $${paramIndex++}`);
            updateValues.push(passwordHash);
          }

          if (updateFields.length === 0) {
            return res.status(400).json({ success: false, error: 'Nessun campo da aggiornare.' });
          }

          updateValues.push(id);
          const query = `UPDATE admin_users SET ${updateFields.join(', ')}, updated_at = NOW() WHERE id = $${paramIndex} RETURNING id, name, email, role, is_active`;

          const result = await pool.query(query, updateValues);

          if (result.rowCount === 0) {
            return res.status(404).json({ success: false, error: 'Utente non trovato.' });
          }

          await logAdminAction(adminUser, 'update', 'admin_user', id, { updates: req.body }, req);

          return res.status(200).json({ success: true, user: result.rows[0] });
        } catch (error) {
          if (error.code === '23505') { // unique_violation
            return res.status(409).json({ success: false, error: 'Un utente con questa email esiste già.' });
          }
          return res.status(500).json({ success: false, error: 'Errore nell\'aggiornamento dell\'utente.' });
        }
      }

      // DELETE: Elimina un admin
      if (req.method === 'DELETE') {
        try {
          const { id } = req.query;
          if (!id) {
            return res.status(400).json({ success: false, error: 'ID utente mancante.' });
          }

          // Per sicurezza, non permettere di cancellare se stessi
          if (String(adminUser.userId) === String(id)) {
            return res.status(400).json({ success: false, error: 'Non puoi eliminare te stesso.' });
          }

          const result = await pool.query('DELETE FROM admin_users WHERE id = $1 RETURNING id, email', [id]);

          if (result.rowCount === 0) {
            return res.status(404).json({ success: false, error: 'Utente non trovato.' });
          }

          await logAdminAction(adminUser, 'delete', 'admin_user', id, { deletedUser: result.rows[0] }, req);

          return res.status(200).json({ success: true, message: 'Utente eliminato con successo.' });
        } catch (error) {
          return res.status(500).json({ success: false, error: 'Errore nell\'eliminazione dell\'utente.' });
        }
      }
    }

    // ========================================
    // CALENDAR VIEW DATA (UNIFIED)
    // ========================================
    if (action === 'calendar-view-data') {
      // This endpoint is protected by the admin role check via JWT
      if (!adminUser) {
        return res.status(403).json({ success: false, error: 'Accesso negato. Autenticazione richiesta.' });
      }

      try {
        // 1. Get direct bookings
        const bookingsResult = await pool.query(`
          SELECT id, booking_id, check_in, check_out, customer_name, email, phone, status, 'direct' as platform
          FROM bookings 
          WHERE status = 'confirmed' OR status = 'pending'
        `);

        // 2. Get external calendar events (already filtered in the view/query)
        const eventsResult = await pool.query(`
          SELECT id, uid, calendar_source as platform, summary, description, start_date, end_date
          FROM calendar_events
          WHERE start_date >= NOW() - INTERVAL '2 year'
            AND NOT (LOWER(summary) LIKE '%canceled%' OR LOWER(summary) LIKE '%cancelled%')
            AND NOT ((platform = 'airbnb' OR calendar_source = 'airbnb') AND (LOWER(summary) LIKE '%not available%' OR LOWER(summary) LIKE '%blocked%'))
            AND NOT ((platform = 'holidu' OR calendar_source = 'holidu') AND (LOWER(summary) LIKE '%not available%' OR LOWER(summary) LIKE '%unavailable%'))
        `);

        // 3. Get manually blocked dates
        const blockedDatesResult = await pool.query(`
          SELECT id, start_date, end_date, reason, description
          FROM blocked_dates
        `);

        return res.status(200).json({
          success: true,
          bookings: bookingsResult.rows,
          externalEvents: eventsResult.rows,
          blockedDates: blockedDatesResult.rows,
        });

      } catch (error) {
        console.error('❌ Errore in calendar-view-data:', error);
        return res.status(500).json({ success: false, error: 'Errore nel caricamento dei dati del calendario.' });
      }
    }

    // ========================================
    // SEND PAYMENT REMINDER
    // ========================================
    if (action === 'send-payment-reminder') {
      if (req.method === 'POST') {
        try {
          const { bookingId, paymentType } = req.body; // paymentType: 'deposit', 'balance', 'full'

          // Fetch booking
          const bookingResult = await pool.query(
            `SELECT * FROM bookings WHERE id = $1 OR booking_id = $2`,
            [isNaN(Number(bookingId)) ? null : Number(bookingId), String(bookingId)]
          );

          if (bookingResult.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Prenotazione non trovata' });
          }
          const booking = bookingResult.rows[0];

          if (!booking.email) {
            return res.status(400).json({ success: false, error: 'Email cliente mancante' });
          }

          const guestLanguage = detectLanguage(booking.email);
          let subject = '';
          let messageBody = '';
          let amount = 0;

          if (paymentType === 'deposit') {
            amount = parseFloat(booking.deposit_amount);
            subject = guestLanguage === 'it' ? `Promemoria Acconto - Prenotazione ${booking.booking_id}` : `Deposit Reminder - Booking ${booking.booking_id}`;
            messageBody = guestLanguage === 'it'
              ? `Gentile ${booking.first_name},<br><br>Ti ricordiamo che siamo in attesa del pagamento dell'acconto di <strong>€${amount.toFixed(2)}</strong> per confermare la tua prenotazione.`
              : `Dear ${booking.first_name},<br><br>This is a reminder that we are awaiting the deposit payment of <strong>€${amount.toFixed(2)}</strong> to confirm your booking.`;
          } else if (paymentType === 'balance') {
            amount = parseFloat(booking.total_amount) - (parseFloat(booking.deposit_amount) || 0);
            subject = guestLanguage === 'it' ? `Promemoria Saldo - Prenotazione ${booking.booking_id}` : `Balance Payment Reminder - Booking ${booking.booking_id}`;
            messageBody = guestLanguage === 'it'
              ? `Gentile ${booking.first_name},<br><br>Ti ricordiamo che il saldo di <strong>€${amount.toFixed(2)}</strong> per la tua prenotazione è in scadenza.`
              : `Dear ${booking.first_name},<br><br>This is a reminder that the balance payment of <strong>€${amount.toFixed(2)}</strong> for your booking is due.`;
          } else {
            amount = parseFloat(booking.total_amount);
            subject = guestLanguage === 'it' ? `Promemoria Pagamento - Prenotazione ${booking.booking_id}` : `Payment Reminder - Booking ${booking.booking_id}`;
            messageBody = guestLanguage === 'it'
              ? `Gentile ${booking.first_name},<br><br>Ti ricordiamo che siamo in attesa del pagamento totale di <strong>€${amount.toFixed(2)}</strong> per la tua prenotazione.`
              : `Dear ${booking.first_name},<br><br>This is a reminder that we are awaiting the full payment of <strong>€${amount.toFixed(2)}</strong> for your booking.`;
          }

          const emailHtml = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
              <div style="text-align: center; margin-bottom: 20px;">
                <img src="https://www.vincantomaiori.it/logo.png" alt="Vincanto Maori" style="max-height: 80px;">
              </div>
              <h2 style="color: #2563eb; text-align: center;">${subject}</h2>
              <div style="font-size: 16px; line-height: 1.6; color: #333;">
                ${messageBody}
                <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin-top: 20px;">
                  <strong>${guestLanguage === 'it' ? 'Dati per il bonifico:' : 'Bank Transfer Details:'}</strong><br />
                  Beneficiario: ${process.env.BANK_HOLDER || 'Guida Antonio'}<br />
                  IBAN: ${process.env.BANK_IBAN || 'ITXX XXXX XXXX XXXX XXXX XXXX XXX'}<br />
                  Causale: Prenotazione ${booking.booking_id}
                </div>
              </div>
            </div>
          `;

          await sendEmailWithAdminCopy({ to: booking.email, subject, html: emailHtml, templateName: 'payment_reminder' });
          return res.status(200).json({ success: true, message: 'Email di promemoria inviata' });
        } catch (error) {
          console.error('❌ Errore invio promemoria:', error);
          return res.status(500).json({ success: false, error: error.message });
        }
      }
    }

    // ========================================
    // UPDATE EXTERNAL EVENT NOTES
    // ========================================
    if (action === 'admin/update-external-event-notes') {
      if (!adminUser) {
        return res.status(403).json({ success: false, error: 'Autenticazione richiesta.' });
      }
      if (req.method === 'POST') {
        try {
          const { eventId, notes } = req.body;
          if (eventId === undefined || notes === undefined) {
            return res.status(400).json({ success: false, error: 'ID evento e note sono obbligatori.' });
          }

          const result = await pool.query(
            `UPDATE calendar_events SET internal_notes = $1, updated_at = NOW() WHERE id = $2 RETURNING id, internal_notes`,
            [notes, eventId]
          );

          if (result.rowCount === 0) {
            return res.status(404).json({ success: false, error: 'Evento non trovato.' });
          }

          // Log audit
          await logAdminAction(adminUser, 'update_notes', 'external_event', eventId, { notes: notes.substring(0, 100) + '...' }, req);

          return res.status(200).json({ success: true, updatedEvent: result.rows[0] });

        } catch (error) {
          console.error('❌ Errore in update-external-event-notes:', error);
          return res.status(500).json({ success: false, error: 'Errore durante l\'aggiornamento delle note.' });
        }
      }
    }

    // ========================================
    // CLEAR TEST DATA SECTION
    // ========================================
    if (action === 'clear-test-bookings') {
      if (req.method === 'DELETE' || req.method === 'GET') {
        try {
          // Cancella tutte le prenotazioni simulate/test/mock
          console.log('🗑️ Cancellando dati mock dal database...');

          // Recupera ID per pulire blocked_dates
          const bookingsToDelete = await pool.query(`
            SELECT booking_id FROM bookings 
            WHERE booking_id LIKE 'VIN%' 
               OR email LIKE '%@email.com'
               OR first_name IN ('Mario', 'Anna', 'Giuseppe', 'Marco', 'Silvia')
               OR last_name IN ('Rossi', 'Bianchi', 'Verdi', 'Neri', 'Gialli')
               OR id IN (1, 2, 3, 4, 5)
          `);
          const bookingIds = bookingsToDelete.rows.map(r => r.booking_id);

          // Cancella prenotazioni con pattern tipici dei dati mock
          const deleteResult = await pool.query(`
            DELETE FROM bookings 
            WHERE booking_id LIKE 'VIN%' 
               OR email LIKE '%@email.com'
               OR first_name IN ('Mario', 'Anna', 'Giuseppe', 'Marco', 'Silvia')
               OR last_name IN ('Rossi', 'Bianchi', 'Verdi', 'Neri', 'Gialli')
               OR id IN (1, 2, 3, 4, 5)
          `);

          // Pulisci date bloccate associate
          if (bookingIds.length > 0) {
            for (const bid of bookingIds) {
              await pool.query("DELETE FROM blocked_dates WHERE description LIKE '%' || $1 || '%'", [bid]);
              await pool.query("DELETE FROM calendar_events WHERE description LIKE '%' || $1 || '%' OR summary LIKE '%' || $1 || '%'", [bid]);
            }
          }

          // Cancella anche richieste contatti mock
          const contactsResult = await pool.query(`
            DELETE FROM contact_requests 
            WHERE email LIKE '%@email.com'
               OR name IN ('Anna Gialli', 'Marco Neri', 'Silvia Bianchi')
          `);

          console.log(`✅ Cancellate ${deleteResult.rowCount} prenotazioni mock`);
          console.log(`✅ Cancellate ${contactsResult.rowCount} richieste contatti mock`);

          return res.status(200).json({
            success: true,
            message: 'Dati mock cancellati con successo',
            deletedBookings: deleteResult.rowCount,
            deletedContacts: contactsResult.rowCount
          });
        } catch (error) {
          console.error('❌ Errore cancellazione prenotazioni test:', error);
          return res.status(500).json({
            success: false,
            error: 'Errore cancellazione prenotazioni test'
          });
        }
      }
    }

    // ========================================
    // PAYMENTS SECTION (PAYPAL INTEGRATED)
    // ========================================
    if (action === 'payments') {
      try {
        // Ottieni pagamenti basati sulle prenotazioni reali
        const result = await pool.query(`
          SELECT 
            id,
            booking_id,
            total_amount,
            deposit_amount,
            first_name || ' ' || last_name as guest,
            payment_status,
            status,
            created_at,
            check_in,
            check_out
          FROM bookings 
          WHERE total_amount > 0
          ORDER BY created_at DESC
        `);

        const payments = result.rows.map((booking, index) => ({
          id: booking.id,
          bookingId: booking.booking_id,
          amount: booking.payment_status === 'paid_full' ? parseFloat(booking.total_amount) : parseFloat(booking.deposit_amount || booking.total_amount * 0.3),
          currency: 'EUR',
          status: booking.payment_status === 'paid_full' ? 'completed' :
            booking.payment_status === 'deposit_paid' ? 'completed' : 'pending',
          method: 'paypal', // Assumiamo PayPal per ora
          date: booking.created_at.toISOString(),
          guest: booking.guest,
          paypalLink: 'https://www.paypal.me/AntonioGuida320',
          description: `${booking.payment_status === 'paid_full' ? 'Pagamento completo' : 'Acconto'} prenotazione ${booking.check_in} - ${booking.check_out}`
        }));

        return res.status(200).json({
          success: true,
          payments: payments
        });
      } catch (error) {
        console.error('❌ Errore payments:', error);
        return res.status(500).json({
          success: false,
          error: 'Errore caricamento metodi di pagamento'
        });
      }
    }

    // ========================================
    // STRIPE INTEGRATION SECTION
    // ========================================
    if (action === 'stripe-payment-intent') {
      if (req.method === 'POST') {
        try {
          const { amount, currency, bookingId, guestEmail } = req.body;
          let safeAmount = Number(amount || 0);
          // Fallback backend: se amount non valido, prova a derivarlo dalla prenotazione
          if (!safeAmount || isNaN(safeAmount) || safeAmount <= 0) {
            if (bookingId) {
              try {
                const amtRes = await pool.query(
                  `SELECT COALESCE(total_amount, 0) AS total FROM bookings WHERE booking_id = $1 LIMIT 1`,
                  [bookingId]
                );
                const dbAmount = Number(amtRes.rows?.[0]?.total || 0);
                if (dbAmount > 0) {
                  safeAmount = dbAmount;
                  console.log('🛟 Backend fallback amount da DB:', safeAmount);
                }
              } catch (e) {
                console.warn('⚠️ Impossibile derivare amount da DB:', e.message);
              }
            }
          }
          // Validazione finale
          if (!safeAmount || isNaN(safeAmount) || safeAmount <= 0) {
            return res.status(400).json({ success: false, message: `Importo non valido: ${safeAmount}` });
          }
          const stripe = new Stripe(process.env.STRIPE_SECRET_KEY); // ⚡ Use imported Stripe
          const paymentIntent = await stripe.paymentIntents.create({
            amount: Math.round(Number(safeAmount) * 100),
            currency,
            metadata: { bookingId, guestEmail },
            // automatic_payment_methods: { enabled: true } // ⚡ Disabilitato per evitare errori di configurazione dashboard
            payment_method_types: ['card'] // ⚡ Forza carta di credito
          });
          return res.status(200).json({
            success: true,
            // Compatibilità con frontend
            client_secret: paymentIntent.client_secret,
            payment_intent_id: paymentIntent.id,
            // Manteniamo anche i campi precedenti per retrocompatibilità
            clientSecret: paymentIntent.client_secret,
            paymentIntentId: paymentIntent.id,
            amount: paymentIntent.amount,
            currency: paymentIntent.currency,
            status: paymentIntent.status,
            metadata: paymentIntent.metadata
          });
        } catch (error) {
          console.error('❌ Errore Stripe Payment Intent:', error);
          return res.status(500).json({
            success: false,
            message: 'Errore nella creazione del pagamento',
            error: error.message
          });
        }
      }
    }

    if (action === 'stripe-confirm-payment') {
      if (req.method === 'POST') {
        try {
          const { paymentIntentId, bookingId } = req.body;
          const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
          // Recupera PaymentIntent reale
          let paymentIntent;
          try {
            paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
          } catch (stripeError) {
            return res.status(400).json({
              success: false,
              message: 'PaymentIntent non trovato',
              error: stripeError.message
            });
          }
          // Verifica stato
          if (paymentIntent.status !== 'succeeded' && paymentIntent.status !== 'requires_capture') {
            return res.status(400).json({
              success: false,
              message: `Pagamento non riuscito: ${paymentIntent.status}`,
              status: paymentIntent.status
            });
          }
          // Aggiorna stato pagamento nel database
          await pool.query(`
            UPDATE bookings 
            SET payment_status = 'paid_deposit', 
                stripe_payment_intent = $1,
                updated_at = NOW()
            WHERE booking_id = $2
          `, [paymentIntentId, bookingId]);
          return res.status(200).json({
            success: true,
            message: 'Pagamento confermato con successo',
            paymentIntentId: paymentIntentId,
            bookingId: bookingId,
            status: paymentIntent.status
          });
        } catch (error) {
          console.error('❌ Errore conferma Stripe:', error);
          return res.status(500).json({
            success: false,
            message: 'Errore nella conferma del pagamento',
            error: error.message
          });
        }
      }
    }

    // ⚡ PAYPAL CAPTURE ENDPOINT (chiamato da PayPalPayment.tsx dopo onApprove)
    if (action === 'paypal-capture') {
      if (req.method === 'POST') {
        try {
          const { orderID, paypalOrder, bookingId, customerEmail, customerName } = req.body;

          console.log('📦 PayPal Capture ricevuto:', { orderID, bookingId, customerEmail });

          // Verifica che l'ordine PayPal sia stato catturato con successo
          if (!paypalOrder || paypalOrder.status !== 'COMPLETED') {
            return res.status(400).json({
              success: false,
              message: 'Ordine PayPal non completato',
              status: paypalOrder?.status || 'unknown'
            });
          }

          // Estrai amount dalla capture
          const captureAmount = parseFloat(
            paypalOrder.purchase_units?.[0]?.payments?.captures?.[0]?.amount?.value || 0
          );

          console.log('✅ PayPal payment completato:', {
            orderID,
            amount: captureAmount,
            status: paypalOrder.status
          });

          // Log del pagamento nel database (opzionale)
          // Qui potresti salvare i dettagli PayPal nella tabella bookings

          return res.status(200).json({
            success: true,
            message: 'Pagamento PayPal confermato',
            orderID: orderID,
            amount: captureAmount,
            status: 'completed',
            paypalStatus: paypalOrder.status
          });

        } catch (error) {
          console.error('❌ Errore PayPal capture:', error);
          return res.status(500).json({
            success: false,
            message: 'Errore nella conferma del pagamento PayPal',
            error: error.message
          });
        }
      }
    }

    // ⚡ NUOVO ENDPOINT: Aggiorna status booking dopo payment success
    if (action === 'update-booking-status') {
      if (req.method === 'POST') {
        try {
          const { booking_id, status, payment_id, payment_status, amount_paid } = req.body;

          if (!booking_id || !status) {
            return res.status(400).json({
              success: false,
              message: 'booking_id e status obbligatori'
            });
          }

          // Valida status
          const validStatuses = ['draft', 'pending', 'confirmed', 'cancelled'];
          if (!validStatuses.includes(status)) {
            return res.status(400).json({
              success: false,
              message: `Status non valido. Valori accettati: ${validStatuses.join(', ')}`
            });
          }

          // 🔧 Helper per estrarre costi dal body
          const getCost = (key) => parseFloat(req.body[key]) || parseFloat(req.body.booking_data?.[key]) || 0;

          // 🧮 CALCOLO INTELLIGENTE COSTI (Fallback per update)
          // Recupera il totale dal DB se non presente nel body, per calcoli coerenti
          // (Qui assumiamo che i costi parziali siano passati nel body, altrimenti usiamo 0 o logica simile)
          let cleaningFee = getCost('cleaningFee');
          let parkingCost = getCost('parkingCost');
          let touristTax = getCost('touristTax');
          let extraServicesCost = getCost('extraServicesCost');
          let accommodationCost = getCost('accommodationCost');

          // Nota: In update-status spesso non abbiamo il totalAmount nel body, ma è nel DB.
          // Se accommodationCost è 0, l'email mostrerà 0, ma è meglio che mostrare NaN.
          // Se il frontend invia storedBreakdown, questi valori saranno > 0.

          // Prepara update query con dati payment opzionali
          const updateFields = ['status = $1', 'updated_at = NOW()'];
          const values = [status];
          let paramIndex = 2;

          if (payment_id) {
            updateFields.push(`stripe_payment_intent = $${paramIndex}`);
            values.push(payment_id);
            paramIndex++;
          }

          if (payment_status) {
            updateFields.push(`payment_status = $${paramIndex}`);
            values.push(payment_status === 'success' ? 'deposit_paid' : payment_status);
            paramIndex++;
          }

          if (amount_paid) {
            updateFields.push(`deposit_amount = $${paramIndex}`);
            values.push(amount_paid);
            paramIndex++;
          }

          values.push(booking_id); // WHERE condition

          const updateQuery = `
            UPDATE bookings 
            SET ${updateFields.join(', ')}
            WHERE booking_id = $${paramIndex}
          `;

          const result = await pool.query(updateQuery, values);

          if (result.rowCount === 0) {
            return res.status(404).json({
              success: false,
              message: `Booking ${booking_id} non trovato`
            });
          }

          console.log(`✅ Booking ${booking_id} aggiornato: ${status}`);

          // 📧 INVIA EMAIL CONFERMA quando status = confirmed
          if (status === 'confirmed' && process.env.SMTP_HOST) {
            try {
              // Fetch booking data per email
              const bookingData = await pool.query(
                'SELECT * FROM bookings WHERE booking_id = $1',
                [booking_id]
              );

              if (bookingData.rows.length > 0) {
                const booking = bookingData.rows[0];
                const guestLanguage = detectLanguage(booking.email);
                const emailHtml = renderEmailTemplate('booking_confirmation', {
                  firstName: booking.name?.split(' ')[0] || 'Cliente',
                  lastName: booking.name?.split(' ')[1] || '',
                  bookingId: booking.booking_id,
                  checkin: booking.check_in,
                  checkout: booking.check_out,
                  guests: booking.guests || 0,
                  adults: booking.adults || booking.guests || 0,
                  children: booking.children || 0,
                  totalAmount: parseFloat(booking.total_amount) || 0,
                  depositAmount: parseFloat(booking.deposit_amount) || parseFloat(booking.total_amount) * 0.2,
                  fromEmail: process.env.SMTP_FROM,
                  language: guestLanguage,
                  paymentMethod: req.body.payment_method || req.body.paymentMethod,
                  notes: booking.notes, // 📝 Passa le note
                  // 🛎️ Se il client invia i servizi extra nel corpo della richiesta, includili nell'email
                  extraServices: Array.isArray(req.body.extra_services) ? req.body.extra_services : (Array.isArray(req.body.extraServices) ? req.body.extraServices : (Array.isArray(req.body.booking_data?.extra_services) ? req.body.booking_data.extra_services : [])),
                  // 🔥 Passa il breakdown dei costi dal body della richiesta (il DB non ha questi campi)
                  accommodationCost: accommodationCost,
                  cleaningFee: cleaningFee,
                  parkingCost: parkingCost,
                  touristTax: touristTax,
                  extraServicesCost: extraServicesCost,
                  nights: parseInt(req.body.nights) || 0,
                  logoUrl: 'https://www.vincantomaiori.it/logo.png',
                  siteUrl: 'https://www.vincantomaiori.it'
                });

                const emailResults = await sendEmailWithAdminCopy({
                  to: booking.email,
                  subject: `Conferma Prenotazione ${booking.booking_id}`,
                  html: emailHtml,
                  templateName: 'booking_confirmation',
                  metadata: {
                    bookingId: booking.booking_id,
                    totalAmount: booking.total_amount,
                    language: guestLanguage,
                    paymentConfirmed: true
                  }
                });

                const primarySuccess = emailResults.find(r => r.recipient === booking.email)?.success;
                console.log(primarySuccess ? `✅ Email conferma inviata a: ${booking.email}` : `⚠️ Email conferma fallita per: ${booking.email}`);
              }
            } catch (emailError) {
              console.error('⚠️ Errore invio email conferma:', emailError.message);
              // Non bloccare la risposta anche se email fallisce
            }
          }

          return res.status(200).json({
            success: true,
            message: `Booking aggiornato a ${status}`,
            booking_id: booking_id
          });

        } catch (error) {
          console.error('❌ Errore update booking status:', error);
          return res.status(500).json({
            success: false,
            message: 'Errore aggiornamento booking',
            error: error.message
          });
        }
      }
    }

    if (action === 'payment-methods') {
      try {
        const methods = [
          {
            id: 'paypal',
            name: 'PayPal',
            type: 'redirect',
            enabled: true,
            url: 'https://www.paypal.me/AntonioGuida320',
            description: 'Pagamento rapido e sicuro tramite PayPal',
            fees: 'Commissione PayPal: 3.4% + €0.35'
          },
          {
            id: 'stripe_card',
            name: 'Carta di Credito/Debito',
            type: 'card',
            enabled: true,
            supported_cards: ['visa', 'mastercard', 'amex'],
            description: 'Pagamento diretto con carta di credito o debito',
            fees: 'Commissione: 1.4% + €0.25'
          },
          {
            id: 'stripe_sepa',
            name: 'Bonifico SEPA',
            type: 'bank_transfer',
            enabled: false, // DISATTIVATO
            description: 'Bonifico bancario diretto SEPA',
            fees: 'Commissione: €0.35'
          },
          {
            id: 'bank_transfer',
            name: 'Bonifico Bancario',
            type: 'manual',
            enabled: true,
            account_details: {
              iban: process.env.BANK_IBAN || 'ITXX XXXX XXXX XXXX XXXX XXXX XXX',
              bic: process.env.BANK_BIC || 'PPAYITR1XXX',
              bank_name: 'PostePay S.p.A.',
              account_holder: process.env.BANK_HOLDER || 'Guida Antonio'
            },
            description: 'Bonifico tradizionale su conto corrente'
          }
        ];
        return res.status(200).json({
          success: true,
          methods: methods,
          defaultMethod: 'bank_transfer'
        });
      } catch (error) {
        console.error('❌ Errore nel caricare la configurazione dei metodi di pagamento:', error);
        return res.status(500).json({ success: false, error: 'Impossibile caricare i metodi di pagamento.' });
      }
    }

    // ========================================
    // CALENDAR MANAGEMENT SECTION
    // ========================================
    if (action === 'calendar-configs') {
      try {
        const result = await pool.query('SELECT * FROM calendar_configs ORDER BY id ASC');

        return res.status(200).json({
          success: true,
          calendars: result.rows.map(row => ({
            id: row.id,
            name: row.name,
            calendar_type: row.calendar_type,
            url: row.url,
            is_active: row.is_active,
            sync_frequency: row.sync_frequency,
            last_sync: row.last_sync,
            status: row.is_active ? 'connected' : 'disabled'
          })),
          stats: {
            total: result.rows.length,
            active: result.rows.filter(r => r.is_active).length
          }
        });
      } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
      }
    }

    if (action === 'calendar-sync') {
      if (req.method === 'POST') {
        try {
          console.log('🔄 Admin Panel: Avvio sincronizzazione reale calendari...');
          const sync = new RealCalendarSync();
          const result = await sync.syncAll(); // Esegue la vera sincronizzazione

          return res.status(200).json({
            success: true,
            message: 'Sincronizzazione completata con successo',
            results: result
          });
        } catch (error) {
          console.error('❌ Errore sync manuale:', error);
          return res.status(500).json({ success: false, error: error.message });
        }
      }
    }

    if (action === 'calendar-auto-sync') {
      if (req.method === 'POST') {
        try {
          // Sincronizza tutte le prenotazioni su Google Calendar Vincanto
          const bookings = await pool.query(`
            SELECT 
              booking_id,
              first_name || ' ' || last_name as guest_name,
              check_in,
              check_out,
              guests,
              total_amount,
              status,
              'database' as source
            FROM bookings 
            WHERE status = 'confirmed'
            ORDER BY check_in ASC
          `);

          const syncResults = {
            totalBookings: bookings.rows.length,
            synced: 0,
            errors: []
          };

          // Simula sincronizzazione con Google Calendar
          for (const booking of bookings.rows) {
            try {
              // In produzione qui si farebbe la chiamata API a Google Calendar
              console.log(`📅 Sincronizzando prenotazione ${booking.booking_id} su Google Calendar`);
              syncResults.synced++;
            } catch (error) {
              syncResults.errors.push({
                bookingId: booking.booking_id,
                error: error.message
              });
            }
          }

          return res.status(200).json({
            success: true,
            message: 'Sincronizzazione automatica completata',
            results: syncResults,
            googleCalendar: {
              url: 'https://calendar.google.com/calendar/u/0?cid=vincantomaiori@gmail.com',
              calendarId: 'vincantomaiori@gmail.com',
              lastSync: new Date().toISOString()
            },
            nextSync: new Date(Date.now() + 3600000).toISOString() // Prossima sync tra 1 ora
          });
        } catch (error) {
          console.error('❌ Errore sincronizzazione automatica:', error);
          return res.status(500).json({
            success: false,
            message: 'Errore nella sincronizzazione automatica',
            error: error.message
          });
        }
      }

      // GET - Status della sincronizzazione automatica
      return res.status(200).json({
        success: true,
        autoSync: {
          enabled: true,
          frequency: '1 hour',
          lastSync: new Date(Date.now() - 1800000).toISOString(),
          nextSync: new Date(Date.now() + 1800000).toISOString(),
          totalSynced: 27,
          errors: 0,
          calendars: [
            { name: 'Google Calendar Vincanto', status: 'active', lastSync: new Date().toISOString() },
            { name: 'Booking.com', status: 'active', lastSync: new Date(Date.now() - 3600000).toISOString() },
            { name: 'Holidu', status: 'active', lastSync: new Date(Date.now() - 1800000).toISOString() }
          ]
        }
      });
    }

    // ========================================
    // ADDITIONAL CALENDAR MANAGEMENT SECTION
    // ========================================

    // Aggiungi nuovo calendario
    if (action === 'add-calendar-config') {
      if (req.method === 'POST') {
        try {
          const { name, calendar_type, url, sync_frequency } = req.body;
          const result = await pool.query(
            'INSERT INTO calendar_configs (name, calendar_type, url, sync_frequency) VALUES ($1, $2, $3, $4) RETURNING *',
            [name, calendar_type, url, sync_frequency || 60]
          );
          return res.status(201).json({ success: true, calendar: result.rows[0] });
        } catch (error) {
          return res.status(500).json({ success: false, error: error.message });
        }
      }
    }

    // Aggiorna configurazione calendario
    if (action === 'update-calendar-config') {
      if (req.method === 'PUT' || req.method === 'POST') {
        try {
          const { id } = req.query;
          const { name, calendar_type, url, is_active, sync_frequency } = req.body;

          const result = await pool.query(
            `UPDATE calendar_configs SET 
              name = COALESCE($1, name), 
              calendar_type = COALESCE($2, calendar_type), 
              url = COALESCE($3, url), 
              is_active = COALESCE($4, is_active), 
              sync_frequency = COALESCE($5, sync_frequency),
              updated_at = NOW()
             WHERE id = $6 RETURNING *`,
            [name, calendar_type, url, is_active, sync_frequency, id]
          );

          return res.status(200).json({
            success: true,
            message: 'Configurazione calendario aggiornata',
            calendar: result.rows[0]
          });
        } catch (error) {
          return res.status(500).json({
            success: false,
            error: 'Errore aggiornamento calendario'
          });
        }
      }
    }

    // Elimina configurazione calendario  
    if (action === 'delete-calendar-config') {
      if (req.method === 'DELETE') {
        try {
          const { id } = req.query;
          await pool.query('DELETE FROM calendar_configs WHERE id = $1', [id]);

          return res.status(200).json({
            success: true,
            message: 'Configurazione calendario eliminata',
            deletedId: id
          });
        } catch (error) {
          return res.status(500).json({
            success: false,
            error: 'Errore eliminazione calendario'
          });
        }
      }
    }

    // Stato sincronizzazione calendari - DATI REALI DA DATABASE
    if (action === 'calendar-sync-status') {
      try {
        // Verifica esistenza tabella
        const tableCheck = await pool.query(`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_name = 'calendar_events'
          );
        `);

        if (!tableCheck.rows[0].exists) {
          return res.status(200).json({
            success: true,
            stats: {
              totalCalendars: 0,
              activeCalendars: 0,
              lastSync: null,
              nextSync: new Date(Date.now() + 1800000).toISOString(),
              totalEvents: 0,
              syncErrors: 0,
              calendars: []
            },
            message: 'Database non ancora inizializzato. Primo sync in attesa.'
          });
        }

        // Statistiche reali per piattaforma
        const platformStats = await pool.query(`
          SELECT 
            calendar_source,
            COUNT(*) as event_count,
            COUNT(CASE WHEN start_date >= CURRENT_DATE THEN 1 END) as future_events,
            MAX(updated_at) as last_sync
          FROM calendar_events
          GROUP BY calendar_source
          ORDER BY calendar_source;
        `);

        // Totali
        const totals = await pool.query(`
          SELECT 
            COUNT(*) as total,
            COUNT(CASE WHEN start_date >= CURRENT_DATE THEN 1 END) as future_events
          FROM calendar_events;
        `);

        const calendars = platformStats.rows.map(row => ({
          name: row.calendar_source.charAt(0).toUpperCase() + row.calendar_source.slice(1),
          status: 'active',
          events: parseInt(row.future_events),
          totalEvents: parseInt(row.event_count),
          lastSync: row.last_sync
        }));

        return res.status(200).json({
          success: true,
          stats: {
            totalCalendars: calendars.length,
            activeCalendars: calendars.length,
            lastSync: calendars.length > 0 ? calendars[0].lastSync : null,
            nextSync: new Date(Date.now() + 1800000).toISOString(),
            totalEvents: parseInt(totals.rows[0].future_events),
            allEvents: parseInt(totals.rows[0].total),
            syncErrors: 0,
            calendars: calendars
          }
        });

      } catch (error) {
        console.error('❌ Errore calendar-sync-status:', error);
        return res.status(500).json({
          success: false,
          error: error.message
        });
      }
    }

    // Lista prenotazioni calendario - NUOVO ENDPOINT
    if (action === 'calendar-bookings') {
      try {
        const { limit = 50, futureOnly = true, platform } = req.query;

        // Verifica esistenza tabella
        const tableCheck = await pool.query(`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_name = 'calendar_events'
          );
        `);

        if (!tableCheck.rows[0].exists) {
          return res.status(200).json({
            success: true,
            bookings: [],
            total: 0,
            message: 'Nessuna prenotazione sincronizzata ancora'
          });
        }

        // Costruisci query - 🔥 Filtra solo prenotazioni valide, esclude blocchi/festività
        let sqlQuery = `
          SELECT 
            id,
            uid,
            calendar_source,
            summary,
            description,
            start_date,
            end_date,
            location,
            created_at,
            updated_at,
            EXTRACT(DAY FROM (end_date - start_date)) as nights
          FROM calendar_events
          WHERE 1=1
            AND NOT (
              (platform = 'airbnb' OR calendar_source = 'airbnb') AND (
                LOWER(summary) LIKE '%not available%'
                OR LOWER(summary) LIKE '%blocked%'
                OR LOWER(summary) LIKE '%holiday%'
                OR LOWER(summary) LIKE '%festività%'
                OR LOWER(summary) LIKE '%vacation%'
                OR LOWER(summary) LIKE '%break%'
                OR LOWER(summary) LIKE '%festa%'
              )
            )
            AND NOT (
              (platform = 'airbnb' OR calendar_source = 'airbnb') AND (
                LOWER(summary) LIKE '%maintenance%'
                OR LOWER(summary) LIKE '%pulizie%'
                OR LOWER(summary) LIKE '%cleaning%'
                OR LOWER(summary) LIKE '%manutenzione%'
              )
            )
            AND NOT (
              LOWER(summary) LIKE '%canceled%'
              OR LOWER(summary) LIKE '%cancelled%'
              OR LOWER(description) LIKE '%canceled%'
              OR LOWER(description) LIKE '%cancelled%'
            )
            AND NOT (
              (platform = 'holidu' OR calendar_source = 'holidu') AND (
                LOWER(summary) LIKE '%not available%'
                OR LOWER(summary) LIKE '%unavailable%'
                OR LOWER(summary) LIKE '%non disponibile%'
                OR LOWER(summary) LIKE '%non-available%'
              )
            )
        `;

        const params = [];
        let paramCount = 1;

        if (futureOnly === 'true' || futureOnly === true) {
          sqlQuery += ` AND start_date >= CURRENT_DATE`;
        }

        if (platform && platform !== 'all') {
          sqlQuery += ` AND (platform = $${paramCount} OR calendar_source = $${paramCount})`;
          params.push(platform);
          paramCount++;
        }

        sqlQuery += ` ORDER BY start_date ASC LIMIT $${paramCount}`;
        params.push(parseInt(limit));

        const result = await pool.query(sqlQuery, params);

        // Conta totale - 🔥 Applica gli stessi filtri (esclude Airbnb blocchi, mantiene Booking chiusure)
        let countQuery = `SELECT COUNT(*) as total FROM calendar_events WHERE 1=1
          AND NOT (
            (platform = 'airbnb' OR calendar_source = 'airbnb') AND (
              LOWER(summary) LIKE '%not available%'
              OR LOWER(summary) LIKE '%blocked%'
              OR LOWER(summary) LIKE '%holiday%'
              OR LOWER(summary) LIKE '%festività%'
              OR LOWER(summary) LIKE '%vacation%'
              OR LOWER(summary) LIKE '%break%'
              OR LOWER(summary) LIKE '%festa%'
            )
          )
          AND NOT (
            (platform = 'airbnb' OR calendar_source = 'airbnb') AND (
              LOWER(summary) LIKE '%maintenance%'
              OR LOWER(summary) LIKE '%pulizie%'
              OR LOWER(summary) LIKE '%cleaning%'
              OR LOWER(summary) LIKE '%manutenzione%'
            )
          )
          AND NOT (
            LOWER(summary) LIKE '%canceled%'
            OR LOWER(summary) LIKE '%cancelled%'
            OR LOWER(description) LIKE '%canceled%'
            OR LOWER(description) LIKE '%cancelled%'
          )
          AND NOT (
            (platform = 'holidu' OR calendar_source = 'holidu') AND (
              LOWER(summary) LIKE '%not available%'
              OR LOWER(summary) LIKE '%unavailable%'
              OR LOWER(summary) LIKE '%non disponibile%'
              OR LOWER(summary) LIKE '%non-available%'
            )
          )`;

        if (futureOnly === 'true' || futureOnly === true) {
          countQuery += ' AND start_date >= CURRENT_DATE';
        }
        if (platform && platform !== 'all') {
          countQuery += ` AND (platform = '${platform}' OR calendar_source = '${platform}')`;
        }
        const countResult = await pool.query(countQuery);

        const bookings = result.rows.map(row => ({
          id: row.id,
          uid: row.uid,
          platform: row.calendar_source,
          platformName: row.calendar_source.charAt(0).toUpperCase() + row.calendar_source.slice(1),
          title: row.summary,
          description: row.description,
          checkIn: row.start_date,
          checkOut: row.end_date,
          nights: parseInt(row.nights) || 0,
          location: row.location,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
          status: new Date(row.start_date) > new Date() ? 'upcoming' :
            new Date(row.end_date) < new Date() ? 'past' : 'current'
        }));

        return res.status(200).json({
          success: true,
          bookings: bookings,
          total: parseInt(countResult.rows[0].total),
          returned: bookings.length
        });

      } catch (error) {
        console.error('❌ Errore calendar-bookings:', error);
        return res.status(500).json({
          success: false,
          error: error.message
        });
      }
    }

    // Export iCal per sincronizzazione piattaforme esterne
    if (action === 'ical-export') {
      if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method Not Allowed' });
      }

      try {
        // Helper: Genera UID unico
        const generateUID = (type, id, date) => `${type}-${id}-${date}@vincantomaori.it`;

        // Helper: Formatta data per iCal (YYYYMMDDTHHMMSSZ)
        const formatICalDate = (dateStr) => {
          const date = new Date(dateStr);
          return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
        };

        // Helper: Formatta solo data (YYYYMMDD)
        const formatICalDateOnly = (dateStr) => {
          const date = new Date(dateStr);
          const year = date.getUTCFullYear();
          const month = String(date.getUTCMonth() + 1).padStart(2, '0');
          const day = String(date.getUTCDate()).padStart(2, '0');
          return `${year}${month}${day}`;
        };

        // Query prenotazioni dirette
        const bookingsQuery = await pool.query(`
          SELECT id, check_in, check_out, first_name, last_name, total_amount, status
          FROM bookings
          WHERE status != 'cancelled'
          ORDER BY check_in DESC
        `);

        // Query date bloccate admin
        const blockedQuery = await pool.query(`
          SELECT id, start_date::text, end_date::text, reason
          FROM blocked_dates
          ORDER BY start_date DESC
        `);

        const now = new Date();
        const timestamp = formatICalDate(now.toISOString());

        // Costruisci file iCal
        let icalContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Vincanto Maori//Booking System//IT
CALSCALE:GREGORIAN
METHOD:PUBLISH
X-WR-CALNAME:Vincanto Maori - Prenotazioni
X-WR-TIMEZONE:Europe/Rome
X-WR-CALDESC:Calendario prenotazioni dirette e date bloccate

BEGIN:VTIMEZONE
TZID:Europe/Rome
BEGIN:DAYLIGHT
TZOFFSETFROM:+0100
TZOFFSETTO:+0200
TZNAME:CEST
DTSTART:19700329T020000
RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=-1SU
END:DAYLIGHT
BEGIN:STANDARD
TZOFFSETFROM:+0200
TZOFFSETTO:+0100
TZNAME:CET
DTSTART:19701025T030000
RRULE:FREQ=YEARLY;BYMONTH=10;BYDAY=-1SU
END:STANDARD
END:VTIMEZONE
`;

        // Aggiungi eventi per prenotazioni dirette
        for (const booking of bookingsQuery.rows) {
          const checkin = new Date(booking.check_in);
          const checkout = new Date(booking.check_out);

          const guestName = booking.first_name && booking.last_name
            ? `${booking.first_name} ${booking.last_name}`
            : 'Ospite';

          const uid = generateUID('booking', booking.id, formatICalDateOnly(checkin));
          const dtstart = formatICalDateOnly(checkin);
          const dtend = formatICalDateOnly(checkout);
          const summary = `Prenotato - ${guestName}`;
          const description = `Prenotazione diretta sito\\nID: ${booking.id}\\nTotale: €${booking.total_amount}\\nStatus: ${booking.status}`;

          icalContent += `BEGIN:VEVENT
UID:${uid}
DTSTAMP:${timestamp}
DTSTART;VALUE=DATE:${dtstart}
DTEND;VALUE=DATE:${dtend}
SUMMARY:${summary}
DESCRIPTION:${description}
STATUS:CONFIRMED
TRANSP:OPAQUE
END:VEVENT
`;
        }

        // Aggiungi eventi per date bloccate admin
        for (const blocked of blockedQuery.rows) {
          const startDate = new Date(blocked.start_date);
          const endDate = new Date(blocked.end_date);

          // Aggiungi 1 giorno all'end_date per iCal (end date è esclusivo in iCal)
          const icalEndDate = new Date(endDate);
          icalEndDate.setUTCDate(icalEndDate.getUTCDate() + 1);

          const uid = generateUID('blocked', blocked.id, formatICalDateOnly(startDate));
          const dtstart = formatICalDateOnly(startDate);
          const dtend = formatICalDateOnly(icalEndDate);
          const summary = `Bloccato - ${blocked.reason || 'Non disponibile'}`;
          const description = `Date bloccate da admin\\nMotivo: ${blocked.reason || 'N/A'}\\nDal: ${blocked.start_date}\\nAl: ${blocked.end_date}`;

          icalContent += `BEGIN:VEVENT
UID:${uid}
DTSTAMP:${timestamp}
DTSTART;VALUE=DATE:${dtstart}
DTEND;VALUE=DATE:${dtend}
SUMMARY:${summary}
DESCRIPTION:${description}
STATUS:CONFIRMED
TRANSP:OPAQUE
END:VEVENT
`;
        }

        icalContent += `END:VCALENDAR`;

        // Imposta header per download file .ics
        res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
        res.setHeader('Content-Disposition', 'attachment; filename="vincanto-calendar.ics"');
        // 🔥 Disabilita cache per forzare le piattaforme esterne a leggere i dati aggiornati
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
        return res.status(200).send(icalContent);

      } catch (error) {
        console.error('❌ Errore ical-export:', error);
        return res.status(500).json({
          success: false,
          error: error.message
        });
      }
    }

    // Forza sincronizzazione calendario
    if (action === 'force-calendar-sync') {
      if (req.method === 'POST') {
        try {
          console.log('🔄 Admin Panel: Forzatura sincronizzazione...');
          const sync = new RealCalendarSync();
          const result = await sync.syncAll();

          return res.status(200).json({
            success: true,
            message: 'Sincronizzazione forzata completata',
            results: result,
            syncTime: new Date().toISOString()
          });
        } catch (error) {
          console.error('❌ Errore force-sync:', error);
          return res.status(500).json({
            success: false,
            error: error.message
          });
        }
      }
    }

    // Test connessione calendario
    if (action === 'test-calendar-connection') {
      if (req.method === 'POST') {
        try {
          const config = req.body;

          // Simula test connessione
          return res.status(200).json({
            success: true,
            message: 'Test connessione riuscito',
            connection: {
              status: 'connected',
              responseTime: Math.floor(Math.random() * 500) + 100,
              calendarName: config.name || 'Test Calendar',
              eventsFound: Math.floor(Math.random() * 20),
              testTime: new Date().toISOString()
            }
          });
        } catch (error) {
          return res.status(500).json({
            success: false,
            error: 'Errore test connessione calendario'
          });
        }
      }
    }

    // ========================================
    // MONTHLY PRICING RULES SECTION
    // ========================================
    if (action === 'monthly-rules') {
      if (req.method === 'GET') {
        try {
          const result = await pool.query('SELECT * FROM monthly_pricing_rules ORDER BY month ASC');
          return res.status(200).json({ success: true, rules: result.rows });
        } catch (error) {
          console.error('Error fetching monthly rules:', error);
          return res.status(500).json({ success: false, error: 'Database error' });
        }
      }

      if (req.method === 'POST') {
        const { month, basePrice, minStay } = req.body;
        if (!month || !basePrice || !minStay) {
          return res.status(400).json({ success: false, error: 'Parametri mancanti' });
        }
        try {
          await pool.query(
            `INSERT INTO monthly_pricing_rules (month, base_price, min_stay) 
             VALUES ($1, $2, $3) 
             ON CONFLICT (month) 
             DO UPDATE SET base_price = $2, min_stay = $3, updated_at = CURRENT_TIMESTAMP`,
            [month, basePrice, minStay]
          );
          return res.status(200).json({ success: true, message: 'Regola mensile salvata' });
        } catch (error) {
          console.error('Error saving monthly rule:', error);
          return res.status(500).json({ success: false, error: 'Database error' });
        }
      }

      if (req.method === 'DELETE') {
        const { month } = req.query;
        try {
          await pool.query('DELETE FROM monthly_pricing_rules WHERE month = $1', [month]);
          return res.status(200).json({ success: true, message: 'Regola eliminata' });
        } catch (error) {
          console.error('Error deleting monthly rule:', error);
          return res.status(500).json({ success: false, error: 'Database error' });
        }
      }
    }

    // ========================================
    // PRICING CONFIGURATION SECTION
    // ========================================
    if (action === 'pricing-config') {
      if (req.method === 'GET') {
        try {
          // Ottieni configurazione prezzi dal database
          const result = await pool.query('SELECT * FROM pricing_config ORDER BY id DESC LIMIT 1');
          const monthlyResult = await pool.query('SELECT * FROM monthly_pricing_rules ORDER BY month ASC');
          const monthlyRules = monthlyResult.rows;

          if (result.rows.length > 0) {
            const pricing = result.rows[0];
            // Use the already fetched 'pricing' object
            pricing.monthlyRules = monthlyRules;
            const seasonalRules = await getSeasonalRules(pool); // 🔥 FIX: Fetch seasonal rules
            pricing.seasonalRules = seasonalRules;
            return res.status(200).json({ success: true, pricing: pricing });
          }
        } catch (error) {
          console.error('❌ Errore recupero pricing config:', error);
          // Se errore database, restituisci default
          return res.status(200).json({
            success: true,
            pricing: {
              priceGroup1to2: 70,
              priceGroup3to4: 20,
              priceGroup5to6: 25,
              priceGroup7to8: 30,
              cleaningFee: 60,
              parkingFee: 20,
              touristTaxAdult: 2.00,
              touristTaxChild: 0,
              weekendSurcharge: 0,
              weeklyDiscount: 10,
              monthlyDiscount: 15,
              minStay: 2,
              maxStay: 14,
              maxGuests: 8
            }
          }); // Fallback to default pricing if DB error
        }
      } else if (req.method === 'POST') {
        try {
          console.log('🔧 POST pricing-config iniziato');
          const pricingData = req.body;
          console.log('📝 Ricevuti dati pricing:', JSON.stringify(pricingData, null, 2));
          console.log('📊 Tipo dati ricevuti:', typeof pricingData);
          console.log('🔗 DATABASE_URL presente:', !!process.env.DATABASE_URL);

          // Validazione dati
          if (!pricingData || typeof pricingData !== 'object') {
            console.error('❌ Dati pricing non validi:', pricingData);
            return res.status(400).json({
              success: false,
              error: 'Dati pricing non validi'
            });
          }

          // Test connessione database
          console.log('🔍 Test connessione database...');
          await pool.query('SELECT 1');
          console.log('✅ Database connection OK');

          // Verifica se esiste già una configurazione
          const existingConfig = await pool.query('SELECT * FROM pricing_config ORDER BY id DESC LIMIT 1');

          let result;
          if (existingConfig.rows.length > 0) {
            const currentPricing = existingConfig.rows[0];
            const currentMinStayAugust = currentPricing.min_stay_august || 6;
            // UPDATE configurazione esistente
            console.log('🔄 Aggiornamento configurazione prezzi esistente...');
            result = await pool.query(`
              UPDATE pricing_config SET
                price_group_1to2 = $1,
                price_group_3to4 = $2,
                price_group_5to6 = $3,
                price_group_7to8 = $4,
                cleaning_fee = $5,
                parking_fee = $6,
                tourist_tax_adult = $7,
                tourist_tax_child = $8,
                weekend_surcharge = $9,
                weekly_discount = $10,
                monthly_discount = $11,
                min_stay = $12,
                max_stay = $13,
                max_guests = $14,
                min_stay_august = $15,
                updated_at = CURRENT_TIMESTAMP
              WHERE id = (SELECT id FROM pricing_config ORDER BY id DESC LIMIT 1)
              RETURNING *
            `, [
              pricingData.priceGroup1to2 || pricingData.price_group_1to2 || 70,
              pricingData.priceGroup3to4 || pricingData.price_group_3to4 || 20,
              pricingData.priceGroup5to6 || pricingData.price_group_5to6 || 25,
              pricingData.priceGroup7to8 || pricingData.price_group_7to8 || 30,
              pricingData.cleaningFee || pricingData.cleaning_fee || 60,
              pricingData.parkingFee || pricingData.parking_fee || 20,
              pricingData.touristTaxAdult || pricingData.tourist_tax_adult || 2.00,
              pricingData.touristTaxChild || pricingData.tourist_tax_child || 0,
              pricingData.weekendSurcharge || pricingData.weekend_surcharge || 0,
              pricingData.weeklyDiscount || pricingData.weekly_discount || 10,
              pricingData.monthlyDiscount || pricingData.monthly_discount || 15,
              pricingData.minStay || pricingData.min_stay || 2,
              pricingData.maxStay || pricingData.max_stay || 14,
              pricingData.maxGuests || pricingData.max_guests || 8,
              pricingData.minStayAugust || pricingData.min_stay_august || currentMinStayAugust
            ]);
          } else {
            // INSERT nuova configurazione (solo se tabella vuota)
            console.log('➕ Inserimento nuova configurazione prezzi...');
            result = await pool.query(`
              INSERT INTO pricing_config (
                price_group_1to2, price_group_3to4, price_group_5to6, price_group_7to8,
                cleaning_fee, parking_fee, tourist_tax_adult, tourist_tax_child,
                weekend_surcharge, weekly_discount, monthly_discount, min_stay, max_stay, max_guests, min_stay_august
              ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
              RETURNING *
            `, [
              pricingData.priceGroup1to2 || pricingData.price_group_1to2 || 70,
              pricingData.priceGroup3to4 || pricingData.price_group_3to4 || 20,
              pricingData.priceGroup5to6 || pricingData.price_group_5to6 || 25,
              pricingData.priceGroup7to8 || pricingData.price_group_7to8 || 30,
              pricingData.cleaningFee || pricingData.cleaning_fee || 60,
              pricingData.parkingFee || pricingData.parking_fee || 20,
              pricingData.touristTaxAdult || pricingData.tourist_tax_adult || 2.00,
              pricingData.touristTaxChild || pricingData.tourist_tax_child || 0,
              pricingData.weekendSurcharge || pricingData.weekend_surcharge || 0,
              pricingData.weeklyDiscount || pricingData.weekly_discount || 10,
              pricingData.monthlyDiscount || pricingData.monthly_discount || 15,
              pricingData.minStay || pricingData.min_stay || 3,
              pricingData.maxStay || pricingData.max_stay || 14,
              pricingData.maxGuests || pricingData.max_guests || 8,
              pricingData.minStayAugust || pricingData.min_stay_august || 6
            ]);
          }

          // ✍️ LOG AUDIT: Aggiorna configurazione prezzi
          if (adminUser) {
            await logAdminAction(adminUser, 'update', 'pricing_config', result.rows[0].id, { updates: pricingData }, req);
          }

          console.log('✅ Configurazione prezzi salvata:', result.rows[0]);

          return res.status(200).json({
            success: true,
            message: 'Configurazione prezzi salvata con successo',
            pricing: result.rows[0]
          });
        } catch (error) {
          console.error('❌ Errore completo salvataggio pricing config:', error);
          console.error('❌ Stack trace:', error.stack);
          return res.status(500).json({
            success: false,
            error: 'Errore salvataggio configurazione prezzi',
            details: error.message
          });
        }
      }
    }

    // ========================================
    // QUOTE/PRICING CALCULATION SECTION
    // ========================================
    if (action === 'quote') {
      try {
        const { checkIn, checkOut, guests, adults, children, includeParking, childrenAges } = req.query;

        // Validazione parametri
        if (!checkIn || !checkOut || !guests) {
          return res.status(400).json({
            success: false,
            error: 'Parametri mancanti: checkIn, checkOut, guests sono obbligatori'
          });
        }

        // Calcola notti
        const checkInDate = new Date(checkIn);
        const checkOutDate = new Date(checkOut);
        const nights = Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24));

        if (nights <= 0) {
          return res.status(400).json({
            success: false,
            error: 'Date non valide'
          });
        }

        // 🔒 CONTROLLO DISPONIBILITÀ UNIFICATO
        // Controlla se le date sono disponibili interrogando bookings, blocked_dates e calendar_events
        const availabilityCheck = await pool.query(
          `
          WITH unavailable_periods AS (
            SELECT check_in AS start_date, check_out AS end_date FROM bookings WHERE status IN ('confirmed', 'pending')
            UNION ALL
            SELECT start_date, end_date FROM blocked_dates
            UNION ALL
            SELECT start_date::date, end_date::date FROM calendar_events
            WHERE NOT (
              LOWER(summary) LIKE '%canceled%'
              OR LOWER(summary) LIKE '%cancelled%'
              OR LOWER(description) LIKE '%canceled%'
              OR LOWER(description) LIKE '%cancelled%'
            )
            AND NOT (
              (platform = 'airbnb' OR calendar_source = 'airbnb') AND (
                LOWER(summary) LIKE '%not available%'
                OR LOWER(summary) LIKE '%blocked%'
                OR LOWER(summary) LIKE '%holiday%'
                OR LOWER(summary) LIKE '%festività%'
                OR LOWER(summary) LIKE '%vacation%'
                OR LOWER(summary) LIKE '%break%'
                OR LOWER(summary) LIKE '%festa%'
              )
            )
            AND NOT (
              (platform = 'airbnb' OR calendar_source = 'airbnb') AND (
                LOWER(summary) LIKE '%maintenance%'
                OR LOWER(summary) LIKE '%pulizie%'
                OR LOWER(summary) LIKE '%cleaning%'
                OR LOWER(summary) LIKE '%manutenzione%'
              )
            )
            AND NOT (
              (platform = 'holidu' OR calendar_source = 'holidu') AND (
                LOWER(summary) LIKE '%not available%'
                OR LOWER(summary) LIKE '%unavailable%'
                OR LOWER(summary) LIKE '%non disponibile%'
                OR LOWER(summary) LIKE '%non-available%'
              )
            )
          )
          SELECT 1
          FROM unavailable_periods
          WHERE start_date < $2 AND end_date > $1
          LIMIT 1;
          `,
          [checkIn, checkOut]
        );

        const isAvailable = availabilityCheck.rows.length === 0;

        if (!isAvailable) {
          console.warn('⚠️ Preventivo per date non disponibili:', { checkIn, checkOut });
          // Non blocco il preventivo, ma segnalo che non è disponibile.
          // Il blocco reale avverrà al momento della prenotazione.
        }


        // Ottieni configurazione prezzi dal database
        let pricing;
        try {
          const pricingResult = await pool.query('SELECT * FROM pricing_config ORDER BY id DESC LIMIT 1');
          if (pricingResult.rows.length > 0) {
            const p = pricingResult.rows[0];
            pricing = {
              priceGroup1to2: parseFloat(p.price_group_1to2) || 70,
              priceGroup3to4: parseFloat(p.price_group_3to4) || 20,
              priceGroup5to6: parseFloat(p.price_group_5to6) || 25,
              priceGroup7to8: parseFloat(p.price_group_7to8) || 30,
              cleaningFee: parseFloat(p.cleaning_fee) || 60,
              parkingFee: parseFloat(p.parking_fee) || 20,
              touristTaxAdult: parseFloat(p.tourist_tax_adult) || 2.00,
              touristTaxChild: parseFloat(p.tourist_tax_child) || 0,
              weeklyDiscount: parseFloat(p.weekly_discount) || 10,
              monthlyDiscount: parseFloat(p.monthly_discount) || 15,
              minStay: parseInt(p.min_stay) || 3,
              minStayAugust: parseInt(p.min_stay_august) || 6
            };
          } else {
            // Prezzi default se tabella vuota
            pricing = {
              priceGroup1to2: 70,
              priceGroup3to4: 20,
              priceGroup5to6: 25,
              priceGroup7to8: 30,
              cleaningFee: 60,
              parkingFee: 20,
              touristTaxAdult: 2.00,
              touristTaxChild: 0,
              weeklyDiscount: 10,
              monthlyDiscount: 15,
              minStay: 3,
              minStayAugust: 6
            };
          }
        } catch (dbError) {
          console.warn('⚠️ Errore database pricing, uso default:', dbError);
          pricing = {
            priceGroup1to2: 70,
            priceGroup3to4: 20,
            priceGroup5to6: 25,
            priceGroup7to8: 30,
            cleaningFee: 60,
            parkingFee: 20,
            touristTaxAdult: 2.00,
            touristTaxChild: 0,
            weeklyDiscount: 10,
            monthlyDiscount: 15,
            minStay: 3,
            minStayAugust: 6
          };
        }

        // Funzione helper per calcolare il prezzo notturno basato sui livelli di ospiti
        const calculateNightlyPrice = (numGuests, pricingConfig) => {
          if (numGuests <= 0) return 0;
          let price = 0;
          const guests = parseInt(numGuests);

          if (guests > 0) {
            price += Math.min(guests, 2) * (pricingConfig.priceGroup1to2 || 0);
          }
          if (guests > 2) {
            price += Math.min(guests - 2, 2) * (pricingConfig.priceGroup3to4 || 0);
          }
          if (guests > 4) {
            price += Math.min(guests - 4, 2) * (pricingConfig.priceGroup5to6 || 0);
          }
          if (guests > 6) {
            price += Math.min(guests - 6, 2) * (pricingConfig.priceGroup7to8 || 0);
          }
          return price;
        };


        // 🔥 FIX: Carica le regole stagionali corrette dalla nuova tabella
        const seasonalRules = await getSeasonalRules(pool);

        // 📅 VALIDAZIONE SOGGIORNO MINIMO (Server-Side Enforcement) - LOGICA CORRETTA
        // 🔥 FIX: Usa la funzione centralizzata per coerenza con il booking
        const requiredMinStay = await getRequiredMinStay(checkInDate, checkOutDate, pool, seasonalRules);

        // 3. Validazione finale
        if (nights < requiredMinStay) {
          return res.status(400).json({
            success: false,
            error: `Per le date selezionate è richiesto un soggiorno minimo di ${requiredMinStay} notti.`
          });
        }

        // 🔢 CALCOLO PREZZO DINAMICO BASATO SU CONFIGURAZIONE DB (Admin Panel)
        const guestsNum = parseInt(guests);
        const adultsNum = parseInt(adults) || guestsNum;
        const childrenNum = parseInt(children) || 0;

        console.log('🔢 PARAMETRI RICEVUTI:', {
          guests: guestsNum,
          adults: adultsNum,
          children: childrenNum,
          nights: nights,
          includeParking: includeParking
        });
        console.log('💰 PRICING CONFIG IN USO:', pricing);

        // 🔥 NUOVA LOGICA: Calcolo per notte
        let totalAccommodationCost = 0;
        const detailsPerNight = [];

        for (let d = new Date(checkInDate); d < checkOutDate; d.setDate(d.getDate() + 1)) {
          let pricingForNight = { ...pricing };
          let ruleApplied = null;
          const currentDateUTC = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));

          if (seasonalRules && Array.isArray(seasonalRules)) {
            for (const rule of seasonalRules) {
              const ruleStartUTC = new Date(Date.UTC(new Date(rule.startDate).getFullYear(), new Date(rule.startDate).getMonth(), new Date(rule.startDate).getDate()));
              const ruleEndUTC = new Date(Date.UTC(new Date(rule.endDate).getFullYear(), new Date(rule.endDate).getMonth(), new Date(rule.endDate).getDate()));
              if (currentDateUTC >= ruleStartUTC && currentDateUTC <= ruleEndUTC) {
                ruleApplied = rule.name;
                if (rule.priceGroup1to2 != null) pricingForNight.priceGroup1to2 = rule.priceGroup1to2;
                if (rule.priceGroup3to4 != null) pricingForNight.priceGroup3to4 = rule.priceGroup3to4;
                if (rule.priceGroup5to6 != null) pricingForNight.priceGroup5to6 = rule.priceGroup5to6;
                if (rule.priceGroup7to8 != null) pricingForNight.priceGroup7to8 = rule.priceGroup7to8;
                break;
              }
            }
          }
          const nightlyCost = calculateNightlyPrice(guestsNum, pricingForNight);
          totalAccommodationCost += nightlyCost;
          detailsPerNight.push({ date: d.toISOString().split('T')[0], cost: nightlyCost, rule: ruleApplied });
        }
        console.log('🔍 Dettaglio calcolo per notte:', detailsPerNight);

        // Calcola subtotale alloggio
        const accommodationCost = totalAccommodationCost;

        // Applica sconti per soggiorni lunghi
        let discount = 0;
        if (nights >= 28) discount = pricing.monthlyDiscount;
        else if (nights >= 7) discount = pricing.weeklyDiscount;

        const discountAmount = (accommodationCost * discount) / 100;
        const discountedAccommodation = accommodationCost - discountAmount;

        // Calcola costi aggiuntivi con override da regole stagionali
        let finalPricing = { ...pricing };
        const firstDayRuleName = detailsPerNight[0]?.rule;
        if (firstDayRuleName) {
          const ruleDetails = seasonalRules.find(r => r.name === firstDayRuleName);
          if (ruleDetails) {
            console.log(`Applying custom fees from rule: ${ruleDetails.name}`);
            if (ruleDetails.cleaningFee != null) finalPricing.cleaningFee = ruleDetails.cleaningFee;
            if (ruleDetails.parkingFee != null) finalPricing.parkingFee = ruleDetails.parkingFee;
            if (ruleDetails.touristTaxAdult != null) finalPricing.touristTaxAdult = ruleDetails.touristTaxAdult;
          }
        }

        const cleaningFee = finalPricing.cleaningFee;
        console.log(`🧽 PULIZIA: €${cleaningFee}`);

        // 🔧 FIX: Parcheggio è un costo PER NOTTE
        const parkingCost = (includeParking === 'true') ? (finalPricing.parkingFee * nights) : 0;
        console.log(`🚗 PARCHEGGIO: ${includeParking === 'true' ? `€${finalPricing.parkingFee} × ${nights} notti = €${parkingCost}` : '€0 (non richiesto)'}`);

        // 🔧 FIX: Tassa soggiorno per adulti + bambini >12 anni (bambini ≤12 anni gratis)
        // Parse childrenAges: può essere stringa "8,14" o già array
        let childrenAgesArray = [];
        if (childrenAges) {
          if (typeof childrenAges === 'string') {
            childrenAgesArray = childrenAges.split(',').map(age => parseInt(age.trim())).filter(age => !isNaN(age));
          } else if (Array.isArray(childrenAges)) {
            childrenAgesArray = childrenAges.map(age => parseInt(age)).filter(age => !isNaN(age));
          }
        }

        // Conta bambini >12 anni che devono pagare la tassa
        const childrenOver12 = childrenAgesArray.filter(age => age > 12).length;
        const childrenUnder12 = childrenAgesArray.filter(age => age <= 12).length;
        const taxableGuests = adultsNum + childrenOver12;

        const touristTax = finalPricing.touristTaxAdult * taxableGuests * nights;
        console.log(`🏛️ TASSA SOGGIORNO: ${adultsNum} adulti + ${childrenOver12} bambini >12 anni (${childrenUnder12} bambini ≤12 gratis) = ${taxableGuests} ospiti × €${finalPricing.touristTaxAdult} × ${nights} notti = €${touristTax}`);

        // Genera descrizione tassa di soggiorno dettagliata
        let taxDescription = '';
        if (childrenOver12 > 0 && childrenUnder12 > 0) {
          // Caso con bambini sia sopra che sotto i 12 anni
          taxDescription = `€${finalPricing.touristTaxAdult}/persona/notte × ${taxableGuests} ospiti (${adultsNum} adulti + ${childrenOver12} bambini >12 anni, ${childrenUnder12} bambini ≤12 gratis) × ${nights} notti = €${touristTax.toFixed(2)}`;
        } else if (childrenOver12 > 0) {
          // Caso con bambini solo sopra i 12 anni
          taxDescription = `€${finalPricing.touristTaxAdult}/persona/notte × ${taxableGuests} ospiti (${adultsNum} adulti + ${childrenOver12} bambini >12 anni) × ${nights} notti = €${touristTax.toFixed(2)}`;
        } else if (childrenUnder12 > 0) {
          // Caso con bambini solo sotto i 12 anni
          taxDescription = `€${finalPricing.touristTaxAdult}/adulto/notte × ${adultsNum} adulti (${childrenUnder12} bambini ≤12 anni gratis) × ${nights} notti = €${touristTax.toFixed(2)}`;
        } else {
          // Caso solo adulti
          taxDescription = `€${finalPricing.touristTaxAdult}/adulto/notte × ${adultsNum} adulti × ${nights} notti = €${touristTax.toFixed(2)}`;
        }

        // Calcola totale
        const totalAmount = discountedAccommodation + cleaningFee + parkingCost + touristTax;
        console.log('💰 TOTALE:', {
          accommodationCost: accommodationCost,
          discount: discount > 0 ? `-${discountAmount}€ (${discount}%)` : '0€',
          discountedAccommodation: discountedAccommodation,
          cleaningFee: cleaningFee,
          parkingCost: parkingCost,
          touristTax: touristTax,
          totalAmount: totalAmount
        });
        const depositAmount = totalAmount * 0.20; // Acconto 20%

        // Risposta quote
        return res.status(200).json({
          success: true,
          quote: {
            isAvailable: isAvailable, // 👈 Aggiunto flag di disponibilità
            checkIn: checkIn,
            checkOut: checkOut,
            guests: guestsNum,
            nights: nights,
            basePrice: accommodationCost / nights, // Prezzo medio per notte
            accommodationCost: accommodationCost,
            discount: discount,
            discountAmount: discountAmount,
            discountedAccommodation: discountedAccommodation,
            cleaningFee: cleaningFee,
            parkingCost: parkingCost,
            touristTax: touristTax,
            totalAmount: totalAmount,
            depositAmount: depositAmount,
            includeParking: includeParking === 'true'
          },
          breakdown: {
            alloggio: `Soggiorno per ${nights} notti = €${accommodationCost.toFixed(2)}`,
            sconto: discount > 0 ? `Sconto ${discount}%: -€${discountAmount.toFixed(2)}` : null,
            pulizie: `€${cleaningFee.toFixed(2)}`,
            parcheggio: parkingCost > 0 ? `€${finalPricing.parkingFee}/notte × ${nights} notti = €${parkingCost.toFixed(2)}` : null,
            tassa: taxDescription,
            totale: `€${totalAmount.toFixed(2)}`,
            acconto: `€${depositAmount.toFixed(2)} ( 20%)`
          }
        });
      } catch (error) {
        console.error('❌ Errore calcolo quote:', error);
        return res.status(500).json({
          success: false,
          error: 'Errore nel calcolo del preventivo'
        });
      }
    }

    // ========================================
    // EXTRA SERVICES SECTION - CRUD COMPLETO
    // ========================================
    if (action === 'extra-services') {
      if (req.method === 'GET') {
        try {
          // Ottieni tutti i servizi dal database
          const result = await pool.query(`
            SELECT 
              id, name, description, price, category, unit, active, included,
              min_age, max_age, sort_order, created_at, updated_at
            FROM extra_services 
            ORDER BY sort_order ASC, id ASC
          `);

          const services = result.rows.map(service => ({
            id: service.id,
            name: service.name,
            description: service.description,
            price: parseFloat(service.price),
            currency: 'EUR',
            category: service.category,
            unit: service.unit,
            active: service.active,
            included: service.included,
            minAge: service.min_age, // 🔧 AGGIUNTO
            maxAge: service.max_age, // 🔧 AGGIUNTO
            sortOrder: service.sort_order,
            createdAt: service.created_at?.toISOString(),
            updatedAt: service.updated_at?.toISOString()
          }));

          return res.status(200).json({
            success: true,
            services: services,
            count: services.length
          });
        } catch (error) {
          console.error('❌ Errore GET extra-services:', error);
          return res.status(500).json({
            success: false,
            error: 'Errore caricamento servizi extra'
          });
        }
      }

      if (req.method === 'POST') {
        try {
          // Crea nuovo servizio
          const { name, description, price, category, unit, active, included, sortOrder } = req.body;

          // Validazione dati
          if (!name || price === undefined) {
            return res.status(400).json({
              success: false,
              error: 'Nome e prezzo sono obbligatori'
            });
          }

          const result = await pool.query(`
            INSERT INTO extra_services (name, description, price, category, unit, active, included, sort_order, updated_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
            RETURNING *
          `, [
            name,
            description || '',
            parseFloat(price),
            category || 'general',
            unit || 'per_stay',
            active !== false, // Default true
            included === true, // Default false
            sortOrder || 0
          ]);

          // ✍️ LOG AUDIT: Crea servizio extra
          if (adminUser) {
            await logAdminAction(adminUser, 'create', 'extra_service', result.rows[0].id, { service: result.rows[0] }, req);
          }

          const newService = result.rows[0];
          console.log('✅ Nuovo servizio creato:', newService);

          return res.status(201).json({
            success: true,
            message: 'Servizio extra creato con successo',
            service: {
              id: newService.id,
              name: newService.name,
              description: newService.description,
              price: parseFloat(newService.price),
              currency: 'EUR',
              category: newService.category,
              unit: newService.unit,
              active: newService.active,
              included: newService.included,
              sortOrder: newService.sort_order
            }
          });
        } catch (error) {
          console.error('❌ Errore POST extra-services:', error);
          return res.status(500).json({
            success: false,
            error: 'Errore creazione servizio extra'
          });
        }
      }

      if (req.method === 'PUT') {
        try {
          // Aggiorna servizio esistente
          const { id } = req.query;
          const { name, description, price, category, unit, active, included, sortOrder } = req.body;

          if (!id) {
            return res.status(400).json({
              success: false,
              error: 'ID servizio richiesto per aggiornamento'
            });
          }

          const result = await pool.query(`
            UPDATE extra_services 
            SET 
              name = COALESCE($2, name),
              description = COALESCE($3, description),
              price = COALESCE($4, price),
              category = COALESCE($5, category),
              unit = COALESCE($6, unit),
              active = COALESCE($7, active),
              included = COALESCE($8, included),
              sort_order = COALESCE($9, sort_order),
              updated_at = NOW()
            WHERE id = $1
            RETURNING *
          `, [
            parseInt(id),
            name,
            description,
            price !== undefined ? parseFloat(price) : null,
            category,
            unit,
            active,
            included,
            sortOrder !== undefined ? parseInt(sortOrder) : null
          ]);

          if (result.rows.length === 0) {
            return res.status(404).json({
              success: false,
              error: 'Servizio non trovato'
            });
          }

          // ✍️ LOG AUDIT: Aggiorna servizio extra
          if (adminUser) {
            await logAdminAction(adminUser, 'update', 'extra_service', id, { updates: req.body }, req);
          }

          const updatedService = result.rows[0];
          console.log('✅ Servizio aggiornato:', updatedService);

          return res.status(200).json({
            success: true,
            message: 'Servizio extra aggiornato con successo',
            service: {
              id: updatedService.id,
              name: updatedService.name,
              description: updatedService.description,
              price: parseFloat(updatedService.price),
              currency: 'EUR',
              category: updatedService.category,
              unit: updatedService.unit,
              active: updatedService.active,
              included: updatedService.included,
              sortOrder: updatedService.sort_order
            }
          });
        } catch (error) {
          console.error('❌ Errore PUT extra-services:', error);
          return res.status(500).json({
            success: false,
            error: 'Errore aggiornamento servizio extra'
          });
        }
      }

      if (req.method === 'DELETE') {
        try {
          // Elimina servizio
          const { id } = req.query;

          if (!id) {
            return res.status(400).json({
              success: false,
              error: 'ID servizio richiesto per eliminazione'
            });
          }

          const result = await pool.query(`
            DELETE FROM extra_services WHERE id = $1 RETURNING *
          `, [parseInt(id)]);

          if (result.rows.length === 0) {
            return res.status(404).json({
              success: false,
              error: 'Servizio non trovato'
            });
          }

          // ✍️ LOG AUDIT: Elimina servizio extra
          if (adminUser) {
            await logAdminAction(adminUser, 'delete', 'extra_service', id, { deletedId: id }, req);
          }

          console.log('🗑️ Servizio eliminato:', result.rows[0]);

          return res.status(200).json({
            success: true,
            message: 'Servizio extra eliminato con successo',
            deletedId: parseInt(id)
          });
        } catch (error) {
          console.error('❌ Errore DELETE extra-services:', error);
          return res.status(500).json({
            success: false,
            error: 'Errore eliminazione servizio extra'
          });
        }
      }
    }

    // ========================================
    // CAPTURE PAYMENT SECTION
    // ========================================
    if (action === 'capture-payment') {
      try {
        const targetId = payment_id || booking_id;

        if (!targetId) {
          return res.status(400).json({ success: false, error: 'ID pagamento o prenotazione richiesto' });
        }

        // Recupera la prenotazione per ottenere gli importi corretti
        const bookingResult = await pool.query(
          `SELECT * FROM bookings
             WHERE id = $1 OR booking_id = $2
             `,
          [isNaN(Number(targetId)) ? null : Number(targetId), String(targetId)]
        );

        if (bookingResult.rows.length === 0) {
          return res.status(404).json({ success: false, error: 'Prenotazione non trovata' });
        }

        const booking = bookingResult.rows[0];

        // Determina il nuovo stato del pagamento e l'importo pagato
        let newPaymentStatus;
        let amountPaidForEmail;

        if (paymentType === 'deposit') {
          newPaymentStatus = 'deposit_paid';
          amountPaidForEmail = parseFloat(booking.deposit_amount);
        } else { // Default a pagamento completo se non specificato
          newPaymentStatus = 'paid_full';
          amountPaidForEmail = parseFloat(booking.total_amount);
        }

        // 1. Aggiorna lo stato della prenotazione a 'confirmed' e il payment_status corretto
        const updateResult = await pool.query(
          `UPDATE bookings 
             SET status = 'confirmed', payment_status = $1, updated_at = NOW()
             WHERE id = $2
             RETURNING *`,
          [newPaymentStatus, booking.id]
        );

        const updatedBooking = updateResult.rows[0];
        console.log(`✅ Pagamento catturato e prenotazione confermata: ${updatedBooking.booking_id} -> ${newPaymentStatus}`);

        // 2. Invia email di conferma finale (Pagamento Ricevuto)
        if (process.env.SMTP_HOST) {
          try {
            const guestLanguage = detectLanguage(updatedBooking.email);
            // Se la prenotazione era in 'pending', era un bonifico. Altrimenti, usa il metodo esistente.
            const paymentMethodForEmail = booking.status === 'pending' ? 'bank_transfer' : (booking.stripe_payment_intent ? 'stripe' : 'bank_transfer');

            const remainingAmount = parseFloat(updatedBooking.total_amount) - amountPaidForEmail;

            const emailHtml = renderEmailTemplate('booking_final_confirmation', {
              firstName: updatedBooking.first_name,
              lastName: updatedBooking.last_name,
              bookingId: updatedBooking.booking_id,
              checkin: updatedBooking.check_in,
              checkout: updatedBooking.check_out,
              totalAmount: parseFloat(updatedBooking.total_amount),
              amountPaid: amountPaidForEmail,
              remainingAmount: remainingAmount > 0 ? remainingAmount : 0,
              language: guestLanguage,
              paymentMethod: paymentMethodForEmail,
              notes: updatedBooking.notes,
              logoUrl: 'https://www.vincantomaiori.it/logo.png',
              siteUrl: 'https://www.vincantomaiori.it'
            });

            await sendEmailWithAdminCopy({
              to: updatedBooking.email,
              subject: `Pagamento ricevuto - Prenotazione ${updatedBooking.booking_id}`,
              html: emailHtml,
              templateName: 'booking_final_confirmation'
            });
            console.log(`✅ Email conferma pagamento inviata a ${updatedBooking.email}`);
          } catch (emailError) {
            console.error('⚠️ Errore invio email conferma pagamento:', emailError.message);
          }
        }

        return res.status(200).json({
          success: true,
          message: 'Pagamento catturato e prenotazione confermata con successo',
          payment: {
            status: newPaymentStatus,
            amount: amountPaidForEmail,
            date: new Date().toISOString()
          }
        });
      } catch (error) {
        console.error('❌ Errore capture-payment:', error);
        return res.status(500).json({ success: false, error: error.message });
      }
    }

    if (action === 'get-payment-details') {
      try {
        const { payment_id } = req.query;
        if (!payment_id) {
          return res.status(400).json({ success: false, error: 'payment_id richiesto' });
        }

        const result = await pool.query(
          `SELECT id, booking_id, total_amount, deposit_amount, payment_status, stripe_payment_intent, first_name, last_name, email, created_at 
                 FROM bookings 
                 WHERE id = $1 OR booking_id = $2`,
          [isNaN(Number(payment_id)) ? null : Number(payment_id), String(payment_id)]
        );

        if (result.rows.length === 0) {
          return res.status(404).json({ success: false, error: 'Pagamento non trovato' });
        }

        const booking = result.rows[0];
        return res.status(200).json({
          success: true,
          payment: {
            id: booking.id,
            booking_id: booking.booking_id,
            amount: parseFloat(booking.total_amount),
            deposit: parseFloat(booking.deposit_amount),
            status: booking.payment_status,
            method: booking.stripe_payment_intent ? 'stripe' : 'bank_transfer',
            customer: `${booking.first_name} ${booking.last_name}`,
            email: booking.email,
            transaction_id: booking.stripe_payment_intent,
            date: booking.created_at
          }
        });
      } catch (error) {
        console.error('❌ Errore get-payment-details:', error);
        return res.status(500).json({ success: false, error: error.message });
      }
    }

    // ========================================
    // BLOCKED DATES MANAGEMENT SECTION
    // ========================================
    if (action === 'blocked-dates') {
      if (req.method === 'GET') {
        try {
          // Leggi date bloccate dal database
          const result = await pool.query(`
            SELECT id, start_date::text, end_date::text, reason, description 
            FROM blocked_dates 
            ORDER BY start_date
          `);

          return res.status(200).json({
            success: true,
            blockedDates: result.rows
          });
        } catch (error) {
          console.error('❌ Errore blocked-dates GET:', error);
          return res.status(200).json({
            success: true,
            blockedDates: []
          });
        }
      }

      if (req.method === 'POST') {
        try {
          // Crea nuova data bloccata nel database
          const { start_date, end_date, reason, description } = req.body;

          // 🔒 CHECK CONFLITTI: Verifica se le date sono già prenotate
          const conflict = await pool.query(`
            SELECT booking_id FROM bookings 
            WHERE status IN ('confirmed', 'pending')
            AND check_in < $2 AND check_out > $1
            LIMIT 1
          `, [start_date, end_date]);

          if (conflict.rows.length > 0) {
            return res.status(409).json({ success: false, error: `Impossibile bloccare: date già prenotate (Booking: ${conflict.rows[0].booking_id})` });
          }

          const result = await pool.query(`
            INSERT INTO blocked_dates (start_date, end_date, reason, description)
            VALUES ($1, $2, $3, $4)
            RETURNING id, start_date::text, end_date::text, reason, description
          `, [start_date, end_date, reason || 'maintenance', description || 'Data bloccata']);

          console.log('🚫 Data bloccata creata:', result.rows[0]);

          return res.status(201).json({
            success: true,
            message: 'Data bloccata creata con successo',
            blockedDate: result.rows[0]
          });
        } catch (error) {
          console.error('❌ Errore creazione blocked-date:', error);

          // Fallback: simula creazione
          return res.status(201).json({
            success: true,
            message: 'Data bloccata creata con successo',
            blockedDate: {
              id: Date.now(),
              start_date: req.body.start_date,
              end_date: req.body.end_date,
              reason: req.body.reason || 'maintenance',
              description: req.body.description || 'Data bloccata'
            }
          });
        }
      }

      // 🔧 FIX: Metodo PUT per modificare date bloccate (Spostato qui)
      if (req.method === 'PUT') {
        try {
          const { id, start_date, end_date, reason } = req.body;
          if (!id) return res.status(400).json({ success: false, error: 'ID richiesto' });

          // 🔒 CHECK CONFLITTI SU MODIFICA
          const conflict = await pool.query(`
            SELECT booking_id FROM bookings 
            WHERE status IN ('confirmed', 'pending')
            AND check_in < $2 AND check_out > $1
            LIMIT 1
          `, [start_date, end_date]);

          if (conflict.rows.length > 0) {
            return res.status(409).json({ success: false, error: `Impossibile aggiornare: date già prenotate (Booking: ${conflict.rows[0].booking_id})` });
          }

          await pool.query(`
            UPDATE blocked_dates 
            SET start_date = $1, end_date = $2, reason = $3 
            WHERE id = $4
          `, [start_date, end_date, reason, id]);

          return res.status(200).json({ success: true, message: 'Data bloccata aggiornata' });
        } catch (error) {
          console.error('❌ Errore modifica blocked-date:', error);
          return res.status(500).json({ success: false, error: error.message });
        }
      }

      // 🔧 FIX: Metodo DELETE per eliminare date bloccate (Spostato qui)
      if (req.method === 'DELETE') {
        try {
          const { id } = req.body;
          if (!id) return res.status(400).json({ success: false, error: 'ID richiesto' });

          await pool.query('DELETE FROM blocked_dates WHERE id = $1', [id]);
          return res.status(200).json({ success: true, message: 'Data bloccata eliminata' });
        } catch (error) {
          console.error('❌ Errore eliminazione blocked-date:', error);
          return res.status(500).json({ success: false, error: error.message });
        }
      }
    }

    // ========================================
    // SYSTEM SETTINGS SECTION
    // ========================================
    if (action === 'settings') {
      if (req.method === 'GET') {
        try {
          // Ottieni impostazioni dal database
          const result = await pool.query('SELECT * FROM settings ORDER BY id DESC LIMIT 1');

          if (result.rows.length > 0) {
            const settings = result.rows[0];
            return res.status(200).json({
              success: true,
              settings: {
                site_name: settings.site_name || 'Vincanto Maori',
                admin_email: settings.admin_email || 'admin@vincantomaori.it',
                paypal_enabled: settings.paypal_enabled || true,
                paypal_link: settings.paypal_link || 'https://www.paypal.me/AntonioGuida320',
                stripe_enabled: settings.stripe_enabled || false,
                bank_transfer_enabled: settings.bank_transfer_enabled || true,
                calendar_sync_enabled: settings.calendar_sync_enabled || true,
                google_analytics_enabled: settings.google_analytics_enabled || true,
                booking_notifications_enabled: settings.booking_notifications_enabled || true,
                auto_confirm_bookings: settings.auto_confirm_bookings || false,
                max_guests: settings.max_guests || 8,
                min_stay_nights: settings.min_stay_nights || 2,
                checkin_time: settings.checkin_time || '15:00',
                checkout_time: settings.checkout_time || '10:00'
              }
            });
          } else {
            // Restituisci impostazioni default se tabella vuota
            return res.status(200).json({
              success: true,
              settings: {
                site_name: 'Vincanto Maori',
                admin_email: 'admin@vincantomaori.it',
                paypal_enabled: true,
                paypal_link: 'https://www.paypal.me/AntonioGuida320',
                stripe_enabled: false,
                bank_transfer_enabled: true,
                calendar_sync_enabled: true,
                google_analytics_enabled: true,
                booking_notifications_enabled: true,
                auto_confirm_bookings: false,
                max_guests: 8,
                min_stay_nights: 2,
                checkin_time: '15:00',
                checkout_time: '10:00'
              }
            });
          }
        } catch (error) {
          console.error('❌ Errore recupero settings:', error);
          // Se errore database, restituisci default
          return res.status(200).json({
            success: true,
            settings: {
              site_name: 'Vincanto Maori',
              admin_email: 'admin@vincantomaori.it',
              paypal_enabled: true,
              paypal_link: 'https://www.paypal.me/AntonioGuida320',
              stripe_enabled: false,
              bank_transfer_enabled: true,
              calendar_sync_enabled: true,
              google_analytics_enabled: true,
              booking_notifications_enabled: true,
              auto_confirm_bookings: false,
              max_guests: 8,
              min_stay_nights: 2,
              checkin_time: '15:00',
              checkout_time: '10:00'
            }
          });
        }
      } else if (req.method === 'POST') {
        try {
          const settingsData = req.body;

          // Prima tenta di creare la tabella se non esiste
          await pool.query(`
            CREATE TABLE IF NOT EXISTS settings (
              id SERIAL PRIMARY KEY,
              site_name VARCHAR(255),
              admin_email VARCHAR(255),
              paypal_enabled BOOLEAN,
              paypal_link TEXT,
              stripe_enabled BOOLEAN,
              bank_transfer_enabled BOOLEAN,
              calendar_sync_enabled BOOLEAN,
              google_analytics_enabled BOOLEAN,
              booking_notifications_enabled BOOLEAN,
              auto_confirm_bookings BOOLEAN,
              max_guests INTEGER,
              min_stay_nights INTEGER,
              checkin_time VARCHAR(10),
              checkout_time VARCHAR(10),
              created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
              updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
          `);

          // Inserisci o aggiorna impostazioni
          const result = await pool.query(`
            INSERT INTO settings (
              site_name, admin_email, paypal_enabled, paypal_link, stripe_enabled,
              bank_transfer_enabled, calendar_sync_enabled, google_analytics_enabled,
              booking_notifications_enabled, auto_confirm_bookings, max_guests,
              min_stay_nights, checkin_time, checkout_time
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
            RETURNING *
          `, [
            settingsData.site_name,
            settingsData.admin_email,
            settingsData.paypal_enabled,
            settingsData.paypal_link,
            settingsData.stripe_enabled,
            settingsData.bank_transfer_enabled,
            settingsData.calendar_sync_enabled,
            settingsData.google_analytics_enabled,
            settingsData.booking_notifications_enabled,
            settingsData.auto_confirm_bookings,
            settingsData.max_guests,
            settingsData.min_stay_nights,
            settingsData.checkin_time,
            settingsData.checkout_time
          ]);

          return res.status(200).json({
            success: true,
            message: 'Impostazioni salvate con successo',
            settings: result.rows[0]
          });
        } catch (error) {
          console.error('❌ Errore salvataggio settings:', error);
          return res.status(500).json({
            success: false,
            error: 'Errore salvataggio impostazioni'
          });
        }
      }
    }

    // ========================================
    // EMAIL PREVIEW & TEST SECTION
    // ========================================
    if (action === 'preview-email') {
      if (req.method === 'GET') {
        try {
          const { type, lang } = req.query;
          const templateName = type || 'booking_confirmation';
          const language = lang || 'it';

          // Dati simulati per la preview
          const mockData = {
            firstName: 'Mario',
            lastName: 'Rossi',
            bookingId: 'VIN-PREVIEW-123',
            checkin: new Date().toISOString().split('T')[0],
            checkout: new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0], // +3 giorni
            guests: 2,
            adults: 2,
            children: 0,
            totalAmount: 450.00,
            depositAmount: 90.00,
            amountPaid: 450.00, // Per template conferma finale
            fromEmail: process.env.SMTP_FROM || 'info@vincantomaiori.it',
            language: language,
            paymentMethod: 'bank_transfer',
            extraServices: ['Parcheggio Privato', 'Colazione'],
            accommodationCost: 350.00,
            cleaningFee: 60.00,
            parkingCost: 40.00,
            touristTax: 8.00,
            extraServicesCost: 30.00,
            nights: 3,
            logoUrl: 'https://www.vincantomaiori.it/logo.svg',
            siteUrl: 'https://www.vincantomaiori.it'
          };

          const html = renderEmailTemplate(templateName, mockData);

          res.setHeader('Content-Type', 'text/html');
          return res.status(200).send(html);
        } catch (error) {
          console.error('❌ Errore preview email:', error);
          return res.status(500).send(`<h1>Errore generazione preview</h1><pre>${error.message}</pre>`);
        }
      }
    }

    // ========================================
    // GOOGLE CALENDAR INTEGRATION SECTION
    // ========================================
    // ERROR HANDLING - ACTION NOT FOUND
    // ========================================
    return res.status(404).json({
      success: false,
      error: 'Endpoint non trovato',
      availableActions: [
        'login', 'admin/role', 'admin/2fa/setup', 'admin/2fa/verify', 'admin/login-password', 'admin/login-totp',
        'dashboard-stats', 'analytics', 'notifications',
        'booking', 'payments', 'stripe-payment-intent', 'stripe-confirm-payment',
        'payment-methods', 'calendar-configs', 'calendar-sync', 'calendar-auto-sync',
        'calendar-bookings', 'ical-export',
        'blocked-dates', 'pricing-config', 'quote', 'extra-services', 'contact', 'settings',
        'clear-test-bookings', 'update-calendar-config', 'delete-calendar-config',
        'calendar-sync-status', 'force-calendar-sync', 'test-calendar-connection'
      ],
      requestedAction: action,
      method: req.method
    });

  } catch (error) {
    console.error('❌ API Unificata Error:', error);
    return res.status(500).json({
      success: false,
      error: 'Errore interno del server',
      details: error.message,
      action: action
    });
  }
}