'use client';

import * as React from 'react';
import { CacheProvider, EmotionCache } from '@emotion/react';
import createEmotionCache from '@/lib/createEmotionCache';

const clientSideEmotionCache = createEmotionCache();

interface EmotionCacheProviderProps {
  children: React.ReactNode;
  emotionCache?: EmotionCache;
}

export default function EmotionCacheProvider({
  children,
  emotionCache = clientSideEmotionCache,
}: EmotionCacheProviderProps) {
  return <CacheProvider value={emotionCache}>{children}</CacheProvider>;
}
