/**
 * Database Migration - Google Calendar Tables
 * Vincanto Admin System - Professional Calendar Management
 */

-- Tabella per i token Google Calendar
CREATE TABLE IF NOT EXISTS google_calendar_tokens (
  id SERIAL PRIMARY KEY,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  token_type VARCHAR(50) DEFAULT 'Bearer',
  expires_at TIMESTAMP,
  scope TEXT,
  calendar_id VARCHAR(255),
  user_email VARCHAR(255),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabella per il log delle sincronizzazioni calendario
CREATE TABLE IF NOT EXISTS calendar_sync_log (
  id SERIAL PRIMARY KEY,
  calendar_config_id INTEGER REFERENCES calendar_configs(id) ON DELETE CASCADE,
  sync_type VARCHAR(50) NOT NULL, -- 'import', 'export', 'bidirectional'
  sync_direction VARCHAR(20) DEFAULT 'import', -- 'import', 'export', 'both'
  status VARCHAR(50) NOT NULL, -- 'success', 'error', 'partial', 'skipped'
  events_processed INTEGER DEFAULT 0,
  events_created INTEGER DEFAULT 0,
  events_updated INTEGER DEFAULT 0,
  events_deleted INTEGER DEFAULT 0,
  conflicts_found INTEGER DEFAULT 0,
  conflicts_resolved INTEGER DEFAULT 0,
  data_source VARCHAR(100), -- 'google_calendar', 'airbnb', 'booking_com', etc.
  error_message TEXT,
  error_details JSONB,
  execution_time_ms INTEGER,
  sync_started_at TIMESTAMP NOT NULL,
  sync_completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabella per mappatura eventi esterni
CREATE TABLE IF NOT EXISTS external_event_mappings (
  id SERIAL PRIMARY KEY,
  booking_id INTEGER REFERENCES bookings(id) ON DELETE CASCADE,
  external_event_id VARCHAR(255) NOT NULL, -- ID evento su servizio esterno
  external_service VARCHAR(50) NOT NULL, -- 'google_calendar', 'airbnb', etc.
  calendar_config_id INTEGER REFERENCES calendar_configs(id) ON DELETE CASCADE,
  sync_status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'synced', 'failed'
  last_sync_at TIMESTAMP,
  external_data JSONB, -- Dati completi evento esterno
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(external_event_id, external_service)
);

-- Tabella per conflitti calendario
CREATE TABLE IF NOT EXISTS calendar_conflicts (
  id SERIAL PRIMARY KEY,
  booking_id_1 INTEGER REFERENCES bookings(id) ON DELETE CASCADE,
  booking_id_2 INTEGER REFERENCES bookings(id) ON DELETE CASCADE,
  conflict_type VARCHAR(50) NOT NULL, -- 'overlap', 'duplicate', 'gap'
  severity VARCHAR(20) DEFAULT 'medium', -- 'low', 'medium', 'high', 'critical'
  overlap_start_date DATE,
  overlap_end_date DATE,
  overlap_hours INTEGER,
  resolution_status VARCHAR(50) DEFAULT 'unresolved', -- 'unresolved', 'resolved', 'ignored'
  resolution_action VARCHAR(100), -- Azione intrapresa per risolvere
  resolved_by VARCHAR(100), -- Chi ha risolto
  resolved_at TIMESTAMP,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabella per configurazioni avanzate sincronizzazione
CREATE TABLE IF NOT EXISTS calendar_sync_settings (
  id SERIAL PRIMARY KEY,
  setting_key VARCHAR(100) NOT NULL UNIQUE,
  setting_value JSONB NOT NULL,
  setting_type VARCHAR(50) DEFAULT 'config', -- 'config', 'cache', 'temp'
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indici per performance
CREATE INDEX IF NOT EXISTS idx_calendar_sync_log_config_id ON calendar_sync_log(calendar_config_id);
CREATE INDEX IF NOT EXISTS idx_calendar_sync_log_status ON calendar_sync_log(status);
CREATE INDEX IF NOT EXISTS idx_calendar_sync_log_started_at ON calendar_sync_log(sync_started_at);
CREATE INDEX IF NOT EXISTS idx_external_event_mappings_booking_id ON external_event_mappings(booking_id);
CREATE INDEX IF NOT EXISTS idx_external_event_mappings_external_id ON external_event_mappings(external_event_id);
CREATE INDEX IF NOT EXISTS idx_calendar_conflicts_booking_ids ON calendar_conflicts(booking_id_1, booking_id_2);
CREATE INDEX IF NOT EXISTS idx_calendar_conflicts_dates ON calendar_conflicts(overlap_start_date, overlap_end_date);

-- Inserimento configurazioni default
INSERT INTO calendar_sync_settings (setting_key, setting_value, description) VALUES
('sync_interval_minutes', '30', 'Intervallo sincronizzazione automatica in minuti'),
('max_sync_retries', '3', 'Numero massimo tentativi sincronizzazione'),
('conflict_detection_enabled', 'true', 'Attiva rilevamento automatico conflitti'),
('auto_resolve_conflicts', 'false', 'Risoluzione automatica conflitti semplici'),
('sync_historical_days', '365', 'Giorni storici da sincronizzare'),
('sync_future_days', '730', 'Giorni futuri da sincronizzare'),
('default_timezone', '"Europe/Rome"', 'Timezone predefinito per eventi'),
('notification_emails', '["admin@vincanto.com"]', 'Email per notifiche sincronizzazione')
ON CONFLICT (setting_key) DO NOTHING;

-- Aggiornamento tabella calendar_configs per supporto avanzato
ALTER TABLE calendar_configs 
ADD COLUMN IF NOT EXISTS last_sync_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS sync_errors_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_error_message TEXT,
ADD COLUMN IF NOT EXISTS sync_status VARCHAR(50) DEFAULT 'active',
ADD COLUMN IF NOT EXISTS total_events_imported INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_successful_sync_at TIMESTAMP;

-- Trigger per aggiornamento timestamp
CREATE OR REPLACE FUNCTION update_calendar_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_calendar_configs_updated_at
    BEFORE UPDATE ON calendar_configs
    FOR EACH ROW
    EXECUTE FUNCTION update_calendar_updated_at();

CREATE TRIGGER trigger_update_external_event_mappings_updated_at
    BEFORE UPDATE ON external_event_mappings
    FOR EACH ROW
    EXECUTE FUNCTION update_calendar_updated_at();

CREATE TRIGGER trigger_update_calendar_conflicts_updated_at
    BEFORE UPDATE ON calendar_conflicts
    FOR EACH ROW
    EXECUTE FUNCTION update_calendar_updated_at();

-- Aggiornamento tabella bookings per supporto eventi esterni
ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS external_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS external_platform VARCHAR(50),
ADD COLUMN IF NOT EXISTS external_data JSONB,
ADD COLUMN IF NOT EXISTS sync_status VARCHAR(50) DEFAULT 'local',
ADD COLUMN IF NOT EXISTS last_synced_at TIMESTAMP;

-- Indici aggiuntivi per bookings
CREATE INDEX IF NOT EXISTS idx_bookings_external_id ON bookings(external_id);
CREATE INDEX IF NOT EXISTS idx_bookings_external_platform ON bookings(external_platform);
CREATE INDEX IF NOT EXISTS idx_bookings_sync_status ON bookings(sync_status);

COMMENT ON TABLE google_calendar_tokens IS 'Token di accesso per Google Calendar API';
COMMENT ON TABLE calendar_sync_log IS 'Log delle operazioni di sincronizzazione calendario';
COMMENT ON TABLE external_event_mappings IS 'Mappatura tra prenotazioni locali e eventi esterni';
COMMENT ON TABLE calendar_conflicts IS 'Registro dei conflitti tra prenotazioni';
COMMENT ON TABLE calendar_sync_settings IS 'Configurazioni avanzate per la sincronizzazione';