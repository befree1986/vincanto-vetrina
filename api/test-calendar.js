import { Pool } from 'pg';

// Configurazione database
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

export default async function handler(req, res) {
    // CORS Headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        const { action, startDate, endDate } = req.query;

        // Test della connessione database
        if (action === 'test') {
            const client = await pool.connect();
            try {
                const result = await client.query('SELECT NOW()');
                client.release();
                
                return res.json({
                    success: true,
                    message: 'Database connesso',
                    timestamp: result.rows[0].now
                });
            } catch (dbError) {
                client.release();
                throw dbError;
            }
        }

        // Controllo disponibilità semplificato
        if (action === 'check') {
            if (!startDate || !endDate) {
                return res.status(400).json({
                    success: false,
                    error: 'startDate e endDate sono obbligatori'
                });
            }

            const client = await pool.connect();
            try {
                // Controlla se esiste la tabella calendars
                const tableCheck = await client.query(`
                    SELECT EXISTS (
                        SELECT FROM information_schema.tables 
                        WHERE table_name = 'calendars'
                    )
                `);

                if (!tableCheck.rows[0].exists) {
                    return res.json({
                        success: true,
                        available: true,
                        message: 'Nessun calendario configurato - tutto disponibile',
                        period: { startDate, endDate },
                        blockedDates: []
                    });
                }

                // Ottieni calendari attivi
                const calendarsResult = await client.query(`
                    SELECT COUNT(*) as count
                    FROM calendars 
                    WHERE status = 'active'
                `);

                client.release();

                return res.json({
                    success: true,
                    available: true,
                    message: `${calendarsResult.rows[0].count} calendari configurati`,
                    period: { startDate, endDate },
                    blockedDates: [],
                    calendars: calendarsResult.rows[0].count
                });

            } catch (error) {
                client.release();
                throw error;
            }
        }

        // Lista calendari
        if (action === 'calendars') {
            const client = await pool.connect();
            try {
                const result = await client.query(`
                    SELECT id, name, platform, status, last_sync
                    FROM calendars 
                    ORDER BY id
                `);
                client.release();

                return res.json({
                    success: true,
                    calendars: result.rows,
                    total: result.rows.length
                });

            } catch (error) {
                client.release();
                throw error;
            }
        }

        return res.status(400).json({
            success: false,
            error: 'Azione non valida. Usa: test, check, calendars'
        });

    } catch (error) {
        console.error('Errore test-calendar:', error);
        return res.status(500).json({
            success: false,
            error: 'Errore interno del server',
            details: error.message
        });
    }
}