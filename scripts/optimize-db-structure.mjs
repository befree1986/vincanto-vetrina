// 🧹 OTTIMIZZAZIONE DATABASE - Rimuove tabelle vuote e duplicati
// Pulizia strutturale per mantenere DB lean

import pkg from 'pg';
const { Client } = pkg;

const client = new Client({
  connectionString: 'postgresql://neondb_owner:npg_5TBySVaU7Ktf@ep-sweet-glitter-ag53yugd-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require',
  ssl: {
    rejectUnauthorized: false
  }
});

async function optimizeDatabaseStructure() {
  console.log('🧹 OTTIMIZZAZIONE STRUTTURA DATABASE...');
  
  try {
    await client.connect();
    console.log('✅ Connesso a PostgreSQL Neon');

    // FASE 1: RIMOZIONE TABELLE VUOTE
    console.log('\n🗑️  FASE 1: RIMOZIONE TABELLE VUOTE');
    
    const emptyTablesToRemove = [
      'admin_activity_logs',
      'admin_calendar_events', 
      'admin_daily_stats',
      'admin_email_logs',
      'blocked_dates',        // Duplicato vuoto di admin_blocked_dates
      'bookings',            // Duplicato vuoto di admin_bookings  
      'calendar_configs',    // Vuoto, non utilizzato
      'payments'             // Vuoto, non utilizzato
    ];

    let removedTables = 0;
    
    for (const tableName of emptyTablesToRemove) {
      try {
        // Verifica che sia effettivamente vuota
        const count = await client.query(`SELECT COUNT(*) FROM ${tableName}`);
        if (count.rows[0].count === '0') {
          await client.query(`DROP TABLE IF EXISTS ${tableName} CASCADE`);
          console.log(`   ✅ Rimossa: ${tableName}`);
          removedTables++;
        } else {
          console.log(`   ⚠️  Saltata: ${tableName} (${count.rows[0].count} record)`);
        }
      } catch (error) {
        console.log(`   ❌ Errore rimozione ${tableName}: ${error.message}`);
      }
    }

    // FASE 2: CONSOLIDAMENTO DUPLICATI (solo se sicuro)
    console.log('\n🔄 FASE 2: CONSOLIDAMENTO DUPLICATI');
    
    // Non facciamo consolidamento automatico per sicurezza
    // Stampiamo solo raccomandazioni
    
    console.log('\n📋 RACCOMANDAZIONI CONSOLIDAMENTO (manuale):');
    console.log('   1. PRENOTAZIONI:');
    console.log('      • admin_bookings (3 record) → Struttura principale');  
    console.log('      • bookings era vuoto (rimosso)');
    
    console.log('   2. SETTINGS (3 tabelle):');
    console.log('      • settings (7 record) - Configurazioni base');
    console.log('      • admin_settings (57 record) - Configurazioni admin');
    console.log('      • system_settings (14 record) - Configurazioni sistema');
    console.log('      → Mantieni tutte per scopi diversi');
    
    console.log('   3. PRICING:');
    console.log('      • pricing_config (1 record) - Config semplice');
    console.log('      • pricing_configs (3 record) - Config multiple');
    console.log('      → Valuta quale utilizzare nell\'app');

    // FASE 3: VERIFICA FINALE
    console.log('\n📊 FASE 3: VERIFICA OTTIMIZZAZIONE');
    
    const remainingTables = await client.query(`
      SELECT table_name, 
             (SELECT COUNT(*) FROM information_schema.tables t2 
              WHERE t2.table_name = t1.table_name AND table_schema = 'public') as exists
      FROM information_schema.tables t1
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);

    console.log('\n✅ TABELLE RIMANENTI:');
    for (const table of remainingTables.rows) {
      const count = await client.query(`SELECT COUNT(*) FROM ${table.table_name}`);
      console.log(`   📊 ${table.table_name}: ${count.rows[0].count} record`);
    }

    console.log('\n🎯 OTTIMIZZAZIONE COMPLETATA:');
    console.log(`   🗑️  Tabelle rimosse: ${removedTables}`);
    console.log(`   📊 Tabelle rimanenti: ${remainingTables.rows.length}`);
    console.log(`   💾 Database ora più lean e organizzato`);

    // FASE 4: SUGGERIMENTI FINALI
    console.log('\n💡 SUGGERIMENTI POST-OTTIMIZZAZIONE:');
    console.log('   1. Aggiorna l\'app per usare solo admin_bookings');
    console.log('   2. Scegli tra pricing_config e pricing_configs');
    console.log('   3. Monitora performance migliorata');
    console.log('   4. Considera backup prima di modifiche future');

  } catch (error) {
    console.error('❌ ERRORE OTTIMIZZAZIONE:', error.message);
  } finally {
    await client.end();
  }
}

optimizeDatabaseStructure();