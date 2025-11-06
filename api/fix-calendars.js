import { Pool } from 'pg';

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        const client = await pool.connect();
        
        if (req.method === 'POST') {
            console.log('🚀 Aggiungendo calendari predefiniti...');
            
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
            
            // Verifica e crea tabella calendars se non esiste
            await client.query(`
                CREATE TABLE IF NOT EXISTS calendars (
                    id SERIAL PRIMARY KEY,
                    name VARCHAR(255) NOT NULL,
                    platform VARCHAR(100) NOT NULL,
                    ical_url TEXT,
                    status VARCHAR(50) DEFAULT 'active',
                    last_sync TIMESTAMP,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            `);
            
            // Verifica e crea tabella admin_calendar_configs per admin panel
            await client.query(`
                CREATE TABLE IF NOT EXISTS admin_calendar_configs (
                    id SERIAL PRIMARY KEY,
                    name VARCHAR(255) NOT NULL,
                    platform VARCHAR(100) NOT NULL,
                    url TEXT,
                    is_active BOOLEAN DEFAULT true,
                    last_sync TIMESTAMP,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            `);
            
            const results = [];
            
            for (const calendar of calendars) {
                try {
                    // Controlla se esiste già nella tabella calendars
                    const existingCalendar = await client.query(
                        'SELECT id FROM calendars WHERE name = $1',
                        [calendar.name]
                    );
                    
                    if (existingCalendar.rows.length === 0) {
                        // Aggiungi a tabella calendars (per API)
                        const calendarResult = await client.query(`
                            INSERT INTO calendars (name, platform, ical_url, status)
                            VALUES ($1, $2, $3, 'active')
                            RETURNING id
                        `, [calendar.name, calendar.platform, calendar.ical_url]);
                        
                        console.log(`✅ Aggiunto a calendars: ${calendar.name} (ID: ${calendarResult.rows[0].id})`);
                        
                        results.push({
                            calendar: calendar.name,
                            table: 'calendars',
                            id: calendarResult.rows[0].id,
                            status: 'added'
                        });
                    } else {
                        results.push({
                            calendar: calendar.name,
                            table: 'calendars', 
                            id: existingCalendar.rows[0].id,
                            status: 'exists'
                        });
                    }
                    
                    // Controlla se esiste già nella tabella admin_calendar_configs
                    const existingAdminCalendar = await client.query(
                        'SELECT id FROM admin_calendar_configs WHERE name = $1',
                        [calendar.name]
                    );
                    
                    if (existingAdminCalendar.rows.length === 0) {
                        // Aggiungi a tabella admin_calendar_configs (per pannello admin)
                        const adminResult = await client.query(`
                            INSERT INTO admin_calendar_configs (name, platform, url, is_active)
                            VALUES ($1, $2, $3, true)
                            RETURNING id
                        `, [calendar.name, calendar.platform, calendar.ical_url]);
                        
                        console.log(`✅ Aggiunto a admin_calendar_configs: ${calendar.name} (ID: ${adminResult.rows[0].id})`);
                        
                        results.push({
                            calendar: calendar.name,
                            table: 'admin_calendar_configs',
                            id: adminResult.rows[0].id,
                            status: 'added'
                        });
                    } else {
                        results.push({
                            calendar: calendar.name,
                            table: 'admin_calendar_configs',
                            id: existingAdminCalendar.rows[0].id,
                            status: 'exists'
                        });
                    }
                    
                } catch (error) {
                    console.error(`❌ Errore ${calendar.name}:`, error);
                    results.push({
                        calendar: calendar.name,
                        status: 'error',
                        error: error.message
                    });
                }
            }
            
            client.release();
            
            return res.json({
                success: true,
                message: 'Setup calendari completato',
                results
            });
        }
        
        // GET - Mostra stato calendari
        if (req.method === 'GET') {
            try {
                const calendarsResult = await client.query('SELECT * FROM calendars ORDER BY id');
                const adminCalendarsResult = await client.query('SELECT * FROM admin_calendar_configs ORDER BY id');
                
                client.release();
                
                return res.json({
                    success: true,
                    calendars: calendarsResult.rows,
                    adminCalendars: adminCalendarsResult.rows,
                    totals: {
                        calendars: calendarsResult.rows.length,
                        adminCalendars: adminCalendarsResult.rows.length
                    }
                });
            } catch (error) {
                client.release();
                throw error;
            }
        }
        
    } catch (error) {
        console.error('Errore setup calendari:', error);
        return res.status(500).json({
            success: false,
            error: 'Errore setup calendari',
            details: error.message
        });
    }
}