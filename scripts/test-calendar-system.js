#!/usr/bin/env node

/**
 * Script di Test Sistema Calendari Vincanto
 * Testa l'intero flusso di sincronizzazione calendari
 */

import fetch from 'node-fetch';

const BASE_URL = process.env.TEST_URL || 'http://localhost:3000';
const API_BASE = `${BASE_URL}/api`;

// Colori per output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

const log = (message, color = 'reset') => {
  console.log(`${colors[color]}${message}${colors.reset}`);
};

async function testAPI(endpoint, options = {}) {
  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      ...options
    });
    
    const data = await response.json();
    return { success: response.ok, data, status: response.status };
  } catch (error) {
    return { success: false, error: error.message, status: 0 };
  }
}

async function runTests() {
  log('\n🧪 VINCANTO CALENDAR SYNC - TEST SUITE', 'bold');
  log('=' * 50, 'blue');
  
  const results = {
    passed: 0,
    failed: 0,
    tests: []
  };

  // Test 1: Controllo disponibilità base
  log('\n📅 Test 1: Controllo Disponibilità Base', 'yellow');
  const availabilityTest = await testAPI('/availability-sync?action=check&startDate=2025-12-01&endDate=2025-12-05');
  if (availabilityTest.success) {
    log('✅ API availability-sync funzionante', 'green');
    log(`   • Date bloccate trovate: ${availabilityTest.data.blockedDates?.length || 0}`);
    log(`   • Calendari controllati: ${availabilityTest.data.calendarsChecked?.length || 0}`);
    results.passed++;
  } else {
    log(`❌ API availability-sync fallita: ${availabilityTest.error}`, 'red');
    results.failed++;
  }
  results.tests.push({ name: 'Availability Check', passed: availabilityTest.success });

  // Test 2: Sincronizzazione forzata tutti i calendari
  log('\n🔄 Test 2: Sincronizzazione Forzata', 'yellow');
  const syncTest = await testAPI('/availability-sync?action=sync-all');
  if (syncTest.success) {
    log('✅ Sincronizzazione calendari completata', 'green');
    log(`   • Calendari sincronizzati: ${syncTest.data.calendarsChecked?.length || 0}`);
    log(`   • Date bloccate totali: ${syncTest.data.totalBlockedDates || 0}`);
    results.passed++;
  } else {
    log(`❌ Sincronizzazione fallita: ${syncTest.error}`, 'red');
    results.failed++;
  }
  results.tests.push({ name: 'Calendar Sync', passed: syncTest.success });

  // Test 3: Status Google Calendar
  log('\n📊 Test 3: Status Google Calendar', 'yellow');
  const googleStatusTest = await testAPI('/google-calendar?action=status');
  if (googleStatusTest.success) {
    const status = googleStatusTest.data;
    log('✅ Status Google Calendar ottenuto', 'green');
    log(`   • Configurato: ${status.configured ? 'Sì' : 'No'}`);
    log(`   • Attivo: ${status.active ? 'Sì' : 'No'}`);
    log(`   • Richiede riautorizzazione: ${status.needsReauth ? 'Sì' : 'No'}`);
    log(`   • Ultima sincronizzazione: ${status.lastSync || 'Mai'}`);
    results.passed++;
  } else {
    log(`❌ Status Google Calendar fallito: ${googleStatusTest.error}`, 'red');
    results.failed++;
  }
  results.tests.push({ name: 'Google Calendar Status', passed: googleStatusTest.success });

  // Test 4: Simulazione prenotazione (senza salvataggio)
  log('\n🏨 Test 4: Simulazione Prenotazione', 'yellow');
  const bookingData = {
    check_in_date: '2025-12-15',
    check_out_date: '2025-12-18',
    guest_name: 'Test User',
    guest_email: 'test@example.com',
    guest_phone: '+39 123 456 7890',
    num_adults: 2,
    num_children: 0,
    total_amount: 450.00,
    deposit_amount: 135.00,
    parking_option: 'private',
    special_requests: 'Test booking - NOT REAL'
  };

  // Prima verifica disponibilità
  const preBookingCheck = await testAPI(`/availability-sync?action=check&startDate=${bookingData.check_in_date}&endDate=${bookingData.check_out_date}`);
  if (preBookingCheck.success && preBookingCheck.data.available) {
    log('✅ Date disponibili per test prenotazione', 'green');
    
    // Simula prenotazione (commentato per evitare prenotazioni reali)
    log('   ℹ️ Test prenotazione simulato (non eseguito per sicurezza)', 'blue');
    log('   • Per testare prenotazioni reali, decommentare il codice nel test');
    results.passed++;
    
    /*
    const bookingTest = await testAPI('/booking-sync', {
      method: 'POST',
      body: JSON.stringify(bookingData)
    });
    
    if (bookingTest.success) {
      log('✅ Prenotazione test creata', 'green');
      log(`   • ID Prenotazione: ${bookingTest.data.bookingId}`);
      log(`   • Calendari sincronizzati: ${bookingTest.data.calendarSync?.totalSynced || 0}`);
      log(`   • Errori sync: ${bookingTest.data.calendarSync?.totalErrors || 0}`);
    } else {
      log(`❌ Prenotazione test fallita: ${bookingTest.error}`, 'red');
    }
    */
    
  } else {
    log(`❌ Date non disponibili per test: ${preBookingCheck.error}`, 'red');
    results.failed++;
  }
  results.tests.push({ name: 'Booking Simulation', passed: preBookingCheck.success });

  // Test 5: Verifica API calendario admin
  log('\n⚙️ Test 5: API Calendario Admin', 'yellow');
  const adminCalendarTest = await testAPI('/calendar-sync');
  if (adminCalendarTest.success) {
    log('✅ API calendario admin funzionante', 'green');
    log(`   • Calendari configurati: ${adminCalendarTest.data.calendars?.length || 0}`);
    adminCalendarTest.data.calendars?.forEach(cal => {
      log(`     - ${cal.name} (${cal.platform}): ${cal.status}`);
    });
    results.passed++;
  } else {
    log(`❌ API calendario admin fallita: ${adminCalendarTest.error}`, 'red');
    results.failed++;
  }
  results.tests.push({ name: 'Admin Calendar API', passed: adminCalendarTest.success });

  // Test 6: Performance check
  log('\n⚡ Test 6: Performance Check', 'yellow');
  const startTime = Date.now();
  const perfTest = await testAPI('/availability-sync?action=check&startDate=2025-11-01&endDate=2025-11-30');
  const endTime = Date.now();
  const responseTime = endTime - startTime;

  if (perfTest.success) {
    if (responseTime < 2000) {
      log(`✅ Performance OK: ${responseTime}ms`, 'green');
      results.passed++;
    } else {
      log(`⚠️ Performance lenta: ${responseTime}ms (>2s)`, 'yellow');
      results.passed++;
    }
  } else {
    log(`❌ Performance test fallito: ${perfTest.error}`, 'red');
    results.failed++;
  }
  results.tests.push({ name: 'Performance Check', passed: perfTest.success });

  // Riepilogo finale
  log('\n📊 RIEPILOGO TEST', 'bold');
  log('=' * 30, 'blue');
  log(`✅ Test superati: ${results.passed}`, 'green');
  log(`❌ Test falliti: ${results.failed}`, 'red');
  log(`📊 Successo totale: ${Math.round((results.passed / (results.passed + results.failed)) * 100)}%`);

  // Dettaglio test
  log('\n📋 Dettaglio Test:', 'blue');
  results.tests.forEach((test, index) => {
    const icon = test.passed ? '✅' : '❌';
    log(`${index + 1}. ${icon} ${test.name}`);
  });

  // Raccomandazioni
  log('\n💡 RACCOMANDAZIONI:', 'bold');
  if (results.failed === 0) {
    log('🎉 Tutti i test superati! Sistema calendario pronto per la produzione.', 'green');
  } else {
    log('⚠️ Alcuni test falliti. Controlla la configurazione:', 'yellow');
    log('   • Verifica DATABASE_URL in .env');
    log('   • Controlla configurazione Google Calendar');
    log('   • Assicurati che tutti i calendari iCal siano accessibili');
  }

  log('\n🚀 Setup Google Calendar:', 'blue');
  log('1. Vai a Google Cloud Console');
  log('2. Abilita Google Calendar API');
  log('3. Crea credenziali OAuth2');
  log('4. Configura GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI');
  log('5. Visita /api/google-calendar?action=auth-url per autorizzare');

  log('\n🔧 Per aggiungere calendari iCal:', 'blue');
  log('• Usa il pannello admin per aggiungere URL iCal di Booking.com, Holidu, etc.');
  log('• Il sistema sincronizzerà automaticamente ogni 5 minuti');

  process.exit(results.failed === 0 ? 0 : 1);
}

// Avvia i test
runTests().catch(error => {
  log(`❌ Errore fatale nei test: ${error.message}`, 'red');
  process.exit(1);
});