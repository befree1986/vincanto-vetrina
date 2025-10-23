import fs from 'fs';
import path from 'path';
import { getLearningStore } from './learningStore';
import { applyCorrections } from '../src/utils/correctionEngine';
import { applyHtmlCorrections } from './applyHtmlCorrections';
import { applyMarkdownCorrections } from './applyMarkdownCorrections';
import { applyReactCorrections } from './applyReactCorrections';
import { saveReport } from './reportGenerator';
import { trackChange } from './publishTracker';

export function universalAutoApply(filePath: string, backup = true) {
  const ext = path.extname(filePath);
  const content = fs.readFileSync(filePath, 'utf-8');
  const { removed, inserted } = getLearningStore();

  let modified = false;

  if (ext === '.css') {
    const hasMatch = removed.some(cls => content.includes(cls)) || inserted.length > 0;
    if (hasMatch) {
      applyCorrections(filePath, {
        removeClasses: removed,
        insertVariables: inserted,
        backup
      });
      saveReport({
        filePath,
        removedClasses: removed,
        insertedVariables: inserted,
        backupCreated: backup
      });
      modified = true;
    }
  }

  if (ext === '.html') {
    modified = applyHtmlCorrections(filePath, backup);
  }

  if (ext === '.md') {
    modified = applyMarkdownCorrections(filePath, backup);
  }

  if (ext === '.tsx' || ext === '.jsx') {
    modified = applyReactCorrections(filePath, backup);
  }

  if (modified) {
    trackChange(filePath, `Correzione automatica (${ext}) applicata`);
    console.log(`✅ Correzioni applicate a ${filePath}`);
  } else {
    console.log(`⚠️ Nessuna correzione applicabile per ${filePath}`);
  }
}