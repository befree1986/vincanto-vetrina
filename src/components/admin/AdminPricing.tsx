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

      {/* Tariffe per Gruppi di Persone */}
      <div className="admin-pricing-section">
        <h3>👥 Sistema Prezzi Base + Aggiuntive</h3>
        <div className="admin-pricing-grid">
          <div className="admin-pricing-card">
            <h4>🏠 Prezzo Base (1-2 persone)</h4>
            <div className="pricing-controls">
              <NumericInput
                id="basePrice"
                label="Prezzo per persona (base 2 persone)"
                value={pricingConfig.basePrice || pricingConfig.priceGroup1to2}
                onChange={(value) => updatePricingField('basePrice', value)}
                min={1}
                max={999}
                suffix="€/persona"
                required
              />
            </div>
          </div>
          
          <div className="admin-pricing-card">
            <h4>➕ Costi Aggiuntivi per Persona Extra</h4>
            <div className="pricing-controls">
              <NumericInput
                id="additionalGuest3to4"
                label="3-4 persone (costo aggiuntivo/persona)"
                value={pricingConfig.additionalGuest3to4 || pricingConfig.priceGroup3to4}
                onChange={(value) => updatePricingField('additionalGuest3to4', value)}
                min={1}
                max={999}
                suffix="€/persona"
                required
              />
              
              <NumericInput
                id="additionalGuest5to6"
                label="5-6 persone (costo aggiuntivo/persona)"
                value={pricingConfig.additionalGuest5to6 || pricingConfig.priceGroup5to6}
                onChange={(value) => updatePricingField('additionalGuest5to6', value)}
                min={1}
                max={999}
                suffix="€/persona"
                required
              />
              
              <NumericInput
                id="additionalGuest7to8"
                label="7-8 persone (costo aggiuntivo/persona)"
                value={pricingConfig.additionalGuest7to8 || pricingConfig.priceGroup7to8}
                onChange={(value) => updatePricingField('additionalGuest7to8', value)}
                min={1}
                max={999}
                suffix="€/persona"
                required
              />
            </div>
          </div>
          
          <div className="admin-pricing-card">
            <h4>Servizi e Tasse</h4>
            <div className="pricing-controls">
              <NumericInput
                id="cleaningFee"
                label="Tassa di pulizia finale"
                value={pricingConfig.cleaningFee}
                onChange={(value) => updatePricingField('cleaningFee', value)}
                min={0}
                max={200}
                suffix="€"
              />
              
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
                id="touristTaxAdult"
                label="Tassa di soggiorno adulti per notte"
                value={pricingConfig.touristTaxAdult}
                onChange={(value) => updatePricingField('touristTaxAdult', value)}
                min={0}
                max={50}
                suffix="€"
                step={0.1}
              />
              
              <NumericInput
                id="maxGuests"
                label="Massimo numero ospiti"
                value={pricingConfig.maxGuests}
                onChange={(value) => updatePricingField('maxGuests', value)}
                min={1}
                max={20}
                suffix="ospiti"
              />
            </div>
          </div>
        </div>
        
        {/* Anteprima Sistema Base + Aggiuntive */}
        <div className="admin-pricing-card">
          <h4>📊 Anteprima Sistema Base + Aggiuntive</h4>
          <div className="pricing-preview">
            <div className="preview-item">
              <span className="preview-label">2 persone × 3 notti:</span>
              <span className="preview-value">€{((pricingConfig.basePrice || pricingConfig.priceGroup1to2 || 75) * 2 * 3)} (Base: €{(pricingConfig.basePrice || pricingConfig.priceGroup1to2 || 75) * 2}/notte)</span>
            </div>
            <div className="preview-item">
              <span className="preview-label">4 persone × 3 notti:</span>
              <span className="preview-value">€{(((pricingConfig.basePrice || pricingConfig.priceGroup1to2 || 75) * 2) + ((pricingConfig.additionalGuest3to4 || pricingConfig.priceGroup3to4 || 30) * 2)) * 3} (Base: €{(pricingConfig.basePrice || pricingConfig.priceGroup1to2 || 75) * 2} + Agg: €{(pricingConfig.additionalGuest3to4 || pricingConfig.priceGroup3to4 || 30) * 2})</span>
            </div>
            <div className="preview-item">
              <span className="preview-label">6 persone × 3 notti:</span>
              <span className="preview-value">€{(((pricingConfig.basePrice || pricingConfig.priceGroup1to2 || 75) * 2) + ((pricingConfig.additionalGuest3to4 || pricingConfig.priceGroup3to4 || 30) * 2) + ((pricingConfig.additionalGuest5to6 || pricingConfig.priceGroup5to6 || 25) * 2)) * 3} (Base: €{(pricingConfig.basePrice || pricingConfig.priceGroup1to2 || 75) * 2} + Agg 3-4: €{(pricingConfig.additionalGuest3to4 || pricingConfig.priceGroup3to4 || 30) * 2} + Agg 5-6: €{(pricingConfig.additionalGuest5to6 || pricingConfig.priceGroup5to6 || 25) * 2})</span>
            </div>
            <div className="preview-item">
              <span className="preview-label">8 persone × 3 notti:</span>
              <span className="preview-value">€{(((pricingConfig.basePrice || pricingConfig.priceGroup1to2 || 75) * 2) + ((pricingConfig.additionalGuest3to4 || pricingConfig.priceGroup3to4 || 30) * 2) + ((pricingConfig.additionalGuest5to6 || pricingConfig.priceGroup5to6 || 25) * 2) + ((pricingConfig.additionalGuest7to8 || pricingConfig.priceGroup7to8 || 20) * 2)) * 3}</span>
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
            </div>
          </div>
        </div>
      </div>
    </div>
    </>
  );
};

export default AdminPricing;