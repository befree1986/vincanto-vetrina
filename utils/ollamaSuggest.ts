import { askModel } from './aiSuggest';

export async function getOllamaSuggestions({
  cssContent,
  removedHistory,
  insertedHistory
}: {
  cssContent: string;
  removedHistory: string[];
  insertedHistory: string[];
}) {
  const prompt = `
Sei un assistente esperto in ottimizzazione CSS. Analizza il seguente contenuto CSS e suggerisci:
- Classi potenzialmente inutilizzate o ridondanti
- Variabili CSS che potrebbero essere astratte
- Miglioramenti semantici

Contesto storico:
- Classi rimosse in passato: ${removedHistory.join(', ') || 'Nessuna'}
- Variabili inserite in passato: ${insertedHistory.join(', ') || 'Nessuna'}

Contenuto CSS:
${cssContent}

Rispondi in formato JSON con:
{
  "suggestedRemovals": [...],
  "suggestedVariables": [...]
}
`;

  try {
    const raw = await askModel('mistral', prompt);
    const match = raw.match(/\{[\s\S]*\}/);
    return match ? JSON.parse(match[0]) : {
      suggestedRemovals: [],
      suggestedVariables: [],
      fallback: true
    };
  } catch (error) {
    console.error('⚠️ Errore IA:', error);
    return {
      suggestedRemovals: ['.debug', '.unused'],
      suggestedVariables: ['--main-color', '--spacing-unit'],
      fallback: true
    };
  }
}