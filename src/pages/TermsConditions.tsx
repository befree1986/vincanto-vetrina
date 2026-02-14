import { useTranslation } from "react-i18next";
import { Helmet } from "react-helmet";
import "./PolicyPage.css";

const TermsConditions = () => {
  const { i18n } = useTranslation();
  const lang = (i18n.language || "it").slice(0, 2);

  const pageTitle = lang === "it" ? "Termini e Condizioni | Vincanto" : lang === "de" ? "Allgemeine Geschäftsbedingungen | Vincanto" : lang === "fr" ? "Termes et Conditions | Vincanto" : "Terms and Conditions | Vincanto";
  const pageDescription = lang === "it" ? "Termini e condizioni d'uso del sito Vincanto. Informazioni su prenotazioni, pagamenti, cancellazioni e diritti degli utenti." : lang === "de" ? "Allgemeine Geschäftsbedingungen der Vincanto-Website. Informationen zu Buchungen, Zahlungen, Stornierungen und Nutzerrechten." : lang === "fr" ? "Termes et conditions d'utilisation du site Vincanto. Informations sur les réservations, paiements, annulations et droits des utilisateurs." : "Terms and conditions of use for the Vincanto website. Information on bookings, payments, cancellations and user rights.";

  return (
    <>
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href="https://www.vincantomaiori.it/terms-conditions" />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDescription} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://www.vincantomaiori.it/terms-conditions" />
      </Helmet>
      <style>{`
        nav, .navbar, header { display: none !important; }
      `}</style>
      <main className="policy-container">
        <h1>{lang === "it" ? "Termini e Condizioni" : lang === "de" ? "Allgemeine Geschäftsbedingungen" : lang === "fr" ? "Termes et Conditions" : "Terms and Conditions"}</h1>
        <p>Last updated / Ultimo aggiornamento: 20 gennaio 2026</p>

        {lang === "it" ? (
          <>
            <p className="policy-intro">
              L'accesso e l'utilizzo del sito web www.vincantomaiori.it e dei relativi servizi di prenotazione sono regolati dai seguenti Termini e Condizioni. 
              Navigando nel sito e utilizzando i nostri servizi, accetti integralmente le condizioni qui esposte.
            </p>

            <section className="policy-section">
              <h2>1. Oggetto e Ambito di Applicazione</h2>
              <p>I presenti Termini si applicano a tutti i servizi offerti da Vincanto Maiori, inclusi:</p>
              <ul>
                <li>Navigazione del sito web</li>
                <li>Richieste di informazioni e preventivi</li>
                <li>Prenotazioni di soggiorni</li>
                <li>Pagamenti online</li>
                <li>Servizi durante il soggiorno</li>
              </ul>
            </section>

            <section className="policy-section">
              <h2>2. Identificazione del Gestore</h2>
              <p><strong>Vincanto Maiori</strong><br />
              Via Torre di Milo, 7<br />
              84010 Maiori (SA), Italia<br />
              Email: info@vincantomaiori.it<br />
              Tel: +39 333 148 1677<br />
              Codice Identificativo Regionale: 15065004EXT0001</p>
            </section>

            <section className="policy-section">
              <h2>3. Prenotazioni e Contratto di Soggiorno</h2>
              <h3>3.1 Procedura di Prenotazione</h3>
              <p>La prenotazione si perfeziona con:</p>
              <ul>
                <li>Compilazione e invio del modulo di prenotazione</li>
                <li>Ricezione della conferma di disponibilità</li>
                <li>Pagamento dell'acconto o dell'importo totale</li>
                <li>Ricezione della conferma di prenotazione via email</li>
              </ul>

              <h3>3.2 Prezzi e Pagamenti</h3>
              <p>I prezzi includono:</p>
              <ul>
                <li>Soggiorno per il numero di ospiti specificato</li>
                <li>Pulizia finale</li>
                <li>Biancheria da letto e bagno</li>
                <li>Utilizzo di tutti i servizi della struttura</li>
              </ul>
              <p>I prezzi non includono:</p>
              <ul>
                <li>Tassa di soggiorno (€2,00 per adulto per notte, max 5 notti)</li>
                <li>Servizi extra opzionali (colazione, trasferimenti, etc.)</li>
                <li>Consumi extra (se applicabili)</li>
              </ul>

              <h3>3.3 Modalità di Pagamento</h3>
              <p>Sono accettate le seguenti modalità:</p>
              <ul>
                <li>Bonifico bancario</li>
                <li>Carte di credito/debito tramite Stripe</li>
                <li>PayPal</li>
              </ul>
            </section>

            <section className="policy-section">
              <h2>4. Cancellazioni e Rimborsi</h2>
              <h3>4.1 Cancellazione da parte dell'Ospite</h3>
              <p><strong>Cancellazione gratuita:</strong> Fino a 14 giorni prima del check-in</p>
              <p><strong>Cancellazione con penale:</strong> Da 13 a 3 giorni prima: 50% dell'importo versato</p>
              <p><strong>Cancellazione tardiva:</strong> Entro 2 giorni dal check-in: Nessun rimborso</p>

              <h3>4.2 Cancellazione da parte della Struttura</h3>
              <p>In caso di cancellazione forzata (cause di forza maggiore, problemi strutturali), garantiamo il rimborso completo entro 7 giorni lavorativi.</p>
            </section>

            <section className="policy-section">
              <h2>5. Regole di Soggiorno</h2>
              <ul>
                <li><strong>Check-in:</strong> dalle 15:00 alle 20:00</li>
                <li><strong>Check-out:</strong> entro le 10:00</li>
                <li><strong>Numero massimo ospiti:</strong> Come specificato in prenotazione (max 8)</li>
                <li><strong>Animali:</strong> Non ammessi</li>
                <li><strong>Fumo:</strong> Vietato all'interno della struttura</li>
                <li><strong>Feste/Eventi:</strong> Non consentiti senza autorizzazione</li>
                <li><strong>Silenzio:</strong> Dalle 22:00 alle 08:00</li>
              </ul>
            </section>

            <section className="policy-section">
              <h2>6. Responsabilità e Danni</h2>
              <p>L'ospite è responsabile di:</p>
              <ul>
                <li>Eventuali danni causati alla proprietà durante il soggiorno</li>
                <li>Il comportamento di tutti i membri del gruppo</li>
                <li>Il rispetto delle regole di soggiorno</li>
                <li>La custodia dei propri beni personali</li>
              </ul>
              <p>La struttura non è responsabile per:</p>
              <ul>
                <li>Furti o smarrimenti di oggetti personali</li>
                <li>Interruzioni di servizi pubblici (elettricità, acqua, internet)</li>
                <li>Condizioni meteorologiche avverse</li>
              </ul>
            </section>

            <section className="policy-section">
              <h2>7. Proprietà Intellettuale</h2>
              <p>Tutti i contenuti del sito (testi, immagini, loghi, video) sono protetti da diritti d'autore e di proprietà intellettuale. È vietata la riproduzione non autorizzata.</p>
            </section>

            <section className="policy-section">
              <h2>8. Privacy e Trattamento Dati</h2>
              <p>Il trattamento dei dati personali è disciplinato dalla nostra <a href="/privacy-policy">Privacy Policy</a> in conformità al GDPR (Regolamento UE 2016/679).</p>
            </section>

            <section className="policy-section">
              <h2>9. Diritto di Recesso (per Consumatori UE)</h2>
              <p>In conformità alla Direttiva UE 2011/83, il diritto di recesso non si applica ai contratti di alloggio per scopi diversi dall'abitazione, servizi di trasporto, noleggio di autovetture, catering o servizi connessi ad attività ricreative se il contratto prevede una data o un periodo di esecuzione specifici.</p>
            </section>

            <section className="policy-section">
              <h2>10. Risoluzione Controversie</h2>
              <p>Prima di ricorrere al contenzioso, le parti si impegnano a tentare una risoluzione amichevole. Per eventuali controversie è competente il Foro di Salerno, Italia.</p>
            </section>

            <section className="policy-section">
              <h2>11. Modifiche ai Termini</h2>
              <p>I presenti Termini possono essere modificati in qualsiasi momento. Le modifiche entrano in vigore dalla data di pubblicazione sul sito.</p>
            </section>
          </>
        ) : lang === "de" ? (
          <>
            <p className="policy-intro">
              Der Zugang und die Nutzung der Website www.vincantomaiori.it und der damit verbundenen Buchungsdienstleistungen unterliegen den folgenden Allgemeinen Geschäftsbedingungen.
            </p>
            <section className="policy-section">
              <h2>1. Gegenstand und Anwendungsbereich</h2>
              <p>Diese Bedingungen gelten für alle von Vincanto Maiori angebotenen Dienstleistungen.</p>
            </section>
            <section className="policy-section">
              <h2>2. Buchungen und Zahlungen</h2>
              <p>Buchungsbedingungen und Zahlungsmodalitäten sind im Buchungsformular spezifiziert.</p>
            </section>
            <section className="policy-section">
              <h2>3. Stornierung und Rückerstattung</h2>
              <p>Kostenlose Stornierung bis 14 Tage vor Anreise. Danach gelten gestaffelte Stornogebühren.</p>
            </section>
          </>
        ) : lang === "fr" ? (
          <>
            <p className="policy-intro">
              L'accès et l'utilisation du site web www.vincantomaiori.it et des services de réservation associés sont régis par les présentes Conditions Générales.
            </p>
            <section className="policy-section">
              <h2>1. Objet et Champ d'Application</h2>
              <p>Ces conditions s'appliquent à tous les services offerts par Vincanto Maiori.</p>
            </section>
            <section className="policy-section">
              <h2>2. Réservations et Paiements</h2>
              <p>Les conditions de réservation et modalités de paiement sont spécifiées dans le formulaire de réservation.</p>
            </section>
            <section className="policy-section">
              <h2>3. Annulation et Remboursement</h2>
              <p>Annulation gratuite jusqu'à 14 jours avant l'arrivée. Au-delà, des frais d'annulation échelonnés s'appliquent.</p>
            </section>
          </>
        ) : (
          <>
            <p className="policy-intro">
              Access and use of the website www.vincantomaiori.it and related booking services are governed by the following Terms and Conditions.
            </p>
            <section className="policy-section">
              <h2>1. Subject and Scope of Application</h2>
              <p>These terms apply to all services offered by Vincanto Maiori.</p>
            </section>
            <section className="policy-section">
              <h2>2. Bookings and Payments</h2>
              <p>Booking conditions and payment methods are specified in the booking form.</p>
            </section>
            <section className="policy-section">
              <h2>3. Cancellation and Refunds</h2>
              <p>Free cancellation up to 14 days before arrival. Beyond that, tiered cancellation fees apply.</p>
            </section>
          </>
        )}

        <div className="policy-actions">
          <button
            onClick={() => {
              window.close();
              // Fallback: se il browser impedisce la chiusura, torna alla home
              setTimeout(() => {
                window.location.href = '/';
              }, 500);
            }}
            className="close-page-btn"
            aria-label="Close page"
          >
            {lang === "it"
              ? "Chiudi la pagina"
              : lang === "de"
              ? "Seite schließen"
              : lang === "fr"
              ? "Fermer la page"
              : "Close page"}
          </button>
        </div>
      </main>
    </>
  );
};

export default TermsConditions;