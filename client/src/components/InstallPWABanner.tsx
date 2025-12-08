import { useState, useEffect } from 'react';
import { X, Download, Share } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function InstallPWABanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
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
      setTimeout(() => setShowBanner(true), 3000);
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setTimeout(() => setShowBanner(true), 2000);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

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

  if (isInstalled || !showBanner) return null;

  return (
    <div 
      className="fixed bottom-20 left-4 right-4 z-50 animate-in slide-in-from-bottom-4 duration-300"
      data-testid="pwa-install-banner"
    >
      <div className="bg-gradient-to-r from-orange-500/20 to-amber-500/20 backdrop-blur-xl border border-orange-500/30 rounded-2xl p-4 shadow-2xl">
        <button
          onClick={handleDismiss}
          className="absolute top-2 right-2 p-1 text-white/60 hover:text-white"
          data-testid="button-dismiss-pwa-banner"
        >
          <X className="w-5 h-5" />
        </button>
        
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-amber-500 rounded-xl flex items-center justify-center flex-shrink-0">
            <Download className="w-6 h-6 text-white" />
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="text-white font-semibold text-sm">
              Установи KladLift
            </h3>
            <p className="text-white/70 text-xs mt-0.5">
              {isIOS 
                ? 'Нажми "Поделиться" → "На экран Домой"'
                : 'Добавь на главный экран для быстрого доступа'
              }
            </p>
          </div>
          
          {isIOS ? (
            <div className="flex-shrink-0 p-2 bg-white/10 rounded-lg">
              <Share className="w-5 h-5 text-white" />
            </div>
          ) : (
            <Button
              onClick={handleInstall}
              size="sm"
              className="flex-shrink-0 bg-orange-500 hover:bg-orange-600 text-white"
              data-testid="button-install-pwa"
            >
              Установить
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
