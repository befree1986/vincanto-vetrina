import React from 'react';
import { useTranslation } from 'react-i18next';
import { useDynamicPricing } from '../hooks/useDynamicPricing';
import { getSafeTranslation } from '../i18n';
import DynamicPriceText from './DynamicPriceText';
import './DynamicPricingSections.css';

/**
 * Componente che sostituisce le sezioni hardcoded con prezzi dinamici
 */
const DynamicPricingSections: React.FC = () => {
  const { t } = useTranslation();
  const pricing = useDynamicPricing();

  return (
    <div className="dynamic-pricing-sections">
      {/* Servizi Inclusi */}
      <section className="included-services">
        <h2 className="section-title">{getSafeTranslation(t, 'section.includedServices.title', 'Servizi Inclusi')}</h2>
        
        <div className="included-group">
          <h4 className="section-subtitle">{getSafeTranslation(t, 'section.includedServices.comfortTitle', 'Comfort & Benessere')}</h4>
          <ul className="section-list">
            <li>{getSafeTranslation(t, 'section.includedServices.comfortList1', 'Biancheria letto e bagno')}</li>
            <li>{getSafeTranslation(t, 'section.includedServices.comfortList2', 'Asciugacapelli')}</li>
            <li>{getSafeTranslation(t, 'section.includedServices.comfortList3', 'Ferro e asse da stiro')}</li>
            <li>{getSafeTranslation(t, 'section.includedServices.comfortList4', 'Lavatrice')}</li>
            <li>{getSafeTranslation(t, 'section.includedServices.comfortList5', 'Climatizzazione')}</li>
            <li>{getSafeTranslation(t, 'section.includedServices.comfortList6', 'Riscaldamento')}</li>
            <li>{getSafeTranslation(t, 'section.includedServices.comfortList7', 'Cucina attrezzata')}</li>
            <li>{getSafeTranslation(t, 'section.includedServices.comfortList8', 'Frigorifero')}</li>
            <li>{getSafeTranslation(t, 'section.includedServices.comfortList9', 'Microonde')}</li>
            <li>{getSafeTranslation(t, 'section.includedServices.comfortList10', 'TV')}</li>
            <li>{getSafeTranslation(t, 'section.includedServices.comfortList11', 'Terrazza privata')}</li>
            <li>{getSafeTranslation(t, 'section.includedServices.comfortList12', 'Vista mare')}</li>
          </ul>
        </div>

        <div className="included-group">
          <h4 className="section-subtitle">{getSafeTranslation(t, 'section.includedServices.connectivityTitle', 'Connettività')}</h4>
          <ul className="section-list">
            <li>{getSafeTranslation(t, 'section.includedServices.connectivityList1', 'WiFi gratuito')}</li>
            <li>{getSafeTranslation(t, 'section.includedServices.connectivityList2', 'Netflix incluso')}</li>
          </ul>
        </div>
      </section>

      {/* Costi Extra con Prezzi Dinamici */}
      <section className="extra-costs">
        <h2 className="section-title">💰 Costi Extra (non inclusi)</h2>

        <div className="cost-group">
          <h4 className="section-subtitle">Obbligatori</h4>
          <ul className="section-list">
            <li>
              Pulizia finale obbligatoria: <DynamicPriceText 
                type="cleaningFee" 
                fallback="50€"
                format={(price) => `${price}€`}
              />
            </li>
            <li>
              Tassa di soggiorno: <DynamicPriceText 
                type="touristTax" 
                fallback="2,00€"
                format={(price) => `${price.toFixed(2)}€ a persona a notte`}
              /> (maggiori di 12 anni, fino a 5 notti)
            </li>
          </ul>
        </div>

        <div className="cost-group">
          <h4 className="section-subtitle">Su richiesta</h4>
          <ul className="section-list">
            <li>
              Posto auto riservato e custodito: <DynamicPriceText 
                type="parkingFee" 
                fallback="15€"
                format={(price) => `${price}€/giorno`}
              />
            </li>
          </ul>
        </div>
      </section>

      {/* Info Tassa di Soggiorno con Prezzi Dinamici */}
      <div className="tariffe-note">
        <p>
          Tassa di soggiorno: <DynamicPriceText 
            type="touristTax" 
            fallback="2,00€"
            format={(price) => `${price.toFixed(2)}€ a persona a notte`}
          /> (maggiori di 12 anni, fino a 5 notti)
        </p>
        <p>{getSafeTranslation(t, 'propriety.rates.touristTaxExemptions', 'Bambini fino a 12 anni esenti')}</p>
        <p>{getSafeTranslation(t, 'propriety.rates.touristTaxPaymentInfo', 'Da pagare in loco in contanti')}</p>
        <p>
          Per tutti i dettagli, potete consultare il sito del&nbsp;
          <a
            href="https://www.comune.maiori.sa.it/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-link"
          >
            Comune di Maiori
          </a>
        </p>
      </div>

      {/* Loading Indicator */}
      {pricing.loading && (
        <div className="pricing-loading">
          <div className="loading-message">
            🔄 Caricamento prezzi aggiornati dal pannello admin...
          </div>
        </div>
      )}

      {/* Error State */}
      {pricing.error && (
        <div className="pricing-error">
          <div className="error-message">
            ⚠️ Errore caricamento prezzi: {pricing.error}. 
            <br />
            Vengono mostrati i prezzi di default.
          </div>
        </div>
      )}
    </div>
  );
};

export default DynamicPricingSections;