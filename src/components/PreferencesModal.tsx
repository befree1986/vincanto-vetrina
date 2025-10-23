import { useState } from 'react';
import './PreferencesModal.css';

interface CookiePreferences {
  essential?: boolean;
  analytics: boolean;
  marketing: boolean;
}

interface PreferencesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (preferences: CookiePreferences) => void;
  initialPreferences: CookiePreferences;
}

const PreferencesModal: React.FC<PreferencesModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialPreferences,
}) => {
  if (!isOpen) return null;

  const [analytics, setAnalytics] = useState(initialPreferences.analytics);
  const [marketing, setMarketing] = useState(initialPreferences.marketing);

  const handleSave = () => {
    onSave({
      essential: initialPreferences.essential ?? true,
      analytics,
      marketing
    });
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <h2 className="modal-title">Preferenze per un’esperienza su misura</h2>
        <p className="modal-description">
          Personalizza le preferenze di tracciamento per una navigazione ottimale.
        </p>

        <div className="modal-checkboxes">
          <label>
            <input
              type="checkbox"
              checked={analytics}
              onChange={() => setAnalytics(!analytics)}
            />
            Cookie di Analisi
          </label>

          <label>
            <input
              type="checkbox"
              checked={marketing}
              onChange={() => setMarketing(!marketing)}
            />
            Cookie di Marketing
          </label>
        </div>

        <div className="modal-actions">
          <button className="btn-outline" onClick={onClose}>ANNULLA</button>
          <button className="btn-filled" onClick={handleSave}>SALVA</button>
        </div>
      </div>
    </div>
  );
};

export default PreferencesModal;