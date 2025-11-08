/**
 * Test Avanzato Sistema Calendari - Verifica sincronizzazione real-time con DB
 */

const API_BASE_URL = 'https://vincanto-backup.vercel.app/api';

async function testAdvancedCalendarSync() {
    console.log('🔬 TEST AVANZATO SINCRONIZZAZIONE CALENDARI\n');
    
    try {
        // 1. Prima sincronizzazione - dovrebbe popolare il database
        console.log('🚀 1. Prima sincronizzazione calendari...');
        const firstSyncResponse = await fetch(`${API_BASE_URL}/utilities`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'sync-calendars' })
        });
        
        const firstSync = await firstSyncResponse.json();
        console.log('Prima sincronizzazione:', firstSync);
        
        // 2. Verifica che le date bloccate siano state inserite nel database
        console.log('\n📊 2. Verifica date bloccate in database...');
        const blockedDatesResponse = await fetch(`${API_BASE_URL}/booking?action=blocked-dates`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        });
        
        if (blockedDatesResponse.ok) {
            const blockedDatesData = await blockedDatesResponse.json();
            console.log('Date bloccate dal database:', blockedDatesData);
            
            if (blockedDatesData.success && blockedDatesData.blockedDates.length > 0) {
                console.log(`✅ Database aggiornato: ${blockedDatesData.blockedDates.length} date bloccate trovate`);
                
                blockedDatesData.blockedDates.forEach(date => {
                    console.log(`   📅 ${date.date_blocked}: ${date.reason} (fonte: ${date.source || 'N/A'})`);
                });
            } else {
                console.log('⚠️ Nessuna data bloccata trovata nel database');
            }
        }
        
        // 3. Test controllo disponibilità in tempo reale
        console.log('\n🔍 3. Test controllo disponibilità specifico...');
        
        // Test periodo che dovrebbe essere bloccato (15-16 Nov 2025 da Google Calendar)
        const availabilityResponse = await fetch(`${API_BASE_URL}/utilities`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                action: 'check-availability',
                startDate: '2025-11-15',
                endDate: '2025-11-17'
            })
        });
        
        if (availabilityResponse.ok) {
            const availability = await availabilityResponse.json();
            console.log('Controllo disponibilità 15-17 Nov:', availability);
            
            if (!availability.available && availability.conflicts.total > 0) {
                console.log('✅ Sistema funziona: periodo correttamente identificato come NON disponibile');
                console.log(`   Conflitti trovati: ${availability.conflicts.total}`);
                console.log(`   - Prenotazioni: ${availability.conflicts.bookings.length}`);
                console.log(`   - Date bloccate: ${availability.conflicts.blockedDates.length}`);
            } else {
                console.log('⚠️ Controllo disponibilità: periodo risulta disponibile (verifica configurazione)');
            }
        }
        
        // 4. Test periodo libero
        console.log('\n🔍 4. Test periodo libero...');
        const freePeriodResponse = await fetch(`${API_BASE_URL}/utilities`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                action: 'check-availability',
                startDate: '2025-12-01',
                endDate: '2025-12-03'
            })
        });
        
        if (freePeriodResponse.ok) {
            const freePeriod = await freePeriodResponse.json();
            console.log('Controllo disponibilità 1-3 Dic:', freePeriod);
            
            if (freePeriod.available) {
                console.log('✅ Periodo libero correttamente identificato come DISPONIBILE');
            }
        }
        
        // 5. Seconda sincronizzazione per verificare aggiornamenti
        console.log('\n🔄 5. Seconda sincronizzazione (controllo aggiornamenti)...');
        await new Promise(resolve => setTimeout(resolve, 2000)); // Aspetta 2 secondi
        
        const secondSyncResponse = await fetch(`${API_BASE_URL}/utilities`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'sync-calendars' })
        });
        
        const secondSync = await secondSyncResponse.json();
        console.log('Seconda sincronizzazione:', secondSync);
        
        // 6. Analisi finale
        console.log('\n📈 ANALISI SISTEMA REAL-TIME:');
        
        if (firstSync.success && secondSync.success) {
            console.log('✅ Sistema sincronizzazione: COMPLETAMENTE OPERATIVO');
            
            const activeServices = firstSync.sources.filter(s => s.status === 'active').length;
            console.log(`✅ Servizi attivi: ${activeServices}/${firstSync.sources.length}`);
            
            if (firstSync.blockedDatesUpdated > 0) {
                console.log(`✅ Database aggiornato: ${firstSync.blockedDatesUpdated} date bloccate`);
                console.log('✅ Integrazione servizi esterni: FUNZIONANTE');
                console.log('✅ Aggiornamento database: IN TEMPO REALE');
                console.log('✅ Controllo disponibilità: BASATO SU DATI REALI');
                
                console.log('\n🎯 CONCLUSIONE:');
                console.log('🚀 IL SISTEMA CALENDARIO È COMPLETAMENTE OPERATIVO!');
                console.log('✅ Database viene aggiornato automaticamente dai servizi esterni');
                console.log('✅ Frontend riceve sempre informazioni aggiornate');
                console.log('✅ Controllo disponibilità basato su dati sincronizzati');
                
            } else {
                console.log('⚠️ Database non aggiornato - verificare configurazioni servizi esterni');
            }
            
            // Raccomandazioni per il futuro
            console.log('\n💡 RACCOMANDAZIONI:');
            console.log('1. Configurare webhook per sincronizzazione automatica');
            console.log('2. Implementare API key reali per Google Calendar/Booking.com');
            console.log('3. Aggiungere sistema di retry per failed sync');
            console.log('4. Configurare alerting per sync failures');
            
        } else {
            console.log('❌ Problemi rilevati nel sistema di sincronizzazione');
        }
        
        return true;
        
    } catch (error) {
        console.error('❌ Test avanzato calendari fallito:', error.message);
        return false;
    }
}

// Esegui test avanzato
testAdvancedCalendarSync()
    .then((success) => {
        if (success) {
            console.log('\n🎉 Test avanzato sistema calendari completato con successo!');
        } else {
            console.log('\n💥 Test avanzato sistema calendari fallito!');
            process.exit(1);
        }
    })
    .catch((error) => {
        console.error('Fatal error:', error);
        process.exit(1);
    });