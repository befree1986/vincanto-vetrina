import React, { useState } from 'react';
import CalendarManager from '../components/CalendarManager';
import './Admin.css';

type AdminTab = 'calendars' | 'bookings' | 'settings';

const Admin: React.FC = () => {
    const [activeTab, setActiveTab] = useState<AdminTab>('calendars');

    const renderTabContent = () => {
        switch (activeTab) {
            case 'calendars':
                return <CalendarManager />;
            case 'bookings':
                return (
                    <div className="admin-section">
                        <h2>📋 Gestione Prenotazioni</h2>
                        <p>Interfaccia per la gestione delle prenotazioni in arrivo...</p>
                    </div>
                );
            case 'settings':
                return (
                    <div className="admin-section">
                        <h2>⚙️ Impostazioni</h2>
                        <p>Configurazioni del sistema in arrivo...</p>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="admin-page">
            <div className="admin-header">
                <h1>🛠️ Pannello di Amministrazione</h1>
                <div className="admin-nav">
                    <button
                        className={`nav-tab ${activeTab === 'calendars' ? 'active' : ''}`}
                        onClick={() => setActiveTab('calendars')}
                    >
                        🗓️ Calendari
                    </button>
                    <button
                        className={`nav-tab ${activeTab === 'bookings' ? 'active' : ''}`}
                        onClick={() => setActiveTab('bookings')}
                    >
                        📋 Prenotazioni
                    </button>
                    <button
                        className={`nav-tab ${activeTab === 'settings' ? 'active' : ''}`}
                        onClick={() => setActiveTab('settings')}
                    >
                        ⚙️ Impostazioni
                    </button>
                </div>
            </div>

            <div className="admin-content">
                {renderTabContent()}
            </div>
        </div>
    );
};

export default Admin;