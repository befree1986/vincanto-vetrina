/**
 * Admin Routes per Vincanto Backend Express
 * Migrazione da Vercel serverless a Express unificato
 */

const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const { sequelize } = require('../config/database');

// Import modelli database
const { User, Booking, Payment, PricingConfig, CalendarConfig, SystemSettings } = require('../models');

/**
 * GET /api/admin/dashboard-stats
 * Statistiche dashboard admin
 */
router.get('/dashboard-stats', async (req, res) => {
    try {
        console.log('📊 Richiesta dashboard stats');
        
        // Conta statistiche dal database
        const [
            totalBookings,
            confirmedBookings,
            pendingBookings,
            totalRevenue,
            activeCalendars,
            systemSettings
        ] = await Promise.all([
            Booking.count(),
            Booking.count({ where: { status: 'confirmed' } }),
            Booking.count({ where: { status: 'pending' } }),
            Payment.sum('amount', { where: { status: 'completed' } }) || 0,
            CalendarConfig.count({ where: { is_active: true } }),
            SystemSettings.count()
        ]);
        
        // Calcola occupancy rate (esempio)
        const occupancyRate = totalBookings > 0 ? (confirmedBookings / totalBookings) : 0;
        const averageStay = 3.5; // TODO: Calcolare dalla media delle prenotazioni
        
        res.json({
            success: true,
            stats: {
                totalBookings,
                activeCalendars,
                totalRevenue: Number(totalRevenue).toFixed(2),
                confirmedBookings,
                pendingBookings,
                averageStay,
                occupancyRate: Math.round(occupancyRate * 100) / 100,
                systemSettings
            },
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('❌ Errore dashboard stats:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            fallback_stats: {
                totalBookings: 0,
                activeCalendars: 0,
                totalRevenue: "0.00",
                confirmedBookings: 0,
                pendingBookings: 0,
                averageStay: 0,
                occupancyRate: 0,
                systemSettings: 0
            }
        });
    }
});

/**
 * GET /api/admin/bookings
 * Lista prenotazioni con paginazione
 */
router.get('/bookings', async (req, res) => {
    try {
        const { page = 1, limit = 10, status, search } = req.query;
        const offset = (page - 1) * limit;
        
        // Costruisci filtri
        const where = {};
        if (status && status !== 'all') {
            where.status = status;
        }
        if (search) {
            where[Op.or] = [
                { guest_name: { [Op.like]: `%${search}%` } },
                { guest_email: { [Op.like]: `%${search}%` } },
                { booking_number: { [Op.like]: `%${search}%` } }
            ];
        }
        
        // Query raw per evitare cache Sequelize
        const totalResult = await sequelize.query(
            'SELECT COUNT(*) as count FROM bookings WHERE 1=1' + 
            (status && status !== 'all' ? ` AND status = :status` : '') +
            (search ? ` AND (guest_first_name ILIKE :search OR guest_last_name ILIKE :search OR guest_email ILIKE :search OR booking_number ILIKE :search)` : ''),
            {
                replacements: { status, search: search ? `%${search}%` : null },
                type: sequelize.QueryTypes.SELECT
            }
        );
        
        const bookings = await sequelize.query(
            `SELECT b.*, 
                    json_agg(
                        CASE WHEN p.id IS NOT NULL THEN
                            json_build_object(
                                'id', p.id,
                                'amount', p.amount,
                                'status', p.status,
                                'payment_method', p.payment_method
                            )
                        END
                    ) FILTER (WHERE p.id IS NOT NULL) as payments
             FROM bookings b
             LEFT JOIN payments p ON b.id = p.booking_id
             WHERE 1=1` +
            (status && status !== 'all' ? ` AND b.status = :status` : '') +
            (search ? ` AND (b.guest_first_name ILIKE :search OR b.guest_last_name ILIKE :search OR b.guest_email ILIKE :search OR b.booking_number ILIKE :search)` : '') +
            ` GROUP BY b.id
             ORDER BY b.created_at DESC
             LIMIT :limit OFFSET :offset`,
            {
                replacements: { 
                    status, 
                    search: search ? `%${search}%` : null,
                    limit: parseInt(limit),
                    offset: parseInt(offset)
                },
                type: sequelize.QueryTypes.SELECT
            }
        );
        
        const count = totalResult[0].count;
        
        res.json({
            success: true,
            bookings,
            pagination: {
                total: count,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(count / limit)
            }
        });
        
    } catch (error) {
        console.error('❌ Errore lista bookings:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            bookings: []
        });
    }
});

/**
 * POST /api/admin/bookings
 * Crea nuova prenotazione
 */
router.post('/bookings', async (req, res) => {
    try {
        const {
            guest_name,
            guest_surname,
            guest_email,
            guest_phone,
            check_in_date,
            check_out_date,
            num_adults,
            num_children,
            total_amount,
            booking_source = 'admin'
        } = req.body;
        
        // Genera booking number univoco
        const bookingNumber = `VIN${Date.now()}`;
        
        const booking = await Booking.create({
            booking_number: bookingNumber,
            guest_name,
            guest_surname,
            guest_email,
            guest_phone,
            check_in_date,
            check_out_date,
            num_adults,
            num_children,
            total_amount,
            booking_source,
            status: 'confirmed',
            payment_status: 'pending'
        });
        
        res.status(201).json({
            success: true,
            booking,
            message: 'Prenotazione creata con successo'
        });
        
    } catch (error) {
        console.error('❌ Errore creazione booking:', error);
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * PUT /api/admin/bookings/:id
 * Aggiorna prenotazione esistente
 */
router.put('/bookings/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;
        
        const [updatedRows] = await Booking.update(updateData, {
            where: { id }
        });
        
        if (updatedRows === 0) {
            return res.status(404).json({
                success: false,
                error: 'Prenotazione non trovata'
            });
        }
        
        const updatedBooking = await Booking.findByPk(id);
        
        res.json({
            success: true,
            booking: updatedBooking,
            message: 'Prenotazione aggiornata con successo'
        });
        
    } catch (error) {
        console.error('❌ Errore aggiornamento booking:', error);
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * DELETE /api/admin/bookings/:id
 * Elimina prenotazione
 */
router.delete('/bookings/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        const deleted = await Booking.destroy({
            where: { id }
        });
        
        if (deleted === 0) {
            return res.status(404).json({
                success: false,
                error: 'Prenotazione non trovata'
            });
        }
        
        res.json({
            success: true,
            message: 'Prenotazione eliminata con successo'
        });
        
    } catch (error) {
        console.error('❌ Errore eliminazione booking:', error);
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/admin/calendars
 * Lista calendari configurati
 */
router.get('/calendars', async (req, res) => {
    try {
        const calendars = await CalendarConfig.findAll({
            order: [['created_at', 'DESC']]
        });
        
        res.json({
            success: true,
            calendars
        });
        
    } catch (error) {
        console.error('❌ Errore lista calendari:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            calendars: []
        });
    }
});

/**
 * GET /api/admin/pricing-config
 * Configurazione prezzi
 */
router.get('/pricing-config', async (req, res) => {
    try {
        const configs = await PricingConfig.findAll({
            where: { is_active: true },
            order: [['priority', 'DESC']]
        });
        
        res.json({
            success: true,
            pricing: configs
        });
        
    } catch (error) {
        console.error('❌ Errore pricing config:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            pricing: []
        });
    }
});

/**
 * GET /api/admin/notifications
 * Sistema notifiche
 */
router.get('/notifications', async (req, res) => {
    try {
        // TODO: Implementare sistema notifiche reale
        // Per ora restituiamo notifiche mock
        const notifications = [
            {
                id: "1",
                title: "✅ Sistema Admin Unificato",
                message: "API admin migrata da Vercel a Express backend per architettura unificata.",
                type: "system",
                read: false,
                timestamp: new Date().toISOString()
            },
            {
                id: "2",
                title: "💳 Pagamenti Stripe Attivi",
                message: "Sistema pagamenti Stripe configurato e funzionante.",
                type: "payment",
                read: false,
                timestamp: new Date(Date.now() - 3600000).toISOString()
            }
        ];
        
        res.json({
            success: true,
            notifications,
            unreadCount: notifications.filter(n => !n.read).length
        });
        
    } catch (error) {
        console.error('❌ Errore notifiche:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            notifications: []
        });
    }
});

/**
 * GET /api/admin/analytics
 * Analytics e metriche
 */
router.get('/analytics', async (req, res) => {
    try {
        const { period = '30d' } = req.query;
        
        // Calcola periodo
        const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);
        
        // Query analytics
        const bookingTrends = await Booking.findAll({
            attributes: [
                [Booking.sequelize.fn('DATE', Booking.sequelize.col('check_in_date')), 'date'],
                [Booking.sequelize.fn('COUNT', '*'), 'bookings_count'],
                [Booking.sequelize.fn('SUM', Booking.sequelize.col('total_amount')), 'revenue_total']
            ],
            where: {
                created_at: { [Op.gte]: startDate }
            },
            group: [Booking.sequelize.fn('DATE', Booking.sequelize.col('check_in_date'))],
            order: [[Booking.sequelize.fn('DATE', Booking.sequelize.col('check_in_date')), 'DESC']]
        });
        
        res.json({
            success: true,
            analytics: bookingTrends,
            period
        });
        
    } catch (error) {
        console.error('❌ Errore analytics:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            analytics: []
        });
    }
});

/**
 * GET /api/admin/system-settings
 * Impostazioni sistema
 */
router.get('/system-settings', async (req, res) => {
    try {
        const settings = await SystemSettings.findAll({
            order: [['category', 'ASC'], ['sort_order', 'ASC']]
        });
        
        res.json({
            success: true,
            settings
        });
        
    } catch (error) {
        console.error('❌ Errore system settings:', error);
        res.status(500).json({
            success: false,
            error: error.message,
            settings: []
        });
    }
});

/**
 * PUT /api/admin/system-settings
 * Aggiorna impostazioni sistema
 */
router.put('/system-settings', async (req, res) => {
    try {
        const { settings } = req.body;
        
        // Aggiorna ogni setting
        const updates = await Promise.all(
            settings.map(setting => 
                SystemSettings.update(
                    { 
                        setting_value: setting.value
                        // Rimosso last_updated_by per evitare errore UUID
                    },
                    { 
                        where: { setting_key: setting.key } 
                    }
                )
            )
        );
        
        res.json({
            success: true,
            message: `${updates.length} impostazioni aggiornate`,
            updated: updates.length
        });
        
    } catch (error) {
        console.error('❌ Errore aggiornamento settings:', error);
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
});

module.exports = router;