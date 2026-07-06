import axios from 'axios';

// Base URL: usa variabile d'ambiente se presente, altrimenti fallback a '/api'
// In dev puoi impostare VITE_API_BASE_URL all'URL di produzione per evitare 404 locali
const API_BASE_URL = import.meta.env.DEV && import.meta.env.VITE_API_BASE_URL ? import.meta.env.VITE_API_BASE_URL : '/api';

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
    adults?: number;
    children?: number;
    childrenAges?: number[];
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
    total_amount?: number;
    status?: 'draft' | 'pending' | 'confirmed'; // ⚡ Allow setting initial status
    extra_services?: { id?: number; name: string; price?: number; included?: boolean }[];
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
        // USA API UNIFICATA - Cambio da /quote a /unified?action=quote
        const response = await api.get('/unified', {
            params: {
                action: 'quote',
                checkIn: data.checkIn,
                checkOut: data.checkOut,
                guests: data.guests,
                adults: data.adults || data.guests, // Fallback per compatibilità
                children: data.children || 0,
                childrenAges: data.childrenAges ? data.childrenAges.join(',') : '', // Invia età bambini come stringa separata da virgole
                includeParking: data.includeParking || false
            }
        });
        
        console.log('📦 API quote response:', response.data);
        
        // Il nuovo backend API unificata restituisce { success: true, quote: {...}, breakdown: {...} }
        if (!response.data.success || !response.data.quote) {
            throw new Error('Invalid API response format');
        }
        
        const quote = response.data.quote;
        
        // Trasforma la risposta API unificata per il frontend
        const transformedCosts: BookingQuoteResponse = {
            nights: quote.nights,
            guests: quote.guests,
            basePrice: quote.basePrice,
            parkingCost: quote.parkingCost || 0,
            cleaningFee: quote.cleaningFee,
            touristTax: quote.touristTax,
            subtotal: quote.discountedAccommodation + quote.cleaningFee,
            totalAmount: quote.totalAmount,
            depositAmount: quote.depositAmount,
            depositPercentage: 0.20,
            currency: 'EUR',
            pricingConfig: {
                basePrice: quote.basePrice,
                additionalGuestPrice: 0,
                minimumNights: 2
            }
        };
        
        console.log('✨ Transformed quote for frontend:', transformedCosts);
        return transformedCosts;
        
    } catch (error) {
        console.error('❌ Errore richiesta preventivo:', error);
        throw new Error('Servizio preventivi non disponibile. Riprova più tardi.');
    }
}

/**
 * Crea una nuova prenotazione
 */
export async function createBooking(data: CreateBookingRequest): Promise<CreateBookingResponse> {
    // 🔧 Adatta i dati per l'API backend
    const adaptedData = {
        customerName: `${data.guest_name} ${data.guest_surname}`,
        customerEmail: data.guest_email,
        customerPhone: data.guest_phone,
        checkin: data.check_in_date,
        checkout: data.check_out_date,
        guests: data.num_adults + data.num_children,
        adults: data.num_adults,
        children: data.num_children,
        childrenAges: data.children_ages?.join(',') || '',
        parkingOption: data.parking_option,
        paymentMethod: data.payment_method,
        paymentType: data.payment_type,
        specialRequests: data.guest_message || '',
        totalPrice: data.total_amount || 0,
        status: data.status || 'pending', // ⚡ Pass status if provided
        // 🛎️ Passa eventuali servizi extra selezionati al backend unificato
        extraServices: Array.isArray(data.extra_services) ? data.extra_services.map(s => ({
            id: s.id,
            name: s.name,
            price: typeof s.price === 'number' ? s.price : Number(s.price || 0),
            included: !!s.included
        })) : []
    };
    
    const response = await api.post('/unified?action=booking', adaptedData);
    return response.data;
}

/**
 * Cancella un booking (usato quando pagamento fallisce)
 */
export async function cancelBooking(bookingId: string, reason?: string): Promise<{ success: boolean; message: string }> {
    const response = await api.post('/unified?action=cancel-booking', {
        bookingId,
        reason: reason || 'Pagamento annullato o fallito'
    });
    return response.data;
}

/**
 * Aggiorna lo status di una prenotazione dopo pagamento
 */
export async function updateBookingStatus(bookingId: string, status: 'confirmed' | 'cancelled', paymentData?: {
    payment_id?: string;
    payment_status?: string;
    amount_paid?: number;
    extra_services?: { id?: number; name: string; price?: number; included?: boolean }[];
    language?: string;
}): Promise<{ success: boolean; message: string }> {
    const response = await api.post('/unified', {
        action: 'update-booking-status',
        booking_id: bookingId,
        status: status,
        language: paymentData?.language,
        ...paymentData
    });
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
    const params: any = {};
    if (startDate) params.start_date = startDate;
    if (endDate) params.end_date = endDate;
    
    // Carica date bloccate, prenotazioni E calendar_events sincronizzati
    const [blockedResponse, bookingsResponse, calendarEventsResponse] = await Promise.all([
        api.get('/unified', { params: { ...params, action: 'blocked-dates' } }),
        api.get('/unified', { params: { ...params, action: 'booking' } }),
        api.get('/unified', { params: { ...params, action: 'calendar-events' } })
    ]);
    
    const blockedData = blockedResponse.data;
    const bookingsData = bookingsResponse.data;
    const calendarEventsData = calendarEventsResponse.data;
    
    // Trasforma blockedDates in occupied_dates
    const blocked_dates = (blockedData.blockedDates || []).map((blocked: any) => ({
        start: blocked.start_date,
        end: blocked.end_date,
        type: 'blocked' as const,
        status: blocked.reason || 'blocked'
    }));
    
    // Trasforma bookings in occupied_dates
    const booking_dates = (bookingsData.bookings || []).map((booking: any) => ({
        start: booking.check_in.split('T')[0],
        end: booking.check_out.split('T')[0], 
        type: 'booking' as const,
        status: booking.status || 'booked'
    }));
    
    // 🆕 Trasforma calendar_events (Airbnb, Booking, Holidu) in occupied_dates
    const calendar_event_dates = (calendarEventsData.events || []).map((event: any) => ({
        start: event.start_date.split('T')[0],
        end: event.end_date.split('T')[0],
        type: 'booking' as const,
        status: `${event.calendar_source}-synced` // es: 'airbnb-synced', 'booking-synced'
    }));
    
    console.log('📅 Date occupate caricate:', {
        blocked: blocked_dates.length,
        bookings: booking_dates.length,
        calendar_events: calendar_event_dates.length,
        total: blocked_dates.length + booking_dates.length + calendar_event_dates.length
    });
    
    // Combina TUTTE le date occupate inclusi i calendar_events
    const occupied_dates = [...blocked_dates, ...booking_dates, ...calendar_event_dates];
    
    return {
        success: blockedData.success && bookingsData.success,
        period: {
            start: startDate || new Date().toISOString().split('T')[0],
            end: endDate || new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        },
        occupied_dates
    };
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
    // ⚡ Validazione amount
    if (!data.amount || isNaN(data.amount) || data.amount <= 0) {
        throw new Error(`Amount non valido: ${data.amount}`);
    }
    
    const response = await api.post('/unified', {
        action: 'stripe-payment-intent',
        booking_id: data.booking_id,
        amount: data.amount,
        currency: 'eur', // ⚡ Fix: currency obbligatorio
        customer_email: data.customer_email || '',
        customer_name: data.customer_name || ''
    });
    return response.data;
}

/**
 * Conferma pagamento Stripe
 */
export async function confirmStripePayment(paymentIntentId: string) {
    const response = await api.post('/unified', {
        action: 'stripe-confirm-payment',
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