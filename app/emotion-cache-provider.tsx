'use client';

import * as React from 'react';
import { CacheProvider, EmotionCache } from '@emotion/react';
import { useServerInsertedHTML } from 'next/navigation';
import createEmotionCache from '@/lib/createEmotionCache';

interface EmotionCacheProviderProps {
  children: React.ReactNode;
  emotionCache?: EmotionCache;
}

export default function EmotionCacheProvider({
  children,
  emotionCache,
}: EmotionCacheProviderProps) {
  const [{ cache, flush }] = React.useState(() => {
    const cache = emotionCache ?? createEmotionCache();
    cache.compat = true;

    const previousInsert = cache.insert;
    let inserted: string[] = [];

    cache.insert = (...args) => {
      const serialized = args[1];

      if (cache.inserted[serialized.name] === undefined) {
        inserted.push(serialized.name);
      }

      return previousInsert(...args);
    };

    const flush = () => {
      const previousInserted = inserted;
      inserted = [];
      return previousInserted;
    };

    return { cache, flush };
  });

  useServerInsertedHTML(() => {
    const names = flush();

    if (names.length === 0) {
      return null;
    }

    let styles = '';

    for (const name of names) {
      styles += cache.inserted[name];
    }

    return (
      <style
        key={cache.key}
        data-emotion={`${cache.key} ${names.join(' ')}`}
        dangerouslySetInnerHTML={{ __html: styles }}
      />
    );
  });

  return <CacheProvider value={cache}>{children}</CacheProvider>;
}
