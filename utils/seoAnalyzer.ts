import { JSDOM } from 'jsdom';

export function analyzeSeo(content: string) {
  const dom = new JSDOM(content);
  const document = dom.window.document;

  const title = document.querySelector('title')?.textContent || '❌ Titolo mancante';
  const metaDescription = document.querySelector('meta[name="description"]')?.getAttribute('content') || '❌ Meta description mancante';

  const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6')).map(h => {
    const heading = h as HTMLElement;
    return heading.textContent?.trim() || '';
  });

  const images = Array.from(document.querySelectorAll('img')).map(img => {
    const image = img as HTMLImageElement;
    return {
      src: image.getAttribute('src'),
      alt: image.getAttribute('alt') || '❌ Alt mancante'
    };
  });

  return {
    title,
    metaDescription,
    headings,
    images
  };
}