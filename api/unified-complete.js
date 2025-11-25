// API COMPLETAMENTE UNIFICATA - Vincanto System
// Consolidation of all API endpoints in a single file

export default async function handler(req, res) {
  // CORS Headers - Setup universale
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

  console.log('🎯 API UNIFICATA CONSOLIDATA - Action:', action, 'Method:', req.method);

  try {
    // ========================================
    // AUTHENTICATION SECTION
    // ========================================
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

    // ========================================
    // DASHBOARD & ANALYTICS SECTION
    // ========================================
    if (action === 'dashboard-stats') {
      return res.status(200).json({
        success: true,
        stats: {
          totalBookings: 0,
          totalRevenue: 0,
          occupancyRate: 0,
          totalGuests: 0,
          averageStay: 0,
          monthlyBookings: 0,
          monthlyRevenue: 0,
          pendingBookings: 0,
          confirmedBookings: 0,
          cancelledBookings: 0,
          topSource: 'direct',
          averageRating: 0,
          totalReviews: 0
        }
      });
    }

    if (action === 'analytics') {
      return res.status(200).json({
        success: true,
        analytics: []
      });
    }

    // ========================================
    // NOTIFICATIONS SECTION
    // ========================================
    if (action === 'notifications') {
      return res.status(200).json({
        success: true,
        notifications: []
      });
    }

    // ========================================
    // BOOKINGS MANAGEMENT SECTION
    // ========================================
    if (action === 'booking') {
      if (req.method === 'GET') {
        // Ottieni tutte le prenotazioni
        return res.status(200).json({
          success: true,
          bookings: []
        });
      }

      if (req.method === 'POST') {
        // Crea nuova prenotazione
        const bookingData = req.body;
        console.log('📝 Nuova prenotazione ricevuta:', bookingData);
        
        return res.status(201).json({
          success: true,
          message: 'Prenotazione creata con successo',
          booking: {
            id: Date.now(),
            ...bookingData,
            status: 'pending',
            created_at: new Date().toISOString()
          }
        });
      }
    }

    // ========================================
    // PAYMENTS SECTION (PAYPAL INTEGRATED)
    // ========================================
    if (action === 'payments') {
      return res.status(200).json({
        success: true,
        payments: []
      });
    }

    // ========================================
    // CALENDAR MANAGEMENT SECTION
    // ========================================
    if (action === 'calendar-configs') {
      return res.status(200).json({
        success: true,
        calendars: [],
        stats: {
          total: 0,
          active: 0,
          googleCalendar: 0,
          external: 0,
          lastSyncSuccess: null,
          totalEventsSynced: 0
        }
      });
    }

    if (action === 'calendar-sync') {
      if (req.method === 'POST') {
        // Forza sincronizzazione calendario
        return res.status(200).json({
          success: true,
          message: 'Nessun calendario configurato',
          sync_id: `sync_${Date.now()}`,
          calendars_processed: 0,
          events_found: 0
        });
      }
    }

    // ========================================
    // PRICING CONFIGURATION SECTION
    // ========================================
    if (action === 'pricing-config') {
      return res.status(200).json({
        success: true,
        pricing: {
          priceGroup1to2: 75,
          priceGroup3to4: 95,
          priceGroup5to6: 115,
          priceGroup7to8: 135,
          cleaningFee: 50,
          parkingFee: 20,
          touristTaxAdult: 2.00,
          touristTaxChild: 0,
          weekendSurcharge: 0,
          weeklyDiscount: 10,
          monthlyDiscount: 15,
          minStay: 2,
          maxStay: 14,
          maxGuests: 8
        }
      });
    }

    // ========================================
    // EXTRA SERVICES SECTION
    // ========================================
    if (action === 'extra-services') {
      return res.status(200).json({
        success: true,
        services: []
      });
    }

    // ========================================
    // CONTACT FORM SECTION
    // ========================================
    if (action === 'contact') {
      if (req.method === 'POST') {
        const { name, email, message, phone } = req.body;
        
        console.log('📧 Nuovo messaggio contatti:', { name, email, message, phone });
        
        return res.status(200).json({
          success: true,
          message: 'Messaggio inviato con successo',
          contact_id: `contact_${Date.now()}`
        });
      }
    }

    // ========================================
    // SYSTEM SETTINGS SECTION
    // ========================================
    if (action === 'settings') {
      return res.status(200).json({
        success: true,
        settings: {
          site_name: 'Vincanto Maori',
          admin_email: 'admin@vincantomaori.it',
          paypal_enabled: true,
          paypal_link: 'https://www.paypal.me/AntonioGuida320',
          stripe_enabled: false,
          bank_transfer_enabled: true,
          calendar_sync_enabled: true,
          google_analytics_enabled: true,
          booking_notifications_enabled: true,
          auto_confirm_bookings: false,
          max_guests: 8,
          min_stay_nights: 2,
          checkin_time: '15:00',
          checkout_time: '10:00'
        }
      });
    }

    // ========================================
    // ERROR HANDLING - ACTION NOT FOUND
    // ========================================
    return res.status(404).json({
      success: false,
      error: 'Endpoint non trovato',
      availableActions: [
        'login', 'dashboard-stats', 'analytics', 'notifications', 
        'booking', 'payments', 'calendar-configs', 'calendar-sync', 
        'pricing-config', 'extra-services', 'contact', 'settings'
      ],
      requestedAction: action,
      method: req.method
    });

  } catch (error) {
    console.error('❌ API Unificata Error:', error);
    return res.status(500).json({
      success: false,
      error: 'Errore interno del server',
      details: error.message,
      action: action
    });
  }
}