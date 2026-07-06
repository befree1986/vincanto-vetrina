import React, { useState, useEffect } from 'react';
import AdminApiService from '../../services/adminApiService';
import './AdminPricing.css';

interface PriceRule {
  id: number;
  name: string;
  start_date: string;
  end_date: string;
  min_stay: number;
  base_price: number;
}

const SeasonalPricing: React.FC = () => {
  const [rules, setRules] = useState<PriceRule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    start_date: '',
    end_date: '',
    min_stay: 3,
    base_price: 100,
  });

  const apiService = new AdminApiService();

  const loadRules = async () => {
    setIsLoading(true);
    try {
      const data = await apiService.getSystemSettings();
      const seasonalPricingSetting = (data as { key: string; value: string }[]).find((s) => s.key === 'seasonal_pricing_rules');
      if (seasonalPricingSetting && seasonalPricingSetting.value) {
        setRules(JSON.parse(seasonalPricingSetting.value));
      }
    } catch (error) {
      console.error("Errore caricamento regole stagionali:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadRules();
  }, []);

  const handleSaveRules = async (updatedRules: PriceRule[]) => {
    try {
      await apiService.updateSystemSetting('seasonal_pricing_rules', updatedRules);
      alert('✅ Regole di prezzo salvate!');
      loadRules();
    } catch (error) {
      console.error("Errore salvataggio regole:", error);
      alert('❌ Errore durante il salvataggio.');
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let updatedRules;
    if (isEditing !== null) {
      updatedRules = rules.map(rule =>
        rule.id === isEditing ? { ...formData, id: isEditing } : rule
      );
    } else {
      const newRule: PriceRule = { ...formData, id: Date.now() };
      updatedRules = [...rules, newRule];
    }
    handleSaveRules(updatedRules);
    resetForm();
  };

  const handleEdit = (rule: PriceRule) => {
    setIsEditing(rule.id);
    setFormData({
      name: rule.name,
      start_date: rule.start_date,
      end_date: rule.end_date,
      min_stay: rule.min_stay,
      base_price: rule.base_price,
    });
  };

  const handleDelete = (id: number) => {
    if (window.confirm('Sei sicuro di voler eliminare questa regola?')) {
      const updatedRules = rules.filter(rule => rule.id !== id);
      handleSaveRules(updatedRules);
    }
  };

  const resetForm = () => {
    setIsEditing(null);
    setFormData({
      name: '',
      start_date: '',
      end_date: '',
      min_stay: 3,
      base_price: 100,
    });
  };

  return (
    <div className="admin-pricing-section">
      <h3>📅 Prezzi Personalizzati per Periodo</h3>
      <div className="admin-pricing-card">
        <h4>{isEditing !== null ? 'Modifica Periodo' : 'Aggiungi Nuovo Periodo'}</h4>
        <form onSubmit={handleFormSubmit} className="pricing-controls">
          <input
            type="text"
            placeholder="Nome (es. Alta Stagione, Pasqua)"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
            className="admin-input"
          />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <input
              type="date"
              value={formData.start_date}
              onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
              required
              className="admin-input"
            />
            <input
              type="date"
              value={formData.end_date}
              onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
              required
              className="admin-input"
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <input
              type="number"
              placeholder="Soggiorno minimo (notti)"
              value={formData.min_stay}
              onChange={(e) => setFormData({ ...formData, min_stay: parseInt(e.target.value) })}
              required
              className="admin-input"
            />
            <input
              type="number"
              placeholder="Prezzo base per notte"
              value={formData.base_price}
              onChange={(e) => setFormData({ ...formData, base_price: parseFloat(e.target.value) })}
              required
              className="admin-input"
            />
          </div>
          <div className="admin-pricing-actions" style={{ marginTop: '10px', padding: '0' }}>
            <button type="submit" className="admin-btn-primary">
              {isEditing !== null ? '✅ Aggiorna Periodo' : '➕ Aggiungi Periodo'}
            </button>
            {isEditing !== null && (
              <button type="button" onClick={resetForm} className="admin-btn-secondary">
                Annulla Modifica
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="admin-pricing-card" style={{ marginTop: '20px' }}>
        <h4>Riepilogo Periodi Personalizzati</h4>
        {isLoading ? <p>Caricamento...</p> : (
          <div className="existing-services">
            {rules.length > 0 ? rules.map(rule => (
              <div key={rule.id} className="service-row">
                <span><strong>{rule.name}</strong> ({new Date(rule.start_date).toLocaleDateString()} - {new Date(rule.end_date).toLocaleDateString()})</span>
                <span>Min: {rule.min_stay} notti</span>
                <span>Prezzo: €{rule.base_price}/notte</span>
                <div className="row-actions">
                  <button onClick={() => handleEdit(rule)} className="admin-btn-small admin-btn-secondary">✏️ Modifica</button>
                  <button onClick={() => handleDelete(rule.id)} className="admin-btn-small admin-btn-danger">🗑️ Elimina</button>
                </div>
              </div>
            )) : <p>Nessun periodo personalizzato ancora definito.</p>}
          </div>
        )}
      </div>
    </div>
  );
};

export default SeasonalPricing;