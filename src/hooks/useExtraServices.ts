// Hook per caricare servizi extra dinamici dal pannello admin
import { useState, useEffect } from 'react';

export interface ExtraService {
  id: number;
  name: string;
  price: number;
  unit: 'soggiorno' | 'per_stay' | 'notte' | 'per_night' | 'persona' | 'per_person' | 'per_person_per_day';
  description?: string;
  category: 'bambini' | 'animali' | 'comfort' | 'comodita' | 'parcheggio' | 'custom' | 'equipment' | 'convenience' | 'food' | 'gift';
  available: boolean;
  active?: boolean; // 🔥 NUOVO: Flag per attivare/disattivare il servizio
  included?: boolean; // 🔥 NUOVO: Flag per servizi inclusi (prezzo 0)
  minAge?: number;
  maxAge?: number;
  isParking?: boolean; // Flag per identificare servizi di parcheggio
}

interface ExtraServicesData {
  services: ExtraService[];
  loading: boolean;
  error: string | null;
  selectedServices: number[];
  toggleService: (serviceId: number) => void;
  getTotalCost: () => number;
  getSelectedServices: () => ExtraService[];
  refreshServices: () => void; // 🔥 NUOVO: Funzione per ricaricare servizi
  // Funzioni specifiche per parcheggio
  getParkingService: () => ExtraService | undefined;
  isParkingSelected: () => boolean;
  toggleParking: (enable: boolean) => void;
}

export const useExtraServices = (): ExtraServicesData => {
  const [services, setServices] = useState<ExtraService[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedServices, setSelectedServices] = useState<number[]>([]);

  const fetchServices = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('🛎️ EXTRA SERVICES HOOK: Caricamento servizi...');
      
      // 🎯 USA API UNIFICATA PER CONSISTENZA
      const timestamp = new Date().getTime();
      const apiUrl = import.meta.env.VITE_API_BASE_URL || 'https://vincanto-vetrina.vercel.app/api';
      const response = await fetch(`${apiUrl}/unified?action=extra-services&_t=${timestamp}`);
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.success && data.services) {
          // Trasforma i servizi per compatibilità frontend
          const transformedServices = data.services.map((service: any) => ({
            id: service.id,
            name: service.name,
            price: service.price,
            unit: service.unit || 'soggiorno',
            description: service.description,
            category: service.category || 'general',
            available: service.active !== false,
            active: service.active !== false,
            included: service.included === true, // 🔥 USA VALORE DAL DATABASE
            minAge: service.minAge,
            maxAge: service.maxAge,
            isParking: service.category === 'parcheggio'
          }));
          
          setServices(transformedServices);
          console.log('✅ EXTRA SERVICES: Servizi caricati dal database:', transformedServices.length);
        } else {
          throw new Error(data.message || 'Errore caricamento servizi');
        }
      } else {
        throw new Error(`Errore HTTP ${response.status}`);
      }
    } catch (err) {
      console.error('❌ EXTRA SERVICES: API non disponibile, uso servizi predefiniti:', err);
      
      // 🔄 SERVIZI ALLINEATI CON DATABASE (fallback se API non disponibile)
      setServices([
        { 
          id: 6, 
          name: 'Culla per Bambini', 
          price: 20, 
          unit: 'soggiorno',
          description: 'Culla con biancheria per bambini fino a 7 anni',
          category: 'bambini',
          available: true,
          included: false,
          minAge: 0,
          maxAge: 7
        },
        { 
          id: 1, 
          name: 'Late Check-out', 
          price: 30, 
          unit: 'soggiorno',
          description: 'Check-out posticipato alle 14:00 invece delle 10:00',
          category: 'convenience',
          available: true,
          included: false
        },
        { 
          id: 2, 
          name: 'Early Check-in', 
          price: 25, 
          unit: 'soggiorno',
          description: 'Check-in anticipato dalle 12:00 invece delle 15:00',
          category: 'convenience',
          available: true,
          included: false
        },
        { 
          id: 4, 
          name: 'Colazione Italiana', 
          price: 15, 
          unit: 'persona',
          description: 'Colazione italiana completa con prodotti locali',
          category: 'food',
          available: true,
          included: false
        },
        { 
          id: 8, 
          name: 'Kit Welcome', 
          price: 25, 
          unit: 'soggiorno',
          description: 'Kit di benvenuto con prodotti tipici siciliani',
          category: 'gift',
          available: true,
          included: true  // 🎁 SERVIZIO INCLUSO
        }
      ]);
      
      console.log('✅ EXTRA SERVICES: Servizi predefiniti caricati come fallback');
      setError(null); // Rimuovi errore visto che abbiamo i servizi fallback
    } finally {
      setLoading(false);
    }
  };

  const toggleService = (serviceId: number) => {
    setSelectedServices(prev => {
      if (prev.includes(serviceId)) {
        return prev.filter(id => id !== serviceId);
      } else {
        return [...prev, serviceId];
      }
    });
  };

  /**
   * Calcola il totale dei servizi extra selezionati, moltiplicando per notti/persone se necessario.
   * @param opts opzionale: quote (notti, adulti, bambini) per calcoli corretti
   */
  const getTotalCost = (opts?: { nights?: number; adults?: number; children?: number; guests?: number }) => {
    // fallback: 1 notte, 2 adulti, 0 bambini se non specificato
    const nights = opts?.nights ?? 1;
    const adults = opts?.adults ?? 2;
    const children = opts?.children ?? 0;
    const guests = opts?.guests ?? (adults + children);

    return selectedServices.reduce((total, serviceId) => {
      const service = services.find(s => s.id === serviceId);
      if (!service || service.included) return total;

      let multiplier = 1;
      switch (service.unit) {
        case 'notte':
        case 'per_night':
          multiplier = nights;
          break;
        case 'persona':
        case 'per_person':
          multiplier = guests;
          break;
        case 'per_person_per_day':
          multiplier = guests * nights;
          break;
        case 'soggiorno':
        case 'per_stay':
        default:
          multiplier = 1;
      }
      return total + (service.price * multiplier);
    }, 0);
  };

  const getSelectedServices = () => {
    return services.filter(service => selectedServices.includes(service.id));
  };

  // Funzioni specifiche per il parcheggio
  const getParkingService = () => {
    return services.find(service => service.isParking || service.category === 'parcheggio');
  };

  const isParkingSelected = () => {
    const parkingService = getParkingService();
    return parkingService ? selectedServices.includes(parkingService.id) : false;
  };

  const toggleParking = (enable: boolean) => {
    const parkingService = getParkingService();
    if (parkingService) {
      if (enable && !selectedServices.includes(parkingService.id)) {
        setSelectedServices(prev => [...prev, parkingService.id]);
      } else if (!enable && selectedServices.includes(parkingService.id)) {
        setSelectedServices(prev => prev.filter(id => id !== parkingService.id));
      }
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  // Ricarica servizi ogni 10 secondi per aggiornamenti admin più rapidi
  useEffect(() => {
    const interval = setInterval(fetchServices, 10000);
    return () => clearInterval(interval);
  }, []);

  // 🔥 NUOVO: Filtra solo servizi attivi per il frontend
  const activeServices = services.filter(service => service.active !== false);

  return {
    services: activeServices, // 🔥 Restituisce solo servizi attivi
    loading,
    error,
    selectedServices,
    toggleService,
    getTotalCost,
    getSelectedServices,
    refreshServices: fetchServices, // 🔥 NUOVO: Funzione per refresh manuale
    // Funzioni specifiche per parcheggio
    getParkingService,
    isParkingSelected,
    toggleParking
  };
};