export type SeoCorrectionInput = {
  title: string;
  metaDescription: string;
  headingStructure: Record<string, string>;
  altText: string;
  links: string[];
};

export function applySeoCorrections(content: string, corrections: SeoCorrectionInput): string {
  let updated = content;

  // 🔧 Aggiorna il titolo (prima <h1> o <title>)
  updated = updated.replace(/<title>.*?<\/title>/i, `<title>${corrections.title}</title>`);
  updated = updated.replace(/<h1[^>]*>.*?<\/h1>/i, `<h1>${corrections.title}</h1>`);

  // 🔧 Inserisci o aggiorna meta description
  if (updated.includes('name="description"')) {
    updated = updated.replace(/<meta name="description" content=".*?">/i,
      `<meta name="description" content="${corrections.metaDescription}">`);
  } else {
    updated = updated.replace(/<head>/i,
      `<head>\n  <meta name="description" content="${corrections.metaDescription}">`);
  }

  // 🔧 Aggiorna heading (es. h1 → h2)
  for (const [from, to] of Object.entries(corrections.headingStructure)) {
    const regexOpen = new RegExp(`<${from}\\b([^>]*)>`, 'gi');
    const regexClose = new RegExp(`</${from}>`, 'gi');
    updated = updated.replace(regexOpen, `<${to}$1>`);
    updated = updated.replace(regexClose, `</${to}>`);
  }

  // 🔧 Aggiorna alt text immagini
  updated = updated.replace(/<img\b([^>]*?)alt=".*?"([^>]*?)>/gi,
    `<img$1alt="${corrections.altText}"$2>`);

  // 🔧 Aggiungi link consigliati (alla fine del body)
  if (corrections.links.length > 0) {
    const linkHtml = corrections.links.map(link => `<a href="${link}" rel="nofollow">${link}</a>`).join('\n');
    updated = updated.replace(/<\/body>/i, `${linkHtml}\n</body>`);
  }

  return updated;
}