-- SCHEMA ADMIN COMPLETO PER VINCANTO PROPERTY MANAGEMENT
-- Estensione dello schema esistente con funzionalità admin avanzate

-- ========================================
-- TABELLE DI CONFIGURAZIONE ADMIN
-- ========================================

-- Configurazione avanzata prezzi e regole
CREATE TABLE IF NOT EXISTS admin_pricing_rules (
    id SERIAL PRIMARY KEY,
    rule_name VARCHAR(255) NOT NULL,
    rule_type VARCHAR(50) NOT NULL, -- 'seasonal', 'weekend', 'holiday', 'length_of_stay', 'last_minute'
    start_date DATE,
    end_date DATE,
    days_of_week INTEGER[], -- [1,2,3,4,5,6,7] per lun-dom
    minimum_stay INTEGER,
    maximum_stay INTEGER,
    price_modifier_type VARCHAR(20) NOT NULL, -- 'percentage', 'fixed_amount', 'override'
    price_modifier DECIMAL(10,2) NOT NULL,
    priority INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Configurazione metodi di pagamento
CREATE TABLE IF NOT EXISTS admin_payment_methods (
    id SERIAL PRIMARY KEY,
    method_name VARCHAR(50) NOT NULL, -- 'stripe', 'paypal', 'bank_transfer', 'satispay'
    display_name VARCHAR(100) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    fee_percentage DECIMAL(5,2) DEFAULT 0,
    fee_fixed DECIMAL(10,2) DEFAULT 0,
    minimum_amount DECIMAL(10,2) DEFAULT 0,
    maximum_amount DECIMAL(10,2),
    configuration JSONB, -- Configurazioni specifiche (API keys, etc)
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Template email automatiche
CREATE TABLE IF NOT EXISTS admin_email_templates (
    id SERIAL PRIMARY KEY,
    template_name VARCHAR(100) NOT NULL UNIQUE,
    template_type VARCHAR(50) NOT NULL, -- 'booking_confirmation', 'payment_reminder', 'check_in_info', etc
    subject VARCHAR(255) NOT NULL,
    body_html TEXT NOT NULL,
    body_text TEXT,
    variables JSONB, -- Lista variabili disponibili
    is_active BOOLEAN DEFAULT TRUE,
    language VARCHAR(5) DEFAULT 'it',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Log invii email
CREATE TABLE IF NOT EXISTS admin_email_logs (
    id SERIAL PRIMARY KEY,
    booking_id INTEGER REFERENCES bookings(id),
    template_id INTEGER REFERENCES admin_email_templates(id),
    recipient_email VARCHAR(255) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL, -- 'sent', 'failed', 'queued', 'delivered', 'opened', 'clicked'
    provider_message_id VARCHAR(255),
    error_message TEXT,
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    delivered_at TIMESTAMP,
    opened_at TIMESTAMP,
    clicked_at TIMESTAMP
);

-- Configurazione generale sistema
CREATE TABLE IF NOT EXISTS admin_settings (
    id SERIAL PRIMARY KEY,
    setting_key VARCHAR(100) NOT NULL UNIQUE,
    setting_value TEXT,
    setting_type VARCHAR(50) NOT NULL, -- 'string', 'number', 'boolean', 'json', 'array'
    category VARCHAR(50) NOT NULL, -- 'general', 'payment', 'email', 'calendar', 'notifications'
    description TEXT,
    is_public BOOLEAN DEFAULT FALSE, -- Se visibile nel frontend
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ========================================
-- TABELLE ANALYTICS E REPORTING
-- ========================================

-- Statistiche giornaliere aggregate
CREATE TABLE IF NOT EXISTS admin_daily_stats (
    id SERIAL PRIMARY KEY,
    date DATE NOT NULL UNIQUE,
    bookings_count INTEGER DEFAULT 0,
    revenue_total DECIMAL(12,2) DEFAULT 0,
    revenue_accommodation DECIMAL(12,2) DEFAULT 0,
    revenue_extras DECIMAL(12,2) DEFAULT 0,
    occupancy_rate DECIMAL(5,2) DEFAULT 0,
    average_daily_rate DECIMAL(10,2) DEFAULT 0,
    guests_count INTEGER DEFAULT 0,
    cancellations_count INTEGER DEFAULT 0,
    refunds_amount DECIMAL(12,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Log attività admin
CREATE TABLE IF NOT EXISTS admin_activity_logs (
    id SERIAL PRIMARY KEY,
    admin_user VARCHAR(100) NOT NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50), -- 'booking', 'pricing', 'setting', etc
    entity_id VARCHAR(100),
    changes JSONB, -- Dettagli modifiche effettuate
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Notifiche admin
CREATE TABLE IF NOT EXISTS admin_notifications (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) NOT NULL, -- 'booking', 'payment', 'system', 'calendar', 'error'
    priority VARCHAR(20) DEFAULT 'normal', -- 'low', 'normal', 'high', 'urgent'
    is_read BOOLEAN DEFAULT FALSE,
    booking_id INTEGER REFERENCES bookings(id),
    data JSONB, -- Dati aggiuntivi
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    read_at TIMESTAMP
);

-- ========================================
-- TABELLE CALENDARIO AVANZATE
-- ========================================

-- Configurazione calendari esterni
CREATE TABLE IF NOT EXISTS admin_calendar_configs (
    id SERIAL PRIMARY KEY,
    calendar_name VARCHAR(100) NOT NULL,
    platform VARCHAR(50) NOT NULL, -- 'airbnb', 'booking_com', 'vrbo', 'manual'
    calendar_url TEXT,
    sync_frequency INTEGER DEFAULT 60, -- minuti
    last_sync_at TIMESTAMP,
    sync_status VARCHAR(20) DEFAULT 'active',
    sync_errors_count INTEGER DEFAULT 0,
    last_error TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    configuration JSONB, -- Configurazioni specifiche platform
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Eventi calendario importati
CREATE TABLE IF NOT EXISTS admin_calendar_events (
    id SERIAL PRIMARY KEY,
    calendar_config_id INTEGER REFERENCES admin_calendar_configs(id),
    external_id VARCHAR(255),
    title VARCHAR(255) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    all_day BOOLEAN DEFAULT TRUE,
    guest_name VARCHAR(255),
    platform VARCHAR(50),
    booking_url TEXT,
    sync_status VARCHAR(20) DEFAULT 'synced', -- 'synced', 'conflict', 'ignored'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(calendar_config_id, external_id)
);

-- ========================================
-- INDICI PER PERFORMANCE
-- ========================================

CREATE INDEX IF NOT EXISTS idx_bookings_dates ON bookings(check_in_date, check_out_date);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(booking_status);
CREATE INDEX IF NOT EXISTS idx_bookings_created ON bookings(created_at);
CREATE INDEX IF NOT EXISTS idx_daily_stats_date ON admin_daily_stats(date);
CREATE INDEX IF NOT EXISTS idx_calendar_events_dates ON admin_calendar_events(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON admin_notifications(is_read, created_at);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created ON admin_activity_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_email_logs_booking ON admin_email_logs(booking_id);

-- ========================================
-- DATI DI DEFAULT
-- ========================================

-- Inserimento configurazioni default
INSERT INTO admin_settings (setting_key, setting_value, setting_type, category, description, is_public) VALUES 
('site_name', 'Vincanto Maori', 'string', 'general', 'Nome del sito', true),
('site_email', 'info@vincantomaori.it', 'string', 'general', 'Email di contatto principale', true),
('site_phone', '+39 123 456 7890', 'string', 'general', 'Telefono di contatto', true),
('check_in_time', '15:00', 'string', 'general', 'Orario check-in standard', true),
('check_out_time', '11:00', 'string', 'general', 'Orario check-out standard', true),
('deposit_percentage', '30', 'number', 'payment', 'Percentuale deposito richiesto', false),
('auto_confirm_bookings', 'false', 'boolean', 'general', 'Conferma automatica prenotazioni', false),
('calendar_sync_frequency', '60', 'number', 'calendar', 'Frequenza sync calendari (minuti)', false),
('email_notifications_enabled', 'true', 'boolean', 'email', 'Abilita notifiche email', false),
('maintenance_mode', 'false', 'boolean', 'general', 'Modalità manutenzione', false)
ON CONFLICT (setting_key) DO NOTHING;

-- Metodi di pagamento default
INSERT INTO admin_payment_methods (method_name, display_name, is_active, fee_percentage, sort_order) VALUES 
('stripe', 'Carta di Credito/Debito', true, 2.9, 1),
('paypal', 'PayPal', true, 3.4, 2),
('bank_transfer', 'Bonifico Bancario', true, 0, 3),
('satispay', 'Satispay', false, 1.0, 4)
ON CONFLICT DO NOTHING;

-- Template email base
INSERT INTO admin_email_templates (template_name, template_type, subject, body_html, variables, language) VALUES 
(
    'booking_confirmation',
    'booking_confirmation', 
    'Conferma prenotazione - {{guest_name}}',
    '<h2>Grazie per la tua prenotazione!</h2><p>Caro {{guest_name}},</p><p>La tua prenotazione è stata confermata per il periodo {{check_in}} - {{check_out}}.</p><p>Dettagli prenotazione:<br>- Ospiti: {{guests}}<br>- Totale: €{{total_amount}}</p>',
    '["guest_name", "check_in", "check_out", "guests", "total_amount"]',
    'it'
),
(
    'payment_reminder', 
    'payment_reminder',
    'Promemoria pagamento - Prenotazione {{booking_id}}',
    '<h2>Promemoria Pagamento</h2><p>Gentile {{guest_name}},</p><p>Ti ricordiamo che il saldo della tua prenotazione di €{{remaining_amount}} è in scadenza.</p>',
    '["guest_name", "booking_id", "remaining_amount", "due_date"]',
    'it'
)
ON CONFLICT (template_name) DO NOTHING;

-- Regole pricing base
INSERT INTO admin_pricing_rules (rule_name, rule_type, days_of_week, price_modifier_type, price_modifier, priority) VALUES 
('Weekend Premium', 'weekend', '{5,6,7}', 'percentage', 20.00, 1),
('Lungo soggiorno sconto', 'length_of_stay', NULL, 'percentage', -10.00, 2)
ON CONFLICT DO NOTHING;

COMMENT ON TABLE admin_pricing_rules IS 'Regole dinamiche per prezzi stagionali, weekend, lunghi soggiorni';
COMMENT ON TABLE admin_settings IS 'Configurazioni generali del sistema modificabili da admin panel';
COMMENT ON TABLE admin_daily_stats IS 'Statistiche giornaliere aggregate per analytics dashboard';
COMMENT ON TABLE admin_notifications IS 'Sistema notifiche per amministratori';
COMMENT ON TABLE admin_calendar_configs IS 'Configurazione calendari esterni per sincronizzazione automatica';