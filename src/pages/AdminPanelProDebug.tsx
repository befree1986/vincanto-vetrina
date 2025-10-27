/* eslint-disable jsx-a11y/label-has-associated-control, jsx-a11y/no-autofocus */
import React from 'react';
import './AdminPanelPro.css';

const AdminPanelPro: React.FC = () => {
  console.log('🚀 AdminPanelPro component rendering (DEBUG VERSION)...');

  try {
    return (
      <div className="admin-panel-pro">
        <div className="debug-container">
          <h1>🟢 Admin Panel - Debug Version</h1>
          <p>Se vedi questo messaggio, il componente si sta caricando correttamente.</p>
          <p>Timestamp: {new Date().toLocaleString()}</p>
          <div className="debug-info-box">
            <h2>🔍 Diagnostica:</h2>
            <ul className="debug-list">
              <li>✅ Componente React caricato</li>
              <li>✅ CSS importato</li>
              <li>✅ Rendering completato</li>
              <li>⏳ Pronto per debug completo</li>
            </ul>
          </div>
        </div>
      </div>
    );
  } catch (error) {
    console.error('❌ Errore nel componente AdminPanelPro:', error);
    return (
      <div className="debug-error">
        <h1>❌ Errore nel caricamento</h1>
        <p>Si è verificato un errore: {error instanceof Error ? error.message : 'Errore sconosciuto'}</p>
      </div>
    );
  }
};

export default AdminPanelPro;