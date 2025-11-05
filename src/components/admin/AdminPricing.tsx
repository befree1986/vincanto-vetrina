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
  newServiceName,
  setNewServiceName,
  newServicePrice,
  setNewServicePrice,
  addCustomService,
  updateCustomService,
  deleteCustomService,
}) => {
  return (
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

      {/* Servizi Extra Personalizzabili */}
      <div className="admin-pricing-section">
        <h3>🛎️ Servizi Extra Personalizzabili</h3>
        <div className="admin-pricing-grid">
          <div className="admin-pricing-card">
            <h4>Aggiungi Nuovo Servizio</h4>
            <div className="pricing-controls">
              <div className="custom-service-item">
                <input 
                  type="text" 
                  placeholder="Nome servizio (es. Culla per bambini)" 
                  className="admin-input" 
                  value={newServiceName}
                  onChange={(e) => setNewServiceName(e.target.value)}
                />
                <div className="custom-service-add">
                  <span>€</span>
                  <input 
                    type="number" 
                    placeholder="Prezzo" 
                    className="admin-input-small" 
                    value={newServicePrice}
                    onChange={(e) => setNewServicePrice(Number(e.target.value))}
                    min="0"
                  />
                  <span>/soggiorno</span>
                  <button 
                    className="admin-btn-small add-service-btn"
                    onClick={addCustomService}
                    title="Aggiungi servizio"
                    disabled={!newServiceName || newServicePrice <= 0}
                  >
                    ➕
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          <div className="admin-pricing-card">
            <h4>Servizi Configurati ({customServices.length})</h4>
            <div className="pricing-controls">
              <div className="existing-services">
                {customServices.map((service) => (
                  <div key={service.id} className="service-row">
                    <input 
                      type="text"
                      value={service.name}
                      onChange={(e) => updateCustomService(service.id, 'name', e.target.value)}
                      className="admin-input-small"
                      placeholder="Nome servizio"
                      title={`Nome servizio ${service.id}`}
                    />
                    <div className="service-price-container">
                      <span>€</span>
                      <input 
                        type="number"
                        value={service.price}
                        onChange={(e) => updateCustomService(service.id, 'price', Number(e.target.value))}
                        className="admin-input-small"
                        min="0"
                        title={`Prezzo servizio ${service.id}`}
                      />
                      <span>/{service.unit}</span>
                    </div>
                    <button 
                      className="admin-btn-small service-delete-btn"
                      onClick={() => deleteCustomService(service.id)}
                      title="Elimina servizio"
                    >
                      🗑️
                    </button>
                  </div>
                ))}
                
                {customServices.length === 0 && (
                  <div className="service-empty-state">
                    Nessun servizio extra configurato.<br/>
                    Aggiungi servizi come culla, seggiolone, etc.
                  </div>
                )}
              </div>
              
              <div className="pricing-note pricing-note-services">
                💡 <strong>Servizi suggeriti:</strong> Culla (0-3 anni), Seggiolone, Animali domestici, 
                Check-in anticipato, Colazione, Transfer aeroporto
              </div>
            </div>
          </div>
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
  );
};

export default AdminPricing;