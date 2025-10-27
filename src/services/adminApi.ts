// Servizio API per pannelli Admin
import axios from 'axios';

const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? '/api'  // Usa path relativo su Vercel
  : 'http://localhost:3000/api';

const adminApi = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
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
  checkIn: string;
  checkOut: string;
  status: 'confirmed' | 'pending' | 'cancelled';
  totalAmount: number;
  depositAmount: number;
  guests: number;
  includeParking: boolean;
  created: string;
  notes: string;
}

export interface AdminCalendar {
  id: string;
  name: string;
  platform: string;
  url: string;
  isActive: boolean;
  lastSync: string;
  syncStatus: 'success' | 'error' | 'manual';
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
  touristTaxPerPersonPerNight: number;
  minimumNights: number;
  depositPercentage: number;
  currency: string;
  seasonalPricing?: SeasonalPricing[];
}

export interface SeasonalPricing {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  multiplier: number;
}

export interface AdminNotification {
  id: string;
  type: 'booking' | 'payment' | 'calendar' | 'system';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
}

// === API FUNCTIONS ===

export const getDashboardStats = async (): Promise<DashboardStats> => {
  try {
    const response = await adminApi.get('/admin?action=dashboard-stats');
    return response.data.stats;
  } catch (error) {
    console.error('Errore caricamento statistiche:', error);
    throw error;
  }
};

export const getBookings = async (): Promise<AdminBooking[]> => {
  try {
    const response = await adminApi.get('/admin?action=bookings');
    return response.data.bookings;
  } catch (error) {
    console.error('Errore caricamento prenotazioni:', error);
    throw error;
  }
};

export const createBooking = async (booking: Partial<AdminBooking>): Promise<string> => {
  try {
    const response = await adminApi.post('/admin?action=bookings', booking);
    return response.data.bookingId;
  } catch (error) {
    console.error('Errore creazione prenotazione:', error);
    throw error;
  }
};

export const getCalendars = async (): Promise<AdminCalendar[]> => {
  try {
    const response = await adminApi.get('/admin?action=calendars');
    return response.data.calendars;
  } catch (error) {
    console.error('Errore caricamento calendari:', error);
    throw error;
  }
};

export const addCalendar = async (calendar: Partial<AdminCalendar>): Promise<string> => {
  try {
    const response = await adminApi.post('/admin?action=calendars', calendar);
    return response.data.calendarId;
  } catch (error) {
    console.error('Errore aggiunta calendario:', error);
    throw error;
  }
};

export const syncCalendar = async (calendarId: string): Promise<string> => {
  try {
    const response = await adminApi.post('/admin?action=sync-calendar', { calendarId });
    return response.data.syncId;
  } catch (error) {
    console.error('Errore sincronizzazione calendario:', error);
    throw error;
  }
};

export const getBlockedDates = async (): Promise<BlockedDate[]> => {
  try {
    const response = await adminApi.get('/admin?action=blocked-dates');
    return response.data.blockedDates;
  } catch (error) {
    console.error('Errore caricamento date bloccate:', error);
    throw error;
  }
};

export const addBlockedDate = async (date: string, reason: string, type: string): Promise<string> => {
  try {
    const response = await adminApi.post('/admin?action=blocked-dates', { date, reason, type });
    return response.data.id;
  } catch (error) {
    console.error('Errore aggiunta data bloccata:', error);
    throw error;
  }
};

export const getPricingConfig = async (): Promise<PricingConfig> => {
  try {
    const response = await adminApi.get('/admin?action=pricing-config');
    return response.data.config;
  } catch (error) {
    console.error('Errore caricamento configurazione prezzi:', error);
    throw error;
  }
};

export const updatePricingConfig = async (config: PricingConfig): Promise<void> => {
  try {
    await adminApi.post('/admin?action=pricing-config', config);
  } catch (error) {
    console.error('Errore aggiornamento configurazione prezzi:', error);
    throw error;
  }
};

export const getNotifications = async (): Promise<{ notifications: AdminNotification[], unreadCount: number }> => {
  try {
    const response = await adminApi.get('/admin?action=notifications');
    return {
      notifications: response.data.notifications,
      unreadCount: response.data.unreadCount
    };
  } catch (error) {
    console.error('Errore caricamento notifiche:', error);
    throw error;
  }
};

export const markNotificationAsRead = async (notificationId: string): Promise<void> => {
  try {
    await adminApi.post('/admin?action=notifications', { notificationId });
  } catch (error) {
    console.error('Errore aggiornamento notifica:', error);
    throw error;
  }
};

export const getAnalytics = async (period: string = '30d') => {
  try {
    const response = await adminApi.get(`/admin?action=analytics&period=${period}`);
    return response.data.analytics;
  } catch (error) {
    console.error('Errore caricamento analytics:', error);
    throw error;
  }
};

export const exportData = async (type: 'bookings' | 'analytics' | 'all') => {
  try {
    const response = await adminApi.post('/admin?action=export-data', { type });
    return response.data;
  } catch (error) {
    console.error('Errore export dati:', error);
    throw error;
  }
};