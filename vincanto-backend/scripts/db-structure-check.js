#!/usr/bin/env node

/**
 * Database Structure Analysis Script
 * Script per analizzare la struttura completa del database PostgreSQL
 */

const { Pool } = require('pg');
require('dotenv').config();

// Usa la stessa logica delle API di produzione
const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;

if (!connectionString) {
  console.error('❌ Nessuna variabile DATABASE_URL o POSTGRES_URL trovata');
  process.exit(1);
}

const pool = new Pool({
  connectionString: connectionString,
  ssl: {
    rejectUnauthorized: false
  }
});

const analyzeDatabase = async () => {
  let client;
  
  try {
    client = await pool.connect();
    
    console.log('🔍 ANALISI STRUTTURA DATABASE VINCANTO\n');
    
    // 1. Lista delle tabelle
    const tablesQuery = `
      SELECT 
        table_name,
        table_schema,
        table_type
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `;
    
    const tablesResult = await client.query(tablesQuery);
    
    console.log('📋 TABELLE PRESENTI:');
    console.log('='.repeat(50));
    tablesResult.rows.forEach(table => {
      console.log(`  • ${table.table_name} (${table.table_type})`);
    });
    
    console.log('\n📊 DETTAGLIO TABELLE:\n');
    
    // 2. Per ogni tabella, analizza la struttura
    for (const table of tablesResult.rows) {
      const tableName = table.table_name;
      
      console.log(`🗂️  TABELLA: ${tableName.toUpperCase()}`);
      console.log('-'.repeat(40));
      
      // Colonne della tabella
      const columnsQuery = `
        SELECT 
          column_name,
          data_type,
          is_nullable,
          column_default,
          character_maximum_length,
          numeric_precision,
          numeric_scale
        FROM information_schema.columns 
        WHERE table_name = $1 
        AND table_schema = 'public'
        ORDER BY ordinal_position;
      `;
      
      const columnsResult = await client.query(columnsQuery, [tableName]);
      
      console.log('  Colonne:');
      columnsResult.rows.forEach(col => {
        const nullable = col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL';
        const type = col.character_maximum_length 
          ? `${col.data_type}(${col.character_maximum_length})`
          : col.data_type;
        const defaultVal = col.column_default ? ` DEFAULT ${col.column_default}` : '';
        console.log(`    ${col.column_name}: ${type} ${nullable}${defaultVal}`);
      });
      
      // Chiavi primarie
      const primaryKeysQuery = `
        SELECT column_name
        FROM information_schema.key_column_usage
        WHERE table_name = $1 
        AND table_schema = 'public'
        AND constraint_name LIKE '%_pkey';
      `;
      
      const primaryKeysResult = await client.query(primaryKeysQuery, [tableName]);
      
      if (primaryKeysResult.rows.length > 0) {
        console.log('  Chiavi Primarie:');
        primaryKeysResult.rows.forEach(pk => {
          console.log(`    • ${pk.column_name}`);
        });
      }
      
      // Chiavi esterne
      const foreignKeysQuery = `
        SELECT 
          kcu.column_name,
          ccu.table_name AS foreign_table_name,
          ccu.column_name AS foreign_column_name,
          rc.constraint_name
        FROM information_schema.key_column_usage kcu
        JOIN information_schema.referential_constraints rc 
          ON kcu.constraint_name = rc.constraint_name
        JOIN information_schema.constraint_column_usage ccu 
          ON rc.unique_constraint_name = ccu.constraint_name
        WHERE kcu.table_name = $1
        AND kcu.table_schema = 'public';
      `;
      
      const foreignKeysResult = await client.query(foreignKeysQuery, [tableName]);
      
      if (foreignKeysResult.rows.length > 0) {
        console.log('  Chiavi Esterne:');
        foreignKeysResult.rows.forEach(fk => {
          console.log(`    ${fk.column_name} → ${fk.foreign_table_name}.${fk.foreign_column_name}`);
        });
      }
      
      // Indici
      const indexesQuery = `
        SELECT 
          indexname,
          indexdef
        FROM pg_indexes
        WHERE tablename = $1
        AND schemaname = 'public'
        ORDER BY indexname;
      `;
      
      const indexesResult = await client.query(indexesQuery, [tableName]);
      
      if (indexesResult.rows.length > 0) {
        console.log('  Indici:');
        indexesResult.rows.forEach(idx => {
          console.log(`    • ${idx.indexname}`);
        });
      }
      
      // Conteggio record
      try {
        const countResult = await client.query(`SELECT COUNT(*) as count FROM "${tableName}"`);
        console.log(`  Record: ${countResult.rows[0].count}`);
      } catch (err) {
        console.log(`  Record: Errore nel conteggio`);
      }
      
      console.log('\n');
    }
    
    // 3. Verifica conflitti e problemi potenziali
    console.log('⚠️  VERIFICA CONFLITTI E PROBLEMI:\n');
    
    // Controlla tabelle duplicate o simili
    const duplicateTablesCheck = tablesResult.rows.filter(table => 
      tablesResult.rows.some(other => 
        other.table_name !== table.table_name && 
        other.table_name.includes(table.table_name.replace(/s$/, ''))
      )
    );
    
    if (duplicateTablesCheck.length > 0) {
      console.log('❌ Possibili tabelle duplicate:');
      duplicateTablesCheck.forEach(table => {
        console.log(`  • ${table.table_name}`);
      });
    } else {
      console.log('✅ Nessuna tabella duplicata rilevata');
    }
    
    // Controlla foreign key orfane
    console.log('\n🔗 VERIFICA INTEGRITÀ REFERENZIALE:');
    
    const orphanedForeignKeysQuery = `
      SELECT DISTINCT
        t.table_name,
        k.column_name,
        f.foreign_table_name,
        f.foreign_column_name
      FROM information_schema.tables t
      JOIN information_schema.key_column_usage k ON t.table_name = k.table_name
      JOIN (
        SELECT 
          kcu.table_name,
          kcu.column_name,
          ccu.table_name AS foreign_table_name,
          ccu.column_name AS foreign_column_name
        FROM information_schema.key_column_usage kcu
        JOIN information_schema.referential_constraints rc 
          ON kcu.constraint_name = rc.constraint_name
        JOIN information_schema.constraint_column_usage ccu 
          ON rc.unique_constraint_name = ccu.constraint_name
        WHERE kcu.table_schema = 'public'
      ) f ON t.table_name = f.table_name AND k.column_name = f.column_name
      WHERE t.table_schema = 'public'
      ORDER BY t.table_name;
    `;
    
    const orphanedResult = await client.query(orphanedForeignKeysQuery);
    
    if (orphanedResult.rows.length > 0) {
      console.log('  Relazioni Foreign Key:');
      orphanedResult.rows.forEach(rel => {
        console.log(`  ${rel.table_name}.${rel.column_name} → ${rel.foreign_table_name}.${rel.foreign_column_name}`);
      });
    }
    
    // 4. Sequenze e auto-increment
    console.log('\n🔢 SEQUENZE:');
    const sequencesQuery = `
      SELECT sequence_name, data_type, start_value, minimum_value, maximum_value, increment
      FROM information_schema.sequences
      WHERE sequence_schema = 'public';
    `;
    
    const sequencesResult = await client.query(sequencesQuery);
    
    if (sequencesResult.rows.length > 0) {
      sequencesResult.rows.forEach(seq => {
        console.log(`  • ${seq.sequence_name}: ${seq.start_value} → ${seq.maximum_value} (+${seq.increment})`);
      });
    } else {
      console.log('  Nessuna sequenza trovata (probabilmente si usano UUID)');
    }
    
    console.log('\n✅ Analisi completata!');
    
  } catch (error) {
    console.error('❌ Errore durante l\'analisi:', error.message);
  } finally {
    if (client) {
      client.release();
    }
    await pool.end();
  }
};

// Esegui l'analisi
analyzeDatabase();