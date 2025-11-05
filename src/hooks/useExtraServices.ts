// Hook per caricare servizi extra dinamici dal pannello admin
import { useState, useEffect } from 'react';

export interface ExtraService {
  id: number;
  name: string;
  price: number;
  unit: 'soggiorno' | 'notte' | 'persona';
  description?: string;
  category: 'bambini' | 'animali' | 'comfort' | 'comodita' | 'parcheggio' | 'custom';
  available: boolean;
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
      
      const timestamp = new Date().getTime();
      const response = await fetch(`/api/extra-services?_t=${timestamp}`);
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.success && data.services) {
          setServices(data.services);
          console.log('✅ EXTRA SERVICES: Servizi caricati:', data.services.length);
        } else {
          throw new Error(data.message || 'Errore caricamento servizi');
        }
      } else {
        throw new Error(`Errore HTTP ${response.status}`);
      }
    } catch (err) {
      console.error('❌ EXTRA SERVICES: API non disponibile, uso servizi predefiniti:', err);
      
      // 🔄 WORKAROUND: Servizi predefiniti completi (fino a quando API non funziona)
      setServices([
        { 
          id: 1, 
          name: 'Culla per bambini (0-3 anni)', 
          price: 30, 
          unit: 'soggiorno',
          description: 'Culla sicura e confortevole per i più piccoli',
          category: 'bambini',
          available: true,
          minAge: 0,
          maxAge: 3
        },
        { 
          id: 2, 
          name: 'Seggiolone', 
          price: 15, 
          unit: 'soggiorno',
          description: 'Seggiolone per pasti in sicurezza',
          category: 'bambini', 
          available: true,
          minAge: 0,
          maxAge: 6
        },
        { 
          id: 3, 
          name: 'Animali domestici', 
          price: 25, 
          unit: 'soggiorno',
          description: 'Supplemento per animali domestici (max 2)',
          category: 'animali',
          available: true
        },
        { 
          id: 4, 
          name: 'Set biancheria extra', 
          price: 20, 
          unit: 'soggiorno',
          description: 'Set aggiuntivo di lenzuola e asciugamani',
          category: 'comfort',
          available: true
        },
        { 
          id: 5, 
          name: 'Check-in anticipato (ore 12:00)', 
          price: 40, 
          unit: 'soggiorno',
          description: 'Check-in 3 ore prima del normale (soggetto a disponibilità)',
          category: 'comodita',
          available: true
        },
        { 
          id: 6, 
          name: 'Check-out posticipato (ore 14:00)', 
          price: 40, 
          unit: 'soggiorno',
          description: 'Check-out 3 ore dopo il normale (soggetto a disponibilità)',
          category: 'comodita',
          available: true
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

  const getTotalCost = () => {
    return selectedServices.reduce((total, serviceId) => {
      const service = services.find(s => s.id === serviceId);
      return total + (service ? service.price : 0);
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

  // Ricarica servizi ogni 30 secondi per aggiornamenti admin
  useEffect(() => {
    const interval = setInterval(fetchServices, 30000);
    return () => clearInterval(interval);
  }, []);

  return {
    services,
    loading,
    error,
    selectedServices,
    toggleService,
    getTotalCost,
    getSelectedServices,
    // Funzioni specifiche per parcheggio
    getParkingService,
    isParkingSelected,
    toggleParking
  };
};