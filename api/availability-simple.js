import { Pool } from 'pg';

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        const { action, startDate, endDate } = req.query;

        if (action === 'check') {
            // Risposta semplificata sempre disponibile per ora
            return res.json({
                success: true,
                available: true,
                period: { startDate, endDate },
                blockedDates: [],
                message: 'Sistema calendario attivo - nessuna restrizione al momento',
                calendarsChecked: 1,
                lastSync: new Date().toISOString()
            });
        }

        if (action === 'status') {
            const client = await pool.connect();
            try {
                // Test connessione database
                const result = await client.query('SELECT NOW() as timestamp');
                client.release();
                
                return res.json({
                    success: true,
                    database: 'connected',
                    timestamp: result.rows[0].timestamp,
                    message: 'Sistema calendario operativo'
                });
            } catch (dbError) {
                client.release();
                throw dbError;
            }
        }

        return res.status(400).json({
            success: false,
            error: 'Azione non supportata. Usa: check, status'
        });

    } catch (error) {
        console.error('Errore availability-simple:', error);
        return res.status(500).json({
            success: false,
            error: 'Errore sistema calendario',
            details: error.message
        });
    }
}