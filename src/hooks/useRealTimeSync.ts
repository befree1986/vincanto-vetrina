/**
 * Hook per sincronizzazione real-time con backend
 * Gestisce polling e aggiornamenti automatici
 */

import { useEffect, useCallback, useRef } from 'react';
import * as AdminAPI from '../services/adminApi';

interface UseRealTimeSyncOptions {
  enabled: boolean;
  pollingInterval: number; // in millisecondi
  onCalendarsUpdate?: (calendars: AdminAPI.AdminCalendar[]) => void;
  onBookingsUpdate?: (bookings: AdminAPI.AdminBooking[]) => void;
  onError?: (error: string) => void;
}

export function useRealTimeSync({
  enabled,
  pollingInterval = 30000, // 30 secondi di default
  onCalendarsUpdate,
  onBookingsUpdate,
  onError
}: UseRealTimeSyncOptions) {
  
  const intervalRef = useRef<NodeJS.Timeout>();
  const isActiveRef = useRef(false);

  // Funzione per sincronizzazione completa
  const syncData = useCallback(async () => {
    if (!enabled || !isActiveRef.current) return;

    try {
      console.log('🔄 Avvio sincronizzazione real-time...');

      // Sincronizza calendari
      if (onCalendarsUpdate) {
        const calendars = await AdminAPI.getCalendars();
        onCalendarsUpdate(calendars);
      }

      // Sincronizza prenotazioni
      if (onBookingsUpdate) {
        const bookings = await AdminAPI.getBookings();
        onBookingsUpdate(bookings);
      }

      console.log('✅ Sincronizzazione completata');
    } catch (error) {
      console.error('❌ Errore sincronizzazione:', error);
      if (onError) {
        onError(error instanceof Error ? error.message : 'Errore sconosciuto');
      }
    }
  }, [enabled, onCalendarsUpdate, onBookingsUpdate, onError]);

  // Avvia/ferma il polling
  useEffect(() => {
    if (!enabled) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = undefined;
      }
      isActiveRef.current = false;
      return;
    }

    isActiveRef.current = true;

    // Prima sincronizzazione immediata
    syncData();

    // Imposta polling per aggiornamenti successivi
    intervalRef.current = setInterval(syncData, pollingInterval);

    console.log(`📡 Sincronizzazione real-time attivata (ogni ${pollingInterval / 1000}s)`);

    // Cleanup al dismount
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = undefined;
      }
      isActiveRef.current = false;
      console.log('📡 Sincronizzazione real-time disattivata');
    };
  }, [enabled, pollingInterval, syncData]);

  // Funzione per forzare sincronizzazione manuale
  const forcSync = useCallback(() => {
    console.log('🔄 Sincronizzazione forzata dall\'utente');
    syncData();
  }, [syncData]);

  // Funzione per verificare se il sync è attivo
  const isActive = enabled && isActiveRef.current;

  return {
    forceSync: forcSync,
    isActive,
    nextSyncIn: pollingInterval
  };
}

// Hook semplificato per uso specifico dell'admin panel
export function useAdminRealTimeSync(
  setCalendars: (calendars: AdminAPI.AdminCalendar[]) => void,
  setBookings: (bookings: AdminAPI.AdminBooking[]) => void,
  setError: (error: string) => void,
  enabled: boolean = true
) {
  return useRealTimeSync({
    enabled,
    pollingInterval: 30000, // 30 secondi
    onCalendarsUpdate: setCalendars,
    onBookingsUpdate: setBookings,
    onError: setError
  });
}