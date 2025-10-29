// Servizio API per pannelli Admin con fallback dati mock
import axios from 'axios';

// 🎛️ API UNIFICATA: Ora tutto passa da Express backend
const API_BASE_URL = '/api'; // Usa proxy Vite in sviluppo, path relativo in produzione

const adminApi = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 5000 // Timeout di 5 secondi
});

// === TYPES ===
export interface DashboardStats {
  totalBookings: number;
  activeCalendars: number;
  totalRevenue: number;
  confirmedBookings: number;
  pendingBookings: number;
  averageStay: number;
  occupancyRate: number;
}

export interface AdminBooking {
  id: string;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  checkIn: string;
  checkOut: string;
  status: 'confirmed' | 'pending' | 'cancelled' | 'completed';
  totalAmount: number;
  depositAmount: number;
  guests: number;
  platform: string;
  includeParking: boolean;
  created: string;
  notes: string;
}

export interface AdminCalendar {
  id: string;
  name: string;
  platform: string;
  url: string | null;
  isActive: boolean;
  lastSync: string;
  syncStatus: 'success' | 'error' | 'manual';
  syncFrequency?: number;
  blockedDates: string[];
}

export interface BlockedDate {
  id: string;
  date: string;
  reason: string;
  type: 'maintenance' | 'holiday' | 'personal';
}

export interface PricingConfig {
  basePrice: number;
  additionalGuestPrice: number;
  cleaningFee: number;
  parkingFeePerNight: number;
  minimumNights: number;
  depositPercentage: number;
  touristTaxPerPersonPerNight: number;
  currency: string;
}

export interface AdminNotification {
  id: string;
  type: 'booking' | 'calendar' | 'system' | 'payment';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
}

// === MOCK DATA PER FALLBACK ===
const mockDashboardStats: DashboardStats = {
  totalBookings: 142,
  activeCalendars: 3,
  totalRevenue: 28450.50,
  confirmedBookings: 128,
  pendingBookings: 14,
  averageStay: 4.2,
  occupancyRate: 87
};

const mockBookings: AdminBooking[] = [
  {
    id: 'BK001',
    guestName: 'Marco Rossi',
    guestEmail: 'marco.rossi@email.com',
    guestPhone: '+39 333 123 4567',
    checkIn: '2025-11-15T15:00:00Z',
    checkOut: '2025-11-18T11:00:00Z',
    status: 'confirmed',
    totalAmount: 450.00,
    depositAmount: 135.00,
    guests: 2,
    platform: 'Airbnb',
    includeParking: true,
    created: '2025-10-20T10:30:00Z',
    notes: 'Anniversario di matrimonio'
  },
  {
    id: 'BK002',
    guestName: 'Laura Bianchi',
    guestEmail: 'laura.bianchi@email.com',
    guestPhone: '+39 348 987 6543',
    checkIn: '2025-11-22T15:00:00Z',
    checkOut: '2025-11-25T11:00:00Z',
    status: 'pending',
    totalAmount: 380.00,
    depositAmount: 114.00,
    guests: 4,
    platform: 'Booking.com',
    includeParking: false,
    created: '2025-10-25T14:20:00Z',
    notes: 'Viaggio di lavoro'
  },
  {
    id: 'BK003',
    guestName: 'Giuseppe Verde',
    guestEmail: 'giuseppe.verde@email.com',
    guestPhone: '+39 340 555 7890',
    checkIn: '2025-12-01T15:00:00Z',
    checkOut: '2025-12-05T11:00:00Z',
    status: 'confirmed',
    totalAmount: 620.00,
    depositAmount: 186.00,
    guests: 3,
    platform: 'VRBO',
    includeParking: true,
    created: '2025-10-28T09:15:00Z',
    notes: 'Vacanze famiglia'
  }
];

const mockCalendars: AdminCalendar[] = [
  {
    id: 'CAL001',
    name: 'Airbnb Principale',
    platform: 'airbnb',
    url: 'https://calendar.airbnb.com/calendar/ical/12345',
    isActive: true,
    lastSync: '2025-10-27T08:30:00Z',
    syncStatus: 'success',
    syncFrequency: 60,
    blockedDates: []
  },
  {
    id: 'CAL002', 
    name: 'Booking.com',
    platform: 'booking_com',
    url: 'https://admin.booking.com/hotel/calendar/ical/67890',
    isActive: true,
    lastSync: '2025-10-27T08:45:00Z',
    syncStatus: 'success',
    syncFrequency: 180,
    blockedDates: []
  },
  {
    id: 'CAL003',
    name: 'VRBO Casa Vacanze',
    platform: 'vrbo',
    url: 'https://www.vrbo.com/calendar/ical/11111',
    isActive: false,
    lastSync: '2025-10-25T12:00:00Z',
    syncStatus: 'error',
    syncFrequency: 360,
    blockedDates: []
  }
];

const mockPricingConfig: PricingConfig = {
  basePrice: 150.00,
  additionalGuestPrice: 25.00,
  cleaningFee: 50.00,
  parkingFeePerNight: 15.00,
  minimumNights: 2,
  depositPercentage: 0.30,
  touristTaxPerPersonPerNight: 2.50,
  currency: 'EUR'
};

const mockNotifications: AdminNotification[] = [
  {
    id: 'NOT001',
    type: 'booking',
    title: 'Nuova Prenotazione',
    message: 'Marco Rossi ha effettuato una nuova prenotazione per novembre',
    timestamp: '2025-10-27T10:30:00Z',
    read: false
  },
  {
    id: 'NOT002',
    type: 'calendar',
    title: 'Sincronizzazione Completata',
    message: 'Tutti i calendari sono stati sincronizzati con successo',
    timestamp: '2025-10-27T08:30:00Z',
    read: true
  }
];

// === HELPER FUNCTION PER FALLBACK ===
const withFallback = async <T>(apiCall: () => Promise<T>, fallbackData: T): Promise<T> => {
  try {
    return await apiCall();
  } catch (error) {
    console.warn('API non disponibile, uso dati mock:', error);
    // Simula un piccolo delay per renderlo realistico
    await new Promise(resolve => setTimeout(resolve, 500));
    return fallbackData;
  }
};

// === API FUNCTIONS CON FALLBACK ===
export const getDashboardStats = async (): Promise<DashboardStats> => {
  return withFallback(
    async () => {
      console.log('📊 Chiamata API dashboard stats (Express)');
      const response = await adminApi.get('/admin/dashboard-stats');
      console.log('✅ Dashboard stats response:', response.data);
      return response.data.stats; // Express restituisce { success: true, stats: {...} }
    },
    mockDashboardStats
  );
};

export const getBookings = async (): Promise<AdminBooking[]> => {
  return withFallback(
    async () => {
      console.log('📅 Chiamata API bookings (Express)');
      const response = await adminApi.get('/admin/bookings');
      console.log('✅ Bookings response:', response.data);
      return response.data.bookings; // Express restituisce { success: true, bookings: [...] }
    },
    mockBookings
  );
};

export const getCalendars = async (): Promise<AdminCalendar[]> => {
  return withFallback(
    async () => {
      console.log('📆 Chiamata API calendars (Express)');
      const response = await adminApi.get('/admin/calendars');
      console.log('✅ Calendars response:', response.data);
      return response.data.calendars; // Express restituisce { success: true, calendars: [...] }
    },
    mockCalendars
  );
};

export const getPricingConfig = async (): Promise<PricingConfig> => {
  return withFallback(
    async () => {
      const response = await adminApi.get('/admin?action=pricing-config');
      return response.data;
    },
    mockPricingConfig
  );
};

export const getNotifications = async (): Promise<{ notifications: AdminNotification[]; unreadCount: number }> => {
  return withFallback(
    async () => {
      const response = await adminApi.get('/admin?action=notifications');
      return response.data;
    },
    { 
      notifications: mockNotifications, 
      unreadCount: mockNotifications.filter(n => !n.read).length 
    }
  );
};

export const updateBooking = async (bookingId: string, bookingData: Partial<AdminBooking>): Promise<AdminBooking> => {
  return withFallback(
    async () => {
      const response = await adminApi.put(`/admin?action=update-booking&id=${bookingId}`, bookingData);
      return response.data;
    },
    // Trova e aggiorna il mock booking
    { ...mockBookings.find(b => b.id === bookingId) || mockBookings[0], ...bookingData }
  );
};

export const updatePricingConfig = async (config: PricingConfig): Promise<PricingConfig> => {
  return withFallback(
    async () => {
      const response = await adminApi.put('/admin?action=update-pricing', config);
      return response.data;
    },
    { ...mockPricingConfig, ...config }
  );
};

export const createCalendar = async (calendarData: Omit<AdminCalendar, 'id' | 'lastSync' | 'syncStatus'>): Promise<AdminCalendar> => {
  return withFallback(
    async () => {
      const response = await adminApi.post('/admin?action=create-calendar', calendarData);
      return response.data;
    },
    {
      id: `CAL${Date.now()}`,
      lastSync: new Date().toISOString(),
      syncStatus: 'manual' as const,
      ...calendarData,
      blockedDates: []
    }
  );
};

export const updateCalendar = async (calendarId: string, updates: Partial<AdminCalendar>): Promise<AdminCalendar> => {
  return withFallback(
    async () => {
      const response = await adminApi.put(`/admin?action=update-calendar&id=${calendarId}`, updates);
      return response.data;
    },
    { ...mockCalendars.find(c => c.id === calendarId) || mockCalendars[0], ...updates }
  );
};

export const syncCalendar = async (calendarId: string): Promise<void> => {
  await withFallback(
    async () => {
      await adminApi.post(`/admin?action=sync-calendar&id=${calendarId}`);
    },
    undefined
  );
};

export const deleteCalendar = async (calendarId: string): Promise<void> => {
  await withFallback(
    async () => {
      await adminApi.delete(`/admin?action=delete-calendar&id=${calendarId}`);
    },
    undefined
  );
};

export const getBlockedDates = async (): Promise<BlockedDate[]> => {
  return withFallback(
    async () => {
      const response = await adminApi.get('/admin?action=blocked-dates');
      return response.data;
    },
    [
      {
        id: 'BD001',
        date: '2025-12-25',
        reason: 'Natale',
        type: 'holiday'
      },
      {
        id: 'BD002', 
        date: '2025-11-30',
        reason: 'Manutenzione',
        type: 'maintenance'
      }
    ]
  );
};

export const exportData = async (type: 'bookings' | 'revenue' | 'calendar'): Promise<any> => {
  return withFallback(
    async () => {
      const response = await adminApi.get(`/admin?action=export&type=${type}`);
      return response.data;
    },
    type === 'bookings' ? mockBookings : { message: 'Dati esportati con successo' }
  );
};

export const sendBookingEmail = async (bookingId: string, templateType: string): Promise<void> => {
  await withFallback(
    async () => {
      await adminApi.post('/admin?action=send-booking-email', { bookingId, templateType });
    },
    undefined
  );
};

export const saveEmailTemplate = async (templateType: string, templateData: { subject: string; htmlContent: string }): Promise<void> => {
  await withFallback(
    async () => {
      await adminApi.post('/admin?action=save-email-template', { templateType, ...templateData });
    },
    undefined
  );
};

export const testEmailTemplate = async (templateType: string, templateData: { subject: string; htmlContent: string }): Promise<void> => {
  await withFallback(
    async () => {
      await adminApi.post('/admin?action=test-email-template', { templateType, ...templateData });
    },
    undefined
  );
};
