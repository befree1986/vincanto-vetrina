// Hook per caricare servizi extra dinamici dal pannello admin
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

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
  const { t, i18n } = useTranslation();
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
            isParking: service.category === 'parcheggio' || service.category === 'parking'
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
          name: t('extraServices.crib', 'Culla per Bambini'), 
          price: 30, // ✅ Allineato con database
          unit: 'soggiorno',
          description: t('extraServices.cribDesc', 'Culla con biancheria per bambini fino a 7 anni'),
          category: 'bambini',
          available: true,
          included: false,
          minAge: 0,
          maxAge: 6
        },
        { 
          id: 1, 
          name: t('extraServices.lateCheckout', 'Late Check-out'), 
          price: 30, 
          unit: 'soggiorno',
          description: t('extraServices.lateCheckoutDesc', 'Check-out posticipato alle 14:00 invece delle 10:00'),
          category: 'convenience',
          available: true,
          included: false
        },
        { 
          id: 2, 
          name: t('extraServices.earlyCheckin', 'Early Check-in'), 
          price: 25, 
          unit: 'soggiorno',
          description: t('extraServices.earlyCheckinDesc', 'Check-in anticipato dalle 12:00 invece delle 15:00'),
          category: 'convenience',
          available: true,
          included: false
        },
        { 
          id: 4, 
          name: t('extraServices.breakfast', 'Colazione Italiana'), 
          price: 15, 
          unit: 'persona',
          description: t('extraServices.breakfastDesc', 'Colazione italiana completa con prodotti locali'),
          category: 'food',
          available: true,
          included: false
        },
        { 
          id: 8, 
          name: t('extraServices.welcomeKit', 'Kit Welcome'), 
          price: 25, 
          unit: 'soggiorno',
          description: t('extraServices.welcomeKitDesc', 'Kit di benvenuto con prodotti tipici'),
          category: 'gift',
          available: true,
          included: true  // 🎁 SERVIZIO INCLUSO
        },
        {
          id: 9,
          name: t('extraServices.parking', 'Parcheggio Privato'),
          price: 20,
          unit: 'notte',
          description: t('extraServices.parkingDesc', 'Posto auto riservato e custodito'),
          category: 'parcheggio',
          available: true,
          included: false,
          isParking: true
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

    const selected = selectedServices.map(serviceId => services.find(s => s.id === serviceId)).filter(Boolean);
    let debugTotal = 0;
    selected.forEach(service => {
      // ❌ SKIP servizi inclusi (gratuiti) - NON devono sommare al totale
      if (!service || service.included || service.price === 0) {
        console.log('[EXTRA DEBUG][SKIP INCLUDED]', service?.name, 'included:', service?.included, 'price:', service?.price);
        return;
      }
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
      const partial = service.price * multiplier;
      console.log('[EXTRA DEBUG][SOMMA]', service.name, '| unit:', service.unit, '| price:', service.price, '| multiplier:', multiplier, '| partial:', partial);
      debugTotal += partial;
    });
    // LOG DEBUG
    console.log('[EXTRA DEBUG] getTotalCost:', {
      opts: { nights, adults, children, guests },
      selected,
      result: debugTotal
    });
    return debugTotal;
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
  }, [i18n.language]); // 🔥 Ricarica i servizi quando cambia la lingua

  // ✅ Seleziona automaticamente i servizi inclusi (INCLUSI) quando i servizi sono disponibili
  useEffect(() => {
    if (!services || services.length === 0) return;
    const includedIds = services
      .filter(s => (s.included === true) && s.available && s.active !== false)
      .map(s => s.id);
    if (includedIds.length === 0) return;

    setSelectedServices(prev => {
      const merged = new Set<number>([...prev, ...includedIds]);
      return Array.from(merged);
    });
  }, [services]);

  // 🔥 RIMOSSO LOOP REFRESH AUTOMATICO - causava troppi re-render
  // Usa refreshServices() manualmente se serve aggiornare

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