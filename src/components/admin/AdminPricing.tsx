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
                label="Tassa di soggiorno per persona"
                value={pricingConfig.touristTax}
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
  );
};

export default AdminPricing;