import React, { useState } from "react";
import "./CookiePreferences.css";

interface Preferences {
  analytics: boolean;
  marketing: boolean;
}

interface Props {
  initialPreferences: Preferences;
  onSave: (prefs: Preferences) => void;
  onClose: () => void;
}

const CookiePreferences: React.FC<Props> = ({ initialPreferences, onSave, onClose }) => {
  const [prefs, setPrefs] = useState(initialPreferences);

  const handleToggle = (key: keyof Preferences) => {
    setPrefs(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="popup-background">
      <div className="popup-card">
        <h2 className="popup-title">Preferenze per un'esperienza su misura</h2>
        <p className="popup-description">
          Personalizza le preferenze di tracciamento per un'esperienza su misura.
        </p>

        <div className="checkbox-group">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={prefs.analytics}
              onChange={() => handleToggle("analytics")}
            />
            📊 Cookie di Analisi
          </label>

          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={prefs.marketing}
              onChange={() => handleToggle("marketing")}
            />
            🎯 Cookie di Marketing
          </label>
        </div>

        <div className="popup-buttons">
          <button className="btn-outline" onClick={onClose}>ANNULLA</button>
          <button className="btn-filled" onClick={() => onSave(prefs)}>SALVA</button>
        </div>
      </div>
    </div>
  );
};

export default CookiePreferences;