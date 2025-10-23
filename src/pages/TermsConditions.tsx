const TermsConditions = () => {
  return (
    <main style={{ padding: "2rem", maxWidth: "800px", margin: "auto" }}>
      <h1>Termini e Condizioni</h1>
      <p>Ultimo aggiornamento: 31 luglio 2025</p>

      <h2>1. Introduzione</h2>
      <p>
        L’accesso e l’utilizzo del sito web www.vincantomaiori.it sono regolati dai seguenti Termini e Condizioni. 
        Navigando nel sito, accetti integralmente le condizioni qui esposte.
      </p>

      <h2>2. Proprietà Intellettuale</h2>
      <p>
        I contenuti, testi, immagini, loghi e altri elementi del sito sono di proprietà di Vincanto Maiori o dei legittimi titolari. 
        È vietata la riproduzione, distribuzione o modifica non autorizzata.
      </p>

      <h2>3. Prenotazioni e Pagamenti</h2>
      <p>
        Le condizioni relative a prenotazioni, pagamenti, cancellazioni e rimborsi sono specificate nel modulo di prenotazione. 
        L’invio del modulo implica accettazione delle stesse.
      </p>

      <h2>4. Limitazione di responsabilità</h2>
      <p>
        Il Titolare non è responsabile per eventuali interruzioni di servizio, imprecisioni o danni indiretti causati da terze parti. 
        Il sito può contenere collegamenti esterni gestiti da soggetti terzi.
      </p>

      <h2>5. Modifiche ai Termini</h2>
      <p>
        I presenti Termini e Condizioni possono essere aggiornati o modificati in qualsiasi momento. 
        Le modifiche saranno efficaci dalla data di pubblicazione sul sito.
      </p>

      <h2>6. Foro competente</h2>
      <p>
        Per eventuali controversie relative all’interpretazione o applicazione dei presenti termini, 
        sarà competente il Foro di Salerno, Italia.
      </p>

      <p style={{ marginTop: "2rem" }}>
        Grazie per aver consultato i nostri Termini e Condizioni.
      </p>

      <div style={{ textAlign: "center", marginTop: "2rem" }}>
        <button
          onClick={() => window.close()}
          className="close-page-btn"
          aria-label="Chiudi la pagina"
        >
          ❌ Chiudi la pagina
        </button>
      </div>
    </main>
  );
};

export default TermsConditions;