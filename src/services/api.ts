import axios from 'axios';

// Configurazione base URL semplificata per emergenza
const API_BASE_URL = '/api';

// Configurazione Axios
const api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 30000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Interceptor per log delle richieste
api.interceptors.request.use(
    (config) => {
        console.log(`🔗 API Request: ${config.method?.toUpperCase()} ${config.url}`);
        return config;
    },
    (error) => {
        console.error('❌ API Request Error:', error);
        return Promise.reject(error);
    }
);

// Interceptor per gestione delle risposte
api.interceptors.response.use(
    (response) => {
        console.log(`✅ API Response: ${response.status} ${response.config.url}`);
        return response;
    },
    (error) => {
        console.error('❌ API Response Error:', error.response?.data || error.message);
        return Promise.reject(error);
    }
);

// === BOOKING API ===

export interface BookingQuoteRequest {
    checkIn: string;
    checkOut: string;
    guests: number;
    includeParking?: boolean;
}

export interface BookingQuoteResponse {
    nights: number;
    guests: number;
    basePrice: number;
    parkingCost: number;
    cleaningFee: number;
    touristTax: number;
    subtotal: number;
    totalAmount: number;
    depositAmount: number;
    depositPercentage: number;
    currency: string;
    pricingConfig: {
        basePrice: number;
        additionalGuestPrice: number;
        minimumNights: number;
    };
}

export interface CreateBookingRequest {
    guest_name: string;
    guest_surname: string;
    guest_email: string;
    guest_phone: string;
    check_in_date: string;
    check_out_date: string;
    num_adults: number;
    num_children: number;
    children_ages?: number[];
    parking_option: 'none' | 'street' | 'private';
    payment_method: 'stripe' | 'paypal' | 'bank_transfer';
    payment_type: 'deposit' | 'full';
    guest_message?: string;
}

export interface CreateBookingResponse {
    success: boolean;
    booking_id: string;
    payment_amount: number;
    payment_method: string;
    message: string;
}

/**
 * Ottieni preventivo per una prenotazione
 */
export async function getBookingQuote(data: BookingQuoteRequest): Promise<BookingQuoteResponse> {
    console.log('🚀 Frontend sending quote request:', data);
    
    try {
        // Invia i dati nel formato che il backend si aspetta
        const response = await api.get('/quote', {
            params: {
                checkIn: data.checkIn,
                checkOut: data.checkOut,
                guests: data.guests,
                includeParking: data.includeParking || false
            }
        });
        
        console.log('📦 API quote response:', response.data);
        
        // Il nuovo backend restituisce { success: true, data: { pricing: {...}, config_used: {...}, booking_details: {...} } }
        if (!response.data.success || !response.data.data) {
            throw new Error('Invalid API response format');
        }
        
        const { pricing, config_used, booking_details } = response.data.data;
        
        // Trasforma la risposta API per il frontend
        const transformedCosts: BookingQuoteResponse = {
            nights: booking_details.nights,
            guests: booking_details.guests,
            basePrice: pricing.base_price,
            parkingCost: 0, // TODO: Implementare parcheggio nel nuovo sistema
            cleaningFee: pricing.cleaning_fee,
            touristTax: pricing.tourist_tax,
            subtotal: pricing.subtotal,
            totalAmount: pricing.total,
            depositAmount: pricing.total * 0.30, // TODO: Prendere da configurazione
            depositPercentage: 0.30,
            currency: 'EUR',
            pricingConfig: {
                basePrice: config_used.base_price_per_night || pricing.rate_per_night,
                additionalGuestPrice: 0, // TODO: Implementare nel nuovo sistema
                minimumNights: 2
            }
        };
        
        console.log('✨ Transformed quote for frontend:', transformedCosts);
        return transformedCosts;
        
    } catch (error) {
        console.warn('⚠️ API not available, using mock data for testing');
        
        // FALLBACK TEMPORANEO per test senza API - AGGIORNATO AI PREZZI CORRETTI
        const checkIn = new Date(data.checkIn);
        const checkOut = new Date(data.checkOut);
        const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
        const guests = data.guests;
        
        // 🔄 PREZZI DINAMICI: Carica dal database admin tramite API quote
        let dynamicPricing = null;
        try {
            // Usa l'API quote che legge i prezzi dal database admin
            const quoteResponse = await fetch(`/api/quote?checkIn=${formatDateForApi(checkIn)}&checkOut=${formatDateForApi(checkOut)}&guests=${guests}&includeParking=${data.includeParking}`);
            if (quoteResponse.ok) {
                const quoteData = await quoteResponse.json();
                if (quoteData.success && quoteData.pricingConfig) {
                    dynamicPricing = quoteData.pricingConfig;
                    console.log('✅ DYNAMIC PRICING: Prezzi caricati dal database admin:', dynamicPricing);
                }
            }
        } catch (error) {
            console.warn('⚠️ DYNAMIC PRICING: Fallback ai prezzi statici, errore:', error);
        }

        // Usa prezzi dinamici o fallback statici
        const pricePerPerson = dynamicPricing?.basePrice || 75;
        const parkingPerNight = dynamicPricing?.parkingFee || 15;
        const cleaningPrice = dynamicPricing?.cleaningFee || 50;
        const touristTaxRate = dynamicPricing?.touristTax || 2;
        
        console.log('💰 PRICING USED:', { pricePerPerson, parkingPerNight, cleaningPrice, touristTaxRate, isDynamic: !!dynamicPricing });
        
        const basePrice = nights * guests * pricePerPerson; // Per PERSONA per notte
        const parkingCost = data.includeParking ? nights * parkingPerNight : 0; // Parcheggio dinamico
        const cleaningFee = cleaningPrice;
        const touristTax = guests * nights * touristTaxRate;
        const subtotal = basePrice + parkingCost + cleaningFee;
        const totalAmount = subtotal + touristTax;
        const depositAmount = totalAmount * 0.30;
        
        const mockResponse: BookingQuoteResponse = {
            nights,
            guests,
            basePrice: basePrice, // Solo basePrice, additionalGuestPrice = 0
            parkingCost,
            cleaningFee,
            touristTax,
            subtotal,
            totalAmount,
            depositAmount,
            depositPercentage: 0.30,
            currency: 'EUR',
            pricingConfig: {
                basePrice: 75, // €75 per persona
                additionalGuestPrice: 75, // Stesso prezzo per ogni persona
                minimumNights: 2
            }
        };
        
        console.log('🎭 Using mock quote response:', mockResponse);
        return mockResponse;
    }
}

/**
 * Crea una nuova prenotazione
 */
export async function createBooking(data: CreateBookingRequest): Promise<CreateBookingResponse> {
    const response = await api.post('/booking/create', data);
    return response.data;
}

/**
 * Ottieni dettagli di una prenotazione
 */
export async function getBookingDetails(bookingId: string) {
    const response = await api.get(`/booking/${bookingId}`);
    return response.data;
}

// === AVAILABILITY API ===

export interface AvailabilityCheck {
    check_in_date: string;
    check_out_date: string;
}

export interface AvailabilityResponse {
    success: boolean;
    available: boolean;
    check_in_date: string;
    check_out_date: string;
    conflicts?: {
        bookings: number;
        blocked_dates: number;
    };
}

export interface CalendarResponse {
    success: boolean;
    period: {
        start: string;
        end: string;
    };
    occupied_dates: Array<{
        start: string;
        end: string;
        type: 'booking' | 'blocked';
        status: string;
    }>;
}

/**
 * Verifica disponibilità per date specifiche
 */
export async function checkAvailability(data: AvailabilityCheck): Promise<AvailabilityResponse> {
    const response = await api.get('/availability', {
        params: { ...data, action: 'check' }
    });
    return response.data;
}

/**
 * Ottieni calendario con date occupate
 */
export async function getCalendar(startDate?: string, endDate?: string): Promise<CalendarResponse> {
    const params: any = { action: 'calendar' };
    if (startDate) params.start_date = startDate;
    if (endDate) params.end_date = endDate;
    
    const response = await api.get('/availability', { params });
    return response.data;
}

/**
 * Trova prossime date disponibili
 */
export async function getNextAvailableDates(nights: number = 2, fromDate?: string) {
    const params: any = { action: 'next-available', nights };
    if (fromDate) params.from_date = fromDate;
    
    const response = await api.get('/availability', { params });
    return response.data;
}

// === PAYMENT API ===

export interface StripePaymentIntentRequest {
    booking_id: string;
    amount: number;
    customer_email?: string;
    customer_name?: string;
}

export interface StripePaymentIntentResponse {
    success: boolean;
    client_secret: string;
    payment_intent_id: string;
}

/**
 * Crea Payment Intent per Stripe
 */
export async function createStripePaymentIntent(data: StripePaymentIntentRequest): Promise<StripePaymentIntentResponse> {
    const response = await api.post('/stripe/create-payment-intent', {
        booking_id: data.booking_id,
        amount: data.amount,
        customer_email: data.customer_email || '',
        customer_name: data.customer_name || ''
    });
    return response.data;
}

/**
 * Conferma pagamento Stripe
 */
export async function confirmStripePayment(paymentIntentId: string) {
    const response = await api.post('/stripe/confirm-payment', {
        payment_intent_id: paymentIntentId
    });
    return response.data;
}

/**
 * Crea ordine PayPal
 */
export async function createPayPalOrder(data: StripePaymentIntentRequest) {
    const response = await api.post('/payment/create-paypal-order', data);
    return response.data;
}

/**
 * Conferma pagamento PayPal
 */
export async function confirmPayPalPayment(bookingId: string, paypalOrderId: string, captureId?: string) {
    const response = await api.post('/payment/confirm-paypal', {
        booking_id: bookingId,
        paypal_order_id: paypalOrderId,
        paypal_capture_id: captureId
    });
    return response.data;
}

/**
 * Verifica stato pagamento
 */
export async function getPaymentStatus(bookingId: string) {
    const response = await api.get(`/payment/status/${bookingId}`);
    return response.data;
}

// === UTILITY FUNCTIONS ===

/**
 * Gestione errori API consistente
 */
export function handleApiError(error: any): string {
    if (error.response?.data?.error) {
        return error.response.data.error;
    }
    
    if (error.response?.data?.message) {
        return error.response.data.message;
    }
    
    if (error.message) {
        return error.message;
    }
    
    return 'Si è verificato un errore. Riprova più tardi.';
}

/**
 * Formatta data per l'API (YYYY-MM-DD)
 */
export function formatDateForApi(date: Date): string {
    return date.toISOString().split('T')[0];
}

/**
 * Converte date string in oggetti Date
 */
export function parseApiDate(dateString: string): Date {
    return new Date(dateString + 'T00:00:00.000Z');
}

export default api;