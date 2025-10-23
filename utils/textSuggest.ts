import { suggestContent } from './aiSuggest';

export async function getTextSuggestions(prompt: string): Promise<{
  fallback: boolean;
  content: string;
}> {
  try {
    const content = await suggestContent(prompt);
    return {
      fallback: false,
      content
    };
  } catch (error) {
    console.error('⚠️ Errore IA:', error);
    return {
      fallback: true,
      content: '⚠️ Suggerimenti IA non disponibili. Puoi comunque migliorare il titolo, aggiungere meta description e usare keyword correlate come sinonimi o varianti semantiche.'
    };
  }
}