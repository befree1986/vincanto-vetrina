import { useTranslation } from "react-i18next";
import { cookiePolicyContent } from "../sections/data/cookiePolicy";
import "./PolicyPage.css";

const CookiePolicy = () => {
  const { i18n } = useTranslation();
  const lang = (i18n.language || "it").slice(0, 2);
  const content = cookiePolicyContent[lang] || cookiePolicyContent.it;

  const browserLinks = (
    <ul>
      <li><a href="https://support.google.com/chrome/answer/95647" target="_blank" rel="noopener noreferrer">Google Chrome</a></li>
      <li><a href="https://support.mozilla.org/it/kb/Gestione%20dei%20cookie" target="_blank" rel="noopener noreferrer">Mozilla Firefox</a></li>
      <li><a href="https://support.apple.com/it-it/guide/safari/sfri11471/mac" target="_blank" rel="noopener noreferrer">Safari</a></li>
      <li><a href="https://support.microsoft.com/it-it/topic/eliminare-e-gestire-i-cookie-168dab11-0753-043d-7c16-ede5947fc64d" target="_blank" rel="noopener noreferrer">Microsoft Edge</a></li>
    </ul>
  );

  return (
    <main className="policy-container">
      <h1>{lang === "it" ? "Cookie Policy" : lang === "de" ? "Cookie-Richtlinie" : lang === "fr" ? "Politique de Cookies" : "Cookie Policy"}</h1>
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
          {section.id === "disable" && browserLinks}
        </section>
      ))}

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

export default CookiePolicy;