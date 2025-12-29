import React, { useState } from 'react';
import './TwoFactorLogin.css';

interface TwoFactorLoginProps {
  onLoginSuccess: (token: string, role: string) => void;
  onLoginError?: (error: string) => void;
}

/**
 * Componente per login admin con autenticazione a 2 fattori
 * Flow: Email/Password → TOTP (se abilitato) → Success
 */
export const TwoFactorLogin: React.FC<TwoFactorLoginProps> = ({
  onLoginSuccess,
  onLoginError
}) => {
  const [step, setStep] = useState<'password' | 'totp'>('password');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [totpToken, setTotpToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  /**
   * Step 1: Verifica email e password
   */
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/unified?action=admin/login-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Credenziali non valide');
      }

      // Se 2FA non è richiesto, login completato
      if (!data.requires2FA) {
        console.log('✅ Login completato senza 2FA:', { token: data.token, role: data.role });
        localStorage.setItem('vincanto_admin_token', data.token);
        localStorage.setItem('vincanto_admin_role', data.role);
        console.log('💾 Salvato in localStorage:', {
          token: localStorage.getItem('vincanto_admin_token'),
          role: localStorage.getItem('vincanto_admin_role')
        });
        onLoginSuccess(data.token, data.role);
        return;
      }

      // Altrimenti, passa allo step TOTP
      setStep('totp');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Errore di connessione';
      setError(errorMessage);
      if (onLoginError) onLoginError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Step 2: Verifica codice TOTP
   */
  const handleTotpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (totpToken.length !== 6) {
      setError('Il codice deve essere di 6 cifre');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/unified?action=admin/login-totp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, token: totpToken })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Codice TOTP non valido');
      }

      // Login completato
      localStorage.setItem('vincanto_admin_token', data.token);
      localStorage.setItem('vincanto_admin_role', data.role);
      onLoginSuccess(data.token, data.role);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Errore di verifica';
      setError(errorMessage);
      if (onLoginError) onLoginError(errorMessage);
      
      // Reset token input su errore
      setTotpToken('');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Torna allo step password
   */
  const handleBackToPassword = () => {
    setStep('password');
    setTotpToken('');
    setError('');
  };

  return (
    <div className="two-factor-login-container">
      <div className="two-factor-login-card">
        <div className="two-factor-login-header">
          <div className="two-factor-login-icon">🔐</div>
          <h2 className="two-factor-login-title">Admin Login</h2>
        </div>

        {/* STEP 1: Email e Password */}
        {step === 'password' && (
          <form onSubmit={handlePasswordSubmit} className="two-factor-login-form">
            <div className="two-factor-login-field">
              <label className="two-factor-login-label">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="two-factor-login-input"
                placeholder="admin@vincanto.it"
                autoComplete="email"
                required
                autoFocus
              />
            </div>

            <div className="two-factor-login-field">
              <label className="two-factor-login-label">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="two-factor-login-input"
                placeholder="••••••••"
                autoComplete="current-password"
                required
              />
            </div>

            {error && <div className="two-factor-login-error">{error}</div>}

            <button
              type="submit"
              disabled={loading || !email || !password}
              className="two-factor-login-button"
            >
              {loading ? '⏳ Verifica...' : '→ Continua'}
            </button>
          </form>
        )}

        {/* STEP 2: Codice TOTP */}
        {step === 'totp' && (
          <div className="two-factor-login-totp-container">
            <div className="two-factor-login-totp-header">
              <div className="two-factor-login-totp-icon">📱</div>
              <p className="two-factor-login-totp-message">
                Inserisci il codice a 6 cifre dalla tua app di autenticazione
              </p>
            </div>

            <form onSubmit={handleTotpSubmit} className="two-factor-login-form">
              <div className="two-factor-login-field">
                <input
                  type="text"
                  value={totpToken}
                  onChange={(e) => setTotpToken(e.target.value.replace(/\D/g, ''))}
                  className="two-factor-login-totp-input"
                  placeholder="000000"
                  maxLength={6}
                  autoFocus
                  required
                />
              </div>

              {error && <div className="two-factor-login-error">{error}</div>}

              <button
                type="submit"
                disabled={loading || totpToken.length !== 6}
                className="two-factor-login-button"
              >
                {loading ? '⏳ Verifica...' : '✅ Accedi'}
              </button>

              <button
                type="button"
                onClick={handleBackToPassword}
                className="two-factor-login-back-button"
                disabled={loading}
              >
                ← Torna indietro
              </button>
            </form>

            <div className="two-factor-login-help">
              <p className="two-factor-login-help-text">
                Usa Google Authenticator, Authy o altra app TOTP
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TwoFactorLogin;
