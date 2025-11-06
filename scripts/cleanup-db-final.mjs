// 🧹 PULIZIA DATABASE FINALE - Basata su struttura reale
// Rimuove dati mock/demo dalle tabelle esistenti

import pkg from 'pg';
const { Client } = pkg;

const client = new Client({
  connectionString: 'postgresql://neondb_owner:npg_5TBySVaU7Ktf@ep-sweet-glitter-ag53yugd-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require',
  ssl: {
    rejectUnauthorized: false
  }
});

async function cleanupDatabase() {
  console.log('🧹 PULIZIA DATABASE FINALE...');
  
  try {
    await client.connect();
    console.log('✅ Connesso a PostgreSQL Neon');

    let totalDeleted = 0;

    // 1. PULIZIA TABELLE ADMIN - Dati Demo
    console.log('\n🗑️  Eliminando prenotazioni ADMIN mock...');
    const deleteAdminBookings = await client.query(`
      DELETE FROM admin_bookings 
      WHERE guest_email LIKE '%demo%' 
         OR guest_email LIKE '%test%'
         OR guest_email LIKE '%mock%'
         OR guest_name LIKE '%Demo%'
         OR guest_name LIKE '%Test%'
         OR guest_name LIKE '%Mock%'
      RETURNING id
    `);
    console.log(`   ✅ ${deleteAdminBookings.rowCount} prenotazioni admin rimosse`);
    totalDeleted += deleteAdminBookings.rowCount;

    // 2. PULIZIA DATE BLOCCATE DEMO
    console.log('\n🚫 Eliminando date bloccate demo...');
    const deleteAdminBlockedDates = await client.query(`
      DELETE FROM admin_blocked_dates 
      WHERE reason LIKE '%demo%' 
         OR reason LIKE '%test%'
         OR reason LIKE '%mock%'
      RETURNING id
    `);
    console.log(`   ✅ ${deleteAdminBlockedDates.rowCount} date bloccate admin rimosse`);
    totalDeleted += deleteAdminBlockedDates.rowCount;

    // 3. PULIZIA EVENTI CALENDARIO DEMO
    console.log('\n📅 Eliminando eventi calendario demo...');
    const deleteAdminCalendarEvents = await client.query(`
      DELETE FROM admin_calendar_events 
      WHERE title LIKE '%demo%' 
         OR title LIKE '%test%'
         OR guest_name LIKE '%Demo%'
         OR guest_name LIKE '%Test%'
         OR platform = 'demo'
      RETURNING id
    `);
    console.log(`   ✅ ${deleteAdminCalendarEvents.rowCount} eventi calendario admin rimossi`);
    totalDeleted += deleteAdminCalendarEvents.rowCount;

    // 4. PULIZIA CONFIGURAZIONI CALENDARIO DEMO
    console.log('\n⚙️  Eliminando configurazioni calendario demo...');
    const deleteAdminCalendarConfigs = await client.query(`
      DELETE FROM admin_calendar_configs 
      WHERE calendar_name LIKE '%demo%' 
         OR calendar_name LIKE '%test%'
         OR platform = 'demo'
      RETURNING id
    `);
    console.log(`   ✅ ${deleteAdminCalendarConfigs.rowCount} configurazioni calendario admin rimosse`);
    totalDeleted += deleteAdminCalendarConfigs.rowCount;

    // 5. PULIZIA NOTIFICHE DEMO
    console.log('\n🔔 Eliminando notifiche demo...');
    const deleteAdminNotifications = await client.query(`
      DELETE FROM admin_notifications 
      WHERE title LIKE '%demo%' 
         OR title LIKE '%test%'
         OR message LIKE '%demo%'
         OR message LIKE '%test%'
      RETURNING id
    `);
    console.log(`   ✅ ${deleteAdminNotifications.rowCount} notifiche admin rimosse`);
    totalDeleted += deleteAdminNotifications.rowCount;

    // 6. PULIZIA LOG ATTIVITÀ DEMO
    console.log('\n📋 Eliminando log attività demo...');
    const deleteAdminActivityLogs = await client.query(`
      DELETE FROM admin_activity_logs 
      WHERE admin_user LIKE '%demo%' 
         OR admin_user LIKE '%test%'
         OR action LIKE '%demo%'
         OR action LIKE '%test%'
      RETURNING id
    `);
    console.log(`   ✅ ${deleteAdminActivityLogs.rowCount} log attività admin rimossi`);
    totalDeleted += deleteAdminActivityLogs.rowCount;

    // 7. PULIZIA LOG EMAIL DEMO
    console.log('\n📧 Eliminando log email demo...');
    const deleteAdminEmailLogs = await client.query(`
      DELETE FROM admin_email_logs 
      WHERE recipient_email LIKE '%demo%' 
         OR recipient_email LIKE '%test%'
         OR subject LIKE '%demo%'
         OR subject LIKE '%test%'
      RETURNING id
    `);
    console.log(`   ✅ ${deleteAdminEmailLogs.rowCount} log email admin rimossi`);
    totalDeleted += deleteAdminEmailLogs.rowCount;

    // 8. PULIZIA STATISTICHE GIORNALIERE DEMO
    console.log('\n📊 Eliminando statistiche demo...');
    const deleteAdminDailyStats = await client.query(`
      DELETE FROM admin_daily_stats 
      WHERE bookings_count = 0 
         AND revenue_total = 0
      RETURNING id
    `);
    console.log(`   ✅ ${deleteAdminDailyStats.rowCount} statistiche giornaliere demo rimosse`);
    totalDeleted += deleteAdminDailyStats.rowCount;

    // 9. PULIZIA TABELLE PRINCIPALI - Eventuali test
    console.log('\n🏠 Verificando tabelle principali...');
    
    // Bookings principali (dovrebbero essere già vuote)
    const deleteMainBookings = await client.query(`
      DELETE FROM bookings 
      WHERE guest_email LIKE '%demo%' 
         OR guest_email LIKE '%test%'
         OR guest_first_name LIKE '%Demo%'
         OR guest_first_name LIKE '%Test%'
      RETURNING id
    `);
    console.log(`   ✅ ${deleteMainBookings.rowCount} prenotazioni principali demo rimosse`);
    
    // Payments demo
    const deleteMainPayments = await client.query(`
      DELETE FROM payments 
      WHERE is_test_payment = true
         OR transaction_id LIKE '%demo%'
         OR transaction_id LIKE '%test%'
      RETURNING id
    `);
    console.log(`   ✅ ${deleteMainPayments.rowCount} pagamenti demo rimossi`);

    // Blocked dates demo
    const deleteMainBlockedDates = await client.query(`
      DELETE FROM blocked_dates 
      WHERE reason LIKE '%demo%' 
         OR reason LIKE '%test%'
      RETURNING id
    `);
    console.log(`   ✅ ${deleteMainBlockedDates.rowCount} date bloccate principali demo rimosse`);

    totalDeleted += deleteMainBookings.rowCount + deleteMainPayments.rowCount + deleteMainBlockedDates.rowCount;

    console.log('\n🎯 PULIZIA COMPLETATA!');
    console.log(`📈 TOTALE RECORD RIMOSSI: ${totalDeleted}`);
    
    // Verifica finale - conteggio tabelle
    console.log('\n📋 STATO FINALE TABELLE:');
    const finalCheck = await client.query(`
      SELECT 
        'admin_bookings' as table_name, COUNT(*) as records FROM admin_bookings
      UNION ALL SELECT 'admin_blocked_dates', COUNT(*) FROM admin_blocked_dates
      UNION ALL SELECT 'admin_notifications', COUNT(*) FROM admin_notifications
      UNION ALL SELECT 'bookings', COUNT(*) FROM bookings
      UNION ALL SELECT 'payments', COUNT(*) FROM payments
      UNION ALL SELECT 'blocked_dates', COUNT(*) FROM blocked_dates
    `);
    
    finalCheck.rows.forEach(row => {
      console.log(`   📊 ${row.table_name}: ${row.records} record${row.records !== '1' ? 's' : ''}`);
    });

    console.log('\n🚀 DATABASE PULITO E PRONTO PER PRODUZIONE!');
    
    return { success: true, totalDeleted };

  } catch (error) {
    console.error('❌ ERRORE PULIZIA:', error.message);
    return { success: false, error: error.message };
  } finally {
    await client.end();
  }
}

cleanupDatabase()
  .then(result => {
    if (result.success) {
      console.log(`\n✅ Pulizia completata con successo! ${result.totalDeleted} record rimossi.`);
      process.exit(0);
    } else {
      console.error(`\n❌ Pulizia fallita: ${result.error}`);
      process.exit(1);
    }
  });