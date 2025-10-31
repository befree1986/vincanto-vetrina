// /api/admin.js - API completa per pannello admin con database Neon reale
import { Client } from 'pg';

// Configurazione database
const getDbClient = () => {
  return new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });
};

export default async function handler(req, res) {
  // Abilita CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { action } = req.query;
  let client;

  try {
    client = getDbClient();
    await client.connect();

    switch (action) {
      
      // === DASHBOARD STATS REALI ===
      case 'dashboard-stats':
        if (req.method !== 'GET') {
          return res.status(405).json({ success: false, error: 'Metodo non consentito' });
        }

        const statsQuery = `
          SELECT 
            COUNT(*) as total_bookings,
            SUM(CASE WHEN booking_status = 'confirmed' THEN 1 ELSE 0 END) as confirmed_bookings,
            SUM(CASE WHEN booking_status = 'pending' THEN 1 ELSE 0 END) as pending_bookings,
            SUM(total_amount) as total_revenue,
            AVG(EXTRACT(DAY FROM (check_out_date - check_in_date))) as average_stay
          FROM bookings 
          WHERE created_at >= CURRENT_DATE - INTERVAL '90 days'
        `;

        const statsResult = await client.query(statsQuery);
        const stats = statsResult.rows[0];

        // Calcola calendari attivi
        const calendarsResult = await client.query(
          'SELECT COUNT(*) as count FROM admin_calendar_configs WHERE is_active = true'
        );

        // Calcola tasso occupazione (esempio semplificato)
        const occupancyResult = await client.query(`
          SELECT COUNT(DISTINCT check_in_date) as booked_days
          FROM bookings 
          WHERE booking_status = 'confirmed' 
          AND check_in_date >= CURRENT_DATE - INTERVAL '30 days'
          AND check_in_date < CURRENT_DATE
        `);

        const occupancyRate = occupancyResult.rows[0].booked_days / 30;

        return res.status(200).json({
          success: true,
          stats: {
            totalBookings: parseInt(stats.total_bookings) || 0,
            activeCalendars: parseInt(calendarsResult.rows[0].count) || 0,
            totalRevenue: parseFloat(stats.total_revenue) || 0,
            confirmedBookings: parseInt(stats.confirmed_bookings) || 0,
            pendingBookings: parseInt(stats.pending_bookings) || 0,
            averageStay: parseFloat(stats.average_stay) || 0,
            occupancyRate: occupancyRate || 0
          }
        });

      // === PRENOTAZIONI REALI ===
      case 'bookings':
        if (req.method === 'GET') {
          const bookingsQuery = `
            SELECT 
              id,
              customer_name as guest_name,
              customer_email as guest_email,
              check_in_date as "checkIn",
              check_out_date as "checkOut",
              num_adults + COALESCE(num_children, 0) as guests,
              booking_status as status,
              total_amount,
              created_at
            FROM bookings 
            ORDER BY created_at DESC 
            LIMIT 50
          `;

          const result = await client.query(bookingsQuery);
          
          return res.status(200).json({
            success: true,
            bookings: result.rows.map(row => ({
              id: row.id.toString(),
              guestName: row.guest_name,
              guestEmail: row.guest_email,
              checkIn: row.checkIn,
              checkOut: row.checkOut,
              guests: row.guests,
              status: row.status || 'pending',
              totalAmount: parseFloat(row.total_amount) || 0
            }))
          });
        }
        break;

      // === CALENDARI REALI ===
      case 'calendars':
        if (req.method === 'GET') {
          const calendarsQuery = `
            SELECT 
              id,
              calendar_name as name,
              platform,
              sync_status,
              last_sync_at as "lastSync",
              is_active as "isActive"
            FROM admin_calendar_configs
            ORDER BY created_at DESC
          `;

          const result = await client.query(calendarsQuery);
          
          return res.status(200).json({
            success: true,
            calendars: result.rows.map(row => ({
              id: row.id.toString(),
              name: row.name,
              platform: row.platform,
              isActive: row.isActive,
              syncStatus: row.sync_status,
              lastSync: row.lastSync || new Date().toISOString(),
              blockedDates: [] // TODO: implementare join con eventi
            }))
          });
        }

        if (req.method === 'POST') {
          const { name, platform, url } = req.body;
          
          const insertQuery = `
            INSERT INTO admin_calendar_configs (calendar_name, platform, calendar_url, is_active)
            VALUES ($1, $2, $3, true)
            RETURNING id
          `;
          
          const result = await client.query(insertQuery, [name, platform, url]);
          
          return res.status(201).json({
            success: true,
            message: 'Calendario aggiunto con successo',
            id: result.rows[0].id
          });
        }
        break;

      // === CONFIGURAZIONE PREZZI REALI ===
      case 'pricing-config':
        if (req.method === 'GET') {
          const configQuery = `
            SELECT 
              base_price_per_adult as "basePrice",
              additional_guest_price as "additionalGuestPrice", 
              cleaning_fee as "cleaningFee",
              parking_fee_per_night as "parkingFeePerNight",
              minimum_nights as "minimumNights"
            FROM pricing_config 
            ORDER BY id DESC 
            LIMIT 1
          `;

          const result = await client.query(configQuery);
          
          if (result.rows.length === 0) {
            // Crea configurazione default se non esiste
            await client.query(`
              INSERT INTO pricing_config (base_price_per_adult, additional_guest_price, cleaning_fee, parking_fee_per_night, minimum_nights)
              VALUES (75.00, 30.00, 30.00, 15.00, 2)
            `);
            
            return res.status(200).json({
              success: true,
              config: {
                basePrice: 75.00,
                additionalGuestPrice: 30.00,
                cleaningFee: 30.00,
                parkingFeePerNight: 15.00,
                minimumNights: 2,
                depositPercentage: 0.30
              }
            });
          }

          const config = result.rows[0];
          return res.status(200).json({
            success: true,
            config: {
              basePrice: parseFloat(config.basePrice),
              additionalGuestPrice: parseFloat(config.additionalGuestPrice),
              cleaningFee: parseFloat(config.cleaningFee),
              parkingFeePerNight: parseFloat(config.parkingFeePerNight),
              minimumNights: parseInt(config.minimumNights),
              depositPercentage: 0.30 // TODO: aggiungere al database
            }
          });
        }

        if (req.method === 'PUT') {
          const { basePrice, additionalGuestPrice, cleaningFee, parkingFeePerNight, minimumNights } = req.body;
          
          const updateQuery = `
            UPDATE pricing_config SET 
              base_price_per_adult = $1,
              additional_guest_price = $2,
              cleaning_fee = $3,
              parking_fee_per_night = $4,
              minimum_nights = $5,
              updated_at = CURRENT_TIMESTAMP
            WHERE id = (SELECT id FROM pricing_config ORDER BY id DESC LIMIT 1)
          `;
          
          await client.query(updateQuery, [
            basePrice, additionalGuestPrice, cleaningFee, 
            parkingFeePerNight, minimumNights
          ]);
          
          return res.status(200).json({
            success: true,
            message: 'Configurazione aggiornata con successo'
          });
        }
        break;

      // === NOTIFICHE REALI ===
      case 'notifications':
        if (req.method === 'GET') {
          const notificationsQuery = `
            SELECT 
              id,
              title,
              message,
              type,
              priority,
              is_read as "read",
              created_at as "timestamp",
              booking_id
            FROM admin_notifications 
            ORDER BY created_at DESC 
            LIMIT 20
          `;

          const result = await client.query(notificationsQuery);
          const unreadCount = result.rows.filter(n => !n.read).length;
          
          return res.status(200).json({
            success: true,
            notifications: result.rows,
            unreadCount
          });
        }
        break;

      // === ANALYTICS REALI ===
      case 'analytics':
        if (req.method === 'GET') {
          const analyticsQuery = `
            SELECT 
              date,
              bookings_count,
              revenue_total,
              occupancy_rate,
              average_daily_rate
            FROM admin_daily_stats 
            WHERE date >= CURRENT_DATE - INTERVAL '30 days'
            ORDER BY date DESC
          `;

          const result = await client.query(analyticsQuery);
          
          return res.status(200).json({
            success: true,
            analytics: result.rows
          });
        }
        break;

      // === BLOCKED DATES ===
      case 'blocked-dates':
        if (req.method === 'GET') {
          const blockedQuery = `
            SELECT id, start_date, end_date, reason, created_at
            FROM blocked_dates 
            ORDER BY start_date ASC
          `;

          const result = await client.query(blockedQuery);
          
          return res.status(200).json({
            success: true,
            blockedDates: result.rows
          });
        }

        if (req.method === 'POST') {
          const { date, reason, type } = req.body;
          
          const insertQuery = `
            INSERT INTO blocked_dates (start_date, end_date, reason, created_by)
            VALUES ($1, $1, $2, 'admin')
            RETURNING id
          `;
          
          const result = await client.query(insertQuery, [date, reason]);
          
          return res.status(201).json({
            success: true,
            message: 'Data bloccata aggiunta',
            id: result.rows[0].id
          });
        }
        break;

      default:
        return res.status(404).json({
          success: false,
          error: 'Endpoint non trovato'
        });
    }

  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({
      success: false,
      error: 'Errore interno del server',
      details: error.message
    });
  } finally {
    if (client) {
      await client.end();
    }
  }
}