export function analyzeImageTags(content: string): string[] {
  const matches = [...content.matchAll(/<img\s[^>]*>/gi)];
  return matches.map(tag => tag[0].trim());
}

export function suggestImageImprovements(tag: string): {
  alt: string;
  loading: string;
  format: string;
} {
  return {
    alt: 'Foto descrittiva del prodotto',
    loading: 'lazy',
    format: tag.includes('.jpg') ? 'webp' : 'svg'
  };
}