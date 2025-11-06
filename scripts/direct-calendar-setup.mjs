#!/usr/bin/env node

// Script per aggiungere calendari direttamente al database Neon
import { Pool } from 'pg';
import fetch from 'node-fetch';
import * as dotenv from 'dotenv';

// Carica variabili d'ambiente
dotenv.config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

const calendars = [
    {
        name: 'Google Calendar Vincanto',
        platform: 'google',
        ical_url: 'https://calendar.google.com/calendar/ical/vincanto%40gmail.com/private-41b16147340fc6b7d00d9ff0faf71c74/basic.ics'
    },
    {
        name: 'Booking.com Principale', 
        platform: 'booking.com',
        ical_url: 'https://ical.booking.com/v1/export?t=d6fd211b-ce0a-463c-85e0-e97979cf2366'
    },
    {
        name: 'Holidu Calendar',
        platform: 'holidu', 
        ical_url: 'https://api.host.holidu.com/pmc/rest/apartments/657119/calendar/656b82d8-c858-408c-bb02-114aaa66e38c/export.ics?s=MTMwNTM%3D&u=NjU3MTE5&h=ZjgyYjI0Yjc4OGI1MzNlOWQ3YjY4ZjU5NzM5MDA5ZWM%3D'
    }
];

async function setupCalendars() {
    console.log('🚀 Setup Calendari Database Neon');
    console.log('=' .repeat(40));
    
    const client = await pool.connect();
    
    try {
        // Verifica tabelle
        const tableExists = await client.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_name = 'calendars'
            )
        `);

        if (!tableExists.rows[0].exists) {
            console.log('📊 Creando tabella calendars...');
            await client.query(`
                CREATE TABLE calendars (
                    id SERIAL PRIMARY KEY,
                    name VARCHAR(255) NOT NULL,
                    platform VARCHAR(100) NOT NULL,
                    ical_url TEXT,
                    status VARCHAR(50) DEFAULT 'active',
                    last_sync TIMESTAMP,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            `);
        }

        // Aggiungi calendari
        for (const calendar of calendars) {
            try {
                console.log(`\n📅 Processing: ${calendar.name}`);
                
                // Test connessione
                console.log('🔄 Testing connessione...');
                const response = await fetch(calendar.ical_url, {
                    timeout: 10000,
                    headers: { 'User-Agent': 'Vincanto/1.0' }
                });
                
                if (response.ok) {
                    console.log(`✅ Connesso (${response.status})`);
                    
                    // Controlla se esiste già
                    const existing = await client.query(
                        'SELECT id FROM calendars WHERE ical_url = $1',
                        [calendar.ical_url]
                    );
                    
                    if (existing.rows.length > 0) {
                        console.log('⚠️  Calendario già esistente, aggiornando...');
                        await client.query(`
                            UPDATE calendars 
                            SET name = $1, platform = $2, status = 'active'
                            WHERE id = $3
                        `, [calendar.name, calendar.platform, existing.rows[0].id]);
                    } else {
                        console.log('➕ Inserendo nuovo calendario...');
                        const result = await client.query(`
                            INSERT INTO calendars (name, platform, ical_url, status)
                            VALUES ($1, $2, $3, 'active')
                            RETURNING id
                        `, [calendar.name, calendar.platform, calendar.ical_url]);
                        
                        console.log(`✨ Calendario creato con ID: ${result.rows[0].id}`);
                    }
                } else {
                    console.log(`❌ Errore connessione: ${response.status}`);
                }
                
            } catch (error) {
                console.log(`❌ Errore: ${error.message}`);
            }
        }
        
        // Mostra riepilogo
        console.log('\n📋 Calendari configurati:');
        const allCalendars = await client.query('SELECT * FROM calendars ORDER BY id');
        
        allCalendars.rows.forEach((cal, index) => {
            console.log(`${index + 1}. ${cal.name} (${cal.platform}) - ${cal.status}`);
        });
        
        console.log('\n🎉 Setup completato!');
        console.log('💡 Puoi ora testare con: npm run test-calendar');
        
    } finally {
        client.release();
        await pool.end();
    }
}

setupCalendars().catch(console.error);