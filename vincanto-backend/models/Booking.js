/**
 * Booking Model
 * Modello per le prenotazioni
 */

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Booking = sequelize.define('Booking', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  booking_number: {
    type: DataTypes.STRING(20),
    allowNull: false,
    unique: true
  },
  status: {
    type: DataTypes.ENUM(
      'pending', 'confirmed', 'checked_in', 'checked_out', 
      'completed', 'cancelled', 'no_show'
    ),
    defaultValue: 'pending',
    allowNull: false
  },
  
  // Informazioni ospite
  guest_first_name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  guest_last_name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  guest_email: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      isEmail: true,
      notEmpty: true
    }
  },
  guest_phone: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  guest_nationality: {
    type: DataTypes.STRING(3), // Codice ISO paese
    defaultValue: 'IT',
    allowNull: false
  },
  guest_document_type: {
    type: DataTypes.ENUM('passport', 'id_card', 'driving_license'),
    allowNull: true
  },
  guest_document_number: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  
  // Dettagli soggiorno
  check_in_date: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  check_out_date: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  nights: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 1,
      max: 365
    }
  },
  num_adults: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 1,
      max: 10
    }
  },
  num_children: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    allowNull: false,
    validate: {
      min: 0,
      max: 10
    }
  },
  children_ages: {
    type: DataTypes.JSON, // Array di età bambini
    allowNull: true
  },
  total_guests: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 1,
      max: 20
    }
  },
  
  // Servizi aggiuntivi
  parking_requested: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  parking_nights: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  
  // Prezzi e pagamenti
  base_price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: 0
    }
  },
  extra_guest_fee: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.00
  },
  cleaning_fee: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.00
  },
  tourist_tax: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.00
  },
  parking_fee: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.00
  },
  discount_amount: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.00
  },
  total_amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  deposit_amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  balance_amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  currency: {
    type: DataTypes.STRING(3),
    defaultValue: 'EUR',
    allowNull: false
  },
  
  // Pagamenti
  payment_status: {
    type: DataTypes.ENUM(
      'pending', 'deposit_paid', 'fully_paid', 'refunded', 'partially_refunded'
    ),
    defaultValue: 'pending'
  },
  deposit_paid_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  balance_paid_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  
  // Canale di prenotazione
  booking_source: {
    type: DataTypes.ENUM(
      'direct', 'airbnb', 'booking', 'expedia', 'vrbo', 'other'
    ),
    defaultValue: 'direct'
  },
  external_booking_id: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  
  // Note e richieste speciali
  special_requests: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  internal_notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  
  // Check-in/out
  check_in_time: {
    type: DataTypes.TIME,
    allowNull: true
  },
  check_out_time: {
    type: DataTypes.TIME,
    allowNull: true
  },
  actual_check_in: {
    type: DataTypes.DATE,
    allowNull: true
  },
  actual_check_out: {
    type: DataTypes.DATE,
    allowNull: true
  },
  
  // Cancellazione
  cancelled_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  cancellation_reason: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  
  // Google Calendar
  google_event_id: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  synced_with_calendar: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  last_calendar_sync: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'bookings',
  indexes: [
    {
      unique: true,
      fields: ['booking_number']
    },
    {
      fields: ['guest_email']
    },
    {
      fields: ['check_in_date', 'check_out_date']
    },
    {
      fields: ['status']
    },
    {
      fields: ['booking_source']
    },
    {
      fields: ['created_at']
    }
  ],
  hooks: {
    beforeCreate: (booking) => {
      // Genera numero prenotazione se non fornito
      if (!booking.booking_number) {
        const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        const random = Math.random().toString(36).substring(2, 8).toUpperCase();
        booking.booking_number = `VIN${date}${random}`;
      }
      
      // Calcola numero notti
      const checkIn = new Date(booking.check_in_date);
      const checkOut = new Date(booking.check_out_date);
      booking.nights = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));
      
      // Calcola totale ospiti
      booking.total_guests = booking.num_adults + booking.num_children;
      
      // Calcola importo balance
      booking.balance_amount = booking.total_amount - booking.deposit_amount;
    },
    beforeUpdate: (booking) => {
      if (booking.changed('check_in_date') || booking.changed('check_out_date')) {
        const checkIn = new Date(booking.check_in_date);
        const checkOut = new Date(booking.check_out_date);
        booking.nights = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));
      }
      
      if (booking.changed('num_adults') || booking.changed('num_children')) {
        booking.total_guests = booking.num_adults + booking.num_children;
      }
      
      if (booking.changed('total_amount') || booking.changed('deposit_amount')) {
        booking.balance_amount = booking.total_amount - booking.deposit_amount;
      }
    }
  }
});

// Metodi di istanza
Booking.prototype.isActive = function() {
  return ['confirmed', 'checked_in'].includes(this.status);
};

Booking.prototype.canModify = function() {
  return ['pending', 'confirmed'].includes(this.status);
};

Booking.prototype.canCancel = function() {
  const now = new Date();
  const checkIn = new Date(this.check_in_date);
  const daysDiff = (checkIn - now) / (1000 * 60 * 60 * 24);
  
  return this.canModify() && daysDiff >= 1; // Almeno 1 giorno prima
};

Booking.prototype.calculateRefund = function(cancelDate = new Date()) {
  const checkIn = new Date(this.check_in_date);
  const daysDiff = (checkIn - cancelDate) / (1000 * 60 * 60 * 24);
  
  if (daysDiff >= 7) {
    return this.total_amount * 0.9; // 90% refund
  } else if (daysDiff >= 3) {
    return this.total_amount * 0.5; // 50% refund
  } else {
    return 0; // No refund
  }
};

Booking.prototype.markAsPaid = async function(paymentType = 'full') {
  const updates = {};
  
  if (paymentType === 'deposit') {
    updates.payment_status = 'deposit_paid';
    updates.deposit_paid_at = new Date();
  } else if (paymentType === 'balance') {
    updates.payment_status = 'fully_paid';
    updates.balance_paid_at = new Date();
    if (this.status === 'pending') {
      updates.status = 'confirmed';
    }
  } else if (paymentType === 'full') {
    updates.payment_status = 'fully_paid';
    updates.deposit_paid_at = new Date();
    updates.balance_paid_at = new Date();
    if (this.status === 'pending') {
      updates.status = 'confirmed';
    }
  }
  
  return await this.update(updates);
};

// Metodi statici
Booking.findByDateRange = async function(startDate, endDate, includeStatus = []) {
  const whereClause = {
    [sequelize.Sequelize.Op.or]: [
      {
        check_in_date: {
          [sequelize.Sequelize.Op.between]: [startDate, endDate]
        }
      },
      {
        check_out_date: {
          [sequelize.Sequelize.Op.between]: [startDate, endDate]
        }
      },
      {
        [sequelize.Sequelize.Op.and]: [
          {
            check_in_date: {
              [sequelize.Sequelize.Op.lte]: startDate
            }
          },
          {
            check_out_date: {
              [sequelize.Sequelize.Op.gte]: endDate
            }
          }
        ]
      }
    ]
  };
  
  if (includeStatus.length > 0) {
    whereClause.status = {
      [sequelize.Sequelize.Op.in]: includeStatus
    };
  }
  
  return await Booking.findAll({
    where: whereClause,
    order: [['check_in_date', 'ASC']]
  });
};

Booking.getOccupancyRate = async function(year, month) {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0);
  const daysInMonth = endDate.getDate();
  
  const bookings = await Booking.findByDateRange(
    startDate.toISOString().slice(0, 10),
    endDate.toISOString().slice(0, 10),
    ['confirmed', 'checked_in', 'checked_out', 'completed']
  );
  
  let occupiedDays = 0;
  bookings.forEach(booking => {
    const checkIn = new Date(booking.check_in_date);
    const checkOut = new Date(booking.check_out_date);
    
    // Calcola giorni occupati nel mese
    const monthStart = Math.max(checkIn, startDate);
    const monthEnd = Math.min(checkOut, endDate);
    
    if (monthStart < monthEnd) {
      occupiedDays += Math.ceil((monthEnd - monthStart) / (1000 * 60 * 60 * 24));
    }
  });
  
  return (occupiedDays / daysInMonth * 100).toFixed(2);
};

Booking.getBookingStats = async function() {
  const results = await sequelize.query(`
    SELECT 
      status,
      COUNT(*) as count,
      SUM(total_amount) as total_amount
    FROM bookings 
    GROUP BY status
    ORDER BY count DESC
  `, {
    type: sequelize.QueryTypes.SELECT
  });
  
  return results;
};

module.exports = Booking;