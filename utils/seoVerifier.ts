import fs from 'fs';
import { updateLearningStore } from './learningStore';
import { applySeoCorrections } from './applySeoCorrections'; // ✅ percorso corretto
import { suggestSeo } from './aiSuggest'; // ✅ usa il parser già pronto

export async function verifySeoWithWebModels(content: string, keyword: string) {
  const googleSearchUrl = `https://www.google.com/search?q=${encodeURIComponent(keyword)}`;

  try {
    const suggestions = await suggestSeo(content); // ✅ restituisce già un oggetto strutturato

    const headingStructure = Array.isArray(suggestions.headings)
      ? suggestions.headings.reduce((acc: Record<string, string>, h: string) => {
          const [from, to] = h.split('→').map(s => s.trim());
          if (from && to) acc[from] = to;
          return acc;
        }, {})
      : {};

    const updated = applySeoCorrections(content, {
      title: suggestions.title || 'Titolo ottimizzato',
      metaDescription: suggestions.description || 'Descrizione SEO generica',
      headingStructure,
      altText: suggestions.altText || 'Immagine descrittiva',
      links: []
    });

    updateLearningStore('seo', 'keywords', [keyword]);
    updateLearningStore('seo', 'meta', [suggestions.description]);

    return {
      googleSearchUrl,
      updated,
      applied: true
    };
  } catch (error) {
    console.error('❌ Errore durante la verifica SEO:', error);
    return {
      googleSearchUrl,
      fallback: true,
      message: '⚠️ Verifica esterna non disponibile. Puoi confrontare manualmente il contenuto con i primi risultati su Google per la keyword indicata.'
    };
  }
}