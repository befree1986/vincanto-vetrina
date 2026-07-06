import React, { useState, useEffect } from 'react';
import { useBookingRules, SeasonalRule } from './useBookingRules';
import AdminApiService from '../services/adminApiService';
import '../components/admin/SeasonalPricingManager.css';

// Helper to generate a unique ID for new rules
const generateUniqueId = () => `rule_${new Date().getTime()}_${Math.random().toString(36).substr(2, 9)}`;

const SeasonalPricingManager: React.FC = () => {
    const { rules: initialRules, loading: isLoadingRules, error: rulesError } = useBookingRules();
    const [seasonalRules, setSeasonalRules] = useState<SeasonalRule[]>([]);
    const [isSaving, setIsSaving] = useState(false);
    const [saveStatus, setSaveStatus] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
    const adminApi = new AdminApiService();

    useEffect(() => {
        if (initialRules?.seasonalRules) {
            // Assicura che ogni regola abbia un ID, per la gestione nello state di React
            // Fornisce valori di default per tutte le proprietà obbligatorie per soddisfare il tipo SeasonalRule
            const rulesWithDefaults = initialRules.seasonalRules.map((rule: Partial<SeasonalRule>) => ({
                ...rule,
                id: rule.id || generateUniqueId(),
                name: rule.name || 'Nuova Regola',
                startDate: rule.startDate || new Date().toISOString().split('T')[0],
                endDate: rule.endDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            }));
            // Usiamo una type assertion 'as' per dire a TypeScript che siamo sicuri del tipo
            setSeasonalRules(rulesWithDefaults as SeasonalRule[]);
        }
    }, [initialRules]);

    const handleAddRule = () => {
        const newRule: SeasonalRule = {
            id: generateUniqueId(),
            name: 'Nuova Regola',
            startDate: new Date().toISOString().split('T')[0],
            endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // +7 days
            minStay: 3,
            priceGroup1to2: 0,
            priceGroup3to4: 0,
            priceGroup5to6: 0,
            priceGroup7to8: 0,
        };
        setSeasonalRules(prev => [...prev, newRule]);
    };

    const handleRuleChange = (id: string, field: keyof SeasonalRule, value: string | number) => {
        setSeasonalRules(prev =>
            prev.map(rule =>
                rule.id === id ? { ...rule, [field]: value } : rule
            )
        );
    };

    const handleRemoveRule = (id: string) => {
        if (window.confirm('Sei sicuro di voler eliminare questa regola?')) {
            setSeasonalRules(prev => prev.filter(rule => rule.id !== id));
        }
    };

    const handleSaveRules = async () => {
        setIsSaving(true);
        setSaveStatus(null);
        try {
            // Validate rules before saving
            for (const rule of seasonalRules) {
                if (!rule.name.trim()) throw new Error('Il nome di una regola non può essere vuoto.');
                if (new Date(rule.endDate) < new Date(rule.startDate)) throw new Error(`La data di fine della regola "${rule.name}" non può essere precedente a quella di inizio.`);
            }

            await adminApi.updateSystemSetting('seasonal_pricing_rules', seasonalRules);
            setSaveStatus({ message: 'Regole salvate con successo!', type: 'success' });
        } catch (error) {
            setSaveStatus({ message: error instanceof Error ? error.message : 'Errore durante il salvataggio.', type: 'error' });
        } finally {
            setIsSaving(false);
            setTimeout(() => setSaveStatus(null), 5000);
        }
    };

    if (isLoadingRules) {
        return <div>Caricamento regole...</div>;
    }

    if (rulesError) {
        return <div className="error-message">Errore nel caricamento delle regole: {rulesError}</div>;
    }

    return (
        <div className="seasonal-pricing-manager">
            <h2>Prezzi Personalizzati per Periodo</h2>
            <p>Crea regole di prezzo specifiche per determinati periodi (es. festività, promozioni). Queste regole avranno la priorità sui prezzi standard.</p>

            <div className="rules-list">
                {seasonalRules.map(rule => (
                    <div key={rule.id} className="rule-card">
                        <div className="rule-header">
                            <input
                                type="text"
                                value={rule.name}
                                onChange={(e) => handleRuleChange(rule.id, 'name', e.target.value)}
                                className="rule-name-input"
                            />
                            <button onClick={() => handleRemoveRule(rule.id)} className="btn-remove-rule">×</button>
                        </div>
                        <div className="rule-body">
                            <div className="rule-row">
                                <div className="form-group"><label>Data Inizio</label><input type="date" value={rule.startDate} onChange={(e) => handleRuleChange(rule.id, 'startDate', e.target.value)} /></div>
                                <div className="form-group"><label>Data Fine</label><input type="date" value={rule.endDate} onChange={(e) => handleRuleChange(rule.id, 'endDate', e.target.value)} /></div>
                                <div className="form-group"><label>Sogg. Minimo</label><input type="number" min="1" value={rule.minStay || ''} onChange={(e) => handleRuleChange(rule.id, 'minStay', parseInt(e.target.value) || 1)} /></div>
                            </div>
                            <div className="rule-row price-groups">
                                <div className="form-group"><label>Prezzo 1-2 Ospiti</label><input type="number" min="0" placeholder="€/persona" value={rule.priceGroup1to2 || ''} onChange={(e) => handleRuleChange(rule.id, 'priceGroup1to2', parseFloat(e.target.value) || 0)} /></div>
                                <div className="form-group"><label>Prezzo 3-4 Ospiti</label><input type="number" min="0" placeholder="€/persona" value={rule.priceGroup3to4 || ''} onChange={(e) => handleRuleChange(rule.id, 'priceGroup3to4', parseFloat(e.target.value) || 0)} /></div>
                                <div className="form-group"><label>Prezzo 5-6 Ospiti</label><input type="number" min="0" placeholder="€/persona" value={rule.priceGroup5to6 || ''} onChange={(e) => handleRuleChange(rule.id, 'priceGroup5to6', parseFloat(e.target.value) || 0)} /></div>
                                <div className="form-group"><label>Prezzo 7-8 Ospiti</label><input type="number" min="0" placeholder="€/persona" value={rule.priceGroup7to8 || ''} onChange={(e) => handleRuleChange(rule.id, 'priceGroup7to8', parseFloat(e.target.value) || 0)} /></div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="actions-footer">
                <button onClick={handleAddRule} className="btn-add-rule">+ Aggiungi Nuova Regola</button>
                <button onClick={handleSaveRules} disabled={isSaving} className="btn-save-rules">
                    {isSaving ? 'Salvataggio...' : 'Salva Tutte le Regole'}
                </button>
            </div>

            {saveStatus && (
                <div className={`save-status ${saveStatus.type}`}>
                    {saveStatus.message}
                </div>
            )}
        </div>
    );
};

export default SeasonalPricingManager;