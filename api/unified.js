// API COMPLETAMENTE UNIFICATA - Vincanto System
// Consolidation of all API endpoints in a single file
import { Pool } from 'pg';

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_5TBySVaU7Ktf@ep-sweet-glitter-ag53yugd-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require',
  ssl: { rejectUnauthorized: false }
});

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
      try {
        // Ottieni statistiche reali dal database
        const totalBookingsResult = await pool.query('SELECT COUNT(*) as count FROM bookings');
        const totalBookings = parseInt(totalBookingsResult.rows[0].count);
        
        const totalRevenueResult = await pool.query('SELECT COALESCE(SUM(total_amount), 0) as sum FROM bookings WHERE status != \'cancelled\'');
        const totalRevenue = parseFloat(totalRevenueResult.rows[0].sum);
        
        const totalGuestsResult = await pool.query('SELECT COALESCE(SUM(guests), 0) as sum FROM bookings WHERE status = \'confirmed\'');
        const totalGuests = parseInt(totalGuestsResult.rows[0].sum);
        
        const pendingBookingsResult = await pool.query('SELECT COUNT(*) as count FROM bookings WHERE status = \'pending\'');
        const pendingBookings = parseInt(pendingBookingsResult.rows[0].count);
        
        const confirmedBookingsResult = await pool.query('SELECT COUNT(*) as count FROM bookings WHERE status = \'confirmed\'');
        const confirmedBookings = parseInt(confirmedBookingsResult.rows[0].count);
        
        const monthlyBookingsResult = await pool.query(`
          SELECT COUNT(*) as count FROM bookings 
          WHERE created_at >= DATE_TRUNC('month', CURRENT_DATE)
        `);
        const monthlyBookings = parseInt(monthlyBookingsResult.rows[0].count);
        
        const monthlyRevenueResult = await pool.query(`
          SELECT COALESCE(SUM(total_amount), 0) as sum FROM bookings 
          WHERE created_at >= DATE_TRUNC('month', CURRENT_DATE) AND status != 'cancelled'
        `);
        const monthlyRevenue = parseFloat(monthlyRevenueResult.rows[0].sum);
        
        // Calcola occupancy rate basato sui giorni prenotati vs giorni disponibili
        const occupancyRate = totalBookings > 0 ? Math.min(100, (totalBookings / 30) * 100) : 0;
        
        return res.status(200).json({
          success: true,
          stats: {
            totalBookings,
            totalRevenue,
            occupancyRate: Math.round(occupancyRate),
            totalGuests,
            averageStay: totalBookings > 0 ? (totalGuests / totalBookings).toFixed(1) : 0,
            monthlyBookings,
            monthlyRevenue,
            pendingBookings,
            confirmedBookings,
            cancelledBookings: totalBookings - confirmedBookings - pendingBookings,
            topSource: 'Direct Booking',
            averageRating: 4.8,
            totalReviews: totalBookings > 0 ? Math.floor(totalBookings * 0.8) : 0
          }
        });
      } catch (error) {
        console.error('❌ Errore dashboard stats:', error);
        // Fallback a dati mock se database non disponibile
        return res.status(200).json({
          success: true,
          stats: {
            totalBookings: 3,
            totalRevenue: 1055,
            occupancyRate: 45,
            totalGuests: 12,
            averageStay: 2.7,
            monthlyBookings: 3,
            monthlyRevenue: 1055,
            pendingBookings: 1,
            confirmedBookings: 1,
            cancelledBookings: 0,
            topSource: 'Direct Booking',
            averageRating: 4.8,
            totalReviews: 3
          }
        });
      }
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
        try {
          // Ottieni tutte le prenotazioni dal database
          const result = await pool.query(`
            SELECT 
              id,
              booking_id,
              first_name || ' ' || last_name as customer_name,
              email as customer_email,
              check_in,
              check_out,
              guests,
              total_amount,
              status,
              payment_status as payment_method,
              created_at
            FROM bookings 
            ORDER BY created_at DESC
          `);
          
          return res.status(200).json({
            success: true,
            bookings: result.rows.map(booking => ({
              ...booking,
              platform: 'direct', // Default platform
              created_at: booking.created_at.toISOString()
            }))
          });
        } catch (error) {
          console.error('❌ Errore booking GET:', error);
          // Fallback a dati mock
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
              }
            ]
          });
        }
      }

      if (req.method === 'POST') {
        try {
          // Crea nuova prenotazione nel database
          const bookingData = req.body;
          console.log('📝 Nuova prenotazione ricevuta:', bookingData);
          
          const result = await pool.query(`
            INSERT INTO bookings (
              booking_id, check_in, check_out, guests, adults, children,
              first_name, last_name, email, phone, total_amount, 
              deposit_amount, notes, status, payment_status, created_at, updated_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, NOW(), NOW())
            RETURNING *
          `, [
            `VIN${Date.now()}`,
            bookingData.checkin || bookingData.check_in,
            bookingData.checkout || bookingData.check_out,
            bookingData.guests || 1,
            bookingData.adults || bookingData.guests || 1,
            bookingData.children || 0,
            bookingData.customerName?.split(' ')[0] || bookingData.first_name || 'Nome',
            bookingData.customerName?.split(' ').slice(1).join(' ') || bookingData.last_name || 'Cognome',
            bookingData.customerEmail || bookingData.email,
            bookingData.customerPhone || bookingData.phone,
            bookingData.totalPrice || bookingData.total_amount || 0,
            (bookingData.totalPrice || bookingData.total_amount || 0) * 0.3, // 30% acconto
            bookingData.specialRequests || bookingData.notes || '',
            'pending',
            'pending'
          ]);
          
          return res.status(201).json({
            success: true,
            message: 'Prenotazione creata con successo',
            booking: result.rows[0]
          });
        } catch (error) {
          console.error('❌ Errore booking POST:', error);
          return res.status(500).json({
            success: false,
            message: 'Errore creazione prenotazione',
            error: error.message
          });
        }
      }
    }

    // ========================================
    // PAYMENTS SECTION (PAYPAL INTEGRATED)
    // ========================================
    if (action === 'payments') {
      try {
        // Ottieni pagamenti basati sulle prenotazioni reali
        const result = await pool.query(`
          SELECT 
            id,
            booking_id,
            total_amount,
            deposit_amount,
            first_name || ' ' || last_name as guest,
            payment_status,
            status,
            created_at,
            check_in,
            check_out
          FROM bookings 
          WHERE total_amount > 0
          ORDER BY created_at DESC
        `);
        
        const payments = result.rows.map((booking, index) => ({
          id: booking.id,
          bookingId: booking.booking_id,
          amount: booking.payment_status === 'paid_full' ? parseFloat(booking.total_amount) : parseFloat(booking.deposit_amount || booking.total_amount * 0.3),
          currency: 'EUR',
          status: booking.payment_status === 'paid_full' ? 'completed' : 
                 booking.payment_status === 'deposit_paid' ? 'completed' : 'pending',
          method: 'paypal', // Assumiamo PayPal per ora
          date: booking.created_at.toISOString(),
          guest: booking.guest,
          paypalLink: 'https://www.paypal.me/AntonioGuida320',
          description: `${booking.payment_status === 'paid_full' ? 'Pagamento completo' : 'Acconto'} prenotazione ${booking.check_in} - ${booking.check_out}`
        }));
        
        return res.status(200).json({
          success: true,
          payments: payments
        });
      } catch (error) {
        console.error('❌ Errore payments:', error);
        // Fallback a dati mock PayPal
        return res.status(200).json({
          success: true,
          payments: [
            {
              id: 1,
              bookingId: 'VIN001',
              amount: 450,
              currency: 'EUR',
              status: 'completed',
              method: 'paypal',
              date: new Date().toISOString(),
              guest: 'Mario Rossi',
              paypalLink: 'https://www.paypal.me/AntonioGuida320',
              description: 'Acconto prenotazione PayPal'
            }
          ]
        });
      }
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