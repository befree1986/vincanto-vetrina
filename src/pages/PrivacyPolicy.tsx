import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Helmet } from "react-helmet";
import { privacyPolicyContent } from "../sections/data/privacyPolicy";
import "./PolicyPage.css";

const PrivacyPolicy = () => {
  const { i18n } = useTranslation();
  const lang = (i18n.language || "it").slice(0, 2);
  const content = privacyPolicyContent[lang] || privacyPolicyContent.it;

  const pageTitle = lang === "it" ? "Informativa sulla Privacy | Vincanto" : lang === "de" ? "Datenschutzerklärung | Vincanto" : lang === "fr" ? "Politique de Confidentialité | Vincanto" : "Privacy Policy | Vincanto";
  const pageDescription = lang === "it" ? "Informativa completa sulla privacy di Vincanto. Scopri come trattiamo i tuoi dati personali e i tuoi diritti secondo il GDPR." : lang === "de" ? "Vollständige Datenschutzerklärung von Vincanto. Erfahren Sie, wie wir Ihre persönlichen Daten behandeln und Ihre Rechte gemäß DSGVO." : lang === "fr" ? "Politique de confidentialité complète de Vincanto. Découvrez comment nous traitons vos données personnelles et vos droits selon le RGPD." : "Complete privacy policy of Vincanto. Learn how we handle your personal data and your rights under GDPR.";

  return (
    <>
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href="https://www.vincantomaiori.it/privacy-policy" />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDescription} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://www.vincantomaiori.it/privacy-policy" />
      </Helmet>
      <main className="policy-container">
        <h1>{lang === "it" ? "Informativa sulla Privacy" : lang === "de" ? "Datenschutzerklärung" : lang === "fr" ? "Politique de Confidentialité" : "Privacy Policy"}</h1>
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
    </>
  );
};

export default PrivacyPolicy;