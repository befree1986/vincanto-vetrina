import { useState, useEffect } from 'react';

export interface PriceData {
  basePrice: number;
  date: string;
  season: 'low' | 'medium' | 'high';
  priceByGuests?: {
    persons1to2: number;
    persons3to4: number;
    persons5to6: number;
    persons7to8: number;
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

export const usePricing = () => {
  const [currentPrice, setCurrentPrice] = useState<PriceData | null>(null);
  const [priceHistory, setPriceHistory] = useState<PriceHistory[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch prezzi dal database/API
  const fetchCurrentPrice = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Chiamata API al server online Vercel
      const response = await fetch('/api/pricing');
      
      if (!response.ok) {
        throw new Error('Errore nel caricamento prezzi');
      }
      
      const result = await response.json();
      
      if (result.success && result.data) {
        // Trasforma i dati dall'API nel formato atteso dall'hook
        const apiData = result.data;
        
        // Debug: log dei dati ricevuti dall'API
        console.log('🔍 Dati ricevuti dall\'API pricing:', apiData);
        console.log('🔍 basePrice:', apiData.basePrice);
        console.log('🔍 additionalGuestPrice:', apiData.additionalGuestPrice);
        
        // Valori con fallback più robusti
        const basePrice = Number(apiData.basePrice) || 85;
        const additionalGuestPrice = Number(apiData.additionalGuestPrice) || 25;
        
        const transformedData = {
          basePrice: basePrice,
          date: new Date().toISOString().split('T')[0],
          season: 'medium' as const,
          priceByGuests: {
            persons1to2: basePrice,
            persons3to4: basePrice + additionalGuestPrice,
            persons5to6: basePrice + (additionalGuestPrice * 2),
            persons7to8: basePrice + (additionalGuestPrice * 3)
          },
          discounts: {
            weekly: Number(apiData.weeklyDiscount) || 10,
            monthly: Number(apiData.monthlyDiscount) || 15
          }
        };
        
        console.log('🎯 Dati trasformati per la tabella:', transformedData);
        setCurrentPrice(transformedData);
      } else {
        throw new Error('Formato dati API non valido');
      }
    } catch (err) {
      console.error('Errore fetch prezzi:', err);
      // Fallback ai prezzi di default
      setCurrentPrice({
        basePrice: 75,
        date: new Date().toISOString().split('T')[0],
        season: 'medium',
        priceByGuests: {
          persons1to2: 80,
          persons3to4: 100,
          persons5to6: 120,
          persons7to8: 140
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

  // Fetch storico prezzi
  const fetchPriceHistory = async () => {
    try {
      // Temporaneamente disabilitato per evitare limite API Vercel
      // const response = await fetch('/api/pricing/history');
      
      // Usa sempre dati di fallback per ora
      setPriceHistory([
        {
          id: '1',
          date: '2024-01-01',
          price: 65,
          season: 'Bassa stagione',
          createdAt: new Date().toISOString()
        },
        {
          id: '2',
          date: '2024-06-01',
          price: 75,
          season: 'Media stagione',
          createdAt: new Date().toISOString()
        },
        {
          id: '3',
          date: '2024-08-01',
          price: 85,
          season: 'Alta stagione',
          createdAt: new Date().toISOString()
        }
      ]);
    } catch (err) {
      console.error('Errore fetch storico prezzi:', err);
      // Usa dati di fallback
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
      
      // Ricarica lo storico
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
    fetchCurrentPrice();
    fetchPriceHistory();
  }, []);

  return {
    currentPrice,
    priceHistory,
    loading,
    error,
    updatePrice,
    refreshData: () => {
      fetchCurrentPrice();
      fetchPriceHistory();
    }
  };
};