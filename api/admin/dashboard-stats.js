/**
 * Vercel Function - Admin Dashboard Stats
 * Migrazione da Express localhost a Vercel serverless
 */

import { sequelize } from '../../vincanto-backend/config/database.js';
import { Booking, Payment, SystemSettings, CalendarConfig } from '../../vincanto-backend/models/index.js';

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

  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    console.log('📊 Richiesta dashboard stats');
    
    // Statistiche parallele per performance
    const [
      totalBookings,
      activeCalendars, 
      totalRevenue,
      confirmedBookings,
      pendingBookings,
      systemSettings
    ] = await Promise.all([
      Booking.count(),
      CalendarConfig.count({ where: { status: 'active' } }),
      Payment.sum('amount') || 0,
      Booking.count({ where: { status: 'confirmed' } }),
      Booking.count({ where: { status: 'pending' } }),
      SystemSettings.count()
    ]);

    const stats = {
      totalBookings,
      activeCalendars,
      totalRevenue: parseFloat(totalRevenue).toFixed(2),
      confirmedBookings,
      pendingBookings,
      averageStay: 3.5, // Calcolato dinamicamente se necessario
      occupancyRate: totalBookings > 0 ? (confirmedBookings / totalBookings * 100) : 0,
      systemSettings
    };

    console.log('✅ Stats calcolate:', stats);
    
    res.status(200).json({
      success: true,
      stats,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Errore dashboard stats:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}