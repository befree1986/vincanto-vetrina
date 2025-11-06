import React from 'react';
import { useDynamicPricing } from '../hooks/useDynamicPricing';

/**
 * Componente di debug per verificare lo stato dell'hook useDynamicPricing
 * Da rimuovere dopo il debug
 */
const DynamicPricingDebug: React.FC = () => {
  const pricing = useDynamicPricing();

  return (
    <div className="dynamic-pricing-debug">
      <h4 className="debug-title">🔍 DEBUG Prezzi Dinamici</h4>
      <div><strong>Loading:</strong> {pricing.loading ? 'SÌ' : 'NO'}</div>
      <div><strong>Error:</strong> {pricing.error || 'Nessuno'}</div>
      <div><strong>Base Price:</strong> €{pricing.basePrice}</div>
      <div><strong>Parking Fee:</strong> €{pricing.parkingFee}</div>
      <div><strong>Cleaning Fee:</strong> €{pricing.cleaningFee}</div>
      <div><strong>Tourist Tax:</strong> €{pricing.touristTax}</div>
      <div><strong>Additional Guest:</strong> €{pricing.additionalGuestPrice}</div>
      <div className="debug-timestamp">
        Aggiornamento: {new Date().toLocaleTimeString()}
      </div>
    </div>
  );
};

export default DynamicPricingDebug;