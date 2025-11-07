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
      console.log('🔥 Caricamento prezzi dal nuovo sistema gruppi...');
      
      // Prima prova la nuova API pricing-groups
      const cacheBuster = new Date().getTime();
      let response = await fetch(`/api/pricing-groups?_t=${cacheBuster}`);
      
      if (!response.ok) {
        console.log('⚠️ API pricing-groups non disponibile, fallback a pricing legacy');
        response = await fetch(`/api/pricing?_t=${cacheBuster}`);
      }
      
      if (!response.ok) {
        throw new Error('Errore nel caricamento prezzi');
      }
      
      const result = await response.json();
      
      if (result.success && result.data) {
        const apiData = result.data;
        console.log('🔍 Dati ricevuti dall\'API:', apiData);
        
        // 🔥 NUOVO: Gestione dati sistema gruppi
        if (apiData.priceGroup1to2) {
          // Sistema gruppi attivo
          console.log('✅ Sistema gruppi rilevato');
          
          const transformedData = {
            basePrice: apiData.priceGroup1to2,
            date: new Date().toISOString().split('T')[0],
            season: 'medium' as const,
            priceByGuests: {
              persons1to2: apiData.priceGroup1to2,    // €75
              persons3to4: apiData.priceGroup3to4,    // €95
              persons5to6: apiData.priceGroup5to6,    // €115
              persons7to8: apiData.priceGroup7to8     // €135
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
          
          console.log('🎯 Dati gruppi trasformati:', transformedData);
          setCurrentPrice(transformedData);
        } else {
          // Sistema legacy - converti al sistema gruppi
          console.log('⚠️ Sistema legacy rilevato, conversione a gruppi');
          
          const basePricePerPerson = Number(apiData.basePrice) || 75;
          const additionalGuestPrice = Number(apiData.additionalGuestPrice) || 20;
          
          const transformedData = {
            basePrice: basePricePerPerson,
            date: new Date().toISOString().split('T')[0],
            season: 'medium' as const,
            priceByGuests: {
              persons1to2: basePricePerPerson,                                  // €75
              persons3to4: basePricePerPerson + additionalGuestPrice,          // €95
              persons5to6: basePricePerPerson + (additionalGuestPrice * 2),    // €115
              persons7to8: basePricePerPerson + (additionalGuestPrice * 3)     // €135
            },
            groupPricing: {
              priceGroup1to2: basePricePerPerson,
              priceGroup3to4: basePricePerPerson + additionalGuestPrice,
              priceGroup5to6: basePricePerPerson + (additionalGuestPrice * 2),
              priceGroup7to8: basePricePerPerson + (additionalGuestPrice * 3),
              cleaningFee: Number(apiData.cleaningFee) || 50,
              parkingFee: Number(apiData.parkingFee) || 20,
              touristTaxAdult: Number(apiData.touristTaxAdult) || 2.00,
              touristTaxChild: Number(apiData.touristTaxChild) || 0
            },
            discounts: {
              weekly: Number(apiData.weeklyDiscount) || 10,
              monthly: Number(apiData.monthlyDiscount) || 15
            }
          };
          
          console.log('🔄 Dati legacy convertiti a gruppi:', transformedData);
          setCurrentPrice(transformedData);
        }
      } else {
        throw new Error('Formato dati API non valido');
      }
    } catch (err) {
      console.error('❌ Errore fetch prezzi:', err);
      
      // 🔥 NUOVO: Fallback con sistema gruppi predefinito
      setCurrentPrice({
        basePrice: 75,
        date: new Date().toISOString().split('T')[0],
        season: 'medium',
        priceByGuests: {
          persons1to2: 75,    // €75 per 1-2 persone
          persons3to4: 95,    // €95 per 3-4 persone
          persons5to6: 115,   // €115 per 5-6 persone
          persons7to8: 135    // €135 per 7-8 persone
        },
        groupPricing: {
          priceGroup1to2: 75,
          priceGroup3to4: 95,
          priceGroup5to6: 115,
          priceGroup7to8: 135,
          cleaningFee: 50,
          parkingFee: 20,
          touristTaxAdult: 2.00,
          touristTaxChild: 0
        },
        discounts: {
          weekly: 10,
          monthly: 15
        }
      });
      setError(err instanceof Error ? err.message : 'Errore sconosciuto');
    } finally {
      setLoading(false);
    }
  };

  // 🔥 NUOVO: Funzione helper per calcolare prezzo per un numero specifico di ospiti
  const calculatePriceForGuests = (guests: number): number => {
    if (!currentPrice?.groupPricing) return 75;
    
    if (guests <= 2) return currentPrice.groupPricing.priceGroup1to2;
    if (guests <= 4) return currentPrice.groupPricing.priceGroup3to4;
    if (guests <= 6) return currentPrice.groupPricing.priceGroup5to6;
    if (guests <= 8) return currentPrice.groupPricing.priceGroup7to8;
    
    // Per più di 8 ospiti, calcola prezzo extra
    return currentPrice.groupPricing.priceGroup7to8 + ((guests - 8) * 20);
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
          price: 95,
          season: 'Sistema gruppi attivo',
          createdAt: new Date().toISOString()
        },
        {
          id: '3',
          date: '2024-08-01',
          price: 115,
          season: 'Prezzi per gruppi aggiornati',
          createdAt: new Date().toISOString()
        }
      ]);
    } catch (err) {
      console.error('❌ Errore fetch storico prezzi:', err);
      setPriceHistory([]);
    }
  };

  // Aggiorna prezzo (per admin panel)
  const updatePrice = async (newPrice: Partial<PriceData>) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/pricing/update', {
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