import fs from 'fs';

export function applyHtmlCorrections(filePath: string, backup = true) {
  const raw = fs.readFileSync(filePath, 'utf-8');
  let updated = raw;

  // Rimuove gli stili inline
  updated = updated.replace(/ style="[^"]*"/g, '');

  // Elimina tag vuoti
  updated = updated.replace(/<div>\s*<\/div>/g, '');
  updated = updated.replace(/<span>\s*<\/span>/g, '');

  // Migliora semantica
  updated = updated.replace(/<b>(.*?)<\/b>/g, '<strong>$1</strong>');
  updated = updated.replace(/<i>(.*?)<\/i>/g, '<em>$1</em>');

  if (updated !== raw) {
    if (backup) {
      fs.copyFileSync(filePath, filePath + '.bak');
    }
    fs.writeFileSync(filePath, updated);
    return true;
  }

  return false;
}