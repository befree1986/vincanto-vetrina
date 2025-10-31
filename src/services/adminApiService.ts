// AdminApiService - Collegamento alle API Backend Admin
class AdminApiService {
  private readonly baseUrl: string;

  constructor() {
    // 🎯 PRODUZIONE VERCEL - CONFIGURAZIONE PULITA
    this.baseUrl = import.meta.env.VITE_API_BASE_URL || 'https://vincanto-vetrina.vercel.app/api';
    console.log('🎯 AdminApiService PRODUZIONE:', this.baseUrl);
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    try {
      const url = `${this.baseUrl}/admin?action=${endpoint}`;
      console.log('🌐 API Request:', url);
      
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('✅ API Response:', endpoint, data);
      return data;
    } catch (error) {
      console.error('❌ API Error:', endpoint, error);
      throw error;
    }
  }

  // Dashboard Statistics
  async getDashboardStats() {
    try {
      const data = await this.request('dashboard-stats');
      return data.stats || {};
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      // Fallback data
      return {
        totalBookings: 0,
        totalRevenue: 0,
        occupancyRate: 0,
        pendingPayments: 0
      };
    }
  }

  // Bookings Management
  async getBookings() {
    try {
      const data = await this.request('bookings');
      return data.bookings || [];
    } catch (error) {
      console.error('Error fetching bookings:', error);
      return [];
    }
  }

  async createBooking(bookingData: any) {
    // Mappa i dati frontend ai campi backend corretti
    const mappedData = {
      guestName: bookingData.customer_name || '',
      guestEmail: bookingData.customer_email || '',
      guestPhone: bookingData.customer_phone || '',
      checkIn: bookingData.check_in || '',
      checkOut: bookingData.check_out || '', 
      guests: bookingData.guests || 1,
      totalAmount: bookingData.total_amount || 0,
      depositAmount: bookingData.deposit_amount || 0,
      notes: bookingData.notes || ''
    };

    try {
      const response = await fetch(`${this.baseUrl}/admin?action=bookings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mappedData),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error('Error creating booking:', error);
      return { success: false, message: 'Errore creazione prenotazione' };
    }
  }

  async updateBooking(id: string, updates: any) {
    try {
      console.log('🔄 Aggiornamento prenotazione simulato per ID:', id);
      // TODO: Implementare quando avremo l'endpoint
      return { success: true, message: 'Prenotazione aggiornata (simulato)' };
    } catch (error) {
      console.error('Error updating booking:', error);
      return { success: false, message: 'Errore aggiornamento prenotazione' };
    }
  }

  async deleteBooking(id: string) {
    try {
      console.log('🗑️ Eliminazione prenotazione simulata per ID:', id);
      // TODO: Implementare quando avremo l'endpoint
      return { success: true, message: 'Prenotazione eliminata (simulato)' };
    } catch (error) {
      console.error('Error deleting booking:', error);
      return { success: false, message: 'Errore eliminazione prenotazione' };
    }
  }

  // Pricing Management
  async getPricingConfig() {
    try {
      const data = await this.request('pricing-config');
      return data.config || {};
    } catch (error) {
      console.error('Error fetching pricing config:', error);
      return { success: false, data: [] };
    }
  }

  async updatePricingConfig(pricingData: any) {
    try {
      const response = await fetch(`${this.baseUrl}/admin?action=pricing-config`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pricingData),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error('Error updating pricing config:', error);
      return { success: false, message: 'Errore aggiornamento prezzi' };
    }
  }

  async createPricingConfig(pricingData: any) {
    try {
      const response = await fetch(`${this.baseUrl}/pricing`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pricingData),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error('Error creating pricing config:', error);
      return { success: false, message: 'Errore creazione configurazione prezzi' };
    }
  }

  // Calendar Management
  async getCalendarData() {
    try {
      const data = await this.request('calendars');
      return data.calendars || [];
    } catch (error) {
      console.error('Error fetching calendar data:', error);
      return [];
    }
  }

  async getBlockedDates() {
    try {
      const data = await this.request('blocked-dates');
      return data.blockedDates || [];
    } catch (error) {
      console.error('Error fetching blocked dates:', error);
      return [];
    }
  }

  async addBlockedDate(dateData: any) {
    return this.request('blocked-dates', {
      method: 'POST',
      body: JSON.stringify(dateData),
    });
  }

  async removeBlockedDate(id: string) {
    return this.request(`blocked-dates/${id}`, {
      method: 'DELETE',
    });
  }

  // Pricing Configuration (usando endpoint /pricing diretto)

  // Notifications Management
  async getNotifications() {
    try {
      const data = await this.request('notifications');
      return data.notifications || [];
    } catch (error) {
      console.error('Error fetching notifications:', error);
      return [];
    }
  }

  async markNotificationRead(id: string) {
    return this.request(`notifications/${id}/read`, {
      method: 'POST',
    });
  }

  async deleteNotification(id: string) {
    return this.request(`notifications/${id}`, {
      method: 'DELETE',
    });
  }

  // Analytics
  async getAnalytics(period: string = '30d') {
    try {
      const data = await this.request('analytics');
      return data.analytics || [];
    } catch (error) {
      console.error('Error fetching analytics:', error);
      return [];
    }
  }

  // System Settings
  async getSystemSettings() {
    try {
      const data = await this.request('settings');
      return data.settings || [];
    } catch (error) {
      console.error('Error fetching system settings:', error);
      return [];
    }
  }

  async updateSystemSetting(key: string, value: any) {
    return this.request('settings', {
      method: 'PUT',
      body: JSON.stringify({ key, value }),
    });
  }

  // Health Check
  async healthCheck() {
    try {
      const response = await fetch(`https://vincanto-vetrina.vercel.app/api/admin?action=database-status`);
      const data = await response.json();
      return data.success || false;
    } catch {
      return false;
    }
  }

  // Quote API
  async getQuote(checkIn: string, checkOut: string, guests: number) {
    try {
      const url = `https://vincanto-vetrina.vercel.app/api/quote?checkIn=${checkIn}&checkOut=${checkOut}&guests=${guests}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error('Quote API error');
      return await response.json();
    } catch (error) {
      console.error('Error getting quote:', error);
      throw error;
    }
  }

  // === CALENDAR MANAGEMENT API ===
  
  // Ottieni configurazioni calendario
  async getCalendarConfigs() {
    try {
      const data = await this.request('calendars');
      console.log('📅 Calendar configs:', data);
      return data;
    } catch (error) {
      console.error('❌ Error fetching calendar configs:', error);
      return { calendars: [], stats: {} };
    }
  }

  // Crea nuova configurazione calendario
  async createCalendarConfig(config: any) {
    try {
      const response = await fetch(`${this.baseUrl}/admin?action=calendars`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      return await response.json();
    } catch (error) {
      console.error('❌ Error creating calendar config:', error);
      throw error;
    }
  }

  // Sincronizza calendario
  async syncCalendar(calendarId: string) {
    try {
      const response = await fetch(`https://vincanto-vetrina.vercel.app/api/calendar-sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ calendarId })
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      const data = await response.json();
      console.log('📅 Sync result:', data);
      return data;
    } catch (error) {
      console.error('❌ Error syncing calendar:', error);
      throw error;
    }
  }

  // Aggiorna configurazione calendario
  async updateCalendarConfig(id: string, config: any) {
    try {
      const response = await fetch(`${this.baseUrl}/calendars/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      return await response.json();
    } catch (error) {
      console.error('❌ Error updating calendar config:', error);
      throw error;
    }
  }

  // Elimina configurazione calendario  
  async deleteCalendarConfig(id: string) {
    try {
      const response = await fetch(`${this.baseUrl}/calendars/${id}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      return await response.json();
    } catch (error) {
      console.error('❌ Error deleting calendar config:', error);
      throw error;
    }
  }

  // Stato sincronizzazione calendari
  async getCalendarSyncStatus() {
    try {
      const response = await fetch(`${this.baseUrl}/calendar-sync/status`);
      if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      return await response.json();
    } catch (error) {
      console.error('❌ Error fetching calendar sync status:', error);
      return { success: false, stats: {} };
    }
  }

  // Forza sincronizzazione calendario
  async forceCalendarSync(calendarId?: string) {
    try {
      const url = calendarId 
        ? `${this.baseUrl}/calendar-sync/force/${calendarId}`
        : `${this.baseUrl}/calendar-sync/force-all`;
        
      const response = await fetch(url, { method: 'POST' });
      if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      return await response.json();
    } catch (error) {
      console.error('❌ Error forcing calendar sync:', error);
      throw error;
    }
  }

  // Test connessione calendario
  async testCalendarConnection(config: any) {
    try {
      const response = await fetch(`${this.baseUrl}/calendars/test-connection`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      return await response.json();
    } catch (error) {
      console.error('❌ Error testing calendar connection:', error);
      throw error;
    }
  }

  // === GOOGLE CALENDAR API METHODS ===

  // Ottieni URL autorizzazione Google
  async getGoogleAuthUrl() {
    try {
      const response = await fetch(`${this.baseUrl}/google-calendar/auth-url`);
      if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      return await response.json();
    } catch (error) {
      console.error('❌ Error getting Google auth URL:', error);
      throw error;
    }
  }

  // Completa autorizzazione Google
  async completeGoogleAuth(code: string) {
    try {
      const response = await fetch(`${this.baseUrl}/google-calendar/callback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code })
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      return await response.json();
    } catch (error) {
      console.error('❌ Error completing Google auth:', error);
      throw error;
    }
  }

  // Verifica stato autenticazione Google
  async getGoogleAuthStatus() {
    try {
      const response = await fetch(`${this.baseUrl}/google-calendar/status`);
      if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      return await response.json();
    } catch (error) {
      console.error('❌ Error getting Google auth status:', error);
      return { success: false, data: { isAuthenticated: false } };
    }
  }

  // Lista calendari Google
  async getGoogleCalendars() {
    try {
      const response = await fetch(`${this.baseUrl}/google-calendar/calendars`);
      if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      return await response.json();
    } catch (error) {
      console.error('❌ Error getting Google calendars:', error);
      throw error;
    }
  }

  // Ottieni eventi da Google Calendar
  async getGoogleCalendarEvents(calendarId?: string, timeMin?: string, timeMax?: string) {
    try {
      const params = new URLSearchParams();
      if (calendarId) params.append('calendarId', calendarId);
      if (timeMin) params.append('timeMin', timeMin);
      if (timeMax) params.append('timeMax', timeMax);
      
      const response = await fetch(`${this.baseUrl}/google-calendar/events?${params}`);
      if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      return await response.json();
    } catch (error) {
      console.error('❌ Error getting Google calendar events:', error);
      throw error;
    }
  }

  // Sincronizza prenotazioni con Google Calendar
  async syncBookingsToGoogle(bookings: any[], calendarId?: string) {
    try {
      const response = await fetch(`${this.baseUrl}/google-calendar/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          calendarId: calendarId || 'primary',
          bookings: bookings
        })
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      return await response.json();
    } catch (error) {
      console.error('❌ Error syncing bookings to Google:', error);
      throw error;
    }
  }

  // Test connessione Google Calendar
  async testGoogleConnection() {
    try {
      const response = await fetch(`${this.baseUrl}/google-calendar/test`);
      if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      return await response.json();
    } catch (error) {
      console.error('❌ Error testing Google connection:', error);
      throw error;
    }
  }

  // Ottieni eventi convertiti da prenotazioni
  async getBookingEvents() {
    try {
      const response = await fetch(`${this.baseUrl}/google-calendar/booking-events`);
      if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      return await response.json();
    } catch (error) {
      console.error('❌ Error getting booking events:', error);
      return { success: false, data: [], count: 0 };
    }
  }

  // Metodi per l'autenticazione e gestione Google Calendar
  async initiateGoogleAuth() {
    try {
      const response = await fetch(`${this.baseUrl}/google-calendar/auth`);
      if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      const result = await response.json();
      return result.authUrl;
    } catch (error) {
      console.error('❌ Error initiating Google auth:', error);
      throw error;
    }
  }

  async syncGoogleCalendar() {
    try {
      const response = await fetch(`${this.baseUrl}/google-calendar/sync`, { method: 'POST' });
      if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      return await response.json();
    } catch (error) {
      console.error('❌ Error syncing Google Calendar:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async getGoogleCalendarStatus() {
    try {
      const response = await fetch(`${this.baseUrl}/google-calendar/status`);
      if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      return await response.json();
    } catch (error) {
      console.error('❌ Error getting Google Calendar status:', error);
      return { isAuthenticated: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }


}

export default AdminApiService;