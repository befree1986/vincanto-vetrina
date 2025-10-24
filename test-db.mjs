import pkg from 'pg';
const { Pool } = pkg;

// Test connessione database Neon
const DATABASE_URL = "postgresql://neondb_owner:npg_5TBySVaU7Ktf@ep-sweet-glitter-ag53yugd-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require";

async function testDatabase() {
    console.log('🔗 Testando connessione database Neon...');
    
    const db = new Pool({
        connectionString: DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });
    
    try {
        // Test connessione base
        const result = await db.query('SELECT NOW() as current_time, version() as pg_version');
        console.log('✅ Database connesso:', result.rows[0]);
        
        // Test tabelle esistenti
        const tables = await db.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
            ORDER BY table_name
        `);
        
        console.log('📋 Tabelle disponibili:', tables.rows.map(r => r.table_name));
        
        // Test configurazione pricing
        try {
            const pricing = await db.query('SELECT * FROM pricing_config ORDER BY id DESC LIMIT 1');
            console.log('💰 Configurazione pricing:', pricing.rows[0] || 'Nessuna configurazione trovata');
        } catch (err) {
            console.log('⚠️ Tabella pricing_config non esiste o vuota');
        }
        
        // Test prenotazioni
        try {
            const bookings = await db.query('SELECT COUNT(*) as total FROM bookings');
            console.log('📝 Prenotazioni totali:', bookings.rows[0].total);
        } catch (err) {
            console.log('⚠️ Tabella bookings non esiste');
        }
        
    } catch (error) {
        console.error('❌ Errore database:', error.message);
    } finally {
        await db.end();
    }
}

testDatabase();