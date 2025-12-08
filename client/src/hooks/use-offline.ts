import { useState, useEffect, useCallback } from 'react';

const CACHE_KEYS = {
  WORKOUTS: 'kladlift_workouts_cache',
  USER: 'kladlift_user_cache',
  BODY_LOGS: 'kladlift_body_logs_cache',
  PENDING_SYNC: 'kladlift_pending_sync',
  LAST_SYNC: 'kladlift_last_sync'
} as const;

export interface PendingAction {
  id: string;
  type: 'CREATE_WORKOUT' | 'UPDATE_WORKOUT' | 'DELETE_WORKOUT' | 'CREATE_BODY_LOG' | 'DELETE_BODY_LOG';
  endpoint: string;
  method: 'POST' | 'PATCH' | 'DELETE';
  data?: any;
  timestamp: number;
}

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}

export function useOfflineCache<T>(key: string) {
  const getCache = useCallback((): T | null => {
    try {
      const cached = localStorage.getItem(key);
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        const ONE_DAY = 24 * 60 * 60 * 1000;
        if (Date.now() - timestamp < ONE_DAY) {
          return data as T;
        }
      }
      return null;
    } catch {
      return null;
    }
  }, [key]);

  const setCache = useCallback((data: T) => {
    try {
      localStorage.setItem(key, JSON.stringify({
        data,
        timestamp: Date.now()
      }));
    } catch {
      // Storage full or unavailable
    }
  }, [key]);

  const clearCache = useCallback(() => {
    try {
      localStorage.removeItem(key);
    } catch {
      // Ignore errors
    }
  }, [key]);

  return { getCache, setCache, clearCache };
}

export function usePendingSync() {
  const getPendingActions = useCallback((): PendingAction[] => {
    try {
      const pending = localStorage.getItem(CACHE_KEYS.PENDING_SYNC);
      return pending ? JSON.parse(pending) : [];
    } catch {
      return [];
    }
  }, []);

  const addPendingAction = useCallback((action: Omit<PendingAction, 'id' | 'timestamp'>) => {
    try {
      const pending = getPendingActions();
      const newAction: PendingAction = {
        ...action,
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        timestamp: Date.now()
      };
      pending.push(newAction);
      localStorage.setItem(CACHE_KEYS.PENDING_SYNC, JSON.stringify(pending));
      return newAction.id;
    } catch {
      return null;
    }
  }, [getPendingActions]);

  const removePendingAction = useCallback((id: string) => {
    try {
      const pending = getPendingActions().filter(a => a.id !== id);
      localStorage.setItem(CACHE_KEYS.PENDING_SYNC, JSON.stringify(pending));
    } catch {
      // Ignore
    }
  }, [getPendingActions]);

  const clearPendingActions = useCallback(() => {
    try {
      localStorage.removeItem(CACHE_KEYS.PENDING_SYNC);
    } catch {
      // Ignore
    }
  }, []);

  return { 
    getPendingActions, 
    addPendingAction, 
    removePendingAction, 
    clearPendingActions,
    hasPendingActions: getPendingActions().length > 0
  };
}

export function useOfflineWorkouts() {
  const { getCache, setCache } = useOfflineCache<any[]>(CACHE_KEYS.WORKOUTS);
  
  const cacheWorkouts = useCallback((workouts: any[]) => {
    setCache(workouts);
  }, [setCache]);

  const getCachedWorkouts = useCallback(() => {
    return getCache() || [];
  }, [getCache]);

  return { cacheWorkouts, getCachedWorkouts };
}

export function useOfflineUser() {
  const { getCache, setCache } = useOfflineCache<any>(CACHE_KEYS.USER);
  
  const cacheUser = useCallback((user: any) => {
    setCache(user);
  }, [setCache]);

  const getCachedUser = useCallback(() => {
    return getCache();
  }, [getCache]);

  return { cacheUser, getCachedUser };
}

export function useOfflineBodyLogs() {
  const { getCache, setCache } = useOfflineCache<any[]>(CACHE_KEYS.BODY_LOGS);
  
  const cacheBodyLogs = useCallback((logs: any[]) => {
    setCache(logs);
  }, [setCache]);

  const getCachedBodyLogs = useCallback(() => {
    return getCache() || [];
  }, [getCache]);

  return { cacheBodyLogs, getCachedBodyLogs };
}

export { CACHE_KEYS };
