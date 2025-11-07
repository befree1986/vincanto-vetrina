import { useState, useEffect } from 'react';

export interface PriceData {
  basePrice: number;
  date: string;
  season: 'low' | 'medium' | 'high';
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
      // Simula chiamata API - sostituire con vera chiamata al backend
      const response = await fetch('/api/pricing/current');
      
      if (!response.ok) {
        throw new Error('Errore nel caricamento prezzi');
      }
      
      const data = await response.json();
      setCurrentPrice(data);
    } catch (err) {
      console.error('Errore fetch prezzi:', err);
      // Fallback ai prezzi di default
      setCurrentPrice({
        basePrice: 75,
        date: new Date().toISOString().split('T')[0],
        season: 'medium',
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
      const response = await fetch('/api/pricing/history');
      
      if (response.ok) {
        const data = await response.json();
        setPriceHistory(data);
      } else {
        // Fallback con dati di esempio
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
      }
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