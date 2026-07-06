import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
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

const translations: Record<string, Record<string, string>> = {
  it: {
    title: "Preferenze cookie",
    description: "Personalizza le tue preferenze. Puoi modificarle in qualsiasi momento.",
    essential: "Cookie tecnici (sempre attivi)",
    essentialDesc: "Necessari per il funzionamento del sito. Non possono essere disattivati.",
    analytics: "Cookie di analisi",
    analyticsDesc: "Google Analytics – statistiche anonime e aggregate sui visitatori.",
    marketing: "Cookie di marketing",
    marketingDesc: "Personalizzazione di contenuti e pubblicità.",
    moreInfo: "Maggiori informazioni",
    cancel: "ANNULLA",
    save: "SALVA",
  },
  en: {
    title: "Cookie preferences",
    description: "Customize your preferences. You can change them at any time.",
    essential: "Technical cookies (always active)",
    essentialDesc: "Required for the site to work. They cannot be disabled.",
    analytics: "Analytics cookies",
    analyticsDesc: "Google Analytics – anonymous and aggregated visitor statistics.",
    marketing: "Marketing cookies",
    marketingDesc: "Content and advertising personalization.",
    moreInfo: "More information",
    cancel: "CANCEL",
    save: "SAVE",
  },
  de: {
    title: "Cookie-Einstellungen",
    description: "Passen Sie Ihre Einstellungen an. Sie können diese jederzeit ändern.",
    essential: "Technische Cookies (immer aktiv)",
    essentialDesc: "Für den Betrieb der Website erforderlich. Können nicht deaktiviert werden.",
    analytics: "Analyse-Cookies",
    analyticsDesc: "Google Analytics – anonyme und aggregierte Besucherstatistiken.",
    marketing: "Marketing-Cookies",
    marketingDesc: "Personalisierung von Inhalten und Werbung.",
    moreInfo: "Weitere Informationen",
    cancel: "ABBRECHEN",
    save: "SPEICHERN",
  },
  fr: {
    title: "Préférences cookies",
    description: "Personnalisez vos préférences. Vous pouvez les modifier à tout moment.",
    essential: "Cookies techniques (toujours actifs)",
    essentialDesc: "Nécessaires au fonctionnement du site. Ils ne peuvent pas être désactivés.",
    analytics: "Cookies analytiques",
    analyticsDesc: "Google Analytics – statistiques anonymes et agrégées des visiteurs.",
    marketing: "Cookies marketing",
    marketingDesc: "Personnalisation des contenus et de la publicité.",
    moreInfo: "Plus d'informations",
    cancel: "ANNULER",
    save: "ENREGISTRER",
  },
};

const PreferencesModal: React.FC<PreferencesModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialPreferences,
}) => {
  const { i18n } = useTranslation();
  const lang = (i18n.language || 'it').slice(0, 2);
  const t = translations[lang] || translations.it;

  const [analytics, setAnalytics] = useState(initialPreferences.analytics);
  const [marketing, setMarketing] = useState(initialPreferences.marketing);

  if (!isOpen) return null;

  const handleSave = () => {
    onSave({
      essential: initialPreferences.essential ?? true,
      analytics,
      marketing,
    });
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <h2 className="modal-title">{t.title}</h2>
        <p className="modal-description">{t.description}</p>

        <div className="modal-checkboxes">
          <label className="checkbox-row disabled">
            <input type="checkbox" checked disabled />
            <span>
              <strong>{t.essential}</strong>
              <small>{t.essentialDesc}</small>
            </span>
          </label>

          <label className="checkbox-row">
            <input
              type="checkbox"
              checked={analytics}
              onChange={() => setAnalytics(!analytics)}
            />
            <span>
              <strong>{t.analytics}</strong>
              <small>{t.analyticsDesc}</small>
            </span>
          </label>

          <label className="checkbox-row">
            <input
              type="checkbox"
              checked={marketing}
              onChange={() => setMarketing(!marketing)}
            />
            <span>
              <strong>{t.marketing}</strong>
              <small>{t.marketingDesc}</small>
            </span>
          </label>
        </div>

        <p className="modal-more-info">
          <Link to="/cookie-policy" target="_blank" onClick={onClose}>
            {t.moreInfo}
          </Link>
        </p>

        <div className="modal-actions">
          <button className="btn-outline" onClick={onClose}>{t.cancel}</button>
          <button className="btn-filled" onClick={handleSave}>{t.save}</button>
        </div>
      </div>
    </div>
  );
};

export default PreferencesModal;
