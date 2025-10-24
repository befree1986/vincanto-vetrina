/**
 * API Availability semplificata per Vercel
 * Versione fallback senza database
 */

export default async function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    try {
        if (req.method === 'POST') {
            // Controllo disponibilità per date specifiche
            const { check_in_date, check_out_date } = req.body;
            
            if (!check_in_date || !check_out_date) {
                return res.status(400).json({
                    success: false,
                    error: 'Date di check-in e check-out sono richieste'
                });
            }
            
            // Validazione date
            const checkIn = new Date(check_in_date);
            const checkOut = new Date(check_out_date);
            
            if (isNaN(checkIn.getTime()) || isNaN(checkOut.getTime())) {
                return res.status(400).json({
                    success: false,
                    error: 'Formato date non valido'
                });
            }
            
            if (checkOut <= checkIn) {
                return res.status(400).json({
                    success: false,
                    error: 'Data check-out deve essere successiva al check-in'
                });
            }
            
            // Per ora restituiamo sempre disponibile
            // TODO: Integrare con database quando sarà configurato
            return res.status(200).json({
                success: true,
                available: true,
                check_in_date,
                check_out_date,
                conflicts: {
                    bookings: 0,
                    blocked_dates: 0
                },
                note: 'Controllo semplificato - database non configurato'
            });
            
        } else if (req.method === 'GET') {
            // Ottieni date occupate per un periodo
            const { start_date, end_date } = req.query;
            
            return res.status(200).json({
                success: true,
                period: {
                    start: start_date || new Date().toISOString().split('T')[0],
                    end: end_date || new Date(Date.now() + 30*24*60*60*1000).toISOString().split('T')[0]
                },
                occupied_dates: [],
                note: 'Nessuna data occupata - database non configurato'
            });
            
        } else {
            return res.status(405).json({
                success: false,
                error: 'Method not allowed'
            });
        }
        
    } catch (error) {
        console.error('❌ Errore availability:', error);
        
        return res.status(500).json({
            success: false,
            error: error.message || 'Errore interno del server'
        });
    }
}