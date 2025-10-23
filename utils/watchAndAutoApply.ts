import fs from 'fs';
import path from 'path';
import { universalAutoApply } from './universalAutoApply';

const supportedExtensions = ['.css', '.html', '.md', '.tsx', '.jsx'];

export function watchAndAutoApply(directory: string, backup = true) {
  console.log(`👁️ Monitoraggio attivo su: ${directory}\n`);

  fs.watch(directory, { recursive: true }, (eventType, filename) => {
    if (!filename) return;

    const fullPath = path.join(directory, filename);
    const ext = path.extname(fullPath);

    if (supportedExtensions.includes(ext) && fs.existsSync(fullPath)) {
      console.log(`⚡ Modifica rilevata: ${filename}`);
      universalAutoApply(fullPath, backup);
    }
  });
}