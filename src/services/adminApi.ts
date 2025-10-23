/**
 * API Service per pannello admin
 * Gestisce comunicazione tra frontend admin e backend
 */

import axios from 'axios';

const API_BASE_URL = '/api/admin';

// Configurazione Axios per admin
const adminApi = axios.create({
    baseURL: API_BASE_URL,
    timeout: 30000,
    headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer superadmin-token'
    },
});

// Interceptors per log
adminApi.interceptors.request.use(
    (config) => {
        console.log(`🔗 Admin API Request: ${config.method?.toUpperCase()} ${config.url}`);
        return config;
    },
    (error) => {
        console.error('❌ Admin API Request Error:', error);
        return Promise.reject(error);
    }
);

adminApi.interceptors.response.use(
    (response) => {
        console.log(`✅ Admin API Response: ${response.status} ${response.config.url}`);
        return response;
    },
    (error) => {
        console.error('❌ Admin API Response Error:', error.response?.data || error.message);
        return Promise.reject(error);
    }
);

// === CALENDARI ===

export interface Calendar {
    id: string;
    name: string;
    platform: string;
    url: string;
    active: boolean;
    lastSync: string;
    createdAt: string;
}

export async function getCalendars(): Promise<Calendar[]> {
    const response = await adminApi.get('/calendars');
    return response.data.calendars;
}

export async function createCalendar(calendar: Omit<Calendar, 'id' | 'lastSync' | 'createdAt'>): Promise<Calendar> {
    const response = await adminApi.post('/calendars', calendar);
    return response.data.calendar;
}

export async function updateCalendar(id: string, updates: Partial<Calendar>): Promise<Calendar> {
    const response = await adminApi.put(`/calendars?id=${id}`, updates);
    return response.data.calendar;
}

export async function deleteCalendar(id: string): Promise<void> {
    await adminApi.delete(`/calendars?id=${id}`);
}

export async function syncCalendar(id: string): Promise<Calendar> {
    const response = await adminApi.put(`/calendars?id=${id}`, { 
        lastSync: new Date().toISOString() 
    });
    return response.data.calendar;
}

// === DATE BLOCCATE ===

export interface BlockedDate {
    id: string;
    startDate: string;
    endDate: string;
    type: 'booking' | 'maintenance' | 'unavailable';
    source: string;
    guestName?: string;
    reason?: string;
    status: string;
    createdAt: string;
}

export async function getBlockedDates(filters?: {
    startDate?: string;
    endDate?: string;
    type?: string;
}): Promise<BlockedDate[]> {
    const params = new URLSearchParams();
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);
    if (filters?.type) params.append('type', filters.type);
    
    const response = await adminApi.get(`/blocked-dates?${params.toString()}`);
    return response.data.blockedDates;
}

export async function createBlockedDate(blockedDate: Omit<BlockedDate, 'id' | 'createdAt'>): Promise<BlockedDate> {
    const response = await adminApi.post('/blocked-dates', blockedDate);
    return response.data.blockedDate;
}

export async function updateBlockedDate(id: string, updates: Partial<BlockedDate>): Promise<BlockedDate> {
    const response = await adminApi.put(`/blocked-dates?id=${id}`, updates);
    return response.data.blockedDate;
}

export async function deleteBlockedDate(id: string): Promise<void> {
    await adminApi.delete(`/blocked-dates?id=${id}`);
}

// === CONFIGURAZIONE SISTEMA ===

export interface SystemConfig {
    pricing: {
        basePrice: number;
        additionalGuestPrice: number;
        cleaningFee: number;
        parkingFeePerNight: number;
        touristTaxPerPersonPerNight: number;
        minimumNights: number;
        depositPercentage: number;
        currency: string;
    };
    payments: {
        stripe: {
            enabled: boolean;
            publicKey: string;
            secretKey: string;
        };
        paypal: {
            enabled: boolean;
            clientId: string;
            clientSecret: string;
        };
        bankTransfer: {
            enabled: boolean;
            iban: string;
            bankName: string;
            accountHolder: string;
        };
    };
    apis: {
        google: {
            calendarApiKey: string;
            enabled: boolean;
        };
        airbnb: {
            apiKey: string;
            enabled: boolean;
        };
        booking: {
            apiKey: string;
            enabled: boolean;
        };
        email: {
            smtpHost: string;
            smtpPort: number;
            smtpUser: string;
            smtpPassword: string;
            enabled: boolean;
        };
    };
    notifications: {
        emailNotifications: boolean;
        smsNotifications: boolean;
        webhookUrl: string;
        adminEmail: string;
    };
    features: {
        autoSync: boolean;
        realTimeUpdates: boolean;
        multiLanguage: boolean;
        analytics: boolean;
        backupEnabled: boolean;
        debugMode: boolean;
    };
}

export async function getSystemConfig(section?: string): Promise<SystemConfig | any> {
    const params = section ? `?section=${section}` : '';
    const response = await adminApi.get(`/config${params}`);
    return response.data.config;
}

export async function updateSystemConfig(section: string, data: any): Promise<any> {
    const response = await adminApi.put('/config', { section, data });
    return response.data.config;
}

export async function testConfiguration(type: string, config: any): Promise<any> {
    const response = await adminApi.post('/config', { type, config });
    return response.data;
}

// === PRENOTAZIONI ===

export interface Booking {
    id: string;
    guestName: string;
    guestEmail: string;
    checkIn: string;
    checkOut: string;
    status: 'pending' | 'confirmed' | 'cancelled';
    amount: number;
    source: string;
    createdAt: string;
}

export async function getBookings(filters?: {
    status?: string;
    startDate?: string;
    endDate?: string;
}): Promise<Booking[]> {
    // Implementazione futura - per ora usa dati mock
    return [
        {
            id: '1',
            guestName: 'Mario Rossi',
            guestEmail: 'mario@example.com',
            checkIn: '2025-11-15',
            checkOut: '2025-11-18',
            status: 'confirmed',
            amount: 450.00,
            source: 'direct',
            createdAt: '2025-10-20T00:00:00Z'
        },
        {
            id: '2',
            guestName: 'Laura Bianchi',
            guestEmail: 'laura@example.com',
            checkIn: '2025-12-01',
            checkOut: '2025-12-05',
            status: 'pending',
            amount: 680.00,
            source: 'airbnb',
            createdAt: '2025-10-21T00:00:00Z'
        }
    ];
}

export async function updateBookingStatus(id: string, status: 'pending' | 'confirmed' | 'cancelled'): Promise<Booking> {
    // Implementazione futura - per ora simula aggiornamento
    console.log(`Aggiornamento stato prenotazione ${id} a ${status}`);
    
    // Simula risposta
    return {
        id,
        guestName: 'Mock Guest',
        guestEmail: 'mock@example.com',
        checkIn: '2025-11-01',
        checkOut: '2025-11-03',
        status,
        amount: 300,
        source: 'direct',
        createdAt: new Date().toISOString()
    };
}

// === UTILITIES ===

export function handleApiError(error: any): string {
    if (error.response) {
        return error.response.data?.error || `Errore HTTP ${error.response.status}`;
    } else if (error.request) {
        return 'Errore di connessione al server';
    } else {
        return error.message || 'Errore sconosciuto';
    }
}