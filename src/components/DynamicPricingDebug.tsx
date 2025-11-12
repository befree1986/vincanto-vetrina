import React from 'react';
import { useDynamicPricing } from '../hooks/useDynamicPricing';
import { useExtraServices } from '../hooks/useExtraServices';
import './DynamicPricingDebug.css';

/**
 * 🔍 COMPONENTE DEBUG COMPLETO - Prezzi Dinamici & Servizi Extra
 * Monitoring completo di tutto il sistema di pricing
 */
const DynamicPricingDebug: React.FC = () => {
  const pricing = useDynamicPricing();
  const extraServices = useExtraServices();

  return (
    <div className="debug-container">
      <h4 className="debug-title">
        🔍 DEBUG SISTEMA PRICING COMPLETO
      </h4>
      
      {/* SEZIONE 1: PREZZI BASE */}
      <div className="debug-section">
        <h5 className="debug-section-title pricing">💰 PREZZI BASE DINAMICI</h5>
        <div><strong>Status:</strong> 
          <span className={pricing.loading ? 'debug-status-loading' : pricing.error ? 'debug-status-error' : 'debug-status-success'}>
            {pricing.loading ? ' ⏳ Caricamento...' : pricing.error ? ' ❌ Errore' : ' ✅ OK'}
          </span>
        </div>
        {pricing.error && <div className="debug-status-error"><strong>Errore:</strong> {pricing.error}</div>}
        <div><strong>Base Price:</strong> €{pricing.basePrice}/persona/notte</div>
        <div><strong>Parking Fee:</strong> €{pricing.parkingFee}/notte</div>
        <div><strong>Cleaning Fee:</strong> €{pricing.cleaningFee}/soggiorno</div>
        <div><strong>Tourist Tax:</strong> €{pricing.touristTax}/persona/notte</div>
        <div><strong>Additional Guest:</strong> €{pricing.additionalGuestPrice}/persona</div>
      </div>

      {/* SEZIONE 2: SERVIZI EXTRA */}
      <div className="debug-section">
        <h5 className="debug-section-title services">🛎️ SERVIZI EXTRA</h5>
        <div><strong>Status:</strong> 
          <span className={extraServices.loading ? 'debug-status-loading' : extraServices.error ? 'debug-status-error' : 'debug-status-success'}>
            {extraServices.loading ? ' ⏳ Caricamento...' : extraServices.error ? ' ❌ Errore' : ' ✅ OK'}
          </span>
        </div>
        {extraServices.error && <div className="debug-status-error"><strong>Errore:</strong> {extraServices.error}</div>}
        <div><strong>Servizi Totali:</strong> {extraServices.services.length}</div>
        <div><strong>Inclusi:</strong> {extraServices.services.filter(s => s.included).length}</div>
        <div><strong>A Pagamento:</strong> {extraServices.services.filter(s => !s.included).length}</div>
        
        {/* Lista servizi dettagliata */}
        {extraServices.services.length > 0 && (
          <details className="debug-services-list">
            <summary className="debug-services-summary">📋 Lista Completa Servizi</summary>
            <div className="debug-services-details">
              {extraServices.services.map((service, index) => (
                <div key={index} className={`debug-service-item ${service.included ? 'debug-service-included' : 'debug-service-paid'}`}>
                  {service.included ? '✅' : '💰'} {service.name}: 
                  {service.included ? ' INCLUSO' : ` €${service.price}`}
                  {service.unit && ` /${service.unit}`}
                </div>
              ))}
            </div>
          </details>
        )}
      </div>

      {/* SEZIONE 3: CONFIGURAZIONI SISTEMA */}
      <div className="debug-section">
        <h5 className="debug-section-title config">⚙️ CONFIGURAZIONI</h5>
        <div><strong>Tassa Soggiorno:</strong> {pricing.touristTax === 2 ? '✅' : '⚠️'} €{pricing.touristTax}</div>
        <div><strong>Parcheggio Dinamico:</strong> {pricing.parkingFee > 0 ? '✅' : '❌'} Abilitato</div>
        <div><strong>Pulizie Dinamiche:</strong> {pricing.cleaningFee > 0 ? '✅' : '❌'} Abilitate</div>
        <div><strong>Ospiti Extra:</strong> {pricing.additionalGuestPrice > 0 ? '✅' : '❌'} Configurato</div>
      </div>

      {/* SEZIONE 4: MONITORAGGIO REAL-TIME */}
      <div className="debug-section">
        <h5 className="debug-section-title monitoring">📊 MONITORAGGIO</h5>
        <div><strong>Ultimo Aggiornamento:</strong> {new Date().toLocaleTimeString()}</div>
        <div><strong>Connessione API:</strong> 
          <span className={!pricing.error && !extraServices.error ? 'debug-status-success' : 'debug-status-error'}>
            {!pricing.error && !extraServices.error ? ' 🟢 Stabile' : ' 🔴 Problemi'}
          </span>
        </div>
        <div><strong>Cache Status:</strong> {pricing.loading || extraServices.loading ? '🔄 Aggiornamento' : '💾 Cached'}</div>
      </div>

      {/* SEZIONE 5: DIAGNOSTICA AVANZATA */}
      <details className="debug-advanced">
        <summary className="debug-advanced-summary">🔧 Diagnostica Avanzata</summary>
        <div className="debug-advanced-details">
          <div><strong>Hook Pricing:</strong> {typeof pricing === 'object' ? 'OK' : 'ERROR'}</div>
          <div><strong>Hook Services:</strong> {typeof extraServices === 'object' ? 'OK' : 'ERROR'}</div>
          <div><strong>Runtime:</strong> {performance.now().toFixed(2)}ms</div>
          <div><strong>User Agent:</strong> {navigator.userAgent.split(' ')[0]}</div>
        </div>
      </details>
    </div>
  );
};

export default DynamicPricingDebug;