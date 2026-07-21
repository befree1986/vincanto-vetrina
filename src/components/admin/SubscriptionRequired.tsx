import React, { useState } from 'react';
import AdminApiService from '../../services/adminApiService';

const SubscriptionRequired: React.FC = () => {
    const [isLoading, setIsLoading] = useState(false);

    const handleManageBilling = async () => {
        setIsLoading(true);
        try {
            const apiService = new AdminApiService();
            const response = await apiService.createBillingPortalSession({
                return_url: window.location.href,
            });
            if (response.url) {
                window.location.href = response.url;
            } else {
                alert('Impossibile accedere al portale di fatturazione in questo momento.');
            }
        } catch (error) {
            alert('Si è verificato un errore. Riprova più tardi.');
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="admin-access-denied-container">
            <div className="admin-access-denied-card">
                <div className="admin-access-denied-icon">💎</div>
                <h2 className="admin-access-denied-title">Funzionalità Premium</h2>
                <p className="admin-access-denied-text">
                    L'accesso completo a questo pannello richiede un abbonamento attivo.
                </p>
                <p className="admin-access-denied-hint">
                    Gestisci il tuo abbonamento o attivalo per sbloccare tutte le funzionalità.
                </p>
                <button
                    onClick={handleManageBilling}
                    disabled={isLoading}
                    className="admin-btn-primary"
                    style={{ marginTop: '20px' }}
                >
                    {isLoading ? 'Caricamento...' : 'Gestisci Abbonamento'}
                </button>
            </div>
        </div>
    );
};

export default SubscriptionRequired;