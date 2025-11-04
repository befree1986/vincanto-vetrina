// Hook per caricare prezzi dinamici dal pannello admin
import { useState, useEffect } from 'react';

interface PricingData {
  basePrice: number;
  parkingFee: number;
  cleaningFee: number;
  touristTax: number;
  additionalGuestPrice: number;
  loading: boolean;
  error: string | null;
}

export const useDynamicPricing = (): PricingData => {
  const [pricing, setPricing] = useState<PricingData>({
    basePrice: 75, // Fallback
    parkingFee: 15, // Fallback
    cleaningFee: 50, // Fallback
    touristTax: 2, // Fallback
    additionalGuestPrice: 75, // Fallback
    loading: true,
    error: null
  });

  const fetchPricing = async () => {
    setPricing(prev => ({ ...prev, loading: true }));
      try {
        console.log('🔄 DYNAMIC PRICING: Caricamento prezzi dal server...');
        
        // Aggiungi timestamp per evitare cache
        const timestamp = new Date().getTime();
        const response = await fetch(`/api/quote?checkIn=2025-12-01&checkOut=2025-12-02&guests=2&includeParking=false&_t=${timestamp}`);
        
        if (response.ok) {
          const data = await response.json();
          console.log('💰 DYNAMIC PRICING: Risposta API quote ricevuta:', data);
          console.log('🔍 DYNAMIC PRICING: Struttura dati:', {
            success: data.success,
            parkingPerNight: data.parkingPerNight,
            cleaningFee: data.cleaningFee,
            pricingConfig: data.pricingConfig
          });
          
          if (data.success && data.pricingConfig) {
            setPricing(prev => ({
              ...prev,
              basePrice: data.pricingConfig.basePrice || prev.basePrice,
              parkingFee: data.pricingConfig.parkingFee || prev.parkingFee,
              cleaningFee: data.pricingConfig.cleaningFee || prev.cleaningFee,
              touristTax: data.pricingConfig.touristTax || prev.touristTax,
              additionalGuestPrice: data.pricingConfig.additionalGuestPrice || prev.additionalGuestPrice,
              loading: false,
              error: null
            }));
            console.log('✅ Prezzi dinamici caricati con successo');
          } else {
            throw new Error('Formato risposta API non valido');
          }
        } else {
          throw new Error(`API Error: ${response.status}`);
        }
      } catch (error) {
        console.error('❌ Errore caricamento prezzi dinamici:', error);
        setPricing(prev => ({
          ...prev,
          loading: false,
          error: error instanceof Error ? error.message : 'Errore sconosciuto'
        }));
      }
    };

  useEffect(() => {
    // Carica inizialmente
    fetchPricing();
    
    // 🔄 Ricarica ogni 10 secondi per test
    const interval = setInterval(() => {
      console.log('🔄 DYNAMIC PRICING: Auto-refresh prezzi...');
      fetchPricing();
    }, 10000);
    
    return () => clearInterval(interval);
  }, []);

  return pricing;
};

export default useDynamicPricing;