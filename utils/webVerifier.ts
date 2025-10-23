export async function verifyContentOnline({
  content,
  topic,
  language = 'it'
}: {
  content: string;
  topic: string;
  language?: string;
}) {
  const prompt = `
Confronta il seguente contenuto con fonti online affidabili e altri modelli IA (ChatGPT, Claude, Gemini, LLaMA).
Tema: ${topic}
Lingua: ${language}

Contenuto da verificare:
${content}

Rispondi in formato JSON con:
{
  "verificato": true | false,
  "fonti": [ "URL o descrizione" ],
  "discrepanze": [ "frasi o concetti non confermati" ],
  "suggerimenti": [ "miglioramenti proposti" ]
}
`;

  const response = await fetch('http://localhost:11434/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'llama3',
      prompt,
      stream: false
    })
  });

  const result = await response.json();
  const match = result.response.match(/\{[\s\S]*\}/);
  return match ? JSON.parse(match[0]) : null;
}