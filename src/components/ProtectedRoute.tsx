import React, { Suspense, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminRole } from '../hooks/useAdminRole';
import ErrorBoundary from './ErrorBoundary';
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
  const { role, isLoading, hasAccess, error } = useAdminRole();
  const navigate = useNavigate();

  const token = localStorage.getItem('vincanto_admin_token');

  console.log('🔐 ProtectedRoute check:', { 
    role, 
    isLoading, 
    requiredRole, 
    hasAccess: hasAccess(requiredRole),
    token,
    storedRole: localStorage.getItem('vincanto_admin_role'),
    error,
    isSuperAdminAccessingAdmin: role === 'superadmin' && requiredRole === 'admin',
    shouldAllow: hasAccess(requiredRole)
  });

  // Reindirizza al login se non c'è token o il ruolo è guest,
  // ma non forzare il redirect quando c'è un errore di verifica del ruolo.
  useEffect(() => {
    if (!isLoading && !error && (role === 'guest' || !token)) {
      navigate('/admin/login', { replace: true });
    }
  }, [role, isLoading, navigate, error, token]);

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

  // Se c'è un errore di verifica del ruolo, mostralo in modo esplicito.
  if (!isLoading && error) {
    return (
      <div className="protected-route-denied-container">
        <div className="protected-route-denied-card">
          <div className="protected-route-denied-icon">⚠️</div>
          <h2 className="protected-route-denied-title">Errore autorizzazione</h2>
          <p className="protected-route-denied-message">
            Non è stato possibile verificare correttamente il tuo ruolo admin.
          </p>
          <p className="protected-route-denied-role-info">
            Messaggio: <strong>{error}</strong>
          </p>
          <a
            href="/admin/login"
            className="protected-route-denied-link protected-route-denied-link-secondary"
          >
            🔑 Torna al login
          </a>
          <button
            type="button"
            className="protected-route-denied-link"
            onClick={() => window.location.reload()}
          >
            ↻ Ricarica pagina
          </button>
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

  // Renderizza il componente protetto con Suspense e ErrorBoundary
  return (
    <ErrorBoundary fallback={
      <div className="protected-route-denied-container">
        <div className="protected-route-denied-card">
          <div className="protected-route-denied-icon">⚠️</div>
          <h2 className="protected-route-denied-title">Errore interno del pannello</h2>
          <p className="protected-route-denied-message">
            Si è verificato un problema nel caricamento della dashboard admin.
          </p>
          <button
            type="button"
            className="protected-route-denied-link"
            onClick={() => window.location.reload()}
          >
            ↻ Ricarica pagina
          </button>
        </div>
      </div>
    }>
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
    </ErrorBoundary>
  );
};

export default ProtectedRoute;
