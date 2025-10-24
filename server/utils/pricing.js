import { db } from '../index.js';

/**
 * Calcola i costi dettagliati per una prenotazione
 * Basato sulle regole di business di Vincanto
 */
export async function calculateBookingCosts(bookingData) {
    const {
        check_in_date,
        check_out_date,
        num_adults,
        num_children,
        children_ages = [],
        parking_option = 'none'
    } = bookingData;
    
    let pricing;
    
    try {
        // Ottieni la configurazione prezzi dal database
        const pricingResult = await db.query('SELECT * FROM pricing_config ORDER BY id DESC LIMIT 1');
        pricing = pricingResult.rows[0];
        
        if (!pricing) {
            throw new Error('Configurazione prezzi non trovata');
        }
    } catch (error) {
        console.warn('⚠️ Database non disponibile, usando configurazione pricing predefinita');
        
        // Configurazione pricing di fallback per sviluppo/test
        pricing = {
            base_price_per_adult: 80.00,
            additional_guest_price: 20.00,
            minimum_nights: 1,
            parking_fee_per_night: 10.00,
            tourist_tax_per_person: 2.00,
            cleaning_fee: 50.00,
            deposit_percentage: 0.30
        };
    }
    
    // Calcola il numero di notti
    const oneDay = 24 * 60 * 60 * 1000; // millisecondi in un giorno
    const nights = Math.round((check_out_date - check_in_date) / oneDay);
    
    if (nights < pricing.minimum_nights) {
        throw new Error(`Soggiorno minimo: ${pricing.minimum_nights} notti`);
    }
    
    // Calcola ospiti paganti per il soggiorno
    // Regola: bambini 0-3 anni non pagano per il soggiorno
    let paying_children = 0;
    children_ages.forEach(age => {
        if (age > 3) {
            paying_children++;
        }
    });
    
    const total_paying_guests = num_adults + paying_children;
    
    // Calcola costo soggiorno con scaglioni
    // Primi 2 ospiti paganti: prezzo base per adulto
    // Dal 3° ospite pagante: prezzo aggiuntivo
    let cost_per_night = 0;
    if (total_paying_guests >= 1) {
        cost_per_night += Math.min(total_paying_guests, 2) * parseFloat(pricing.base_price_per_adult);
    }
    if (total_paying_guests >= 3) {
        cost_per_night += (total_paying_guests - 2) * parseFloat(pricing.additional_guest_price);
    }
    
    const base_price = cost_per_night * nights;
    
    // Calcola costo parcheggio
    const parking_cost = parking_option === 'private' 
        ? parseFloat(pricing.parking_fee_per_night) * nights 
        : 0;
    
    // Calcola tassa di soggiorno
    // Regola: solo per ospiti >= 14 anni
    let taxable_guests = num_adults;
    children_ages.forEach(age => {
        if (age >= 14) {
            taxable_guests++;
        }
    });
    
    const tourist_tax = taxable_guests * parseFloat(pricing.tourist_tax_per_person) * nights;
    
    // Calcola totali
    const cleaning_fee = parseFloat(pricing.cleaning_fee);
    const subtotal = base_price + parking_cost + cleaning_fee;
    const total_amount = subtotal + tourist_tax;
    
    // Calcola acconto (30% del totale come da richiesta)
    const deposit_percentage = 0.30;
    const deposit_amount = total_amount * deposit_percentage;
    
    return {
        nights,
        num_adults,
        num_children,
        paying_children,
        total_paying_guests,
        taxable_guests,
        
        // Costi dettagliati
        base_price: parseFloat(base_price.toFixed(2)),
        parking_cost: parseFloat(parking_cost.toFixed(2)),
        cleaning_fee: parseFloat(cleaning_fee.toFixed(2)),
        tourist_tax: parseFloat(tourist_tax.toFixed(2)),
        
        // Totali
        subtotal: parseFloat(subtotal.toFixed(2)),
        total_amount: parseFloat(total_amount.toFixed(2)),
        deposit_amount: parseFloat(deposit_amount.toFixed(2)),
        
        // Metadati
        deposit_percentage,
        pricing_config: {
            base_price_per_adult: parseFloat(pricing.base_price_per_adult),
            additional_guest_price: parseFloat(pricing.additional_guest_price),
            minimum_nights: pricing.minimum_nights
        }
    };
}

/**
 * Valida che le date siano disponibili
 */
export async function checkDateAvailability(check_in_date, check_out_date) {
    try {
        // Controlla sovrapposizioni con prenotazioni esistenti
        const bookingConflict = await db.query(`
            SELECT id FROM bookings 
            WHERE booking_status IN ('confirmed', 'pending')
            AND (
                (check_in_date <= $1 AND check_out_date > $1)
                OR (check_in_date < $2 AND check_out_date >= $2)
                OR (check_in_date >= $1 AND check_out_date <= $2)
            )
        `, [check_in_date, check_out_date]);
        
        // Controlla date bloccate
        const blockedDates = await db.query(`
            SELECT id FROM blocked_dates 
            WHERE (
                (start_date <= $1 AND end_date > $1)
                OR (start_date < $2 AND end_date >= $2)
                OR (start_date >= $1 AND end_date <= $2)
            )
        `, [check_in_date, check_out_date]);
        
        return {
            available: bookingConflict.rows.length === 0 && blockedDates.rows.length === 0,
            conflicts: {
                bookings: bookingConflict.rows.length,
                blocked_dates: blockedDates.rows.length
            }
        };
        
    } catch (error) {
        console.error('❌ Errore controllo disponibilità:', error);
        throw error;
    }
}

/**
 * Ottieni tutte le date occupate per il calendario
 */
export async function getOccupiedDates(startDate, endDate) {
    try {
        const result = await db.query(`
            SELECT 
                check_in_date,
                check_out_date,
                'booking' as type,
                booking_status as status
            FROM bookings 
            WHERE booking_status IN ('confirmed', 'pending')
            AND check_in_date <= $2 
            AND check_out_date >= $1
            
            UNION ALL
            
            SELECT 
                start_date as check_in_date,
                end_date as check_out_date,
                'blocked' as type,
                reason as status
            FROM blocked_dates
            WHERE start_date <= $2 
            AND end_date >= $1
            
            ORDER BY check_in_date
        `, [startDate, endDate]);
        
        return result.rows;
        
    } catch (error) {
        console.error('❌ Errore recupero date occupate:', error);
        throw error;
    }
}