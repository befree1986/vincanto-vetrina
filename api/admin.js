import { Pool } from 'pg';

// Debug variabili d'ambiente
console.log('DATABASE_URL present:', !!process.env.DATABASE_URL);
console.log('DATABASE_URL length:', process.env.DATABASE_URL ? process.env.DATABASE_URL.length : 0);

// Configurazione database Neon
let pool;
try {
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });
} catch (poolError) {
  console.error('Pool creation error:', poolError);
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { action } = req.query;
  let client;

  // Verifica che DATABASE_URL sia disponibile
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL not found in environment');
    return res.status(500).json({ success: false, error: 'Database configuration missing' });
  }

  if (!pool) {
    console.error('Database pool not initialized');
    return res.status(500).json({ success: false, error: 'Database pool not available' });
  }

  try {
    client = await pool.connect();
    
    switch (action) {
      case 'dashboard-stats':
        try {
          // Verifica se esistono tabelle di bookings, altrimenti usa dati di base
          const checkBookingsTable = await client.query(`
            SELECT EXISTS (
              SELECT FROM information_schema.tables 
              WHERE table_schema = 'public' 
              AND table_name = 'bookings'
            );
          `);
          
          let bookingStats = { 
            total_bookings: 0, 
            confirmed_bookings: 0, 
            pending_bookings: 0, 
            total_revenue: 0, 
            average_stay: 0 
          };
          
          // Per ora usiamo dati mock invece della tabella bookings che non esiste
          bookingStats = { 
            total_bookings: 42, 
            confirmed_bookings: 35, 
            pending_bookings: 7, 
            total_revenue: 15680.50, 
            average_stay: 4.2 
          };
          
          // Ottieni dati dalle tabelle admin che esistono
          const settingsCount = await client.query('SELECT COUNT(*) as total FROM admin_settings');
          const calendarsResult = await client.query('SELECT COUNT(*) as active_calendars FROM admin_calendar_configs WHERE is_active = true');
          
          return res.status(200).json({
            success: true,
            stats: {
              totalBookings: parseInt(bookingStats.total_bookings) || 0,
              activeCalendars: parseInt(calendarsResult.rows[0]?.active_calendars) || 0,
              totalRevenue: parseFloat(bookingStats.total_revenue) || 0,
              confirmedBookings: parseInt(bookingStats.confirmed_bookings) || 0,
              pendingBookings: parseInt(bookingStats.pending_bookings) || 0,
              averageStay: parseFloat(bookingStats.average_stay) || 0,
              occupancyRate: 85.5,
              settingsCount: parseInt(settingsCount.rows[0]?.total) || 0
            }
          });
        } catch (dbError) {
          console.error('Database error in dashboard-stats:', dbError);
          return res.status(500).json({ 
            success: false, 
            error: 'Database error',
            details: dbError.message,
            code: dbError.code
          });
        }

      case 'bookings':
        try {
          // Dati mock per bookings
          const mockBookings = [
            {
              id: 1,
              guestName: 'Mario Rossi',
              guestEmail: 'mario.rossi@email.com',
              checkIn: '2025-01-20',
              checkOut: '2025-01-25',
              guests: 2,
              status: 'confirmed',
              totalAmount: 850.00
            },
            {
              id: 2,
              guestName: 'Anna Bianchi',
              guestEmail: 'anna.bianchi@email.com',
              checkIn: '2025-02-10',
              checkOut: '2025-02-15',
              guests: 4,
              status: 'pending',
              totalAmount: 1200.00
            },
            {
              id: 3,
              guestName: 'Giuseppe Verdi',
              guestEmail: 'g.verdi@email.com',
              checkIn: '2025-01-15',
              checkOut: '2025-01-18',
              guests: 1,
              status: 'confirmed',
              totalAmount: 480.00
            }
          ];
          
          return res.status(200).json({
            success: true,
            bookings: mockBookings
          });
        } catch (dbError) {
          console.error('Database error in bookings:', dbError);
          return res.status(500).json({ success: false, error: 'Database error' });
        }

      case 'pricing-config':
        if (req.method === 'PUT') {
          try {
            const { basePrice, additionalGuestPrice, cleaningFee, parkingFeePerNight, minimumNights, depositPercentage } = req.body;
            
            const updates = [
              { key: 'base_price', value: basePrice.toString() },
              { key: 'additional_guest_price', value: additionalGuestPrice.toString() },
              { key: 'cleaning_fee', value: cleaningFee.toString() },
              { key: 'parking_fee_per_night', value: parkingFeePerNight.toString() },
              { key: 'minimum_nights', value: minimumNights.toString() },
              { key: 'deposit_percentage', value: depositPercentage.toString() }
            ];
            
            for (const update of updates) {
              await client.query(`
                UPDATE admin_settings SET 
                  setting_value = $1, updated_at = NOW()
                WHERE setting_key = $2
              `, [update.value, update.key]);
            }
            
            return res.status(200).json({
              success: true,
              message: 'Configurazione aggiornata con successo'
            });
          } catch (dbError) {
            console.error('Database error in pricing update:', dbError);
            return res.status(500).json({ success: false, error: 'Database error' });
          }
        }
        
        try {
          const result = await client.query(`
            SELECT setting_key, setting_value
            FROM admin_settings 
            WHERE category = 'pricing'
          `);
          
          const settings = {};
          result.rows.forEach(row => {
            settings[row.setting_key] = row.setting_value;
          });
          
          return res.status(200).json({
            success: true,
            config: {
              basePrice: parseFloat(settings.base_price) || 85.00,
              additionalGuestPrice: parseFloat(settings.additional_guest_price) || 25.00,
              cleaningFee: parseFloat(settings.cleaning_fee) || 40.00,
              parkingFeePerNight: parseFloat(settings.parking_fee_per_night) || 15.00,
              minimumNights: parseInt(settings.minimum_nights) || 2,
              depositPercentage: parseFloat(settings.deposit_percentage) || 0.30
            }
          });
        } catch (dbError) {
          console.error('Database error in pricing-config:', dbError);
          return res.status(500).json({ success: false, error: 'Database error' });
        }

      case 'calendars':
        try {
          const result = await client.query(`
            SELECT 
              id, calendar_name, platform, calendar_url, is_active, last_sync_at, sync_status
            FROM admin_calendar_configs 
            ORDER BY created_at DESC
          `);
          
          return res.status(200).json({
            success: true,
            calendars: result.rows.map(row => ({
              id: row.id,
              name: row.calendar_name,
              platform: row.platform,
              isActive: row.is_active,
              syncStatus: row.sync_status || 'pending',
              lastSync: row.last_sync_at,
              blockedDates: []
            }))
          });
        } catch (dbError) {
          console.error('Database error in calendars:', dbError);
          return res.status(500).json({ success: false, error: 'Database error' });
        }

      case 'notifications':
        try {
          const result = await client.query(`
            SELECT id, title, message, type, is_read, created_at
            FROM admin_notifications 
            ORDER BY created_at DESC
            LIMIT 10
          `);
          
          const unreadResult = await client.query(`
            SELECT COUNT(*) as unread_count 
            FROM admin_notifications 
            WHERE is_read = false
          `);
          
          return res.status(200).json({
            success: true,
            notifications: result.rows.map(row => ({
              id: row.id,
              title: row.title,
              message: row.message,
              type: row.type,
              read: row.is_read,
              timestamp: row.created_at
            })),
            unreadCount: parseInt(unreadResult.rows[0].unread_count) || 0
          });
        } catch (dbError) {
          console.error('Database error in notifications:', dbError);
          return res.status(500).json({ success: false, error: 'Database error' });
        }

      case 'blocked-dates':
        try {
          const result = await client.query(`
            SELECT id, event_date as start_date, event_date as end_date, event_title as reason, created_at
            FROM admin_calendar_events 
            WHERE event_type = 'blocked'
            ORDER BY event_date ASC
          `);
          
          return res.status(200).json({
            success: true,
            blockedDates: result.rows.map(row => ({
              id: row.id,
              start_date: row.start_date,
              end_date: row.end_date,
              reason: row.reason || 'Data bloccata',
              created_at: row.created_at
            }))
          });
        } catch (dbError) {
          console.error('Database error in blocked-dates:', dbError);
          return res.status(500).json({ success: false, error: 'Database error' });
        }

      case 'analytics':
        try {
          const result = await client.query(`
            SELECT date, bookings_count, revenue, occupancy_rate
            FROM admin_daily_stats 
            WHERE date >= CURRENT_DATE - INTERVAL '30 days'
            ORDER BY date DESC
          `);
          
          return res.status(200).json({
            success: true,
            analytics: result.rows.map(row => ({
              date: row.date,
              bookings: parseInt(row.bookings_count) || 0,
              revenue: parseFloat(row.revenue) || 0,
              occupancy: parseFloat(row.occupancy_rate) || 0
            }))
          });
        } catch (dbError) {
          console.error('Database error in analytics:', dbError);
          return res.status(500).json({ success: false, error: 'Database error' });
        }

      default:
        return res.status(400).json({
          success: false,
          error: 'Azione non supportata'
        });
    }
  } catch (error) {
    console.error('Admin API Error:', error);
    return res.status(500).json({
      success: false,
      error: 'Errore interno del server',
      details: error.message,
      stack: error.stack
    });
  } finally {
    if (client) {
      client.release();
    }
  }
}
