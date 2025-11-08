// 🧪 TEST COMPLETO CONNETTIVITÀ SISTEMA
// Questo script verifica che admin panel → PostgreSQL → frontend user siano connessi

console.log('🚀 AVVIO TEST CONNETTIVITÀ VINCANTO SISTEMA');

const API_BASE = 'https://vincanto-backup.vercel.app/api';

async function testSystemConnectivity() {
  const results = {
    database: false,
    adminAPI: false,
    pricingAPI: false,
    quoteAPI: false,
    adminPanelConfig: false,
    frontendCompatibility: false
  };

  try {
    // 🔍 Test 1: Connessione Database
    console.log('\n1️⃣ Testing Database Connection...');
    const dbResponse = await fetch(`${API_BASE}/admin?action=settings`);
    const dbData = await dbResponse.json();
    results.database = dbData.success && dbData.settings;
    console.log(`   Database: ${results.database ? '✅ CONNESSO' : '❌ ERRORE'}`);
    if (results.database) {
      console.log(`   Impostazioni trovate: ${Object.keys(dbData.settings).length} categorie`);
    }

    // 🔍 Test 2: API Admin
    console.log('\n2️⃣ Testing Admin API...');
    const adminResponse = await fetch(`${API_BASE}/admin?action=settings`);
    const adminData = await adminResponse.json();
    results.adminAPI = adminData.success;
    console.log(`   Admin API: ${results.adminAPI ? '✅ FUNZIONANTE' : '❌ ERRORE'}`);

    // 🔍 Test 3: API Pricing
    console.log('\n3️⃣ Testing Pricing API...');
    const pricingResponse = await fetch(`${API_BASE}/pricing?action=config`);
    const pricingData = await pricingResponse.json();
    results.pricingAPI = pricingData.success && pricingData.config;
    console.log(`   Pricing API: ${results.pricingAPI ? '✅ FUNZIONANTE' : '❌ ERRORE'}`);
    if (results.pricingAPI) {
      const config = pricingData.config;
      console.log(`   Base Price: €${config.basePrice}`);
      console.log(`   Sistema: Base €${config.basePrice * 2} + Aggiuntive (3-4: €${config.additionalGuest3to4}, 5-6: €${config.additionalGuest5to6}, 7-8: €${config.additionalGuest7to8})`);
    }

    // 🔍 Test 4: API Quote
    console.log('\n4️⃣ Testing Quote API...');
    const quoteResponse = await fetch(`${API_BASE}/quote?checkIn=2025-12-15&checkOut=2025-12-20&guests=4`);
    const quoteData = await quoteResponse.json();
    results.quoteAPI = quoteData.success && quoteData.quote;
    console.log(`   Quote API: ${results.quoteAPI ? '✅ FUNZIONANTE' : '❌ ERRORE'}`);
    if (results.quoteAPI) {
      const quote = quoteData.quote;
      console.log(`   Preventivo 4 persone x 5 notti:`);
      console.log(`     - Prezzo per notte: €${quote.pricePerNight}`);
      console.log(`     - Base (2 persone): €${quote.basePrice}`);
      console.log(`     - Costo aggiuntivo: €${quote.additionalCost}`);
      console.log(`     - Totale soggiorno: €${quote.totalAmount}`);
    }

    // 🔍 Test 5: Configurazione Admin Panel
    console.log('\n5️⃣ Testing Admin Panel Configuration...');
    try {
      const adminSettings = dbData.settings?.pricing;
      results.adminPanelConfig = adminSettings && 
                                adminSettings.base_price && 
                                adminSettings.additional_guest_3to4;
      console.log(`   Admin Panel Config: ${results.adminPanelConfig ? '✅ CONFIGURATO' : '❌ MANCANTE'}`);
      if (results.adminPanelConfig) {
        console.log(`     - Base Price: €${adminSettings.base_price}`);
        console.log(`     - Additional 3-4: €${adminSettings.additional_guest_3to4}`);
        console.log(`     - Additional 5-6: €${adminSettings.additional_guest_5to6}`);
        console.log(`     - Additional 7-8: €${adminSettings.additional_guest_7to8}`);
      }
    } catch (e) {
      console.log(`   Admin Panel Config: ❌ ERRORE - ${e.message}`);
    }

    // 🔍 Test 6: Compatibilità Frontend
    console.log('\n6️⃣ Testing Frontend Compatibility...');
    results.frontendCompatibility = results.pricingAPI && 
                                   pricingData.config.basePrice && 
                                   pricingData.config.additionalGuest3to4;
    console.log(`   Frontend Compatibility: ${results.frontendCompatibility ? '✅ COMPATIBILE' : '❌ PROBLEMI'}`);

    // 📊 Riepilogo Finale
    console.log('\n📊 RIEPILOGO FINALE:');
    console.log('='.repeat(50));
    
    const allTests = Object.values(results);
    const passedTests = allTests.filter(test => test).length;
    const totalTests = allTests.length;
    
    console.log(`Sistemi testati: ${totalTests}`);
    console.log(`Sistemi funzionanti: ${passedTests}`);
    console.log(`Successo: ${(passedTests/totalTests*100).toFixed(1)}%`);
    
    if (passedTests === totalTests) {
      console.log('\n🎉 SISTEMA COMPLETAMENTE FUNZIONANTE!');
      console.log('✅ Admin Panel → Database → Frontend User tutti connessi');
    } else {
      console.log('\n⚠️ Alcuni sistemi richiedono attenzione:');
      Object.entries(results).forEach(([test, result]) => {
        if (!result) {
          console.log(`   ❌ ${test}`);
        }
      });
    }

    return results;

  } catch (error) {
    console.error('❌ ERRORE GENERALE:', error.message);
    return results;
  }
}

// Esegui test
testSystemConnectivity();