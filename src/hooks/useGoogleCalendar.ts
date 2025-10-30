/**
 * Custom Hook for Google Calendar Integration
 * Fornisce un'interfaccia semplice per utilizzare Google Calendar API
 */

import { useState, useEffect, useCallback } from 'react';
import GoogleCalendarApiService, { type GoogleCalendarApiEvent } from '../services/googleCalendarApiService';

interface UseGoogleCalendarReturn {
  // Stato
  isAuthenticated: boolean;
  isLoading: boolean;
  events: GoogleCalendarApiEvent[];
  error: string | null;
  
  // Informazioni auth
  authInfo: {
    isAuthenticated: boolean;
    expiresAt?: Date;
    hasRefreshToken: boolean;
  };
  
  // Azioni
  authenticate: () => Promise<void>;
  disconnect: () => void;
  loadEvents: () => Promise<void>;
  createEvent: (event: Omit<GoogleCalendarApiEvent, 'id'>) => Promise<string | null>;
  updateEvent: (eventId: string, event: GoogleCalendarApiEvent) => Promise<boolean>;
  deleteEvent: (eventId: string) => Promise<boolean>;
  syncBooking: (booking: any) => Promise<string | null>;
  
  // Utility
  checkAvailability: (startDate: string, endDate: string) => boolean;
  getStats: () => {
    total: number;
    thisMonth: number;
    nextMonth: number;
    occupancyRate: number;
  };
}

export const useGoogleCalendar = (): UseGoogleCalendarReturn => {
  const [calendarService] = useState(() => new GoogleCalendarApiService());
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [events, setEvents] = useState<GoogleCalendarApiEvent[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [authInfo, setAuthInfo] = useState({
    isAuthenticated: false,
    hasRefreshToken: false
  });

  // Aggiorna info di autenticazione
  const updateAuthInfo = useCallback(() => {
    const info = calendarService.getAuthInfo();
    setAuthInfo(info);
    setIsAuthenticated(info.isAuthenticated);
  }, [calendarService]);

  // Carica eventi dal calendario
  const loadEvents = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      let calendarEvents: GoogleCalendarApiEvent[];

      if (isAuthenticated) {
        // Usa API complete se autenticato
        calendarEvents = await calendarService.fetchCalendarEvents();
      } else {
        // Nessun dato se non autenticato - sistema pulito di produzione
        calendarEvents = [];
        console.log('⚠️ Google Calendar non autenticato - nessun evento disponibile');
      }

      setEvents(calendarEvents);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Errore nel caricamento eventi';
      setError(errorMessage);
      console.error('Errore nel caricamento eventi:', err);
    } finally {
      setIsLoading(false);
    }
  }, [calendarService, isAuthenticated]);

  // Funzione di autenticazione
  const authenticate = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const authUrl = calendarService.generateAuthUrl();
      
      // Salva stato per il callback
      sessionStorage.setItem('calendar_auth_callback', window.location.href);
      
      // Redirect all'autenticazione
      window.location.href = authUrl;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Errore durante l\'autenticazione';
      setError(errorMessage);
      setIsLoading(false);
    }
  }, [calendarService]);

  // Disconnessione
  const disconnect = useCallback(() => {
    calendarService.disconnect();
    setIsAuthenticated(false);
    setEvents([]);
    setError(null);
    updateAuthInfo();
  }, [calendarService, updateAuthInfo]);

  // Crea nuovo evento
  const createEvent = useCallback(async (event: Omit<GoogleCalendarApiEvent, 'id'>) => {
    if (!isAuthenticated) {
      setError('Non autenticato con Google Calendar');
      return null;
    }

    setIsLoading(true);
    try {
      const eventId = await calendarService.createCalendarEvent(event as GoogleCalendarApiEvent);
      
      if (eventId) {
        // Ricarica eventi per aggiornare la lista
        await loadEvents();
      }
      
      return eventId;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Errore nella creazione evento';
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [calendarService, isAuthenticated, loadEvents]);

  // Aggiorna evento esistente
  const updateEvent = useCallback(async (eventId: string, event: GoogleCalendarApiEvent) => {
    if (!isAuthenticated) {
      setError('Non autenticato con Google Calendar');
      return false;
    }

    setIsLoading(true);
    try {
      const success = await calendarService.updateCalendarEvent(eventId, event);
      
      if (success) {
        await loadEvents();
      }
      
      return success;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Errore nell\'aggiornamento evento';
      setError(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [calendarService, isAuthenticated, loadEvents]);

  // Elimina evento
  const deleteEvent = useCallback(async (eventId: string) => {
    if (!isAuthenticated) {
      setError('Non autenticato con Google Calendar');
      return false;
    }

    setIsLoading(true);
    try {
      const success = await calendarService.deleteCalendarEvent(eventId);
      
      if (success) {
        await loadEvents();
      }
      
      return success;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Errore nell\'eliminazione evento';
      setError(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [calendarService, isAuthenticated, loadEvents]);

  // Sincronizza prenotazione
  const syncBooking = useCallback(async (booking: any) => {
    if (!isAuthenticated) {
      setError('Non autenticato con Google Calendar');
      return null;
    }

    setIsLoading(true);
    try {
      const eventId = await calendarService.syncBookingToCalendar(booking);
      
      if (eventId) {
        await loadEvents();
      }
      
      return eventId;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Errore nella sincronizzazione';
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [calendarService, isAuthenticated, loadEvents]);

  // Controlla disponibilità
  const checkAvailability = useCallback((startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);

    return !events.some(event => {
      const eventStart = new Date(event.start.dateTime);
      const eventEnd = new Date(event.end.dateTime);
      
      // Controlla sovrapposizione
      return start < eventEnd && end > eventStart;
    });
  }, [events]);

  // Calcola statistiche
  const getStats = useCallback(() => {
    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const nextMonthEnd = new Date(now.getFullYear(), now.getMonth() + 2, 0);

    const thisMonthEvents = events.filter(event => {
      const eventDate = new Date(event.start.dateTime);
      return eventDate >= thisMonthStart && eventDate < nextMonthStart;
    });

    const nextMonthEvents = events.filter(event => {
      const eventDate = new Date(event.start.dateTime);
      return eventDate >= nextMonthStart && eventDate <= nextMonthEnd;
    });

    // Calcola tasso occupazione
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const occupiedDays = thisMonthEvents.reduce((sum, event) => {
      const start = new Date(event.start.dateTime);
      const end = new Date(event.end.dateTime);
      const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      return sum + days;
    }, 0);

    return {
      total: events.length,
      thisMonth: thisMonthEvents.length,
      nextMonth: nextMonthEvents.length,
      occupancyRate: Math.round((occupiedDays / daysInMonth) * 100)
    };
  }, [events]);

  // Effetti
  useEffect(() => {
    updateAuthInfo();
  }, [updateAuthInfo]);

  useEffect(() => {
    if (isAuthenticated) {
      loadEvents();
    }
  }, [isAuthenticated, loadEvents]);

  // Gestione callback OAuth
  useEffect(() => {
    const handleOAuthCallback = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');
      const state = urlParams.get('state');

      if (code && state === 'vincanto_calendar_auth') {
        setIsLoading(true);
        
        try {
          const success = await calendarService.exchangeCodeForTokens(code);
          
          if (success) {
            updateAuthInfo();
            
            // Pulisci URL
            const newUrl = window.location.protocol + "//" + 
                           window.location.host + 
                           window.location.pathname;
            window.history.replaceState({}, document.title, newUrl);
          } else {
            setError('Errore durante l\'autenticazione con Google');
          }
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : 'Errore OAuth';
          setError(errorMessage);
        } finally {
          setIsLoading(false);
        }
      }
    };

    handleOAuthCallback();
  }, [calendarService, updateAuthInfo]);

  return {
    // Stato
    isAuthenticated,
    isLoading,
    events,
    error,
    authInfo,
    
    // Azioni
    authenticate,
    disconnect,
    loadEvents,
    createEvent,
    updateEvent,
    deleteEvent,
    syncBooking,
    
    // Utility
    checkAvailability,
    getStats
  };
};