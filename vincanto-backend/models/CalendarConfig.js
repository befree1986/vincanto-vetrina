/**
 * CalendarConfig Model
 * Modello per la configurazione dei calendari e sincronizzazione
 */

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const CalendarConfig = sequelize.define('CalendarConfig', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  
  // Identificazione
  name: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  
  // Tipo calendario
  calendar_type: {
    type: DataTypes.ENUM(
      'google_calendar', 'airbnb', 'booking_com', 'vrbo', 'homeaway',
      'expedia', 'tripadvisor', 'manual', 'ical_import', 'ical_export'
    ),
    allowNull: false
  },
  
  // Provider configuration
  provider: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  calendar_id: {
    type: DataTypes.STRING(255),
    allowNull: true // Per calendari esterni
  },
  
  // URL per sync iCal
  ical_url: {
    type: DataTypes.TEXT,
    allowNull: true,
    validate: {
      isUrl: true
    }
  },
  ical_export_url: {
    type: DataTypes.TEXT,
    allowNull: true // URL pubblico per export
  },
  
  // Credenziali API (crittografate)
  api_credentials: {
    type: DataTypes.JSON, // Credenziali crittografate
    allowNull: true
  },
  access_token: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  refresh_token: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  token_expires_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  
  // Configurazione sincronizzazione
  sync_enabled: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  sync_direction: {
    type: DataTypes.ENUM('import_only', 'export_only', 'bidirectional'),
    defaultValue: 'bidirectional'
  },
  sync_frequency_minutes: {
    type: DataTypes.INTEGER,
    defaultValue: 60, // Sync ogni ora di default
    validate: {
      min: 5,
      max: 1440 // Max una volta al giorno
    }
  },
  auto_block_imported_dates: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  
  // Ultimo sync
  last_sync_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  last_sync_status: {
    type: DataTypes.ENUM('success', 'error', 'partial', 'skipped'),
    allowNull: true
  },
  last_sync_message: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  last_sync_imported_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  last_sync_exported_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  
  // Configurazione mapping eventi
  event_title_template: {
    type: DataTypes.STRING(255),
    defaultValue: 'Vincanto - {{booking_number}}' // Template per titolo eventi
  },
  event_description_template: {
    type: DataTypes.TEXT,
    defaultValue: 'Prenotazione {{booking_number}}\nOspiti: {{guest_count}}\nCheck-in: {{check_in}}\nCheck-out: {{check_out}}'
  },
  
  // Buffer days
  buffer_days_before: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    validate: {
      min: 0,
      max: 30
    }
  },
  buffer_days_after: {
    type: DataTypes.INTEGER,
    defaultValue: 1, // 1 giorno per pulizie
    validate: {
      min: 0,
      max: 30
    }
  },
  
  // Filtri eventi
  import_confirmed_only: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  import_date_range_days: {
    type: DataTypes.INTEGER,
    defaultValue: 365, // Importa eventi per i prossimi 365 giorni
    validate: {
      min: 30,
      max: 1095 // Max 3 anni
    }
  },
  
  // Configurazione conflitti
  conflict_resolution: {
    type: DataTypes.ENUM(
      'skip_import', 'overwrite_local', 'merge', 'create_duplicate'
    ),
    defaultValue: 'skip_import'
  },
  
  // Configurazione colori (per calendari che supportano)
  default_color: {
    type: DataTypes.STRING(7), // Hex color: #FF0000
    defaultValue: '#2196F3'
  },
  confirmed_color: {
    type: DataTypes.STRING(7),
    defaultValue: '#4CAF50'
  },
  pending_color: {
    type: DataTypes.STRING(7),
    defaultValue: '#FF9800'
  },
  blocked_color: {
    type: DataTypes.STRING(7),
    defaultValue: '#F44336'
  },
  
  // Notifiche
  notify_on_sync_error: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  notify_on_conflict: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  notification_email: {
    type: DataTypes.STRING(255),
    allowNull: true,
    validate: {
      isEmail: true
    }
  },
  
  // Metadati
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  is_primary: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  priority: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  
  // Statistiche
  total_syncs_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  successful_syncs_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  failed_syncs_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  
  // Configurazioni avanzate
  timezone: {
    type: DataTypes.STRING(50),
    defaultValue: 'Europe/Rome'
  },
  date_format: {
    type: DataTypes.STRING(20),
    defaultValue: 'YYYY-MM-DD'
  },
  custom_fields_mapping: {
    type: DataTypes.JSON, // Mapping campi personalizzati
    allowNull: true
  },
  webhook_url: {
    type: DataTypes.TEXT,
    allowNull: true // Per notifiche webhook
  }
}, {
  tableName: 'calendar_configs',
  indexes: [
    {
      fields: ['calendar_type']
    },
    {
      fields: ['provider']
    },
    {
      fields: ['sync_enabled']
    },
    {
      fields: ['is_active']
    },
    {
      fields: ['is_primary']
    },
    {
      fields: ['last_sync_at']
    }
  ],
  validate: {
    // Solo un calendario primario attivo
    primaryCalendarCheck() {
      if (this.is_primary && !this.is_active) {
        throw new Error('Primary calendar must be active');
      }
    }
  }
});

// Metodi di istanza
CalendarConfig.prototype.needsTokenRefresh = function() {
  if (!this.token_expires_at) return false;
  const bufferMinutes = 5; // Refresh 5 minuti prima della scadenza
  const refreshTime = new Date(this.token_expires_at.getTime() - (bufferMinutes * 60 * 1000));
  return new Date() >= refreshTime;
};

CalendarConfig.prototype.isOverdue = function() {
  if (!this.sync_enabled) return false;
  if (!this.last_sync_at) return true;
  
  const nextSyncTime = new Date(this.last_sync_at.getTime() + (this.sync_frequency_minutes * 60 * 1000));
  return new Date() >= nextSyncTime;
};

CalendarConfig.prototype.getNextSyncTime = function() {
  if (!this.last_sync_at) return new Date(); // Sync subito se mai fatto
  return new Date(this.last_sync_at.getTime() + (this.sync_frequency_minutes * 60 * 1000));
};

CalendarConfig.prototype.updateSyncStatus = async function(status, message = '', importedCount = 0, exportedCount = 0) {
  const updateData = {
    last_sync_at: new Date(),
    last_sync_status: status,
    last_sync_message: message,
    last_sync_imported_count: importedCount,
    last_sync_exported_count: exportedCount,
    total_syncs_count: this.total_syncs_count + 1
  };
  
  if (status === 'success') {
    updateData.successful_syncs_count = this.successful_syncs_count + 1;
  } else if (status === 'error') {
    updateData.failed_syncs_count = this.failed_syncs_count + 1;
  }
  
  return await this.update(updateData);
};

CalendarConfig.prototype.renderEventTitle = function(booking) {
  let title = this.event_title_template;
  
  // Replace template variables
  title = title.replace(/\{\{booking_number\}\}/g, booking.booking_number || '');
  title = title.replace(/\{\{guest_name\}\}/g, booking.guest_name || '');
  title = title.replace(/\{\{guest_count\}\}/g, booking.guest_count || '');
  
  return title;
};

CalendarConfig.prototype.renderEventDescription = function(booking) {
  let description = this.event_description_template;
  
  // Replace template variables
  description = description.replace(/\{\{booking_number\}\}/g, booking.booking_number || '');
  description = description.replace(/\{\{guest_name\}\}/g, booking.guest_name || '');
  description = description.replace(/\{\{guest_count\}\}/g, booking.guest_count || '');
  description = description.replace(/\{\{check_in\}\}/g, booking.check_in ? booking.check_in.toISOString().split('T')[0] : '');
  description = description.replace(/\{\{check_out\}\}/g, booking.check_out ? booking.check_out.toISOString().split('T')[0] : '');
  description = description.replace(/\{\{total_amount\}\}/g, booking.total_amount || '');
  description = description.replace(/\{\{guest_email\}\}/g, booking.guest_email || '');
  description = description.replace(/\{\{guest_phone\}\}/g, booking.guest_phone || '');
  
  return description;
};

CalendarConfig.prototype.getEventColor = function(booking) {
  const statusColors = {
    confirmed: this.confirmed_color,
    pending: this.pending_color,
    cancelled: this.blocked_color
  };
  
  return statusColors[booking.status] || this.default_color;
};

// Metodi statici
CalendarConfig.getActiveConfigs = async function() {
  return await CalendarConfig.findAll({
    where: { 
      is_active: true,
      sync_enabled: true
    },
    order: [['priority', 'DESC'], ['is_primary', 'DESC'], ['created_at', 'ASC']]
  });
};

CalendarConfig.getOverdueConfigs = async function() {
  const configs = await CalendarConfig.getActiveConfigs();
  return configs.filter(config => config.isOverdue());
};

CalendarConfig.getPrimaryCalendar = async function() {
  return await CalendarConfig.findOne({
    where: {
      is_active: true,
      is_primary: true
    }
  });
};

CalendarConfig.createGoogleCalendarConfig = async function(calendarId, credentials) {
  return await CalendarConfig.create({
    name: 'Google Calendar - Vincanto',
    calendar_type: 'google_calendar',
    provider: 'google',
    calendar_id: calendarId,
    api_credentials: credentials,
    is_primary: true,
    sync_frequency_minutes: 30,
    event_title_template: 'Vincanto - {{booking_number}} - {{guest_name}}',
    event_description_template: `Prenotazione Vincanto
Numero: {{booking_number}}
Ospiti: {{guest_count}} ({{guest_name}})
Check-in: {{check_in}}
Check-out: {{check_out}}
Importo: €{{total_amount}}
Email: {{guest_email}}
Telefono: {{guest_phone}}`
  });
};

CalendarConfig.createAirbnbConfig = async function(icalUrl) {
  return await CalendarConfig.create({
    name: 'Airbnb Calendar',
    calendar_type: 'airbnb',
    provider: 'airbnb',
    ical_url: icalUrl,
    sync_direction: 'import_only',
    sync_frequency_minutes: 120,
    auto_block_imported_dates: true,
    import_confirmed_only: false
  });
};

CalendarConfig.prototype.generateIcalExportUrl = function() {
  // Genera URL pubblico per export iCal
  const baseUrl = process.env.BASE_URL || 'https://vincanto.com';
  const exportUrl = `${baseUrl}/api/calendar/export/${this.id}.ics`;
  
  return this.update({
    ical_export_url: exportUrl
  });
};

module.exports = CalendarConfig;