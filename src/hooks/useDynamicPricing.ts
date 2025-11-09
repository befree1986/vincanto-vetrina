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
        
        // 🎯 USA LA NUOVA API UNIFICATA per i prezzi dinamici
        const timestamp = new Date().getTime();
        const response = await fetch(`/api/unified?action=quote&checkIn=2025-12-01&checkOut=2025-12-02&guests=2&includeParking=false&_t=${timestamp}`);
        
        if (response.ok) {
          const data = await response.json();
          console.log('💰 DYNAMIC PRICING: Risposta API quote ricevuta:', data);
          console.log('🔍 DYNAMIC PRICING: Struttura dati:', {
            success: data.success,
            parkingPerNight: data.parkingPerNight,
            cleaningFee: data.cleaningFee,
            pricingConfig: data.pricingConfig
          });
          
          if (data.success && data.pricing) {
            // L'API restituisce i dati in data.pricing.config, non data.pricingConfig
            const config = data.pricing.config || {};
            console.log('🔍 DYNAMIC PRICING: Configurazione trovata:', config);
            
            setPricing(prev => ({
              ...prev,
              basePrice: parseFloat(config.base_price || config.basePrice) || prev.basePrice,
              parkingFee: parseFloat(config.parking_fee || config.parkingFee) || prev.parkingFee,
              cleaningFee: parseFloat(config.cleaning_fee || config.cleaningFee) || prev.cleaningFee,
              touristTax: parseFloat(config.tourist_tax_adult || config.touristTaxAdult) || prev.touristTax,
              additionalGuestPrice: parseFloat(config.additional_guest_3to4 || config.additionalGuest3to4) || prev.additionalGuestPrice,
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