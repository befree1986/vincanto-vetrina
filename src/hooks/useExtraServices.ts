// Hook per caricare servizi extra dinamici dal pannello admin
import { useState, useEffect } from 'react';

export interface ExtraService {
  id: number;
  name: string;
  price: number;
  unit: 'soggiorno' | 'notte' | 'persona';
  description?: string;
  category: 'bambini' | 'animali' | 'comfort' | 'comodita';
  available: boolean;
  minAge?: number;
  maxAge?: number;
}

interface ExtraServicesData {
  services: ExtraService[];
  loading: boolean;
  error: string | null;
  selectedServices: number[];
  toggleService: (serviceId: number) => void;
  getTotalCost: () => number;
  getSelectedServices: () => ExtraService[];
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
      console.error('❌ EXTRA SERVICES: Errore caricamento:', err);
      setError(err instanceof Error ? err.message : 'Errore sconosciuto');
      
      // Fallback servizi base
      setServices([
        { 
          id: 1, 
          name: 'Culla per bambini (0-3 anni)', 
          price: 30, 
          unit: 'soggiorno',
          description: 'Culla sicura per i più piccoli',
          category: 'bambini',
          available: true,
          minAge: 0,
          maxAge: 3
        }
      ]);
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
    getSelectedServices
  };
};