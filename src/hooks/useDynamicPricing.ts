// Hook per caricare prezzi dinamici dal pannello admin
import { useState, useEffect } from 'react';
import { debugLog } from '../utils/debug';

interface PricingConfig {
  priceGroup1to2: number;
  priceGroup3to4: number;
  priceGroup5to6: number;
  parkingFee: number; // Re-added
  cleaningFee: number;
  touristTaxAdult: number;
  minStay: number;
  priceGroup7to8: number;
  loading: boolean;
  error: string | null;
}

export const useDynamicPricing = (): PricingConfig => {
  const [pricing, setPricing] = useState<PricingConfig>({
    priceGroup1to2: 75,
    priceGroup3to4: 95,
    priceGroup5to6: 115,
    priceGroup7to8: 135,
    parkingFee: 20, // Fallback
    cleaningFee: 50,
    touristTaxAdult: 2, // Fallback
    minStay: 3,
    loading: true,
    error: null
  });

  const fetchPricing = async () => {
    setPricing(prev => ({ ...prev, loading: true }));
    try {
      debugLog.log('🔄 DYNAMIC PRICING: Caricamento prezzi dal server...');

      // 🎯 USA API PRICING-CONFIG (stessa usata dall'admin)
      const timestamp = new Date().getTime();
      const response = await fetch(`/api/unified?action=pricing-config&_t=${timestamp}`);

      if (response.ok) {
        const data = await response.json();
        debugLog.log('💰 DYNAMIC PRICING: Risposta API pricing-config:', data);

        if (data.success && data.pricing) {
          const config = data.pricing;
          debugLog.log('🔍 DYNAMIC PRICING: Configurazione trovata:', config);

          setPricing(prev => ({
            ...prev,
            priceGroup1to2: parseFloat(config.priceGroup1to2) || prev.priceGroup1to2,
            priceGroup3to4: parseFloat(config.priceGroup3to4) || prev.priceGroup3to4,
            priceGroup5to6: parseFloat(config.priceGroup5to6) || prev.priceGroup5to6,
            priceGroup7to8: parseFloat(config.priceGroup7to8) || prev.priceGroup7to8,
            parkingFee: parseFloat(config.parkingFee) || prev.parkingFee,
            cleaningFee: parseFloat(config.cleaningFee) || prev.cleaningFee,
            touristTaxAdult: parseFloat(config.touristTaxAdult) || prev.touristTaxAdult,
            minStay: parseInt(config.minStay) || 3,
            loading: false,
            error: null
          }));
          debugLog.log('✅ Prezzi dinamici caricati con successo');
        } else {
          throw new Error('Formato risposta API non valido');
        }
      } else {
        throw new Error(`API Error: ${response.status}`);
      }
    } catch (error) {
      debugLog.error('❌ Errore caricamento prezzi dinamici:', error);
      setPricing(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Errore sconosciuto'
      }));
    }
  };

  useEffect(() => {
    // ✅ Carica prezzi SOLO UNA VOLTA all'init
    debugLog.log('📋 DYNAMIC PRICING: Caricamento iniziale prezzi...');
    fetchPricing();

    // ❌ RIMOSSO LOOP INFINITO - causava sovraccarico
    // Il caricamento avviene solo al mount del componente
  }, []); // ✅ Empty deps = esegue solo al mount

  return pricing;
};

export default useDynamicPricing;