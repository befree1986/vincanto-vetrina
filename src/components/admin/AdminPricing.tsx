import React from 'react';
import NumericInput from '../NumericInput';
import '../NumericInput.css';

interface AdminPricingProps {
  pricingConfig: any;
  updatePricingField: (field: string, value: number) => void;
  savePricingConfig: () => void;
  resetPricingConfig: () => void;
  isUpdatingPricing: boolean;
  showSuccessMessage: boolean;
  // Nuove props per servizi extra
  customServices: any[];
  allServices: any[]; // 🔥 NUOVO: Tutti i servizi (hardcoded + custom)
  updateHardcodedServicePrice: (serviceId: number, newPrice: number) => void; // 🔥 NUOVO: Aggiorna prezzi hardcoded
  updateHardcodedServiceActive: (serviceId: number, active: boolean) => void; // 🔥 NUOVO: Attiva/disattiva servizio
  updateHardcodedServiceIncluded: (serviceId: number, included: boolean) => void; // 🔥 NUOVO: Imposta incluso
  newServiceName: string;
  setNewServiceName: (name: string) => void;
  newServicePrice: number;
  setNewServicePrice: (price: number) => void;
  addCustomService: () => void;
  updateCustomService: (id: number, field: string, value: any) => void;
  deleteCustomService: (id: number) => void;
}

/**
 * Componente Sezione Prezzi Admin - Configurazione prezzi con input migliorati
 */
const AdminPricing: React.FC<AdminPricingProps> = ({
  pricingConfig,
  updatePricingField,
  savePricingConfig,
  resetPricingConfig,
  isUpdatingPricing,
  showSuccessMessage,
  customServices,
  allServices, // 🔥 NUOVO: Tutti i servizi
  updateHardcodedServicePrice, // 🔥 NUOVO: Aggiorna prezzi hardcoded
  updateHardcodedServiceActive, // 🔥 NUOVO: Attiva/disattiva servizio
  updateHardcodedServiceIncluded, // 🔥 NUOVO: Imposta incluso
  newServiceName,
  setNewServiceName,
  newServicePrice,
  setNewServicePrice,
  addCustomService,
  updateCustomService,
  deleteCustomService,
}) => {
  return (
    <>
      <style>{`
        .service-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
        }
        
        .service-controls {
          display: flex;
          align-items: center;
          gap: 1rem;
        }
        
        .toggle-switch {
          position: relative;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          cursor: pointer;
        }
        
        .toggle-switch input {
          opacity: 0;
          width: 0;
          height: 0;
        }
        
        .toggle-slider {
          position: relative;
          width: 40px;
          height: 20px;
          background-color: #ccc;
          border-radius: 20px;
          transition: 0.4s;
        }
        
        .toggle-slider:before {
          position: absolute;
          content: "";
          height: 16px;
          width: 16px;
          left: 2px;
          top: 2px;
          background-color: white;
          border-radius: 50%;
          transition: 0.4s;
        }
        
        .toggle-switch input:checked + .toggle-slider {
          background-color: #2196F3;
        }
        
        .toggle-switch input:checked + .toggle-slider:before {
          transform: translateX(20px);
        }
        
        .service-pricing {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          align-items: flex-end;
        }
        
        .included-toggle {
          margin-bottom: 0.5rem;
        }
        
        .included-label {
          font-weight: bold;
          margin-left: 0.5rem;
        }
        
        .service-price-container input:disabled {
          background-color: #f5f5f5;
          opacity: 0.6;
          cursor: not-allowed;
        }
        
        /* 🔥 NUOVO: Stili per sezione servizi unificata */
        .unified-services-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          margin-bottom: 2rem;
        }
        
        .unified-service-card {
          background: #f9f9f9;
          border: 1px solid #ddd;
          border-radius: 8px;
          padding: 1rem;
        }
        
        .service-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.5rem;
        }
        
        .service-icon {
          margin-right: 0.5rem;
        }
        
        .service-name-input {
          border: none;
          background: transparent;
          font-size: inherit;
          font-weight: bold;
          min-width: 200px;
        }
        
        .service-actions {
          display: flex;
          align-items: center;
          gap: 1rem;
        }
        
        .delete-service-btn {
          background: #ff4444;
          color: white;
          border: none;
          border-radius: 4px;
          padding: 0.25rem 0.5rem;
          cursor: pointer;
          font-size: 0.9rem;
        }
        
        .service-content {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        
        .service-description {
          color: #666;
          font-size: 0.9rem;
          flex: 1;
        }
        
        .service-pricing {
          display: flex;
          align-items: center;
          gap: 1rem;
        }
        
        .price-input {
          display: flex;
          align-items: center;
          gap: 0.25rem;
        }
        
        .price-field {
          width: 80px;
          padding: 0.25rem;
          border: 1px solid #ccc;
          border-radius: 4px;
        }
        
        .add-service-form {
          background: #e8f4fd;
          border: 2px dashed #2196F3;
          border-radius: 8px;
          padding: 1rem;
          margin-bottom: 1rem;
        }
        
        .form-row {
          display: flex;
          align-items: center;
          gap: 1rem;
        }
        
        .add-btn {
          background: #2196F3;
          color: white;
          border: none;
          border-radius: 4px;
          padding: 0.5rem 1rem;
          cursor: pointer;
          font-weight: bold;
        }
        
        .add-btn:disabled {
          background: #ccc;
          cursor: not-allowed;
        }
      `}</style>
      
      <div className="admin-prezzi">
        <div className="admin-header">
        <h2>⚙️ Configurazione Prezzi e Sistema</h2>
        <div className="header-actions">
          <button 
            onClick={savePricingConfig}
            disabled={isUpdatingPricing}
            className="admin-button primary"
          >
            {isUpdatingPricing ? '⏳ Salvando...' : '💾 Salva Configurazione'}
          </button>
          <button 
            onClick={resetPricingConfig}
            disabled={isUpdatingPricing}
            className="admin-button secondary"
          >
            🔄 Reset Default
          </button>
        </div>
      </div>

      {showSuccessMessage && (
        <div className="admin-success-message">
          ✅ Configurazione prezzi salvata con successo!
        </div>
      )}

      {/* Tariffe Base */}
      <div className="admin-pricing-section">
        <h3>🏠 Tariffe Base</h3>
        <div className="admin-pricing-grid">
          <div className="admin-pricing-card">
            <h4>Prezzi Principali</h4>
            <div className="pricing-controls">
              <NumericInput
                id="basePrice"
                label="Prezzo base per notte"
                value={pricingConfig.basePrice}
                onChange={(value) => updatePricingField('basePrice', value)}
                min={1}
                max={999}
                suffix="€"
                required
              />
              
              <NumericInput
                id="additionalGuestPrice"
                label="Prezzo persona aggiuntiva"
                value={pricingConfig.additionalGuestPrice}
                onChange={(value) => updatePricingField('additionalGuestPrice', value)}
                min={0}
                max={500}
                suffix="€"
              />
              
              <NumericInput
                id="cleaningFee"
                label="Tassa di pulizia finale"
                value={pricingConfig.cleaningFee}
                onChange={(value) => updatePricingField('cleaningFee', value)}
                min={0}
                max={200}
                suffix="€"
              />
            </div>
          </div>
          
          <div className="admin-pricing-card">
            <h4>Servizi e Tasse</h4>
            <div className="pricing-controls">
              <NumericInput
                id="parkingFee"
                label="Parcheggio privato per notte"
                value={pricingConfig.parkingFee}
                onChange={(value) => updatePricingField('parkingFee', value)}
                min={0}
                max={100}
                suffix="€"
              />
              
              <NumericInput
                id="touristTax"
                label="Tassa di soggiorno per persona per notte"
                value={pricingConfig.touristTax || pricingConfig.touristTaxAdult || 3}
                onChange={(value) => updatePricingField('touristTax', value)}
                min={0}
                max={50}
                suffix="€"
              />
              
              <NumericInput
                id="weekendSurcharge"
                label="Supplemento Weekend"
                value={pricingConfig.weekendSurcharge}
                onChange={(value) => updatePricingField('weekendSurcharge', value)}
                min={0}
                max={100}
                suffix="%"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Sconti per Soggiorno */}
      <div className="admin-pricing-section">
        <h3>🎯 Sconti per Durata Soggiorno</h3>
        <div className="admin-pricing-grid">
          <div className="admin-pricing-card">
            <h4>Sconti Progressivi</h4>
            <div className="pricing-controls">
              <NumericInput
                id="weeklyDiscount"
                label="Sconto 7+ notti"
                value={pricingConfig.weeklyDiscount || 0}
                onChange={(value) => updatePricingField('weeklyDiscount', value)}
                min={0}
                max={50}
                suffix="%"
              />
              
              <NumericInput
                id="monthlyDiscount"
                label="Sconto 30+ notti"
                value={pricingConfig.monthlyDiscount || 0}
                onChange={(value) => updatePricingField('monthlyDiscount', value)}
                min={0}
                max={50}
                suffix="%"
              />
              
              <NumericInput
                id="seasonalMultiplier"
                label="Moltiplicatore stagionale"
                value={pricingConfig.seasonalMultiplier || 1}
                onChange={(value) => updatePricingField('seasonalMultiplier', value)}
                min={0.5}
                max={3}
                step={0.1}
                suffix="x"
              />
            </div>
          </div>
          
          <div className="admin-pricing-card">
            <h4>Limiti Soggiorno</h4>
            <div className="pricing-controls">
              <NumericInput
                id="minStay"
                label="Soggiorno minimo (notti)"
                value={pricingConfig.minStay}
                onChange={(value) => updatePricingField('minStay', value)}
                min={1}
                max={30}
                suffix="notti"
                required
              />
              
              <NumericInput
                id="maxStay"
                label="Soggiorno massimo (notti)"
                value={pricingConfig.maxStay}
                onChange={(value) => updatePricingField('maxStay', value)}
                min={1}
                max={365}
                suffix="notti"
                required
              />
            </div>
          </div>
        </div>
      </div>

      {/* 🔥 NUOVO: Servizi Aggiuntivi Unificati */}
      <div className="admin-pricing-section">
        <h3>🛎️ Servizi Aggiuntivi</h3>
        
        {/* Lista unificata di tutti i servizi */}
        <div className="unified-services-list">
          {allServices.map((service) => (
            <div key={service.id} className="unified-service-card">
              <div className="service-header">
                <h4>
                  <span className="service-icon">
                    {service.category === 'parcheggio' ? '🚗' : 
                     service.category === 'bambini' ? '👶' :
                     service.category === 'animali' ? '🐕' :
                     service.category === 'comfort' ? '🛏️' :
                     service.category === 'comodita' ? '⏰' : 
                     service.category === 'custom' ? '⚙️' : '🛎️'}
                  </span>
                  {service.category === 'custom' ? (
                    <input 
                      type="text"
                      value={service.name}
                      onChange={(e) => updateCustomService(service.id, 'name', e.target.value)}
                      className="service-name-input"
                      title="Modifica nome servizio"
                    />
                  ) : (
                    service.name
                  )}
                </h4>
                
                <div className="service-actions">
                  {/* Toggle Attivo/Disattivo */}
                  <label className="toggle-switch" title="Attiva/Disattiva servizio">
                    <input 
                      type="checkbox"
                      checked={service.active !== false}
                      onChange={(e) => service.category === 'custom' 
                        ? updateCustomService(service.id, 'active', e.target.checked)
                        : updateHardcodedServiceActive(service.id, e.target.checked)}
                    />
                    <span className="toggle-slider"></span>
                    <span className="toggle-label">{service.active !== false ? 'Attivo' : 'Disattivo'}</span>
                  </label>
                  
                  {/* Elimina (solo per servizi custom) */}
                  {service.category === 'custom' && (
                    <button 
                      className="delete-service-btn"
                      onClick={() => deleteCustomService(service.id)}
                      title="Elimina servizio"
                    >
                      🗑️
                    </button>
                  )}
                </div>
              </div>
              
              <div className="service-content">
                <div className="service-description">
                  {service.description}
                </div>
                
                <div className="service-pricing">
                  {/* Toggle Incluso */}
                  <div className="included-toggle">
                    <label>
                      <input 
                        type="checkbox"
                        checked={service.included === true}
                        onChange={(e) => service.category === 'custom'
                          ? updateCustomService(service.id, 'included', e.target.checked)
                          : updateHardcodedServiceIncluded(service.id, e.target.checked)}
                      />
                      <span className="included-label">
                        {service.included ? '✅ INCLUSO' : '💰 A pagamento'}
                      </span>
                    </label>
                  </div>
                  
                  {/* Prezzo */}
                  <div className="price-input">
                    <span>€</span>
                    <input 
                      type="number"
                      value={service.price}
                      onChange={(e) => service.category === 'custom'
                        ? updateCustomService(service.id, 'price', Number(e.target.value))
                        : updateHardcodedServicePrice(service.id, Number(e.target.value))}
                      className="price-field"
                      min="0"
                      disabled={service.included === true}
                      title={service.included ? 'Prezzo non applicabile (servizio incluso)' : `Prezzo ${service.name}`}
                    />
                    <span>/{service.unit}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {/* Form per aggiungere nuovo servizio */}
        <div className="add-service-form">
          <h4>➕ Aggiungi Nuovo Servizio</h4>
          <div className="form-row">
            <input 
              type="text" 
              placeholder="Nome servizio (es. Transfer aeroporto)" 
              className="service-name-input" 
              value={newServiceName}
              onChange={(e) => setNewServiceName(e.target.value)}
            />
            <div className="price-input">
              <span>€</span>
              <input 
                type="number" 
                placeholder="0" 
                className="price-field" 
                value={newServicePrice}
                onChange={(e) => setNewServicePrice(Number(e.target.value))}
                min="0"
              />
              <span>/soggiorno</span>
            </div>
            <button 
              className="add-btn"
              onClick={addCustomService}
              disabled={!newServiceName || newServicePrice < 0}
            >
              Aggiungi
            </button>
          </div>
        </div>
        
        <div className="pricing-note">
          💡 <strong>Info:</strong> Gestisci tutti i servizi aggiuntivi da qui.<br/>
          • <strong>Attivo/Disattivo:</strong> Controlla la visibilità nel frontend<br/>
          • <strong>Incluso/A pagamento:</strong> Servizi inclusi sono gratuiti<br/>
          • <strong>Servizi custom:</strong> Completamente personalizzabili ed eliminabili
        </div>
      </div>

      {/* Anteprima Configurazione */}
      <div className="admin-pricing-section">
        <h3>👁️ Anteprima Configurazione Attuale</h3>
        <div className="admin-pricing-card">
          <div className="pricing-preview">
            <div className="preview-grid">
              <div className="preview-item">
                <strong>Base:</strong> €{pricingConfig.basePrice}/notte per persona
              </div>
              <div className="preview-item">
                <strong>Aggiuntiva:</strong> €{pricingConfig.additionalGuestPrice}/notte per persona extra
              </div>
              <div className="preview-item">
                <strong>Parcheggio:</strong> €{pricingConfig.parkingFee}/notte
              </div>
              <div className="preview-item">
                <strong>Pulizia:</strong> €{pricingConfig.cleaningFee} una tantum
              </div>
              <div className="preview-item">
                <strong>Tassa soggiorno:</strong> €{pricingConfig.touristTax}/persona/notte
              </div>
              <div className="preview-item">
                <strong>Soggiorno:</strong> {pricingConfig.minStay}-{pricingConfig.maxStay} notti
              </div>
              <div className="preview-item">
                <strong>Servizi extra:</strong> {customServices.length} configurati
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    </>
  );
};

export default AdminPricing;