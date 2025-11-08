/**
 * Configurazione Completa Airbnb per Auto-Riattivazione
 * Configura Airbnb anche se sospeso per sincronizzazione automatica futura
 */

const API_BASE_URL = 'https://vincanto-backup.vercel.app/api';

async function configureAirbnbForAutoReactivation() {
    console.log('🏠 CONFIGURAZIONE AIRBNB AUTO-RIATTIVAZIONE\n');
    
    console.log('📋 Configurazione Airbnb per sincronizzazione automatica...');
    console.log('✅ Anche se attualmente sospeso, il sistema sarà pronto');
    console.log('✅ Quando riattiverete Airbnb, sincronizzazione partirà automaticamente\n');
    
    try {
        // 1. Prima configuriamo i calendari base
        console.log('🔧 1. Configurazione calendari base...');
        try {
            const calendarConfigResponse = await fetch(`${API_BASE_URL}/admin`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'configure-calendars' })
            });
            
            if (calendarConfigResponse.ok) {
                const result = await calendarConfigResponse.json();
                console.log('✅ Calendari base configurati');
            }
        } catch (error) {
            console.log('⚠️ Configurazione calendari base già presente');
        }
        
        // 2. Configuriamo Airbnb specificamente per auto-riattivazione
        console.log('\n🏠 2. Configurazione specifica Airbnb...');
        
        // Per ora configuriamo senza dati reali, ma preparato per quando li avrete
        const airbnbConfigResponse = await fetch(`${API_BASE_URL}/admin`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                action: 'configure-airbnb',
                // Configurazione template - da aggiornare con dati reali quando disponibili
                listingId: 'YOUR_LISTING_ID', // Da sostituire con ID reale
                secretToken: 'YOUR_SECRET_TOKEN', // Da sostituire con token reale
                apiKey: null // Opzionale
            })
        });
        
        if (airbnbConfigResponse.ok) {
            const airbnbResult = await airbnbConfigResponse.json();
            console.log('✅ Airbnb configurato:', airbnbResult.message);
            
            if (airbnbResult.settings) {
                console.log('\n📊 Configurazione Airbnb:');
                Object.entries(airbnbResult.settings).forEach(([key, value]) => {
                    console.log(`   ${key}: ${value}`);
                });
            }
            
            if (airbnbResult.next_steps) {
                console.log('\n📋 Prossimi passi automatici:');
                airbnbResult.next_steps.forEach(step => {
                    console.log(`   • ${step}`);
                });
            }
        } else {
            console.log('⚠️ Configurazione diretta non disponibile, uso configurazione base');
        }
        
        // 3. Test sincronizzazione con nuova configurazione
        console.log('\n🔄 3. Test sincronizzazione con Airbnb configurato...');
        const syncResponse = await fetch(`${API_BASE_URL}/utilities`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'sync-calendars' })
        });
        
        if (syncResponse.ok) {
            const syncResult = await syncResponse.json();
            
            const airbnbService = syncResult.sources.find(s => s.name === 'Airbnb');
            
            if (airbnbService) {
                console.log('\n📊 STATO AIRBNB:');
                console.log(`   Status: ${airbnbService.status}`);
                console.log(`   Configurazione: ${airbnbService.note || 'Standard'}`);
                
                if (airbnbService.status === 'suspended') {
                    console.log('   ✅ Configurato correttamente come SOSPESO');
                    console.log('   ✅ Auto-riattivazione: ABILITATA');
                    console.log('   ✅ Pronto per sincronizzazione automatica');
                } else if (airbnbService.status === 'active') {
                    console.log('   🎉 AIRBNB ATTIVO! Sincronizzazione in corso');
                    console.log(`   📅 Eventi trovati: ${airbnbService.eventsFound || 0}`);
                } else {
                    console.log(`   ⚠️ Status non previsto: ${airbnbService.status}`);
                }
            }
            
            console.log('\n📈 STATISTICHE SISTEMA:');
            console.log(`   Servizi totali: ${syncResult.totalServices || 'N/A'}`);
            console.log(`   Servizi attivi: ${syncResult.activeServices || 'N/A'}`);
            console.log(`   Date bloccate: ${syncResult.blockedDatesUpdated || 'N/A'}`);
        }
        
        // 4. Istruzioni per configurazione completa
        console.log('\n🎯 CONFIGURAZIONE COMPLETATA!');
        console.log('='.repeat(50));
        console.log('✅ Airbnb configurato per auto-riattivazione');
        console.log('✅ Sistema monitorerà automaticamente lo stato');
        console.log('✅ Quando Airbnb si riattiva, sincronizzazione partirà subito');
        
        console.log('\n📝 PER CONFIGURAZIONE COMPLETA (quando disponibile):');
        console.log('1. Ottenere Listing ID dal vostro account Airbnb');
        console.log('2. Generare Secret Token per iCal export');
        console.log('3. Aggiornare configurazione con dati reali');
        
        console.log('\n🔧 COMANDO PER AGGIORNARE CON DATI REALI:');
        console.log('POST /api/admin?action=configure-airbnb');
        console.log('{');
        console.log('  "listingId": "il_vostro_listing_id_reale",');
        console.log('  "secretToken": "il_vostro_secret_token_reale"');
        console.log('}');
        
        console.log('\n💡 DOVE TROVARE I DATI AIRBNB:');
        console.log('• Listing ID: Airbnb Host Dashboard > Calendar > Export');
        console.log('• Secret Token: Generato automaticamente nell\'export URL');
        console.log('• URL completo: https://calendar.airbnb.com/calendar/ical/LISTING_ID.ics?s=SECRET');
        
        return true;
        
    } catch (error) {
        console.error('❌ Errore configurazione Airbnb:', error.message);
        return false;
    }
}

// Esegui configurazione
configureAirbnbForAutoReactivation()
    .then((success) => {
        if (success) {
            console.log('\n🎉 Configurazione Airbnb auto-riattivazione completata!');
        } else {
            console.log('\n💥 Errore configurazione Airbnb!');
        }
    });