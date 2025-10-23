export async function askModel(model: string, prompt: string): Promise<string> {
  try {
    const response = await fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      body: JSON.stringify({ model, prompt, stream: true }),
      headers: { 'Content-Type': 'application/json' }
    });

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();
    let result = '';

    while (reader) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split('\n').filter(Boolean);

      for (const line of lines) {
        try {
          const parsed = JSON.parse(line);
          if (parsed.response) result += parsed.response;
        } catch (err) {
          console.warn('⚠️ Errore nel parsing di una riga:', line);
        }
      }
    }

    return result.trim();
  } catch (error) {
    console.error('⚠️ Errore IA:', error);
    return '⚠️ Modello non disponibile. Procedi con fallback manuale.';
  }
}

// Suggerimenti CSS
export async function suggestCss(content: string): Promise<{
  removals: string[];
  variables: string[];
}> {
  const prompt = `
Sei un esperto di ottimizzazione CSS. Analizza il seguente contenuto e suggerisci:
- Classi da rimuovere (es. inutilizzate, ridondanti, debug)
- Variabili CSS da inserire (es. colori, spaziature, font)

Contenuto:
${content}
  `;

  const raw = await askModel('mistral', prompt);
  return {
    removals: extractList(raw, /Classi da rimuovere:\s*(.*)/i),
    variables: extractList(raw, /Variabili CSS da inserire:\s*(.*)/i)
  };
}

// Suggerimenti SEO
export async function suggestSeo(content: string): Promise<{
  title: string;
  description: string;
  headings: string[];
  altText: string;
}> {
  const prompt = `
Sei un esperto SEO. Analizza il seguente contenuto HTML/Markdown e suggerisci:
- Titolo ottimizzato
- Meta description efficace
- Heading da ristrutturare
- Testo alternativo per immagini

Contenuto:
${content}
  `;

  const raw = await askModel('mistral', prompt);
  return {
    title: extractSingle(raw, /Titolo ottimizzato:\s*(.*)/i),
    description: extractSingle(raw, /Meta description:\s*(.*)/i),
    headings: extractList(raw, /Heading da ristrutturare:\s*(.*)/i),
    altText: extractSingle(raw, /Alt per immagini:\s*(.*)/i)
  };
}

// Suggerimenti contenuti
export async function suggestContent(topic: string): Promise<string> {
  const prompt = `
Genera un contenuto efficace per il seguente tema:
${topic}
  `;
  return await askModel('mistral', prompt);
}

// Utility parsing
function extractList(text: string, regex: RegExp): string[] {
  const match = text.match(regex);
  return match ? match[1].split(',').map(s => s.trim()) : [];
}

function extractSingle(text: string, regex: RegExp): string {
  const match = text.match(regex);
  return match ? match[1].trim() : '';
}