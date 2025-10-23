import React from 'react';
import LemonDivider from '../components/LemonDivider';
import './Propriety.css';
import { useTranslation } from 'react-i18next';

const Propriety: React.FC = () => {
  const { t } = useTranslation();
  return (
    <section id="proprieta" className="proprieta-section">
      <div className="container">
        <div className="propiety-content">
          <div className="propiety-description"> {/* Rimosso stile inline textAlign: 'center' */}
          <h2 className="section-title underline-title" style={{ marginTop: '2rem' }}> {/* Questo titolo ora sarà centrato grazie all'ereditarietà */}
          {t('La Proprietà')}
        </h2>
          <p className="proprieta-description" style={{ marginBottom: '2rem' }}> {/* Rimosso textAlign: 'center' da qui, poiché ora è ereditato dal genitore */}
          {t('Immersa nel cuore profumato di un limoneto tipico della Costiera Amalfitana')}, {/* Corretto refuso nel testo */}
          </p>
          <p>
            {t('La casa, spaziosa e accogliente, si compone di un’ampia zona giorno con cucina open space completamente attrezzata, ideale per condividere momenti in famiglia o con amici. Dispone di tre camere da letto confortevoli e arredate con gusto, e di due bagni completi, entrambi dotati di ampi piatti doccia.')}
          </p>
          <p>
            {('All’esterno, gli ospiti possono godere di una cucina esterna, perfetta per pranzi e cene all’aperto sotto il pergolato, con vista sul verde circostante. A completare l’offerta, una doccia esterna, un forno a legna tradizionale e un barbecue, ideali per serate conviviali immersi nel profumo dei limoni e del mare.')}
          </p>
          </div>
        <div className="proprieta-gallery">
          {/* Esempio per la prima immagine */}
          <div className="proprieta-img-card">
            <img src="https://lh3.googleusercontent.com/p/AF1QipNtrJ92Qev3zyTcqNA8PsGlIIJr63p4ix5l7XJ2=s680-w680-h510-rw" alt={t('alt.proprieta.immagine1')} className="img-fluid" />
            <p className="image-caption">{t('caption.proprieta.immagine1')}</p>
          </div>
          {/* Esempio per la seconda immagine */}
          <div className="proprieta-img-card">
            <img src="https://lh3.googleusercontent.com/p/AF1QipMJ-hFnOtK--MbqUsPj7dh5LSjsz9f3hFJ-B0c5=s680-w680-h510-rw" alt={t('alt.proprieta.immagine2')} className="img-fluid" />
            <p className="image-caption">🎨 {t('Applique nel corridoio e nelle camere in Pregiata Cermaica Vietrese devcorate a mano')} 🎨</p>
          </div>
          <div className="proprieta-img-card">
            <img src="https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=600&q=80" alt={t('alt.proprieta.immagine3')} className="img-fluid" />
            <p className="image-caption">{t('caption.proprieta.immagine3')}</p>
          </div>
          <div className="proprieta-img-card">
            <img src="https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?auto=format&fit=crop&w=600&q=80" alt={t('alt.proprieta.immagine4')} className="img-fluid" />
            <p className="image-caption">{t('caption.proprieta.immagine4')}</p>
          </div>
          <div className="proprieta-img-card">
            <img src="https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=600&q=80" alt={t('alt.proprieta.immagine5')} className="img-fluid" />
            <p className="image-caption">{t('caption.proprieta.immagine5')}</p>
        </div>
          <div className="proprieta-img-card">
            <img src="https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?auto=format&fit=crop&w=600&q=80" alt={t('alt.proprieta.immagine6')} className="img-fluid" />
            <p className="image-caption">{t('caption.proprieta.immagine6')}</p>
          </div>
          <div className="proprieta-img-card">
            <img src="https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=600&q=80" alt={t('alt.proprieta.immagine7')} className="img-fluid" />
            <p className="image-caption">{t('caption.proprieta.immagine7')}</p>
          </div>
          <div className="proprieta-img-card">
            <img src="https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?auto=format&fit=crop&w=600&q=80" alt={t('alt.proprieta.immagine8')} className="img-fluid" />
            <p className="image-caption">{t('caption.proprieta.immagine8')}</p>
          </div>
        
        </div>
       
       <h2 className='section-title underline-title titolo-sezione' style={{ marginTop: '2rem' }}>
        {t('Tariffe Indicative')}
      </h2>
      <div className="tariffe-table-container">
        <table className="tariffe-table">
          <thead>
            <tr>
              <th>{t('Numero di Persone')}</th>
              <th>{t('Prezzo a Notte')}</th>
              <th>{t('Soggiorno Minimo')}</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td data-label={t('da 1 - 2')}>{t('Persone')}</td>
              <td data-label={t('50 €')}>{t('a persona')}</td>
              <td data-label={t('Soggiorno Minimo')}>{t('Y notti')}</td>
            </tr>
            <tr>
              <td data-label={t('Periodo')}>{t('Media Stagione')}</td>
              <td data-label={t('Prezzo a Notte')}>{t('A partire da €Y')}</td>
              <td data-label={t('Soggiorno Minimo')}>{t('Z notti')}</td>
            </tr>
            <tr>
              <td data-label={t('Periodo')}>{t('Alta Stagione')}</td>
              <td data-label={t('Prezzo a Notte')}>{t('A partire da €Z')}</td>
              <td data-label={t('Soggiorno Minimo')}>{t('W notti')}</td>
            </tr>
            {/* Puoi aggiungere più righe qui se necessario */}
          </tbody>
        </table>
        <p className="tariffe-note">
          {t('I prezzi sono indicativi e possono variare in base al numero di ospiti, al periodo specifico e alla durata del soggiorno.')}
          {' '}
          {t('Per un preventivo dettagliato e personalizzato, non esitare a')}{' '}
          <a href="#contact">{t('contattarci')}</a>.
        </p>
      </div>
      </div>
      </div>
      {/* 
        TODO: Sostituisci '€X', 'Y notti', ecc. con i valori reali delle tariffe.
        Esempio di chiavi di traduzione da aggiungere al tuo file i18n JSON:
        "Tariffe Indicative": "Tariffe Indicative",
        "Periodo": "Periodo",
        "Prezzo a Notte (intera proprietà)": "Prezzo a Notte (intera proprietà)",
        "Soggiorno Minimo": "Soggiorno Minimo",
        "Bassa Stagione": "Bassa Stagione (es. Nov-Mar)",
        "Media Stagione": "Media Stagione (es. Apr-Giu, Set-Ott)",
        "Alta Stagione": "Alta Stagione (es. Lug-Ago, Festività)",
        "A partire da €X": "A partire da €200", // Esempio
        "Y notti": "3 notti", // Esempio
        "I prezzi sono indicativi e possono variare in base al numero di ospiti, al periodo specifico e alla durata del soggiorno.": "I prezzi sono indicativi e possono variare in base al numero di ospiti, al periodo specifico e alla durata del soggiorno.",
        "Per un preventivo dettagliato e personalizzato, non esitare a": "Per un preventivo dettagliato e personalizzato, non esitare a",
        "contattarci": "contattarci"
      */}
      <LemonDivider position="left" />
    </section>
   );
  };

export default Propriety;
