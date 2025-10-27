/**
 * Google Calendar API Service with OAuth2 Authentication
 * Servizio completo per autenticazione e gestione API Google Calendar
 */

interface GoogleOAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scope: string[];
}

interface GoogleTokens {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
  expires_at?: number;
}

interface GoogleCalendarApiEvent {
  id?: string;
  summary: string;
  description?: string;
  location?: string;
  start: {
    dateTime: string;
    timeZone: string;
  };
  end: {
    dateTime: string;
    timeZone: string;
  };
  status?: 'confirmed' | 'tentative' | 'cancelled';
  colorId?: string;
  extendedProperties?: {
    private?: { [key: string]: string };
  };
}

class GoogleCalendarApiService {
  private config: GoogleOAuthConfig;
  private tokens: GoogleTokens | null = null;
  private readonly STORAGE_KEY = 'google_calendar_tokens';
  
  constructor() {
    // Configurazione OAuth2 - in produzione queste andrebbero nelle environment variables
    this.config = {
      clientId: process.env.REACT_APP_GOOGLE_CLIENT_ID || '942707810608-q6d1u3q8qfm8qfm8qfm8qfm8qfm8qfm8.apps.googleusercontent.com',
      clientSecret: process.env.REACT_APP_GOOGLE_CLIENT_SECRET || 'GOCSPX-xxxxxxxxxxxxxxxxxxxxxxxx',
      redirectUri: process.env.REACT_APP_GOOGLE_REDIRECT_URI || 'http://localhost:5174/oauth/callback',
      scope: [
        'https://www.googleapis.com/auth/calendar',
        'https://www.googleapis.com/auth/calendar.events'
      ]
    };
    
    // Carica token salvati
    this.loadTokensFromStorage();
  }

  /**
   * Genera URL per l'autenticazione OAuth2
   */
  generateAuthUrl(): string {
    const params = new URLSearchParams({
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      scope: this.config.scope.join(' '),
      response_type: 'code',
      access_type: 'offline',
      prompt: 'consent',
      state: 'vincanto_calendar_auth'
    });
    
    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }

  /**
   * Scambia il codice di autorizzazione con i token di accesso
   */
  async exchangeCodeForTokens(code: string): Promise<boolean> {
    try {
      const tokenEndpoint = 'https://oauth2.googleapis.com/token';
      
      const response = await fetch(tokenEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: this.config.clientId,
          client_secret: this.config.clientSecret,
          code: code,
          grant_type: 'authorization_code',
          redirect_uri: this.config.redirectUri,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Errore nel token exchange:', errorData);
        return false;
      }

      this.tokens = await response.json();
      
      // Calcola scadenza token
      if (this.tokens && this.tokens.expires_in) {
        this.tokens.expires_at = Date.now() + (this.tokens.expires_in * 1000);
      }
      
      // Salva token
      this.saveTokensToStorage();
      
      console.log('✅ Autenticazione Google Calendar completata');
      return true;
    } catch (error) {
      console.error('❌ Errore durante l\'autenticazione:', error);
      return false;
    }
  }

  /**
   * Rinnova il token di accesso usando il refresh token
   */
  async refreshAccessToken(): Promise<boolean> {
    if (!this.tokens?.refresh_token) {
      console.error('Nessun refresh token disponibile');
      return false;
    }

    try {
      const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: this.config.clientId,
          client_secret: this.config.clientSecret,
          refresh_token: this.tokens.refresh_token,
          grant_type: 'refresh_token',
        }),
      });

      if (!response.ok) {
        console.error('Errore nel refresh del token');
        return false;
      }

      const newTokens = await response.json();
      
      // Mantieni il refresh token se non fornito
      this.tokens = {
        ...newTokens,
        refresh_token: newTokens.refresh_token || this.tokens.refresh_token,
        expires_at: Date.now() + (newTokens.expires_in * 1000)
      };

      this.saveTokensToStorage();
      return true;
    } catch (error) {
      console.error('Errore nel refresh token:', error);
      return false;
    }
  }

  /**
   * Verifica se il token è valido e lo rinnova se necessario
   */
  private async ensureValidToken(): Promise<boolean> {
    if (!this.tokens) {
      return false;
    }

    // Controlla se il token è scaduto (con buffer di 5 minuti)
    const now = Date.now();
    const bufferTime = 5 * 60 * 1000; // 5 minuti
    
    if (this.tokens.expires_at && (this.tokens.expires_at - bufferTime) <= now) {
      console.log('Token scaduto, tentativo di rinnovo...');
      return await this.refreshAccessToken();
    }

    return true;
  }

  /**
   * Esegue una chiamata autenticata alle API Google Calendar
   */
  private async makeAuthenticatedRequest(url: string, options: RequestInit = {}): Promise<Response> {
    if (!(await this.ensureValidToken())) {
      throw new Error('Token non valido o scaduto');
    }

    return fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        'Authorization': `Bearer ${this.tokens!.access_token}`,
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Recupera gli eventi dal calendario usando le API
   */
  async fetchCalendarEvents(calendarId: string = 'primary', maxResults: number = 50): Promise<GoogleCalendarApiEvent[]> {
    try {
      const now = new Date();
      const timeMin = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000)); // 30 giorni fa
      const timeMax = new Date(now.getTime() + (90 * 24 * 60 * 60 * 1000)); // 90 giorni avanti

      const params = new URLSearchParams({
        timeMin: timeMin.toISOString(),
        timeMax: timeMax.toISOString(),
        maxResults: maxResults.toString(),
        singleEvents: 'true',
        orderBy: 'startTime',
      });

      const url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?${params}`;
      
      const response = await this.makeAuthenticatedRequest(url);
      
      if (!response.ok) {
        throw new Error(`Errore API: ${response.status}`);
      }

      const data = await response.json();
      return data.items || [];
    } catch (error) {
      console.error('Errore nel recupero eventi:', error);
      
      // Fallback ai dati mock se non autenticati
      const { default: MockBookingService } = await import('./mockBookingService');
      return MockBookingService.generateMockEvents().map(event => this.convertToApiEvent(event));
    }
  }

  /**
   * Crea un nuovo evento nel calendario
   */
  async createCalendarEvent(event: GoogleCalendarApiEvent, calendarId: string = 'primary'): Promise<string | null> {
    try {
      const url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`;
      
      const response = await this.makeAuthenticatedRequest(url, {
        method: 'POST',
        body: JSON.stringify(event),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Errore nella creazione evento:', errorData);
        return null;
      }

      const createdEvent = await response.json();
      console.log('✅ Evento creato:', createdEvent.id);
      return createdEvent.id;
    } catch (error) {
      console.error('Errore nella creazione evento:', error);
      return null;
    }
  }

  /**
   * Aggiorna un evento esistente
   */
  async updateCalendarEvent(eventId: string, event: GoogleCalendarApiEvent, calendarId: string = 'primary'): Promise<boolean> {
    try {
      const url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${eventId}`;
      
      const response = await this.makeAuthenticatedRequest(url, {
        method: 'PUT',
        body: JSON.stringify(event),
      });

      if (!response.ok) {
        console.error('Errore nell\'aggiornamento evento:', response.status);
        return false;
      }

      console.log('✅ Evento aggiornato:', eventId);
      return true;
    } catch (error) {
      console.error('Errore nell\'aggiornamento evento:', error);
      return false;
    }
  }

  /**
   * Elimina un evento dal calendario
   */
  async deleteCalendarEvent(eventId: string, calendarId: string = 'primary'): Promise<boolean> {
    try {
      const url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${eventId}`;
      
      const response = await this.makeAuthenticatedRequest(url, {
        method: 'DELETE',
      });

      if (!response.ok) {
        console.error('Errore nell\'eliminazione evento:', response.status);
        return false;
      }

      console.log('✅ Evento eliminato:', eventId);
      return true;
    } catch (error) {
      console.error('Errore nell\'eliminazione evento:', error);
      return false;
    }
  }

  /**
   * Sincronizza una prenotazione con Google Calendar
   */
  async syncBookingToCalendar(booking: {
    id: string;
    guestName: string;
    checkIn: string;
    checkOut: string;
    guestCount: number;
    totalPrice: number;
    source: string;
    notes?: string;
    email?: string;
    phone?: string;
  }): Promise<string | null> {
    const calendarEvent: GoogleCalendarApiEvent = {
      summary: `${booking.guestName} (${booking.guestCount} ${booking.guestCount === 1 ? 'ospite' : 'ospiti'})`,
      description: this.buildEventDescription(booking),
      location: 'Vincanto Maori, Via dei Maori 25, Roma RM',
      start: {
        dateTime: booking.checkIn,
        timeZone: 'Europe/Rome'
      },
      end: {
        dateTime: booking.checkOut,
        timeZone: 'Europe/Rome'
      },
      status: 'confirmed',
      colorId: this.getColorBySource(booking.source),
      extendedProperties: {
        private: {
          bookingId: booking.id,
          source: booking.source,
          totalPrice: booking.totalPrice.toString(),
          guestCount: booking.guestCount.toString()
        }
      }
    };

    return await this.createCalendarEvent(calendarEvent);
  }

  /**
   * Costruisce la descrizione dell'evento
   */
  private buildEventDescription(booking: any): string {
    let description = `🏠 Prenotazione Vincanto Maori\n\n`;
    description += `📋 ID Prenotazione: ${booking.id}\n`;
    description += `👥 Ospiti: ${booking.guestCount}\n`;
    description += `💰 Totale: €${booking.totalPrice}\n`;
    description += `📱 Piattaforma: ${booking.source}\n\n`;
    
    if (booking.email) {
      description += `📧 Email: ${booking.email}\n`;
    }
    if (booking.phone) {
      description += `📞 Telefono: ${booking.phone}\n`;
    }
    if (booking.notes) {
      description += `📝 Note: ${booking.notes}\n`;
    }
    
    description += `\n🕐 Check-in: ${new Date(booking.checkIn).toLocaleString('it-IT')}`;
    description += `\n🕐 Check-out: ${new Date(booking.checkOut).toLocaleString('it-IT')}`;
    
    return description;
  }

  /**
   * Assegna colore in base alla piattaforma
   */
  private getColorBySource(source: string): string {
    const colorMap: { [key: string]: string } = {
      'airbnb': '10', // Verde
      'booking': '11', // Rosso
      'expedia': '9',  // Blu
      'direct': '2',   // Arancione
      'other': '8'     // Grigio
    };
    
    return colorMap[source] || '8';
  }

  /**
   * Converte evento interno in formato API
   */
  private convertToApiEvent(event: any): GoogleCalendarApiEvent {
    return {
      id: event.id,
      summary: event.title,
      description: event.description,
      location: event.location,
      start: {
        dateTime: event.start,
        timeZone: 'Europe/Rome'
      },
      end: {
        dateTime: event.end,
        timeZone: 'Europe/Rome'
      },
      status: 'confirmed'
    };
  }

  /**
   * Verifica se l'utente è autenticato
   */
  isAuthenticated(): boolean {
    return this.tokens !== null && this.tokens.access_token !== undefined;
  }

  /**
   * Disconnetti e rimuovi token
   */
  disconnect(): void {
    this.tokens = null;
    localStorage.removeItem(this.STORAGE_KEY);
    console.log('🔓 Disconnesso da Google Calendar');
  }

  /**
   * Salva token nel localStorage
   */
  private saveTokensToStorage(): void {
    if (this.tokens) {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.tokens));
    }
  }

  /**
   * Carica token dal localStorage
   */
  private loadTokensFromStorage(): void {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        this.tokens = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Errore nel caricamento token:', error);
      this.tokens = null;
    }
  }

  /**
   * Ottiene informazioni sull'autenticazione
   */
  getAuthInfo(): {
    isAuthenticated: boolean;
    expiresAt?: Date;
    hasRefreshToken: boolean;
  } {
    return {
      isAuthenticated: this.isAuthenticated(),
      expiresAt: this.tokens?.expires_at ? new Date(this.tokens.expires_at) : undefined,
      hasRefreshToken: !!this.tokens?.refresh_token
    };
  }
}

export default GoogleCalendarApiService;
export type { GoogleCalendarApiEvent, GoogleTokens, GoogleOAuthConfig };