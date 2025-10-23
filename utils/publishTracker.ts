import fs from 'fs';
import path from 'path';

const trackPath = path.resolve('publish', 'changes.json');

export function trackChange(filePath: string, description: string) {
  const existing = fs.existsSync(trackPath)
    ? JSON.parse(fs.readFileSync(trackPath, 'utf-8'))
    : [];

  const updated = [
    ...existing,
    {
      file: filePath,
      description,
      timestamp: new Date().toISOString()
    }
  ];

  fs.mkdirSync(path.dirname(trackPath), { recursive: true });
  fs.writeFileSync(trackPath, JSON.stringify(updated, null, 2));
}

export function generateChangelogMarkdown(): string {
  if (!fs.existsSync(trackPath)) return '⚠️ Nessuna modifica tracciata.';

  const changes = JSON.parse(fs.readFileSync(trackPath, 'utf-8'));
  return `# 📦 Changelog modifiche locali\n\n` + changes.map((c: any) =>
    `- **${c.file}**\n  - 📝 ${c.description}\n  - 🕒 ${c.timestamp}\n`
  ).join('\n');
}