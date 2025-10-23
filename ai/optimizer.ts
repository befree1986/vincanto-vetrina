import { askOllama } from './ollama';

interface UsageReport {
  unusedCssClasses: string[];
  missingCssClasses: string[];
}

export const optimizer = {
  async analyzeProject(cssFiles: string[], usageReport: UsageReport): Promise<string[]> {
    const prompt = `
Ho analizzato questi file CSS: ${cssFiles.join(', ')}.

Le classi CSS definite ma mai usate sono:
${usageReport.unusedCssClasses.map((c: string) => `- .${c}`).join('\n')}

Le classi usate nel progetto ma non definite nei CSS sono:
${usageReport.missingCssClasses.map((c: string) => `- .${c}`).join('\n')}

Suggerisci miglioramenti al progetto:
- Refactoring e modularizzazione dei CSS
- Ottimizzazione SEO e accessibilità
- Inserimento variabili mancanti
- Rimozione classi inutilizzate
- Miglioramenti semantici e responsive

Fornisci suggerimenti pratici e ordinati.
`;

    const response = await askOllama(prompt);
    return response.split('\n').map((s: string) => s.trim()).filter(Boolean);
  },

  async ask(question: string): Promise<string> {
    return await askOllama(question);
  },

  registerModule(name: string, fn: Function): void {
    console.log(`📦 Modulo IA registrato: ${name}`);
  }
};