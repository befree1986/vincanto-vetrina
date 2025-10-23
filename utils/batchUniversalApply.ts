import fs from 'fs';
import path from 'path';
import { universalAutoApply } from './universalAutoApply';

const supportedExtensions = ['.css', '.html', '.md', '.tsx', '.jsx'];

export async function batchUniversalApply({
  directory,
  backup = true
}: {
  directory: string;
  backup?: boolean;
}) {
  const files = scanDirectory(directory);
  const targetFiles = files.filter(file => supportedExtensions.includes(path.extname(file)));

  if (targetFiles.length === 0) {
    console.log('⚠️ Nessun file supportato trovato nella directory.');
    return;
  }

  console.log(`🔍 Trovati ${targetFiles.length} file da correggere...\n`);

  for (const file of targetFiles) {
    console.log(`🛠️ Correggo: ${file}`);
    universalAutoApply(file, backup);
  }

  console.log('\n✅ Batch completato.');
}

function scanDirectory(dir: string): string[] {
  let results: string[] = [];
  const list = fs.readdirSync(dir);

  list.forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);

    if (stat && stat.isDirectory()) {
      results = results.concat(scanDirectory(fullPath));
    } else {
      results.push(fullPath);
    }
  });

  return results;
}