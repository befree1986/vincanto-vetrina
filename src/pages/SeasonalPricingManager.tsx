// src/pages/SeasonalPricingManager.tsx

import React, { useState, useEffect } from 'react';
import AdminApiService from '../services/adminApiService';
import '../components/admin/SeasonalPricingManager.css';

// Interfaccia per le regole, con campi snake_case come nel DB
export interface SeasonalRule {
    id?: number;
    name: string;
    start_date: string;
    end_date: string;
    min_stay?: number | null;
    price_group_1to2?: number | null;
    price_group_3to4?: number | null;
    price_group_5to6?: number | null;
    price_group_7to8?: number | null;
    cleaning_fee?: number | null;
    parking_fee?: number | null;
    tourist_tax_adult?: number | null;
    is_active: boolean;
}

const SeasonalPricingManager: React.FC = () => {
    const [seasonalRules, setSeasonalRules] = useState<SeasonalRule[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [saveStatus, setSaveStatus] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
    const adminApi = new AdminApiService();

    useEffect(() => {
        const fetchRules = async () => {
            setIsLoading(true);
            try {
                const response = await adminApi.getSeasonalRules();
                setSeasonalRules(response.rules || []);
            } catch (error) {
                setSaveStatus({ message: 'Errore nel caricamento delle regole.', type: 'error' });
            } finally {
                setIsLoading(false);
            }
        };
        fetchRules();
    }, []);

    const handleAddRule = () => {
        const newRule: SeasonalRule = {
            name: 'Nuova Regola',
            start_date: new Date().toISOString().split('T')[0],
            end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            min_stay: 3,
            is_active: true,
        };
        setSeasonalRules(prev => [...prev, newRule]);
    };

    const handleRuleChange = (idOrIndex: number | string, field: keyof SeasonalRule, value: any) => {
        setSeasonalRules(prev =>
            prev.map((rule, index) => {
                const currentId = rule.id ?? `new-${index}`;
                if (String(currentId) === String(idOrIndex)) {
                    return { ...rule, [field]: value };
                }
                return rule;
            })
        );
    };

    const handleRemoveRule = async (idOrIndex: number | string) => {
        const ruleToRemove = seasonalRules.find((rule, index) => String(rule.id ?? `new-${index}`) === String(idOrIndex));
        if (window.confirm(`Sei sicuro di voler eliminare la regola "${ruleToRemove?.name}"?`)) {
            if (ruleToRemove?.id) {
                try {
                    await adminApi.deleteSeasonalRule(ruleToRemove.id);
                    setSeasonalRules(prev => prev.filter(rule => rule.id !== ruleToRemove.id));
                    setSaveStatus({ message: 'Regola eliminata con successo.', type: 'success' });
                } catch (err) {
                    setSaveStatus({ message: `Errore eliminazione: ${err instanceof Error ? err.message : 'Errore sconosciuto'}`, type: 'error' });
                }
            } else {
                setSeasonalRules(prev => prev.filter((_, index) => `new-${index}` !== idOrIndex));
            }
        }
    };

    const handleSaveRules = async () => {
        setIsSaving(true);
        setSaveStatus(null);
        try {
            const promises = seasonalRules.map(rule => {
                if (!rule.name.trim()) throw new Error('Il nome di una regola non può essere vuoto.');
                if (new Date(rule.end_date) < new Date(rule.start_date)) throw new Error(`La data di fine della regola "${rule.name}" non può essere precedente a quella di inizio.`);

                const payload = { ...rule };
                // Converte i campi numerici vuoti in null per il DB
                (Object.keys(payload) as Array<keyof SeasonalRule>).forEach(key => {
                    // Controlla se il valore è una stringa vuota e lo converte in null.
                    // L'uso di 'as any' è un modo per dire a TypeScript di fidarsi della nostra logica qui.
                    if (key !== 'name' && key !== 'start_date' && key !== 'end_date' && key !== 'is_active' && (payload as any)[key] === '') {
                        (payload as any)[key] = null;
                    }
                });

                return rule.id ? adminApi.updateSeasonalRule(rule.id, payload) : adminApi.createSeasonalRule(payload);
            });

            const results = await Promise.all(promises);
            setSeasonalRules(results.map(res => res.rule));
            setSaveStatus({ message: 'Tutte le regole sono state salvate con successo!', type: 'success' });
        } catch (error) {
            setSaveStatus({ message: error instanceof Error ? error.message : 'Errore durante il salvataggio.', type: 'error' });
        } finally {
            setIsSaving(false);
            setTimeout(() => setSaveStatus(null), 5000);
        }
    };

    if (isLoading) return <div>Caricamento regole...</div>;

    return (
        <div className="seasonal-pricing-manager">
            <h2>Prezzi Personalizzati per Periodo</h2>
            <p>Crea regole di prezzo specifiche per determinati periodi. Queste regole avranno la priorità sui prezzi standard.</p>

            <div className="rules-list">
                {seasonalRules.map((rule, index) => {
                    const idOrIndex = rule.id ?? `new-${index}`;
                    return (
                        <div key={idOrIndex} className="rule-card">
                            <div className="rule-header">
                                <input type="text" value={rule.name} onChange={(e) => handleRuleChange(idOrIndex, 'name', e.target.value)} className="rule-name-input" />
                                <button onClick={() => handleRemoveRule(idOrIndex)} className="btn-remove-rule">×</button>
                            </div>
                            <div className="rule-body">
                                <div className="rule-row">
                                    <div className="form-group"><label>Data Inizio</label><input type="date" value={rule.start_date} onChange={(e) => handleRuleChange(idOrIndex, 'start_date', e.target.value)} /></div>
                                    <div className="form-group"><label>Data Fine</label><input type="date" value={rule.end_date} onChange={(e) => handleRuleChange(idOrIndex, 'end_date', e.target.value)} /></div>
                                    <div className="form-group"><label>Sogg. Minimo</label><input type="number" min="1" value={rule.min_stay ?? ''} onChange={(e) => handleRuleChange(idOrIndex, 'min_stay', e.target.value === '' ? null : parseInt(e.target.value))} /></div>
                                    <div className="form-group form-group-toggle"><label>Attiva</label><input type="checkbox" checked={rule.is_active} onChange={(e) => handleRuleChange(idOrIndex, 'is_active', e.target.checked)} /></div>
                                </div>
                                <div className="rule-row price-groups">
                                    <div className="form-group"><label>Prezzo 1-2 Ospiti</label><input type="number" min="0" placeholder="Default" value={rule.price_group_1to2 ?? ''} onChange={(e) => handleRuleChange(idOrIndex, 'price_group_1to2', e.target.value === '' ? null : parseFloat(e.target.value))} /></div>
                                    <div className="form-group"><label>Prezzo 3-4 Ospiti</label><input type="number" min="0" placeholder="Default" value={rule.price_group_3to4 ?? ''} onChange={(e) => handleRuleChange(idOrIndex, 'price_group_3to4', e.target.value === '' ? null : parseFloat(e.target.value))} /></div>
                                    <div className="form-group"><label>Prezzo 5-6 Ospiti</label><input type="number" min="0" placeholder="Default" value={rule.price_group_5to6 ?? ''} onChange={(e) => handleRuleChange(idOrIndex, 'price_group_5to6', e.target.value === '' ? null : parseFloat(e.target.value))} /></div>
                                    <div className="form-group"><label>Prezzo 7-8 Ospiti</label><input type="number" min="0" placeholder="Default" value={rule.price_group_7to8 ?? ''} onChange={(e) => handleRuleChange(idOrIndex, 'price_group_7to8', e.target.value === '' ? null : parseFloat(e.target.value))} /></div>
                                </div>
                                <div className="rule-row price-groups extra-fees">
                                    <div className="form-group"><label>Tassa Pulizia</label><input type="number" min="0" placeholder="Default" value={rule.cleaning_fee ?? ''} onChange={(e) => handleRuleChange(idOrIndex, 'cleaning_fee', e.target.value === '' ? null : parseFloat(e.target.value))} /></div>
                                    <div className="form-group"><label>Parcheggio/notte</label><input type="number" min="0" placeholder="Default" value={rule.parking_fee ?? ''} onChange={(e) => handleRuleChange(idOrIndex, 'parking_fee', e.target.value === '' ? null : parseFloat(e.target.value))} /></div>
                                    <div className="form-group"><label>Tassa Sogg./persona</label><input type="number" min="0" step="0.1" placeholder="Default" value={rule.tourist_tax_adult ?? ''} onChange={(e) => handleRuleChange(idOrIndex, 'tourist_tax_adult', e.target.value === '' ? null : parseFloat(e.target.value))} /></div>
                                </div>
                            </div>
                        </div>
                    )
                })}
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
