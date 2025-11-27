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
        
        // 🎯 USA API PRICING-CONFIG (stessa usata dall'admin)
        const timestamp = new Date().getTime();
        const response = await fetch(`/api/unified?action=pricing-config&_t=${timestamp}`);
        
        if (response.ok) {
          const data = await response.json();
          console.log('💰 DYNAMIC PRICING: Risposta API pricing-config:', data);
          
          if (data.success && data.pricing) {
            const config = data.pricing;
            console.log('🔍 DYNAMIC PRICING: Configurazione trovata:', config);
            
            setPricing(prev => ({
              ...prev,
              basePrice: parseFloat(config.priceGroup1to2) || prev.basePrice,
              parkingFee: parseFloat(config.parkingFee) || prev.parkingFee,
              cleaningFee: parseFloat(config.cleaningFee) || prev.cleaningFee,
              touristTax: parseFloat(config.touristTaxAdult) || prev.touristTax,
              additionalGuestPrice: parseFloat(config.priceGroup1to2) || prev.additionalGuestPrice,
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
    // ✅ Carica prezzi SOLO UNA VOLTA all'init
    console.log('📋 DYNAMIC PRICING: Caricamento iniziale prezzi...');
    fetchPricing();
    
    // ❌ RIMOSSO LOOP INFINITO - causava sovraccarico
    // Il caricamento avviene solo al mount del componente
  }, []); // ✅ Empty deps = esegue solo al mount

  return pricing;
};

export default useDynamicPricing;