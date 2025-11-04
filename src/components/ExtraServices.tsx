import React from 'react';
import { useExtraServices, ExtraService } from '../hooks/useExtraServices';
import './ExtraServices.css';

interface ExtraServicesProps {
  onServicesChange?: (services: ExtraService[], totalCost: number) => void;
  childrenAges?: number[];
}

const ExtraServices: React.FC<ExtraServicesProps> = ({ 
  onServicesChange, 
  childrenAges = [] 
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

  React.useEffect(() => {
    if (onServicesChange) {
      onServicesChange(getSelectedServices(), getTotalCost());
    }
  }, [selectedServices, services, onServicesChange]);

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

  const childrenServices = getServicesByCategory('bambini');
  const comfortServices = getServicesByCategory('comfort');
  const convenenceServices = getServicesByCategory('comodita');
  const petServices = getServicesByCategory('animali');

  return (
    <div className="extra-services">
      <div className="extra-services-header">
        <h3>🛎️ Servizi Extra</h3>
        <p>Personalizza il tuo soggiorno con i nostri servizi aggiuntivi</p>
        {getTotalCost() > 0 && (
          <div className="total-cost">
            <strong>Totale servizi extra: €{getTotalCost()}</strong>
          </div>
        )}
      </div>

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
                  <span className="service-price">€{service.price}/{service.unit}</span>
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
                    aria-label={`Seleziona ${service.name} - €${service.price}/${service.unit}`}
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
                  <span className="service-price">€{service.price}/{service.unit}</span>
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
                    aria-label={`Seleziona ${service.name} - €${service.price}/${service.unit}`}
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
                  <span className="service-price">€{service.price}/{service.unit}</span>
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
                    aria-label={`Seleziona ${service.name} - €${service.price}/${service.unit}`}
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
                  <span className="service-price">€{service.price}/{service.unit}</span>
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
                    aria-label={`Seleziona ${service.name} - €${service.price}/${service.unit}`}
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

      {services.length === 0 && (
        <div className="no-services">
          <p>Nessun servizio extra disponible al momento.</p>
        </div>
      )}
    </div>
  );
};

export default ExtraServices;