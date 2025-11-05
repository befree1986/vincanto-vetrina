import React, { useEffect, useState } from 'react';
import { useDynamicPricing } from '../hooks/useDynamicPricing';
import DynamicPriceText from './DynamicPriceText';

/**
 * Componente di debug per verificare il comportamento della tassa di soggiorno
 */
const TouristTaxDebug: React.FC = () => {
  const pricing = useDynamicPricing();
  const [apiData, setApiData] = useState<any>(null);

  useEffect(() => {
    // Test diretto dell'API
    const testApi = async () => {
      try {
        const response = await fetch('/api/quote?checkIn=2025-12-01&checkOut=2025-12-02&guests=2&includeParking=false');
        const data = await response.json();
        setApiData(data);
      } catch (error) {
        console.error('Errore test API:', error);
      }
    };

    testApi();
  }, []);

  return (
    <div style={{
      position: 'fixed',
      top: '10px',
      right: '10px',
      background: 'rgba(0,0,0,0.8)',
      color: 'white',
      padding: '15px',
      borderRadius: '8px',
      fontSize: '12px',
      zIndex: 9999,
      maxWidth: '300px'
    }}>
      <h4>🚧 DEBUG TASSA SOGGIORNO</h4>
      
      <div style={{ marginBottom: '10px' }}>
        <strong>Hook useDynamicPricing:</strong><br />
        Loading: {pricing.loading ? 'Sì' : 'No'}<br />
        Error: {pricing.error || 'Nessuno'}<br />
        Tourist Tax: €{pricing.touristTax}<br />
      </div>

      <div style={{ marginBottom: '10px' }}>
        <strong>DynamicPriceText Component:</strong><br />
        <DynamicPriceText 
          type="touristTax" 
          fallback="FALLBACK"
          format={(price) => `${price.toFixed(2)}€`}
        />
      </div>

      {apiData && (
        <div style={{ marginBottom: '10px' }}>
          <strong>API Diretta:</strong><br />
          Tourist Tax: €{apiData.pricingConfig?.touristTax || 'N/A'}<br />
          Timestamp: {new Date().toLocaleTimeString()}
        </div>
      )}

      <button 
        onClick={() => window.location.reload()} 
        style={{ 
          padding: '5px 10px', 
          background: '#007bff', 
          color: 'white', 
          border: 'none', 
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '11px'
        }}
      >
        Ricarica
      </button>
    </div>
  );
};

export default TouristTaxDebug;