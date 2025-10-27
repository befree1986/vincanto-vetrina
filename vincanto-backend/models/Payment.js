/**
 * Payment Model
 * Modello per i pagamenti e le transazioni
 */

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Payment = sequelize.define('Payment', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  payment_number: {
    type: DataTypes.STRING(20),
    allowNull: false,
    unique: true
  },
  booking_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'bookings',
      key: 'id'
    }
  },
  
  // Tipo e status
  payment_type: {
    type: DataTypes.ENUM(
      'deposit', 'balance', 'full_payment', 'refund', 
      'extra_charge', 'tourist_tax', 'damage_deposit'
    ),
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM(
      'pending', 'processing', 'completed', 'failed', 
      'cancelled', 'refunded', 'partially_refunded'
    ),
    defaultValue: 'pending',
    allowNull: false
  },
  
  // Importi
  amount: {
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
  
  // Metodo di pagamento
  payment_method: {
    type: DataTypes.ENUM(
      'credit_card', 'debit_card', 'bank_transfer', 
      'paypal', 'cash', 'check', 'other'
    ),
    allowNull: false
  },
  payment_provider: {
    type: DataTypes.ENUM(
      'stripe', 'paypal', 'bank', 'cash', 'other'
    ),
    allowNull: false
  },
  
  // Dati transazione
  transaction_id: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  external_transaction_id: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  provider_fee: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.00
  },
  net_amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true // Calcolato automaticamente
  },
  
  // Informazioni carta (se applicabile)
  card_last_four: {
    type: DataTypes.STRING(4),
    allowNull: true
  },
  card_brand: {
    type: DataTypes.STRING(20),
    allowNull: true
  },
  card_country: {
    type: DataTypes.STRING(2),
    allowNull: true
  },
  
  // Date importanti
  processed_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  due_date: {
    type: DataTypes.DATE,
    allowNull: true
  },
  
  // Fatturazione
  invoice_number: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  invoice_sent_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  
  // Rimborsi
  refund_amount: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.00
  },
  refund_reason: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  refunded_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  
  // Metadati
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  internal_notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  metadata: {
    type: DataTypes.JSON, // Dati aggiuntivi provider-specific
    allowNull: true
  },
  
  // Riconciliazione
  reconciled: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  reconciled_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  
  // IP e sicurezza
  client_ip: {
    type: DataTypes.STRING(45), // IPv6 support
    allowNull: true
  },
  user_agent: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  
  // Flags
  is_test_payment: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  requires_action: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
}, {
  tableName: 'payments',
  indexes: [
    {
      unique: true,
      fields: ['payment_number']
    },
    {
      fields: ['booking_id']
    },
    {
      fields: ['status']
    },
    {
      fields: ['payment_type']
    },
    {
      fields: ['payment_method']
    },
    {
      fields: ['processed_at']
    },
    {
      fields: ['transaction_id']
    }
  ],
  hooks: {
    beforeCreate: (payment) => {
      // Genera numero pagamento se non fornito
      if (!payment.payment_number) {
        const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        const random = Math.random().toString(36).substring(2, 6).toUpperCase();
        payment.payment_number = `PAY${date}${random}`;
      }
      
      // Calcola importo netto
      payment.net_amount = payment.amount - payment.provider_fee;
      
      // Set processed_at se completato
      if (payment.status === 'completed' && !payment.processed_at) {
        payment.processed_at = new Date();
      }
    },
    beforeUpdate: (payment) => {
      // Ricalcola importo netto se cambiano amount o provider_fee
      if (payment.changed('amount') || payment.changed('provider_fee')) {
        payment.net_amount = payment.amount - payment.provider_fee;
      }
      
      // Set processed_at quando diventa completed
      if (payment.changed('status') && payment.status === 'completed' && !payment.processed_at) {
        payment.processed_at = new Date();
      }
      
      // Set refunded_at quando diventa refunded
      if (payment.changed('status') && payment.status.includes('refunded') && !payment.refunded_at) {
        payment.refunded_at = new Date();
      }
    }
  }
});

// Metodi di istanza
Payment.prototype.isSuccessful = function() {
  return this.status === 'completed';
};

Payment.prototype.canRefund = function() {
  return this.status === 'completed' && this.refund_amount < this.amount;
};

Payment.prototype.getRemainingRefundAmount = function() {
  return this.amount - this.refund_amount;
};

Payment.prototype.processRefund = async function(refundAmount, reason = '') {
  if (!this.canRefund()) {
    throw new Error('Payment cannot be refunded');
  }
  
  const remainingAmount = this.getRemainingRefundAmount();
  if (refundAmount > remainingAmount) {
    throw new Error('Refund amount exceeds remaining refundable amount');
  }
  
  const newRefundAmount = this.refund_amount + refundAmount;
  const newStatus = newRefundAmount >= this.amount ? 'refunded' : 'partially_refunded';
  
  return await this.update({
    refund_amount: newRefundAmount,
    status: newStatus,
    refund_reason: reason,
    refunded_at: new Date()
  });
};

Payment.prototype.markAsReconciled = async function() {
  return await this.update({
    reconciled: true,
    reconciled_at: new Date()
  });
};

// Metodi statici
Payment.findByBooking = async function(bookingId) {
  return await Payment.findAll({
    where: { booking_id: bookingId },
    order: [['created_at', 'DESC']]
  });
};

Payment.getRevenueByPeriod = async function(startDate, endDate, groupBy = 'day') {
  const dateFormat = {
    day: '%Y-%m-%d',
    week: '%Y-%u',
    month: '%Y-%m',
    year: '%Y'
  };
  
  const results = await sequelize.query(`
    SELECT 
      strftime('${dateFormat[groupBy]}', processed_at) as period,
      COUNT(*) as transaction_count,
      SUM(CASE WHEN status = 'completed' THEN amount ELSE 0 END) as gross_revenue,
      SUM(CASE WHEN status = 'completed' THEN net_amount ELSE 0 END) as net_revenue,
      SUM(CASE WHEN status = 'refunded' OR status = 'partially_refunded' THEN refund_amount ELSE 0 END) as refunds,
      SUM(CASE WHEN status = 'completed' THEN provider_fee ELSE 0 END) as total_fees
    FROM payments 
    WHERE processed_at BETWEEN ? AND ?
    GROUP BY period
    ORDER BY period
  `, {
    replacements: [startDate, endDate],
    type: sequelize.QueryTypes.SELECT
  });
  
  return results;
};

Payment.getPaymentMethodStats = async function(startDate, endDate) {
  const results = await sequelize.query(`
    SELECT 
      payment_method,
      COUNT(*) as transaction_count,
      SUM(CASE WHEN status = 'completed' THEN amount ELSE 0 END) as total_amount,
      AVG(CASE WHEN status = 'completed' THEN amount ELSE NULL END) as avg_amount
    FROM payments 
    WHERE processed_at BETWEEN ? AND ?
    AND status = 'completed'
    GROUP BY payment_method
    ORDER BY total_amount DESC
  `, {
    replacements: [startDate, endDate],
    type: sequelize.QueryTypes.SELECT
  });
  
  return results;
};

Payment.getPendingPayments = async function() {
  return await Payment.findAll({
    where: {
      status: 'pending',
      due_date: {
        [sequelize.Sequelize.Op.lte]: new Date()
      }
    },
    include: [{
      model: sequelize.models.Booking,
      as: 'booking'
    }],
    order: [['due_date', 'ASC']]
  });
};

module.exports = Payment;