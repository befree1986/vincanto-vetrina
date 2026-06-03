import React from 'react';
import NumericInput from '../NumericInput';
import '../NumericInput.css';
import './AdminPricing.css';

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
              <div className="admin-gallery-image-input-group">
                <label className="admin-gallery-image-label">Immagine (URL)</label>
                <input
                  type="url"
                  className="admin-input"
                  placeholder="https://..."
                  value={pricingConfig.imageGroup1to2 || ''}
                  onChange={(e) => updatePricingField('imageGroup1to2', e.target.value as any)}
                />
                {pricingConfig.imageGroup1to2 && (
                   <img src={pricingConfig.imageGroup1to2} alt="Group 1-2" className="admin-image-preview-small" />
                )}
              </div>
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