/**
 * Script di test per verificare le API del pannello admin
 * Testa calendari, date bloccate e configurazione
 */

const API_BASE = '/api/admin';

// Test delle API
async function testAPI(endpoint, method = 'GET', data = null) {
    try {
        const options = {
            method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer superadmin-token'
            }
        };
        
        if (data && method !== 'GET') {
            options.body = JSON.stringify(data);
        }

        const response = await fetch(`${API_BASE}${endpoint}`, options);
        const result = await response.json();
        
        console.log(`✅ ${method} ${endpoint}:`, result);
        return result;
    } catch (error) {
        console.error(`❌ ${method} ${endpoint}:`, error);
        return null;
    }
}

// Test suite completo
async function runTests() {
    console.log('🚀 Avvio test delle API Admin...\n');

    // Test Calendari
    console.log('📅 Test API Calendari:');
    await testAPI('/calendars');
    
    const newCalendar = {
        name: 'Test Calendar',
        platform: 'Airbnb',
        url: 'https://calendar.google.com/test',
        active: true
    };
    await testAPI('/calendars', 'POST', newCalendar);
    
    // Test Date Bloccate
    console.log('\n🚫 Test API Date Bloccate:');
    await testAPI('/blocked-dates');
    
    const newBlockedDate = {
        startDate: '2025-12-25',
        endDate: '2025-12-25',
        type: 'maintenance',
        source: 'manual',
        reason: 'Manutenzione natalizia'
    };
    await testAPI('/blocked-dates', 'POST', newBlockedDate);
    
    // Test Configurazione
    console.log('\n⚙️ Test API Configurazione:');
    await testAPI('/config');
    await testAPI('/config?section=pricing');
    
    const pricingUpdate = {
        section: 'pricing',
        data: {
            basePrice: 85,
            additionalGuestPrice: 25
        }
    };
    await testAPI('/config', 'PUT', pricingUpdate);
    
    console.log('\n✅ Test completati!');
}

// Avvia i test quando la pagina è caricata
if (typeof window !== 'undefined') {
    window.runAdminTests = runTests;
    console.log('💡 Usa runAdminTests() nella console per testare le API');
} else {
    // Se eseguito in Node.js
    runTests();
}

export { testAPI, runTests };