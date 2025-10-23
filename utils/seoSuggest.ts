import { suggestSeo } from './aiSuggest';

export type SeoSuggestions = {
  title: string;
  metaDescription: string;
  headings: string[];
  altText: string;
  fallback: boolean;
};

export async function suggestSeoImprovements(content: string, keyword: string): Promise<SeoSuggestions> {
  const prompt = `
Sei un esperto SEO. Analizza il seguente contenuto e suggerisci miglioramenti per la keyword "${keyword}". Concentrati su:
- Titolo più efficace
- Meta description ottimizzata
- Heading ben strutturati
- Parole chiave correlate
- Link interni/esterni consigliati
- Rich snippet o dati strutturati

Contenuto:
${content}
  `;

  try {
    const raw = await suggestSeo(prompt);

    return {
      title: raw.title,
      metaDescription: raw.description,
      headings: raw.headings,
      altText: raw.altText,
      fallback: false
    };
  } catch (error) {
    console.error('⚠️ Errore nel suggerimento SEO:', error);
    return {
      title: 'Titolo ottimizzato',
      metaDescription: 'Descrizione efficace per motori di ricerca.',
      headings: ['h1 → h2', 'h3 → h4'],
      altText: 'Immagine descrittiva',
      fallback: true
    };
  }
}