import { Link } from "react-router-dom";

const PrivacyPolicy = () => {
  return (
    <main className="privacy-container" style={{ padding: "2rem", maxWidth: "800px", margin: "auto" }}>
      <h1>Informativa sulla Privacy</h1>
      <p>Ultimo aggiornamento: 31 luglio 2025</p>

      <h2>1. Titolare del trattamento</h2>
      <p>
        Vincanto Maiori – Via Torre di Milo, 7 – 84010 Maiori (SA) <br />
        Email: info@vincantomaiori.it – PEC: pec@vincantomaiori.it
      </p>

      <h2>2. Tipologie di dati raccolti</h2>
      <ul>
        <li>Dati identificativi (nome, email, ecc.)</li>
        <li>Dati di navigazione (IP, browser, sistema operativo)</li>
        <li>Dati raccolti tramite cookie e tecnologie simili</li>
      </ul>

      <h2>3. Finalità del trattamento</h2>
      <ul>
        <li>Gestione delle richieste e dei contatti</li>
        <li>Miglioramento dell’esperienza utente</li>
        <li>Analisi statistiche in forma aggregata</li>
        <li>Attività di marketing, previo consenso</li>
      </ul>

      <h2>4. Base giuridica del trattamento</h2>
      <p>
        I trattamenti si basano su:
        <ul>
          <li>Consenso dell’utente per attività specifiche (es. marketing)</li>
          <li>Obblighi contrattuali o precontrattuali</li>
          <li>Legittimo interesse del titolare per finalità organizzative e di analisi</li>
        </ul>
      </p>

      <h2>5. Modalità del trattamento</h2>
      <p>
        Il trattamento è svolto in modo lecito, trasparente e con misure di sicurezza adeguate,
        sia tecniche che organizzative.
      </p>

      <h2>6. Conservazione dei dati</h2>
      <ul>
        <li>10 anni per adempimenti di legge</li>
        <li>2 anni per finalità promozionali</li>
        <li>Fino a revoca del consenso ove applicabile</li>
      </ul>

      <h2>7. Diritti dell’interessato</h2>
      <ul>
        <li>Accesso ai propri dati</li>
        <li>Rettifica, cancellazione e limitazione del trattamento</li>
        <li>Portabilità dei dati</li>
        <li>Revoca del consenso e opposizione al trattamento</li>
      </ul>

      <h2>8. Cookie</h2>
      <p>
        Questo sito utilizza cookie tecnici, analitici e di profilazione. Per maggiori informazioni consulta la{" "}
        <Link to="/cookie-policy">Cookie Policy</Link>.
      </p>

      <h2>9. Destinatari e trasferimenti</h2>
      <p>
        I dati possono essere condivisi con fornitori di servizi IT, piattaforme di analisi e marketing (es. Google, Meta),
        e altri soggetti autorizzati. Nessun trasferimento al di fuori dell’UE senza garanzie adeguate.
      </p>

      <h2>10. Modifiche all'informativa</h2>
      <p>
        La presente informativa può essere aggiornata. Ti invitiamo a consultarla periodicamente. Ultimo aggiornamento: 31 luglio 2025
      </p>

      <p style={{ marginTop: "2rem" }}>
        Grazie per aver consultato la nostra Informativa sulla Privacy.
      </p>

      <div style={{ textAlign: "center", marginTop: "2rem" }}>
        <button
          onClick={() => window.history.back()}
          className="close-page-btn"
          aria-label="Chiudi pagina"
        >
          ❌ Chiudi la pagina
        </button>
      </div>
    </main>
  );
};

export default PrivacyPolicy;