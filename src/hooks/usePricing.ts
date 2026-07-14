import { useState, useEffect } from 'react';
import { log } from '../utils/logger';

export interface PriceData {
  basePrice: number;
  date: string;
  season: 'low' | 'medium' | 'high';
  // 🔥 NUOVO: Sistema prezzi per gruppi
  priceByGuests?: {
    persons1to2: number;    // €70 per 1-2 persone
    persons3to4: number;    // €20 per 3-4 persone
    persons5to6: number;    // €25 per 5-6 persone
    persons7to8: number;    // €30 per 7-8 persone
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
      log('🔥 Caricamento prezzi dal nuovo sistema unificato...');

      // 🎯 USA LA NUOVA API UNIFICATA
      const cacheBuster = new Date().getTime();
      const response = await fetch(`/api/unified?action=pricing-config&_t=${cacheBuster}`);

      if (!response.ok) {
        throw new Error('Errore nel caricamento prezzi');
      }

      const result = await response.json();

      if (result.success && result.pricing) {
        const apiData = result.pricing;
        log('🔍 Dati ricevuti dall\'API Unificata:', apiData);

        // 🔥 NUOVO: Gestione dati dal sistema pricing-config
        const transformedData = {
          basePrice: apiData.priceGroup1to2 || 70,
          date: new Date().toISOString().split('T')[0],
          season: 'medium' as const,
          priceByGuests: {
            persons1to2: apiData.priceGroup1to2 || 70,
            persons3to4: apiData.priceGroup3to4 || 20,
            persons5to6: apiData.priceGroup5to6 || 25,
            persons7to8: apiData.priceGroup7to8 || 30
          },
          groupPricing: {
            priceGroup1to2: apiData.priceGroup1to2 || 70,
            priceGroup3to4: apiData.priceGroup3to4 || 20,
            priceGroup5to6: apiData.priceGroup5to6 || 25,
            priceGroup7to8: apiData.priceGroup7to8 || 30,
            cleaningFee: apiData.cleaningFee || 60,
            parkingFee: apiData.parkingFee || 20,
            touristTaxAdult: apiData.touristTaxAdult || 2.00,
            touristTaxChild: apiData.touristTaxChild || 0
          },
          discounts: {
            weekly: Number(apiData.weeklyDiscount) || 10,
            monthly: Number(apiData.monthlyDiscount) || 15
          }
        };

        log('🎯 Dati sistema base + aggiuntive trasformati:', transformedData);
        setCurrentPrice(transformedData);
      } else {
        throw new Error('Formato risposta API non valido');
      }
    } catch (err) {
      console.error('❌ Errore fetch prezzi:', err);

      // 🔥 NUOVO: Fallback con sistema base + aggiuntive predefinito
      setCurrentPrice({
        basePrice: 70,
        date: new Date().toISOString().split('T')[0],
        season: 'medium',
        priceByGuests: {
          persons1to2: 140,   // €70 × 2 = €140 base
          persons3to4: 160,   // €140 + €20 = €160
          persons5to6: 185,   // €140 + €20 + €25 = €185
          persons7to8: 215    // €140 + €20 + €25 + €30 = €215
        },
        groupPricing: {
          priceGroup1to2: 70,
          priceGroup3to4: 20,
          priceGroup5to6: 25,
          priceGroup7to8: 30,
          cleaningFee: 60,
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
    if (!currentPrice?.groupPricing) return 0;

    const p = currentPrice.groupPricing;
    const g = guests;
    let price = 0;

    if (g > 0) {
      const tier1Guests = Math.min(g, 2);
      price += tier1Guests * (p.priceGroup1to2 || 0);
    }
    if (g > 2) {
      const tier2Guests = Math.min(g - 2, 2);
      price += tier2Guests * (p.priceGroup3to4 || 0);
    }
    if (g > 4) {
      const tier3Guests = Math.min(g - 4, 2);
      price += tier3Guests * (p.priceGroup5to6 || 0);
    }
    if (g > 6) {
      const tier4Guests = Math.min(g - 6, 2);
      price += tier4Guests * (p.priceGroup7to8 || 0);
    }

    log(`🔢 CALCOLO PREZZI FRONTEND: ${guests} persone = ${price}€`);
    return price;
  };

  // Fetch storico prezzi (mantenuto per compatibilità)
  const fetchPriceHistory = async () => {
    try {
      setPriceHistory([
        {
          id: '1',
          date: '2024-01-01',
          price: 70,
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
    log('🚀 usePricing hook (Sistema Gruppi) montato');
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