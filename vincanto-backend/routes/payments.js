/**
 * Routes per la gestione dei pagamenti
 * Endpoint REST per tracking pagamenti, transazioni e statistiche finanziarie
 */

const express = require('express');
const router = express.Router();

// Storage temporaneo per transazioni pagamenti
let payments = [
  {
    id: 'pay_001',
    bookingId: 'book_001',
    type: 'deposit', // deposit, balance, full, refund
    amount: 117.6,
    currency: 'EUR',
    status: 'completed', // pending, completed, failed, refunded
    method: 'card', // card, bank_transfer, cash, paypal
    provider: 'stripe', // stripe, paypal, manual
    transactionId: 'txn_1234567890',
    guestInfo: {
      email: 'mario.rossi@email.com',
      name: 'Mario Rossi'
    },
    metadata: {
      cardLast4: '1234',
      cardBrand: 'visa',
      receiptUrl: 'https://example.com/receipt/pay_001'
    },
    createdAt: '2024-11-01T10:00:00Z',
    processedAt: '2024-11-01T10:01:00Z',
    updatedAt: '2024-11-01T10:01:00Z'
  }
];

// Storage per configurazioni pagamento
let paymentConfigs = {
  providers: {
    stripe: {
      enabled: true,
      publicKey: 'pk_test_...',
      webhookSecret: 'whsec_...',
      currency: 'EUR'
    },
    paypal: {
      enabled: false,
      clientId: '',
      clientSecret: '',
      mode: 'sandbox'
    }
  },
  settings: {
    depositPercentage: 30,
    allowedMethods: ['card', 'bank_transfer'],
    autoCapture: true,
    refundPolicy: 'flexible',
    currency: 'EUR'
  },
  fees: {
    cardProcessingFee: 2.9, // percentuale
    fixedFee: 0.30, // importo fisso
    internationalFee: 1.4 // percentuale aggiuntiva per carte internazionali
  }
};

// GET /api/payments - Ottieni tutti i pagamenti con filtri
router.get('/', (req, res) => {
  try {
    const { 
      status, 
      type, 
      bookingId, 
      fromDate, 
      toDate,
      method,
      limit = 50, 
      offset = 0 
    } = req.query;
    
    let filteredPayments = [...payments];
    
    // Applica filtri
    if (status) {
      filteredPayments = filteredPayments.filter(p => p.status === status);
    }
    
    if (type) {
      filteredPayments = filteredPayments.filter(p => p.type === type);
    }
    
    if (bookingId) {
      filteredPayments = filteredPayments.filter(p => p.bookingId === bookingId);
    }
    
    if (method) {
      filteredPayments = filteredPayments.filter(p => p.method === method);
    }
    
    if (fromDate) {
      filteredPayments = filteredPayments.filter(p => 
        new Date(p.createdAt) >= new Date(fromDate)
      );
    }
    
    if (toDate) {
      filteredPayments = filteredPayments.filter(p => 
        new Date(p.createdAt) <= new Date(toDate)
      );
    }
    
    // Ordina per data decrescente
    filteredPayments.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    // Paginazione
    const total = filteredPayments.length;
    const paginatedPayments = filteredPayments
      .slice(parseInt(offset), parseInt(offset) + parseInt(limit));
    
    // Statistiche
    const stats = {
      total: payments.length,
      completed: payments.filter(p => p.status === 'completed').length,
      pending: payments.filter(p => p.status === 'pending').length,
      failed: payments.filter(p => p.status === 'failed').length,
      totalAmount: payments
        .filter(p => p.status === 'completed')
        .reduce((sum, p) => sum + p.amount, 0),
      avgAmount: payments.length > 0 
        ? (payments.reduce((sum, p) => sum + p.amount, 0) / payments.length).toFixed(2)
        : 0
    };
    
    res.json({
      success: true,
      data: {
        payments: paginatedPayments,
        pagination: {
          total: total,
          limit: parseInt(limit),
          offset: parseInt(offset),
          hasMore: (parseInt(offset) + parseInt(limit)) < total
        },
        stats: stats
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Errore nel recupero dei pagamenti',
      error: error.message
    });
  }
});

// GET /api/payments/:paymentId - Ottieni pagamento specifico
router.get('/:paymentId', (req, res) => {
  try {
    const { paymentId } = req.params;
    
    const payment = payments.find(p => p.id === paymentId);
    
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
    res.status(500).json({
      success: false,
      message: 'Errore nel recupero del pagamento',
      error: error.message
    });
  }
});

// POST /api/payments - Crea nuovo pagamento/transazione
router.post('/', (req, res) => {
  try {
    const {
      bookingId,
      type,
      amount,
      currency = 'EUR',
      method,
      guestInfo,
      metadata = {}
    } = req.body;
    
    // Validazione campi obbligatori
    if (!bookingId || !type || !amount || !method) {
      return res.status(400).json({
        success: false,
        message: 'Campi richiesti: bookingId, type, amount, method'
      });
    }
    
    const validTypes = ['deposit', 'balance', 'full', 'refund'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        message: `Tipo pagamento non valido. Validi: ${validTypes.join(', ')}`
      });
    }
    
    if (amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'L\'importo deve essere maggiore di zero'
      });
    }
    
    // Crea nuovo pagamento
    const paymentId = 'pay_' + Date.now();
    const newPayment = {
      id: paymentId,
      bookingId: bookingId,
      type: type,
      amount: parseFloat(amount),
      currency: currency,
      status: 'pending',
      method: method,
      provider: method === 'card' ? 'stripe' : 'manual',
      transactionId: null,
      guestInfo: guestInfo || {},
      metadata: {
        ...metadata,
        createdVia: 'admin_panel'
      },
      createdAt: new Date().toISOString(),
      processedAt: null,
      updatedAt: new Date().toISOString()
    };
    
    // Simula processamento pagamento
    if (method === 'card') {
      // Simula successo/fallimento random per demo
      const success = Math.random() > 0.1; // 90% success rate
      
      if (success) {
        newPayment.status = 'completed';
        newPayment.processedAt = new Date().toISOString();
        newPayment.transactionId = 'txn_' + Date.now();
        newPayment.metadata.cardLast4 = '4242';
        newPayment.metadata.cardBrand = 'visa';
      } else {
        newPayment.status = 'failed';
        newPayment.metadata.errorCode = 'card_declined';
        newPayment.metadata.errorMessage = 'La carta è stata rifiutata';
      }
    }
    
    payments.push(newPayment);
    
    res.status(201).json({
      success: true,
      message: `Pagamento ${newPayment.status === 'completed' ? 'completato' : 'creato'} con successo`,
      data: newPayment,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Errore nella creazione del pagamento',
      error: error.message
    });
  }
});

// PATCH /api/payments/:paymentId/status - Aggiorna status pagamento
router.patch('/:paymentId/status', (req, res) => {
  try {
    const { paymentId } = req.params;
    const { status, transactionId, metadata = {} } = req.body;
    
    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Status richiesto'
      });
    }
    
    const validStatuses = ['pending', 'completed', 'failed', 'refunded', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Status non valido. Validi: ${validStatuses.join(', ')}`
      });
    }
    
    const paymentIndex = payments.findIndex(p => p.id === paymentId);
    
    if (paymentIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Pagamento non trovato'
      });
    }
    
    const oldStatus = payments[paymentIndex].status;
    
    // Aggiorna pagamento
    payments[paymentIndex].status = status;
    payments[paymentIndex].updatedAt = new Date().toISOString();
    
    if (transactionId) {
      payments[paymentIndex].transactionId = transactionId;
    }
    
    if (status === 'completed' && oldStatus !== 'completed') {
      payments[paymentIndex].processedAt = new Date().toISOString();
    }
    
    // Merge metadata
    payments[paymentIndex].metadata = {
      ...payments[paymentIndex].metadata,
      ...metadata
    };
    
    res.json({
      success: true,
      message: `Status pagamento aggiornato da '${oldStatus}' a '${status}'`,
      data: {
        paymentId: paymentId,
        oldStatus: oldStatus,
        newStatus: status,
        updatedAt: payments[paymentIndex].updatedAt
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Errore nell\'aggiornamento del pagamento',
      error: error.message
    });
  }
});

// POST /api/payments/:paymentId/refund - Rimborsa pagamento
router.post('/:paymentId/refund', (req, res) => {
  try {
    const { paymentId } = req.params;
    const { amount, reason = 'Rimborso amministrativo' } = req.body;
    
    const payment = payments.find(p => p.id === paymentId);
    
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Pagamento non trovato'
      });
    }
    
    if (payment.status !== 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Solo i pagamenti completati possono essere rimborsati'
      });
    }
    
    const refundAmount = amount || payment.amount;
    
    if (refundAmount > payment.amount) {
      return res.status(400).json({
        success: false,
        message: 'L\'importo del rimborso non può superare l\'importo del pagamento'
      });
    }
    
    // Crea transazione di rimborso
    const refundId = 'ref_' + Date.now();
    const refund = {
      id: refundId,
      bookingId: payment.bookingId,
      type: 'refund',
      amount: -Math.abs(refundAmount), // Importo negativo per rimborso
      currency: payment.currency,
      status: 'completed',
      method: payment.method,
      provider: payment.provider,
      transactionId: 'ref_txn_' + Date.now(),
      guestInfo: payment.guestInfo,
      metadata: {
        originalPaymentId: paymentId,
        reason: reason,
        refundType: refundAmount === payment.amount ? 'full' : 'partial'
      },
      createdAt: new Date().toISOString(),
      processedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    payments.push(refund);
    
    // Aggiorna pagamento originale se rimborso completo
    if (refundAmount === payment.amount) {
      const paymentIndex = payments.findIndex(p => p.id === paymentId);
      payments[paymentIndex].status = 'refunded';
      payments[paymentIndex].updatedAt = new Date().toISOString();
      payments[paymentIndex].metadata.refundId = refundId;
    }
    
    res.json({
      success: true,
      message: 'Rimborso processato con successo',
      data: {
        refund: refund,
        originalPayment: payment,
        refundType: refundAmount === payment.amount ? 'full' : 'partial'
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Errore nel processamento del rimborso',
      error: error.message
    });
  }
});

// GET /api/payments/config - Ottieni configurazioni pagamento
router.get('/config/settings', (req, res) => {
  try {
    res.json({
      success: true,
      data: paymentConfigs,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Errore nel recupero delle configurazioni',
      error: error.message
    });
  }
});

// PUT /api/payments/config - Aggiorna configurazioni pagamento
router.put('/config/settings', (req, res) => {
  try {
    const updateData = req.body;
    
    // Validazione configurazioni
    if (updateData.settings && updateData.settings.depositPercentage) {
      const deposit = updateData.settings.depositPercentage;
      if (deposit < 0 || deposit > 100) {
        return res.status(400).json({
          success: false,
          message: 'La percentuale di deposito deve essere tra 0 e 100'
        });
      }
    }
    
    // Aggiorna configurazioni
    paymentConfigs = {
      ...paymentConfigs,
      ...updateData,
      providers: {
        ...paymentConfigs.providers,
        ...(updateData.providers || {})
      },
      settings: {
        ...paymentConfigs.settings,
        ...(updateData.settings || {})
      },
      fees: {
        ...paymentConfigs.fees,
        ...(updateData.fees || {})
      }
    };
    
    res.json({
      success: true,
      message: 'Configurazioni pagamento aggiornate',
      data: paymentConfigs,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Errore nell\'aggiornamento delle configurazioni',
      error: error.message
    });
  }
});

// GET /api/payments/reports/:type - Genera report pagamenti
router.get('/reports/:type', (req, res) => {
  try {
    const { type } = req.params;
    const { fromDate, toDate, groupBy = 'day' } = req.query;
    
    let filteredPayments = payments.filter(p => p.status === 'completed');
    
    if (fromDate) {
      filteredPayments = filteredPayments.filter(p => 
        new Date(p.createdAt) >= new Date(fromDate)
      );
    }
    
    if (toDate) {
      filteredPayments = filteredPayments.filter(p => 
        new Date(p.createdAt) <= new Date(toDate)
      );
    }
    
    let report = {};
    
    switch (type) {
      case 'revenue':
        const totalRevenue = filteredPayments
          .filter(p => p.amount > 0) // Esclude rimborsi
          .reduce((sum, p) => sum + p.amount, 0);
        
        const refunds = filteredPayments
          .filter(p => p.amount < 0) // Solo rimborsi
          .reduce((sum, p) => sum + Math.abs(p.amount), 0);
        
        report = {
          totalRevenue: totalRevenue,
          totalRefunds: refunds,
          netRevenue: totalRevenue - refunds,
          transactionCount: filteredPayments.filter(p => p.amount > 0).length,
          avgTransactionValue: filteredPayments.length > 0 
            ? (totalRevenue / filteredPayments.filter(p => p.amount > 0).length).toFixed(2)
            : 0
        };
        break;
        
      case 'methods':
        const methodStats = {};
        filteredPayments.forEach(p => {
          if (!methodStats[p.method]) {
            methodStats[p.method] = { count: 0, total: 0 };
          }
          methodStats[p.method].count++;
          methodStats[p.method].total += p.amount;
        });
        
        report = { methodBreakdown: methodStats };
        break;
        
      case 'daily':
        const dailyStats = {};
        filteredPayments.forEach(p => {
          const date = new Date(p.createdAt).toISOString().split('T')[0];
          if (!dailyStats[date]) {
            dailyStats[date] = { count: 0, total: 0, deposits: 0, balances: 0 };
          }
          dailyStats[date].count++;
          dailyStats[date].total += p.amount;
          if (p.type === 'deposit') dailyStats[date].deposits++;
          if (p.type === 'balance') dailyStats[date].balances++;
        });
        
        report = { dailyBreakdown: dailyStats };
        break;
        
      default:
        return res.status(400).json({
          success: false,
          message: 'Tipo report non valido. Validi: revenue, methods, daily'
        });
    }
    
    res.json({
      success: true,
      data: report,
      period: {
        from: fromDate || 'inception',
        to: toDate || 'now',
        totalTransactions: filteredPayments.length
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Errore nella generazione del report',
      error: error.message
    });
  }
});

module.exports = router;