#!/usr/bin/env node

/**
 * Script Setup Calendari Vincanto
 * Configura tutti i calendari iCal nel sistema
 */

import { Pool } from 'pg';
import fetch from 'node-fetch';

// Configurazione calendari Vincanto
const CALENDAR_CONFIGS = [
  {
    name: 'Google Calendar Vincanto (Privato)',
    platform: 'google',
    ical_url: 'https://calendar.google.com/calendar/ical/vincantomaiori%40gmail.com/private-c093b952abd5d0bafc2261928153f36d/basic.ics',
    is_active: true,
    priority: 1
  },
  {
    name: 'Booking.com Principale', 
    platform: 'booking.com',
    ical_url: 'https://ical.booking.com/v1/export?t=d6fd211b-ce0a-486b-b98c-6fda80504dd0',
    is_active: true,
    priority: 2
  },
  {
    name: 'Holidu Calendar',
    platform: 'holidu',
    ical_url: 'https://api.host.holidu.com/pmc/rest/apartments/65376863/ical.ics?key=72d27a56f3e8836f690500877301d000',
    is_active: true,
    priority: 3
  }
];

// Configurazione database
let pool;
try {
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });
  console.log('📊 Connessione database configurata');
} catch (poolError) {
  console.error('❌ Errore configurazione database:', poolError);
  process.exit(1);
}

async function setupCalendars() {
  console.log('\n🚀 VINCANTO CALENDAR SETUP');
  console.log('=' * 40);
  
  let client;
  
  try {
    client = await pool.connect();
    console.log('✅ Connesso al database');
    
    // 1. Crea tabella calendari se non esiste
    await createCalendarTables(client);
    
    // 2. Inserisci configurazioni calendari
    await insertCalendarConfigs(client);
    
    // 3. Testa connessione a tutti i calendari
    await testCalendarConnections();
    
    // 4. Prima sincronizzazione
    await initialSync();
    
    console.log('\n🎉 SETUP COMPLETATO CON SUCCESSO!');
    console.log('\n📋 Riepilogo Calendari Configurati:');
    CALENDAR_CONFIGS.forEach((cal, index) => {
      console.log(`${index + 1}. ✅ ${cal.name} (${cal.platform})`);
    });
    
    console.log('\n🔧 Comandi Utili:');
    console.log('• Test sistema: npm run test-calendar');
    console.log('• Sync manuale: curl "https://vincantomaiori.it/api/availability-sync?action=sync-all"');
    console.log('• Admin panel: https://vincantomaiori.it/admin');
    
  } catch (error) {
    console.error('❌ Errore durante setup:', error);
    process.exit(1);
  } finally {
    if (client) client.release();
    if (pool) pool.end();
  }
}

async function createCalendarTables(client) {
  console.log('\n📊 Creazione tabelle database...');
  
  try {
    // Tabella configurazioni calendari
    await client.query(`
      CREATE TABLE IF NOT EXISTS admin_calendar_configs (
        id SERIAL PRIMARY KEY,
        calendar_name VARCHAR(255) NOT NULL,
        platform VARCHAR(50) NOT NULL,
        ical_url TEXT,
        access_token TEXT,
        refresh_token TEXT,
        token_expires_at TIMESTAMP,
        is_active BOOLEAN DEFAULT true,
        priority INTEGER DEFAULT 1,
        last_sync_at TIMESTAMP,
        sync_status VARCHAR(20) DEFAULT 'ready',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(platform, calendar_name)
      )
    `);
    
    // Tabella eventi calendari
    await client.query(`
      CREATE TABLE IF NOT EXISTS admin_calendar_events (
        id SERIAL PRIMARY KEY,
        external_id VARCHAR(255),
        calendar_source VARCHAR(50) NOT NULL,
        title VARCHAR(255),
        start_date DATE NOT NULL,
        end_date DATE NOT NULL,
        booking_reference VARCHAR(100),
        is_blocking BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(external_id, calendar_source)
      )
    `);
    
    console.log('✅ Tabelle database create/verificate');
    
  } catch (dbError) {
    console.error('❌ Errore creazione tabelle:', dbError);
    throw dbError;
  }
}

async function insertCalendarConfigs(client) {
  console.log('\n📅 Inserimento configurazioni calendari...');
  
  for (const config of CALENDAR_CONFIGS) {
    try {
      const result = await client.query(`
        INSERT INTO admin_calendar_configs 
        (calendar_name, platform, ical_url, is_active, priority, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
        ON CONFLICT (platform, calendar_name) 
        DO UPDATE SET 
          ical_url = $3,
          is_active = $4,
          priority = $5,
          updated_at = NOW()
        RETURNING id
      `, [config.name, config.platform, config.ical_url, config.is_active, config.priority]);
      
      const calendarId = result.rows[0].id;
      console.log(`✅ ${config.name}: ID ${calendarId}`);
      
    } catch (insertError) {
      console.error(`❌ Errore inserimento ${config.name}:`, insertError);
    }
  }
}

async function testCalendarConnections() {
  console.log('\n🔍 Test connessioni calendari...');
  
  for (const config of CALENDAR_CONFIGS) {
    try {
      console.log(`📡 Testing ${config.name}...`);
      
      const response = await fetch(config.ical_url, {
        method: 'HEAD',
        timeout: 10000
      });
      
      if (response.ok) {
        console.log(`✅ ${config.name}: OK (${response.status})`);
      } else {
        console.log(`⚠️ ${config.name}: ${response.status} ${response.statusText}`);
      }
      
    } catch (testError) {
      console.log(`❌ ${config.name}: ${testError.message}`);
    }
  }
}

async function initialSync() {
  console.log('\n🔄 Prima sincronizzazione calendari...');
  
  try {
    // Usa il nostro endpoint di sincronizzazione
    const syncUrl = process.env.VERCEL_URL 
      ? `${process.env.VERCEL_URL}/api/availability-sync?action=sync-all`
      : 'http://localhost:3000/api/availability-sync?action=sync-all';
    
    console.log(`📡 Chiamando: ${syncUrl}`);
    
    const syncResponse = await fetch(syncUrl, {
      timeout: 30000
    });
    
    if (syncResponse.ok) {
      const syncData = await syncResponse.json();
      console.log('✅ Sincronizzazione completata');
      console.log(`   • Calendari sincronizzati: ${syncData.calendarsChecked?.length || 0}`);
      console.log(`   • Date bloccate totali: ${syncData.totalBlockedDates || 0}`);
    } else {
      console.log(`⚠️ Sincronizzazione parziale: ${syncResponse.status}`);
    }
    
  } catch (syncError) {
    console.log(`ℹ️ Sincronizzazione iniziale skip: ${syncError.message}`);
    console.log('   (Si sincronizzerà automaticamente al primo utilizzo)');
  }
}

// === FUNZIONI UTILITY ===

function validateEnvironment() {
  if (!process.env.DATABASE_URL) {
    console.error('❌ Variabile DATABASE_URL mancante');
    console.log('\nConfigura DATABASE_URL nel tuo file .env:');
    console.log('DATABASE_URL=postgresql://user:pass@host:5432/db');
    process.exit(1);
  }
}

function displayNextSteps() {
  console.log('\n🎯 PROSSIMI STEP:');
  console.log('1. Testa il sistema: npm run test-calendar');
  console.log('2. Verifica admin panel: /admin/calendari');
  console.log('3. Controlla disponibilità frontend');
  console.log('4. Setup automazioni (cron job sync ogni 15 min)');
  
  console.log('\n🔄 Sync Automatica (Opzionale):');
  console.log('Aggiungi a crontab per sync automatica ogni 15 minuti:');
  console.log('*/15 * * * * curl -X GET "https://vincantomaiori.it/api/availability-sync?action=sync-all"');
}

// === AVVIO SCRIPT ===

console.log('🔧 Validazione ambiente...');
validateEnvironment();

setupCalendars()
  .then(() => {
    displayNextSteps();
    console.log('\n✨ Setup Vincanto Calendari completato!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Setup fallito:', error);
    process.exit(1);
  });