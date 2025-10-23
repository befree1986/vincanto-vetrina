import fs from 'fs';
import path from 'path';

const storePath = path.resolve('learning', 'store.json');

type LearningMemory = {
  css: { removed: string[]; inserted: string[] };
  seo: { keywords: string[]; meta: string[] };
  image: { altPatterns: string[]; formats: string[] };
};

const defaultMemory: LearningMemory = {
  css: { removed: [], inserted: [] },
  seo: { keywords: [], meta: [] },
  image: { altPatterns: [], formats: [] }
};

export function ensureDirectoriesExist() {
  fs.mkdirSync(path.resolve('reports'), { recursive: true });
  fs.mkdirSync(path.resolve('learning'), { recursive: true });
}

export function getLearningStore(): LearningMemory {
  if (!fs.existsSync(storePath)) {
    return defaultMemory;
  }
  try {
    const raw = fs.readFileSync(storePath, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return defaultMemory;
  }
}

export function updateLearningStore<
  Section extends keyof LearningMemory,
  Key extends keyof LearningMemory[Section]
>(
  section: Section,
  key: Key,
  values: string[]
) {
  const current = getLearningStore();
  const updated = {
    ...current,
    [section]: {
      ...current[section],
      [key]: Array.from(new Set([...(current[section][key] as string[]), ...values]))
    }
  };

  fs.writeFileSync(storePath, JSON.stringify(updated, null, 2));
  console.log(`🧠 Memoria aggiornata: ${storePath}`);
}