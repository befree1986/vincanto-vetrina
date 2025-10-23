import express from 'express';
import { db } from '../index.js';

const router = express.Router();

// Middleware di autenticazione semplice (da migliorare in produzione)
const authMiddleware = (req, res, next) => {
    const authHeader = req.headers.authorization;
    
    // Per ora usa una chiave semplice, in produzione implementare JWT
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Token di autorizzazione richiesto' });
    }
    
    const token = authHeader.substring(7);
    if (token !== process.env.JWT_SECRET) {
        return res.status(401).json({ error: 'Token non valido' });
    }
    
    next();
};

/**
 * GET /api/admin/bookings
 * Ottieni tutte le prenotazioni con filtri
 */
router.get('/bookings', authMiddleware, async (req, res) => {
    try {
        const { 
            status, 
            payment_status, 
            from_date, 
            to_date, 
            limit = 50, 
            offset = 0 
        } = req.query;
        
        let query = `
            SELECT b.*, 
                   (b.check_out_date - b.check_in_date) as nights
            FROM bookings b
            WHERE 1=1
        `;
        const params = [];
        let paramCount = 0;
        
        if (status) {
            paramCount++;
            query += ` AND booking_status = $${paramCount}`;
            params.push(status);
        }
        
        if (payment_status) {
            paramCount++;
            query += ` AND payment_status = $${paramCount}`;
            params.push(payment_status);
        }
        
        if (from_date) {
            paramCount++;
            query += ` AND check_in_date >= $${paramCount}`;
            params.push(from_date);
        }
        
        if (to_date) {
            paramCount++;
            query += ` AND check_out_date <= $${paramCount}`;
            params.push(to_date);
        }
        
        query += ` ORDER BY created_at DESC`;
        
        if (limit) {
            paramCount++;
            query += ` LIMIT $${paramCount}`;
            params.push(parseInt(limit));
        }
        
        if (offset) {
            paramCount++;
            query += ` OFFSET $${paramCount}`;
            params.push(parseInt(offset));
        }
        
        const result = await db.query(query, params);
        
        // Conteggio totale per paginazione
        const countResult = await db.query('SELECT COUNT(*) FROM bookings');
        const total = parseInt(countResult.rows[0].count);
        
        res.json({
            success: true,
            bookings: result.rows,
            pagination: {
                total,
                limit: parseInt(limit),
                offset: parseInt(offset),
                pages: Math.ceil(total / parseInt(limit))
            }
        });
        
    } catch (error) {
        console.error('❌ Errore recupero prenotazioni admin:', error);
        res.status(500).json({ error: 'Errore nel recupero delle prenotazioni' });
    }
});

/**
 * GET /api/admin/bookings/:id
 * Ottieni dettagli completi di una prenotazione
 */
router.get('/bookings/:id', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        
        // Prenotazione con log dei pagamenti
        const bookingResult = await db.query(`
            SELECT b.*, 
                   (b.check_out_date - b.check_in_date) as nights
            FROM bookings b 
            WHERE id = $1
        `, [id]);
        
        if (bookingResult.rows.length === 0) {
            return res.status(404).json({ error: 'Prenotazione non trovata' });
        }
        
        // Log dei pagamenti
        const paymentLogsResult = await db.query(`
            SELECT * FROM payment_logs 
            WHERE booking_id = $1 
            ORDER BY created_at DESC
        `, [id]);
        
        res.json({
            success: true,
            booking: bookingResult.rows[0],
            payment_logs: paymentLogsResult.rows
        });
        
    } catch (error) {
        console.error('❌ Errore dettagli prenotazione:', error);
        res.status(500).json({ error: 'Errore nel recupero dei dettagli' });
    }
});

/**
 * PUT /api/admin/bookings/:id/status
 * Aggiorna stato prenotazione
 */
router.put('/bookings/:id/status', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const { booking_status, payment_status, admin_notes } = req.body;
        
        let updates = [];
        let params = [];
        let paramCount = 0;
        
        if (booking_status) {
            paramCount++;
            updates.push(`booking_status = $${paramCount}`);
            params.push(booking_status);
            
            // Aggiungi timestamp appropriato
            if (booking_status === 'confirmed') {
                paramCount++;
                updates.push(`confirmed_at = $${paramCount}`);
                params.push(new Date());
            } else if (booking_status === 'cancelled') {
                paramCount++;
                updates.push(`cancelled_at = $${paramCount}`);
                params.push(new Date());
            }
        }
        
        if (payment_status) {
            paramCount++;
            updates.push(`payment_status = $${paramCount}`);
            params.push(payment_status);
        }
        
        if (admin_notes !== undefined) {
            paramCount++;
            updates.push(`admin_notes = $${paramCount}`);
            params.push(admin_notes);
        }
        
        if (updates.length === 0) {
            return res.status(400).json({ error: 'Nessun aggiornamento specificato' });
        }
        
        paramCount++;
        updates.push(`updated_at = $${paramCount}`);
        params.push(new Date());
        
        paramCount++;
        params.push(id);
        
        const query = `
            UPDATE bookings 
            SET ${updates.join(', ')}
            WHERE id = $${paramCount}
            RETURNING *
        `;
        
        const result = await db.query(query, params);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Prenotazione non trovata' });
        }
        
        res.json({
            success: true,
            booking: result.rows[0]
        });
        
    } catch (error) {
        console.error('❌ Errore aggiornamento prenotazione:', error);
        res.status(500).json({ error: 'Errore nell\'aggiornamento della prenotazione' });
    }
});

/**
 * GET /api/admin/dashboard
 * Dashboard con statistiche
 */
router.get('/dashboard', authMiddleware, async (req, res) => {
    try {
        // Statistiche generali
        const statsResult = await db.query(`
            SELECT 
                COUNT(*) as total_bookings,
                COUNT(*) FILTER (WHERE booking_status = 'confirmed') as confirmed_bookings,
                COUNT(*) FILTER (WHERE booking_status = 'pending') as pending_bookings,
                COUNT(*) FILTER (WHERE payment_status = 'completed') as paid_bookings,
                SUM(total_amount) FILTER (WHERE payment_status = 'completed') as total_revenue,
                SUM(payment_amount) FILTER (WHERE payment_status = 'completed') as collected_revenue
            FROM bookings
        `);
        
        // Prenotazioni recenti
        const recentBookingsResult = await db.query(`
            SELECT id, guest_name, guest_surname, check_in_date, check_out_date, 
                   booking_status, payment_status, total_amount, created_at
            FROM bookings 
            ORDER BY created_at DESC 
            LIMIT 10
        `);
        
        // Prossimi arrivi
        const upcomingArrivalsResult = await db.query(`
            SELECT id, guest_name, guest_surname, check_in_date, check_out_date,
                   guest_phone, guest_email, num_adults, num_children
            FROM bookings 
            WHERE booking_status = 'confirmed' 
            AND check_in_date >= CURRENT_DATE
            AND check_in_date <= CURRENT_DATE + INTERVAL '30 days'
            ORDER BY check_in_date ASC
        `);
        
        // Occupazione prossimi 3 mesi
        const occupancyResult = await db.query(`
            SELECT 
                DATE_TRUNC('month', check_in_date) as month,
                COUNT(*) as bookings,
                SUM(check_out_date - check_in_date) as total_nights
            FROM bookings 
            WHERE booking_status = 'confirmed'
            AND check_in_date >= CURRENT_DATE
            AND check_in_date <= CURRENT_DATE + INTERVAL '3 months'
            GROUP BY DATE_TRUNC('month', check_in_date)
            ORDER BY month
        `);
        
        res.json({
            success: true,
            dashboard: {
                stats: statsResult.rows[0],
                recent_bookings: recentBookingsResult.rows,
                upcoming_arrivals: upcomingArrivalsResult.rows,
                occupancy: occupancyResult.rows
            }
        });
        
    } catch (error) {
        console.error('❌ Errore dashboard admin:', error);
        res.status(500).json({ error: 'Errore nel caricamento della dashboard' });
    }
});

/**
 * POST /api/admin/blocked-dates
 * Aggiungi date bloccate
 */
router.post('/blocked-dates', authMiddleware, async (req, res) => {
    try {
        const { start_date, end_date, reason } = req.body;
        
        if (!start_date || !end_date || !reason) {
            return res.status(400).json({ error: 'Parametri start_date, end_date e reason obbligatori' });
        }
        
        const result = await db.query(`
            INSERT INTO blocked_dates (start_date, end_date, reason, created_by)
            VALUES ($1, $2, $3, $4)
            RETURNING *
        `, [start_date, end_date, reason, 'admin']);
        
        res.json({
            success: true,
            blocked_date: result.rows[0]
        });
        
    } catch (error) {
        console.error('❌ Errore aggiunta date bloccate:', error);
        res.status(500).json({ error: 'Errore nell\'aggiunta delle date bloccate' });
    }
});

/**
 * GET /api/admin/blocked-dates
 * Ottieni tutte le date bloccate
 */
router.get('/blocked-dates', authMiddleware, async (req, res) => {
    try {
        const result = await db.query(`
            SELECT * FROM blocked_dates 
            ORDER BY start_date ASC
        `);
        
        res.json({
            success: true,
            blocked_dates: result.rows
        });
        
    } catch (error) {
        console.error('❌ Errore recupero date bloccate:', error);
        res.status(500).json({ error: 'Errore nel recupero delle date bloccate' });
    }
});

/**
 * DELETE /api/admin/blocked-dates/:id
 * Rimuovi date bloccate
 */
router.delete('/blocked-dates/:id', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        
        const result = await db.query(`
            DELETE FROM blocked_dates WHERE id = $1 RETURNING *
        `, [id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Date bloccate non trovate' });
        }
        
        res.json({
            success: true,
            message: 'Date bloccate rimosse con successo'
        });
        
    } catch (error) {
        console.error('❌ Errore rimozione date bloccate:', error);
        res.status(500).json({ error: 'Errore nella rimozione delle date bloccate' });
    }
});

export default router;