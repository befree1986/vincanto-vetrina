/**
 * Routes per la gestione dei pagamenti - POSTGRESQL ENTERPRISE
 * Endpoint REST per tracking pagamenti, transazioni e statistiche finanziarie con database
 */

const express = require('express');
const router = express.Router();
const { Payment, Booking } = require('../models');
const { Op } = require('sequelize');

// GET /api/payments - Ottieni tutti i pagamenti con filtri
router.get('/', async (req, res) => {
  try {
    const { 
      status, 
      payment_type,
      method,
      startDate,
      endDate,
      limit = 50, 
      offset = 0 
    } = req.query;
    
    // Costruzione filtri
    let whereClause = {};
    
    if (status) {
      whereClause.status = status;
    }
    
    if (payment_type) {
      whereClause.payment_type = payment_type;
    }
    
    if (method) {
      whereClause.payment_method = method;
    }
    
    if (startDate && endDate) {
      whereClause.created_at = {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      };
    }
    
    // Query database con paginazione
    const { rows: payments, count: total } = await Payment.findAndCountAll({
      where: whereClause,
      include: [{
        model: Booking,
        as: 'booking',
        attributes: ['booking_number', 'guest_first_name', 'guest_last_name', 'guest_email']
      }],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['created_at', 'DESC']]
    });
    
    // Statistiche
    const stats = await Payment.findAll({
      attributes: [
        'status',
        [Payment.sequelize.fn('COUNT', '*'), 'count'],
        [Payment.sequelize.fn('SUM', Payment.sequelize.col('amount')), 'total_amount']
      ],
      group: ['status'],
      raw: true
    });
    
    const formattedStats = {
      total: total,
      completed: stats.find(s => s.status === 'completed')?.count || 0,
      pending: stats.find(s => s.status === 'pending')?.count || 0,
      failed: stats.find(s => s.status === 'failed')?.count || 0,
      refunded: stats.find(s => s.status === 'refunded')?.count || 0,
      totalRevenue: stats.reduce((sum, s) => sum + (parseFloat(s.total_amount) || 0), 0)
    };
    
    res.json({
      success: true,
      data: {
        payments: payments,
        pagination: {
          total: total,
          limit: parseInt(limit),
          offset: parseInt(offset),
          hasMore: (parseInt(offset) + parseInt(limit)) < total
        },
        stats: formattedStats
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Database error in payments route:', error);
    res.status(500).json({
      success: false,
      message: 'Errore nel recupero dei pagamenti dal database',
      error: error.message
    });
  }
});

// GET /api/payments/:paymentId - Ottieni pagamento specifico
router.get('/:paymentId', async (req, res) => {
  try {
    const { paymentId } = req.params;
    
    const payment = await Payment.findByPk(paymentId, {
      include: [{
        model: Booking,
        as: 'booking',
        attributes: ['booking_number', 'guest_first_name', 'guest_last_name', 'guest_email', 'total_amount']
      }]
    });
    
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Pagamento non trovato'
      });
    }
    
    res.json({
      success: true,
      data: payment,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Database error in get payment by ID:', error);
    res.status(500).json({
      success: false,
      message: 'Errore nel recupero del pagamento',
      error: error.message
    });
  }
});

// POST /api/payments - Crea nuovo pagamento
router.post('/', async (req, res) => {
  try {
    const {
      booking_id,
      payment_type,
      amount,
      currency = 'EUR',
      payment_method,
      provider,
      transaction_id,
      external_payment_id,
      guest_name,
      guest_email
    } = req.body;
    
    // Validazione
    if (!booking_id || !payment_type || !amount || !payment_method) {
      return res.status(400).json({
        success: false,
        message: 'Campi obbligatori mancanti',
        required: ['booking_id', 'payment_type', 'amount', 'payment_method']
      });
    }
    
    // Verifica che la prenotazione esista
    const booking = await Booking.findByPk(booking_id);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Prenotazione non trovata'
      });
    }
    
    // Genera numero pagamento
    const paymentNumber = `PAY${Date.now().toString().slice(-6)}`;
    
    // Crea pagamento
    const payment = await Payment.create({
      payment_number: paymentNumber,
      booking_id,
      payment_type,
      amount: parseFloat(amount),
      currency,
      status: 'pending',
      payment_method,
      provider: provider || 'manual',
      transaction_id,
      external_payment_id,
      guest_name: guest_name || `${booking.guest_first_name} ${booking.guest_last_name}`,
      guest_email: guest_email || booking.guest_email
    });
    
    res.status(201).json({
      success: true,
      message: 'Pagamento creato con successo',
      data: payment,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Database error in create payment:', error);
    res.status(500).json({
      success: false,
      message: 'Errore nella creazione del pagamento',
      error: error.message
    });
  }
});

// PATCH /api/payments/:paymentId/status - Aggiorna status pagamento
router.patch('/:paymentId/status', async (req, res) => {
  try {
    const { paymentId } = req.params;
    const { status, transaction_id, processed_at, failure_reason } = req.body;
    
    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Status è obbligatorio'
      });
    }
    
    const payment = await Payment.findByPk(paymentId);
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Pagamento non trovato'
      });
    }
    
    const updateData = { status };
    
    if (transaction_id) {
      updateData.transaction_id = transaction_id;
    }
    
    if (status === 'completed') {
      updateData.processed_at = new Date();
    }
    
    if (status === 'failed' && failure_reason) {
      updateData.failure_reason = failure_reason;
    }
    
    await payment.update(updateData);
    
    res.json({
      success: true,
      message: `Status pagamento aggiornato a: ${status}`,
      data: { 
        status, 
        updated_at: payment.updated_at,
        processed_at: updateData.processed_at 
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Database error in update payment status:', error);
    res.status(500).json({
      success: false,
      message: 'Errore nell\'aggiornamento dello status del pagamento',
      error: error.message
    });
  }
});

// POST /api/payments/:paymentId/refund - Processo di rimborso
router.post('/:paymentId/refund', async (req, res) => {
  try {
    const { paymentId } = req.params;
    const { refund_amount, reason } = req.body;
    
    const payment = await Payment.findByPk(paymentId);
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Pagamento non trovato'
      });
    }
    
    if (payment.status !== 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Può essere rimborsato solo un pagamento completato'
      });
    }
    
    const amount = refund_amount ? parseFloat(refund_amount) : payment.amount;
    
    if (amount > payment.amount) {
      return res.status(400).json({
        success: false,
        message: 'L\'importo del rimborso non può essere superiore al pagamento originale'
      });
    }
    
    // Crea record rimborso
    const refundPayment = await Payment.create({
      payment_number: `REF${Date.now().toString().slice(-6)}`,
      booking_id: payment.booking_id,
      payment_type: 'refund',
      amount: -amount, // Negativo per il rimborso
      currency: payment.currency,
      status: 'completed',
      payment_method: payment.payment_method,
      provider: payment.provider,
      refund_reason: reason,
      original_payment_id: payment.id,
      guest_name: payment.guest_name,
      guest_email: payment.guest_email,
      processed_at: new Date()
    });
    
    // Aggiorna pagamento originale se rimborso totale
    if (amount === payment.amount) {
      await payment.update({ status: 'refunded' });
    }
    
    res.json({
      success: true,
      message: 'Rimborso elaborato con successo',
      data: {
        original_payment: payment,
        refund_payment: refundPayment
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Database error in refund payment:', error);
    res.status(500).json({
      success: false,
      message: 'Errore nell\'elaborazione del rimborso',
      error: error.message
    });
  }
});

// GET /api/payments/stats/dashboard - Statistiche pagamenti per dashboard
router.get('/stats/dashboard', async (req, res) => {
  try {
    const today = new Date();
    const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const thisMonthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 1);
    
    // Revenue del mese corrente
    const monthlyRevenue = await Payment.sum('amount', {
      where: {
        status: 'completed',
        payment_type: { [Op.ne]: 'refund' },
        processed_at: { [Op.between]: [thisMonth, thisMonthEnd] }
      }
    }) || 0;
    
    // Revenue del mese scorso per confronto
    const lastMonthRevenue = await Payment.sum('amount', {
      where: {
        status: 'completed',
        payment_type: { [Op.ne]: 'refund' },
        processed_at: { [Op.between]: [lastMonth, thisMonth] }
      }
    }) || 0;
    
    // Pagamenti del giorno
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);
    
    const todayPayments = await Payment.sum('amount', {
      where: {
        status: 'completed',
        payment_type: { [Op.ne]: 'refund' },
        processed_at: { [Op.between]: [todayStart, todayEnd] }
      }
    }) || 0;
    
    // Statistiche generali
    const totalRevenue = await Payment.sum('amount', {
      where: {
        status: 'completed',
        payment_type: { [Op.ne]: 'refund' }
      }
    }) || 0;
    
    const pendingPayments = await Payment.count({
      where: { status: 'pending' }
    });
    
    const failedPayments = await Payment.count({
      where: { 
        status: 'failed',
        created_at: { [Op.gte]: thisMonth }
      }
    });
    
    // Metodi di pagamento del mese
    const paymentMethods = await Payment.findAll({
      attributes: [
        'payment_method',
        [Payment.sequelize.fn('COUNT', '*'), 'count'],
        [Payment.sequelize.fn('SUM', Payment.sequelize.col('amount')), 'total_amount']
      ],
      where: {
        status: 'completed',
        processed_at: { [Op.gte]: thisMonth }
      },
      group: ['payment_method'],
      raw: true
    });
    
    // Calcolo crescita
    const growthRate = lastMonthRevenue > 0 
      ? (((monthlyRevenue - lastMonthRevenue) / lastMonthRevenue) * 100).toFixed(1)
      : '0';
    
    res.json({
      success: true,
      data: {
        revenue: {
          today: todayPayments,
          thisMonth: monthlyRevenue,
          lastMonth: lastMonthRevenue,
          total: totalRevenue,
          growthRate: parseFloat(growthRate)
        },
        payments: {
          pending: pendingPayments,
          failed: failedPayments
        },
        methods: paymentMethods.map(method => ({
          method: method.payment_method,
          count: parseInt(method.count),
          amount: parseFloat(method.total_amount || 0)
        })),
        period: {
          month: today.toLocaleDateString('it-IT', { month: 'long', year: 'numeric' })
        }
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Database error in payment stats:', error);
    res.status(500).json({
      success: false,
      message: 'Errore nel recupero delle statistiche pagamenti',
      error: error.message
    });
  }
});

// GET /api/payments/reports/monthly/:year/:month - Report mensile dettagliato
router.get('/reports/monthly/:year/:month', async (req, res) => {
  try {
    const { year, month } = req.params;
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);
    
    const payments = await Payment.findAll({
      where: {
        processed_at: { [Op.between]: [startDate, endDate] },
        status: 'completed'
      },
      include: [{
        model: Booking,
        as: 'booking',
        attributes: ['booking_number', 'guest_first_name', 'guest_last_name']
      }],
      order: [['processed_at', 'ASC']]
    });
    
    // Aggregazioni
    const summary = {
      totalRevenue: payments
        .filter(p => p.payment_type !== 'refund')
        .reduce((sum, p) => sum + p.amount, 0),
      totalRefunds: payments
        .filter(p => p.payment_type === 'refund')
        .reduce((sum, p) => sum + Math.abs(p.amount), 0),
      netRevenue: payments.reduce((sum, p) => sum + p.amount, 0),
      transactionCount: payments.length,
      averageTransaction: payments.length > 0 
        ? (payments.reduce((sum, p) => sum + Math.abs(p.amount), 0) / payments.length).toFixed(2)
        : 0
    };
    
    res.json({
      success: true,
      data: {
        period: {
          year: parseInt(year),
          month: parseInt(month),
          monthName: new Date(year, month - 1).toLocaleDateString('it-IT', { month: 'long' })
        },
        payments: payments,
        summary: summary
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Database error in monthly payment report:', error);
    res.status(500).json({
      success: false,
      message: 'Errore nel recupero del report mensile pagamenti',
      error: error.message
    });
  }
});

module.exports = router;