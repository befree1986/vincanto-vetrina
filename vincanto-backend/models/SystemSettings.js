/**
 * SystemSettings Model
 * Modello per le configurazioni generali del sistema
 */

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const SystemSettings = sequelize.define('SystemSettings', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  
  // Chiave univoca per il setting
  setting_key: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true
  },
  
  // Valore del setting
  setting_value: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  
  // Tipo di dato
  data_type: {
    type: DataTypes.ENUM(
      'string', 'number', 'boolean', 'json', 'date', 'email', 'url', 'password'
    ),
    defaultValue: 'string',
    allowNull: false
  },
  
  // Metadati
  category: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  label: {
    type: DataTypes.STRING(200),
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  
  // Validazione
  is_required: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  validation_rules: {
    type: DataTypes.JSON, // Regole di validazione personalizzate
    allowNull: true
  },
  default_value: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  
  // Sicurezza
  is_encrypted: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  is_sensitive: {
    type: DataTypes.BOOLEAN,
    defaultValue: false // Per nascondere in logs/export
  },
  
  // UI
  input_type: {
    type: DataTypes.ENUM(
      'text', 'textarea', 'number', 'email', 'url', 'password', 
      'checkbox', 'select', 'radio', 'date', 'datetime', 'file'
    ),
    defaultValue: 'text'
  },
  options: {
    type: DataTypes.JSON, // Per select/radio options
    allowNull: true
  },
  placeholder: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  help_text: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  
  // Organizzazione
  section: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  sort_order: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  
  // Stato
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  is_readonly: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  
  // Audit
  last_updated_by: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    }
  }
}, {
  tableName: 'system_settings',
  indexes: [
    {
      unique: true,
      fields: ['setting_key']
    },
    {
      fields: ['category']
    },
    {
      fields: ['section']
    },
    {
      fields: ['is_active']
    }
  ]
});

// Metodi di istanza
SystemSettings.prototype.getParsedValue = function() {
  if (!this.setting_value) return this.getDefaultValue();
  
  try {
    switch (this.data_type) {
      case 'boolean':
        return this.setting_value === 'true' || this.setting_value === '1';
      case 'number':
        return parseFloat(this.setting_value);
      case 'json':
        return JSON.parse(this.setting_value);
      case 'date':
        return new Date(this.setting_value);
      default:
        return this.setting_value;
    }
  } catch (error) {
    console.error(`Error parsing setting ${this.setting_key}:`, error);
    return this.getDefaultValue();
  }
};

SystemSettings.prototype.getDefaultValue = function() {
  if (!this.default_value) return null;
  
  try {
    switch (this.data_type) {
      case 'boolean':
        return this.default_value === 'true' || this.default_value === '1';
      case 'number':
        return parseFloat(this.default_value);
      case 'json':
        return JSON.parse(this.default_value);
      case 'date':
        return new Date(this.default_value);
      default:
        return this.default_value;
    }
  } catch (error) {
    return null;
  }
};

SystemSettings.prototype.setValue = async function(value, updatedBy = null) {
  let stringValue;
  
  switch (this.data_type) {
    case 'boolean':
      stringValue = value ? 'true' : 'false';
      break;
    case 'json':
      stringValue = JSON.stringify(value);
      break;
    case 'date':
      stringValue = value instanceof Date ? value.toISOString() : value;
      break;
    default:
      stringValue = String(value);
  }
  
  return await this.update({
    setting_value: stringValue,
    last_updated_by: updatedBy
  });
};

SystemSettings.prototype.validate = function(value) {
  const errors = [];
  
  // Required check
  if (this.is_required && (value === null || value === undefined || value === '')) {
    errors.push('This setting is required');
  }
  
  // Type validation
  switch (this.data_type) {
    case 'email':
      if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        errors.push('Invalid email format');
      }
      break;
    case 'url':
      if (value && !/^https?:\/\/.+/.test(value)) {
        errors.push('Invalid URL format');
      }
      break;
    case 'number':
      if (value && isNaN(parseFloat(value))) {
        errors.push('Must be a valid number');
      }
      break;
  }
  
  // Custom validation rules
  if (this.validation_rules) {
    if (this.validation_rules.min && parseFloat(value) < this.validation_rules.min) {
      errors.push(`Value must be at least ${this.validation_rules.min}`);
    }
    if (this.validation_rules.max && parseFloat(value) > this.validation_rules.max) {
      errors.push(`Value must be at most ${this.validation_rules.max}`);
    }
    if (this.validation_rules.minLength && String(value).length < this.validation_rules.minLength) {
      errors.push(`Must be at least ${this.validation_rules.minLength} characters`);
    }
    if (this.validation_rules.maxLength && String(value).length > this.validation_rules.maxLength) {
      errors.push(`Must be at most ${this.validation_rules.maxLength} characters`);
    }
    if (this.validation_rules.pattern && !new RegExp(this.validation_rules.pattern).test(value)) {
      errors.push('Invalid format');
    }
  }
  
  return errors;
};

// Metodi statici
SystemSettings.get = async function(key, defaultValue = null) {
  const setting = await SystemSettings.findOne({
    where: { setting_key: key, is_active: true }
  });
  
  if (!setting) return defaultValue;
  return setting.getParsedValue();
};

SystemSettings.set = async function(key, value, updatedBy = null) {
  const setting = await SystemSettings.findOne({
    where: { setting_key: key }
  });
  
  if (!setting) {
    throw new Error(`Setting '${key}' not found`);
  }
  
  const errors = setting.validate(value);
  if (errors.length > 0) {
    throw new Error(`Validation failed: ${errors.join(', ')}`);
  }
  
  return await setting.setValue(value, updatedBy);
};

SystemSettings.getByCategory = async function(category) {
  const settings = await SystemSettings.findAll({
    where: { 
      category: category,
      is_active: true 
    },
    order: [['section', 'ASC'], ['sort_order', 'ASC'], ['label', 'ASC']]
  });
  
  const result = {};
  settings.forEach(setting => {
    result[setting.setting_key] = setting.getParsedValue();
  });
  
  return result;
};

SystemSettings.getAllForUI = async function() {
  const settings = await SystemSettings.findAll({
    where: { is_active: true },
    attributes: [
      'id', 'setting_key', 'setting_value', 'data_type', 'category',
      'label', 'description', 'is_required', 'default_value', 'input_type',
      'options', 'placeholder', 'help_text', 'section', 'sort_order',
      'is_readonly', 'is_sensitive'
    ],
    order: [
      ['category', 'ASC'],
      ['section', 'ASC'],
      ['sort_order', 'ASC'],
      ['label', 'ASC']
    ]
  });
  
  const grouped = {};
  settings.forEach(setting => {
    if (!grouped[setting.category]) {
      grouped[setting.category] = {};
    }
    if (!grouped[setting.category][setting.section || 'general']) {
      grouped[setting.category][setting.section || 'general'] = [];
    }
    
    const settingData = setting.toJSON();
    settingData.parsed_value = setting.getParsedValue();
    
    // Nascondi valori sensibili
    if (setting.is_sensitive) {
      settingData.setting_value = '***';
    }
    
    grouped[setting.category][setting.section || 'general'].push(settingData);
  });
  
  return grouped;
};

SystemSettings.initializeDefaults = async function() {
  const defaults = [
    // Configurazioni generali
    {
      setting_key: 'site_name',
      category: 'general',
      section: 'basic',
      label: 'Nome Sito',
      description: 'Nome del sito web',
      setting_value: 'Vincanto Maori',
      data_type: 'string',
      is_required: true,
      sort_order: 1
    },
    {
      setting_key: 'site_url',
      category: 'general',
      section: 'basic',
      label: 'URL Sito',
      description: 'URL principale del sito',
      setting_value: 'https://www.vincantomaori.it',
      data_type: 'url',
      is_required: true,
      sort_order: 2
    },
    {
      setting_key: 'contact_email',
      category: 'general',
      section: 'contact',
      label: 'Email di Contatto',
      description: 'Email principale per contatti',
      setting_value: 'info@vincantomaori.it',
      data_type: 'email',
      is_required: true,
      sort_order: 3
    },
    {
      setting_key: 'phone',
      category: 'general',
      section: 'contact',
      label: 'Telefono',
      description: 'Numero di telefono principale',
      setting_value: '+39 123 456 7890',
      data_type: 'string',
      sort_order: 4
    },
    
    // Configurazioni booking
    {
      setting_key: 'min_booking_days',
      category: 'booking',
      section: 'rules',
      label: 'Soggiorno Minimo',
      description: 'Numero minimo di giorni per prenotazione',
      setting_value: '2',
      default_value: '2',
      data_type: 'number',
      validation_rules: JSON.stringify({ min: 1, max: 30 }),
      sort_order: 1
    },
    {
      setting_key: 'max_booking_days',
      category: 'booking',
      section: 'rules',
      label: 'Soggiorno Massimo',
      description: 'Numero massimo di giorni per prenotazione',
      setting_value: '30',
      default_value: '30',
      data_type: 'number',
      validation_rules: JSON.stringify({ min: 1, max: 365 }),
      sort_order: 2
    },
    {
      setting_key: 'advance_booking_days',
      category: 'booking',
      section: 'rules',
      label: 'Prenotazione Anticipo',
      description: 'Giorni massimi di anticipo per prenotazioni',
      setting_value: '365',
      default_value: '365',
      data_type: 'number',
      sort_order: 3
    },
    
    // Configurazioni email
    {
      setting_key: 'smtp_host',
      category: 'email',
      section: 'smtp',
      label: 'SMTP Host',
      setting_value: 'smtp.gmail.com',
      data_type: 'string',
      is_required: true,
      sort_order: 1
    },
    {
      setting_key: 'smtp_port',
      category: 'email',
      section: 'smtp',
      label: 'SMTP Port',
      setting_value: '587',
      data_type: 'number',
      sort_order: 2
    },
    {
      setting_key: 'smtp_secure',
      category: 'email',
      section: 'smtp',
      label: 'SMTP Secure',
      setting_value: 'false',
      data_type: 'boolean',
      input_type: 'checkbox',
      sort_order: 3
    },
    
    // Configurazioni payment
    {
      setting_key: 'stripe_enabled',
      category: 'payment',
      section: 'providers',
      label: 'Abilita Stripe',
      setting_value: 'false',
      data_type: 'boolean',
      input_type: 'checkbox',
      sort_order: 1
    },
    {
      setting_key: 'paypal_enabled',
      category: 'payment',
      section: 'providers',
      label: 'Abilita PayPal',
      setting_value: 'false',
      data_type: 'boolean',
      input_type: 'checkbox',
      sort_order: 2
    },
    
    // Configurazioni sistema
    {
      setting_key: 'maintenance_mode',
      category: 'system',
      section: 'status',
      label: 'Modalità Manutenzione',
      description: 'Attiva la modalità manutenzione',
      setting_value: 'false',
      data_type: 'boolean',
      input_type: 'checkbox',
      sort_order: 1
    },
    {
      setting_key: 'debug_mode',
      category: 'system',
      section: 'debug',
      label: 'Modalità Debug',
      description: 'Attiva i log di debug',
      setting_value: 'false',
      data_type: 'boolean',
      input_type: 'checkbox',
      sort_order: 2
    }
  ];
  
  // Inserisci solo i settings che non esistono già
  for (const setting of defaults) {
    const existing = await SystemSettings.findOne({
      where: { setting_key: setting.setting_key }
    });
    
    if (!existing) {
      await SystemSettings.create(setting);
    }
  }
  
  return defaults.length;
};

module.exports = SystemSettings;