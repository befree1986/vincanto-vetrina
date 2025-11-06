// 🔍 ANALISI OTTIMIZZAZIONE DATABASE
// Identifica tabelle duplicate, inutilizzate o ridondanti

import pkg from 'pg';
const { Client } = pkg;

const client = new Client({
  connectionString: 'postgresql://neondb_owner:npg_5TBySVaU7Ktf@ep-sweet-glitter-ag53yugd-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require',
  ssl: {
    rejectUnauthorized: false
  }
});

async function optimizeDatabase() {
  console.log('🔍 ANALISI OTTIMIZZAZIONE DATABASE...');
  
  try {
    await client.connect();
    console.log('✅ Connesso a PostgreSQL Neon');

    // 1. ANALISI TABELLE DUPLICATE O SIMILI
    console.log('\n📋 ANALISI TABELLE DUPLICATE:');
    
    // Bookings: bookings vs admin_bookings
    const mainBookings = await client.query('SELECT COUNT(*) FROM bookings');
    const adminBookings = await client.query('SELECT COUNT(*) FROM admin_bookings');
    console.log(`   📊 bookings (principale): ${mainBookings.rows[0].count} record`);
    console.log(`   📊 admin_bookings (admin): ${adminBookings.rows[0].count} record`);

    // Settings: settings vs admin_settings vs system_settings
    const settings = await client.query('SELECT COUNT(*) FROM settings');
    const adminSettings = await client.query('SELECT COUNT(*) FROM admin_settings');
    const systemSettings = await client.query('SELECT COUNT(*) FROM system_settings');
    console.log(`   ⚙️  settings: ${settings.rows[0].count} record`);
    console.log(`   ⚙️  admin_settings: ${adminSettings.rows[0].count} record`);
    console.log(`   ⚙️  system_settings: ${systemSettings.rows[0].count} record`);

    // Pricing: pricing_config vs pricing_configs
    const pricingConfig = await client.query('SELECT COUNT(*) FROM pricing_config');
    const pricingConfigs = await client.query('SELECT COUNT(*) FROM pricing_configs');
    console.log(`   💰 pricing_config (singolo): ${pricingConfig.rows[0].count} record`);
    console.log(`   💰 pricing_configs (multiplo): ${pricingConfigs.rows[0].count} record`);

    // Date bloccate: blocked_dates vs admin_blocked_dates
    const blockedDates = await client.query('SELECT COUNT(*) FROM blocked_dates');
    const adminBlockedDates = await client.query('SELECT COUNT(*) FROM admin_blocked_dates');
    console.log(`   🚫 blocked_dates: ${blockedDates.rows[0].count} record`);
    console.log(`   🚫 admin_blocked_dates: ${adminBlockedDates.rows[0].count} record`);

    // 2. TABELLE VUOTE CHE SI POSSONO RIMUOVERE
    console.log('\n🗑️  TABELLE VUOTE (CANDIDATI PER RIMOZIONE):');
    const emptyTables = [];

    const allTables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);

    for (const table of allTables.rows) {
      const count = await client.query(`SELECT COUNT(*) FROM ${table.table_name}`);
      if (count.rows[0].count === '0') {
        emptyTables.push(table.table_name);
        console.log(`   ❌ ${table.table_name}: 0 record`);
      }
    }

    // 3. ANALISI STRUTTURE DUPLICATE
    console.log('\n🔄 ANALISI STRUTTURE SIMILI:');
    
    // Confronta strutture bookings vs admin_bookings
    const bookingsColumns = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'bookings' AND table_schema = 'public'
      ORDER BY column_name
    `);
    
    const adminBookingsColumns = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'admin_bookings' AND table_schema = 'public'
      ORDER BY column_name
    `);

    console.log(`   📋 bookings: ${bookingsColumns.rows.length} colonne`);
    console.log(`   📋 admin_bookings: ${adminBookingsColumns.rows.length} colonne`);

    // 4. TABELLE CON DATI EFFETTIVI
    console.log('\n✅ TABELLE CON DATI (DA MANTENERE):');
    const activeTables = [];
    
    for (const table of allTables.rows) {
      const count = await client.query(`SELECT COUNT(*) FROM ${table.table_name}`);
      if (count.rows[0].count !== '0') {
        activeTables.push({ name: table.table_name, records: count.rows[0].count });
        console.log(`   ✅ ${table.table_name}: ${count.rows[0].count} record`);
      }
    }

    // 5. RACCOMANDAZIONI OTTIMIZZAZIONE
    console.log('\n🎯 RACCOMANDAZIONI OTTIMIZZAZIONE:');
    
    if (emptyTables.length > 0) {
      console.log('\n❌ TABELLE DA RIMUOVERE (vuote):');
      emptyTables.forEach(table => {
        console.log(`   DROP TABLE IF EXISTS ${table};`);
      });
    }

    // Analisi duplicati
    if (mainBookings.rows[0].count === '0' && adminBookings.rows[0].count > 0) {
      console.log('\n🔄 CONSOLIDAMENTO PRENOTAZIONI:');
      console.log('   • admin_bookings ha dati, bookings è vuoto');
      console.log('   • Considera di migrare dati da admin_bookings a bookings');
    }

    if (settings.rows[0].count > 0 && adminSettings.rows[0].count > 0) {
      console.log('\n⚙️  CONSOLIDAMENTO SETTINGS:');
      console.log('   • Hai 3 tabelle settings diverse');
      console.log('   • Considera di consolidare in una sola tabella');
    }

    if (pricingConfig.rows[0].count > 0 && pricingConfigs.rows[0].count > 0) {
      console.log('\n💰 CONSOLIDAMENTO PRICING:');
      console.log('   • pricing_config e pricing_configs sono duplicate');
      console.log('   • Scegli una delle due strutture');
    }

    console.log('\n📊 RIEPILOGO OTTIMIZZAZIONE:');
    console.log(`   🗂️  Tabelle totali: ${allTables.rows.length}`);
    console.log(`   ✅ Tabelle con dati: ${activeTables.length}`);
    console.log(`   ❌ Tabelle vuote: ${emptyTables.length}`);
    console.log(`   💾 Spazio recuperabile: ${emptyTables.length} tabelle`);

  } catch (error) {
    console.error('❌ ERRORE ANALISI:', error.message);
  } finally {
    await client.end();
  }
}

optimizeDatabase();