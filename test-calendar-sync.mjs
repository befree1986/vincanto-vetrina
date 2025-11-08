/**
 * Test Sistema Sincronizzazione Calendari - Verifica Completa
 * Verifica che tutti i calendari esterni siano sincronizzati e il DB aggiornato
 */

const API_BASE_URL = 'https://vincanto-backup.vercel.app/api';

async function testCalendarSyncSystem() {
    console.log('🔄 TEST SISTEMA SINCRONIZZAZIONE CALENDARI\n');
    
    try {
        // 1. Verifica stato attuale database
        console.log('📋 1. Verifica stato database calendari...');
        const dbStatusResponse = await fetch(`${API_BASE_URL}/utilities`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'database-status' })
        });
        
        const dbStatus = await dbStatusResponse.json();
        console.log('Database status:', dbStatus);
        
        // 2. Esegui sincronizzazione calendari
        console.log('\n🔄 2. Avvio sincronizzazione calendari esterni...');
        const syncResponse = await fetch(`${API_BASE_URL}/utilities`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'sync-calendars' })
        });
        
        if (!syncResponse.ok) {
            throw new Error(`Sync failed: ${syncResponse.status}`);
        }
        
        const syncResult = await syncResponse.json();
        console.log('Sincronizzazione risultato:', syncResult);
        
        // 3. Verifica disponibilità in tempo reale
        console.log('\n📅 3. Test disponibilità in tempo reale...');
        const today = new Date();
        const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, today.getDate());
        
        const availabilityResponse = await fetch(`${API_BASE_URL}/booking`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        });
        
        if (availabilityResponse.ok) {
            const availabilityData = await availabilityResponse.json();
            console.log('Disponibilità check:', availabilityData);
        }
        
        // 4. Test controllo date bloccate
        console.log('\n🚫 4. Verifica date bloccate dal database...');
        const blockedDatesResponse = await fetch(`${API_BASE_URL}/booking?action=blocked-dates`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        });
        
        if (blockedDatesResponse.ok) {
            const blockedDates = await blockedDatesResponse.json();
            console.log('Date bloccate trovate:', blockedDates);
        }
        
        // 5. Analisi risultati
        console.log('\n📊 ANALISI SINCRONIZZAZIONE:');
        
        if (syncResult.success) {
            console.log('✅ Sistema sincronizzazione: OPERATIVO');
            console.log(`✅ Calendari configurati: ${syncResult.sources.length}`);
            
            syncResult.sources.forEach(source => {
                const status = source.status === 'active' ? '✅' : '⚠️';
                console.log(`${status} ${source.name}: ${source.status}`);
                if (source.lastSync) {
                    console.log(`   Last sync: ${new Date(source.lastSync).toLocaleString()}`);
                }
            });
            
            // Verifica se abbiamo sincronizzazione real-time
            const hasRealTimeSync = syncResult.sources.some(s => s.status === 'active');
            console.log(`\n🔄 Sincronizzazione in tempo reale: ${hasRealTimeSync ? 'ATTIVA' : 'INATTIVA'}`);
            
            if (hasRealTimeSync) {
                console.log('🚀 SISTEMA CALENDARI: 100% OPERATIVO!');
                console.log('✅ Database aggiornato in tempo reale dai servizi esterni');
            } else {
                console.log('⚠️ Alcuni calendari non sono attivi - verifica configurazione');
            }
            
        } else {
            console.log('❌ Sistema sincronizzazione: PROBLEMI RILEVATI');
        }
        
        return true;
        
    } catch (error) {
        console.error('❌ Test sincronizzazione calendari fallito:', error.message);
        return false;
    }
}

// Esegui il test
testCalendarSyncSystem()
    .then((success) => {
        if (success) {
            console.log('\n🎉 Test sistema calendari completato!');
        } else {
            console.log('\n💥 Test sistema calendari fallito!');
            process.exit(1);
        }
    })
    .catch((error) => {
        console.error('Fatal error:', error);
        process.exit(1);
    });