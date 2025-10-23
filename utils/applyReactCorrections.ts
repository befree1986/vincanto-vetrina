import fs from 'fs';

export function applyReactCorrections(filePath: string, backup = true) {
  const raw = fs.readFileSync(filePath, 'utf-8');
  let updated = raw;

  // Rimuove className vuoti
  updated = updated.replace(/className="\s*"/g, '');

  // Elimina props data-* e aria-* non valorizzati
  updated = updated.replace(/\s+(data|aria)-[a-zA-Z0-9\-]+="\s*"/g, '');

  // Migliora semantica base: div → section se contiene heading
  updated = updated.replace(/<div>(\s*<h[1-6][^>]*>)/g, '<section>$1');
  updated = updated.replace(/<\/div>(\s*<\/section>)/g, '</section>$1');

  // Rimuove import non usati (solo quelli vuoti o commentati)
  updated = updated.replace(/import\s+\{?\s*\}?\s+from\s+['"][^'"]+['"];?\n?/g, '');

  if (updated !== raw) {
    if (backup) {
      fs.copyFileSync(filePath, filePath + '.bak');
    }
    fs.writeFileSync(filePath, updated);
    return true;
  }

  return false;
}