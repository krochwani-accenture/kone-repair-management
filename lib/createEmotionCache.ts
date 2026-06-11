import createCache from '@emotion/cache';

export default function createEmotionCache() {
  const insertionPoint =
    typeof document !== 'undefined'
      ? document.querySelector('meta[name="emotion-insertion-point"]')
      : undefined;

  return createCache({
    key: 'mui',
    prepend: true,
    insertionPoint: insertionPoint ?? undefined,
  });
}
