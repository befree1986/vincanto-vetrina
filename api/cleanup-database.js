// 🧹 SCRIPT PULIZIA DATABASE - Rimuove tutti i mock/demo
// Eseguire per pulire DB da dati di test

import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Only POST method allowed' });
  }

  const { confirm_cleanup } = req.body;
  
  if (confirm_cleanup !== 'YES_DELETE_ALL_MOCK_DATA') {
    return res.status(400).json({ 
      error: 'Conferma richiesta con: { "confirm_cleanup": "YES_DELETE_ALL_MOCK_DATA" }' 
    });
  }

  console.log('🧹 INIZIANDO PULIZIA COMPLETA DATABASE...');

  try {
    // 1. CANCELLA TUTTE LE PRENOTAZIONI MOCK/DEMO
    const deletedBookings = await sql`
      DELETE FROM bookings 
      WHERE guest_email LIKE '%demo%' 
         OR guest_email LIKE '%test%'
         OR guest_email LIKE '%mock%'
         OR guest_name LIKE '%Demo%'
         OR guest_name LIKE '%Test%'
      RETURNING id
    `;

    // 2. CANCELLA DATE BLOCCATE DEMO
    const deletedBlockedDates = await sql`
      DELETE FROM blocked_dates 
      WHERE reason LIKE '%demo%' 
         OR reason LIKE '%test%'
         OR reason LIKE '%mock%'
         OR source = 'demo'
      RETURNING id
    `;

    // 3. CANCELLA TRANSAZIONI DEMO
    const deletedTransactions = await sql`
      DELETE FROM payment_transactions 
      WHERE booking_id IS NULL
         OR amount < 10
         OR stripe_payment_intent_id LIKE '%demo%'
      RETURNING id
    `;

    // 4. RESET CALENDARI CONFIGURATI (mantieni struttura)
    const resetCalendars = await sql`
      UPDATE calendar_configs 
      SET last_sync = NULL, 
          sync_status = 'pending',
          event_count = 0
      WHERE name LIKE '%Demo%' OR name LIKE '%Test%'
      RETURNING id, name
    `;

    // 5. CANCELLA SERVIZI EXTRA DEMO 
    const deletedServices = await sql`
      DELETE FROM extra_services 
      WHERE name LIKE '%demo%' 
         OR name LIKE '%test%'
         OR price <= 0
      RETURNING id, name
    `;

    // 6. RESET CONTATORI E STATISTICHE
    const resetStats = await sql`
      UPDATE system_stats 
      SET total_bookings = 0,
          total_revenue = 0,
          last_updated = NOW()
      WHERE type = 'demo'
    `;

    console.log('✅ PULIZIA DATABASE COMPLETATA');

    return res.status(200).json({
      success: true,
      message: 'Database pulito da tutti i dati mock/demo',
      cleaned: {
        bookings: deletedBookings.length,
        blocked_dates: deletedBlockedDates.length, 
        transactions: deletedTransactions.length,
        calendars_reset: resetCalendars.length,
        extra_services: deletedServices.length
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Errore pulizia database:', error);
    return res.status(500).json({
      success: false,
      error: 'Errore durante la pulizia database',
      details: error.message
    });
  }
}