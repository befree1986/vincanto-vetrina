// 🧹 PULIZIA DATABASE DIRETTA - Bypass API Vercel
// Connessione diretta a PostgreSQL per pulire dati mock

import pkg from 'pg';
const { Client } = pkg;

// Configurazione database Neon
const client = new Client({
  connectionString: 'postgresql://neondb_owner:npg_5TBySVaU7Ktf@ep-sweet-glitter-ag53yugd-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require',
  ssl: {
    rejectUnauthorized: false
  }
});

async function cleanupDatabase() {
  console.log('🧹 CONNESSIONE AL DATABASE...');
  
  try {
    await client.connect();
    console.log('✅ Connesso a PostgreSQL Neon');

    // 1. CANCELLA PRENOTAZIONI MOCK/DEMO
    const deleteBookings = await client.query(`
      DELETE FROM bookings 
      WHERE guest_email LIKE '%demo%' 
         OR guest_email LIKE '%test%'
         OR guest_email LIKE '%mock%'
         OR guest_name LIKE '%Demo%'
         OR guest_name LIKE '%Test%'
      RETURNING id
    `);

    // 2. CANCELLA DATE BLOCCATE DEMO
    const deleteBlockedDates = await client.query(`
      DELETE FROM blocked_dates 
      WHERE reason LIKE '%demo%' 
         OR reason LIKE '%test%'
         OR reason LIKE '%mock%'
         OR source = 'demo'
      RETURNING date
    `);

    // 3. CANCELLA PAGAMENTI DEMO
    const deletePayments = await client.query(`
      DELETE FROM payments 
      WHERE booking_id NOT IN (SELECT id FROM bookings)
         OR amount = 999.99
         OR stripe_payment_intent_id LIKE 'pi_mock_%'
      RETURNING id
    `);

    // 4. CANCELLA EVENTI CALENDARIO DEMO
    const deleteCalendarEvents = await client.query(`
      DELETE FROM calendar_events 
      WHERE title LIKE '%demo%' 
         OR title LIKE '%test%'
         OR description LIKE '%mock%'
      RETURNING id
    `);

    // 5. RESET SYNC STATUS
    const resetSyncStatus = await client.query(`
      DELETE FROM calendar_sync_status 
      WHERE calendar_name LIKE '%demo%'
         OR calendar_name LIKE '%test%'
      RETURNING calendar_name
    `);

    // 6. RESET CONFIGURAZIONI TEST
    const resetConfigs = await client.query(`
      DELETE FROM system_config 
      WHERE config_key LIKE '%demo%'
         OR config_key LIKE '%test%'
      RETURNING config_key
    `);

    console.log('\n✅ PULIZIA DATABASE COMPLETATA:');
    console.log(`   📝 ${deleteBookings.rowCount} prenotazioni demo rimosse`);
    console.log(`   🚫 ${deleteBlockedDates.rowCount} date bloccate demo rimosse`);
    console.log(`   💳 ${deletePayments.rowCount} pagamenti demo rimossi`);
    console.log(`   📅 ${deleteCalendarEvents.rowCount} eventi calendario demo rimossi`);
    console.log(`   🔄 ${resetSyncStatus.rowCount} stati sync resettati`);
    console.log(`   ⚙️  ${resetConfigs.rowCount} configurazioni test rimosse`);
    
    console.log('\n🎯 DATABASE ONLINE PULITO - SISTEMA PRONTO');
    
    return {
      success: true,
      totalDeleted: deleteBookings.rowCount + deleteBlockedDates.rowCount + deletePayments.rowCount + deleteCalendarEvents.rowCount
    };

  } catch (error) {
    console.error('❌ ERRORE PULIZIA DATABASE:', error.message);
    return { success: false, error: error.message };
  } finally {
    await client.end();
  }
}

// Esegui pulizia
cleanupDatabase()
  .then(result => {
    if (result.success) {
      console.log('\n🚀 Database pulito con successo!');
      process.exit(0);
    } else {
      console.error('\n💥 Pulizia fallita:', result.error);
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('💥 ERRORE FATALE:', error);
    process.exit(1);
  });