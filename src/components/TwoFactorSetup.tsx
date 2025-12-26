import React, { useState } from 'react';
import './TwoFactorSetup.css';

interface TwoFactorSetupProps {
  userEmail?: string;
  onComplete?: () => void;
}

/**
 * Componente per gestire il setup dell'autenticazione a 2 fattori (TOTP)
 * Mostra QR code da scansionare e form per verifica codice
 */
export const TwoFactorSetup: React.FC<TwoFactorSetupProps> = ({ userEmail = '', onComplete }) => {
  const [step, setStep] = useState<'initial' | 'qr' | 'verify' | 'complete'>('initial');
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [totpToken, setTotpToken] = useState<string>('');
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [emailInput, setEmailInput] = useState<string>(userEmail);

  /**
   * Step 1: Genera il QR code chiamando /api/admin/2fa/setup
   */
  const handleSetup = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/unified?action=admin/2fa/setup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email: emailInput })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Errore durante il setup 2FA');
      }

      setQrCodeUrl(data.qrCodeUrl);
      setStep('qr');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore di connessione');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Step 2: Verifica il codice TOTP e attiva 2FA
   */
  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (totpToken.length !== 6) {
      setError('Il codice deve essere di 6 cifre');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/unified?action=admin/2fa/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          email: userEmail,
          token: totpToken 
        })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Codice non valido');
      }

      setRecoveryCodes(data.recoveryCodes || []);
      setStep('complete');
      
      // Callback opzionale
      if (onComplete) {
        setTimeout(() => onComplete(), 3000);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore di verifica');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Copia i codici di recovery negli appunti
   */
  const handleCopyRecoveryCodes = () => {
    const codesText = recoveryCodes.join('\n');
    navigator.clipboard.writeText(codesText);
    alert('Codici di recovery copiati negli appunti!');
  };

  /**
   * Download dei codici di recovery come file .txt
   */
  const handleDownloadRecoveryCodes = () => {
    const codesText = recoveryCodes.join('\n');
    const blob = new Blob([codesText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'vincanto-recovery-codes.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="two-factor-setup-container">
      {/* STEP INITIAL: Spiegazione e bottone per iniziare */}
      {step === 'initial' && (
        <div className="two-factor-setup-card">
          <div className="two-factor-setup-icon">🔐</div>
          <h2 className="two-factor-setup-title">Attiva Autenticazione a 2 Fattori</h2>
          <p className="two-factor-setup-description">
            Proteggi il tuo account admin con un layer di sicurezza aggiuntivo.
            Dopo aver inserito la password, dovrai inserire un codice a 6 cifre
            generato dalla tua app di autenticazione (Google Authenticator, Authy, ecc.).
          </p>
            <div className="two-factor-setup-form two-factor-setup-form-initial">
              <input
                type="email"
                placeholder="Email admin"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                className="two-factor-setup-input"
              />
            </div>
          <div className="two-factor-setup-info">
            <h3>Cosa ti serve:</h3>
            <ul>
              <li>📱 Uno smartphone con Google Authenticator o app TOTP</li>
              <li>📸 Possibilità di scansionare un QR code</li>
              <li>📝 Un posto sicuro per salvare i codici di recovery</li>
            </ul>
          </div>
          <button
            onClick={handleSetup}
            disabled={loading}
            className="two-factor-setup-button"
          >
            {loading ? '⏳ Generazione...' : '✅ Inizia Setup 2FA'}
          </button>
          {error && <div className="two-factor-setup-error">{error}</div>}
        </div>
      )}

      {/* STEP QR: Mostra QR code e form per verifica */}
      {step === 'qr' && (
        <div className="two-factor-setup-card">
          <div className="two-factor-setup-icon">📱</div>
          <h2 className="two-factor-setup-title">Scansiona il QR Code</h2>
          <div className="two-factor-setup-qr-container">
            {qrCodeUrl && (
              <img
                src={qrCodeUrl}
                alt="QR Code per 2FA"
                className="two-factor-setup-qr-image"
              />
            )}
          </div>
          <div className="two-factor-setup-instructions">
            <h3>Istruzioni:</h3>
            <ol>
              <li>Apri Google Authenticator (o app TOTP equivalente)</li>
              <li>Tocca "+" o "Aggiungi account"</li>
              <li>Scansiona il QR code qui sopra</li>
              <li>Inserisci il codice a 6 cifre generato dall'app</li>
            </ol>
          </div>
          <form onSubmit={handleVerify} className="two-factor-setup-form">
            <input
              type="text"
              placeholder="000000"
              maxLength={6}
              value={totpToken}
              onChange={(e) => setTotpToken(e.target.value.replace(/\D/g, ''))}
              className="two-factor-setup-input"
              autoFocus
            />
            <button
              type="submit"
              disabled={loading || totpToken.length !== 6}
              className="two-factor-setup-button"
            >
              {loading ? '⏳ Verifica...' : '✅ Verifica e Attiva'}
            </button>
          </form>
          {error && <div className="two-factor-setup-error">{error}</div>}
        </div>
      )}

      {/* STEP COMPLETE: Mostra codici di recovery */}
      {step === 'complete' && (
        <div className="two-factor-setup-card">
          <div className="two-factor-setup-icon">✅</div>
          <h2 className="two-factor-setup-title">2FA Attivato con Successo!</h2>
          <div className="two-factor-setup-success-message">
            L'autenticazione a 2 fattori è ora attiva per il tuo account.
          </div>
          <div className="two-factor-setup-recovery-container">
            <h3 className="two-factor-setup-recovery-title">⚠️ Codici di Recovery</h3>
            <p className="two-factor-setup-recovery-warning">
              Salva questi codici in un posto sicuro! Potrai usarli per accedere
              se perdi il tuo dispositivo. <strong>Non verranno mostrati di nuovo.</strong>
            </p>
            <div className="two-factor-setup-recovery-codes">
              {recoveryCodes.map((code, index) => (
                <div key={index} className="two-factor-setup-recovery-code">
                  {code}
                </div>
              ))}
            </div>
            <div className="two-factor-setup-recovery-actions">
              <button
                onClick={handleCopyRecoveryCodes}
                className="two-factor-setup-button-secondary"
              >
                📋 Copia Codici
              </button>
              <button
                onClick={handleDownloadRecoveryCodes}
                className="two-factor-setup-button-secondary"
              >
                💾 Scarica Codici
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TwoFactorSetup;
