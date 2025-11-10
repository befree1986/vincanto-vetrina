// API Unificata Semplificata - Senza dipendenze problematiche
export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Ottieni action da query params o body
  let { action } = req.query;
  if (req.method === 'POST' && req.body && req.body.action) {
    action = req.body.action;
  }

  console.log('🎯 API Unificata - Action:', action, 'Method:', req.method);

  try {
    // LOGIN
    if (action === 'login') {
      if (req.method !== 'POST') {
        return res.status(405).json({ success: false, error: 'Metodo non consentito' });
      }

      const { password } = req.body;
      const correctPassword = 'vincanto2025';

      if (password === correctPassword) {
        return res.status(200).json({
          success: true,
          message: 'Login effettuato con successo',
          token: 'admin-token-vincanto'
        });
      } else {
        return res.status(401).json({
          success: false,
          error: 'Password non corretta'
        });
      }
    }

    // DASHBOARD STATS
    if (action === 'dashboard-stats') {
      return res.status(200).json({
        success: true,
        stats: {
          totalBookings: 45,
          totalRevenue: 12500,
          occupancyRate: 75,
          totalGuests: 120,
          averageStay: 3.2,
          monthlyBookings: 15,
          monthlyRevenue: 4200,
          pendingBookings: 3,
          confirmedBookings: 42,
          cancelledBookings: 5,
          topSource: 'Airbnb',
          averageRating: 4.8,
          totalReviews: 67
        }
      });
    }

    // ANALYTICS
    if (action === 'analytics') {
      const analyticsData = [];
      const today = new Date();
      
      for (let i = 29; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        
        const dayOfMonth = date.getDate();
        const bookings = Math.max(0, Math.floor(Math.random() * 3));
        const revenue = bookings * (150 + Math.random() * 100);
        const occupancy = bookings > 0 ? Math.min(100, 60 + Math.random() * 40) : 0;
        
        analyticsData.push({
          date: date.toISOString().split('T')[0],
          bookings,
          revenue: Math.round(revenue),
          occupancy: Math.round(occupancy)
        });
      }
      
      return res.status(200).json({
        success: true,
        analytics: analyticsData
      });
    }

    // NOTIFICATIONS
    if (action === 'notifications') {
      return res.status(200).json({
        success: true,
        notifications: [
          {
            id: 1,
            type: 'booking',
            title: 'Nuova Prenotazione',
            message: 'Prenotazione ricevuta per il 15-18 Nov',
            date: new Date().toISOString(),
            read: false
          },
          {
            id: 2,
            type: 'payment',
            title: 'Pagamento Ricevuto',
            message: 'Pagamento di €450 completato',
            date: new Date(Date.now() - 86400000).toISOString(),
            read: false
          },
          {
            id: 3,
            type: 'review',
            title: 'Nuova Recensione',
            message: 'Recensione 5 stelle ricevuta',
            date: new Date(Date.now() - 172800000).toISOString(),
            read: true
          }
        ]
      });
    }

    // PAYMENTS
    if (action === 'payments') {
      return res.status(200).json({
        success: true,
        payments: [
          {
            id: 1,
            bookingId: 'BK001',
            amount: 450,
            currency: 'EUR',
            status: 'completed',
            method: 'credit_card',
            date: new Date().toISOString(),
            guest: 'Mario Rossi'
          },
          {
            id: 2,
            bookingId: 'BK002',
            amount: 325,
            currency: 'EUR',
            status: 'pending',
            method: 'bank_transfer',
            date: new Date(Date.now() - 86400000).toISOString(),
            guest: 'Laura Bianchi'
          }
        ]
      });
    }

    // EXTRA SERVICES
    if (action === 'extra-services') {
      return res.status(200).json({
        success: true,
        services: [
          {
            id: 1,
            name: 'Pulizia Extra',
            price: 50,
            currency: 'EUR',
            description: 'Pulizia approfondita pre-arrivo',
            active: true
          },
          {
            id: 2,
            name: 'Late Check-out',
            price: 30,
            currency: 'EUR',
            description: 'Check-out posticipato alle 14:00',
            active: true
          },
          {
            id: 3,
            name: 'Colazione',
            price: 15,
            currency: 'EUR',
            description: 'Colazione italiana completa',
            active: false
          }
        ]
      });
    }

    // DEFAULT - Action non trovata
    return res.status(404).json({
      success: false,
      error: 'Endpoint non trovato',
      availableActions: [
        'login', 'dashboard-stats', 'analytics', 'notifications', 'payments', 'extra-services'
      ]
    });

  } catch (error) {
    console.error('❌ API Unificata Error:', error);
    return res.status(500).json({
      success: false,
      error: 'Errore interno del server',
      details: error.message
    });
  }
}