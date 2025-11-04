/**
 * Database Structure Analysis API
 * API per analizzare la struttura completa del database
 */

import { Pool } from 'pg';

// Crea pool di connessioni come nelle API esistenti
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

export default async function handler(req, res) {
  // Solo metodo GET permesso
  if (req.method !== 'GET') {
    return res.status(405).json({ 
      success: false, 
      error: 'Metodo non permesso' 
    });
  }

  let client;

  try {
    client = await pool.connect();
    
    const analysis = {
      timestamp: new Date().toISOString(),
      tables: [],
      relationships: [],
      conflicts: [],
      summary: {}
    };

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
    
    // 2. Per ogni tabella, analizza la struttura
    for (const table of tablesResult.rows) {
      const tableName = table.table_name;
      
      const tableAnalysis = {
        name: tableName,
        type: table.table_type,
        columns: [],
        primaryKeys: [],
        foreignKeys: [],
        indexes: [],
        recordCount: 0
      };

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
      tableAnalysis.columns = columnsResult.rows;

      // Chiavi primarie
      const primaryKeysQuery = `
        SELECT column_name
        FROM information_schema.key_column_usage
        WHERE table_name = $1 
        AND table_schema = 'public'
        AND constraint_name LIKE '%_pkey';
      `;
      
      const primaryKeysResult = await client.query(primaryKeysQuery, [tableName]);
      tableAnalysis.primaryKeys = primaryKeysResult.rows.map(pk => pk.column_name);

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
      tableAnalysis.foreignKeys = foreignKeysResult.rows;

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
      tableAnalysis.indexes = indexesResult.rows;

      // Conteggio record
      try {
        const countResult = await client.query(`SELECT COUNT(*) as count FROM "${tableName}"`);
        tableAnalysis.recordCount = parseInt(countResult.rows[0].count);
      } catch (err) {
        tableAnalysis.recordCount = -1; // Errore nel conteggio
      }

      analysis.tables.push(tableAnalysis);
    }

    // 3. Analisi conflitti e relazioni
    
    // Tutte le relazioni foreign key
    const allRelationsQuery = `
      SELECT 
        kcu.table_name AS from_table,
        kcu.column_name AS from_column,
        ccu.table_name AS to_table,
        ccu.column_name AS to_column,
        rc.constraint_name
      FROM information_schema.key_column_usage kcu
      JOIN information_schema.referential_constraints rc 
        ON kcu.constraint_name = rc.constraint_name
      JOIN information_schema.constraint_column_usage ccu 
        ON rc.unique_constraint_name = ccu.constraint_name
      WHERE kcu.table_schema = 'public'
      ORDER BY kcu.table_name, kcu.column_name;
    `;
    
    const relationsResult = await client.query(allRelationsQuery);
    analysis.relationships = relationsResult.rows;

    // Verifica potenziali conflitti
    const tableNames = analysis.tables.map(t => t.name);
    
    // Tabelle con nomi simili (possibili duplicati)
    const similarTables = [];
    for (let i = 0; i < tableNames.length; i++) {
      for (let j = i + 1; j < tableNames.length; j++) {
        const table1 = tableNames[i];
        const table2 = tableNames[j];
        
        // Controlla similarità (stesso nome senza 's', con suffissi, etc.)
        if (
          table1.includes(table2) || table2.includes(table1) ||
          table1.replace(/s$/, '') === table2.replace(/s$/, '') ||
          Math.abs(table1.length - table2.length) <= 2
        ) {
          similarTables.push([table1, table2]);
        }
      }
    }

    if (similarTables.length > 0) {
      analysis.conflicts.push({
        type: 'similar_table_names',
        description: 'Tabelle con nomi simili che potrebbero essere duplicate',
        items: similarTables
      });
    }

    // Colonne con nomi inconsistenti per foreign key
    const fkInconsistencies = [];
    relationsResult.rows.forEach(rel => {
      const expectedName = `${rel.to_table.slice(0, -1)}_id`; // Singolare + _id
      if (rel.from_column !== expectedName && rel.from_column !== `${rel.to_table}_id`) {
        fkInconsistencies.push({
          table: rel.from_table,
          column: rel.from_column,
          expected: [expectedName, `${rel.to_table}_id`],
          references: `${rel.to_table}.${rel.to_column}`
        });
      }
    });

    if (fkInconsistencies.length > 0) {
      analysis.conflicts.push({
        type: 'foreign_key_naming',
        description: 'Foreign key con nomi non convenzionali',
        items: fkInconsistencies
      });
    }

    // Tabelle senza chiave primaria
    const tablesWithoutPK = analysis.tables.filter(t => t.primaryKeys.length === 0);
    if (tablesWithoutPK.length > 0) {
      analysis.conflicts.push({
        type: 'missing_primary_keys',
        description: 'Tabelle senza chiave primaria',
        items: tablesWithoutPK.map(t => t.name)
      });
    }

    // Summary
    analysis.summary = {
      totalTables: analysis.tables.length,
      totalRelationships: analysis.relationships.length,
      totalConflicts: analysis.conflicts.length,
      tablesWithData: analysis.tables.filter(t => t.recordCount > 0).length,
      emptyTables: analysis.tables.filter(t => t.recordCount === 0).length,
      totalRecords: analysis.tables.reduce((sum, t) => sum + Math.max(0, t.recordCount), 0)
    };

    res.status(200).json({
      success: true,
      analysis
    });

  } catch (error) {
    console.error('Database analysis error:', error);
    
    res.status(500).json({
      success: false,
      error: 'Errore durante l\'analisi del database',
      details: error.message
    });
  } finally {
    if (client) {
      client.release();
    }
  }
}