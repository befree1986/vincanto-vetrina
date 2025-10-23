import { Pool } from 'pg';

// Configurazione database per Vercel
const db = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

/**
 * Valida che le date siano disponibili
 */
async function checkDateAvailability(check_in_date, check_out_date) {
    try {
        // Controlla sovrapposizioni con prenotazioni esistenti
        const bookingConflict = await db.query(`
            SELECT id FROM bookings 
            WHERE booking_status IN ('confirmed', 'pending')
            AND (
                (check_in_date <= $1 AND check_out_date > $1)
                OR (check_in_date < $2 AND check_out_date >= $2)
                OR (check_in_date >= $1 AND check_out_date <= $2)
            )
        `, [check_in_date, check_out_date]);
        
        // Controlla date bloccate
        const blockedDates = await db.query(`
            SELECT id FROM blocked_dates 
            WHERE (
                (start_date <= $1 AND end_date > $1)
                OR (start_date < $2 AND end_date >= $2)
                OR (start_date >= $1 AND end_date <= $2)
            )
        `, [check_in_date, check_out_date]);
        
        return {
            available: bookingConflict.rows.length === 0 && blockedDates.rows.length === 0,
            conflicts: {
                bookings: bookingConflict.rows.length,
                blocked_dates: blockedDates.rows.length
            }
        };
        
    } catch (error) {
        console.error('❌ Errore controllo disponibilità:', error);
        throw error;
    }
}

/**
 * Ottieni tutte le date occupate per il calendario
 */
async function getOccupiedDates(startDate, endDate) {
    try {
        const result = await db.query(`
            SELECT 
                check_in_date,
                check_out_date,
                'booking' as type,
                booking_status as status
            FROM bookings 
            WHERE booking_status IN ('confirmed', 'pending')
            AND check_in_date <= $2 
            AND check_out_date >= $1
            
            UNION ALL
            
            SELECT 
                start_date as check_in_date,
                end_date as check_out_date,
                'blocked' as type,
                reason as status
            FROM blocked_dates
            WHERE start_date <= $2 
            AND end_date >= $1
            
            ORDER BY check_in_date
        `, [startDate, endDate]);
        
        return result.rows;
        
    } catch (error) {
        console.error('❌ Errore recupero date occupate:', error);
        throw error;
    }
}

/**
 * Handler principale per controllo disponibilità
 */
export default async function handler(req, res) {
    // Aggiungi headers CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    // Gestisci richieste OPTIONS per CORS
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    try {
        if (req.method === 'POST') {
            // Controllo disponibilità per date specifiche
            const { check_in_date, check_out_date } = req.body;
            
            if (!check_in_date || !check_out_date) {
                return res.status(400).json({
                    success: false,
                    error: 'Date di check-in e check-out sono richieste'
                });
            }
            
            const availability = await checkDateAvailability(check_in_date, check_out_date);
            
            return res.status(200).json({
                success: true,
                data: availability
            });
            
        } else if (req.method === 'GET') {
            // Ottieni date occupate per un periodo
            const { start_date, end_date } = req.query;
            
            if (!start_date || !end_date) {
                return res.status(400).json({
                    success: false,
                    error: 'Parametri start_date e end_date sono richiesti'
                });
            }
            
            const occupiedDates = await getOccupiedDates(start_date, end_date);
            
            return res.status(200).json({
                success: true,
                data: occupiedDates
            });
            
        } else {
            return res.status(405).json({
                success: false,
                error: 'Metodo non consentito'
            });
        }
        
    } catch (error) {
        console.error('❌ Errore controllo disponibilità:', error);
        
        return res.status(500).json({
            success: false,
            error: error.message || 'Errore interno del server'
        });
    }
}