import React from 'react';
import { useDynamicPricing } from '../hooks/useDynamicPricing';

/**
 * Componente di debug per verificare lo stato dell'hook useDynamicPricing
 * Da rimuovere dopo il debug
 */
const DynamicPricingDebug: React.FC = () => {
  const pricing = useDynamicPricing();

  return (
    <div style={{
      position: 'fixed',
      top: '10px',
      right: '10px',
      backgroundColor: '#f0f0f0',
      border: '2px solid #666',
      borderRadius: '8px',
      padding: '10px',
      fontSize: '12px',
      fontFamily: 'monospace',
      zIndex: 9999,
      maxWidth: '300px'
    }}>
      <h4 style={{ margin: '0 0 8px 0', color: '#333' }}>🔍 DEBUG Prezzi Dinamici</h4>
      <div><strong>Loading:</strong> {pricing.loading ? 'SÌ' : 'NO'}</div>
      <div><strong>Error:</strong> {pricing.error || 'Nessuno'}</div>
      <div><strong>Base Price:</strong> €{pricing.basePrice}</div>
      <div><strong>Parking Fee:</strong> €{pricing.parkingFee}</div>
      <div><strong>Cleaning Fee:</strong> €{pricing.cleaningFee}</div>
      <div><strong>Tourist Tax:</strong> €{pricing.touristTax}</div>
      <div><strong>Additional Guest:</strong> €{pricing.additionalGuestPrice}</div>
      <div style={{ marginTop: '8px', fontSize: '10px', color: '#666' }}>
        Aggiornamento: {new Date().toLocaleTimeString()}
      </div>
    </div>
  );
};

export default DynamicPricingDebug;