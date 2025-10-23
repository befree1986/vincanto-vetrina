const CookiePolicy = () => {
  return (
    <main style={{ padding: "2rem", maxWidth: "800px", margin: "auto" }}>
      <h1>Cookie Policy</h1>
      <p>Ultimo aggiornamento: 2 agosto 2025</p>

      <h2>1. Cosa sono i cookie?</h2>
      <p>
        I cookie sono piccoli file di testo inviati da un sito web al dispositivo dell’utente, 
        dove vengono memorizzati per poi essere ritrasmessi nelle visite successive. 
        Hanno diverse finalità, tra cui migliorare la navigazione, raccogliere dati statistici 
        e offrire contenuti personalizzati.
      </p>

      <h2>2. Tipologie di cookie utilizzate</h2>
      <ul>
        <li><strong>Cookie tecnici:</strong> essenziali per il corretto funzionamento del sito</li>
        <li><strong>Cookie analitici:</strong> utilizzati per raccogliere dati aggregati sull’utilizzo del sito</li>
        <li><strong>Cookie di marketing:</strong> impiegati per profilare l’utente e mostrare annunci pertinenti</li>
      </ul>

      <h2>3. Base giuridica per l’uso dei cookie</h2>
      <p>
        I cookie tecnici sono esenti da consenso. Per quelli analitici e di marketing, 
        viene richiesto il consenso esplicito tramite il banner informativo al primo accesso.
      </p>

      <h2>4. Gestione del consenso</h2>
      <p>
        Al primo accesso, l’utente può personalizzare le proprie preferenze sui cookie. 
        Queste possono essere modificate in qualsiasi momento tramite la sezione dedicata 
        accessibile dal footer del sito.
      </p>

      <h2>5. Cookie di terze parti</h2>
      <p>
        Alcuni servizi esterni (come Google Analytics, Meta Pixel) possono impostare cookie propri. 
        Si invita a consultare le rispettive informative sulla privacy per maggiori informazioni.
      </p>

      <h2>6. Come disabilitare i cookie</h2>
      <p>
        L’utente può gestire o disabilitare i cookie direttamente dalle impostazioni del proprio browser. 
        Di seguito i link utili:
      </p>
      <ul>
        <li><a href="https://support.google.com/chrome/answer/95647" target="_blank">Google Chrome</a></li>
        <li><a href="https://support.mozilla.org/it/kb/Gestione%20dei%20cookie" target="_blank">Mozilla Firefox</a></li>
        <li><a href="https://support.apple.com/it-it/guide/safari/sfri11471/mac" target="_blank">Safari</a></li>
        <li><a href="https://support.microsoft.com/it-it/topic/eliminare-e-gestire-i-cookie-168dab11-0753-043d-7c16-ede5947fc64d" target="_blank">Microsoft Edge</a></li>
      </ul>

      <h2>7. Modifiche alla Cookie Policy</h2>
      <p>
        La presente informativa può essere soggetta a modifiche. Ti invitiamo a consultarla periodicamente.
      </p>

      <p style={{ marginTop: "2rem" }}>
        Grazie per aver consultato la nostra Cookie Policy.
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

export default CookiePolicy;