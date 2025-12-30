// AdminApiService - Collegamento alle API Backend Admin
import { ExtraService } from '../hooks/useExtraServices';

class AdminApiService {
      // Recupera eventi da calendar_events (eventi iCal esterni)
      async getCalendarEvents() {
        try {
          const data = await this.request('calendar-events');
          return data.events || [];
        } catch (error) {
          console.error('Error fetching calendar events:', error);
          return [];
        }
      }
    // Sincronizza tutti i calendari (API unificata)
    async syncAllCalendars() {
      try {
        const response = await fetch('/api/calendar-real-sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        return await response.json();
      } catch (error) {
        console.error('❌ Errore syncAllCalendars:', error);
        throw error;
      }
    }
  private readonly baseUrl: string;

  constructor() {
    // 🎯 API UNIFICATA - CONFIGURAZIONE CONSOLIDATA
    this.baseUrl = import.meta.env.VITE_API_BASE_URL || 'https://vincanto-vetrina.vercel.app/api';
    console.log('🎯 AdminApiService PRODUZIONE API UNIFICATA:', this.baseUrl);
  }

  // Forza la sincronizzazione reale dei calendari (chiama direttamente l'API serverless)
  async forceRealCalendarSync() {
    try {
      const response = await fetch('/api/calendar-real-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      return await response.json();
    } catch (error) {
      console.error('❌ Errore sync reale calendari:', error);
      throw error;
    }
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    try {
      // 🔄 NUOVO SISTEMA: tutti gli endpoint vanno verso API unificata
      const url = `${this.baseUrl}/unified?action=${endpoint}`;
      console.log('🌐 API Unificata Request:', url);
      
      // Se abbiamo un token, lo includiamo nell'header
      const token = localStorage.getItem('vincanto_admin_token');
      const baseHeaders: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      
      // Merge con gli headers delle opzioni se presenti
      const mergedHeaders = {
        ...baseHeaders,
        ...(options.headers as Record<string, string> || {}),
      };
      
      if (token) {
        mergedHeaders['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(url, {
        headers: mergedHeaders,
        ...options,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('✅ API Unificata Response:', endpoint, data);
      return data;
    } catch (error) {
      console.error('❌ API Unificata Error:', endpoint, error);
      throw error;
    }
  }

  // Login method
  async login(password: string) {
    try {
      const response = await fetch(`${this.baseUrl}/unified?action=login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      if (data.success && data.token) {
        localStorage.setItem('vincanto_admin_token', data.token);
        console.log('✅ Login riuscito, token salvato');
        return data;
      } else {
        console.error('❌ Login fallito:', data.error);
        return { success: false, error: data.error || 'Login fallito' };
      }
    } catch (error) {
      console.error('❌ Errore login:', error);
      return { success: false, error: 'Errore di connessione' };
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

  // Bookings Management (API Unificata)
  async getBookings() {
    try {
      const data = await this.request('booking');
      return data.bookings || [];
    } catch (error) {
      console.error('Error fetching bookings:', error);
      return [];
    }
  }

  async createBooking(bookingData: any) {
    // Mappa i dati frontend ai campi backend corretti per API unificata
    const mappedData = {
      checkin: bookingData.check_in || bookingData.checkin || '',
      checkout: bookingData.check_out || bookingData.checkout || '',
      guests: bookingData.guests || 1,
      totalPrice: bookingData.total_amount || bookingData.totalPrice || 0,
      customerName: bookingData.customer_name || bookingData.customerName || '',
      customerEmail: bookingData.customer_email || bookingData.customerEmail || '',
      customerPhone: bookingData.customer_phone || bookingData.customerPhone || '',
      specialRequests: bookingData.notes || bookingData.specialRequests || '',
      paymentMethod: bookingData.payment_method || bookingData.paymentMethod || 'pending'
    };

    try {
      const response = await fetch(`${this.baseUrl}/unified?action=booking`, {
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
      const response = await fetch(`${this.baseUrl}/unified?action=booking`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          ...updates
        }),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      return { success: data.success, message: 'Prenotazione aggiornata', data };
    } catch (error) {
      console.error('Error updating booking:', error);
      return { success: false, message: 'Errore aggiornamento prenotazione' };
    }
  }

  async deleteBooking(id: string) {
    try {
      const response = await fetch(`${this.baseUrl}/unified?action=booking`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      return { success: data.success, message: 'Prenotazione eliminata', data };
    } catch (error) {
      console.error('Error deleting booking:', error);
      return { success: false, message: 'Errore eliminazione prenotazione' };
    }
  }

  // Pricing Management
  async getPricingConfig() {
    try {
      const data = await this.request('pricing-config');
      return data.config || data.pricing || {};
    } catch (error) {
      console.error('Error fetching pricing config:', error);
      return { success: false, data: [] };
    }
  }

  async updatePricingConfig(pricingData: any) {
    try {
      console.log('💰 AdminApiService: Invio dati pricing al database:', pricingData);
      const response = await fetch(`${this.baseUrl}/unified?action=pricing-config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          priceGroup1to2: pricingData.priceGroup1to2,
          priceGroup3to4: pricingData.priceGroup3to4,
          priceGroup5to6: pricingData.priceGroup5to6,
          priceGroup7to8: pricingData.priceGroup7to8,
          cleaningFee: pricingData.cleaningFee,
          parkingFee: pricingData.parkingFee,
          touristTaxAdult: pricingData.touristTaxAdult,
          touristTaxChild: pricingData.touristTaxChild,
          weekendSurcharge: pricingData.weekendSurcharge,
          weeklyDiscount: pricingData.weeklyDiscount,
          monthlyDiscount: pricingData.monthlyDiscount,
          minStay: pricingData.minStay,
          maxStay: pricingData.maxStay,
          maxGuests: pricingData.maxGuests
        }),
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
      const response = await fetch(`${this.baseUrl}/unified?action=pricing-config`, {
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

  // Calendar Management (API Unificata)
  async getCalendarData() {
    try {
      const data = await this.request('sync-calendars');
      return data.calendarSources || [];
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
      console.log('🔍 Caricamento analytics per periodo:', period);
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

  // Health Check (API Unificata)
  async healthCheck() {
    try {
      const response = await fetch(`${this.baseUrl}/unified?action=settings`);
      const data = await response.json();
      return data.success || false;
    } catch {
      return false;
    }
  }

  // Quote API (API Unificata)
  async getQuote(checkIn: string, checkOut: string, guests: number) {
    try {
      const url = `${this.baseUrl}/unified?action=quote&checkIn=${checkIn}&checkOut=${checkOut}&guests=${guests}`;
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
      // 🎯 UNIFICATO: Usa API unificata per gestione calendari
      const response = await fetch(`${this.baseUrl}/unified?action=calendar-configs`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const data = await response.json();
      console.log('📅 Calendar configs da API unificata:', data);
      
      // Adatta la risposta per il formato atteso dall'admin panel
      const adaptedCalendars = (data.calendars || []).map((cal: any) => ({
        ...cal,
        // Mappa i campi dall'API al formato admin panel
        last_sync_at: cal.last_sync,
        sync_frequency: cal.sync_frequency || 60,
        events_count: cal.events_synced || 0,
        is_active: cal.is_active || cal.status === 'active',
        // Mantiene anche i campi originali per compatibilità
        status: cal.status || (cal.is_active ? 'connected' : 'disconnected')
      }));
      
      return {
        calendars: adaptedCalendars,
        stats: {
          total: adaptedCalendars.length || 0,
          active: adaptedCalendars.filter((c: any) => c.is_active)?.length || 0,
          external: adaptedCalendars.length || 0,
          googleCalendar: adaptedCalendars.filter((c: any) => c.calendar_type === 'google')?.length || 0,
          lastSyncSuccess: data.stats?.lastSyncSuccess || new Date().toISOString(),
          totalEventsSynced: data.stats?.totalEventsSynced || 0
        }
      };
    } catch (error) {
      console.error('❌ Error fetching calendar configs:', error);
      return { calendars: [], stats: {} };
    }
  }

  // Crea nuova configurazione calendario
  async createCalendarConfig(config: any) {
    try {
      const response = await fetch(`${this.baseUrl}/unified?action=calendar-config`, {
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
      const response = await fetch(`${this.baseUrl}/unified?action=sync-calendar`, {
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
      const response = await fetch(`${this.baseUrl}/unified?action=update-calendar-config&id=${id}`, {
        method: 'POST',
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
      const response = await fetch(`${this.baseUrl}/unified?action=delete-calendar-config&id=${id}`, {
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
      console.log('📊 Recupero status sincronizzazione calendari...');
      const response = await fetch(`${this.baseUrl}/unified?action=calendar-sync-status`);
      if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      const result = await response.json();
      console.log('✅ Status calendari:', result);
      return result;
    } catch (error) {
      console.error('❌ Error fetching calendar sync status:', error);
      return { success: false, stats: {} };
    }
  }

  // Recupera prenotazioni da calendari esterni sincronizzati
  async getCalendarBookings(params: { limit?: number; futureOnly?: boolean; platform?: string } = {}) {
    try {
      const queryParams = new URLSearchParams({
        limit: (params.limit || 50).toString(),
        futureOnly: (params.futureOnly !== false).toString(),
        ...(params.platform && { platform: params.platform })
      });
      
      console.log('📅 Recupero prenotazioni da calendari esterni...');
      const response = await fetch(`${this.baseUrl}/unified?action=calendar-bookings&${queryParams}`);
      if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      const result = await response.json();
      console.log('✅ Prenotazioni calendari esterni:', result);
      return result;
    } catch (error) {
      console.error('❌ Error fetching calendar bookings:', error);
      return { success: false, bookings: [], total: 0 };
    }
  }

  // Forza sincronizzazione calendario
  async forceCalendarSync(calendarId?: string) {
    try {
      console.log('🔄 Avvio sincronizzazione calendari...');
      const response = await fetch(`${this.baseUrl}/unified?action=force-calendar-sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          calendarId: calendarId || 'all',
          force: true 
        })
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      const result = await response.json();
      console.log('✅ Sincronizzazione avviata:', result);
      return result;
    } catch (error) {
      console.error('❌ Error forcing calendar sync:', error);
      throw error;
    }
  }

  // Test connessione calendario
  async testCalendarConnection(config: any) {
    try {
      const response = await fetch(`${this.baseUrl}/unified?action=test-calendar-connection`, {
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
      const response = await fetch(`${this.baseUrl}/unified?action=google-auth-url`);
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
      const response = await fetch(`${this.baseUrl}/unified?action=google-auth-callback`, {
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
      const response = await fetch(`${this.baseUrl}/unified?action=google-auth-status`);
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
      const response = await fetch(`${this.baseUrl}/unified?action=google-calendars`);
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
      params.append('action', 'google-events');
      if (calendarId) params.append('calendarId', calendarId);
      if (timeMin) params.append('timeMin', timeMin);
      if (timeMax) params.append('timeMax', timeMax);
      
      const response = await fetch(`${this.baseUrl}/unified?${params}`);
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
      const response = await fetch(`${this.baseUrl}/unified?action=google-sync`, {
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
      const response = await fetch(`${this.baseUrl}/unified?action=google-test`);
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
      const response = await fetch(`${this.baseUrl}/unified?action=google-booking-events`);
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
      const response = await fetch(`${this.baseUrl}/unified?action=google-auth`);
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
      // 🎯 USA L'API UNIFICATA per la sincronizzazione calendari
      const response = await fetch(`${this.baseUrl}/unified?action=sync-calendars`, { method: 'POST' });
      if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      return await response.json();
    } catch (error) {
      console.error('❌ Error syncing Google Calendar:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async getGoogleCalendarStatus() {
    try {
      // 🎯 USA L'API UNIFICATA per lo status calendario
      const response = await fetch(`${this.baseUrl}/unified?action=blocked-dates`);
      if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      const data = await response.json();
      // Simula status autenticazione basato su presenza di dati
      return { 
        isAuthenticated: data.success && data.blockedDates && data.blockedDates.length > 0,
        calendarsCount: data.blockedDates ? data.blockedDates.length : 0,
        email: 'admin@vincanto.com' // Placeholder
      };
    } catch (error) {
      console.error('❌ Error getting Google Calendar status:', error);
      return { isAuthenticated: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  // Payments
  async getPayments() {
    try {
      const data = await this.request('payments');
      return data.payments || [];
    } catch (error) {
      console.error('Error fetching payments:', error);
      return [];
    }
  }

  async createPayment(paymentData: any) {
    try {
      const response = await fetch(`${this.baseUrl}/admin?action=payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(paymentData),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error('Error creating payment:', error);
      return { success: false, message: 'Errore creazione pagamento' };
    }
  }

  async updatePayment(id: string, updates: any) {
    try {
      const response = await fetch(`${this.baseUrl}/admin?action=payments&id=${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error('Error updating payment:', error);
      return { success: false, message: 'Errore aggiornamento pagamento' };
    }
  }

  // === EXTRA SERVICES MANAGEMENT ===

  // Carica tutti i servizi extra (hardcoded + custom)
  async getExtraServices(): Promise<ExtraService[]> {
    try {
      const response = await fetch(`${this.baseUrl}/unified?action=extra-services`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      return data.services || [];
    } catch (error) {
      console.error('Error fetching extra services:', error);
      return [];
    }
  }

  // Aggiungi nuovo servizio custom
  async addCustomService(serviceData: any) {
    try {
      console.log('➕ ADMIN API: Aggiunta servizio custom:', serviceData);
      
      const response = await fetch(`${this.baseUrl}/unified?action=extra-services`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(serviceData),
      });
      
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const result = await response.json();
      
      console.log('✅ SERVIZIO AGGIUNTO:', result);
      return result;
    } catch (error) {
      console.error('❌ Errore aggiunta servizio custom:', error);
      return { success: false, message: 'Errore aggiunta servizio' };
    }
  }

  // Aggiorna servizio custom esistente
  async updateCustomService(serviceData: any) {
    try {
      console.log('🔄 ADMIN API: Aggiornamento servizio custom:', serviceData);
      
      const response = await fetch(`${this.baseUrl}/unified?action=extra-services&id=${serviceData.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(serviceData),
      });
      
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const result = await response.json();
      
      console.log('✅ SERVIZIO AGGIORNATO:', result);
      return result;
    } catch (error) {
      console.error('❌ Errore aggiornamento servizio custom:', error);
      return { success: false, message: 'Errore aggiornamento servizio' };
    }
  }

  // Elimina servizio custom
  async deleteCustomService(serviceId: number) {
    try {
      console.log('🗑️ ADMIN API: Eliminazione servizio custom:', serviceId);
      
      const response = await fetch(`${this.baseUrl}/unified?action=extra-services&id=${serviceId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const result = await response.json();
      
      console.log('✅ SERVIZIO ELIMINATO:', result);
      return result;
    } catch (error) {
      console.error('❌ Errore eliminazione servizio custom:', error);
      return { success: false, message: 'Errore eliminazione servizio' };
    }
  }

  // Crea nuovo servizio extra
  async createExtraService(serviceData: Partial<ExtraService>): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/unified?action=extra-services`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(serviceData),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error('Error creating extra service:', error);
      throw error;
    }
  }

  // Aggiorna servizio extra esistente
  async updateExtraService(serviceId: number, serviceData: Partial<ExtraService>): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/unified?action=extra-services&id=${serviceId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(serviceData),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error('Error updating extra service:', error);
      throw error;
    }
  }

  // Elimina servizio extra
  async deleteExtraService(serviceId: number): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/unified?action=extra-services&id=${serviceId}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error('Error deleting extra service:', error);
      throw error;
    }
  }

}

export default AdminApiService;