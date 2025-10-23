import { askModel } from './aiSuggest';

export async function generateContent({
  type,
  tema,
  stile,
  lingua,
  struttura
}: {
  type: 'pagina' | 'testo' | 'component' | 'email';
  tema: string;
  stile?: string;
  lingua?: string;
  struttura?: string[];
}): Promise<{
  content: string;
  fallback: boolean;
}> {
  const prompt = `
Sei un assistente creativo. Genera un contenuto di tipo "${type}" sul tema "${tema}".
Stile richiesto: ${stile || 'neutro'}
Lingua: ${lingua || 'it'}
Struttura suggerita: ${struttura?.join(', ') || 'libera'}

Il contenuto deve essere coerente, ben formattato, e pronto per essere integrato nel progetto.
`;

  try {
    const response = await askModel('mistral', prompt);
    return {
      content: response.trim(),
      fallback: false
    };
  } catch (error) {
    console.error('⚠️ Errore IA:', error);
    return {
      content: '⚠️ IA non disponibile. Puoi comunque scrivere un contenuto coerente seguendo il tema e la struttura indicata.',
      fallback: true
    };
  }
}