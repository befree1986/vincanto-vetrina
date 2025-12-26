import React, { Suspense } from 'react';
import { useAdminRole } from '../hooks/useAdminRole';
import './ProtectedRoute.css';

interface ProtectedRouteProps {
  children: React.ReactElement;
  requiredRole: 'superadmin' | 'admin';
  fallback?: React.ReactElement;
}

/**
 * Componente per proteggere le rotte admin
 * Controlla il ruolo prima di renderizzare il componente protetto
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRole,
  fallback
}) => {
  const { role, isLoading, hasAccess } = useAdminRole();

  // Mentre carica il ruolo, mostra un loader
  if (isLoading) {
    return (
      <div className="protected-route-loading-container">
        <div className="protected-route-loading-content">
          <div className="protected-route-loading-icon">⏳</div>
          <p className="protected-route-loading-text">Verifica autorizzazioni...</p>
        </div>
      </div>
    );
  }

  // Se non ha accesso, renderizza il fallback oppure nega l'accesso
  if (!hasAccess(requiredRole)) {
    return fallback || (
      <div className="protected-route-denied-container">
        <div className="protected-route-denied-card">
          <div className="protected-route-denied-icon">🔐</div>
          <h2 className="protected-route-denied-title">Accesso Negato</h2>
          <p className="protected-route-denied-message">
            Non hai i permessi necessari per accedere a questa sezione.
          </p>
          <p className="protected-route-denied-role-info">
            Ruolo richiesto: <strong>{requiredRole === 'superadmin' ? 'SuperAdmin' : 'Admin'}</strong>
            <br />
            Ruolo attuale: <strong>{role || 'Guest'}</strong>
          </p>
          <a
            href="/"
            className="protected-route-denied-link"
          >
            🏠 Torna alla Home
          </a>
          <a
            href="/admin/login"
            className="protected-route-denied-link protected-route-denied-link-secondary"
          >
            🔑 Accedi
          </a>
        </div>
      </div>
    );
  }

  // Renderizza il componente protetto con Suspense
  return (
    <Suspense fallback={
      <div className="protected-route-suspense-container">
        <div className="protected-route-suspense-content">
          <div className="protected-route-suspense-icon">⏳</div>
          <p className="protected-route-suspense-text">Caricamento pannello admin...</p>
        </div>
      </div>
    }>
      {children}
    </Suspense>
  );
};

export default ProtectedRoute;
