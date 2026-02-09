import React from 'react';
import { useExtraServices, ExtraService } from '../hooks/useExtraServices';
import './ExtraServices.css';

interface ExtraServicesProps {
  onServicesChange?: (services: ExtraService[], totalCost: number) => void;
  childrenAges?: number[];
  showHeader?: boolean;
  calcOptions?: { nights?: number; adults?: number; children?: number; guests?: number };
}

const ExtraServices: React.FC<ExtraServicesProps> = ({ 
  onServicesChange, 
  childrenAges = [],
  showHeader = true,
  calcOptions
}) => {
  const {
    services,
    loading,
    error,
    selectedServices,
    toggleService,
    getTotalCost,
    getSelectedServices
  } = useExtraServices();

  // 🔥 FIX: Destruttura le opzioni per evitare loop infiniti nel useEffect
  // Se calcOptions è un oggetto nuovo ad ogni render, causava un re-render continuo
  const { nights = 1, adults = 2, children = 0, guests = 2 } = calcOptions || {};

  React.useEffect(() => {
    if (onServicesChange) {
      const selected = getSelectedServices();
      // Calcolo indipendente: escludi gli INCLUSI dal costo ma passa tutti i selezionati al parent
      // Ricostruisci l'oggetto opzioni usando i valori destrutturati
      const totalCost = getTotalCost({ nights, adults, children, guests });
      // console.log('🛍️ ExtraServices onChange:', { selected: selected.length, totalCost, nights });
      onServicesChange(selected, totalCost);
    }
  }, [selectedServices, services, onServicesChange, nights, adults, children, guests]); // 🔥 FIX: Usa dipendenze primitive stabili

  const isServiceRelevant = (service: ExtraService): boolean => {
    // Se il servizio è per bambini, controlla le età
    if (service.category === 'bambini' && service.minAge !== undefined && service.maxAge !== undefined) {
      return childrenAges.some(age => age >= service.minAge! && age <= service.maxAge!);
    }
    
    // Altri servizi sono sempre rilevanti
    return true;
  };

  const getServicesByCategory = (category: string) => {
    return services.filter(service => 
      service.category === category && 
      service.available && 
      isServiceRelevant(service)
    );
  };

  // 🔥 NUOVO: Helper per formattare prezzo con effetto sbarrato
  const formatServicePrice = (service: ExtraService, isSelected: boolean) => {
    if (service.included) {
      return <span className="service-included">✅ INCLUSO</span>;
    }
    
    return (
      <div className="service-price-container">
        <span className={`service-price ${isSelected ? 'price-crossed' : ''}`}>
          €{service.price}/{getUnitLabel(service.unit)}
        </span>
        {isSelected && (
          <span className="service-selected-badge">
            ✅ Aggiunto
          </span>
        )}
      </div>
    );
  };

  // 🔥 NUOVO: Helper per tradurre unità di misura
  const getUnitLabel = (unit: string): string => {
    const unitLabels: Record<string, string> = {
      'soggiorno': 'soggiorno',
      'per_stay': 'soggiorno',
      'notte': 'notte',
      'per_night': 'notte',
      'persona': 'persona',
      'per_person': 'persona',
      'per_person_per_day': 'persona/giorno'
    };
    
    return unitLabels[unit] || unit;
  };

  // 🔥 NUOVO: Helper per aria-label accessibilità
  const getServiceAriaLabel = (service: ExtraService) => {
    if (service.included) {
      return `Seleziona ${service.name} - Incluso nel prezzo`;
    }
    return `Seleziona ${service.name} - €${service.price}/${getUnitLabel(service.unit)}`;
  };

  if (loading) {
    return (
      <div className="extra-services loading">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <span>Caricamento servizi extra...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="extra-services error">
        <div className="error-message">
          ⚠️ Errore caricamento servizi: {error}
        </div>
      </div>
    );
  }

  const parkingServices = getServicesByCategory('parcheggio');
  const childrenServices = getServicesByCategory('bambini');
  const comfortServices = getServicesByCategory('comfort');
  const convenenceServices = getServicesByCategory('comodita');
  const petServices = getServicesByCategory('animali');
  const customServices = getServicesByCategory('custom');

  return (
    <div className="extra-services">
      {showHeader && (
        <div className="extra-services-header">
          <h3>🛎️ Servizi Extra</h3>
          <p>Personalizza il tuo soggiorno con i nostri servizi aggiuntivi</p>
        </div>
      )}
      
      {getTotalCost({ nights, adults, children, guests }) > 0 && ( // 🔥 FIX: Usa valori destrutturati per coerenza
        <div className="total-cost">
          <strong>💰 Totale servizi extra: €{getTotalCost({ nights, adults, children, guests }).toFixed(2)}</strong>
        </div>
      )}

      {/* Servizi parcheggio */}
      {parkingServices.length > 0 && (
        <div className="service-category">
          <h4>🚗 Parcheggio</h4>
          <div className="services-grid">
            {parkingServices.map(service => (
              <div 
                key={service.id} 
                className={`service-card parking-service ${selectedServices.includes(service.id) ? 'selected' : ''}`}
                onClick={() => toggleService(service.id)}
              >
                <div className="service-header">
                  <h5>{service.name}</h5>
                  {formatServicePrice(service, selectedServices.includes(service.id))}
                </div>
                {service.description && (
                  <p className="service-description">{service.description}</p>
                )}
                <div className="service-checkbox">
                  <input
                    type="checkbox"
                    id={`service-parking-${service.id}`}
                    checked={selectedServices.includes(service.id)}
                    onChange={() => toggleService(service.id)}
                    onClick={(e) => e.stopPropagation()}
                    aria-label={getServiceAriaLabel(service)}
                  />
                  <label htmlFor={`service-parking-${service.id}`} className="sr-only">
                    Seleziona {service.name}
                  </label>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Servizi per bambini */}
      {childrenServices.length > 0 && (
        <div className="service-category">
          <h4>👶 Servizi per Bambini</h4>
          <div className="services-grid">
            {childrenServices.map(service => (
              <div 
                key={service.id} 
                className={`service-card ${selectedServices.includes(service.id) ? 'selected' : ''}`}
                onClick={() => toggleService(service.id)}
              >
                <div className="service-header">
                  <h5>{service.name}</h5>
                  {formatServicePrice(service, selectedServices.includes(service.id))}
                </div>
                {service.description && (
                  <p className="service-description">{service.description}</p>
                )}
                {service.minAge !== undefined && service.maxAge !== undefined && (
                  <small className="service-age">Età: {service.minAge}-{service.maxAge} anni</small>
                )}
                <div className="service-checkbox">
                  <input
                    type="checkbox"
                    id={`service-children-${service.id}`}
                    checked={selectedServices.includes(service.id)}
                    onChange={() => toggleService(service.id)}
                    onClick={(e) => e.stopPropagation()}
                    aria-label={getServiceAriaLabel(service)}
                  />
                  <label htmlFor={`service-children-${service.id}`} className="sr-only">
                    Seleziona {service.name}
                  </label>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Servizi comfort */}
      {comfortServices.length > 0 && (
        <div className="service-category">
          <h4>🛏️ Comfort & Benessere</h4>
          <div className="services-grid">
            {comfortServices.map(service => (
              <div 
                key={service.id} 
                className={`service-card ${selectedServices.includes(service.id) ? 'selected' : ''}`}
                onClick={() => toggleService(service.id)}
              >
                <div className="service-header">
                  <h5>{service.name}</h5>
                  {formatServicePrice(service, selectedServices.includes(service.id))}
                </div>
                {service.description && (
                  <p className="service-description">{service.description}</p>
                )}
                <div className="service-checkbox">
                  <input
                    type="checkbox"
                    id={`service-comfort-${service.id}`}
                    checked={selectedServices.includes(service.id)}
                    onChange={() => toggleService(service.id)}
                    onClick={(e) => e.stopPropagation()}
                    aria-label={getServiceAriaLabel(service)}
                  />
                  <label htmlFor={`service-comfort-${service.id}`} className="sr-only">
                    Seleziona {service.name}
                  </label>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Servizi comodità */}
      {convenenceServices.length > 0 && (
        <div className="service-category">
          <h4>⏰ Servizi di Comodità</h4>
          <div className="services-grid">
            {convenenceServices.map(service => (
              <div 
                key={service.id} 
                className={`service-card ${selectedServices.includes(service.id) ? 'selected' : ''}`}
                onClick={() => toggleService(service.id)}
              >
                <div className="service-header">
                  <h5>{service.name}</h5>
                  {formatServicePrice(service, selectedServices.includes(service.id))}
                </div>
                {service.description && (
                  <p className="service-description">{service.description}</p>
                )}
                <div className="service-checkbox">
                  <input
                    type="checkbox"
                    id={`service-convenience-${service.id}`}
                    checked={selectedServices.includes(service.id)}
                    onChange={() => toggleService(service.id)}
                    onClick={(e) => e.stopPropagation()}
                    aria-label={getServiceAriaLabel(service)}
                  />
                  <label htmlFor={`service-convenience-${service.id}`} className="sr-only">
                    Seleziona {service.name}
                  </label>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Servizi per animali */}
      {petServices.length > 0 && (
        <div className="service-category">
          <h4>🐕 Servizi per Animali</h4>
          <div className="services-grid">
            {petServices.map(service => (
              <div 
                key={service.id} 
                className={`service-card ${selectedServices.includes(service.id) ? 'selected' : ''}`}
                onClick={() => toggleService(service.id)}
              >
                <div className="service-header">
                  <h5>{service.name}</h5>
                  {formatServicePrice(service, selectedServices.includes(service.id))}
                </div>
                {service.description && (
                  <p className="service-description">{service.description}</p>
                )}
                <div className="service-checkbox">
                  <input
                    type="checkbox"
                    id={`service-pets-${service.id}`}
                    checked={selectedServices.includes(service.id)}
                    onChange={() => toggleService(service.id)}
                    onClick={(e) => e.stopPropagation()}
                    aria-label={getServiceAriaLabel(service)}
                  />
                  <label htmlFor={`service-pets-${service.id}`} className="sr-only">
                    Seleziona {service.name}
                  </label>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Servizi personalizzati */}
      {customServices.length > 0 && (
        <div className="service-category">
          <h4>⚙️ Servizi Personalizzati</h4>
          <div className="services-grid">
            {customServices.map(service => (
              <div 
                key={service.id} 
                className={`service-card custom-service ${selectedServices.includes(service.id) ? 'selected' : ''}`}
                onClick={() => toggleService(service.id)}
              >
                <div className="service-header">
                  <h5>{service.name}</h5>
                  {formatServicePrice(service, selectedServices.includes(service.id))}
                </div>
                {service.description && (
                  <p className="service-description">{service.description}</p>
                )}
                <div className="service-checkbox">
                  <input
                    type="checkbox"
                    id={`service-custom-${service.id}`}
                    checked={selectedServices.includes(service.id)}
                    onChange={() => toggleService(service.id)}
                    onClick={(e) => e.stopPropagation()}
                    aria-label={getServiceAriaLabel(service)}
                  />
                  <label htmlFor={`service-custom-${service.id}`} className="sr-only">
                    Seleziona {service.name}
                  </label>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {services.length === 0 && (
        <div className="no-services">
          <p>Nessun servizio extra disponible al momento.</p>
        </div>
      )}
    </div>
  );
};

export default ExtraServices;