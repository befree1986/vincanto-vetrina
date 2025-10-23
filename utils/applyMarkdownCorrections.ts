import fs from 'fs';

export function applyMarkdownCorrections(filePath: string, backup = true) {
  const raw = fs.readFileSync(filePath, 'utf-8');
  let updated = raw;

  // Uniforma titoli (es. rimuove spazi errati)
  updated = updated.replace(/^#+\s+/gm, match => match.trim() + ' ');

  // Rimuove titoli duplicati consecutivi
  updated = updated.replace(/(#+\s+[^\n]+)\n\1/g, '$1');

  // Corregge link Markdown malformati
  updated = updated.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (match, text, url) => {
    if (!url.startsWith('http')) return `[${text}](https://${url})`;
    return match;
  });

  // Elimina righe vuote eccessive
  updated = updated.replace(/\n{3,}/g, '\n\n');

  // Pulisce spazi doppi
  updated = updated.replace(/ {2,}/g, ' ');

  if (updated !== raw) {
    if (backup) {
      fs.copyFileSync(filePath, filePath + '.bak');
    }
    fs.writeFileSync(filePath, updated);
    return true;
  }

  return false;
}