/**
 * API per il calcolo preventivi con configurazione reale
 * Usa la configurazione sistema e controlla disponibilità
 */

// Importa configurazione (simulazione, in produzione da database)
const getSystemConfig = () => ({
    pricing: {
        basePrice: 80,
        additionalGuestPrice: 20,
        cleaningFee: 50,
        parkingFeePerNight: 10,
        touristTaxPerPersonPerNight: 2,
        minimumNights: 2,
        depositPercentage: 0.30
    }
});

// Importa date bloccate (simulazione)
const getBlockedDates = () => [
    { startDate: '2025-11-15', endDate: '2025-11-18', type: 'booking' },
    { startDate: '2025-12-01', endDate: '2025-12-05', type: 'booking' },
    { startDate: '2025-12-20', endDate: '2025-12-27', type: 'maintenance' }
];

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
        const {
            check_in_date,
            check_out_date,
            num_adults = 1,
            num_children = 0,
            parking_option = 'none'
        } = req.body || {};
        
        console.log('📝 Richiesta preventivo ricevuta:', req.body);
        
        // Valida dati base
        if (!check_in_date || !check_out_date) {
            return res.status(400).json({
                success: false,
                error: 'Date di check-in e check-out sono richieste'
            });
        }
        
        // Calcola numero di notti
        const checkIn = new Date(check_in_date);
        const checkOut = new Date(check_out_date);
        const nights = Math.round((checkOut - checkIn) / (24 * 60 * 60 * 1000));
        
        if (nights <= 0) {
            return res.status(400).json({
                success: false,
                error: 'Le date non sono valide'
            });
        }
        
        // Ottieni configurazione reale
        const config = getSystemConfig();
        
        if (nights < config.pricing.minimumNights) {
            return res.status(400).json({
                success: false,
                error: `Soggiorno minimo: ${config.pricing.minimumNights} notti`
            });
        }
        
        // Controlla disponibilità
        const blockedDates = getBlockedDates();
        const isBlocked = blockedDates.some(blocked => {
            return (check_in_date <= blocked.endDate && check_out_date >= blocked.startDate);
        });
        
        if (isBlocked) {
            return res.status(409).json({
                success: false,
                error: 'Le date selezionate non sono disponibili',
                available: false
            });
        }
        
        // Calcolo costi con configurazione reale
        const total_guests = num_adults + num_children;
        let cost_per_night = Math.min(total_guests, 2) * config.pricing.basePrice;
        if (total_guests > 2) {
            cost_per_night += (total_guests - 2) * config.pricing.additionalGuestPrice;
        }
        
        const base_price = cost_per_night * nights;
        const parking_cost = parking_option === 'private' ? config.pricing.parkingFeePerNight * nights : 0;
        const cleaning_fee = config.pricing.cleaningFee;
        const tourist_tax = total_guests * config.pricing.touristTaxPerPersonPerNight * nights;
        
        const subtotal = base_price + parking_cost + cleaning_fee;
        const total_amount = subtotal + tourist_tax;
        const deposit_amount = total_amount * config.pricing.depositPercentage;
        
        const quote = {
            nights,
            num_adults,
            num_children,
            total_guests,
            base_price: parseFloat(base_price.toFixed(2)),
            parking_cost: parseFloat(parking_cost.toFixed(2)),
            cleaning_fee: parseFloat(cleaning_fee.toFixed(2)),
            tourist_tax: parseFloat(tourist_tax.toFixed(2)),
            subtotal: parseFloat(subtotal.toFixed(2)),
            total_amount: parseFloat(total_amount.toFixed(2)),
            deposit_amount: parseFloat(deposit_amount.toFixed(2)),
            deposit_percentage: config.pricing.depositPercentage,
            available: true,
            check_in_date,
            check_out_date,
            currency: 'EUR',
            valid_until: new Date(Date.now() + 30 * 60 * 1000).toISOString()
        };
        
        console.log('💰 Preventivo calcolato:', quote);
        
        return res.status(200).json({
            success: true,
            costs: quote,
            quote_valid_until: quote.valid_until
        });
        
    } catch (error) {
        console.error('❌ Errore calcolo preventivo:', error);
        
        return res.status(500).json({
            success: false,
            error: error.message || 'Errore interno del server'
        });
    }
}
            });
        }
        
        // Calcoli di test (senza database)
        const mockPricing = {
            base_price_per_adult: 80,
            additional_guest_price: 20,
            cleaning_fee: 50,
            parking_fee_per_night: 10,
            tourist_tax_per_person: 2,
            minimum_nights: 2
        };
        
        if (nights < mockPricing.minimum_nights) {
            return res.status(400).json({
                success: false,
                error: `Soggiorno minimo: ${mockPricing.minimum_nights} notti`
            });
        }
        
        // Calcolo costi
        const total_guests = num_adults + num_children;
        let cost_per_night = Math.min(total_guests, 2) * mockPricing.base_price_per_adult;
        if (total_guests > 2) {
            cost_per_night += (total_guests - 2) * mockPricing.additional_guest_price;
        }
        
        const base_price = cost_per_night * nights;
        const parking_cost = parking_option === 'private' ? mockPricing.parking_fee_per_night * nights : 0;
        const cleaning_fee = mockPricing.cleaning_fee;
        const tourist_tax = total_guests * mockPricing.tourist_tax_per_person * nights;
        
        const subtotal = base_price + parking_cost + cleaning_fee;
        const total_amount = subtotal + tourist_tax;
        const deposit_amount = total_amount * 0.30;
        
        const mockQuote = {
            nights,
            num_adults,
            num_children,
            total_guests,
            base_price: parseFloat(base_price.toFixed(2)),
            parking_cost: parseFloat(parking_cost.toFixed(2)),
            cleaning_fee: parseFloat(cleaning_fee.toFixed(2)),
            tourist_tax: parseFloat(tourist_tax.toFixed(2)),
            subtotal: parseFloat(subtotal.toFixed(2)),
            total_amount: parseFloat(total_amount.toFixed(2)),
            deposit_amount: parseFloat(deposit_amount.toFixed(2)),
            deposit_percentage: 0.30,
            is_test: true,
            message: "Questo è un preventivo di test (senza database)"
        };
        
        console.log('💰 Preventivo test calcolato:', mockQuote);
        
        return res.status(200).json({
            success: true,
            costs: mockQuote,  // Cambiato da 'data' a 'costs' per compatibilità frontend
            quote_valid_until: new Date(Date.now() + 30 * 60 * 1000).toISOString() // Valido per 30 minuti
        });
        
    } catch (error) {
        console.error('❌ Errore calcolo preventivo test:', error);
        
        return res.status(500).json({
            success: false,
            error: error.message || 'Errore interno del server',
            is_test: true
        });
    }
}