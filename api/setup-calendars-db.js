import { Pool } from 'pg';
import fetch from 'node-fetch';

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

const calendars = [
    {
        name: 'Google Calendar Vincanto',
        platform: 'google',
        ical_url: 'https://calendar.google.com/calendar/ical/vincanto%40gmail.com/private-41b16147340fc6b7d00d9ff0faf71c74/basic.ics',
        status: 'active'
    },
    {
        name: 'Booking.com Principale', 
        platform: 'booking.com',
        ical_url: 'https://ical.booking.com/v1/export?t=d6fd211b-ce0a-463c-85e0-e97979cf2366',
        status: 'active'
    },
    {
        name: 'Holidu Calendar',
        platform: 'holidu', 
        ical_url: 'https://api.host.holidu.com/pmc/rest/apartments/657119/calendar/656b82d8-c858-408c-bb02-114aaa66e38c/export.ics?s=MTMwNTM%3D&amp;u=NjU3MTE5&amp;h=ZjgyYjI0Yjc4OGI1MzNlOWQ3YjY4ZjU5NzM5MDA5ZWM%3D',
        status: 'active'
    }
];

export default async function handler(req, res) {
    // CORS Headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        console.log('🚀 Iniziando setup calendari nel database...');
        
        const client = await pool.connect();
        
        // Verifica se la tabella calendars esiste
        const tableCheck = await client.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'calendars'
            );
        `);

        if (!tableCheck.rows[0].exists) {
            // Crea tabella calendars
            console.log('📊 Creando tabella calendars...');
            await client.query(`
                CREATE TABLE calendars (
                    id SERIAL PRIMARY KEY,
                    name VARCHAR(255) NOT NULL,
                    platform VARCHAR(100) NOT NULL,
                    ical_url TEXT,
                    google_calendar_id VARCHAR(255),
                    google_access_token TEXT,
                    google_refresh_token TEXT,
                    status VARCHAR(50) DEFAULT 'active',
                    last_sync TIMESTAMP,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            `);
        }

        // Verifica se la tabella blocked_dates esiste
        const blockedDatesCheck = await client.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'blocked_dates'
            );
        `);

        if (!blockedDatesCheck.rows[0].exists) {
            // Crea tabella blocked_dates
            console.log('📊 Creando tabella blocked_dates...');
            await client.query(`
                CREATE TABLE blocked_dates (
                    id SERIAL PRIMARY KEY,
                    calendar_id INTEGER REFERENCES calendars(id) ON DELETE CASCADE,
                    blocked_date DATE NOT NULL,
                    reason VARCHAR(255) DEFAULT 'calendar_sync',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    UNIQUE(calendar_id, blocked_date)
                );
            `);
        }

        const results = [];

        // Aggiungi calendari
        for (const calendar of calendars) {
            try {
                console.log(`📅 Aggiungendo calendario: ${calendar.name}`);
                
                // Verifica se il calendario esiste già
                const existingCheck = await client.query(
                    'SELECT id FROM calendars WHERE name = $1 OR ical_url = $2',
                    [calendar.name, calendar.ical_url]
                );

                if (existingCheck.rows.length > 0) {
                    console.log(`⚠️ Calendario ${calendar.name} già esistente, aggiornando...`);
                    
                    // Aggiorna calendario esistente
                    await client.query(`
                        UPDATE calendars 
                        SET name = $1, platform = $2, ical_url = $3, status = $4, updated_at = CURRENT_TIMESTAMP
                        WHERE id = $5
                    `, [calendar.name, calendar.platform, calendar.ical_url, calendar.status, existingCheck.rows[0].id]);
                    
                    results.push({
                        calendar: calendar.name,
                        action: 'updated',
                        success: true,
                        id: existingCheck.rows[0].id
                    });
                } else {
                    // Test connessione prima di aggiungere
                    console.log(`🔄 Testing connessione ${calendar.name}...`);
                    
                    try {
                        const response = await fetch(calendar.ical_url, { 
                            timeout: 10000,
                            headers: {
                                'User-Agent': 'Vincanto Calendar Setup/1.0'
                            }
                        });
                        
                        if (!response.ok) {
                            throw new Error(`HTTP ${response.status}`);
                        }

                        console.log(`✅ ${calendar.name}: Connesso (${response.status})`);
                        
                        // Inserisci nuovo calendario
                        const insertResult = await client.query(`
                            INSERT INTO calendars (name, platform, ical_url, status, created_at, updated_at)
                            VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                            RETURNING id
                        `, [calendar.name, calendar.platform, calendar.ical_url, calendar.status]);

                        results.push({
                            calendar: calendar.name,
                            action: 'inserted',
                            success: true,
                            id: insertResult.rows[0].id,
                            url: calendar.ical_url,
                            platform: calendar.platform,
                            status: response.status
                        });
                        
                    } catch (connError) {
                        console.error(`❌ ${calendar.name}: Errore connessione - ${connError.message}`);
                        
                        results.push({
                            calendar: calendar.name,
                            action: 'connection_failed',
                            success: false,
                            error: connError.message
                        });
                    }
                }
                
            } catch (error) {
                console.error(`❌ Errore calendario ${calendar.name}:`, error);
                results.push({
                    calendar: calendar.name,
                    action: 'error',
                    success: false,
                    error: error.message
                });
            }
        }

        // Riepilogo finale
        const successful = results.filter(r => r.success).length;
        const failed = results.filter(r => !r.success).length;

        console.log(`\n🎉 Setup completato!`);
        console.log(`✅ Successi: ${successful}`);
        console.log(`❌ Falliti: ${failed}`);

        client.release();

        return res.json({
            success: true,
            message: 'Setup calendari completato',
            summary: {
                total: calendars.length,
                successful,
                failed
            },
            details: results
        });

    } catch (error) {
        console.error('❌ Errore setup calendari:', error);
        return res.status(500).json({
            success: false,
            error: 'Errore setup calendari',
            details: error.message
        });
    }
}