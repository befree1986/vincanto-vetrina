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
    check_in_date: string;
    check_out_date: string;
    num_adults: number;
    num_children: number;
    children_ages?: number[];
    parking_option: 'none' | 'street' | 'private';
}

export interface BookingQuoteResponse {
    success: boolean;
    costs: {
        nights: number;
        base_price: number;
        parking_cost: number;
        cleaning_fee: number;
        tourist_tax: number;
        total_amount: number;
        deposit_amount: number;
        [key: string]: any;
    };
    quote_valid_until: string;
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
    // Usa endpoint di test temporaneamente fino a configurazione database
    const response = await api.post('/booking/quote-test', data);
    return response.data;
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
    const response = await api.get('/availability/check', {
        params: data
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
    
    const response = await api.get('/availability/calendar', { params });
    return response.data;
}

/**
 * Trova prossime date disponibili
 */
export async function getNextAvailableDates(nights: number = 2, fromDate?: string) {
    const params: any = { nights };
    if (fromDate) params.from_date = fromDate;
    
    const response = await api.get('/availability/next-available', { params });
    return response.data;
}

// === PAYMENT API ===

export interface StripePaymentIntentRequest {
    booking_id: string;
    amount: number;
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
    const response = await api.post('/payment/create-intent', data);
    return response.data;
}

/**
 * Conferma pagamento Stripe
 */
export async function confirmStripePayment(paymentIntentId: string) {
    const response = await api.post('/payment/confirm-stripe', {
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