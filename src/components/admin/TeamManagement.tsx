import React from 'react';

const TeamManagement: React.FC = () => {
    return (
        <div className="admin-section">
            <h2>👥 Gestione Team</h2>
            <div className="admin-notice">
                <p>Questa funzionalità ti permetterà di invitare altri utenti a collaborare nella gestione del pannello, con permessi limitati (es. solo gestione prenotazioni o contenuti).</p>
                <p>Il SuperAdmin avrà sempre la supervisione completa su tutti gli utenti e potrà definire i limiti per ogni team.</p>
                <p><strong>Funzionalità in sviluppo.</strong></p>
            </div>
        </div>
    );
};

export default TeamManagement;