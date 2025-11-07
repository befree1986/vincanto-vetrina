// ✅ Mappa SEO centralizzata per ogni pagina
export const seoContent = {
  home: {
    title: 'Vincanto | Maiori - Costiera Amalfitana',
    description:
      'Vincanto è una struttura immersa nei limoneti della Costiera Amalfitana a Maiori. Prenota il tuo soggiorno esclusivo, comfort e servizi premium. Ideale per famiglie e gruppi.',
  },
  contatti: {
    title: 'Vincanto | Contatti e Richieste',
    description:
      'Contattaci per richieste personalizzate, disponibilità e informazioni sulla struttura.',
  },
  booking: {
    title: 'Vincanto | Prenota il tuo soggiorno',
    description:
      'Prenota ora il tuo soggiorno esclusivo a Maiori. Comfort, privacy e servizi premium.',
  },
  about: {
    title: 'Vincanto | Chi Siamo',
    description: 'Scopri la storia, la filosofia e la posizione di Vincanto. Ospitalità autentica tra i limoni della Costiera Amalfitana, comfort e natura per il tuo soggiorno a Maiori.',
  },
  property: {
    title: 'Vincanto | La Proprietà e Tariffe',
    description: 'Scopri la nostra proprietà immersa nei limoneti di Maiori. Gallery fotografica, tariffe aggiornate e tutti i dettagli per il tuo soggiorno in Costiera Amalfitana.',
  },
  // Puoi aggiungere altre pagine come "gallery", "about", ecc.
};

// ✅ Componente SEO che imposta i meta tag
import React from "react";
import { Helmet } from "react-helmet";

interface SeoProps {
  title: string;
  description: string;
  canonical?: string;
  ogImage?: string;
}

const Seo: React.FC<SeoProps> = ({ title, description, canonical, ogImage }) => {
  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      {canonical && <link rel="canonical" href={canonical} />}
      {ogImage && <meta property="og:image" content={ogImage} />}
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content="website" />
    </Helmet>
  );
};

export default Seo;