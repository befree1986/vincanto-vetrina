import { Pool } from 'pg';

// Configurazione database per Vercel
const db = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

/**
 * Calcola i costi dettagliati per una prenotazione
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
    const oneDay = 24 * 60 * 60 * 1000;
    const nights = Math.round((checkOut - checkIn) / oneDay);
    
    if (nights < pricing.minimum_nights) {
        throw new Error(`Soggiorno minimo: ${pricing.minimum_nights} notti`);
    }
    
    // Calcola ospiti paganti per il soggiorno
    let paying_children = 0;
    children_ages.forEach(age => {
        if (age > 3) {
            paying_children++;
        }
    });
    
    const total_paying_guests = num_adults + paying_children;
    
    // Calcola costo soggiorno con scaglioni
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
    
    // Calcola acconto (30% del totale)
    const deposit_percentage = 0.30;
    const deposit_amount = total_amount * deposit_percentage;
    
    return {
        nights,
        num_adults,
        num_children,
        paying_children,
        total_paying_guests,
        taxable_guests,
        base_price: parseFloat(base_price.toFixed(2)),
        parking_cost: parseFloat(parking_cost.toFixed(2)),
        cleaning_fee: parseFloat(cleaning_fee.toFixed(2)),
        tourist_tax: parseFloat(tourist_tax.toFixed(2)),
        subtotal: parseFloat(subtotal.toFixed(2)),
        total_amount: parseFloat(total_amount.toFixed(2)),
        deposit_amount: parseFloat(deposit_amount.toFixed(2)),
        deposit_percentage,
        pricing_config: {
            base_price_per_adult: parseFloat(pricing.base_price_per_adult),
            additional_guest_price: parseFloat(pricing.additional_guest_price),
            minimum_nights: pricing.minimum_nights
        }
    };
}

/**
 * Controlla disponibilità delle date
 */
async function checkDateAvailability(check_in_date, check_out_date) {
    try {
        const bookingConflict = await db.query(`
            SELECT id FROM bookings 
            WHERE booking_status IN ('confirmed', 'pending')
            AND (
                (check_in_date <= $1 AND check_out_date > $1)
                OR (check_in_date < $2 AND check_out_date >= $2)
                OR (check_in_date >= $1 AND check_out_date <= $2)
            )
        `, [check_in_date, check_out_date]);
        
        const blockedDates = await db.query(`
            SELECT id FROM blocked_dates 
            WHERE (
                (start_date <= $1 AND end_date > $1)
                OR (start_date < $2 AND end_date >= $2)
                OR (start_date >= $1 AND end_date <= $2)
            )
        `, [check_in_date, check_out_date]);
        
        return bookingConflict.rows.length === 0 && blockedDates.rows.length === 0;
        
    } catch (error) {
        console.error('❌ Errore controllo disponibilità:', error);
        throw error;
    }
}

/**
 * Valida i dati della prenotazione
 */
function validateBookingData(data) {
    const requiredFields = [
        'guest_name', 'guest_surname', 'guest_email', 'guest_phone',
        'check_in_date', 'check_out_date', 'num_adults', 'payment_method', 'payment_type'
    ];
    
    for (const field of requiredFields) {
        if (!data[field]) {
            return { valid: false, error: `Campo obbligatorio mancante: ${field}` };
        }
    }
    
    // Valida email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.guest_email)) {
        return { valid: false, error: 'Email non valida' };
    }
    
    // Valida date
    const checkIn = new Date(data.check_in_date);
    const checkOut = new Date(data.check_out_date);
    
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
    
    // Valida numero di adulti
    if (!data.num_adults || data.num_adults < 1) {
        return { valid: false, error: 'Numero di adulti deve essere almeno 1' };
    }
    
    return { valid: true };
}

/**
 * Handler principale per la creazione di prenotazioni
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
        console.log('📝 Richiesta creazione prenotazione:', req.body);
        
        // Valida i dati di input
        const validation = validateBookingData(req.body);
        if (!validation.valid) {
            return res.status(400).json({
                success: false,
                error: validation.error
            });
        }
        
        const {
            guest_name,
            guest_surname,
            guest_email,
            guest_phone,
            check_in_date,
            check_out_date,
            num_adults,
            num_children = 0,
            children_ages = [],
            parking_option = 'none',
            payment_method,
            payment_type,
            guest_message = ''
        } = req.body;
        
        // Verifica disponibilità
        const isAvailable = await checkDateAvailability(check_in_date, check_out_date);
        if (!isAvailable) {
            return res.status(409).json({
                success: false,
                error: 'Date non disponibili per la prenotazione'
            });
        }
        
        // Calcola i costi
        const costs = await calculateBookingCosts({
            check_in_date: new Date(check_in_date),
            check_out_date: new Date(check_out_date),
            num_adults: parseInt(num_adults),
            num_children: parseInt(num_children),
            children_ages: children_ages,
            parking_option: parking_option
        });
        
        // Determina l'importo da pagare
        const payment_amount = payment_type === 'deposit' ? costs.deposit_amount : costs.total_amount;
        
        // Inserisci la prenotazione nel database
        const result = await db.query(`
            INSERT INTO bookings (
                guest_name, guest_surname, guest_email, guest_phone,
                check_in_date, check_out_date, num_adults, num_children, children_ages,
                parking_option, base_price, parking_cost, cleaning_fee, tourist_tax,
                total_amount, deposit_amount, payment_method, payment_type, payment_amount,
                guest_message, booking_status, created_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22)
            RETURNING *
        `, [
            guest_name, guest_surname, guest_email, guest_phone,
            check_in_date, check_out_date, num_adults, num_children, children_ages,
            parking_option, costs.base_price, costs.parking_cost, costs.cleaning_fee,
            costs.tourist_tax, costs.total_amount, costs.deposit_amount,
            payment_method, payment_type, payment_amount, guest_message,
            'pending', new Date()
        ]);
        
        const booking = result.rows[0];
        
        console.log('✅ Prenotazione creata:', booking.id);
        
        return res.status(201).json({
            success: true,
            data: {
                booking_id: booking.id,
                payment_amount: booking.payment_amount,
                booking_status: booking.booking_status,
                costs: costs
            }
        });
        
    } catch (error) {
        console.error('❌ Errore creazione prenotazione:', error);
        
        return res.status(500).json({
            success: false,
            error: error.message || 'Errore interno del server'
        });
    }
}