/**
 * Calcola i costi dettagliati per una prenotazione
 * Integrato con sistema configurazione admin real-time
 */

// Configurazione sistema - SINCRONIZZATA CON DATABASE NEON
const systemConfig = {
    pricing: {
        basePrice: 80.00,            // base_price_per_adult
        additionalGuestPrice: 20.00, // additional_guest_price 
        cleaningFee: 50.00,          // cleaning_fee
        parkingFeePerNight: 10.00,   // parking_fee_per_night
        touristTaxPerPersonPerNight: 2.00, // tourist_tax_per_person
        minimumNights: 2,            // minimum_nights
        depositPercentage: 0.30,     // deposit_percentage (30%)
        currency: 'EUR'
    }
};

/**
 * Calcola i costi dettagliati per una prenotazione
 * Basato sulle regole di business di Vincanto
 */
async function calculateBookingCosts(bookingData) {
    const {
        checkIn,
        checkOut,
        guests = 1,
        parking = false
    } = bookingData;
    
    // Usa la configurazione del sistema (sincronizzata con admin panel)
    const pricing = systemConfig.pricing;
    
    // Calcola il numero di notti
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    const oneDay = 24 * 60 * 60 * 1000;
    const nights = Math.round((checkOutDate - checkInDate) / oneDay);
    
    if (nights < pricing.minimumNights) {
        throw new Error(`Soggiorno minimo: ${pricing.minimumNights} notti`);
    }
    
    // Calcola ospiti paganti (semplificato per il nuovo sistema)
    const totalGuests = guests;
    
    // Calcola costo soggiorno
    // Primi 2 ospiti: prezzo base
    // Ospiti aggiuntivi: prezzo extra
    let costPerNight = pricing.basePrice; // primo ospite
    if (totalGuests > 1) {
        costPerNight += Math.min(totalGuests - 1, 1) * pricing.basePrice; // secondo ospite al prezzo base
    }
    if (totalGuests > 2) {
        costPerNight += (totalGuests - 2) * pricing.additionalGuestPrice; // ospiti extra
    }
    
    const basePrice = costPerNight * nights;
    
    // Calcola costo parcheggio
    const parkingCost = parking ? pricing.parkingFeePerNight * nights : 0;
    
    // Calcola tassa di soggiorno (applicata a tutti gli ospiti per semplicità)
    const touristTax = pricing.touristTaxPerPersonPerNight * totalGuests * nights;
    
    // Calcola totali
    const cleaningFee = pricing.cleaningFee;
    const subtotal = basePrice + parkingCost + cleaningFee;
    const totalAmount = subtotal + touristTax;
    
    // Calcola acconto
    const depositAmount = totalAmount * pricing.depositPercentage;
    
    return {
        nights,
        guests: totalGuests,
        
        // Costi dettagliati
        basePrice: parseFloat(basePrice.toFixed(2)),
        parkingCost: parseFloat(parkingCost.toFixed(2)),
        cleaningFee: parseFloat(cleaningFee.toFixed(2)),
        touristTax: parseFloat(touristTax.toFixed(2)),
        
        // Totali
        subtotal: parseFloat(subtotal.toFixed(2)),
        totalAmount: parseFloat(totalAmount.toFixed(2)),
        depositAmount: parseFloat(depositAmount.toFixed(2)),
        
        // Metadati
        depositPercentage: pricing.depositPercentage,
        currency: pricing.currency,
        pricingConfig: {
            basePrice: pricing.basePrice,
            additionalGuestPrice: pricing.additionalGuestPrice,
            minimumNights: pricing.minimumNights
        }
    };
}

/**
 * Valida i dati di input per il calcolo del preventivo
 */
function validateQuoteData(data) {
    // Supporta entrambi i formati API: nuovo (checkIn/checkOut/guests) e vecchio (check_in_date/check_out_date/num_adults)
    const checkIn = data.checkIn || data.check_in_date;
    const checkOut = data.checkOut || data.check_out_date;
    const guests = data.guests || (data.num_adults + (data.num_children || 0));
    
    if (!checkIn || !checkOut) {
        return { valid: false, error: 'Date di check-in e check-out sono richieste' };
    }
    
    if (!guests || guests < 1) {
        return { valid: false, error: 'Numero di ospiti deve essere almeno 1' };
    }
    
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    
    if (isNaN(checkInDate.getTime()) || isNaN(checkOutDate.getTime())) {
        return { valid: false, error: 'Formato date non valido' };
    }
    
    if (checkOutDate <= checkInDate) {
        return { valid: false, error: 'Data di check-out deve essere successiva al check-in' };
    }
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (checkInDate < today) {
        return { valid: false, error: 'Data di check-in non può essere nel passato' };
    }
    
    return { 
        valid: true, 
        normalizedData: {
            checkIn,
            checkOut,
            guests,
            parking: data.parking || (data.parking_option === 'private')
        }
    };
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
        
        // Calcola i costi usando i dati normalizzati
        const costs = await calculateBookingCosts(validation.normalizedData);
        
        console.log('💰 Preventivo calcolato:', costs);
        
        return res.status(200).json({
            success: true,
            costs: costs
        });
        
    } catch (error) {
        console.error('❌ Errore calcolo preventivo:', error);
        
        return res.status(500).json({
            success: false,
            error: error.message || 'Errore interno del server'
        });
    }
}