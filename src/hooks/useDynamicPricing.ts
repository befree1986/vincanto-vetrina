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

  useEffect(() => {
    const fetchPricing = async () => {
      try {
        console.log('🔄 Caricamento prezzi dinamici dal server...');
        
        // Prima prova l'API quote per ottenere i prezzi
        const response = await fetch('/api/quote?checkIn=2025-12-01&checkOut=2025-12-02&guests=2&includeParking=false');
        
        if (response.ok) {
          const data = await response.json();
          console.log('💰 Risposta API quote:', data);
          
          if (data.success && data.pricingConfig) {
            setPricing(prev => ({
              ...prev,
              basePrice: data.pricingConfig.basePrice || prev.basePrice,
              parkingFee: data.parkingPerNight || prev.parkingFee,
              cleaningFee: data.cleaningFee || prev.cleaningFee,
              touristTax: data.touristTaxPerPersonPerNight || prev.touristTax,
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

    fetchPricing();
  }, []);

  return pricing;
};

export default useDynamicPricing;