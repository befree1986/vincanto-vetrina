import React, { useState, useEffect } from 'react';
import AdminApiService from '../../services/adminApiService';

const PremiumSettings: React.FC = () => {
    const [settings, setSettings] = useState({
        premium_features_enabled: false,
        premium_stripe_monthly_price_id: '',
        premium_stripe_yearly_price_id: '',
    });
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState('');
    const apiService = new AdminApiService();

    useEffect(() => {
        const loadSettings = async () => {
            const dbSettings = await apiService.getSystemSettings();
            const premiumEnabled = dbSettings.find((s: any) => s.key === 'premium_features_enabled')?.value === 'true';
            const monthlyId = dbSettings.find((s: any) => s.key === 'premium_stripe_monthly_price_id')?.value || '';
            const yearlyId = dbSettings.find((s: any) => s.key === 'premium_stripe_yearly_price_id')?.value || '';
            setSettings({
                premium_features_enabled: premiumEnabled,
                premium_stripe_monthly_price_id: monthlyId,
                premium_stripe_yearly_price_id: yearlyId,
            });
        };
        loadSettings();
    }, []);

    const handleSave = async () => {
        setIsSaving(true);
        setMessage('');
        try {
            await apiService.updateSystemSetting('premium_features_enabled', settings.premium_features_enabled.toString());
            await apiService.updateSystemSetting('premium_stripe_monthly_price_id', settings.premium_stripe_monthly_price_id);
            await apiService.updateSystemSetting('premium_stripe_yearly_price_id', settings.premium_stripe_yearly_price_id);
            setMessage('Impostazioni salvate con successo!');
        } catch (error) {
            setMessage('Errore durante il salvataggio.');
        } finally {
            setIsSaving(false);
            setTimeout(() => setMessage(''), 3000);
        }
    };

    return (
        <div className="admin-section">
            <h2>💎 Gestione Funzionalità Premium</h2>
            <div className="admin-notice">
                <p>Attiva questa opzione per richiedere un abbonamento a pagamento agli utenti con ruolo "Admin" per accedere al loro pannello.</p>
            </div>
            <div className="admin-pricing-card">
                <h4>Impostazioni Abbonamento</h4>
                <div className="config-item checkbox-item">
                    <label>
                        <input
                            type="checkbox"
                            checked={settings.premium_features_enabled}
                            onChange={(e) => setSettings(s => ({ ...s, premium_features_enabled: e.target.checked }))}
                        />
                        Abilita Abbonamento per Admin
                    </label>
                </div>
                <div className="admin-pricing-actions">
                    <button onClick={handleSave} disabled={isSaving} className="admin-btn-primary">
                        {isSaving ? 'Salvataggio...' : 'Salva Impostazioni'}
                    </button>
                </div>
                {message && <p>{message}</p>}
            </div>
        </div>
    );
};

export default PremiumSettings;