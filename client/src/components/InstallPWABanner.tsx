import { useState, useEffect } from 'react';
import { X, Smartphone, Share } from 'lucide-react';
import { Button } from '@/components/ui/button';
import logoUrl from '/logo.png';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface InstallPWABannerProps {
  isAuthenticated?: boolean;
}

export function InstallPWABanner({ isAuthenticated = false }: InstallPWABannerProps) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) return;

    const isStandalone = window.matchMedia('(display-mode: standalone)').matches 
      || (window.navigator as any).standalone === true;
    
    if (isStandalone) {
      setIsInstalled(true);
      return;
    }

    const dismissed = localStorage.getItem('pwa-banner-dismissed');
    if (dismissed) {
      const dismissedTime = parseInt(dismissed, 10);
      if (Date.now() - dismissedTime < 7 * 24 * 60 * 60 * 1000) {
        return;
      }
    }

    const ua = window.navigator.userAgent;
    const isIOSDevice = /iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream;
    setIsIOS(isIOSDevice);

    if (isIOSDevice) {
      setTimeout(() => setShowBanner(true), 5000);
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setTimeout(() => setShowBanner(true), 5000);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, [isAuthenticated]);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setShowBanner(false);
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    setShowBanner(false);
    localStorage.setItem('pwa-banner-dismissed', Date.now().toString());
  };

  if (!isAuthenticated || isInstalled || !showBanner) return null;

  return (
    <div 
      className="fixed bottom-24 left-4 right-4 z-50 animate-in slide-in-from-bottom-4 duration-500"
      data-testid="pwa-install-banner"
    >
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 shadow-2xl shadow-black/10">
        <button
          onClick={handleDismiss}
          className="absolute top-3 right-3 p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          data-testid="button-dismiss-pwa-banner"
        >
          <X className="w-4 h-4" />
        </button>
        
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-700 rounded-2xl flex items-center justify-center flex-shrink-0 border border-slate-200 dark:border-slate-600">
            <img src={logoUrl} alt="KladLift" className="w-8 h-10 object-contain" />
          </div>
          
          <div className="flex-1 min-w-0 pr-6">
            <h3 className="text-slate-900 dark:text-white font-semibold text-base">
              Добавь на главный экран
            </h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
              {isIOS 
                ? 'Быстрый доступ к тренировкам'
                : 'Работает как обычное приложение'
              }
            </p>
          </div>
        </div>
        
        <div className="mt-4 flex gap-2">
          {isIOS ? (
            <div className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-700 dark:text-slate-300 text-sm font-medium">
              <Share className="w-4 h-4" />
              <span>Нажми</span>
              <Share className="w-4 h-4 text-blue-500" />
              <span>→ На экран «Домой»</span>
            </div>
          ) : (
            <>
              <Button
                onClick={handleDismiss}
                variant="ghost"
                className="flex-1 text-slate-600 dark:text-slate-400"
                data-testid="button-later-pwa"
              >
                Позже
              </Button>
              <Button
                onClick={handleInstall}
                className="flex-1 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 dark:text-slate-900 text-white"
                data-testid="button-install-pwa"
              >
                <Smartphone className="w-4 h-4 mr-2" />
                Установить
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
