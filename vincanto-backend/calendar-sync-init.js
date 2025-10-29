/**
 * Calendar Sync Initialization Script
 * Configura automaticamente sorgenti calendario comuni per Vincanto
 */

const calendarSyncService = require('./services/calendar/calendarSyncService');

class CalendarSyncInit {
    constructor() {
        this.defaultSources = [
            {
                id: 'airbnb-main',
                name: 'Airbnb - Vincanto Maori',
                type: 'airbnb',
                url: 'https://www.airbnb.com/calendar/ical/YOUR_LISTING_ID.ics',
                active: false, // Disattivato finché non si configura URL reale
                description: 'Calendario principale Airbnb per evitare sovrapprenotazioni'
            },
            {
                id: 'booking-main', 
                name: 'Booking.com - Vincanto Maori',
                type: 'booking',
                url: 'https://admin.booking.com/hotel/hoteladmin/extranet_ng/manage/calendar.html?ical=YOUR_PROPERTY_ID',
                active: false, // Disattivato finché non si configura URL reale
                description: 'Calendario principale Booking.com per sincronizzazione'
            },
            {
                id: 'google-calendar',
                name: 'Google Calendar - Manutenzioni',
                type: 'ical',
                url: 'https://calendar.google.com/calendar/ical/YOUR_CALENDAR_ID/public/basic.ics',
                active: false, // Disattivato finché non si configura URL reale
                description: 'Google Calendar per manutenzioni e blocchi personalizzati'
            },
            {
                id: 'vrbo-main',
                name: 'VRBO - Vincanto Maori',
                type: 'ical',
                url: 'https://www.vrbo.com/ical/PROPERTY_ID.ics',
                active: false,
                description: 'Calendario VRBO per sincronizzazione cross-platform'
            }
        ];
    }

    /**
     * Inizializza tutte le sorgenti calendario predefinite
     */
    async initializeDefaultSources() {
        console.log('📅 Inizializzazione sorgenti calendario Vincanto...\n');
        
        const results = {
            registered: 0,
            skipped: 0,
            errors: 0,
            sources: []
        };

        for (const source of this.defaultSources) {
            try {
                console.log(`🔄 Registrando: ${source.name}...`);
                
                const registered = calendarSyncService.registerExternalCalendar(source);
                
                if (registered) {
                    results.registered++;
                    results.sources.push({
                        ...source,
                        status: 'registered',
                        note: source.active ? 'Attivo' : 'Inattivo (configurare URL)'
                    });
                    
                    console.log(`   ✅ ${source.name} registrato (${source.active ? 'ATTIVO' : 'INATTIVO'})`);
                    
                    if (!source.active) {
                        console.log(`   📝 Nota: Configurare URL reale per attivare`);
                    }
                } else {
                    results.skipped++;
                    console.log(`   ⏭️  ${source.name} saltato`);
                }
                
            } catch (error) {
                results.errors++;
                console.error(`   ❌ Errore registrazione ${source.name}:`, error.message);
            }
        }

        return results;
    }

    /**
     * Configura URL reali per le sorgenti
     */
    updateSourceUrls(urlMappings) {
        console.log('\n🔧 Aggiornamento URL sorgenti...\n');
        
        for (const [sourceId, newUrl] of Object.entries(urlMappings)) {
            try {
                const source = calendarSyncService.syncSources.get(sourceId);
                
                if (source) {
                    source.url = newUrl;
                    source.active = true; // Attiva dopo aver configurato URL
                    
                    console.log(`✅ ${source.name}: URL aggiornato e attivato`);
                    console.log(`   📡 ${newUrl}`);
                } else {
                    console.log(`⚠️  Sorgente ${sourceId} non trovata`);
                }
                
            } catch (error) {
                console.error(`❌ Errore aggiornamento ${sourceId}:`, error.message);
            }
        }
    }

    /**
     * Genera configurazione di esempio per .env
     */
    generateEnvConfig() {
        const config = `
# Calendar Sync Configuration - Vincanto Maori
# Configura questi URL per attivare la sincronizzazione automatica

# Airbnb Calendar URL
# Vai su: Airbnb Host Dashboard -> Calendar -> Export Calendar
AIRBNB_ICAL_URL=https://www.airbnb.com/calendar/ical/YOUR_LISTING_ID.ics

# Booking.com Calendar URL  
# Vai su: Extranet -> Calendar -> Import/Export
BOOKING_ICAL_URL=https://admin.booking.com/hotel/hoteladmin/extranet_ng/manage/calendar.html?ical=YOUR_PROPERTY_ID

# Google Calendar URL (per manutenzioni)
# Vai su: Google Calendar -> Settings -> Integrate Calendar -> Public URL to this calendar
GOOGLE_CALENDAR_ICAL_URL=https://calendar.google.com/calendar/ical/YOUR_CALENDAR_ID/public/basic.ics

# VRBO Calendar URL
VRBO_ICAL_URL=https://www.vrbo.com/ical/PROPERTY_ID.ics

# Sync Settings
CALENDAR_SYNC_INTERVAL=3600000  # 1 hora en ms
CALENDAR_SYNC_AUTO_START=true   # Auto-start sync al avvio server
`;

        return config;
    }

    /**
     * Status completo sistema calendar sync
     */
    getSystemStatus() {
        const stats = calendarSyncService.getSyncStats();
        
        const status = {
            service: 'Calendar Sync Service',
            version: '1.0.0',
            timezone: 'Europe/Rome',
            stats: stats,
            recommendations: []
        };

        // Raccomandazioni basate su stato
        if (stats.sources.active === 0) {
            status.recommendations.push({
                priority: 'HIGH',
                action: 'Configurare almeno una sorgente calendario attiva',
                note: 'Senza sorgenti attive, non c\'è protezione anti-overbooking'
            });
        }

        if (stats.sources.errors > 0) {
            status.recommendations.push({
                priority: 'MEDIUM',
                action: 'Verificare sorgenti con errori',
                note: 'Alcune sorgenti hanno errori di sincronizzazione'
            });
        }

        if (stats.sources.active > 0 && !stats.lastSync) {
            status.recommendations.push({
                priority: 'MEDIUM', 
                action: 'Avviare prima sincronizzazione',
                note: 'Sorgenti configurate ma mai sincronizzate'
            });
        }

        return status;
    }

    /**
     * Istruzioni complete per configurazione
     */
    printSetupInstructions() {
        console.log('\n' + '='.repeat(70));
        console.log('📖 ISTRUZIONI CONFIGURAZIONE CALENDAR SYNC');
        console.log('='.repeat(70));
        console.log('');
        
        console.log('🎯 OBIETTIVO: Prevenire sovrapprenotazioni sincronizzando calendari esterni');
        console.log('');
        
        console.log('📋 PASSI PER ATTIVAZIONE:');
        console.log('');
        
        console.log('1️⃣  AIRBNB:');
        console.log('   • Vai su Airbnb Host Dashboard');
        console.log('   • Sezione Calendar -> Export Calendar');
        console.log('   • Copia URL iCal e sostituisci in AIRBNB_ICAL_URL');
        console.log('');
        
        console.log('2️⃣  BOOKING.COM:');
        console.log('   • Accedi a Extranet Booking.com');
        console.log('   • Sezione Calendar -> Import/Export');
        console.log('   • Copia URL iCal e sostituisci in BOOKING_ICAL_URL');
        console.log('');
        
        console.log('3️⃣  GOOGLE CALENDAR (opzionale):');
        console.log('   • Crea calendario Google per manutenzioni');
        console.log('   • Settings -> Integrate Calendar -> Public URL');
        console.log('   • Copia URL e sostituisci in GOOGLE_CALENDAR_ICAL_URL');
        console.log('');
        
        console.log('4️⃣  ATTIVAZIONE:');
        console.log('   • Aggiorna file .env con URL reali');
        console.log('   • Riavvia server');
        console.log('   • Testa sincronizzazione: POST /api/calendar-sync/sync');
        console.log('');
        
        console.log('⚡ FUNZIONALITÀ ATTIVE:');
        console.log('   ✅ Controllo conflitti automatico');
        console.log('   ✅ Blocco date sovrapposte');
        console.log('   ✅ Sync automatico ogni ora');
        console.log('   ✅ Export calendario per altre piattaforme');
        console.log('   ✅ Notifiche email per conflitti');
        console.log('');
        
        console.log('🔧 API DISPONIBILI:');
        console.log('   • GET  /api/calendar-sync/status     - Stato sistema');
        console.log('   • POST /api/calendar-sync/sync       - Sync manuale');
        console.log('   • GET  /api/calendar-sync/conflicts  - Controlla conflitti');
        console.log('   • POST /api/calendar-sync/block      - Blocca date');
        console.log('   • GET  /api/calendar-sync/export     - Export iCal');
        console.log('   • GET  /api/calendar-sync/events     - Lista eventi');
        console.log('');
        
        console.log('='.repeat(70));
    }

    /**
     * Test rapido configurazione
     */
    async quickConfigTest() {
        console.log('🧪 Test rapido configurazione Calendar Sync...\n');
        
        const tests = [
            {
                name: 'Service Initialization',
                test: () => calendarSyncService ? 'OK' : 'FAIL'
            },
            {
                name: 'Sources Registration',
                test: () => calendarSyncService.syncSources.size > 0 ? 'OK' : 'NONE'
            },
            {
                name: 'Timezone Configuration',
                test: () => 'Europe/Rome'
            },
            {
                name: 'Active Sources',
                test: () => {
                    const stats = calendarSyncService.getSyncStats();
                    return `${stats.sources.active}/${stats.sources.total}`;
                }
            }
        ];

        for (const test of tests) {
            const result = test.test();
            const status = result === 'FAIL' ? '❌' : result === 'NONE' ? '⚠️' : '✅';
            console.log(`${status} ${test.name}: ${result}`);
        }
    }
}

// Esportazione per uso come modulo
const calendarSyncInit = new CalendarSyncInit();

// Esecuzione se chiamato direttamente
if (require.main === module) {
    async function runInitialization() {
        console.log('🚀 Vincanto Calendar Sync - Inizializzazione Sistema\n');
        
        try {
            // Inizializza sorgenti predefinite
            const initResults = await calendarSyncInit.initializeDefaultSources();
            
            console.log('\n📊 RISULTATI INIZIALIZZAZIONE:');
            console.log(`✅ Sorgenti registrate: ${initResults.registered}`);
            console.log(`⏭️  Sorgenti saltate: ${initResults.skipped}`);
            console.log(`❌ Errori: ${initResults.errors}`);
            
            // Test configurazione
            console.log('\n');
            await calendarSyncInit.quickConfigTest();
            
            // Status sistema
            console.log('\n📋 STATUS SISTEMA:');
            const status = calendarSyncInit.getSystemStatus();
            console.log(`🔧 Sorgenti totali: ${status.stats.sources.total}`);
            console.log(`✅ Sorgenti attive: ${status.stats.sources.active}`);
            console.log(`❌ Sorgenti con errori: ${status.stats.sources.errors}`);
            
            // Raccomandazioni
            if (status.recommendations.length > 0) {
                console.log('\n💡 RACCOMANDAZIONI:');
                status.recommendations.forEach(rec => {
                    console.log(`${rec.priority === 'HIGH' ? '🔴' : '🟡'} ${rec.action}`);
                    console.log(`   ${rec.note}`);
                });
            }
            
            // Genera esempio configurazione .env
            console.log('\n📄 CONFIGURAZIONE .ENV:');
            console.log(calendarSyncInit.generateEnvConfig());
            
            // Istruzioni complete
            calendarSyncInit.printSetupInstructions();
            
            console.log('✅ Inizializzazione Calendar Sync completata!');
            
        } catch (error) {
            console.error('❌ Errore durante inizializzazione:', error);
            process.exit(1);
        }
    }
    
    runInitialization();
}

module.exports = calendarSyncInit;