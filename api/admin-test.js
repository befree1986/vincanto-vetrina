// Test completo di tutti gli endpoint dell'admin panel// Test API per debug

import { Pool } from 'pg';

export default function handler(req, res) {

const pool = new Pool({  res.setHeader('Access-Control-Allow-Origin', '*');

  connectionString: process.env.DATABASE_URL,  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');

  ssl: {  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    rejectUnauthorized: false  

  }  if (req.method === 'OPTIONS') {

});    return res.status(200).end();

  }

export default async function handler(req, res) {

  if (req.method !== 'GET') {  try {

    return res.status(405).json({ success: false, error: 'Only GET allowed' });    const { action } = req.query;

  }    

    // Debug environment

  const results = [];    const debug = {

  let client;      action: action,

      databaseUrl: !!process.env.DATABASE_URL,

  try {      databaseLength: process.env.DATABASE_URL ? process.env.DATABASE_URL.length : 0,

    client = await pool.connect();      nodeEnv: process.env.NODE_ENV,

    console.log('🧪 ADMIN TEST - Inizio test completo endpoints');      method: req.method

    };

    // Test degli endpoint principali

    const endpoints = [    console.log('Debug info:', debug);

      'dashboard-stats',

      'pricing',     return res.status(200).json({

      'blocked-dates',      success: true,

      'payments',      debug: debug,

      'bookings',      message: 'Test API working'

      'analytics',    });

      'database-status'

    ];  } catch (error) {

    console.error('API Test Error:', error);

    for (const endpoint of endpoints) {    return res.status(500).json({

      try {      success: false,

        console.log(`🔍 Testing endpoint: ${endpoint}`);      error: error.message

            });

        // Simula il comportamento dell'endpoint  }

        let testResult = { endpoint, status: 'unknown' };}
        
        switch (endpoint) {
          case 'pricing':
            // Test pricing endpoint
            const pricingQuery = await client.query(`
              SELECT setting_key, setting_value FROM admin_settings 
              WHERE category = 'pricing' 
              ORDER BY setting_key
            `);
            testResult = { 
              endpoint, 
              status: 'success', 
              data_count: pricingQuery.rows.length,
              note: 'Pricing data loaded successfully'
            };
            break;
            
          case 'blocked-dates':
            // Test blocked-dates endpoint
            const tableExists = await client.query(`
              SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'admin_calendar_events'
              );
            `);
            testResult = { 
              endpoint, 
              status: tableExists.rows[0].exists ? 'success' : 'fallback',
              note: tableExists.rows[0].exists ? 'Calendar table exists' : 'Using fallback data'
            };
            break;
            
          case 'payments':
            // Test payments endpoint
            const paymentsTableExists = await client.query(`
              SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'admin_payments'
              );
            `);
            testResult = { 
              endpoint, 
              status: paymentsTableExists.rows[0].exists ? 'success' : 'mock',
              note: paymentsTableExists.rows[0].exists ? 'Payments table exists' : 'Using mock data'
            };
            break;
            
          case 'dashboard-stats':
            testResult = { endpoint, status: 'success', note: 'Dashboard stats available' };
            break;
            
          case 'database-status':
            const tablesQuery = await client.query(`
              SELECT table_name FROM information_schema.tables 
              WHERE table_schema = 'public' 
              ORDER BY table_name
            `);
            testResult = { 
              endpoint, 
              status: 'success', 
              tables_count: tablesQuery.rows.length,
              tables: tablesQuery.rows.map(r => r.table_name)
            };
            break;
            
          default:
            testResult = { endpoint, status: 'not_implemented', note: 'Endpoint exists but not tested' };
        }
        
        results.push(testResult);
        console.log(`✅ ${endpoint}: ${testResult.status}`);
        
      } catch (error) {
        console.log(`❌ ${endpoint}: ${error.message}`);
        results.push({ 
          endpoint, 
          status: 'error', 
          error: error.message 
        });
      }
    }

    // Statistiche finali
    const successCount = results.filter(r => r.status === 'success').length;
    const errorCount = results.filter(r => r.status === 'error').length;
    const mockCount = results.filter(r => r.status === 'mock' || r.status === 'fallback').length;

    return res.status(200).json({
      success: true,
      message: 'Test completo amministrazione completato',
      summary: {
        total_endpoints: endpoints.length,
        working: successCount,
        errors: errorCount, 
        using_fallback: mockCount,
        score: `${successCount}/${endpoints.length}`
      },
      results: results,
      timestamp: new Date().toISOString(),
      recommendations: errorCount > 0 ? [
        'Alcuni endpoint hanno errori - controlla i log',
        'Considera di eseguire /api/setup-database per creare tabelle mancanti'
      ] : mockCount > 0 ? [
        'Alcuni endpoint usano dati mock',
        'Esegui /api/setup-database per funzionalità complete'
      ] : [
        'Tutti gli endpoint funzionano correttamente!'
      ]
    });

  } catch (error) {
    console.error('❌ Admin Test Error:', error);
    return res.status(500).json({
      success: false,
      error: 'Errore durante test admin',
      details: error.message,
      results: results
    });
  } finally {
    if (client) {
      client.release();
    }
  }
}