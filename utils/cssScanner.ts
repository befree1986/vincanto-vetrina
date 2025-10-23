import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..', 'src');

export const scanCssFiles = (): string[] => {
  const files: string[] = [];
  const walk = (dir: string) => {
    if (!fs.existsSync(dir)) return;
    for (const entry of fs.readdirSync(dir)) {
      const full = path.join(dir, entry);
      if (fs.statSync(full).isDirectory()) walk(full);
      else if (entry.endsWith('.css')) files.push(full);
    }
  };
  walk(root);
  return files;
};

export const fixCssImports = (file: string) => {
  const content = fs.readFileSync(file, 'utf-8');
  const lines = content.split('\n');
  const imports = lines.filter(l => l.trim().startsWith('@import'));
  const rest = lines.filter(l => !l.trim().startsWith('@import'));
  if (imports.length && lines.indexOf(imports[0]) > 0) {
    fs.writeFileSync(file, [...imports, '', ...rest].join('\n'), 'utf-8');
    console.log(`✅ Corretto @import in ${path.relative(root, file)}`);
  }
};

export const checkCssVariables = (file: string) => {
  const content = fs.readFileSync(file, 'utf-8');
  const variables = ['--blue-dark', '--gray-light', '--yellow', '--white', '--body-font', '--heading-font'];
  variables.forEach(v => {
    if (!content.includes(v)) console.warn(`❌ Variabile mancante: ${v} in ${path.basename(file)}`);
  });
};