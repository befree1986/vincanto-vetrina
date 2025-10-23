import { Pool } from 'pg';

// Configurazione database per Vercel
const db = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

/**
 * Calcola i costi dettagliati per una prenotazione
 * Basato sulle regole di business di Vincanto
 */
async function calculateBookingCosts(bookingData) {
    const {
        check_in_date,
        check_out_date,
        num_adults,
        num_children = 0,
        children_ages = [],
        parking_option = 'none'
    } = bookingData;
    
    // Ottieni la configurazione prezzi dal database
    const pricingResult = await db.query('SELECT * FROM pricing_config ORDER BY id DESC LIMIT 1');
    const pricing = pricingResult.rows[0];
    
    if (!pricing) {
        throw new Error('Configurazione prezzi non trovata');
    }
    
    // Calcola il numero di notti
    const checkIn = new Date(check_in_date);
    const checkOut = new Date(check_out_date);
    const oneDay = 24 * 60 * 60 * 1000; // millisecondi in un giorno
    const nights = Math.round((checkOut - checkIn) / oneDay);
    
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
 * Valida i dati di input per il calcolo del preventivo
 */
function validateQuoteData(data) {
    const { check_in_date, check_out_date, num_adults } = data;
    
    if (!check_in_date || !check_out_date) {
        return { valid: false, error: 'Date di check-in e check-out sono richieste' };
    }
    
    if (!num_adults || num_adults < 1) {
        return { valid: false, error: 'Numero di adulti deve essere almeno 1' };
    }
    
    const checkIn = new Date(check_in_date);
    const checkOut = new Date(check_out_date);
    
    if (isNaN(checkIn.getTime()) || isNaN(checkOut.getTime())) {
        return { valid: false, error: 'Formato date non valido' };
    }
    
    if (checkOut <= checkIn) {
        return { valid: false, error: 'Data di check-out deve essere successiva al check-in' };
    }
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (checkIn < today) {
        return { valid: false, error: 'Data di check-in non può essere nel passato' };
    }
    
    return { valid: true };
}

/**
 * Handler principale per l'endpoint di preventivo
 */
export default async function handler(req, res) {
    // Aggiungi headers CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    // Gestisci richieste OPTIONS per CORS
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    if (req.method !== 'POST') {
        return res.status(405).json({
            success: false,
            error: 'Metodo non consentito. Usare POST.'
        });
    }
    
    try {
        console.log('📝 Richiesta preventivo ricevuta:', req.body);
        
        // Valida i dati di input
        const validation = validateQuoteData(req.body);
        if (!validation.valid) {
            return res.status(400).json({
                success: false,
                error: validation.error
            });
        }
        
        // Calcola i costi
        const costs = await calculateBookingCosts(req.body);
        
        console.log('💰 Preventivo calcolato:', costs);
        
        return res.status(200).json({
            success: true,
            data: costs
        });
        
    } catch (error) {
        console.error('❌ Errore calcolo preventivo:', error);
        
        return res.status(500).json({
            success: false,
            error: error.message || 'Errore interno del server'
        });
    }
}