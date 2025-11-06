// 🧹 SCRIPT PULIZIA DATABASE LOCALE
// Esegue la pulizia del database locale senza API

import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';

// Carica variabili ambiente
dotenv.config();

const sql = neon(process.env.DATABASE_URL);

async function cleanupDatabase() {
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
      RETURNING date
    `;

    // 3. CANCELLA PAGAMENTI DEMO
    const deletedPayments = await sql`
      DELETE FROM payments 
      WHERE booking_id NOT IN (SELECT id FROM bookings)
         OR amount = 999.99  -- Mock payment amount
         OR stripe_payment_intent_id LIKE 'pi_mock_%'
      RETURNING id
    `;

    // 4. RESET CALENDARIO A STATO PULITO
    const deletedCalendarEvents = await sql`
      DELETE FROM calendar_events 
      WHERE title LIKE '%demo%' 
         OR title LIKE '%test%'
         OR description LIKE '%mock%'
      RETURNING id
    `;

    // 5. PULISCI SYNC STATUS
    const resetSyncStatus = await sql`
      DELETE FROM calendar_sync_status 
      WHERE calendar_name LIKE '%demo%'
         OR calendar_name LIKE '%test%'
      RETURNING calendar_name
    `;

    // 6. RESET CONFIGURAZIONI DI TEST
    const resetConfigs = await sql`
      DELETE FROM system_config 
      WHERE config_key LIKE '%demo%'
         OR config_key LIKE '%test%'
      RETURNING config_key
    `;

    console.log('✅ PULIZIA COMPLETATA:');
    console.log(`   📝 ${deletedBookings.length} prenotazioni demo cancellate`);
    console.log(`   🚫 ${deletedBlockedDates.length} date bloccate demo cancellate`);
    console.log(`   💳 ${deletedPayments.length} pagamenti demo cancellati`);
    console.log(`   📅 ${deletedCalendarEvents.length} eventi calendario demo cancellati`);
    console.log(`   🔄 ${resetSyncStatus.length} stati sync resettati`);
    console.log(`   ⚙️  ${resetConfigs.length} configurazioni di test rimosse`);
    
    console.log('\n🎯 DATABASE PULITO - PRONTO PER PRODUZIONE');
    
    return {
      success: true,
      deleted: {
        bookings: deletedBookings.length,
        blockedDates: deletedBlockedDates.length,
        payments: deletedPayments.length,
        calendarEvents: deletedCalendarEvents.length,
        syncStatus: resetSyncStatus.length,
        configs: resetConfigs.length
      }
    };

  } catch (error) {
    console.error('❌ ERRORE DURANTE PULIZIA:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

// Esegui pulizia
cleanupDatabase()
  .then(result => {
    if (result.success) {
      process.exit(0);
    } else {
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('❌ ERRORE FATALE:', error);
    process.exit(1);
  });