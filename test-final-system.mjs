// 🧪 TEST FINALE COMPLETO SISTEMA VINCANTO
// Verifica funzionalità dopo pulizia database e implementazione endpoint critici

console.log('🚀 AVVIO TEST FINALE COMPLETO SISTEMA VINCANTO');

const API_BASE = 'https://vincanto-backup.vercel.app/api';

async function testCompleteSystem() {
  const results = {
    database: false,
    connectivity: false,
    pricing: false,
    booking: false,
    admin: false,
    utilities: false,
    newEndpoints: false
  };

  try {
    console.log('\n📊 FASE 1: TEST CONNETTIVITÀ BASE');
    console.log('='.repeat(50));

    // Test database connectivity
    const dbResponse = await fetch(`${API_BASE}/admin?action=settings`);
    const dbData = await dbResponse.json();
    results.database = dbData.success;
    console.log(`   Database: ${results.database ? '✅ CONNESSO' : '❌ ERRORE'}`);
    if (results.database) {
      console.log(`   Categorie: ${Object.keys(dbData.settings).length} (pulite)`);
      console.log(`   Pricing keys: ${Object.keys(dbData.settings.pricing || {}).length}`);
    }

    // Test connectivity system
    const connectivityResponse = await fetch(`${API_BASE}/pricing?action=config`);
    const connectivityData = await connectivityResponse.json();
    results.connectivity = connectivityData.success;
    console.log(`   API Connectivity: ${results.connectivity ? '✅ FUNZIONANTE' : '❌ ERRORE'}`);

    console.log('\n💰 FASE 2: TEST SISTEMA PRICING');
    console.log('='.repeat(50));

    // Test pricing calculations
    const pricingResponse = await fetch(`${API_BASE}/pricing?action=calculate&guests=4&nights=3`);
    const pricingData = await pricingResponse.json();
    results.pricing = pricingData.success;
    console.log(`   Pricing Calculations: ${results.pricing ? '✅ FUNZIONANTE' : '❌ ERRORE'}`);
    if (results.pricing) {
      const pricing = pricingData.pricing;
      console.log(`   4 persone x 3 notti:`);
      console.log(`     - Prezzo per notte: €${pricing.pricePerNight}`);
      console.log(`     - Base price: €${pricing.basePrice}`);
      console.log(`     - Additional cost: €${pricing.additionalCost}`);
      console.log(`     - Totale: €${pricing.total}`);
    }

    // Test quote generation
    const quoteResponse = await fetch(`${API_BASE}/quote?checkIn=2025-12-15&checkOut=2025-12-18&guests=6`);
    const quoteData = await quoteResponse.json();
    const quoteWorks = quoteData.success && quoteData.quote;
    console.log(`   Quote Generation: ${quoteWorks ? '✅ FUNZIONANTE' : '❌ ERRORE'}`);
    if (quoteWorks) {
      console.log(`   6 persone x 3 notti: €${quoteData.quote.totalAmount} totale`);
    }

    console.log('\n🏨 FASE 3: TEST NUOVI ENDPOINT CRITICI');
    console.log('='.repeat(50));

    // Test sync calendars
    const syncResponse = await fetch(`${API_BASE}/utilities?action=sync-calendars`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    const syncData = await syncResponse.json();
    const syncWorks = syncData.success;
    console.log(`   Calendar Sync: ${syncWorks ? '✅ IMPLEMENTATO' : '❌ ERRORE'}`);
    if (syncWorks) {
      console.log(`   Sources: ${syncData.sources?.length || 0} calendari`);
    }

    // Test booking suspension (simulated)
    const suspendResponse = await fetch(`${API_BASE}/booking?action=suspend`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bookingId: 'TEST123', reason: 'Test sospensione' })
    });
    const suspendData = await suspendResponse.json();
    const suspendWorks = suspendData.success || suspendData.error === 'Prenotazione non trovata';
    console.log(`   Booking Suspension: ${suspendWorks ? '✅ IMPLEMENTATO' : '❌ ERRORE'}`);

    // Test refund endpoint
    const refundResponse = await fetch(`${API_BASE}/booking?action=refund`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refundBookingId: 'TEST123', amount: 100 })
    });
    const refundData = await refundResponse.json();
    const refundWorks = refundData.success || refundData.error === 'Prenotazione non trovata';
    console.log(`   Payment Refund: ${refundWorks ? '✅ IMPLEMENTATO' : '❌ ERRORE'}`);

    // Test capture endpoint
    const captureResponse = await fetch(`${API_BASE}/booking?action=capture`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ captureBookingId: 'TEST123' })
    });
    const captureData = await captureResponse.json();
    const captureWorks = captureData.success || captureData.error === 'Prenotazione non trovata';
    console.log(`   Payment Capture: ${captureWorks ? '✅ IMPLEMENTATO' : '❌ ERRORE'}`);

    results.newEndpoints = syncWorks && suspendWorks && refundWorks && captureWorks;

    console.log('\n🛠️ FASE 4: TEST FUNZIONALITÀ ADMIN');
    console.log('='.repeat(50));

    // Test admin pricing update
    const adminUpdateResponse = await fetch(`${API_BASE}/admin?action=update-pricing`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        basePrice: 75,
        additionalGuest3to4: 30,
        additionalGuest5to6: 25,
        additionalGuest7to8: 20,
        cleaningFee: 50,
        parkingFee: 20,
        touristTaxAdult: 2.00
      })
    });
    const adminUpdateData = await adminUpdateResponse.json();
    results.admin = adminUpdateData.success;
    console.log(`   Admin Settings Update: ${results.admin ? '✅ FUNZIONANTE' : '❌ ERRORE'}`);

    // Test utilities health check
    const healthResponse = await fetch(`${API_BASE}/utilities?action=health`);
    const healthData = await healthResponse.json();
    results.utilities = healthData.success;
    console.log(`   System Health: ${results.utilities ? '✅ HEALTHY' : '❌ ISSUES'}`);
    if (results.utilities) {
      console.log(`   Database: ${healthData.checks?.database ? '✅' : '❌'}`);
      console.log(`   API: ${healthData.checks?.api ? '✅' : '❌'}`);
    }

    console.log('\n📈 FASE 5: RIEPILOGO FINALE');
    console.log('='.repeat(50));

    const allTests = Object.values(results);
    const passedTests = allTests.filter(test => test).length;
    const totalTests = allTests.length;
    const successRate = (passedTests/totalTests*100).toFixed(1);

    console.log(`🎯 Test eseguiti: ${totalTests}`);
    console.log(`✅ Test superati: ${passedTests}`);
    console.log(`📊 Tasso di successo: ${successRate}%`);

    console.log('\n📋 DETTAGLIO RISULTATI:');
    Object.entries(results).forEach(([test, result]) => {
      const status = result ? '✅ PASS' : '❌ FAIL';
      console.log(`   ${test}: ${status}`);
    });

    if (passedTests === totalTests) {
      console.log('\n🎉 SISTEMA COMPLETAMENTE FUNZIONANTE E PRODUCTION-READY!');
      console.log('✅ Database pulito e configurato');
      console.log('✅ API unificate e funzionanti');
      console.log('✅ Endpoint critici implementati');
      console.log('✅ Admin panel operativo');
      console.log('✅ Sistema pricing attivo');
      console.log('✅ Connettività 100%');
    } else {
      console.log('\n⚠️ Alcune funzionalità richiedono attenzione:');
      Object.entries(results).forEach(([test, result]) => {
        if (!result) {
          console.log(`   🔧 ${test} necessita correzioni`);
        }
      });
    }

    return {
      success: passedTests === totalTests,
      results: results,
      stats: {
        total: totalTests,
        passed: passedTests,
        successRate: parseFloat(successRate)
      }
    };

  } catch (error) {
    console.error('❌ ERRORE DURANTE TEST:', error.message);
    return {
      success: false,
      error: error.message,
      results: results
    };
  }
}

// Esegui test finale
testCompleteSystem();