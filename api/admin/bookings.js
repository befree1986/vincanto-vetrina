/**
 * Vercel Function - Admin Bookings Management
 * Migrazione da Express localhost a Vercel serverless
 */

import { sequelize } from '../../vincanto-backend/config/database.js';
import { Booking, Payment } from '../../vincanto-backend/models/index.js';

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method === 'GET') {
    try {
      const { page = 1, limit = 10, status, search } = req.query;
      const offset = (page - 1) * limit;
      
      // Query raw per evitare problemi Sequelize cache
      const totalResult = await sequelize.query(
        'SELECT COUNT(*) as count FROM bookings WHERE 1=1' + 
        (status && status !== 'all' ? ` AND status = :status` : '') +
        (search ? ` AND (guest_first_name ILIKE :search OR guest_last_name ILIKE :search OR guest_email ILIKE :search OR booking_number ILIKE :search)` : ''),
        {
          replacements: { status, search: search ? `%${search}%` : null },
          type: sequelize.QueryTypes.SELECT
        }
      );
      
      const bookings = await sequelize.query(
        `SELECT b.*, 
                json_agg(
                    CASE WHEN p.id IS NOT NULL THEN
                        json_build_object(
                            'id', p.id,
                            'amount', p.amount,
                            'status', p.status,
                            'payment_method', p.payment_method
                        )
                    END
                ) FILTER (WHERE p.id IS NOT NULL) as payments
         FROM bookings b
         LEFT JOIN payments p ON b.id = p.booking_id
         WHERE 1=1` +
        (status && status !== 'all' ? ` AND b.status = :status` : '') +
        (search ? ` AND (b.guest_first_name ILIKE :search OR b.guest_last_name ILIKE :search OR b.guest_email ILIKE :search OR b.booking_number ILIKE :search)` : '') +
        ` GROUP BY b.id
         ORDER BY b.created_at DESC
         LIMIT :limit OFFSET :offset`,
        {
          replacements: { 
            status, 
            search: search ? `%${search}%` : null,
            limit: parseInt(limit),
            offset: parseInt(offset)
          },
          type: sequelize.QueryTypes.SELECT
        }
      );
      
      const count = totalResult[0].count;
      
      res.status(200).json({
        success: true,
        bookings,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(count / limit)
        }
      });

    } catch (error) {
      console.error('❌ Errore lista bookings:', error);
      res.status(500).json({
        success: false,
        error: error.message,
        bookings: []
      });
    }
  } else {
    res.status(405).json({ success: false, error: 'Method not allowed' });
  }
}