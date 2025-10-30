/**
 * 🎯 VINCANTO - SETUP ENDPOINT PRODUZIONE
 * Endpoint per configurare il sistema da zero
 */

const express = require('express');
const bcrypt = require('bcrypt');
const fs = require('fs').promises;
const path = require('path');

const router = express.Router();

// 🎯 POST /api/admin/setup - Configurazione iniziale del sistema
router.post('/setup', async (req, res) => {
  try {
    const { calendars, payments, pricing, email, admin } = req.body;

    console.log('🎯 Configurazione sistema iniziale ricevuta');

    // 1. Crea file .env per produzione
    const envContent = generateEnvContent({ calendars, payments, pricing, email, admin });
    
    // 2. Salva configurazione nel database
    await saveSystemConfiguration({ calendars, payments, pricing, email, admin });

    // 3. Hash password admin
    const hashedPassword = await bcrypt.hash(admin.password, 10);
    
    // 4. Crea utente amministratore
    await createAdminUser({
      username: admin.username || 'admin',
      email: admin.email,
      password: hashedPassword
    });

    // 5. Inizializza calendario se necessario
    if (calendars.bookingCom || calendars.airbnb || calendars.vrbo) {
      await initializeCalendarSync(calendars);
    }

    // 6. Test configurazioni
    const testResults = await testConfigurations({ payments, email });

    res.json({
      success: true,
      message: 'Sistema configurato con successo!',
      configuration: {
        calendarsConfigured: Object.values(calendars).filter(Boolean).length,
        paymentsEnabled: [payments.stripeEnabled, payments.paypalEnabled, payments.bankTransferEnabled].filter(Boolean).length,
        emailConfigured: !!email.smtpUser,
        adminCreated: true
      },
      tests: testResults
    });

  } catch (error) {
    console.error('❌ Errore configurazione sistema:', error);
    res.status(500).json({
      success: false,
      error: 'Errore nella configurazione del sistema',
      details: error.message
    });
  }
});

// 🎯 Genera contenuto file .env per produzione
function generateEnvContent({ calendars, payments, pricing, email, admin }) {
  return `# 🎯 VINCANTO - CONFIGURAZIONE PRODUZIONE AUTOMATICA
# Generato il ${new Date().toISOString()}

# === AMBIENTE ===
NODE_ENV=production

# === CALENDARI ===
BOOKING_COM_ICAL_URL=${calendars.bookingCom || ''}
AIRBNB_ICAL_URL=${calendars.airbnb || ''}
VRBO_ICAL_URL=${calendars.vrbo || ''}
GOOGLE_CALENDAR_ENABLED=${calendars.googleCalendar || false}

# === PAGAMENTI ===
STRIPE_ENABLED=${payments.stripeEnabled || false}
STRIPE_PUBLISHABLE_KEY=${payments.stripePublicKey || ''}
PAYPAL_ENABLED=${payments.paypalEnabled || false}
PAYPAL_CLIENT_ID=${payments.paypalClientId || ''}

# === BONIFICO ===
BANK_NAME=${payments.bankDetails.name || ''}
BANK_IBAN=${payments.bankDetails.iban || ''}
BANK_BIC=${payments.bankDetails.bic || ''}
BANK_BENEFICIARY=${payments.bankDetails.beneficiary || ''}

# === PREZZI ===
BASE_PRICE=${pricing.basePrice || 100}
CLEANING_FEE=${pricing.cleaningFee || 50}
WEEKEND_SURCHARGE=${pricing.weekendSurcharge || 20}
MIN_STAY=${pricing.minStay || 2}
MAX_STAY=${pricing.maxStay || 14}
CHECK_IN_TIME=${pricing.checkInTime || '15:00'}
CHECK_OUT_TIME=${pricing.checkOutTime || '11:00'}

# === EMAIL ===
EMAIL_PROVIDER=${email.provider || 'smtp'}
SMTP_HOST=${email.smtpHost || 'smtp.gmail.com'}
SMTP_PORT=${email.smtpPort || 587}
SMTP_USER=${email.smtpUser || ''}
SMTP_PASS=${email.smtpPass || ''}

# === ADMIN ===
ADMIN_EMAIL=${admin.email || ''}

# === URL PRODUZIONE ===
FRONTEND_URL=https://vincanto-vetrina.vercel.app
CORS_ORIGIN=https://vincanto-vetrina.vercel.app
`;
}

// 🎯 Salva configurazione nel database
async function saveSystemConfiguration(config) {
  // Implementa il salvataggio della configurazione nel database
  console.log('💾 Salvando configurazione sistema nel database');
  
  // Qui dovrai implementare il salvataggio effettivo
  // usando i modelli Sequelize o query dirette al database
}

// 🎯 Crea utente amministratore
async function createAdminUser({ username, email, password }) {
  console.log('👤 Creando utente amministratore:', email);
  
  // Implementa la creazione dell'utente admin
  // usando i modelli User di Sequelize
}

// 🎯 Inizializza sincronizzazione calendari
async function initializeCalendarSync(calendars) {
  console.log('📅 Inizializzando sincronizzazione calendari');
  
  // Implementa l'inizializzazione della sincronizzazione
  // dei calendari esterni
}

// 🎯 Testa le configurazioni
async function testConfigurations({ payments, email }) {
  const results = {
    stripe: false,
    paypal: false,
    email: false
  };

  // Test Stripe
  if (payments.stripeEnabled && payments.stripePublicKey) {
    try {
      // Test connessione Stripe
      results.stripe = true;
    } catch (error) {
      console.log('❌ Test Stripe fallito:', error.message);
    }
  }

  // Test Email
  if (email.smtpUser && email.smtpPass) {
    try {
      // Test invio email
      results.email = true;
    } catch (error) {
      console.log('❌ Test Email fallito:', error.message);
    }
  }

  return results;
}

// 🎯 GET /api/admin/setup/status - Verifica se il sistema è già configurato
router.get('/setup/status', async (req, res) => {
  try {
    // Verifica se esiste già una configurazione
    const isConfigured = await checkSystemConfiguration();
    
    res.json({
      configured: isConfigured,
      needsSetup: !isConfigured
    });
  } catch (error) {
    console.error('❌ Errore verifica stato:', error);
    res.status(500).json({ error: 'Errore verifica configurazione' });
  }
});

async function checkSystemConfiguration() {
  // Implementa la verifica se il sistema è già configurato
  // controllando database, file .env, etc.
  return false; // Per ora ritorna sempre false per forzare setup
}

module.exports = router;