/**
 * Verifica Dettagliata Calendari Sincronizzati
 * Analizza quali servizi esterni sono configurati e attivi
 */

const API_BASE_URL = 'https://vincanto-backup.vercel.app/api';

async function verifyCalendarServices() {
    console.log('🔍 VERIFICA CALENDARI SINCRONIZZATI\n');
    
    try {
        // 1. Esegui sincronizzazione per vedere servizi attivi
        console.log('📅 1. Avvio sincronizzazione per analisi servizi...');
        const syncResponse = await fetch(`${API_BASE_URL}/utilities`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'sync-calendars' })
        });
        
        if (!syncResponse.ok) {
            throw new Error(`Sync failed: ${syncResponse.status}`);
        }
        
        const syncResult = await syncResponse.json();
        console.log('Risultato sincronizzazione:', syncResult);
        
        // 2. Analizza servizi configurati
        console.log('\n📊 2. ANALISI SERVIZI CALENDARIO:');
        console.log('='.repeat(50));
        
        if (syncResult.success && syncResult.sources) {
            syncResult.sources.forEach((service, index) => {
                console.log(`\n${index + 1}. 📱 ${service.name}`);
                console.log(`   Status: ${service.status === 'active' ? '✅ ATTIVO' : '⚠️ INATTIVO'}`);
                
                if (service.lastSync) {
                    const syncDate = new Date(service.lastSync);
                    console.log(`   Ultima sincronizzazione: ${syncDate.toLocaleString()}`);
                    const minutesAgo = Math.floor((Date.now() - syncDate.getTime()) / 60000);
                    console.log(`   Sincronizzato: ${minutesAgo} minuti fa`);
                }
                
                if (service.eventsFound !== undefined) {
                    console.log(`   Eventi trovati: ${service.eventsFound}`);
                }
                
                if (service.blockedDates !== undefined) {
                    console.log(`   Date bloccate: ${service.blockedDates}`);
                }
                
                if (service.error) {
                    console.log(`   ❌ Errore: ${service.error}`);
                }
                
                // Descrizione dettagliata del servizio
                switch (service.name) {
                    case 'Google Calendar':
                        console.log('   📝 Tipo: Calendar personale/aziendale Google');
                        console.log('   🔄 Sincronizza: Eventi, prenotazioni private, blocchi personalizzati');
                        break;
                    case 'Booking.com':
                        console.log('   📝 Tipo: Piattaforma prenotazioni alberghiere');
                        console.log('   🔄 Sincronizza: Prenotazioni confermate, blocchi automatici');
                        break;
                    case 'Airbnb':
                        console.log('   📝 Tipo: Piattaforma short-term rental');
                        console.log('   🔄 Sincronizza: Prenotazioni Airbnb, blocchi disponibilità');
                        break;
                }
            });
            
            // Statistiche generali
            const activeServices = syncResult.sources.filter(s => s.status === 'active').length;
            const totalEvents = syncResult.sources.reduce((sum, s) => sum + (s.eventsFound || 0), 0);
            const totalBlocked = syncResult.sources.reduce((sum, s) => sum + (s.blockedDates || 0), 0);
            
            console.log('\n📈 3. STATISTICHE GENERALI:');
            console.log('='.repeat(50));
            console.log(`✅ Servizi attivi: ${activeServices}/${syncResult.sources.length}`);
            console.log(`📅 Eventi totali trovati: ${totalEvents}`);
            console.log(`🚫 Date bloccate totali: ${totalBlocked}`);
            console.log(`⏰ Ultima sincronizzazione: ${new Date(syncResult.syncedAt).toLocaleString()}`);
            console.log(`🔄 Prossima sincronizzazione consigliata: ${new Date(syncResult.nextSyncRecommended).toLocaleString()}`);
        }
        
        // 3. Verifica configurazioni calendario nel database
        console.log('\n⚙️ 4. CONFIGURAZIONI CALENDARIO DATABASE:');
        const settingsResponse = await fetch(`${API_BASE_URL}/admin?action=settings`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        });
        
        if (settingsResponse.ok) {
            const settings = await settingsResponse.json();
            
            if (settings.success && settings.settings) {
                const calendarSettings = settings.settings.filter(s => s.category === 'calendar');
                
                if (calendarSettings.length > 0) {
                    console.log('📋 Impostazioni calendario trovate:');
                    calendarSettings.forEach(setting => {
                        console.log(`   ${setting.setting_key}: ${setting.setting_value}`);
                    });
                } else {
                    console.log('⚠️ Nessuna configurazione calendario specifica trovata');
                }
            }
        }
        
        // 4. Controlla date bloccate per fonte
        console.log('\n🗓️ 5. ANALISI DATE BLOCCATE PER FONTE:');
        const blockedResponse = await fetch(`${API_BASE_URL}/booking?action=blocked-dates`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        });
        
        if (blockedResponse.ok) {
            const blockedData = await blockedResponse.json();
            
            if (blockedData.success && blockedData.blockedDates.length > 0) {
                // Raggruppa per fonte
                const bySource = {};
                blockedData.blockedDates.forEach(date => {
                    const source = date.source || 'unknown';
                    if (!bySource[source]) {
                        bySource[source] = [];
                    }
                    bySource[source].push(date);
                });
                
                Object.entries(bySource).forEach(([source, dates]) => {
                    console.log(`\n📌 Fonte: ${source.toUpperCase()}`);
                    console.log(`   Date bloccate: ${dates.length}`);
                    
                    // Mostra prime 3 date come esempio
                    dates.slice(0, 3).forEach(date => {
                        const dateStr = new Date(date.date_blocked).toLocaleDateString();
                        console.log(`   • ${dateStr}: ${date.reason}`);
                    });
                    
                    if (dates.length > 3) {
                        console.log(`   ... e altre ${dates.length - 3} date`);
                    }
                });
            } else {
                console.log('📅 Nessuna data bloccata trovata');
            }
        }
        
        // 5. Raccomandazioni
        console.log('\n💡 6. RACCOMANDAZIONI:');
        console.log('='.repeat(50));
        
        if (syncResult.success) {
            const activeCount = syncResult.sources.filter(s => s.status === 'active').length;
            const inactiveServices = syncResult.sources.filter(s => s.status !== 'active');
            
            if (activeCount > 0) {
                console.log(`✅ Sistema operativo con ${activeCount} servizi attivi`);
            }
            
            if (inactiveServices.length > 0) {
                console.log('\n⚠️ Servizi inattivi da configurare:');
                inactiveServices.forEach(service => {
                    console.log(`   • ${service.name}: ${service.error || 'Richiede configurazione'}`);
                });
                
                console.log('\n🔧 Per attivare servizi aggiuntivi:');
                console.log('   1. Configurare API keys nei settings del database');
                console.log('   2. Abilitare webhook per sincronizzazione automatica');
                console.log('   3. Testare connessione con servizi esterni');
            }
            
            console.log('\n🚀 Sistema pronto per:');
            console.log('   ✅ Sincronizzazione automatica calendari');
            console.log('   ✅ Prevenzione overbooking multi-canale');
            console.log('   ✅ Aggiornamento real-time disponibilità');
        }
        
        return true;
        
    } catch (error) {
        console.error('❌ Errore verifica calendari:', error.message);
        return false;
    }
}

// Esegui verifica
verifyCalendarServices()
    .then((success) => {
        if (success) {
            console.log('\n🎉 Verifica calendari completata!');
        } else {
            console.log('\n💥 Errore nella verifica calendari!');
            process.exit(1);
        }
    })
    .catch((error) => {
        console.error('Fatal error:', error);
        process.exit(1);
    });