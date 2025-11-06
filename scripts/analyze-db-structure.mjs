// 🔍 ANALISI STRUTTURA DATABASE
// Verifica le tabelle e colonne esistenti

import pkg from 'pg';
const { Client } = pkg;

const client = new Client({
  connectionString: 'postgresql://neondb_owner:npg_5TBySVaU7Ktf@ep-sweet-glitter-ag53yugd-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require',
  ssl: {
    rejectUnauthorized: false
  }
});

async function analyzeDatabase() {
  console.log('🔍 ANALIZZANDO STRUTTURA DATABASE...');
  
  try {
    await client.connect();
    console.log('✅ Connesso a PostgreSQL Neon');

    // 1. Lista tutte le tabelle
    const tables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);

    console.log('\n📋 TABELLE ESISTENTI:');
    tables.rows.forEach(row => {
      console.log(`   • ${row.table_name}`);
    });

    // 2. Analizza struttura di ogni tabella
    for (const table of tables.rows) {
      const columns = await client.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns 
        WHERE table_name = $1 AND table_schema = 'public'
        ORDER BY ordinal_position
      `, [table.table_name]);

      console.log(`\n🗂️  TABELLA: ${table.table_name.toUpperCase()}`);
      columns.rows.forEach(col => {
        console.log(`   📄 ${col.column_name} (${col.data_type}) - ${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`);
      });

      // Conta i record in ogni tabella
      const count = await client.query(`SELECT COUNT(*) FROM ${table.table_name}`);
      console.log(`   📊 Record: ${count.rows[0].count}`);
    }

  } catch (error) {
    console.error('❌ ERRORE ANALISI:', error.message);
  } finally {
    await client.end();
  }
}

analyzeDatabase();