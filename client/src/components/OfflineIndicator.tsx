import { useOnlineStatus, usePendingSync, CACHE_KEYS } from '@/hooks/use-offline';
import { WifiOff, CloudOff, RefreshCw } from 'lucide-react';
import { useEffect, useState, useCallback } from 'react';

export function OfflineIndicator() {
  const isOnline = useOnlineStatus();
  const { getPendingActions } = usePendingSync();
  const [pendingCount, setPendingCount] = useState(0);
  const [showReconnected, setShowReconnected] = useState(false);
  const [wasOffline, setWasOffline] = useState(false);

  const updatePendingCount = useCallback(() => {
    setPendingCount(getPendingActions().length);
  }, [getPendingActions]);

  useEffect(() => {
    updatePendingCount();
    const interval = setInterval(updatePendingCount, 2000);
    
    const handleStorage = (e: StorageEvent) => {
      if (e.key === CACHE_KEYS.PENDING_SYNC) {
        updatePendingCount();
      }
    };
    window.addEventListener('storage', handleStorage);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', handleStorage);
    };
  }, [updatePendingCount]);

  useEffect(() => {
    if (!isOnline) {
      setWasOffline(true);
    } else if (wasOffline) {
      setShowReconnected(true);
      const timer = setTimeout(() => {
        setShowReconnected(false);
        setWasOffline(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isOnline, wasOffline]);

  if (showReconnected) {
    return (
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-top-4 fade-in duration-300">
        <div className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-full shadow-lg text-sm font-medium">
          <RefreshCw size={16} className="animate-spin" />
          Синхронизация...
        </div>
      </div>
    );
  }

  if (!isOnline) {
    return (
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-top-4 fade-in duration-300">
        <div className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-full shadow-lg text-sm font-medium">
          <WifiOff size={16} />
          Офлайн-режим
          {pendingCount > 0 && (
            <span className="px-2 py-0.5 bg-white/20 rounded-full text-xs">
              {pendingCount} в очереди
            </span>
          )}
        </div>
      </div>
    );
  }

  return null;
}

export function OfflineBanner() {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="bg-orange-500 text-white px-4 py-2 text-center text-sm font-medium flex items-center justify-center gap-2">
      <CloudOff size={16} />
      Нет подключения к интернету. Данные сохраняются локально.
    </div>
  );
}
