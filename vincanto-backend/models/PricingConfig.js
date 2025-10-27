/**
 * PricingConfig Model
 * Modello per la configurazione dei prezzi stagionali e delle regole tariffarie
 */

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const PricingConfig = sequelize.define('PricingConfig', {
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
  
  // Tipo configurazione
  config_type: {
    type: DataTypes.ENUM(
      'base_rate', 'seasonal_rate', 'length_of_stay', 
      'occupancy_discount', 'last_minute', 'early_bird',
      'weekend_surcharge', 'holiday_surcharge', 'special_event'
    ),
    allowNull: false
  },
  
  // Prezzi base
  base_price_per_night: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: 0
    }
  },
  currency: {
    type: DataTypes.STRING(3),
    defaultValue: 'EUR',
    allowNull: false
  },
  
  // Prezzi per numero di ospiti
  price_per_adult: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.00
  },
  price_per_child: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.00
  },
  max_guests_included: {
    type: DataTypes.INTEGER,
    defaultValue: 2,
    validate: {
      min: 1,
      max: 20
    }
  },
  
  // Soglie permanenza
  min_stay_nights: {
    type: DataTypes.INTEGER,
    defaultValue: 1,
    validate: {
      min: 1
    }
  },
  max_stay_nights: {
    type: DataTypes.INTEGER,
    defaultValue: 365,
    validate: {
      min: 1
    }
  },
  
  // Periodo di validità
  valid_from: {
    type: DataTypes.DATE,
    allowNull: false
  },
  valid_to: {
    type: DataTypes.DATE,
    allowNull: false,
    validate: {
      isAfterFrom(value) {
        if (value <= this.valid_from) {
          throw new Error('valid_to must be after valid_from');
        }
      }
    }
  },
  
  // Giorni della settimana (bitmask: 1=Lun, 2=Mar, 4=Mer, 8=Gio, 16=Ven, 32=Sab, 64=Dom)
  applicable_days: {
    type: DataTypes.INTEGER,
    defaultValue: 127, // Tutti i giorni
    validate: {
      min: 1,
      max: 127
    }
  },
  
  // Sconti per durata soggiorno
  weekly_discount_percent: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 0.00,
    validate: {
      min: 0,
      max: 100
    }
  },
  monthly_discount_percent: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 0.00,
    validate: {
      min: 0,
      max: 100
    }
  },
  
  // Sconti per prenotazione anticipata/last minute
  early_bird_days: {
    type: DataTypes.INTEGER,
    defaultValue: 0 // Giorni in anticipo per sconto early bird
  },
  early_bird_discount_percent: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 0.00,
    validate: {
      min: 0,
      max: 100
    }
  },
  last_minute_days: {
    type: DataTypes.INTEGER,
    defaultValue: 0 // Giorni massimi per sconto last minute
  },
  last_minute_discount_percent: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 0.00,
    validate: {
      min: 0,
      max: 100
    }
  },
  
  // Maggiorazioni
  weekend_surcharge_percent: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 0.00,
    validate: {
      min: 0,
      max: 500
    }
  },
  holiday_surcharge_percent: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 0.00,
    validate: {
      min: 0,
      max: 500
    }
  },
  
  // Costi aggiuntivi
  cleaning_fee: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.00
  },
  tourist_tax_per_person_per_night: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.00
  },
  security_deposit: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.00
  },
  
  // Tasse e commissioni
  tax_rate_percent: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 0.00,
    validate: {
      min: 0,
      max: 100
    }
  },
  service_fee_percent: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 0.00,
    validate: {
      min: 0,
      max: 100
    }
  },
  
  // Regole di cancellazione
  cancellation_policy: {
    type: DataTypes.ENUM(
      'flexible', 'moderate', 'strict', 'super_strict', 'custom'
    ),
    defaultValue: 'moderate'
  },
  cancellation_free_days: {
    type: DataTypes.INTEGER,
    defaultValue: 7 // Giorni prima del check-in per cancellazione gratuita
  },
  cancellation_penalty_percent: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 50.00,
    validate: {
      min: 0,
      max: 100
    }
  },
  
  // Metadati
  priority: {
    type: DataTypes.INTEGER,
    defaultValue: 0 // Priorità per conflitti di regole
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  tags: {
    type: DataTypes.JSON, // Array di tag per categorizzazione
    allowNull: true
  },
  conditions: {
    type: DataTypes.JSON, // Condizioni aggiuntive personalizzate
    allowNull: true
  }
}, {
  tableName: 'pricing_configs',
  indexes: [
    {
      fields: ['config_type']
    },
    {
      fields: ['valid_from', 'valid_to']
    },
    {
      fields: ['is_active']
    },
    {
      fields: ['priority']
    },
    {
      fields: ['name']
    }
  ],
  validate: {
    // Validazione a livello di modello
    validStayRange() {
      if (this.min_stay_nights > this.max_stay_nights) {
        throw new Error('min_stay_nights cannot be greater than max_stay_nights');
      }
    }
  }
});

// Metodi di istanza
PricingConfig.prototype.isValidForDate = function(date) {
  const checkDate = new Date(date);
  return checkDate >= this.valid_from && checkDate <= this.valid_to;
};

PricingConfig.prototype.isValidForDayOfWeek = function(dayOfWeek) {
  // dayOfWeek: 0=Dom, 1=Lun, ..., 6=Sab
  // Converti a bitmask: 1=Lun, 2=Mar, ..., 64=Dom
  const bitPosition = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // 0-6 -> 0-6 con Dom=6
  const dayBit = Math.pow(2, bitPosition);
  return (this.applicable_days & dayBit) > 0;
};

PricingConfig.prototype.calculatePrice = function(checkIn, checkOut, guests = 2, bookingDate = new Date()) {
  const nights = Math.ceil((new Date(checkOut) - new Date(checkIn)) / (1000 * 60 * 60 * 24));
  
  if (nights < this.min_stay_nights || nights > this.max_stay_nights) {
    throw new Error(`Stay must be between ${this.min_stay_nights} and ${this.max_stay_nights} nights`);
  }
  
  let totalPrice = 0;
  let basePrice = this.base_price_per_night * nights;
  
  // Costo ospiti aggiuntivi
  const extraAdults = Math.max(0, guests - this.max_guests_included);
  const adultsSurcharge = extraAdults * this.price_per_adult * nights;
  
  // Prezzo base + ospiti aggiuntivi
  totalPrice = basePrice + adultsSurcharge;
  
  // Sconti per durata
  if (nights >= 28) {
    totalPrice *= (1 - this.monthly_discount_percent / 100);
  } else if (nights >= 7) {
    totalPrice *= (1 - this.weekly_discount_percent / 100);
  }
  
  // Sconto early bird
  const daysInAdvance = Math.ceil((new Date(checkIn) - bookingDate) / (1000 * 60 * 60 * 24));
  if (this.early_bird_days > 0 && daysInAdvance >= this.early_bird_days) {
    totalPrice *= (1 - this.early_bird_discount_percent / 100);
  }
  
  // Sconto last minute
  if (this.last_minute_days > 0 && daysInAdvance <= this.last_minute_days) {
    totalPrice *= (1 - this.last_minute_discount_percent / 100);
  }
  
  // Maggiorazioni weekend (Sab-Dom)
  let weekendNights = 0;
  for (let d = new Date(checkIn); d < new Date(checkOut); d.setDate(d.getDate() + 1)) {
    const dayOfWeek = d.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) { // Dom o Sab
      weekendNights++;
    }
  }
  const weekendSurcharge = (this.base_price_per_night * weekendNights * this.weekend_surcharge_percent) / 100;
  totalPrice += weekendSurcharge;
  
  // Costi fissi
  totalPrice += this.cleaning_fee;
  totalPrice += (this.tourist_tax_per_person_per_night * guests * nights);
  
  // Tasse
  const taxAmount = (totalPrice * this.tax_rate_percent) / 100;
  const serviceAmount = (totalPrice * this.service_fee_percent) / 100;
  
  return {
    base_price: basePrice,
    guests_surcharge: adultsSurcharge,
    weekend_surcharge: weekendSurcharge,
    cleaning_fee: this.cleaning_fee,
    tourist_tax: this.tourist_tax_per_person_per_night * guests * nights,
    tax_amount: taxAmount,
    service_fee: serviceAmount,
    security_deposit: this.security_deposit,
    subtotal: totalPrice,
    total: totalPrice + taxAmount + serviceAmount,
    nights: nights,
    rate_per_night: totalPrice / nights
  };
};

PricingConfig.prototype.getCancellationPolicy = function() {
  const policies = {
    flexible: {
      free_days: 1,
      penalty_percent: 0,
      description: 'Cancellazione gratuita fino a 24 ore prima'
    },
    moderate: {
      free_days: 5,
      penalty_percent: 50,
      description: 'Cancellazione gratuita fino a 5 giorni prima, poi 50% di penale'
    },
    strict: {
      free_days: 14,
      penalty_percent: 50,
      description: 'Cancellazione gratuita fino a 14 giorni prima, poi 50% di penale'
    },
    super_strict: {
      free_days: 30,
      penalty_percent: 100,
      description: 'Cancellazione gratuita fino a 30 giorni prima, poi 100% di penale'
    },
    custom: {
      free_days: this.cancellation_free_days,
      penalty_percent: this.cancellation_penalty_percent,
      description: `Cancellazione gratuita fino a ${this.cancellation_free_days} giorni prima, poi ${this.cancellation_penalty_percent}% di penale`
    }
  };
  
  return policies[this.cancellation_policy];
};

// Metodi statici
PricingConfig.getActiveConfigs = async function(date = new Date()) {
  return await PricingConfig.findAll({
    where: {
      is_active: true,
      valid_from: { [sequelize.Sequelize.Op.lte]: date },
      valid_to: { [sequelize.Sequelize.Op.gte]: date }
    },
    order: [['priority', 'DESC'], ['created_at', 'DESC']]
  });
};

PricingConfig.findBestRate = async function(checkIn, checkOut, guests = 2, bookingDate = new Date()) {
  const configs = await PricingConfig.getActiveConfigs(checkIn);
  
  let bestConfig = null;
  let bestPrice = null;
  
  for (const config of configs) {
    try {
      if (config.isValidForDate(checkIn) && config.isValidForDate(checkOut)) {
        const pricing = config.calculatePrice(checkIn, checkOut, guests, bookingDate);
        
        if (!bestPrice || pricing.total < bestPrice.total) {
          bestConfig = config;
          bestPrice = pricing;
        }
      }
    } catch (error) {
      // Skip incompatible configurations (e.g., min_stay violations)
      continue;
    }
  }
  
  return bestConfig ? { config: bestConfig, pricing: bestPrice } : null;
};

PricingConfig.createSeasonalRates = async function() {
  const currentYear = new Date().getFullYear();
  
  const rates = [
    {
      name: 'Estate Alta Stagione',
      config_type: 'seasonal_rate',
      base_price_per_night: 180.00,
      valid_from: new Date(`${currentYear}-07-01`),
      valid_to: new Date(`${currentYear}-08-31`),
      min_stay_nights: 7,
      weekend_surcharge_percent: 20,
      weekly_discount_percent: 10
    },
    {
      name: 'Primavera/Autunno',
      config_type: 'seasonal_rate',
      base_price_per_night: 120.00,
      valid_from: new Date(`${currentYear}-04-01`),
      valid_to: new Date(`${currentYear}-06-30`),
      min_stay_nights: 3,
      weekly_discount_percent: 15
    },
    {
      name: 'Bassa Stagione',
      config_type: 'seasonal_rate',
      base_price_per_night: 80.00,
      valid_from: new Date(`${currentYear}-11-01`),
      valid_to: new Date(`${currentYear + 1}-03-31`),
      min_stay_nights: 2,
      weekly_discount_percent: 20,
      monthly_discount_percent: 30
    }
  ];
  
  return await PricingConfig.bulkCreate(rates);
};

module.exports = PricingConfig;