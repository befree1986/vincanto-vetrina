import express from 'express';
import { checkDateAvailability, getOccupiedDates } from '../utils/pricing.js';
import CalendarSyncService from '../services/calendarSync.js';

const router = express.Router();

/**
 * GET /api/availability/check
 * Verifica disponibilità per date specifiche
 * Query params: check_in_date, check_out_date
 */
router.get('/check', async (req, res) => {
    try {
        const { check_in_date, check_out_date } = req.query;
        
        if (!check_in_date || !check_out_date) {
            return res.status(400).json({ 
                error: 'Parametri check_in_date e check_out_date obbligatori' 
            });
        }
        
        const checkIn = new Date(check_in_date);
        const checkOut = new Date(check_out_date);
        
        if (checkOut <= checkIn) {
            return res.status(400).json({ 
                error: 'Data check-out deve essere successiva al check-in' 
            });
        }
        
        // Verifica disponibilità con calendari esterni
        const availability = await CalendarSyncService.checkAvailabilityWithExternals(
            checkIn, 
            checkOut
        );
        
        // Verifica anche con sistema interno per doppia sicurezza
        const internalCheck = await checkDateAvailability(checkIn, checkOut);
        
        const finalAvailability = availability.available && internalCheck.available;
        
        res.json({
            success: true,
            available: finalAvailability,
            check_in_date: checkIn.toISOString().split('T')[0],
            check_out_date: checkOut.toISOString().split('T')[0],
            conflicts: {
                internal: availability.internalBookings,
                external: availability.externalBookings,
                total: availability.conflicts
            },
            details: {
                internal_available: internalCheck.available,
                external_available: availability.available
            }
        });
        
    } catch (error) {
        console.error('❌ Errore verifica disponibilità:', error);
        res.status(500).json({ error: 'Errore nella verifica disponibilità' });
    }
});

/**
 * GET /api/availability/calendar
 * Ottieni calendario con date occupate
 * Query params: start_date, end_date (opzionali)
 */
router.get('/calendar', async (req, res) => {
    try {
        const { start_date, end_date } = req.query;
        
        // Default: prossimi 6 mesi da oggi
        const today = new Date();
        const startDate = start_date ? new Date(start_date) : today;
        const endDate = end_date ? new Date(end_date) : new Date(today.getFullYear(), today.getMonth() + 6, today.getDate());
        
        const occupiedDates = await getOccupiedDates(startDate, endDate);
        
        // Trasforma in formato più utilizzabile per il frontend
        const calendar = occupiedDates.map(date => ({
            start: date.check_in_date.toISOString().split('T')[0],
            end: date.check_out_date.toISOString().split('T')[0],
            type: date.type,
            status: date.status
        }));
        
        res.json({
            success: true,
            period: {
                start: startDate.toISOString().split('T')[0],
                end: endDate.toISOString().split('T')[0]
            },
            occupied_dates: calendar
        });
        
    } catch (error) {
        console.error('❌ Errore recupero calendario:', error);
        res.status(500).json({ error: 'Errore nel recupero del calendario' });
    }
});

/**
 * GET /api/availability/next-available
 * Trova le prossime date disponibili per un soggiorno di N notti
 * Query params: nights (default: 2), from_date (default: oggi)
 */
router.get('/next-available', async (req, res) => {
    try {
        const { nights = 2, from_date } = req.query;
        const minNights = parseInt(nights);
        const startSearch = from_date ? new Date(from_date) : new Date();
        
        // Cerca nelle prossime 12 settimane
        const endSearch = new Date(startSearch);
        endSearch.setDate(endSearch.getDate() + (12 * 7));
        
        const occupiedDates = await getOccupiedDates(startSearch, endSearch);
        
        // Algoritmo semplice per trovare slot liberi
        const availableSlots = [];
        let currentDate = new Date(startSearch);
        
        while (currentDate < endSearch && availableSlots.length < 10) {
            const checkOut = new Date(currentDate);
            checkOut.setDate(checkOut.getDate() + minNights);
            
            const availability = await checkDateAvailability(currentDate, checkOut);
            
            if (availability.available) {
                availableSlots.push({
                    check_in: currentDate.toISOString().split('T')[0],
                    check_out: checkOut.toISOString().split('T')[0],
                    nights: minNights
                });
            }
            
            // Passa al giorno successivo
            currentDate.setDate(currentDate.getDate() + 1);
        }
        
        res.json({
            success: true,
            search_params: {
                nights: minNights,
                from_date: startSearch.toISOString().split('T')[0]
            },
            available_slots: availableSlots
        });
        
    } catch (error) {
        console.error('❌ Errore ricerca disponibilità:', error);
        res.status(500).json({ error: 'Errore nella ricerca disponibilità' });
    }
});

export default router;