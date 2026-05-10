import { useEffect, useRef } from 'react';
import { useStore } from '../store';

export function useFocusMode() {
  const focusModeEnabled = useStore((s) => s.focusModeEnabled);
  const wakeLockRef = useRef<any>(null);

  useEffect(() => {
    if (!focusModeEnabled) {
      if (wakeLockRef.current) {
        wakeLockRef.current.release().then(() => {
          wakeLockRef.current = null;
        }).catch(() => {});
      }
      return;
    }

    const requestWakeLock = async () => {
      try {
        if ('wakeLock' in navigator) {
          wakeLockRef.current = await (navigator as any).wakeLock.request('screen');
        }
      } catch (err: any) {
        console.warn('Wake Lock error:', err.name, err.message);
      }
    };

    requestWakeLock();

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && focusModeEnabled) {
        requestWakeLock();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (wakeLockRef.current) {
        wakeLockRef.current.release().then(() => {
          wakeLockRef.current = null;
        }).catch(() => {});
      }
    };
  }, [focusModeEnabled]);
}
