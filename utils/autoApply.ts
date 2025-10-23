import fs from 'fs';
import { applyCorrections } from '../src/utils/correctionEngine';
import { saveReport } from './reportGenerator';
import { getLearningStore } from './learningStore';
import { trackChange } from './publishTracker';

export function autoApplyCorrections(filePath: string, backup = true) {
  const css = fs.readFileSync(filePath, 'utf-8');
  const { removed, inserted } = getLearningStore();

  const hasMatch = removed.some(cls => css.includes(cls)) || inserted.length > 0;
  if (!hasMatch) {
    console.log(`⚠️ Nessuna correzione automatica applicabile a ${filePath}`);
    return;
  }

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

  trackChange(filePath, 'Correzioni automatiche basate su memoria adattiva');
  console.log(`✅ Correzioni automatiche applicate a ${filePath}`);
}