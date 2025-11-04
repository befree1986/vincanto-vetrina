import React from 'react';
import { useDynamicPricing } from '../hooks/useDynamicPricing';

interface DynamicPriceTextProps {
  type: 'basePrice' | 'cleaningFee' | 'parkingFee' | 'touristTax';
  fallback: string;
  format?: (price: number) => string;
}

/**
 * Componente per mostrare prezzi dinamici nei testi
 * Sostituisce i prezzi hardcoded nelle traduzioni con valori dal pannello admin
 */
const DynamicPriceText: React.FC<DynamicPriceTextProps> = ({ 
  type, 
  fallback, 
  format 
}) => {
  const pricing = useDynamicPricing();

  if (pricing.loading) {
    return <span className="dynamic-price loading">...</span>;
  }

  if (pricing.error) {
    return <span className="dynamic-price error">{fallback}</span>;
  }

  let price: number;
  switch (type) {
    case 'basePrice':
      price = pricing.basePrice;
      break;
    case 'cleaningFee':
      price = pricing.cleaningFee;
      break;
    case 'parkingFee':
      price = pricing.parkingFee;
      break;
    case 'touristTax':
      price = pricing.touristTax;
      break;
    default:
      return <span className="dynamic-price error">{fallback}</span>;
  }

  const formattedPrice = format ? format(price) : `€${price}`;

  return (
    <span className="dynamic-price loaded" title={`Prezzo aggiornato dal pannello admin: ${formattedPrice}`}>
      {formattedPrice}
    </span>
  );
};

export default DynamicPriceText;