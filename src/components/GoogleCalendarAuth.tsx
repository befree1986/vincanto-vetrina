/**
 * Google OAuth2 Authentication Component
 * Gestisce l'autenticazione e la connessione a Google Calendar
 */

import React, { useState, useEffect } from 'react';
import GoogleCalendarApiService from '../services/googleCalendarApiService';
import './GoogleCalendarAuth.css';

interface GoogleCalendarAuthProps {
  onAuthSuccess: (isAuthenticated: boolean) => void;
  onAuthError: (error: string) => void;
}

const GoogleCalendarAuth: React.FC<GoogleCalendarAuthProps> = ({
  onAuthSuccess,
  onAuthError
}) => {
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authInfo, setAuthInfo] = useState<any>(null);
  const [calendarService] = useState(new GoogleCalendarApiService());

  useEffect(() => {
    // Controlla lo stato di autenticazione all'avvio
    updateAuthInfo();

    // Gestisci il callback OAuth se presente nell'URL
    handleOAuthCallback();
  }, []);

  /**
   * Aggiorna le informazioni di autenticazione
   */
  const updateAuthInfo = () => {
    const info = calendarService.getAuthInfo();
    setAuthInfo(info);
    
    if (info.isAuthenticated) {
      onAuthSuccess(true);
    }
  };

  /**
   * Gestisce il callback OAuth dalla redirect
   */
  const handleOAuthCallback = async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const state = urlParams.get('state');
    
    if (code && state === 'vincanto_calendar_auth') {
      setIsAuthenticating(true);
      
      try {
        const success = await calendarService.exchangeCodeForTokens(code);
        
        if (success) {
          updateAuthInfo();
          onAuthSuccess(true);
          
          // Pulisci l'URL rimuovendo i parametri OAuth
          const newUrl = window.location.protocol + "//" + 
                         window.location.host + 
                         window.location.pathname;
          window.history.replaceState({}, document.title, newUrl);
        } else {
          onAuthError('Errore durante l\'autenticazione con Google');
        }
      } catch (error) {
        onAuthError(`Errore OAuth: ${error}`);
      } finally {
        setIsAuthenticating(false);
      }
    }
  };

  /**
   * Avvia il processo di autenticazione
   */
  const handleAuthenticate = () => {
    setIsAuthenticating(true);
    
    try {
      const authUrl = calendarService.generateAuthUrl();
      
      // Salva lo stato corrente prima del redirect
      sessionStorage.setItem('oauth_redirect_from', 'admin_calendar');
      
      // Redirect alla pagina di autenticazione Google
      window.location.href = authUrl;
    } catch (error) {
      setIsAuthenticating(false);
      onAuthError(`Errore nella generazione URL di autenticazione: ${error}`);
    }
  };

  /**
   * Disconnette dall'account Google
   */
  const handleDisconnect = () => {
    try {
      calendarService.disconnect();
      updateAuthInfo();
      onAuthSuccess(false);
    } catch (error) {
      onAuthError(`Errore durante la disconnessione: ${error}`);
    }
  };

  /**
   * Testa la connessione API
   */
  const testConnection = async () => {
    setIsAuthenticating(true);
    
    try {
      const events = await calendarService.fetchCalendarEvents('primary', 5);
      
      if (events && events.length >= 0) {
        onAuthSuccess(true);
        alert(`✅ Connessione OK! Trovati ${events.length} eventi nel calendario.`);
      } else {
        throw new Error('Nessun evento recuperato');
      }
    } catch (error) {
      onAuthError(`Errore nel test della connessione: ${error}`);
    } finally {
      setIsAuthenticating(false);
    }
  };

  return (
    <div className="google-calendar-auth">
      <div className="auth-container">
        <div className="auth-header">
          <h3>🔐 Autenticazione Google Calendar</h3>
          <p>Connetti il tuo account Google per la sincronizzazione automatica</p>
        </div>

        {!authInfo?.isAuthenticated ? (
          <div className="auth-disconnected">
            <div className="auth-status error">
              <span className="status-icon">❌</span>
              <span>Non connesso a Google Calendar</span>
            </div>

            <div className="auth-info">
              <h4>Autorizzazioni richieste:</h4>
              <ul>
                <li>📅 Lettura eventi calendario</li>
                <li>✏️ Creazione e modifica eventi</li>
                <li>🔄 Sincronizzazione automatica</li>
                <li>🗑️ Eliminazione eventi (solo quelli creati dall'app)</li>
              </ul>
            </div>

            <div className="auth-actions">
              <button 
                onClick={handleAuthenticate}
                disabled={isAuthenticating}
                className="auth-btn primary"
              >
                {isAuthenticating ? '🔄 Connessione...' : '🔗 Connetti Google Calendar'}
              </button>
            </div>
          </div>
        ) : (
          <div className="auth-connected">
            <div className="auth-status success">
              <span className="status-icon">✅</span>
              <span>Connesso a Google Calendar</span>
            </div>

            <div className="auth-details">
              <div className="auth-detail-row">
                <span className="label">🔑 Stato:</span>
                <span className="value">Autenticato</span>
              </div>
              
              {authInfo.expiresAt && (
                <div className="auth-detail-row">
                  <span className="label">⏰ Scadenza:</span>
                  <span className="value">
                    {authInfo.expiresAt.toLocaleString('it-IT')}
                  </span>
                </div>
              )}
              
              <div className="auth-detail-row">
                <span className="label">🔄 Refresh Token:</span>
                <span className="value">
                  {authInfo.hasRefreshToken ? '✅ Disponibile' : '❌ Non disponibile'}
                </span>
              </div>
            </div>

            <div className="auth-actions">
              <button 
                onClick={testConnection}
                disabled={isAuthenticating}
                className="auth-btn secondary"
              >
                {isAuthenticating ? '🔄 Testing...' : '🔧 Test Connessione'}
              </button>
              
              <button 
                onClick={handleDisconnect}
                className="auth-btn danger"
              >
                🔓 Disconnetti
              </button>
            </div>
          </div>
        )}

        {isAuthenticating && (
          <div className="auth-loading">
            <div className="loading-spinner"></div>
            <p>Autenticazione in corso...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default GoogleCalendarAuth;