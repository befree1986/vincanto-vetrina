const express = require('express');
const calendarSyncService = require('../services/calendar/calendarSyncService');
const { Calendar } = require('../models');
const { Op } = require('sequelize');
const moment = require('moment-timezone');
const router = express.Router();

// Configurazione timezone
moment.tz.setDefault('Europe/Rome');

// GET /api/calendar-sync/status - Stato del sistema di sincronizzazione
router.get('/status', async (req, res) => {
    try {
        const stats = calendarSyncService.getSyncStats();
        
        res.json({
            success: true,
            message: 'Calendar sync status',
            stats: stats,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('❌ Errore status calendar sync:', error);
        res.status(500).json({
            success: false,
            error: 'Errore recupero status',
            details: error.message
        });
    }
});

// POST /api/calendar-sync/sources - Registra sorgente calendario esterno
router.post('/sources', async (req, res) => {
    try {
        const { name, type, url, credentials, active = true } = req.body;
        
        if (!name || !type || !url) {
            return res.status(400).json({
                success: false,
                error: 'Dati obbligatori mancanti',
                required: ['name', 'type', 'url']
            });
        }

        const sourceId = `${type}-${Date.now()}`;
        
        const registered = calendarSyncService.registerExternalCalendar({
            id: sourceId,
            name,
            type,
            url,
            credentials,
            active
        });

        if (registered) {
            console.log(`✅ Sorgente calendario registrata: ${name}`);
            
            res.json({
                success: true,
                message: 'Sorgente calendario registrata',
                source: {
                    id: sourceId,
                    name,
                    type,
                    url,
                    active
                },
                timestamp: new Date().toISOString()
            });
        } else {
            throw new Error('Registrazione fallita');
        }
        
    } catch (error) {
        console.error('❌ Errore registrazione sorgente:', error);
        res.status(500).json({
            success: false,
            error: 'Errore registrazione sorgente',
            details: error.message
        });
    }
});

// POST /api/calendar-sync/sync - Avvia sincronizzazione manuale
router.post('/sync', async (req, res) => {
    try {
        const { forceSync = false, sourceId = null } = req.body;
        
        console.log('🔄 Avvio sincronizzazione calendari...');
        
        let syncResult;
        
        if (sourceId) {
            // Sync singola sorgente
            syncResult = await calendarSyncService.syncSingleCalendar(sourceId);
            syncResult.source = sourceId;
        } else {
            // Sync tutte le sorgenti
            syncResult = await calendarSyncService.syncAllExternalCalendars(forceSync);
        }
        
        res.json({
            success: true,
            message: 'Sincronizzazione completata',
            result: syncResult,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('❌ Errore sincronizzazione:', error);
        res.status(500).json({
            success: false,
            error: 'Errore sincronizzazione calendari',
            details: error.message
        });
    }
});

// GET /api/calendar-sync/conflicts - Controlla conflitti date
router.get('/conflicts', async (req, res) => {
    try {
        const { startDate, endDate, excludeId } = req.query;
        
        if (!startDate || !endDate) {
            return res.status(400).json({
                success: false,
                error: 'Date di inizio e fine richieste',
                format: 'YYYY-MM-DD'
            });
        }

        const conflicts = await calendarSyncService.checkDateConflicts(
            startDate,
            endDate,
            excludeId ? parseInt(excludeId) : null
        );
        
        res.json({
            success: true,
            message: `${conflicts.length} conflitti trovati`,
            conflicts: conflicts,
            dateRange: {
                startDate,
                endDate
            },
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('❌ Errore controllo conflitti:', error);
        res.status(500).json({
            success: false,
            error: 'Errore controllo conflitti',
            details: error.message
        });
    }
});

// POST /api/calendar-sync/block - Blocca date manualmente
router.post('/block', async (req, res) => {
    try {
        const { dateRanges, reason = 'Blocco manuale' } = req.body;
        
        if (!dateRanges || !Array.isArray(dateRanges)) {
            return res.status(400).json({
                success: false,
                error: 'Array di date ranges richiesto',
                format: '[{startDate: "YYYY-MM-DD", endDate: "YYYY-MM-DD"}]'
            });
        }

        const blocked = await calendarSyncService.blockDates(dateRanges, reason);
        
        res.json({
            success: true,
            message: `${blocked.length} periodi bloccati`,
            blocked: blocked.map(b => ({
                id: b.id,
                title: b.title,
                start_date: b.start_date,
                end_date: b.end_date,
                status: b.status
            })),
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('❌ Errore blocco date:', error);
        res.status(500).json({
            success: false,
            error: 'Errore blocco date',
            details: error.message
        });
    }
});

// GET /api/calendar-sync/export - Esporta calendario in formato iCal
router.get('/export', async (req, res) => {
    try {
        const {
            includeBlocked = 'false',
            includePending = 'true', 
            includeConfirmed = 'true',
            months = '24'
        } = req.query;

        const options = {
            includeBlocked: includeBlocked === 'true',
            includePending: includePending === 'true',
            includeConfirmed: includeConfirmed === 'true',
            dateRange: {
                start: moment(),
                end: moment().add(parseInt(months), 'months')
            }
        };

        const icalData = await calendarSyncService.generateICalExport(options);
        
        res.setHeader('Content-Type', 'text/calendar');
        res.setHeader('Content-Disposition', 'attachment; filename="vincanto-calendar.ics"');
        res.send(icalData);
        
    } catch (error) {
        console.error('❌ Errore export calendario:', error);
        res.status(500).json({
            success: false,
            error: 'Errore export calendario',
            details: error.message
        });
    }
});

// GET /api/calendar-sync/events - Lista eventi calendario con filtri
router.get('/events', async (req, res) => {
    try {
        const {
            startDate = moment().format('YYYY-MM-DD'),
            endDate = moment().add(6, 'months').format('YYYY-MM-DD'),
            status,
            source,
            limit = 100,
            offset = 0
        } = req.query;

        const whereConditions = {
            start_date: {
                [Op.between]: [startDate, endDate]
            }
        };

        if (status) {
            whereConditions.status = status;
        }
        
        if (source) {
            whereConditions.source = source;
        }

        const events = await Calendar.findAndCountAll({
            where: whereConditions,
            limit: parseInt(limit),
            offset: parseInt(offset),
            order: [['start_date', 'ASC'], ['start_time', 'ASC']]
        });

        // Raggruppa eventi per mese
        const eventsByMonth = {};
        events.rows.forEach(event => {
            const month = moment(event.start_date).format('YYYY-MM');
            if (!eventsByMonth[month]) {
                eventsByMonth[month] = [];
            }
            eventsByMonth[month].push({
                id: event.id,
                title: event.title,
                start_date: event.start_date,
                end_date: event.end_date,
                start_time: event.start_time,
                end_time: event.end_time,
                status: event.status,
                source: event.source,
                source_name: event.source_name,
                description: event.description
            });
        });

        res.json({
            success: true,
            message: `${events.count} eventi trovati`,
            events: events.rows,
            eventsByMonth: eventsByMonth,
            pagination: {
                total: events.count,
                limit: parseInt(limit),
                offset: parseInt(offset),
                pages: Math.ceil(events.count / parseInt(limit))
            },
            filters: {
                startDate,
                endDate,
                status,
                source
            },
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('❌ Errore recupero eventi:', error);
        res.status(500).json({
            success: false,
            error: 'Errore recupero eventi calendario',
            details: error.message
        });
    }
});

// DELETE /api/calendar-sync/events/:id - Elimina evento calendario
router.delete('/events/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        const event = await Calendar.findByPk(id);
        if (!event) {
            return res.status(404).json({
                success: false,
                error: 'Evento non trovato'
            });
        }

        await event.destroy();
        
        console.log(`🗑️ Evento eliminato: ${event.title} (${event.start_date})`);
        
        res.json({
            success: true,
            message: 'Evento eliminato',
            deleted: {
                id: event.id,
                title: event.title,
                start_date: event.start_date,
                end_date: event.end_date
            },
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('❌ Errore eliminazione evento:', error);
        res.status(500).json({
            success: false,
            error: 'Errore eliminazione evento',
            details: error.message
        });
    }
});

// GET /api/calendar-sync/availability - Controlla disponibilità per periodo
router.get('/availability', async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        
        if (!startDate || !endDate) {
            return res.status(400).json({
                success: false,
                error: 'Date di inizio e fine richieste'
            });
        }

        // Controlla conflitti per il periodo richiesto
        const conflicts = await calendarSyncService.checkDateConflicts(startDate, endDate);
        
        const isAvailable = conflicts.length === 0;
        
        res.json({
            success: true,
            available: isAvailable,
            message: isAvailable ? 'Periodo disponibile' : `${conflicts.length} conflitti trovati`,
            period: {
                startDate,
                endDate,
                nights: moment(endDate).diff(moment(startDate), 'days')
            },
            conflicts: conflicts,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('❌ Errore controllo disponibilità:', error);
        res.status(500).json({
            success: false,
            error: 'Errore controllo disponibilità',
            details: error.message
        });
    }
});

module.exports = router;