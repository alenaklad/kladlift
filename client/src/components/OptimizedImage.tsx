import { useState, useEffect, useRef } from 'react';

interface OptimizedImageProps {
  src: string;
  alt: string;
  className?: string;
  placeholderColor?: string;
}

export function OptimizedImage({ 
  src, 
  alt, 
  className = '', 
  placeholderColor = 'bg-slate-200 dark:bg-slate-700'
}: OptimizedImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    setHasError(false);
    
    // Проверяем если изображение уже в кеше браузера
    const img = new Image();
    img.src = src;
    
    if (img.complete && img.naturalWidth > 0) {
      setIsLoaded(true);
      return;
    }
    
    setIsLoaded(false);
    img.onload = () => setIsLoaded(true);
    img.onerror = () => setHasError(true);
    
    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [src]);

  return (
    <div className={`relative ${className}`}>
      {!isLoaded && !hasError && (
        <div className={`absolute inset-0 ${placeholderColor}`} />
      )}
      {!hasError && (
        <img
          ref={imgRef}
          src={src}
          alt={alt}
          loading="eager"
          decoding="sync"
          className={`w-full h-full object-cover transition-opacity duration-150 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
          onLoad={() => setIsLoaded(true)}
          onError={() => setHasError(true)}
        />
      )}
      {hasError && (
        <div className={`absolute inset-0 ${placeholderColor} flex items-center justify-center`}>
          <span className="text-xs text-slate-400 dark:text-slate-500">Нет фото</span>
        </div>
      )}
    </div>
  );
}
