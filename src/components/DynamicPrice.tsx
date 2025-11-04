// Componente per mostrare prezzi dinamici nelle traduzioni
import React from 'react';
import useDynamicPricing from '../hooks/useDynamicPricing';

interface DynamicPriceProps {
  type: 'parking' | 'basePrice' | 'additionalGuest';
  suffix?: string;
  prefix?: string;
}

export const DynamicPrice: React.FC<DynamicPriceProps> = ({ type, suffix = '', prefix = '€' }) => {
  const pricing = useDynamicPricing();

  if (pricing.loading) {
    return <span>...</span>;
  }

  if (pricing.error) {
    // Fallback in caso di errore
    const fallbacks = {
      parking: 15,
      basePrice: 75,
      additionalGuest: 75
    };
    return <span>{prefix}{fallbacks[type]}{suffix}</span>;
  }

  const getValue = () => {
    switch (type) {
      case 'parking':
        return pricing.parkingFee;
      case 'basePrice':
        return pricing.basePrice;
      case 'additionalGuest':
        return pricing.additionalGuestPrice;
      default:
        return 0;
    }
  };

  return <span>{prefix}{getValue()}{suffix}</span>;
};

export default DynamicPrice;