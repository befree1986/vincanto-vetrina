export function applySeoCorrections(content: string, suggestions: {
  title?: string;
  metaDescription?: string;
  headingStructure?: { [old: string]: string };
  altText?: string;
  links?: string[];
}): string {
  let updated = content;

  // Titolo
  if (suggestions.title) {
    if (updated.includes('<title>')) {
      updated = updated.replace(/<title>.*?<\/title>/, `<title>${suggestions.title}</title>`);
    } else {
      updated = updated.replace(/<head>/, `<head>\n<title>${suggestions.title}</title>`);
    }
  }

  // Meta description
  if (suggestions.metaDescription) {
    if (updated.includes('meta name="description"')) {
      updated = updated.replace(/<meta name="description" content=".*?">/, `<meta name="description" content="${suggestions.metaDescription}">`);
    } else {
      updated = updated.replace(/<head>/, `<head>\n<meta name="description" content="${suggestions.metaDescription}">`);
    }
  }

  // Heading structure
  if (suggestions.headingStructure) {
    for (const [oldTag, newTag] of Object.entries(suggestions.headingStructure)) {
      const regexOpen = new RegExp(`<${oldTag}>`, 'g');
      const regexClose = new RegExp(`</${oldTag}>`, 'g');
      updated = updated.replace(regexOpen, `<${newTag}>`).replace(regexClose, `</${newTag}>`);
    }
  }

  // Alt text per immagini
  if (suggestions.altText) {
    updated = updated.replace(/<img([^>]*?)\/?>/g, (match, attrs) => {
      if (attrs.includes('alt=')) return match;
      return `<img${attrs} alt="${suggestions.altText}" />`;
    });
  }

  // Link suggeriti
  if (suggestions.links && suggestions.links.length) {
    const linksHtml = suggestions.links.map(link => `<a href="${link}" target="_blank">${link}</a>`).join('\n');
    updated += `\n<!-- 🔗 Link suggeriti -->\n${linksHtml}`;
  }

  return updated;
}