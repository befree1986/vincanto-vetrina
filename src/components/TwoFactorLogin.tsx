import React, { useState } from 'react';
import './TwoFactorLogin.css';

interface TwoFactorLoginProps {
  onLoginSuccess: (token: string, role: string) => void;
  onLoginError?: (error: string) => void;
}

interface AvailableRole {
  role: string;
  id: number;
}

/**
 * Componente per login admin con autenticazione a 2 fattori
 * Flow: Email/Password → Role Selection (opzionale) → TOTP (se abilitato) → Success
 */
export const TwoFactorLogin: React.FC<TwoFactorLoginProps> = ({
  onLoginSuccess,
  onLoginError
}) => {
  const [step, setStep] = useState<'password' | 'role' | 'totp'>('password');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [availableRoles, setAvailableRoles] = useState<AvailableRole[]>([]);
  const [totpToken, setTotpToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [requiresSetup, setRequiresSetup] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');

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

      // Se è richiesta la selezione del ruolo
      if (data.requiresRoleSelection) {
        setAvailableRoles(data.availableRoles || []);
        setStep('role');
        return;
      }

      // Se 2FA non è richiesto, login completato (LEGACY - NON DOVREBBE SUCCEDERE PIÙ)
      if (!data.requires2FA) {
        console.warn('⚠️ Login senza 2FA - Modalità legacy deprecata');
        console.log('✅ Login completato senza 2FA:', { token: data.token, role: data.role });
        localStorage.setItem('vincanto_admin_token', data.token);
        localStorage.setItem('vincanto_admin_role', data.role);
        localStorage.setItem('vincanto_admin_email', email);
        console.log('💾 Salvato in localStorage:', {
          token: localStorage.getItem('vincanto_admin_token'),
          role: localStorage.getItem('vincanto_admin_role'),
          email: localStorage.getItem('vincanto_admin_email')
        });
        onLoginSuccess(data.token, data.role);
        return;
      }

      // Gestione 2FA: se il backend richiede setup, prepara QR
      setRequiresSetup(!!data.requiresSetup);
      setStep('totp');

      if (data.requiresSetup) {
        try {
          const qrResp = await fetch('/api/unified?action=admin/2fa/setup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, role: data.role })
          });
          const qrData = await qrResp.json();
          if (qrResp.ok && qrData.success) {
            setQrCodeUrl(qrData.qrCodeUrl || qrData.otpauthUrl || '');
          } else {
            console.warn('2FA setup non disponibile:', qrData.error);
          }
        } catch (e) {
          console.warn('Errore fetch QR 2FA:', e);
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Errore di connessione';
      setError(errorMessage);
      if (onLoginError) onLoginError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Step 1b: Scegli il ruolo tra quelli disponibili
   */
  const handleRoleSelection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRole) {
      setError('Seleziona un ruolo');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/unified?action=admin/login-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password, selectedRole })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Errore nella selezione del ruolo');
      }

      // Gestione 2FA
      setRequiresSetup(!!data.requiresSetup);
      setStep('totp');

      if (data.requiresSetup) {
        try {
          const qrResp = await fetch('/api/unified?action=admin/2fa/setup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, selectedRole: selectedRole })
          });
          const qrData = await qrResp.json();
          if (qrResp.ok && qrData.success) {
            setQrCodeUrl(qrData.qrCodeUrl || qrData.otpauthUrl || '');
          }
        } catch (e) {
          console.warn('Errore fetch QR 2FA:', e);
        }
      }
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
        body: JSON.stringify({ email, token: totpToken, selectedRole: selectedRole || undefined })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Codice TOTP non valido');
      }

      // Login completato
      localStorage.setItem('vincanto_admin_token', data.token);
      localStorage.setItem('vincanto_admin_role', data.role);
      localStorage.setItem('vincanto_admin_email', email);
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
    setSelectedRole('');
    setTotpToken('');
    setError('');
    setAvailableRoles([]);
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

        {/* STEP 1.5: Selezione Ruolo */}
        {step === 'role' && (
          <form onSubmit={handleRoleSelection} className="two-factor-login-form">
            <div className="two-factor-login-field">
              <label className="two-factor-login-label">Scegli il tuo ruolo:</label>
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="two-factor-login-input"
                title="Seleziona un ruolo"
                required
                autoFocus
              >
                <option value="">-- Seleziona un ruolo --</option>
                {availableRoles.map((role) => (
                  <option key={role.id} value={role.role}>
                    {role.role === 'superadmin' ? '👑 Superadmin' : '🔐 Admin'}
                  </option>
                ))}
              </select>
            </div>

            {error && <div className="two-factor-login-error">{error}</div>}

            <button
              type="submit"
              disabled={loading || !selectedRole}
              className="two-factor-login-button"
            >
              {loading ? '⏳ Verifica...' : '→ Continua'}
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

            {requiresSetup && (
              <div className="two-factor-login-qr-setup" aria-describedby="totp-setup-desc">
                <h3 className="two-factor-login-section-title" id="totp-setup-title">Configura 2FA</h3>
                <p id="totp-setup-desc" className="two-factor-login-help-text">
                  Scansiona il QR code con Google Authenticator o inserisci manualmente l'otpauth.
                </p>
                {qrCodeUrl && (
                  <div className="two-factor-login-qr-box">
                    {/* Se è un data URL di immagine, lo mostriamo; altrimenti mostriamo l'otpauth */}
                    {qrCodeUrl.startsWith('data:image') ? (
                      <img src={qrCodeUrl} alt="QR code TOTP" className="two-factor-login-qr" />
                    ) : (
                      <div className="two-factor-login-otpauth">{qrCodeUrl}</div>
                    )}
                  </div>
                )}
              </div>
            )}

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
