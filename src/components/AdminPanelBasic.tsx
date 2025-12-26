/* eslint-disable */
// @ts-nocheck
import React from 'react';
import '../pages/AdminPanelPro.css';
import '../styles/AdminSuperAdmin.css';
import ExtraServicesAdmin from './admin/ExtraServicesAdmin';
import { useAdminRole } from '../hooks/useAdminRole';
import { devLog } from '../utils/debug';

/**
 * Pannello Amministratore Semplificato (Basic)
 * Accessibile solo agli admin ordinari
 * Permette la gestione dei servizi extra solamente
 */
const AdminPanelBasic = (): JSX.Element => {
  devLog('🚀 AdminPanelBasic component rendering...');
  
  const { role, isLoading: roleLoading, isAdmin } = useAdminRole();

  // === RENDER ADMIN ROLE GUARD ===
  if (!roleLoading && !isAdmin()) {
    return (
      <div className="admin-access-denied-container">
        <div className="admin-access-denied-card">
          <h1 className="admin-access-denied-icon">🔐</h1>
          <h2 className="admin-access-denied-title">Accesso Negato</h2>
          <p className="admin-access-denied-text">
            Questo pannello richiede i diritti di <strong>amministratore</strong>.
          </p>
          <p className="admin-access-denied-role">
            Ruolo attuale: <strong>{role || 'Non disponibile'}</strong>
          </p>
          <p className="admin-access-denied-hint">
            Contatta il SuperAdmin per ottenere i diritti necessari.
          </p>
        </div>
      </div>
    );
  }

  // Nessun login client-side: accesso gestito da `/admin/login` e ProtectedRoute

  // === RENDER MAIN PANEL ===
  devLog('🎯 Rendering basic admin panel...');
  
  return (
    <div className="admin-panel-pro admin-container">
      {/* Header */}
      <header className="admin-header">
        <div className="admin-header-left">
          <h1>🛎️ Gestione Servizi</h1>
          <span className="admin-version admin-badge admin-badge-info">v1.0</span>
        </div>
        
        <div className="admin-header-actions">
          <div className="admin-flex admin-items-center admin-gap-md">
            {/* Indicatore Status */}
            <div className="admin-badge admin-badge-success">
              ✅ Online
            </div>
            
            {/* User Info */}
            <div className="admin-flex admin-items-center admin-gap-sm">
              <span className="admin-text-muted admin-hidden-mobile">👤 Amministratore</span>
              <div className="admin-badge admin-badge-warning" title="Modalità Admin Ordinario">
                ⚡ Admin
              </div>
            </div>
          </div>
          
          <button 
            className="admin-btn admin-btn-secondary"
            onClick={() => {
              localStorage.removeItem('vincanto_admin_token');
              // Reindirizza alla pagina di login admin
              window.location.href = '/admin/login';
            }}
          >
            <span className="admin-hidden-mobile">📤 Logout</span>
            <span className="admin-visible-mobile">📤</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="admin-main">
        <div className="admin-section admin-animate-fade-in">
          <h2>🛎️ Gestione Servizi Extra</h2>
          <p className="admin-section-description">
            Modifica e configura i servizi aggiuntivi disponibili per gli ospiti.
          </p>
          
          {/* Extra Services Component */}
          <ExtraServicesAdmin />
        </div>

        {/* Info Box */}
        <div className="admin-info-box">
          <h3 className="admin-info-title">ℹ️ Informazioni Pannello</h3>
          <ul className="admin-info-list">
            <li>Puoi aggiungere, modificare ed eliminare i servizi personalizzati</li>
            <li>I cambiamenti sono applicati immediatamente a tutte le prenotazioni</li>
            <li>Per accesso a funzioni avanzate (prezzi, calendari, pagamenti), contatta il SuperAdmin</li>
            <li>Il tuo ruolo: <strong>{role}</strong></li>
          </ul>
        </div>
      </main>
    </div>
  );
};

export default AdminPanelBasic;
