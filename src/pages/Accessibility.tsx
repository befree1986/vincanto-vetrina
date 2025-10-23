const Accessibility = () => {
  return (
    <main style={{ padding: "2rem", maxWidth: "800px", margin: "auto" }}>
      <h1>Accessibilità del Sito</h1>
      <p>Ultimo aggiornamento: 2 agosto 2025</p>

      <h2>1. Impegno</h2>
      <p>
        Vincanto Maiori si impegna a garantire che il proprio sito web sia
        accessibile a tutti gli utenti, inclusi coloro con disabilità.
        Adottiamo misure tecniche e redazionali conformi alle linee guida WCAG 2.1
        per offrire un’esperienza fluida e inclusiva.
      </p>

      <h2>2. Compatibilità</h2>
      <p>
        Il sito è stato testato con lettori di schermo, navigazione da tastiera e dispositivi mobili.
        Il layout, la struttura e i colori seguono criteri di accessibilità visiva e semantica.
      </p>

      <h2>3. Limitazioni</h2>
      <p>
        Alcune sezioni potrebbero non essere completamente conformi.
        Se riscontri difficoltà nell'utilizzo o nella navigazione, ti invitiamo a segnalarlo.
      </p>

      <h2>4. Contatti</h2>
      <p>
        Per richieste o segnalazioni relative all'accessibilità scrivi a{" "}
        <a href="mailto:accessibilita@vincantomaiori.it">
          accessibilita@vincantomaiori.it
        </a>
      </p>

      <p style={{ marginTop: "2rem" }}>
        Grazie per contribuire a migliorare l'accessibilità del sito.
      </p>

      <footer>
        <small>
          Questa dichiarazione può essere soggetta ad aggiornamenti.
          Ultima revisione: 2 agosto 2025.
        </small>
      </footer>

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

export default Accessibility;