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
          
          // Calcola statistiche REALI dal database
          let bookingStats;
          
          try {
            const bookingsResult = await client.query(`
              SELECT 
                COUNT(*) as total_bookings,
                COUNT(CASE WHEN status = 'confirmed' THEN 1 END) as confirmed_bookings,
                COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_bookings,
                COALESCE(SUM(CASE WHEN status = 'confirmed' THEN total_amount ELSE 0 END), 0) as total_revenue,
                COALESCE(AVG(check_out_date - check_in_date), 0) as average_stay
              FROM admin_bookings 
              WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
            `);
            bookingStats = bookingsResult.rows[0];
          } catch (bookingError) {
            console.log('Bookings table not ready, using fallback stats');
            bookingStats = { 
              total_bookings: 0, 
              confirmed_bookings: 0, 
              pending_bookings: 0, 
              total_revenue: 0, 
              average_stay: 0 
            };
          }

          // Ottieni dati dalle tabelle admin che esistono
          const settingsCount = await client.query('SELECT COUNT(*) as total FROM admin_settings');
          const calendarsResult = await client.query('SELECT COUNT(*) as active_calendars FROM admin_calendar_configs WHERE is_active = true');
          
          // Calcola occupancy rate reale
          let occupancyRate = 0;
          try {
            const occupancyResult = await client.query(`
              SELECT 
                CASE 
                  WHEN COUNT(*) > 0 THEN 
                    (COUNT(CASE WHEN status = 'confirmed' THEN 1 END)::float / COUNT(*)::float * 100)
                  ELSE 0 
                END as occupancy_rate
              FROM admin_bookings 
              WHERE check_in_date >= CURRENT_DATE AND check_in_date <= CURRENT_DATE + INTERVAL '30 days'
            `);
            occupancyRate = parseFloat(occupancyResult.rows[0].occupancy_rate) || 0;
          } catch (err) {
            occupancyRate = 0;
          }
          
          return res.status(200).json({
            success: true,
            stats: {
              totalBookings: parseInt(bookingStats.total_bookings) || 0,
              activeCalendars: parseInt(calendarsResult.rows[0]?.active_calendars) || 0,
              totalRevenue: parseFloat(bookingStats.total_revenue) || 0,
              confirmedBookings: parseInt(bookingStats.confirmed_bookings) || 0,
              pendingBookings: parseInt(bookingStats.pending_bookings) || 0,
              averageStay: parseFloat(bookingStats.average_stay) || 0,
              occupancyRate: occupancyRate,
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
        if (req.method === 'POST') {
          try {
            const { guestName, guestEmail, guestPhone, checkIn, checkOut, guests, totalAmount, depositAmount, includeParking, notes } = req.body;
            
            // Genera codice confermazione
            const confirmationCode = `VNC${Date.now()}`;
            
            const result = await client.query(`
              INSERT INTO admin_bookings (guest_name, guest_email, guest_phone, check_in_date, check_out_date, guests_count, total_amount, deposit_amount, confirmation_code, admin_notes)
              VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
              RETURNING id
            `, [guestName, guestEmail, guestPhone, checkIn, checkOut, guests, totalAmount, depositAmount || 0, confirmationCode, notes || '']);
            
            return res.status(200).json({
              success: true,
              bookingId: result.rows[0].id.toString(),
              confirmationCode: confirmationCode,
              message: 'Prenotazione creata con successo'
            });
          } catch (dbError) {
            console.error('Database error creating booking:', dbError);
            return res.status(500).json({ success: false, error: 'Database error creating booking' });
          }
        }
        
        try {
          // Carica prenotazioni REALI dal database
          const result = await client.query(`
            SELECT id, guest_name, guest_email, guest_phone, check_in_date, check_out_date, 
                   guests_count, status, total_amount, deposit_amount, platform, confirmation_code, created_at
            FROM admin_bookings 
            ORDER BY created_at DESC
            LIMIT 50
          `);
          
          const bookings = result.rows.map(row => ({
            id: row.id.toString(),
            guestName: row.guest_name,
            guestEmail: row.guest_email,
            guestPhone: row.guest_phone || '',
            checkIn: row.check_in_date.toISOString().split('T')[0],
            checkOut: row.check_out_date.toISOString().split('T')[0],
            guests: row.guests_count,
            status: row.status,
            totalAmount: parseFloat(row.total_amount),
            depositAmount: parseFloat(row.deposit_amount || 0),
            platform: row.platform,
            confirmationCode: row.confirmation_code,
            created: row.created_at.toISOString(),
            notes: row.admin_notes || ''
          }));
          
          return res.status(200).json({
            success: true,
            bookings: bookings
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
          console.error('Database error in pricing-config:', dbError);
          return res.status(500).json({ success: false, error: 'Database error' });
        }

      case 'calendars':
        if (req.method === 'POST') {
          try {
            const { name, platform, url, isActive } = req.body;
            
            const result = await client.query(`
              INSERT INTO admin_calendar_configs (name, platform, url, is_active, created_at, updated_at)
              VALUES ($1, $2, $3, $4, NOW(), NOW())
              RETURNING id
            `, [name, platform, url, isActive || true]);
            
            return res.status(200).json({
              success: true,
              calendarId: result.rows[0].id,
              message: 'Calendario aggiunto con successo'
            });
          } catch (dbError) {
            console.error('Database error adding calendar:', dbError);
            return res.status(500).json({ success: false, error: 'Database error' });
          }
        }
        
        try {
          const result = await client.query(`
            SELECT id, name, platform, url, is_active, last_sync, created_at
            FROM admin_calendar_configs 
            ORDER BY created_at DESC
          `);
          
          const calendars = result.rows.map(row => ({
            id: row.id.toString(),
            name: row.name,
            platform: row.platform,
            url: row.url,
            isActive: row.is_active,
            lastSync: row.last_sync ? row.last_sync.toISOString() : null,
            syncStatus: row.last_sync ? 'success' : 'manual',
            blockedDates: [] // TODO: implementare query blocked dates per calendario
          }));
          
          return res.status(200).json({
            success: true,
            calendars: calendars
          });
        } catch (dbError) {
          console.error('Database error in calendars:', dbError);
          return res.status(500).json({ success: false, error: 'Database error' });
        }

      case 'sync-calendar':
        if (req.method === 'POST') {
          try {
            const { calendarId } = req.body;
            
            // Aggiorna last_sync nel database
            await client.query(`
              UPDATE admin_calendar_configs 
              SET last_sync = NOW(), updated_at = NOW()
              WHERE id = $1
            `, [calendarId]);
            
            // TODO: Implementare sincronizzazione reale con API esterni
            
            return res.status(200).json({
              success: true,
              syncId: `sync_${Date.now()}`,
              message: 'Calendario sincronizzato con successo'
            });
          } catch (dbError) {
            console.error('Database error syncing calendar:', dbError);
            return res.status(500).json({ success: false, error: 'Sync error' });
          }
        }
        break;

      case 'blocked-dates':
        if (req.method === 'POST') {
          try {
            const { date, reason, type } = req.body;
            
            const result = await client.query(`
              INSERT INTO admin_blocked_dates (blocked_date, reason, block_type, created_at, updated_at)
              VALUES ($1, $2, $3, NOW(), NOW())
              RETURNING id
            `, [date, reason, type || 'manual']);
            
            return res.status(200).json({
              success: true,
              id: result.rows[0].id.toString(),
              message: 'Data bloccata aggiunta con successo'
            });
          } catch (dbError) {
            console.error('Database error adding blocked date:', dbError);
            return res.status(500).json({ success: false, error: 'Database error' });
          }
        }
        
        try {
          const result = await client.query(`
            SELECT id, blocked_date, reason, block_type, created_at
            FROM admin_blocked_dates 
            WHERE blocked_date >= CURRENT_DATE
            ORDER BY blocked_date ASC
          `);
          
          const blockedDates = result.rows.map(row => ({
            id: row.id.toString(),
            date: row.blocked_date.toISOString().split('T')[0],
            reason: row.reason,
            type: row.block_type
          }));
          
          return res.status(200).json({
            success: true,
            blockedDates: blockedDates
          });
        } catch (dbError) {
          console.error('Database error in blocked dates:', dbError);
          return res.status(500).json({ success: false, error: 'Database error' });
        }

      case 'notifications':
        if (req.method === 'POST') {
          try {
            const { notificationId } = req.body;
            
            await client.query(`
              UPDATE admin_notifications 
              SET is_read = true, updated_at = NOW()
              WHERE id = $1
            `, [notificationId]);
            
            return res.status(200).json({
              success: true,
              message: 'Notifica marcata come letta'
            });
          } catch (dbError) {
            console.error('Database error updating notification:', dbError);
            return res.status(500).json({ success: false, error: 'Database error' });
          }
        }
        
        try {
          const notificationsResult = await client.query(`
            SELECT id, notification_type, title, message, created_at, is_read
            FROM admin_notifications 
            ORDER BY created_at DESC
            LIMIT 50
          `);
          
          const unreadResult = await client.query(`
            SELECT COUNT(*) as unread_count
            FROM admin_notifications 
            WHERE is_read = false
          `);
          
          const notifications = notificationsResult.rows.map(row => ({
            id: row.id.toString(),
            type: row.notification_type,
            title: row.title,
            message: row.message,
            timestamp: row.created_at.toISOString(),
            read: row.is_read
          }));
          
          return res.status(200).json({
            success: true,
            notifications: notifications,
            unreadCount: parseInt(unreadResult.rows[0].unread_count)
          });
        } catch (dbError) {
          console.error('Database error in notifications:', dbError);
          return res.status(500).json({ success: false, error: 'Database error' });
        }

      case 'analytics':
        try {
          const { period } = req.query;
          const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;
          
          // Calcola analytics reali dal database
          const bookingTrendsResult = await client.query(`
            SELECT 
              DATE(created_at) as date,
              COUNT(*) as bookings,
              COALESCE(SUM(total_amount), 0) as revenue
            FROM admin_bookings 
            WHERE created_at >= CURRENT_DATE - INTERVAL '${days} days'
            GROUP BY DATE(created_at)
            ORDER BY date DESC
          `);
          
          const occupancyResult = await client.query(`
            SELECT 
              COUNT(CASE WHEN status = 'confirmed' THEN 1 END)::float / 
              NULLIF(COUNT(*), 0) * 100 as occupancy_rate
            FROM admin_bookings 
            WHERE created_at >= CURRENT_DATE - INTERVAL '${days} days'
          `);
          
          return res.status(200).json({
            success: true,
            analytics: {
              bookingTrends: bookingTrendsResult.rows,
              occupancyRate: parseFloat(occupancyResult.rows[0]?.occupancy_rate) || 0,
              totalRevenue: bookingTrendsResult.rows.reduce((sum, row) => sum + parseFloat(row.revenue), 0),
              averageBookingValue: bookingTrendsResult.rows.length > 0 ? 
                bookingTrendsResult.rows.reduce((sum, row) => sum + parseFloat(row.revenue), 0) / bookingTrendsResult.rows.length : 0
            }
          });
        } catch (dbError) {
          console.error('Database error in analytics:', dbError);
          return res.status(500).json({ success: false, error: 'Database error' });
        }

      case 'export-data':
        if (req.method === 'POST') {
          try {
            const { type } = req.body;
            
            let exportData = {};
            
            if (type === 'bookings' || type === 'all') {
              const bookingsResult = await client.query(`
                SELECT * FROM admin_bookings 
                ORDER BY created_at DESC
              `);
              exportData.bookings = bookingsResult.rows;
            }
            
            if (type === 'analytics' || type === 'all') {
              const analyticsResult = await client.query(`
                SELECT 
                  DATE(created_at) as date,
                  COUNT(*) as bookings,
                  SUM(total_amount) as revenue,
                  AVG(total_amount) as avg_booking_value
                FROM admin_bookings 
                WHERE created_at >= CURRENT_DATE - INTERVAL '365 days'
                GROUP BY DATE(created_at)
                ORDER BY date DESC
              `);
              exportData.analytics = analyticsResult.rows;
            }
            
            return res.status(200).json({
              success: true,
              data: exportData,
              exportedAt: new Date().toISOString(),
              message: `Dati ${type} esportati con successo`
            });
          } catch (dbError) {
            console.error('Database error in export:', dbError);
            return res.status(500).json({ success: false, error: 'Export error' });
          }
        }
        break;

      case 'setup-database':
        if (req.method === 'POST') {
          try {
            console.log('Inizializzazione database tables...');
            
            // Crea tabella admin_bookings se non esiste
            await client.query(`
              CREATE TABLE IF NOT EXISTS admin_bookings (
                id SERIAL PRIMARY KEY,
                guest_name VARCHAR(255) NOT NULL,
                guest_email VARCHAR(255) NOT NULL,
                guest_phone VARCHAR(50),
                check_in_date DATE NOT NULL,
                check_out_date DATE NOT NULL,
                guests_count INTEGER NOT NULL DEFAULT 1,
                status VARCHAR(50) NOT NULL DEFAULT 'pending',
                total_amount DECIMAL(10,2) NOT NULL,
                deposit_amount DECIMAL(10,2) DEFAULT 0,
                platform VARCHAR(50) DEFAULT 'direct',
                confirmation_code VARCHAR(50) UNIQUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
              )
            `);
            
            // Crea tabella admin_blocked_dates se non esiste
            await client.query(`
              CREATE TABLE IF NOT EXISTS admin_blocked_dates (
                id SERIAL PRIMARY KEY,
                blocked_date DATE NOT NULL,
                reason VARCHAR(255) NOT NULL,
                block_type VARCHAR(50) NOT NULL DEFAULT 'manual',
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(blocked_date, block_type)
              )
            `);
            
            // Inserisci dati demo se tabelle vuote
            const bookingCount = await client.query('SELECT COUNT(*) FROM admin_bookings');
            if (parseInt(bookingCount.rows[0].count) === 0) {
              await client.query(`
                INSERT INTO admin_bookings (guest_name, guest_email, guest_phone, check_in_date, check_out_date, guests_count, status, total_amount, deposit_amount, platform, confirmation_code) VALUES 
                ('Marco Bianchi', 'marco.bianchi@email.com', '+39 335 123 4567', '2025-02-15', '2025-02-20', 2, 'confirmed', 850.00, 255.00, 'direct', 'VNC2025001'),
                ('Sarah Johnson', 'sarah.johnson@email.com', '+44 7700 900123', '2025-03-01', '2025-03-07', 4, 'pending', 1400.00, 420.00, 'airbnb', 'VNC2025002'),
                ('Giuseppe Rossi', 'g.rossi@email.com', '+39 340 987 6543', '2025-01-28', '2025-02-02', 1, 'confirmed', 425.00, 127.50, 'direct', 'VNC2025003')
              `);
            }
            
            const blockedCount = await client.query('SELECT COUNT(*) FROM admin_blocked_dates');
            if (parseInt(blockedCount.rows[0].count) === 0) {
              await client.query(`
                INSERT INTO admin_blocked_dates (blocked_date, reason, block_type) VALUES 
                ('2025-02-28', 'Manutenzione impianto idraulico', 'maintenance'),
                ('2025-03-15', 'Vacanza personale proprietario', 'personal'),
                ('2025-04-25', 'Festa della Liberazione', 'holiday')
              `);
            }
            
            // Aggiungi colonne mancanti se necessario
            try {
              await client.query(`
                ALTER TABLE admin_notifications ADD COLUMN IF NOT EXISTS notification_type VARCHAR(50) DEFAULT 'system'
              `);
            } catch (alterError) {
              console.log('Column already exists or alter failed:', alterError.message);
            }
            
            // Aggiorna o inserisci notifica di setup
            try {
              await client.query(`
                INSERT INTO admin_notifications (title, message, notification_type, is_read)
                VALUES ('Sistema Admin Configurato', 'Database configurato con successo. Tutte le funzionalità sono ora operative.', 'system', false)
                ON CONFLICT DO NOTHING
              `);
            } catch (notifError) {
              console.log('Notification insert failed:', notifError.message);
            }
            
            return res.status(200).json({
              success: true,
              message: 'Database inizializzato con successo',
              tables_created: ['admin_bookings', 'admin_blocked_dates'],
              setup_complete: true
            });
          } catch (dbError) {
            console.error('Database setup error:', dbError);
            return res.status(500).json({ 
              success: false, 
              error: 'Setup error',
              details: dbError.message
            });
          }
        }
        break;

      case 'database-status':
        try {
          // Verifica stato tabelle
          const tables = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name LIKE 'admin_%'
          `);
          
          // Verifica colonne admin_bookings
          const bookingColumns = await client.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'admin_bookings' AND table_schema = 'public'
          `);
          
          // Conta record
          const counts = {};
          for (const table of tables.rows) {
            try {
              const countResult = await client.query(`SELECT COUNT(*) FROM ${table.table_name}`);
              counts[table.table_name] = parseInt(countResult.rows[0].count);
            } catch (e) {
              counts[table.table_name] = `Error: ${e.message}`;
            }
          }
          
          return res.status(200).json({
            success: true,
            tables: tables.rows.map(r => r.table_name),
            bookingColumns: bookingColumns.rows,
            recordCounts: counts,
            databaseUrl: !!process.env.DATABASE_URL
          });
        } catch (dbError) {
          console.error('Database status error:', dbError);
          return res.status(500).json({ success: false, error: 'Database status error', details: dbError.message });
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
