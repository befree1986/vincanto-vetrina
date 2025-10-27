/**
 * OAuth Callback Handler Page
 * Gestisce il callback di ritorno dall'autenticazione Google OAuth2
 */

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './OAuthCallback.css';

const OAuthCallback: React.FC = () => {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Elaborazione autenticazione...');
  const navigate = useNavigate();

  useEffect(() => {
    handleCallback();
  }, []);

  const handleCallback = async () => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');
      const state = urlParams.get('state');
      const error = urlParams.get('error');

      if (error) {
        throw new Error(`Errore OAuth: ${error}`);
      }

      if (!code || state !== 'vincanto_calendar_auth') {
        throw new Error('Parametri OAuth non validi');
      }

      setMessage('✅ Autenticazione completata con successo!');
      setStatus('success');

      // Dopo 2 secondi, torna alla pagina admin
      setTimeout(() => {
        navigate('/admin');
      }, 2000);

    } catch (error) {
      console.error('Errore nel callback OAuth:', error);
      setMessage(`❌ Errore: ${error}`);
      setStatus('error');

      // Dopo 3 secondi, torna alla pagina admin anche in caso di errore
      setTimeout(() => {
        navigate('/admin');
      }, 3000);
    }
  };

  return (
    <div className="oauth-callback-container">
      <div className="oauth-callback-card">
        <div className="oauth-callback-icon">
          {status === 'loading' && '🔄'}
          {status === 'success' && '✅'}
          {status === 'error' && '❌'}
        </div>

        <h2 className="oauth-callback-title">
          Google Calendar OAuth
        </h2>

        <p className="oauth-callback-message">
          {message}
        </p>

        {status === 'loading' && (
          <div className="oauth-callback-spinner"></div>
        )}

        {status !== 'loading' && (
          <p className="oauth-callback-redirect">
            Reindirizzamento in corso...
          </p>
        )}
      </div>
    </div>
  );
};

export default OAuthCallback;