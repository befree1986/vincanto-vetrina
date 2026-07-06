import { useTranslation } from "react-i18next";

// Dati strutturati per la struttura ricettiva (JSON-LD)
const vincantoStructuredData = {
  "@context": "https://schema.org",
  "@type": "LodgingBusiness",
  "name": "Vincanto Maiori",
  "image": "https://www.vincantomaiori.it/logo.svg",
  "url": "https://www.vincantomaiori.it",
  "telephone": "+393331481677",
  "email": "info@vincantomaiori.it",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "Via Torre di Milo, 7",
    "addressLocality": "Maiori",
    "postalCode": "84010",
    "addressRegion": "SA",
    "addressCountry": "IT"
  },
  "priceRange": "$$"
};

// ✅ Mappa SEO centralizzata per ogni pagina
export const seoContent = {
  home: {
    title: 'Vincanto | Maiori - Costiera Amalfitana',
    description:
      'Vincanto è una struttura immersa nei limoneti della Costiera Amalfitana a Maiori. Prenota il tuo soggiorno esclusivo, comfort e servizi premium. Ideale per famiglie e gruppi.',
    structuredData: vincantoStructuredData
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
  ogType?: string;
  structuredData?: object;
}

const Seo: React.FC<SeoProps> = ({ title, description, canonical, ogImage, ogType = "website", structuredData }) => {
  const { i18n } = useTranslation();
  const currentLang = i18n.language || 'it';
  const siteUrl = "https://www.vincantomaiori.it";
  const fullUrl = canonical ? (canonical.startsWith('http') ? canonical : `${siteUrl}${canonical}`) : siteUrl;
  const defaultImage = `${siteUrl}/esterni/ingressoindex.webp`; // Immagine di fallback

  return (
    <Helmet>
      <html lang={currentLang} />
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={fullUrl} />

      {/* Open Graph */}
      <meta property="og:site_name" content="Vincanto Maiori" />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content={ogType} />
      <meta property="og:url" content={fullUrl} />
      <meta property="og:image" content={ogImage || defaultImage} />
      <meta property="og:locale" content={currentLang === 'it' ? 'it_IT' : 'en_US'} />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage || defaultImage} />

      {/* Structured Data (JSON-LD) */}
      {structuredData && (
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
      )}
    </Helmet>
  );
};

export default Seo;