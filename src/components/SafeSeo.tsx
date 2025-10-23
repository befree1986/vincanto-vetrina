import React from 'react';
import Seo, { seoContent } from '../Seo'; // ✅ import corretto con S maiuscola
import { useTranslation } from 'react-i18next';
import { getSafeTranslation } from '../i18n'; // funzione che protegge le traduzioni

interface SafeSeoProps {
  page: keyof typeof seoContent; // es: 'home', 'contatti', 'booking'
  ogImage?: string;
  canonical?: string;
}

const SafeSeo: React.FC<SafeSeoProps> = ({ page, ogImage, canonical }) => {
  const { t } = useTranslation();
  const content = seoContent[page];

  return (
    <Seo
    title={getSafeTranslation(t, `seo.${page}.title`, content.title)}
    description={getSafeTranslation(t, `seo.${page}.description`, content.description)}
    ogImage={ogImage}
   canonical={canonical}

   
/>
  );
  console.log('SEO DEBUG:', {
  page,
  title: getSafeTranslation(t, `seo.${page}.title`, content.title),
  description: getSafeTranslation(t, `seo.${page}.description`, content.description),
});

};


export default SafeSeo;