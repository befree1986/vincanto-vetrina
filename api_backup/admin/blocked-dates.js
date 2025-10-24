/**
 * API per gestione date bloccate
 * Gestisce disponibilità e prenotazioni
 */

// Database simulato per date bloccate
let blockedDates = [
    {
        id: '1',
        startDate: '2025-11-15',
        endDate: '2025-11-18',
        type: 'booking',
        source: 'direct',
        guestName: 'Mario Rossi',
        status: 'confirmed',
        createdAt: '2025-10-20T00:00:00Z'
    },
    {
        id: '2',
        startDate: '2025-12-01',
        endDate: '2025-12-05',
        type: 'booking',
        source: 'airbnb',
        guestName: 'Laura Bianchi',
        status: 'pending',
        createdAt: '2025-10-21T00:00:00Z'
    },
    {
        id: '3',
        startDate: '2025-12-20',
        endDate: '2025-12-27',
        type: 'maintenance',
        source: 'manual',
        reason: 'Manutenzione impianti',
        status: 'blocked',
        createdAt: '2025-10-22T00:00:00Z'
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
                return handleGetBlockedDates(req, res);
            case 'POST':
                return handleCreateBlockedDate(req, res);
            case 'PUT':
                return handleUpdateBlockedDate(req, res);
            case 'DELETE':
                return handleDeleteBlockedDate(req, res);
            default:
                return res.status(405).json({ error: 'Metodo non supportato' });
        }
    } catch (error) {
        console.error('Errore API date bloccate:', error);
        return res.status(500).json({ error: 'Errore interno del server' });
    }
}

async function handleGetBlockedDates(req, res) {
    const { startDate, endDate, type } = req.query;
    
    let filteredDates = [...blockedDates];
    
    // Filtra per intervallo di date se specificato
    if (startDate && endDate) {
        filteredDates = filteredDates.filter(date => {
            return (date.startDate <= endDate && date.endDate >= startDate);
        });
    }
    
    // Filtra per tipo se specificato
    if (type) {
        filteredDates = filteredDates.filter(date => date.type === type);
    }
    
    console.log(`📅 Richiesta date bloccate: ${filteredDates.length} trovate`);
    
    return res.status(200).json({
        success: true,
        blockedDates: filteredDates,
        total: filteredDates.length,
        filters: { startDate, endDate, type }
    });
}

async function handleCreateBlockedDate(req, res) {
    const { startDate, endDate, type, source, guestName, reason } = req.body;
    
    if (!startDate || !endDate || !type) {
        return res.status(400).json({
            error: 'Data inizio, fine e tipo sono obbligatori'
        });
    }
    
    // Valida date
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (start >= end) {
        return res.status(400).json({
            error: 'Data fine deve essere successiva alla data inizio'
        });
    }
    
    // Controlla sovrapposizioni
    const overlapping = blockedDates.some(existing => {
        return (startDate <= existing.endDate && endDate >= existing.startDate);
    });
    
    if (overlapping) {
        return res.status(409).json({
            error: 'Le date si sovrappongono con un periodo già bloccato'
        });
    }
    
    const newBlockedDate = {
        id: Date.now().toString(),
        startDate,
        endDate,
        type,
        source: source || 'manual',
        guestName,
        reason,
        status: type === 'booking' ? 'confirmed' : 'blocked',
        createdAt: new Date().toISOString()
    };
    
    blockedDates.push(newBlockedDate);
    
    console.log('🚫 Data bloccata aggiunta:', `${startDate} - ${endDate}`);
    
    return res.status(201).json({
        success: true,
        blockedDate: newBlockedDate,
        message: 'Data bloccata aggiunta con successo'
    });
}

async function handleUpdateBlockedDate(req, res) {
    const { id } = req.query;
    const { startDate, endDate, type, status, guestName, reason } = req.body;
    
    const dateIndex = blockedDates.findIndex(date => date.id === id);
    
    if (dateIndex === -1) {
        return res.status(404).json({
            error: 'Data bloccata non trovata'
        });
    }
    
    // Aggiorna i campi forniti
    if (startDate !== undefined) blockedDates[dateIndex].startDate = startDate;
    if (endDate !== undefined) blockedDates[dateIndex].endDate = endDate;
    if (type !== undefined) blockedDates[dateIndex].type = type;
    if (status !== undefined) blockedDates[dateIndex].status = status;
    if (guestName !== undefined) blockedDates[dateIndex].guestName = guestName;
    if (reason !== undefined) blockedDates[dateIndex].reason = reason;
    
    blockedDates[dateIndex].updatedAt = new Date().toISOString();
    
    console.log('📝 Data bloccata aggiornata:', blockedDates[dateIndex].id);
    
    return res.status(200).json({
        success: true,
        blockedDate: blockedDates[dateIndex],
        message: 'Data bloccata aggiornata con successo'
    });
}

async function handleDeleteBlockedDate(req, res) {
    const { id } = req.query;
    
    const dateIndex = blockedDates.findIndex(date => date.id === id);
    
    if (dateIndex === -1) {
        return res.status(404).json({
            error: 'Data bloccata non trovata'
        });
    }
    
    const deletedDate = blockedDates.splice(dateIndex, 1)[0];
    
    console.log('🗑️ Data bloccata rimossa:', deletedDate.id);
    
    return res.status(200).json({
        success: true,
        message: 'Data bloccata rimossa con successo'
    });
}