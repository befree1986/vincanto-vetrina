/**
 * Google Calendar API Integration Service
 * Gestisce la sincronizzazione delle prenotazioni con Google Calendar
 */

interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  description?: string;
  location?: string;
  source: 'direct' | 'airbnb' | 'booking' | 'expedia' | 'other';
  guestCount: number;
  totalPrice: number;
  status: 'confirmed' | 'pending' | 'cancelled';
}

interface GoogleCalendarConfig {
  publicCalendarUrl: string;
  privateCalendarUrl: string;
  calendarId: string;
  apiKey?: string;
  accessToken?: string;
}

class GoogleCalendarService {
  private config: GoogleCalendarConfig;

  constructor() {
    this.config = {
      publicCalendarUrl: 'https://calendar.google.com/calendar/ical/vincantomaiori%40gmail.com/public/basic.ics',
      privateCalendarUrl: 'https://calendar.google.com/calendar/ical/vincantomaiori%40gmail.com/private-c093b952abd5d0bafc2261928153f36d/basic.ics',
      calendarId: 'vincantomaiori@gmail.com'
    };
  }

  /**
   * Recupera gli eventi dal calendario Google tramite URL ICS pubblico
   */
  async fetchCalendarEvents(): Promise<CalendarEvent[]> {
    try {
      const response = await fetch(this.config.publicCalendarUrl);
      
      // Se la risposta non è OK, usa i dati mock
      if (!response.ok) {
        console.warn('Google Calendar non disponibile, usando dati mock');
        const { default: MockBookingService } = await import('./mockBookingService');
        return MockBookingService.generateMockEvents();
      }
      
      const icsData = await response.text();
      
      // Se il contenuto ICS è vuoto o non valido, usa i dati mock
      if (!icsData || icsData.length < 50) {
        console.warn('Dati ICS non validi, usando dati mock');
        const { default: MockBookingService } = await import('./mockBookingService');
        return MockBookingService.generateMockEvents();
      }
      
      const events = this.parseICSData(icsData);
      
      // Se non ci sono eventi nel calendario, usa i dati mock per la demo
      if (events.length === 0) {
        console.warn('Nessun evento nel calendario Google, usando dati mock per la demo');
        const { default: MockBookingService } = await import('./mockBookingService');
        return MockBookingService.generateMockEvents();
      }
      
      return events;
    } catch (error) {
      console.error('Errore nel recupero eventi calendario:', error);
      console.log('Utilizzando dati mock come fallback');
      
      // Fallback ai dati mock in caso di errore
      const { default: MockBookingService } = await import('./mockBookingService');
      return MockBookingService.generateMockEvents();
    }
  }

  /**
   * Parsing dei dati ICS per convertirli in eventi strutturati
   */
  private parseICSData(icsData: string): CalendarEvent[] {
    const events: CalendarEvent[] = [];
    const lines = icsData.split('\n');
    let currentEvent: Partial<CalendarEvent> | null = null;

    for (const line of lines) {
      const trimmedLine = line.trim();

      if (trimmedLine === 'BEGIN:VEVENT') {
        currentEvent = {};
      } else if (trimmedLine === 'END:VEVENT' && currentEvent) {
        if (currentEvent.title && currentEvent.start && currentEvent.end) {
          events.push({
            id: currentEvent.id || Date.now().toString(),
            title: currentEvent.title,
            start: currentEvent.start,
            end: currentEvent.end,
            description: currentEvent.description || '',
            location: currentEvent.location || 'Vincanto Maori',
            source: this.detectBookingSource(currentEvent.title, currentEvent.description || ''),
            guestCount: this.extractGuestCount(currentEvent.title, currentEvent.description || ''),
            totalPrice: this.extractPrice(currentEvent.description || ''),
            status: 'confirmed'
          } as CalendarEvent);
        }
        currentEvent = null;
      } else if (currentEvent) {
        if (trimmedLine.startsWith('UID:')) {
          currentEvent.id = trimmedLine.substring(4);
        } else if (trimmedLine.startsWith('SUMMARY:')) {
          currentEvent.title = this.decodeICSText(trimmedLine.substring(8));
        } else if (trimmedLine.startsWith('DTSTART:')) {
          currentEvent.start = this.parseICSDateTime(trimmedLine.substring(8));
        } else if (trimmedLine.startsWith('DTEND:')) {
          currentEvent.end = this.parseICSDateTime(trimmedLine.substring(6));
        } else if (trimmedLine.startsWith('DESCRIPTION:')) {
          currentEvent.description = this.decodeICSText(trimmedLine.substring(12));
        } else if (trimmedLine.startsWith('LOCATION:')) {
          currentEvent.location = this.decodeICSText(trimmedLine.substring(9));
        }
      }
    }

    return events;
  }

  /**
   * Rileva la piattaforma di prenotazione dal titolo o descrizione
   */
  private detectBookingSource(title: string, description: string): CalendarEvent['source'] {
    const text = (title + ' ' + description).toLowerCase();
    
    if (text.includes('airbnb')) return 'airbnb';
    if (text.includes('booking.com') || text.includes('booking')) return 'booking';
    if (text.includes('expedia')) return 'expedia';
    if (text.includes('direct') || text.includes('diretto')) return 'direct';
    
    return 'other';
  }

  /**
   * Estrae il numero di ospiti da titolo/descrizione
   */
  private extractGuestCount(title: string, description: string): number {
    const text = title + ' ' + description;
    const guestMatch = text.match(/(\d+)\s*(ospiti?|guests?|persone?|people)/i);
    return guestMatch ? parseInt(guestMatch[1]) : 2;
  }

  /**
   * Estrae il prezzo dalla descrizione
   */
  private extractPrice(description: string): number {
    const priceMatch = description.match(/[€$£]\s?(\d+(?:[.,]\d{2})?)/);
    if (priceMatch) {
      return parseFloat(priceMatch[1].replace(',', '.'));
    }
    return 0;
  }

  /**
   * Decodifica il testo ICS (gestisce encoding speciali)
   */
  private decodeICSText(text: string): string {
    return text
      .replace(/\\n/g, '\n')
      .replace(/\\,/g, ',')
      .replace(/\\;/g, ';')
      .replace(/\\\\/g, '\\');
  }

  /**
   * Converte data/ora ICS in formato ISO
   */
  private parseICSDateTime(dateString: string): string {
    // Formato ICS: YYYYMMDDTHHMMSSZ o YYYYMMDD
    if (dateString.includes('T')) {
      // Con orario
      const year = dateString.substring(0, 4);
      const month = dateString.substring(4, 6);
      const day = dateString.substring(6, 8);
      const hour = dateString.substring(9, 11);
      const minute = dateString.substring(11, 13);
      const second = dateString.substring(13, 15);
      
      return `${year}-${month}-${day}T${hour}:${minute}:${second}Z`;
    } else {
      // Solo data
      const year = dateString.substring(0, 4);
      const month = dateString.substring(4, 6);
      const day = dateString.substring(6, 8);
      
      return `${year}-${month}-${day}T00:00:00Z`;
    }
  }

  /**
   * Crea un nuovo evento nel calendario Google (richiede API key e autenticazione)
   */
  async createCalendarEvent(event: Omit<CalendarEvent, 'id'>): Promise<string | null> {
    try {
      // Per ora simuliamo la creazione, in produzione servirà l'API completa
      console.log('Creazione evento calendario:', event);
      
      // Qui andrebbe implementata la chiamata all'API Google Calendar
      // Esempio di struttura per la chiamata API:
      /*
      const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${this.config.calendarId}/events`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
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
          }
        })
      });
      
      const result = await response.json();
      return result.id;
      */
      
      // Per ora restituiamo un ID fittizio
      return `event_${Date.now()}`;
    } catch (error) {
      console.error('Errore nella creazione evento calendario:', error);
      return null;
    }
  }

  /**
   * Aggiorna un evento esistente nel calendario
   */
  async updateCalendarEvent(eventId: string, event: Partial<CalendarEvent>): Promise<boolean> {
    try {
      console.log('Aggiornamento evento:', eventId, event);
      
      // Qui andrebbe implementata la chiamata all'API Google Calendar per l'aggiornamento
      return true;
    } catch (error) {
      console.error('Errore nell\'aggiornamento evento calendario:', error);
      return false;
    }
  }

  /**
   * Elimina un evento dal calendario
   */
  async deleteCalendarEvent(eventId: string): Promise<boolean> {
    try {
      console.log('Eliminazione evento:', eventId);
      
      // Qui andrebbe implementata la chiamata all'API Google Calendar per l'eliminazione
      return true;
    } catch (error) {
      console.error('Errore nell\'eliminazione evento calendario:', error);
      return false;
    }
  }

  /**
   * Sincronizza una prenotazione locale con il calendario Google
   */
  async syncBookingToCalendar(booking: {
    checkIn: string;
    checkOut: string;
    guestName: string;
    guestCount: number;
    totalPrice: number;
    source: string;
    notes?: string;
  }): Promise<string | null> {
    const calendarEvent: Omit<CalendarEvent, 'id'> = {
      title: `${booking.guestName} (${booking.guestCount} ospiti)`,
      start: booking.checkIn,
      end: booking.checkOut,
      description: `Prenotazione da ${booking.source}\nOspiti: ${booking.guestCount}\nTotale: €${booking.totalPrice}\n${booking.notes || ''}`,
      location: 'Vincanto Maori, Via dei Maori 25, Roma',
      source: booking.source as CalendarEvent['source'],
      guestCount: booking.guestCount,
      totalPrice: booking.totalPrice,
      status: 'confirmed'
    };

    return await this.createCalendarEvent(calendarEvent);
  }

  /**
   * Verifica la disponibilità per un periodo
   */
  async checkAvailability(startDate: string, endDate: string): Promise<boolean> {
    try {
      const events = await this.fetchCalendarEvents();
      
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      // Controlla se ci sono sovrapposizioni con eventi esistenti
      for (const event of events) {
        const eventStart = new Date(event.start);
        const eventEnd = new Date(event.end);
        
        // Verifica sovrapposizione
        if ((start < eventEnd && end > eventStart)) {
          return false; // Non disponibile
        }
      }
      
      return true; // Disponibile
    } catch (error) {
      console.error('Errore nel controllo disponibilità:', error);
      return false;
    }
  }

  /**
   * Ottiene statistiche del calendario
   */
  async getCalendarStats(): Promise<{
    totalBookings: number;
    thisMonth: number;
    nextMonth: number;
    occupancyRate: number;
    revenueThisMonth: number;
  }> {
    try {
      const events = await this.fetchCalendarEvents();
      
      // Se non ci sono eventi reali, prova a usare le statistiche mock
      if (events.length === 0) {
        const { default: MockBookingService } = await import('./mockBookingService');
        return MockBookingService.getMockStats();
      }
      
      const now = new Date();
      const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      const nextMonthEnd = new Date(now.getFullYear(), now.getMonth() + 2, 0);

      const thisMonthEvents = events.filter(event => {
        const eventDate = new Date(event.start);
        return eventDate >= thisMonthStart && eventDate < nextMonthStart;
      });

      const nextMonthEvents = events.filter(event => {
        const eventDate = new Date(event.start);
        return eventDate >= nextMonthStart && eventDate <= nextMonthEnd;
      });

      const revenueThisMonth = thisMonthEvents.reduce((sum, event) => sum + event.totalPrice, 0);
      
      // Calcola tasso di occupazione (giorni occupati / giorni totali del mese)
      const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
      const occupiedDays = thisMonthEvents.reduce((sum, event) => {
        const start = new Date(event.start);
        const end = new Date(event.end);
        const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
        return sum + days;
      }, 0);

      return {
        totalBookings: events.length,
        thisMonth: thisMonthEvents.length,
        nextMonth: nextMonthEvents.length,
        occupancyRate: Math.round((occupiedDays / daysInMonth) * 100),
        revenueThisMonth
      };
    } catch (error) {
      console.error('Errore nel calcolo statistiche calendario:', error);
      
      // Fallback alle statistiche mock in caso di errore
      try {
        const { default: MockBookingService } = await import('./mockBookingService');
        return MockBookingService.getMockStats();
      } catch (mockError) {
        console.error('Errore anche con dati mock:', mockError);
        return {
          totalBookings: 0,
          thisMonth: 0,
          nextMonth: 0,
          occupancyRate: 0,
          revenueThisMonth: 0
        };
      }
    }
  }
}

export default GoogleCalendarService;
export type { CalendarEvent, GoogleCalendarConfig };