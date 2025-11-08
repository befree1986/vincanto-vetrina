// 🏗️ SCRIPT INIZIALIZZAZIONE DATABASE VINCANTO
// Crea tabelle mancanti per sistema booking completo

console.log('🚀 AVVIO INIZIALIZZAZIONE DATABASE VINCANTO');

const API_BASE = 'https://vincanto-backup.vercel.app/api';

async function initializeDatabase() {
  try {
    console.log('\n📋 FASE 1: VERIFICA STRUTTURA DATABASE');
    console.log('='.repeat(50));

    // Test connessione database
    const healthResponse = await fetch(`${API_BASE}/utilities?action=health`);
    const healthData = await healthResponse.json();
    
    if (!healthData.success) {
      throw new Error('Database non raggiungibile');
    }
    
    console.log('✅ Database connesso e raggiungibile');

    console.log('\n🏗️ FASE 2: CREAZIONE STRUTTURA TABELLE');
    console.log('='.repeat(50));

    // Crea endpoint per inizializzazione tabelle nell'API admin
    const initResponse = await fetch(`${API_BASE}/admin?action=init-database`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'create_tables',
        force: true
      })
    });

    if (initResponse.status === 400) {
      console.log('ℹ️ Endpoint init-database non disponibile');
      console.log('📝 Suggerimento: le tabelle potrebbero essere già create o necessitare creazione manuale');
      
      // Mostra struttura SQL necessaria
      console.log('\n📄 STRUTTURA SQL NECESSARIA:');
      console.log(`
-- Tabella prenotazioni
CREATE TABLE IF NOT EXISTS bookings (
  id SERIAL PRIMARY KEY,
  booking_id VARCHAR(50) UNIQUE NOT NULL,
  check_in DATE NOT NULL,
  check_out DATE NOT NULL,
  guests INTEGER NOT NULL,
  adults INTEGER,
  children INTEGER DEFAULT 0,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  email VARCHAR(255),
  phone VARCHAR(50),
  total_amount DECIMAL(10,2),
  deposit_amount DECIMAL(10,2),
  notes TEXT,
  status VARCHAR(50) DEFAULT 'pending',
  payment_status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabella date bloccate
CREATE TABLE IF NOT EXISTS blocked_dates (
  id SERIAL PRIMARY KEY,
  date_blocked DATE NOT NULL UNIQUE,
  reason VARCHAR(255),
  booking_id VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indici per performance
CREATE INDEX IF NOT EXISTS idx_bookings_dates ON bookings(check_in, check_out);
CREATE INDEX IF NOT EXISTS idx_blocked_dates_date ON blocked_dates(date_blocked);
      `);
      
    } else if (initResponse.ok) {
      const initData = await initResponse.json();
      console.log('✅ Tabelle create con successo');
      console.log(`   Risultato: ${initData.message}`);
    } else {
      console.log('⚠️ Errore durante creazione tabelle');
    }

    console.log('\n🧪 FASE 3: TEST FUNZIONALITÀ BOOKING');
    console.log('='.repeat(50));

    // Test booking endpoints con dati di test
    console.log('🔍 Test creazione prenotazione...');
    const createBookingResponse = await fetch(`${API_BASE}/booking?action=create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        checkIn: '2025-12-15',
        checkOut: '2025-12-18',
        guests: 4,
        adults: 2,
        children: 2,
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com',
        phone: '+39 123 456 7890',
        totalAmount: 600,
        depositAmount: 180,
        notes: 'Prenotazione di test'
      })
    });

    if (createBookingResponse.ok) {
      const bookingData = await createBookingResponse.json();
      console.log('✅ Creazione prenotazione funzionante');
      console.log(`   Booking ID: ${bookingData.bookingId}`);
      
      // Test sospensione prenotazione
      console.log('🔍 Test sospensione prenotazione...');
      const suspendResponse = await fetch(`${API_BASE}/booking?action=suspend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId: bookingData.bookingId,
          reason: 'Test sospensione automatica'
        })
      });

      if (suspendResponse.ok) {
        console.log('✅ Sospensione prenotazione funzionante');
      } else {
        console.log('⚠️ Errore sospensione prenotazione');
      }

    } else {
      const errorData = await createBookingResponse.json();
      console.log('❌ Errore creazione prenotazione:', errorData.error);
      
      if (errorData.error.includes('relation "bookings" does not exist')) {
        console.log('📝 La tabella bookings non esiste e deve essere creata manualmente');
      }
    }

    console.log('\n📊 FASE 4: RIEPILOGO INIZIALIZZAZIONE');
    console.log('='.repeat(50));

    // Test finale stato sistema
    const finalTestResponse = await fetch(`${API_BASE}/utilities?action=health`);
    const finalTestData = await finalTestResponse.json();

    console.log(`Database Health: ${finalTestData.checks?.database ? '✅ OK' : '❌ Issues'}`);
    console.log(`API Health: ${finalTestData.checks?.api ? '✅ OK' : '❌ Issues'}`);
    
    // Verifica configurazioni
    const settingsResponse = await fetch(`${API_BASE}/admin?action=settings`);
    const settingsData = await settingsResponse.json();
    
    if (settingsData.success) {
      console.log(`Configurazioni: ✅ ${Object.keys(settingsData.settings).length} categorie`);
      console.log(`Pricing: ✅ ${Object.keys(settingsData.settings.pricing).length} impostazioni`);
    }

    console.log('\n🎯 RACCOMANDAZIONI FINALI:');
    console.log('1. Se i test booking falliscono, creare manualmente le tabelle SQL mostrate sopra');
    console.log('2. Verificare che l\'utente database abbia permessi CREATE TABLE');
    console.log('3. Testare il sistema di prenotazioni con dati reali');
    console.log('4. Configurare webhooks per pagamenti Stripe/PayPal');

    return {
      success: true,
      database: finalTestData.checks?.database || false,
      configurations: settingsData.success || false
    };

  } catch (error) {
    console.error('❌ ERRORE INIZIALIZZAZIONE:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

// Esegui inizializzazione
initializeDatabase();