/**
 * API per gestione calendari esterni
 * Gestisce CRUD calendari e sincronizzazione
 */

// Database simulato (in produzione usare SQLite/PostgreSQL)
let calendars = [
    {
        id: '1',
        name: 'Airbnb - Vincanto',
        platform: 'Airbnb',
        url: 'https://calendar.google.com/calendar/ical/example1/basic.ics',
        active: true,
        lastSync: '2025-10-23T10:30:00Z',
        createdAt: '2025-10-20T00:00:00Z'
    },
    {
        id: '2', 
        name: 'Booking.com - Vincanto',
        platform: 'Booking.com',
        url: 'https://calendar.google.com/calendar/ical/example2/basic.ics',
        active: false,
        lastSync: '2025-10-22T15:45:00Z',
        createdAt: '2025-10-21T00:00:00Z'
    }
];

export default async function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    try {
        switch (req.method) {
            case 'GET':
                return handleGetCalendars(req, res);
            case 'POST':
                return handleCreateCalendar(req, res);
            case 'PUT':
                return handleUpdateCalendar(req, res);
            case 'DELETE':
                return handleDeleteCalendar(req, res);
            default:
                return res.status(405).json({ error: 'Metodo non supportato' });
        }
    } catch (error) {
        console.error('Errore API calendari:', error);
        return res.status(500).json({ error: 'Errore interno del server' });
    }
}

async function handleGetCalendars(req, res) {
    console.log('📅 Richiesta lista calendari');
    
    return res.status(200).json({
        success: true,
        calendars: calendars,
        total: calendars.length,
        active: calendars.filter(cal => cal.active).length
    });
}

async function handleCreateCalendar(req, res) {
    const { name, platform, url } = req.body;
    
    if (!name || !platform || !url) {
        return res.status(400).json({
            error: 'Nome, piattaforma e URL sono obbligatori'
        });
    }
    
    // Valida URL
    try {
        new URL(url);
    } catch {
        return res.status(400).json({
            error: 'URL non valido'
        });
    }
    
    const newCalendar = {
        id: Date.now().toString(),
        name,
        platform,
        url,
        active: true,
        lastSync: null,
        createdAt: new Date().toISOString()
    };
    
    calendars.push(newCalendar);
    
    console.log('➕ Calendario aggiunto:', newCalendar.name);
    
    return res.status(201).json({
        success: true,
        calendar: newCalendar,
        message: 'Calendario aggiunto con successo'
    });
}

async function handleUpdateCalendar(req, res) {
    const { id } = req.query;
    const { name, platform, url, active } = req.body;
    
    const calendarIndex = calendars.findIndex(cal => cal.id === id);
    
    if (calendarIndex === -1) {
        return res.status(404).json({
            error: 'Calendario non trovato'
        });
    }
    
    // Aggiorna i campi forniti
    if (name !== undefined) calendars[calendarIndex].name = name;
    if (platform !== undefined) calendars[calendarIndex].platform = platform;
    if (url !== undefined) calendars[calendarIndex].url = url;
    if (active !== undefined) calendars[calendarIndex].active = active;
    
    calendars[calendarIndex].updatedAt = new Date().toISOString();
    
    console.log('📝 Calendario aggiornato:', calendars[calendarIndex].name);
    
    return res.status(200).json({
        success: true,
        calendar: calendars[calendarIndex],
        message: 'Calendario aggiornato con successo'
    });
}

async function handleDeleteCalendar(req, res) {
    const { id } = req.query;
    
    const calendarIndex = calendars.findIndex(cal => cal.id === id);
    
    if (calendarIndex === -1) {
        return res.status(404).json({
            error: 'Calendario non trovato'
        });
    }
    
    const deletedCalendar = calendars.splice(calendarIndex, 1)[0];
    
    console.log('🗑️ Calendario rimosso:', deletedCalendar.name);
    
    return res.status(200).json({
        success: true,
        message: 'Calendario rimosso con successo'
    });
}