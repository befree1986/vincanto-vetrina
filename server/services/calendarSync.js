import cron from 'node-cron';
import axios from 'axios';
import ical from 'ical';
import { db } from '../index.js';

/**
 * Avvia la sincronizzazione automatica dei calendari
 */
export function startCalendarSync() {
    console.log('📅 Avvio sincronizzazione calendari esterni...');
    
    // Sincronizza ogni 4 ore
    cron.schedule('0 */4 * * *', () => {
        console.log('🔄 Avvio sincronizzazione calendari programmata...');
        syncAllCalendars();
    });
    
    // Sincronizzazione iniziale dopo 30 secondi
    setTimeout(() => {
        syncAllCalendars();
    }, 30000);
}

/**
 * Sincronizza tutti i calendari configurati
 */
async function syncAllCalendars() {
    try {
        const calendarsResult = await db.query(`
            SELECT * FROM calendar_sync 
            WHERE sync_status = 'active' 
            AND sync_url IS NOT NULL 
            AND sync_url != ''
        `);
        
        const calendars = calendarsResult.rows;
        
        if (calendars.length === 0) {
            console.log('📅 Nessun calendario esterno configurato per la sincronizzazione');
            return;
        }
        
        for (const calendar of calendars) {
            try {
                await syncSingleCalendar(calendar);
                console.log(`✅ Sincronizzato: ${calendar.platform}`);
            } catch (error) {
                console.error(`❌ Errore sincronizzazione ${calendar.platform}:`, error.message);
                
                // Aggiorna lo stato di errore
                await db.query(`
                    UPDATE calendar_sync 
                    SET sync_status = 'error', error_message = $1, updated_at = CURRENT_TIMESTAMP
                    WHERE id = $2
                `, [error.message, calendar.id]);
            }
        }
        
    } catch (error) {
        console.error('❌ Errore generale sincronizzazione calendari:', error);
    }
}

/**
 * Sincronizza un singolo calendario
 */
async function syncSingleCalendar(calendar) {
    const { id, platform, sync_url } = calendar;
    
    try {
        console.log(`🔄 Sincronizzazione ${platform}: ${sync_url}`);
        
        // Scarica il file iCal
        const response = await axios.get(sync_url, {
            timeout: 30000,
            headers: {
                'User-Agent': 'Vincanto Calendar Sync/1.0'
            }
        });
        
        // Parsa il contenuto iCal
        const icalData = ical.parseICS(response.data);
        
        let processedEvents = 0;
        let newBlockedDates = 0;
        
        for (const key in icalData) {
            const event = icalData[key];
            
            if (event.type === 'VEVENT' && event.start && event.end) {
                try {
                    const startDate = new Date(event.start);
                    const endDate = new Date(event.end);
                    
                    // Verifica se è un evento di blocco (prenotazione)
                    if (isBlockingEvent(event, platform)) {
                        await processBlockingEvent(event, startDate, endDate, platform);
                        newBlockedDates++;
                    }
                    
                    processedEvents++;
                } catch (eventError) {
                    console.warn(`⚠️ Errore processamento evento ${key}:`, eventError.message);
                }
            }
        }
        
        // Aggiorna lo stato di successo
        await db.query(`
            UPDATE calendar_sync 
            SET last_sync = CURRENT_TIMESTAMP, sync_status = 'active', error_message = NULL, updated_at = CURRENT_TIMESTAMP
            WHERE id = $1
        `, [id]);
        
        console.log(`📅 ${platform}: ${processedEvents} eventi processati, ${newBlockedDates} nuove date bloccate`);
        
    } catch (error) {
        console.error(`❌ Errore sincronizzazione ${platform}:`, error);
        throw error;
    }
}

/**
 * Determina se un evento rappresenta una prenotazione che blocca le date
 */
function isBlockingEvent(event, platform) {
    // Per Booking.com, tutti gli eventi sono considerati prenotazioni
    if (platform === 'booking_com') {
        return true;
    }
    
    // Per Airbnb, controlla il summary/description
    if (platform === 'airbnb') {
        const summary = (event.summary || '').toLowerCase();
        const description = (event.description || '').toLowerCase();
        
        return summary.includes('reserved') || 
               summary.includes('booked') ||
               description.includes('reservation');
    }
    
    // Per Gmail/Google Calendar, cerca parole chiave
    if (platform === 'gmail') {
        const summary = (event.summary || '').toLowerCase();
        
        return summary.includes('prenotazione') ||
               summary.includes('booking') ||
               summary.includes('riservato') ||
               summary.includes('occupato');
    }
    
    return false;
}

/**
 * Processa un evento che blocca le date
 */
async function processBlockingEvent(event, startDate, endDate, platform) {
    try {
        const externalId = event.uid || `${platform}_${startDate.getTime()}`;
        const reason = `${platform.toUpperCase()}: ${event.summary || 'Prenotazione esterna'}`;
        
        // Verifica se l'evento è già stato processato
        const existingResult = await db.query(`
            SELECT id FROM blocked_dates 
            WHERE reason = $1 AND start_date = $2 AND end_date = $3
        `, [reason, startDate, endDate]);
        
        if (existingResult.rows.length > 0) {
            return; // Evento già processato
        }
        
        // Verifica conflitti con prenotazioni esistenti
        const conflictResult = await db.query(`
            SELECT id FROM bookings 
            WHERE booking_status IN ('confirmed', 'pending')
            AND (
                (check_in_date <= $1 AND check_out_date > $1)
                OR (check_in_date < $2 AND check_out_date >= $2)
                OR (check_in_date >= $1 AND check_out_date <= $2)
            )
        `, [startDate, endDate]);
        
        if (conflictResult.rows.length > 0) {
            console.warn(`⚠️ Conflitto rilevato: prenotazione esistente per ${startDate.toISOString().split('T')[0]} - ${endDate.toISOString().split('T')[0]}`);
            return;
        }
        
        // Inserisce la data bloccata
        await db.query(`
            INSERT INTO blocked_dates (start_date, end_date, reason, created_by)
            VALUES ($1, $2, $3, $4)
        `, [startDate, endDate, reason, `sync_${platform}`]);
        
        console.log(`📅 Nuova data bloccata: ${startDate.toISOString().split('T')[0]} - ${endDate.toISOString().split('T')[0]} (${platform})`);
        
    } catch (error) {
        console.error('❌ Errore processamento evento bloccante:', error);
        throw error;
    }
}

/**
 * Aggiorna configurazione sincronizzazione calendario
 */
export async function updateCalendarSync(platform, syncUrl, status = 'active') {
    try {
        const result = await db.query(`
            UPDATE calendar_sync 
            SET sync_url = $1, sync_status = $2, updated_at = CURRENT_TIMESTAMP
            WHERE platform = $3
            RETURNING *
        `, [syncUrl, status, platform]);
        
        if (result.rows.length === 0) {
            // Inserisce se non esiste
            const insertResult = await db.query(`
                INSERT INTO calendar_sync (platform, sync_url, sync_status)
                VALUES ($1, $2, $3)
                RETURNING *
            `, [platform, syncUrl, status]);
            
            return insertResult.rows[0];
        }
        
        return result.rows[0];
        
    } catch (error) {
        console.error('❌ Errore aggiornamento configurazione calendario:', error);
        throw error;
    }
}

/**
 * Forza sincronizzazione manuale
 */
export async function forceSyncCalendar(platform) {
    try {
        const calendarResult = await db.query(`
            SELECT * FROM calendar_sync WHERE platform = $1
        `, [platform]);
        
        if (calendarResult.rows.length === 0) {
            throw new Error('Calendario non configurato');
        }
        
        const calendar = calendarResult.rows[0];
        
        if (!calendar.sync_url) {
            throw new Error('URL di sincronizzazione non configurato');
        }
        
        await syncSingleCalendar(calendar);
        return true;
        
    } catch (error) {
        console.error(`❌ Errore sincronizzazione forzata ${platform}:`, error);
        throw error;
    }
}

export default {
    startCalendarSync,
    updateCalendarSync,
    forceSyncCalendar
};