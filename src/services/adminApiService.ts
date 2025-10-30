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
      const url = `${this.baseUrl}/admin/${endpoint}`;
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
    // Mappa i dati frontend ai campi backend
    const mappedData = {
      guest_name: bookingData.customer_name?.split(' ')[0] || bookingData.customer_name || '',
      guest_surname: bookingData.customer_name?.split(' ').slice(1).join(' ') || '',
      guest_email: bookingData.customer_email || '',
      guest_phone: bookingData.customer_phone || '',
      check_in_date: bookingData.check_in || '',
      check_out_date: bookingData.check_out || '', 
      num_adults: bookingData.guests || 1,
      num_children: bookingData.children || 0,
      total_amount: bookingData.total_amount || 0,
      booking_source: bookingData.platform || 'admin',
      status: bookingData.status || 'confirmed'
    };

    return this.request('bookings', {
      method: 'POST',
      body: JSON.stringify(mappedData),
    });
  }

  async updateBooking(id: string, updates: any) {
    return this.request(`bookings/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deleteBooking(id: string) {
    return this.request(`bookings/${id}`, {
      method: 'DELETE',
    });
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

  // Pricing Configuration
  async getPricingConfig() {
    try {
      const data = await this.request('pricing-config');
      return data.pricing || {};
    } catch (error) {
      console.error('Error fetching pricing config:', error);
      return {};
    }
  }

  async updatePricingConfig(pricingData: any) {
    return this.request('pricing-config', {
      method: 'PUT',
      body: JSON.stringify(pricingData),
    });
  }

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
      const data = await this.request(`analytics?period=${period}`);
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
      const response = await fetch(`${this.baseUrl.replace('/api', '')}/health`);
      return response.ok;
    } catch {
      return false;
    }
  }

  // Quote API
  async getQuote(checkIn: string, checkOut: string, guests: number) {
    try {
      const url = `${this.baseUrl}/quote?checkIn=${checkIn}&checkOut=${checkOut}&guests=${guests}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error('Quote API error');
      return await response.json();
    } catch (error) {
      console.error('Error getting quote:', error);
      throw error;
    }
  }

  // Calendar Management
  async getCalendarEvents() {
    try {
      const data = await this.request('calendar-events');
      return data.events || [];
    } catch (error) {
      console.error('Error fetching calendar events:', error);
      return [];
    }
  }

  async syncCalendar() {
    try {
      return await this.request('calendar-sync', { method: 'POST' });
    } catch (error) {
      console.error('Error syncing calendar:', error);
      throw error;
    }
  }

  async testCalendarConnection() {
    try {
      const data = await this.request('calendar-test');
      return data.connected || false;
    } catch (error) {
      console.error('Error testing calendar connection:', error);
      return false;
    }
  }
}

export default AdminApiService;