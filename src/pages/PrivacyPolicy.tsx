import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { privacyPolicyContent } from "../sections/data/privacyPolicy";
import "./PolicyPage.css";

const PrivacyPolicy = () => {
  const { i18n } = useTranslation();
  const lang = (i18n.language || "it").slice(0, 2);
  const content = privacyPolicyContent[lang] || privacyPolicyContent.it;

  return (
    <main className="policy-container">
      <h1>{lang === "it" ? "Informativa sulla Privacy" : lang === "de" ? "Datenschutzerkl\u00e4rung" : lang === "fr" ? "Politique de Confidentialit\u00e9" : "Privacy Policy"}</h1>
      <p>Last updated / Ultimo aggiornamento: {content.lastUpdated}</p>

      <p className="policy-intro">{content.intro}</p>

      {content.sections.map((section) => (
        <section key={section.id} className="policy-section">
          <h2>{section.title}</h2>
          {section.body && <p>{section.body}</p>}
          {section.list && (
            <ul>
              {section.list.map((item, idx) => (
                <li key={idx}>{item}</li>
              ))}
            </ul>
          )}
          {section.note && <p className="policy-note">{section.note}</p>}
        </section>
      ))}

      <p className="policy-cookie-link">
        {lang === "it" ? "Per i cookie consulta la " : lang === "de" ? "Für Cookies siehe " : lang === "fr" ? "Pour les cookies voir la " : "For cookies please see the "}
        <Link to="/cookie-policy">Cookie Policy</Link>.
      </p>

      <div className="policy-actions">
        <button
          onClick={() => window.history.back()}
          className="close-page-btn"
          aria-label="Close page"
        >
          {lang === "it"
            ? "Chiudi la pagina"
            : lang === "de"
            ? "Seite schliessen"
            : lang === "fr"
            ? "Fermer la page"
            : "Close page"}
        </button>
      </div>
    </main>
  );
};

export default PrivacyPolicy;