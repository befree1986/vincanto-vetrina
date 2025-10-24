// Import PostgreSQL per Vercel
import pg from 'pg';
const { Pool } = pg;

export default async function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    if (req.method !== 'GET') {
        return res.status(405).json({
            success: false,
            error: 'Method not allowed'
        });
    }
    
    try {
        // Test variabili ambiente
        const envVars = {
            hasDatabaseUrl: !!process.env.DATABASE_URL,
            hasNodeEnv: !!process.env.NODE_ENV,
            hasJwtSecret: !!process.env.JWT_SECRET,
            nodeEnv: process.env.NODE_ENV || 'undefined',
            hasPoolClass: !!Pool
        };
        
        console.log('🔍 Environment variables:', envVars);
        
        if (!Pool) {
            return res.status(500).json({
                success: false,
                error: 'PostgreSQL module not available',
                envVars
            });
        }
        
        if (!process.env.DATABASE_URL) {
            return res.status(500).json({
                success: false,
                error: 'DATABASE_URL not configured',
                envVars
            });
        }
        
        // Test connessione database
        const db = new Pool({
            connectionString: process.env.DATABASE_URL,
            ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
        });
        
        const result = await db.query('SELECT NOW() as current_time, version() as pg_version');
        
        // Test tabelle
        const tables = await db.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
            ORDER BY table_name
        `);
        
        await db.end();
        
        return res.status(200).json({
            success: true,
            message: 'Database connection successful',
            envVars,
            database: {
                connected: true,
                currentTime: result.rows[0].current_time,
                version: result.rows[0].pg_version,
                tables: tables.rows.map(r => r.table_name)
            }
        });
        
    } catch (error) {
        console.error('❌ Database test error:', error);
        
        return res.status(500).json({
            success: false,
            error: error.message,
            envVars: {
                hasDatabaseUrl: !!process.env.DATABASE_URL,
                hasNodeEnv: !!process.env.NODE_ENV,
                nodeEnv: process.env.NODE_ENV || 'undefined',
                hasPoolClass: !!Pool
            }
        });
    }
}