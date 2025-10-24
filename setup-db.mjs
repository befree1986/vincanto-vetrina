import pkg from 'pg';
const { Pool } = pkg;

const DATABASE_URL = "postgresql://neondb_owner:npg_5TBySVaU7Ktf@ep-sweet-glitter-ag53yugd-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require";

async function setupDatabase() {
    console.log('🛠️ Configurando database per sistema Vincanto...');
    
    const db = new Pool({
        connectionString: DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });
    
    try {
        // Crea tabella pricing_config
        await db.query(`
            CREATE TABLE IF NOT EXISTS pricing_config (
                id SERIAL PRIMARY KEY,
                base_price_per_adult DECIMAL(10,2) DEFAULT 80.00,
                additional_guest_price DECIMAL(10,2) DEFAULT 20.00,
                minimum_nights INTEGER DEFAULT 2,
                parking_fee_per_night DECIMAL(10,2) DEFAULT 10.00,
                tourist_tax_per_person DECIMAL(10,2) DEFAULT 2.00,
                cleaning_fee DECIMAL(10,2) DEFAULT 50.00,
                deposit_percentage DECIMAL(3,2) DEFAULT 0.30,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('✅ Tabella pricing_config creata');
        
        // Inserisci configurazione predefinita
        await db.query(`
            INSERT INTO pricing_config (
                base_price_per_adult,
                additional_guest_price,
                minimum_nights,
                parking_fee_per_night,
                tourist_tax_per_person,
                cleaning_fee,
                deposit_percentage
            ) VALUES (80.00, 20.00, 2, 10.00, 2.00, 50.00, 0.30)
            ON CONFLICT DO NOTHING
        `);
        console.log('✅ Configurazione pricing inserita');
        
        // Crea tabella blocked_dates se non esiste
        await db.query(`
            CREATE TABLE IF NOT EXISTS blocked_dates (
                id SERIAL PRIMARY KEY,
                start_date DATE NOT NULL,
                end_date DATE NOT NULL,
                reason VARCHAR(255) DEFAULT 'Blocked',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('✅ Tabella blocked_dates creata');
        
        // Aggiorna tabella bookings con campi necessari
        await db.query(`
            ALTER TABLE bookings 
            ADD COLUMN IF NOT EXISTS booking_status VARCHAR(20) DEFAULT 'pending',
            ADD COLUMN IF NOT EXISTS payment_status VARCHAR(20) DEFAULT 'pending',
            ADD COLUMN IF NOT EXISTS check_in_date DATE,
            ADD COLUMN IF NOT EXISTS check_out_date DATE,
            ADD COLUMN IF NOT EXISTS num_adults INTEGER DEFAULT 2,
            ADD COLUMN IF NOT EXISTS num_children INTEGER DEFAULT 0,
            ADD COLUMN IF NOT EXISTS parking_option VARCHAR(20) DEFAULT 'none',
            ADD COLUMN IF NOT EXISTS total_amount DECIMAL(10,2),
            ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        `);
        console.log('✅ Tabella bookings aggiornata');
        
        // Test finale
        const pricing = await db.query('SELECT * FROM pricing_config ORDER BY id DESC LIMIT 1');
        console.log('💰 Configurazione attiva:', pricing.rows[0]);
        
        console.log('🎉 Database completamente configurato per Vincanto!');
        
    } catch (error) {
        console.error('❌ Errore setup database:', error.message);
    } finally {
        await db.end();
    }
}

setupDatabase();