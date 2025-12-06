import { useEffect, useRef } from 'react';

const imageCache = new Map<string, HTMLImageElement>();

export function preloadImage(src: string): Promise<void> {
  if (!src || imageCache.has(src)) {
    return Promise.resolve();
  }
  
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      imageCache.set(src, img);
      resolve();
    };
    img.onerror = () => resolve();
    img.src = src;
  });
}

export function preloadImages(urls: string[]): Promise<void[]> {
  return Promise.all(urls.map(preloadImage));
}

export function useImagePreloader(urls: string[]) {
  const loadedRef = useRef(false);
  
  useEffect(() => {
    if (loadedRef.current || urls.length === 0) return;
    loadedRef.current = true;
    
    preloadImages(urls);
  }, [urls]);
}

export function getImageFromCache(src: string): HTMLImageElement | undefined {
  return imageCache.get(src);
}

export function isImageCached(src: string): boolean {
  return imageCache.has(src);
}
