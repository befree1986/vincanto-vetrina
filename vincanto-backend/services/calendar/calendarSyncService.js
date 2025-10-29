/**
 * Calendar Sync Service - Anti-Overbooking System
 * Gestisce sincronizzazione con calendari esterni per prevenire sovrapprenotazioni
 */

const axios = require('axios');
const ical = require('node-ical');
const icalGenerator = require('ical-generator').default;
const moment = require('moment-timezone');
const { Op } = require('sequelize');

class CalendarSyncService {
    constructor() {
        this.timezone = 'Europe/Rome';
        moment.tz.setDefault(this.timezone);
        this.syncSources = new Map();
        console.log('📅 Calendar Sync Service inizializzato');
    }

    /**
     * Registra una sorgente di calendario esterno
     */
    registerExternalCalendar(source) {
        const { id, name, type, url, credentials, active = true } = source;
        
        this.syncSources.set(id, {
            id,
            name,
            type, // 'ical', 'airbnb', 'booking', 'google'
            url,
            credentials,
            active,
            lastSync: null,
            syncInterval: 3600000, // 1 ora in ms
            errorCount: 0
        });
        
        console.log(`✅ Sorgente calendario registrata: ${name} (${type})`);
        return true;
    }

    /**
     * Scarica e parsa calendario iCal da URL
     */
    async fetchICalData(url) {
        try {
            console.log(`📥 Downloading iCal from: ${url}`);
            
            const response = await axios.get(url, {
                timeout: 30000,
                headers: {
                    'User-Agent': 'Vincanto Calendar Sync/2.0'
                }
            });

            if (!response.data) {
                throw new Error('Empty iCal response');
            }

            const events = ical.parseICS(response.data);
            const parsedEvents = [];

            for (const event of Object.values(events)) {
                if (event.type === 'VEVENT') {
                    // Convertiamo evento in formato standard
                    const standardEvent = this.parseICalEvent(event);
                    if (standardEvent) {
                        parsedEvents.push(standardEvent);
                    }
                }
            }

            console.log(`✅ Parsed ${parsedEvents.length} events from iCal`);
            return parsedEvents;

        } catch (error) {
            console.error('❌ Errore download iCal:', error.message);
            throw error;
        }
    }

    /**
     * Converte evento iCal in formato standard Vincanto
     */
    parseICalEvent(event) {
        try {
            if (!event.start || !event.end) {
                return null;
            }

            const startDate = moment(event.start).tz(this.timezone);
            const endDate = moment(event.end).tz(this.timezone);

            // Skip eventi nel passato (più vecchi di 30 giorni)
            if (startDate.isBefore(moment().subtract(30, 'days'))) {
                return null;
            }

            return {
                external_id: event.uid || `import-${Date.now()}-${Math.random()}`,
                title: event.summary || 'Blocco Esterno',
                start_date: startDate.format('YYYY-MM-DD'),
                end_date: endDate.format('YYYY-MM-DD'),
                start_time: startDate.format('HH:mm:ss'),
                end_time: endDate.format('HH:mm:ss'),
                all_day: !event.start.getHours && !event.end.getHours,
                source: 'external_import',
                status: 'blocked', // Blocca sempre le date importate
                description: event.description || 'Prenotazione da calendario esterno',
                created_at: moment().toISOString(),
                updated_at: moment().toISOString()
            };

        } catch (error) {
            console.error('❌ Errore parsing evento iCal:', error);
            return null;
        }
    }

    /**
     * Sostituisce variabili nei template
     */
    replaceTemplateVariables(template, variables) {
        let processedTemplate = template;
        
        for (const [key, value] of Object.entries(variables)) {
            const regex = new RegExp(`{{${key}}}`, 'g');
            processedTemplate = processedTemplate.replace(regex, value || '');
        }
        
        return processedTemplate;
    }

    /**
     * Sincronizza tutti i calendari esterni attivi
     */
    async syncAllExternalCalendars(forceSync = false) {
        console.log('🔄 Avvio sincronizzazione calendari esterni...');
        
        const syncResults = {
            total: 0,
            success: 0,
            errors: 0,
            imported: 0,
            updated: 0,
            blocked: 0,
            details: []
        };

        for (const [sourceId, source] of this.syncSources.entries()) {
            if (!source.active) {
                continue;
            }

            // Check se necessario sync (basato su intervallo)
            const needsSync = forceSync || 
                !source.lastSync || 
                (Date.now() - source.lastSync) > source.syncInterval;

            if (!needsSync) {
                console.log(`⏭️  Skip ${source.name} - sync recente`);
                continue;
            }

            syncResults.total++;

            try {
                const result = await this.syncSingleCalendar(sourceId);
                syncResults.success++;
                syncResults.imported += result.imported;
                syncResults.updated += result.updated;
                syncResults.blocked += result.blocked;
                syncResults.details.push({
                    source: source.name,
                    status: 'success',
                    ...result
                });

                // Update last sync time
                source.lastSync = Date.now();
                source.errorCount = 0;

            } catch (error) {
                console.error(`❌ Errore sync ${source.name}:`, error.message);
                syncResults.errors++;
                source.errorCount++;
                
                syncResults.details.push({
                    source: source.name,
                    status: 'error',
                    error: error.message
                });

                // Disable source dopo 5 errori consecutivi
                if (source.errorCount >= 5) {
                    source.active = false;
                    console.log(`⚠️  Sorgente ${source.name} disabilitata per troppi errori`);
                }
            }
        }

        console.log(`✅ Sync completato: ${syncResults.success}/${syncResults.total} sorgenti`);
        return syncResults;
    }

    /**
     * Sincronizza singolo calendario
     */
    async syncSingleCalendar(sourceId) {
        const source = this.syncSources.get(sourceId);
        if (!source) {
            throw new Error(`Sorgente ${sourceId} non trovata`);
        }

        console.log(`🔄 Syncing ${source.name}...`);

        let events = [];
        
        switch (source.type) {
            case 'ical':
                events = await this.fetchICalData(source.url);
                break;
                
            case 'airbnb':
                events = await this.syncAirbnbCalendar(source);
                break;
                
            case 'booking':
                events = await this.syncBookingCalendar(source);
                break;
                
            default:
                throw new Error(`Tipo calendario non supportato: ${source.type}`);
        }

        // Importa eventi nel database
        return await this.importEventsToDatabase(events, source);
    }

    /**
     * Sincronizzazione specifica Airbnb
     */
    async syncAirbnbCalendar(source) {
        // Airbnb fornisce URL iCal, quindi usiamo lo stesso metodo
        if (!source.url) {
            throw new Error('URL Airbnb iCal mancante');
        }
        return await this.fetchICalData(source.url);
    }

    /**
     * Sincronizzazione specifica Booking.com  
     */
    async syncBookingCalendar(source) {
        // Booking.com fornisce URL iCal, quindi usiamo lo stesso metodo
        if (!source.url) {
            throw new Error('URL Booking.com iCal mancante');
        }
        return await this.fetchICalData(source.url);
    }

    /**
     * Importa eventi nel database
     */
    async importEventsToDatabase(events, source) {
        const { Calendar } = require('../../models');
        
        const result = {
            imported: 0,
            updated: 0,
            blocked: 0,
            skipped: 0
        };

        for (const event of events) {
            try {
                // Check se evento già esiste (per external_id o date range)
                const existing = await Calendar.findOne({
                    where: {
                        [Op.or]: [
                            { external_id: event.external_id },
                            {
                                [Op.and]: [
                                    { start_date: event.start_date },
                                    { end_date: event.end_date },
                                    { source: source.type }
                                ]
                            }
                        ]
                    }
                });

                // Aggiungi metadata sorgente
                const eventData = {
                    ...event,
                    source: source.type,
                    source_name: source.name,
                    source_id: source.id,
                    sync_date: moment().toISOString()
                };

                if (existing) {
                    // Update evento esistente
                    await existing.update(eventData);
                    result.updated++;
                    console.log(`📝 Updated: ${event.title} (${event.start_date})`);
                } else {
                    // Crea nuovo evento  
                    await Calendar.create(eventData);
                    result.imported++;
                    console.log(`➕ Imported: ${event.title} (${event.start_date})`);
                }

                // Conta blocchi (eventi che bloccano disponibilità)
                if (event.status === 'blocked') {
                    result.blocked++;
                }

            } catch (error) {
                console.error(`❌ Errore import evento ${event.title}:`, error.message);
                result.skipped++;
            }
        }

        console.log(`📊 Import ${source.name}: +${result.imported} new, ~${result.updated} updated, ↪️${result.skipped} skipped`);
        return result;
    }

    /**
     * Genera calendario iCal per export
     */
    async generateICalExport(options = {}) {
        const { Calendar } = require('../../models');
        
        const {
            includeBlocked = false,
            includePending = true,
            includeConfirmed = true,
            dateRange = { start: moment(), end: moment().add(2, 'years') }
        } = options;

        // Query eventi dal database
        const whereConditions = {
            start_date: {
                [Op.between]: [
                    dateRange.start.format('YYYY-MM-DD'),
                    dateRange.end.format('YYYY-MM-DD')
                ]
            }
        };

        if (!includeBlocked) {
            whereConditions.status = { [Op.ne]: 'blocked' };
        }

        const events = await Calendar.findAll({
            where: whereConditions,
            order: [['start_date', 'ASC']]
        });

        // Crea calendario iCal
        const calendar = icalGenerator({
            name: 'Vincanto Maori - Calendario Prenotazioni',
            description: 'Calendario delle prenotazioni Vincanto Maori',
            timezone: this.timezone,
            url: 'https://www.vincantomaori.it',
            ttl: 3600 // Cache 1 ora
        });

        // Aggiungi eventi
        for (const event of events) {
            const startDateTime = moment.tz(
                `${event.start_date} ${event.start_time || '00:00:00'}`,
                'YYYY-MM-DD HH:mm:ss',
                this.timezone
            );

            const endDateTime = moment.tz(
                `${event.end_date} ${event.end_time || '23:59:59'}`,
                'YYYY-MM-DD HH:mm:ss', 
                this.timezone
            );

            calendar.createEvent({
                uid: event.external_id || `vincanto-${event.id}`,
                start: startDateTime.toDate(),
                end: endDateTime.toDate(),
                summary: event.title,
                description: event.description,
                status: event.status === 'confirmed' ? 'CONFIRMED' : 'TENTATIVE',
                created: new Date(event.created_at),
                lastModified: new Date(event.updated_at)
            });
        }

        console.log(`📤 Generated iCal with ${events.length} events`);
        return calendar.toString();
    }

    /**
     * Check conflitti di date
     */
    async checkDateConflicts(startDate, endDate, excludeId = null) {
        const { Calendar } = require('../../models');

        const conflicts = await Calendar.findAll({
            where: {
                [Op.and]: [
                    excludeId ? { id: { [Op.ne]: excludeId } } : {},
                    {
                        [Op.or]: [
                            // Overlapping dates
                            {
                                [Op.and]: [
                                    { start_date: { [Op.lte]: endDate } },
                                    { end_date: { [Op.gte]: startDate } }
                                ]
                            }
                        ]
                    },
                    { status: { [Op.in]: ['confirmed', 'blocked'] } }
                ]
            }
        });

        return conflicts.map(conflict => ({
            id: conflict.id,
            title: conflict.title,
            start_date: conflict.start_date,
            end_date: conflict.end_date,
            status: conflict.status,
            source: conflict.source
        }));
    }

    /**
     * Blocca date specifiche (per manutenzione, etc.)
     */
    async blockDates(dateRanges, reason = 'Blocco manuale') {
        const { Calendar } = require('../../models');
        const blocked = [];

        for (const range of dateRanges) {
            const blockEvent = {
                title: reason,
                start_date: range.startDate,
                end_date: range.endDate,
                status: 'blocked',
                source: 'manual',
                description: `Blocco inserito manualmente: ${reason}`,
                external_id: `manual-block-${Date.now()}-${Math.random()}`,
                created_at: moment().toISOString(),
                updated_at: moment().toISOString()
            };

            const created = await Calendar.create(blockEvent);
            blocked.push(created);
            console.log(`🚫 Bloccate date: ${range.startDate} - ${range.endDate}`);
        }

        return blocked;
    }

    /**
     * Ottieni statistiche sincronizzazione
     */
    getSyncStats() {
        const stats = {
            sources: {
                total: this.syncSources.size,
                active: 0,
                inactive: 0,
                errors: 0
            },
            lastSync: null,
            sources_detail: []
        };

        let latestSync = 0;

        for (const [id, source] of this.syncSources.entries()) {
            if (source.active) {
                stats.sources.active++;
            } else {
                stats.sources.inactive++;
            }

            if (source.errorCount > 0) {
                stats.sources.errors++;
            }

            if (source.lastSync && source.lastSync > latestSync) {
                latestSync = source.lastSync;
            }

            stats.sources_detail.push({
                id,
                name: source.name,
                type: source.type,
                active: source.active,
                lastSync: source.lastSync ? new Date(source.lastSync).toISOString() : null,
                errorCount: source.errorCount
            });
        }

        if (latestSync > 0) {
            stats.lastSync = new Date(latestSync).toISOString();
        }

        return stats;
    }
}

module.exports = new CalendarSyncService();