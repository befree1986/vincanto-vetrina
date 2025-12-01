#!/usr/bin/env node
/**
 * Fix: Disattiva il parcheggio dai servizi extra
 * Il parcheggio è già gestito nel quote API, non serve duplicarlo
 */

import pg from 'pg';
const { Pool } = pg;

// Connessione al database Neon
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function disableParkingService() {
  console.log('🔧 DISATTIVAZIONE SERVIZIO PARCHEGGIO\n');

  try {
    // Trova il servizio parcheggio
    const findResult = await pool.query(`
      SELECT id, name, unit, price, active 
      FROM extra_services 
      WHERE category = 'parcheggio' OR name ILIKE '%parcheggio%' OR name ILIKE '%parking%'
    `);

    if (findResult.rows.length === 0) {
      console.log('✅ Nessun servizio parcheggio trovato nei servizi extra');
      process.exit(0);
    }

    console.log('📋 Servizi parcheggio trovati:');
    findResult.rows.forEach(row => {
      console.log(`   ID: ${row.id} | ${row.name} | €${row.price}/${row.unit} | Attivo: ${row.active ? 'SÌ' : 'NO'}`);
    });

    // Disattiva tutti i servizi parcheggio
    const updateResult = await pool.query(`
      UPDATE extra_services 
      SET active = false, 
          updated_at = NOW()
      WHERE category = 'parcheggio' OR name ILIKE '%parcheggio%' OR name ILIKE '%parking%'
      RETURNING id, name
    `);

    console.log('\n✅ SERVIZI DISATTIVATI:');
    updateResult.rows.forEach(row => {
      console.log(`   ✓ ${row.name} (ID: ${row.id})`);
    });

    console.log('\n💡 MOTIVO:');
    console.log('   Il parcheggio è già gestito correttamente nel quote API');
    console.log('   con calcolo PER NOTTE. Non serve nei servizi extra.');
    console.log('\n✅ FIX COMPLETATO');

  } catch (error) {
    console.error('❌ ERRORE:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

disableParkingService();
