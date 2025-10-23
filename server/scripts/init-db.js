import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Client } = pg;

const dbSchema = `
-- Tabella per le tariffe e configurazioni
CREATE TABLE IF NOT EXISTS pricing_config (
    id SERIAL PRIMARY KEY,
    base_price_per_adult DECIMAL(10,2) DEFAULT 75.00,
    additional_guest_price DECIMAL(10,2) DEFAULT 30.00,
    cleaning_fee DECIMAL(10,2) DEFAULT 30.00,
    parking_fee_per_night DECIMAL(10,2) DEFAULT 15.00,
    tourist_tax_per_person DECIMAL(10,2) DEFAULT 2.00,
    minimum_nights INTEGER DEFAULT 2,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabella per le prenotazioni
CREATE TABLE IF NOT EXISTS bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    guest_name VARCHAR(255) NOT NULL,
    guest_surname VARCHAR(255) NOT NULL,
    guest_email VARCHAR(255) NOT NULL,
    guest_phone VARCHAR(50) NOT NULL,
    check_in_date DATE NOT NULL,
    check_out_date DATE NOT NULL,
    num_adults INTEGER NOT NULL CHECK (num_adults > 0),
    num_children INTEGER DEFAULT 0,
    children_ages INTEGER[] DEFAULT '{}',
    parking_option VARCHAR(20) DEFAULT 'none' CHECK (parking_option IN ('none', 'street', 'private')),
    
    -- Costi dettagliati
    base_price DECIMAL(10,2) NOT NULL,
    parking_cost DECIMAL(10,2) DEFAULT 0,
    cleaning_fee DECIMAL(10,2) NOT NULL,
    tourist_tax DECIMAL(10,2) NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    deposit_amount DECIMAL(10,2) NOT NULL,
    
    -- Pagamento
    payment_method VARCHAR(20) NOT NULL CHECK (payment_method IN ('stripe', 'paypal', 'bank_transfer')),
    payment_type VARCHAR(20) NOT NULL CHECK (payment_type IN ('deposit', 'full')),
    payment_amount DECIMAL(10,2) NOT NULL,
    payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'completed', 'failed', 'refunded')),
    
    -- Stato prenotazione
    booking_status VARCHAR(20) DEFAULT 'pending' CHECK (booking_status IN ('pending', 'confirmed', 'cancelled', 'completed')),
    
    -- Metadati pagamento
    stripe_payment_intent_id VARCHAR(255),
    paypal_order_id VARCHAR(255),
    bank_transfer_reference VARCHAR(255),
    
    -- Note e messaggi
    guest_message TEXT,
    admin_notes TEXT,
    
    -- Timestamp
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    confirmed_at TIMESTAMP,
    cancelled_at TIMESTAMP
);

-- Tabella per bloccare date (manutenzione, pulizie, etc.)
CREATE TABLE IF NOT EXISTS blocked_dates (
    id SERIAL PRIMARY KEY,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    reason VARCHAR(255) NOT NULL,
    created_by VARCHAR(255) DEFAULT 'system',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabella per sincronizzazione calendari esterni
CREATE TABLE IF NOT EXISTS calendar_sync (
    id SERIAL PRIMARY KEY,
    platform VARCHAR(50) NOT NULL, -- 'booking_com', 'airbnb', 'gmail'
    external_id VARCHAR(255),
    sync_url TEXT,
    last_sync TIMESTAMP,
    sync_status VARCHAR(20) DEFAULT 'active' CHECK (sync_status IN ('active', 'inactive', 'error')),
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabella per log delle transazioni
CREATE TABLE IF NOT EXISTS payment_logs (
    id SERIAL PRIMARY KEY,
    booking_id UUID REFERENCES bookings(id),
    payment_method VARCHAR(20) NOT NULL,
    payment_provider VARCHAR(50) NOT NULL,
    provider_transaction_id VARCHAR(255),
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'EUR',
    status VARCHAR(20) NOT NULL,
    provider_response JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indici per performance
CREATE INDEX IF NOT EXISTS idx_bookings_dates ON bookings(check_in_date, check_out_date);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(booking_status);
CREATE INDEX IF NOT EXISTS idx_bookings_email ON bookings(guest_email);
CREATE INDEX IF NOT EXISTS idx_blocked_dates ON blocked_dates(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_calendar_sync_platform ON calendar_sync(platform);

-- Trigger per aggiornare updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON bookings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pricing_config_updated_at BEFORE UPDATE ON pricing_config
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_calendar_sync_updated_at BEFORE UPDATE ON calendar_sync
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Inserisci configurazione di default
INSERT INTO pricing_config (
    base_price_per_adult,
    additional_guest_price,
    cleaning_fee,
    parking_fee_per_night,
    tourist_tax_per_person,
    minimum_nights
) VALUES (75.00, 30.00, 30.00, 15.00, 2.00, 2)
ON CONFLICT DO NOTHING;

-- Inserisci alcuni blocchi date di esempio per test
INSERT INTO blocked_dates (start_date, end_date, reason) VALUES
    ('2025-12-24', '2025-12-26', 'Festività Natalizie'),
    ('2025-12-31', '2026-01-02', 'Festività Capodanno')
ON CONFLICT DO NOTHING;

-- Configurazione iniziale calendar sync
INSERT INTO calendar_sync (platform, sync_url, sync_status) VALUES
    ('booking_com', '', 'inactive'),
    ('airbnb', '', 'inactive'),
    ('gmail', '', 'inactive')
ON CONFLICT DO NOTHING;
`;

async function initDatabase() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: {
            rejectUnauthorized: false
        }
    });

    try {
        await client.connect();
        console.log('🔗 Connesso al database Neon PostgreSQL');
        
        await client.query(dbSchema);
        console.log('✅ Schema database creato con successo!');
        
        // Verifica che le tabelle siano state create
        const result = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            ORDER BY table_name;
        `);
        
        console.log('📋 Tabelle create:');
        result.rows.forEach(row => {
            console.log(`  - ${row.table_name}`);
        });
        
    } catch (error) {
        console.error('❌ Errore durante l\'inizializzazione del database:', error);
        throw error;
    } finally {
        await client.end();
    }
}

// Esegui se chiamato direttamente
if (import.meta.url === `file://${process.argv[1]}`) {
    initDatabase().catch(console.error);
}

export default initDatabase;