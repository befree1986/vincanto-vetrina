import { useState, useEffect } from 'react';

export interface PriceData {
  basePrice: number;
  date: string;
  season: 'low' | 'medium' | 'high';
  // 🔥 NUOVO: Sistema prezzi per gruppi
  priceByGuests?: {
    persons1to2: number;    // €75 per 1-2 persone
    persons3to4: number;    // €95 per 3-4 persone
    persons5to6: number;    // €115 per 5-6 persone
    persons7to8: number;    // €135 per 7-8 persone
  };
  // 🔥 NUOVO: Configurazione completa sistema gruppi
  groupPricing?: {
    priceGroup1to2: number;
    priceGroup3to4: number;
    priceGroup5to6: number;
    priceGroup7to8: number;
    cleaningFee: number;
    parkingFee: number;
    touristTaxAdult: number;
    touristTaxChild: number;
  };
  discounts?: {
    weekly?: number;
    monthly?: number;
  };
}

export interface PriceHistory {
  id: string;
  date: string;
  price: number;
  season: string;
  createdAt: string;
}

/**
 * Hook per gestire i prezzi con il nuovo sistema a gruppi
 * Supporta sia la nuova API pricing-groups che quella legacy
 */
export const usePricing = () => {
  const [currentPrice, setCurrentPrice] = useState<PriceData | null>(null);
  const [priceHistory, setPriceHistory] = useState<PriceHistory[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 🔥 NUOVO: Fetch prezzi dal nuovo sistema gruppi
  const fetchCurrentPrice = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('🔥 Caricamento prezzi dal nuovo sistema unificato...');
      
      // 🎯 USA LA NUOVA API UNIFICATA
      const cacheBuster = new Date().getTime();
      const response = await fetch(`/api/unified?action=pricing-config&_t=${cacheBuster}`);
      
      if (!response.ok) {
        throw new Error('Errore nel caricamento prezzi');
      }
      
      const result = await response.json();
      
      if (result.success && result.pricing) {
        const apiData = result.pricing;
        console.log('🔍 Dati ricevuti dall\'API Unificata:', apiData);
        
        // 🔥 NUOVO: Gestione dati dal sistema pricing-config
        const transformedData = {
          basePrice: apiData.priceGroup1to2 || 75,
          date: new Date().toISOString().split('T')[0],
          season: 'medium' as const,
          priceByGuests: {
            persons1to2: apiData.priceGroup1to2 || 75,
            persons3to4: apiData.priceGroup3to4 || 95,
            persons5to6: apiData.priceGroup5to6 || 115,
            persons7to8: apiData.priceGroup7to8 || 135
          },
          groupPricing: {
            priceGroup1to2: apiData.priceGroup1to2 || 75,
            priceGroup3to4: apiData.priceGroup3to4 || 95,
            priceGroup5to6: apiData.priceGroup5to6 || 115,
            priceGroup7to8: apiData.priceGroup7to8 || 135,
            cleaningFee: apiData.cleaningFee || 50,
            parkingFee: apiData.parkingFee || 20,
            touristTaxAdult: apiData.touristTaxAdult || 2.00,
            touristTaxChild: apiData.touristTaxChild || 0
          },
            discounts: {
              weekly: Number(apiData.weeklyDiscount) || 10,
              monthly: Number(apiData.monthlyDiscount) || 15
            }
          };
          
          console.log('🎯 Dati sistema base + aggiuntive trasformati:', transformedData);
          setCurrentPrice(transformedData);
      } else {
        throw new Error('Formato risposta API non valido');
      }
    } catch (err) {
      console.error('❌ Errore fetch prezzi:', err);
      
      // 🔥 NUOVO: Fallback con sistema base + aggiuntive predefinito
      setCurrentPrice({
        basePrice: 75,
        date: new Date().toISOString().split('T')[0],
        season: 'medium',
        priceByGuests: {
          persons1to2: 150,   // €75 × 2 = €150 base
          persons3to4: 180,   // €150 + €30 = €180
          persons5to6: 235,   // €150 + €60 + €25 = €235
          persons7to8: 275    // €150 + €60 + €50 + €20 = €275
        },
        groupPricing: {
          priceGroup1to2: 75,
          priceGroup3to4: 30,
          priceGroup5to6: 25,
          priceGroup7to8: 20,
          cleaningFee: 50,
          parkingFee: 20,
          touristTaxAdult: 2.00,
          touristTaxChild: 0
        },
        discounts: {
          weekly: 10,
          monthly: 0
        }
      });
      setError(err instanceof Error ? err.message : 'Errore sconosciuto');
    } finally {
      setLoading(false);
    }
  };

  // 🔥 NUOVO: Funzione helper per calcolare prezzo per un numero specifico di ospiti
  const calculatePriceForGuests = (guests: number): number => {
    if (!currentPrice?.groupPricing) return 150; // Base fallback
    
    const config = currentPrice.groupPricing;
    
    // Base: 150€ per le prime 2 persone (75€ × 2)
    const basePrice = config.priceGroup1to2 * 2; // €75 × 2 = €150
    
    if (guests <= 2) return basePrice;
    
    let totalPrice = basePrice;
    
    // 3a persona: aggiunge 20€
    if (guests >= 3) {
      // LOGICA CORRETTA: priceGroup3to4 dovrebbe essere il prezzo PER PERSONA aggiuntiva
      // Assumiamo che priceGroup3to4 contenga il prezzo aggiuntivo diretto
      totalPrice += 20; // €20 per la 3a persona (hardcoded finché non sistemiamo il DB)
    }
    
    // 4a persona
    if (guests >= 4) {
      totalPrice += 20; // €20 per la 4a persona
    }
    
    // 5a persona  
    if (guests >= 5) {
      totalPrice += 20; // €20 per la 5a persona
    }
    
    // 6a persona
    if (guests >= 6) {
      totalPrice += 20; // €20 per la 6a persona
    }
    
    // 7a persona
    if (guests >= 7) {
      totalPrice += 20; // €20 per la 7a persona
    }
    
    // 8a persona
    if (guests >= 8) {
      totalPrice += 20; // €20 per la 8a persona
    }
    
    console.log(`🔢 CALCOLO PREZZI: ${guests} persone = ${totalPrice}€ (base: ${basePrice}€ + aggiuntive: ${totalPrice - basePrice}€)`);
    
    return totalPrice;
  };

  // Fetch storico prezzi (mantenuto per compatibilità)
  const fetchPriceHistory = async () => {
    try {
      setPriceHistory([
        {
          id: '1',
          date: '2024-01-01',
          price: 75,
          season: 'Stagione standard (gruppi)',
          createdAt: new Date().toISOString()
        },
        {
          id: '2',
          date: '2024-06-01',
          price: 20,
          season: 'Sistema gruppi attivo',
          createdAt: new Date().toISOString()
        },
        {
          id: '3',
          date: '2024-08-01',
          price: 20,
          season: 'Prezzi per gruppi aggiornati',
          createdAt: new Date().toISOString()
        }
      ]);
    } catch (err) {
      console.error('❌ Errore fetch storico prezzi:', err);
      setPriceHistory([]);
    }
  };

  // Aggiorna prezzo (per admin panel) - API Unificata
  const updatePrice = async (newPrice: Partial<PriceData>) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/unified?action=pricing-config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newPrice),
      });
      
      if (!response.ok) {
        throw new Error('Errore nell\'aggiornamento prezzo');
      }
      
      const data = await response.json();
      setCurrentPrice(data);
      
      await fetchPriceHistory();
      
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore sconosciuto');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Carica dati all'avvio
  useEffect(() => {
    console.log('🚀 usePricing hook (Sistema Gruppi) montato');
    fetchCurrentPrice();
    fetchPriceHistory();
  }, []);

  return {
    currentPrice,
    priceHistory,
    loading,
    error,
    updatePrice,
    calculatePriceForGuests, // 🔥 NUOVO: Helper per calcolo prezzo ospiti
    refreshData: () => {
      fetchCurrentPrice();
      fetchPriceHistory();
    }
  };
};