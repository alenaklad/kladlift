import { useState, useEffect } from 'react';

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
  placeholderColor = 'bg-slate-200'
}: OptimizedImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setIsLoaded(false);
    setHasError(false);
    
    const img = new Image();
    img.src = src;
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
          src={src}
          alt={alt}
          loading="eager"
          decoding="sync"
          className={`w-full h-full object-cover ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
          onLoad={() => setIsLoaded(true)}
          onError={() => setHasError(true)}
        />
      )}
      {hasError && (
        <div className={`absolute inset-0 ${placeholderColor} flex items-center justify-center`}>
          <span className="text-xs text-slate-400">Нет фото</span>
        </div>
      )}
    </div>
  );
}
