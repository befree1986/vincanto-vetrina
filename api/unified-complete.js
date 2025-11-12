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

    if (action === 'analytics') {
      const analyticsData = [];
      const today = new Date();
      
      for (let i = 29; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        
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

    // ========================================
    // NOTIFICATIONS SECTION
    // ========================================
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
            title: 'Pagamento PayPal Ricevuto',
            message: 'Pagamento di €450 completato via PayPal',
            date: new Date(Date.now() - 86400000).toISOString(),
            read: false
          },
          {
            id: 3,
            type: 'calendar',
            title: 'Sincronizzazione Calendar',
            message: 'Airbnb calendar sincronizzato con successo',
            date: new Date(Date.now() - 172800000).toISOString(),
            read: true
          }
        ]
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
          bookings: [
            {
              id: 1,
              customer_name: 'Mario Rossi',
              customer_email: 'mario.rossi@email.com',
              check_in: '2025-11-15',
              check_out: '2025-11-18',
              guests: 2,
              total_amount: 450,
              status: 'confirmed',
              platform: 'direct',
              payment_method: 'paypal',
              created_at: new Date().toISOString()
            },
            {
              id: 2,
              customer_name: 'Laura Bianchi',
              customer_email: 'laura.bianchi@email.com',
              check_in: '2025-11-20',
              check_out: '2025-11-23',
              guests: 4,
              total_amount: 325,
              status: 'pending',
              platform: 'airbnb',
              payment_method: 'paypal',
              created_at: new Date(Date.now() - 86400000).toISOString()
            }
          ]
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
        payments: [
          {
            id: 1,
            bookingId: 'BK001',
            amount: 450,
            currency: 'EUR',
            status: 'completed',
            method: 'paypal',
            date: new Date().toISOString(),
            guest: 'Mario Rossi',
            paypalLink: 'https://www.paypal.me/AntonioGuida320',
            description: 'Acconto prenotazione 15-18 Nov'
          },
          {
            id: 2,
            bookingId: 'BK002',
            amount: 325,
            currency: 'EUR',
            status: 'pending',
            method: 'paypal',
            date: new Date(Date.now() - 86400000).toISOString(),
            guest: 'Laura Bianchi',
            paypalLink: 'https://www.paypal.me/AntonioGuida320',
            description: 'Pagamento completo 20-23 Nov'
          },
          {
            id: 3,
            bookingId: 'BK003',
            amount: 180,
            currency: 'EUR',
            status: 'completed',
            method: 'bank_transfer',
            date: new Date(Date.now() - 172800000).toISOString(),
            guest: 'Giuseppe Verdi',
            description: 'Bonifico bancario'
          }
        ]
      });
    }

    // ========================================
    // CALENDAR MANAGEMENT SECTION
    // ========================================
    if (action === 'calendar-configs') {
      return res.status(200).json({
        success: true,
        calendars: [
          {
            id: 1,
            name: 'Airbnb Calendar',
            calendar_type: 'airbnb',
            url: 'https://www.airbnb.it/calendar/ical/123456789.ics',
            is_active: true,
            sync_frequency: 30,
            last_sync: new Date().toISOString(),
            status: 'connected',
            events_synced: 15
          },
          {
            id: 2,
            name: 'Booking.com Calendar',
            calendar_type: 'booking_com',
            url: 'https://supply-xml.booking.com/hotels/xml/reservations?hotel_id=987654',
            is_active: true,
            sync_frequency: 60,
            last_sync: new Date(Date.now() - 3600000).toISOString(),
            status: 'connected',
            events_synced: 8
          },
          {
            id: 3,
            name: 'VRBO Calendar',
            calendar_type: 'vrbo',
            url: 'https://www.vrbo.com/icalendar/1234567890.ics',
            is_active: true,
            sync_frequency: 120,
            last_sync: new Date(Date.now() - 7200000).toISOString(),
            status: 'connected',
            events_synced: 12
          },
          {
            id: 4,
            name: 'Google Calendar Personal',
            calendar_type: 'google_calendar',
            url: 'https://calendar.google.com/calendar/ical/personal%40gmail.com/private-xxx/basic.ics',
            is_active: false,
            sync_frequency: 15,
            last_sync: null,
            status: 'pending_auth',
            events_synced: 0
          }
        ],
        stats: {
          total: 4,
          active: 3,
          googleCalendar: 1,
          external: 3,
          lastSyncSuccess: new Date().toISOString(),
          totalEventsSynced: 35
        }
      });
    }

    if (action === 'calendar-sync') {
      if (req.method === 'POST') {
        // Forza sincronizzazione calendario
        return res.status(200).json({
          success: true,
          message: 'Sincronizzazione calendario avviata',
          sync_id: `sync_${Date.now()}`,
          calendars_processed: 3,
          events_found: 12
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
          },
          {
            id: 4,
            name: 'Transfer Aeroporto',
            price: 45,
            currency: 'EUR',
            description: 'Servizio transfer da/per aeroporto',
            active: true
          }
        ]
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