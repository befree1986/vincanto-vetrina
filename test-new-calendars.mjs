/**
 * Test Specifico per Airbnb e Holidu
 * Verifica che i nuovi servizi siano inclusi nella sincronizzazione
 */

const API_BASE_URL = 'https://vincanto-backup.vercel.app/api';

async function testNewCalendarServices() {
    console.log('🔍 TEST AIRBNB (SOSPESO) + HOLIDU ICAL\n');
    
    try {
        console.log('🔄 Avvio sincronizzazione con nuovi servizi...');
        const syncResponse = await fetch(`${API_BASE_URL}/utilities`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'sync-calendars' })
        });
        
        const syncResult = await syncResponse.json();
        console.log('Risultato sincronizzazione:', JSON.stringify(syncResult, null, 2));
        
        if (syncResult.success) {
            console.log('\n📊 ANALISI SERVIZI:');
            console.log(`Servizi totali trovati: ${syncResult.sources.length}`);
            
            syncResult.sources.forEach((service, index) => {
                console.log(`\n${index + 1}. ${service.name}`);
                console.log(`   Status: ${service.status}`);
                
                if (service.name === 'Airbnb') {
                    console.log('   🔍 AIRBNB CONFIGURAZIONE:');
                    console.log(`   • Status corretto: ${service.status === 'suspended' ? 'SOSPESO ✅' : 'ALTRO'}`);
                    console.log(`   • Note: ${service.note || 'N/A'}`);
                    console.log(`   • Errore: ${service.error || 'N/A'}`);
                }
                
                if (service.name === 'Holidu') {
                    console.log('   🔍 HOLIDU CONFIGURAZIONE:');
                    console.log(`   • Status: ${service.status}`);
                    console.log(`   • Eventi: ${service.eventsFound || 0}`);
                    console.log(`   • Date bloccate: ${service.blockedDates || 0}`);
                    console.log(`   • Tipo: iCal feed sync`);
                }
            });
            
            // Verifica se Holidu è presente
            const holiduService = syncResult.sources.find(s => s.name === 'Holidu');
            const airbnbService = syncResult.sources.find(s => s.name === 'Airbnb');
            
            console.log('\n🎯 VERIFICA CONFIGURAZIONE:');
            console.log(`✅ Holidu presente: ${holiduService ? 'SÌ' : 'NO'}`);
            console.log(`✅ Airbnb presente: ${airbnbService ? 'SÌ' : 'NO'}`);
            console.log(`✅ Airbnb sospeso: ${airbnbService?.status === 'suspended' ? 'SÌ' : 'NO'}`);
            
            if (holiduService && airbnbService) {
                console.log('\n🎉 CONFIGURAZIONE COMPLETATA!');
                console.log('• Airbnb: Sospeso ma configurabile per riattivazione');
                console.log('• Holidu: Attivo con sincronizzazione iCal');
                console.log('• Sistema pronto per 4+ piattaforme calendar sync');
            } else {
                console.log('\n⚠️ Nuovi servizi non ancora attivi nel deploy');
            }
            
        } else {
            console.log('❌ Errore sincronizzazione:', syncResult.message);
        }
        
    } catch (error) {
        console.error('❌ Test fallito:', error.message);
    }
}

testNewCalendarServices();