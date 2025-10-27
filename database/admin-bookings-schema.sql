-- SCHEMA AGGIUNTIVO PER BOOKING MANAGEMENT E CALENDAR SYNC
-- Da eseguire per completare il sistema admin

-- ========================================
-- TABELLE BOOKING MANAGEMENT
-- ========================================

-- Tabella principale bookings (prenotazioni reali)
CREATE TABLE IF NOT EXISTS admin_bookings (
    id SERIAL PRIMARY KEY,
    guest_name VARCHAR(255) NOT NULL,
    guest_email VARCHAR(255) NOT NULL,
    guest_phone VARCHAR(50),
    check_in_date DATE NOT NULL,
    check_out_date DATE NOT NULL,
    guests_count INTEGER NOT NULL DEFAULT 1,
    adults_count INTEGER DEFAULT 1,
    children_count INTEGER DEFAULT 0,
    status VARCHAR(50) NOT NULL DEFAULT 'pending', -- 'pending', 'confirmed', 'cancelled', 'completed'
    total_amount DECIMAL(10,2) NOT NULL,
    deposit_amount DECIMAL(10,2) DEFAULT 0,
    balance_due DECIMAL(10,2) DEFAULT 0,
    currency VARCHAR(3) DEFAULT 'EUR',
    payment_status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'partial', 'paid', 'refunded'
    include_parking BOOLEAN DEFAULT FALSE,
    parking_fee DECIMAL(10,2) DEFAULT 0,
    cleaning_fee DECIMAL(10,2) DEFAULT 0,
    tourist_tax DECIMAL(10,2) DEFAULT 0,
    platform VARCHAR(50) DEFAULT 'direct', -- 'direct', 'airbnb', 'booking_com', 'vrbo'
    platform_booking_id VARCHAR(255),
    platform_commission DECIMAL(10,2) DEFAULT 0,
    guest_notes TEXT,
    admin_notes TEXT,
    special_requests TEXT,
    confirmation_code VARCHAR(50) UNIQUE,
    cancellation_reason TEXT,
    cancelled_at TIMESTAMP,
    confirmed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT chk_dates CHECK (check_out_date > check_in_date),
    CONSTRAINT chk_guests CHECK (guests_count > 0),
    CONSTRAINT chk_amounts CHECK (total_amount >= 0 AND deposit_amount >= 0)
);

-- Tabella date bloccate (maintenance, holidays, etc.)
CREATE TABLE IF NOT EXISTS admin_blocked_dates (
    id SERIAL PRIMARY KEY,
    blocked_date DATE NOT NULL,
    reason VARCHAR(255) NOT NULL,
    block_type VARCHAR(50) NOT NULL DEFAULT 'manual', -- 'manual', 'maintenance', 'holiday', 'personal', 'platform'
    calendar_config_id INTEGER REFERENCES admin_calendar_configs(id),
    notes TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_by VARCHAR(100) DEFAULT 'admin',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Indice unico per evitare duplicati
    UNIQUE(blocked_date, block_type)
);

-- Tabella per tracking modifiche notifiche
ALTER TABLE admin_notifications ADD COLUMN IF NOT EXISTS notification_type VARCHAR(50) DEFAULT 'system';

-- ========================================
-- INDICI PER PERFORMANCE
-- ========================================

-- Indici per bookings
CREATE INDEX IF NOT EXISTS idx_admin_bookings_dates ON admin_bookings(check_in_date, check_out_date);
CREATE INDEX IF NOT EXISTS idx_admin_bookings_status ON admin_bookings(status);
CREATE INDEX IF NOT EXISTS idx_admin_bookings_email ON admin_bookings(guest_email);
CREATE INDEX IF NOT EXISTS idx_admin_bookings_created ON admin_bookings(created_at);
CREATE INDEX IF NOT EXISTS idx_admin_bookings_platform ON admin_bookings(platform, platform_booking_id);

-- Indici per blocked dates
CREATE INDEX IF NOT EXISTS idx_blocked_dates_date ON admin_blocked_dates(blocked_date);
CREATE INDEX IF NOT EXISTS idx_blocked_dates_active ON admin_blocked_dates(is_active, blocked_date);

-- Indici per calendario
CREATE INDEX IF NOT EXISTS idx_calendar_configs_active ON admin_calendar_configs(is_active, platform);
CREATE INDEX IF NOT EXISTS idx_calendar_configs_sync ON admin_calendar_configs(last_sync_at);

-- ========================================
-- FUNZIONI E TRIGGER PER AUTO-UPDATE
-- ========================================

-- Funzione per auto-aggiornare updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger per auto-update
DROP TRIGGER IF EXISTS update_admin_bookings_updated_at ON admin_bookings;
CREATE TRIGGER update_admin_bookings_updated_at 
    BEFORE UPDATE ON admin_bookings 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_blocked_dates_updated_at ON admin_blocked_dates;
CREATE TRIGGER update_blocked_dates_updated_at 
    BEFORE UPDATE ON admin_blocked_dates 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_calendar_configs_updated_at ON admin_calendar_configs;
CREATE TRIGGER update_calendar_configs_updated_at 
    BEFORE UPDATE ON admin_calendar_configs 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- DATI DEMO PER TESTING (RIMUOVERE IN PRODUZIONE)
-- ========================================

-- Bookings di test
INSERT INTO admin_bookings (guest_name, guest_email, guest_phone, check_in_date, check_out_date, guests_count, status, total_amount, deposit_amount, platform, confirmation_code) VALUES 
('Marco Bianchi', 'marco.bianchi@email.com', '+39 335 123 4567', '2025-02-15', '2025-02-20', 2, 'confirmed', 850.00, 255.00, 'direct', 'VNC2025001'),
('Sarah Johnson', 'sarah.johnson@email.com', '+44 7700 900123', '2025-03-01', '2025-03-07', 4, 'pending', 1400.00, 420.00, 'airbnb', 'VNC2025002'),
('Giuseppe Rossi', 'g.rossi@email.com', '+39 340 987 6543', '2025-01-28', '2025-02-02', 1, 'confirmed', 425.00, 127.50, 'direct', 'VNC2025003'),
('Anna Mueller', 'anna.mueller@email.de', '+49 170 1234567', '2025-04-10', '2025-04-15', 3, 'confirmed', 1050.00, 315.00, 'booking_com', 'VNC2025004'),
('Pierre Dubois', 'pierre.dubois@email.fr', '+33 6 12 34 56 78', '2025-05-20', '2025-05-25', 2, 'pending', 875.00, 262.50, 'vrbo', 'VNC2025005');

-- Date bloccate di test  
INSERT INTO admin_blocked_dates (blocked_date, reason, block_type, notes) VALUES 
('2025-02-28', 'Manutenzione impianto idraulico', 'maintenance', 'Prevista sostituzione tubature bagno principale'),
('2025-03-15', 'Vacanza personale proprietario', 'personal', 'Famiglia proprietario in visita'),
('2025-04-25', 'Festa della Liberazione', 'holiday', 'Giorno festivo nazionale'),
('2025-05-01', 'Festa del Lavoro', 'holiday', 'Giorno festivo nazionale'),
('2025-06-02', 'Festa della Repubblica', 'holiday', 'Giorno festivo nazionale');

-- Calendari esterni di esempio
INSERT INTO admin_calendar_configs (calendar_name, platform, calendar_url, sync_frequency, is_active) VALUES 
('Airbnb Vincanto', 'airbnb', 'https://calendar.airbnb.com/calendar/ical/123456.ics', 60, true),
('Booking.com Vincanto', 'booking_com', 'https://secure.booking.com/ical/calendar.ics?t=token123', 120, true);

-- Notifiche di test
INSERT INTO admin_notifications (title, message, notification_type, priority, is_read) VALUES 
('Nuova prenotazione ricevuta', 'Marco Bianchi ha effettuato una prenotazione per il 15-20 Febbraio 2025', 'booking', 'high', false),
('Sincronizzazione calendario completata', 'Il calendario Airbnb è stato sincronizzato con successo. 3 nuove disponibilità aggiornate.', 'calendar', 'normal', true),
('Pagamento ricevuto', 'Ricevuto pagamento di €255.00 per la prenotazione VNC2025001', 'payment', 'normal', false),
('Errore sincronizzazione', 'Impossibile sincronizzare il calendario Booking.com. Verificare URL.', 'system', 'high', false);

-- ========================================
-- VISTA PER DASHBOARD ANALYTICS
-- ========================================

CREATE OR REPLACE VIEW admin_dashboard_view AS
SELECT 
    -- Booking statistics
    (SELECT COUNT(*) FROM admin_bookings WHERE status IN ('confirmed', 'pending')) as total_active_bookings,
    (SELECT COUNT(*) FROM admin_bookings WHERE status = 'confirmed') as confirmed_bookings,
    (SELECT COUNT(*) FROM admin_bookings WHERE status = 'pending') as pending_bookings,
    (SELECT COALESCE(SUM(total_amount), 0) FROM admin_bookings WHERE status = 'confirmed' AND created_at >= CURRENT_DATE - INTERVAL '30 days') as monthly_revenue,
    (SELECT COALESCE(AVG(check_out_date - check_in_date), 0) FROM admin_bookings WHERE status = 'confirmed') as average_stay_days,
    
    -- Calendar statistics
    (SELECT COUNT(*) FROM admin_calendar_configs WHERE is_active = true) as active_calendars,
    (SELECT COUNT(*) FROM admin_blocked_dates WHERE blocked_date >= CURRENT_DATE AND is_active = true) as upcoming_blocked_dates,
    
    -- Notifications
    (SELECT COUNT(*) FROM admin_notifications WHERE is_read = false) as unread_notifications,
    
    -- Occupancy rate (approssimativo)
    (SELECT 
        CASE 
            WHEN COUNT(*) > 0 THEN 
                (COUNT(CASE WHEN status = 'confirmed' THEN 1 END)::float / COUNT(*)::float * 100)
            ELSE 0 
        END
     FROM admin_bookings 
     WHERE check_in_date >= CURRENT_DATE AND check_in_date <= CURRENT_DATE + INTERVAL '30 days'
    ) as monthly_occupancy_rate;