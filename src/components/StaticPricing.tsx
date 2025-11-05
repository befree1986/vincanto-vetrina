import React from 'react';

/**
 * Prezzi statici aggiornati dal database admin per garantire coerenza
 * Questi valori corrispondono agli attuali prezzi nel database
 * TODO: Sostituire con prezzi completamente dinamici quando l'API routing sarà risolto
 */
export const CURRENT_PRICING = {
  basePrice: 75,           // €75 per persona per notte
  additionalGuestPrice: 20, // €20 per persona aggiuntiva per notte  
  parkingFee: 20,          // €20 parcheggio per notte
  cleaningFee: 50,         // €50 pulizia finale
  touristTax: 3,           // €3 tassa soggiorno per persona per notte
  minStay: 1,
  maxStay: 14
} as const;

interface StaticPricingProps {
  type: 'basePrice' | 'additionalGuestPrice' | 'parkingFee' | 'cleaningFee' | 'touristTax';
  format?: (price: number) => string;
  fallback?: string;
}

/**
 * Componente per prezzi statici aggiornati - workaround temporaneo
 */
const StaticPricing: React.FC<StaticPricingProps> = ({ type, format, fallback }) => {
  const price = CURRENT_PRICING[type];
  
  if (!price && fallback) {
    return <span>{fallback}</span>;
  }
  
  const formattedPrice = format ? format(price) : `€${price}`;
  
  return (
    <span className="static-pricing" title={`Prezzo aggiornato dal database admin: ${formattedPrice}`}>
      {formattedPrice}
    </span>
  );
};

export default StaticPricing;