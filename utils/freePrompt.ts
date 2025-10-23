import { askModel } from './aiSuggest';

export async function runFreePrompt(prompt: string) {
  try {
    const response = await askModel('mistral', prompt);
    return { response, fallback: false };
  } catch (error) {
    console.error('⚠️ Errore nel prompt libero:', error);
    return {
      response: '⚠️ IA non disponibile. Procedi con ricerca manuale.',
      fallback: true
    };
  }
}