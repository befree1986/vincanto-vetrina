import fs from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';
const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const getClassUsageReport = () => {
  const jsxClasses = new Set<string>();
  const cssClasses = new Set<string>();

  const walk = (dir: string, ext: string, collector: (content: string) => void) => {
    if (!fs.existsSync(dir)) return;
    for (const entry of fs.readdirSync(dir)) {
      const full = path.join(dir, entry);
      if (fs.statSync(full).isDirectory()) walk(full, ext, collector);
      else if (entry.endsWith(ext)) collector(fs.readFileSync(full, 'utf-8'));
    }
  };

  walk(path.resolve(__dirname, '..', 'src'), '.tsx', content => {
    const matches = content.match(/className=["'`]([^"'`]+)["'`]/g);
    matches?.forEach(m => m.match(/["'`]([^"'`]+)["'`]/)?.[1]?.split(' ').forEach(c => jsxClasses.add(c)));
  });

  walk(path.resolve(__dirname, '..', 'src'), '.css', content => {
    const matches = content.match(/\.(\w[\w-]*)\s*{/g);
    matches?.forEach(m => cssClasses.add(m.replace('.', '').replace('{', '').trim()));
  });

  return {
    usedCssClasses: [...jsxClasses],
    definedCssClasses: [...cssClasses],
    missingCssClasses: [...jsxClasses].filter(c => !cssClasses.has(c)),
    unusedCssClasses: [...cssClasses].filter(c => !jsxClasses.has(c))
  };
};