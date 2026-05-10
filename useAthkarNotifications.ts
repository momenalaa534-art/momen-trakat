import { useEffect } from 'react';
import { useStore } from './store';
import { useTranslation } from './i18n';

// Simple beep for devices that don't have default notification sounds
function playNotificationSound() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    osc.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    // Smooth bell-like beep
    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.1);
    
    gainNode.gain.setValueAtTime(0, ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(1, ctx.currentTime + 0.05);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.0);
    
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 1.0);
  } catch (err) {
    console.warn('AudioContext not supported or blocked', err);
  }
}

export function useAthkarNotifications() {
  const notificationsEnabled = useStore((s) => s.notificationsEnabled);
  const lastNotificationDate = useStore((s) => s.lastNotificationDate);
  const setLastNotificationDate = useStore((s) => s.setLastNotificationDate);
  const language = useStore((s) => s.language);
  const { t } = useTranslation();

  useEffect(() => {
    if (!notificationsEnabled) return;

    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    const checkTimeAndNotify = () => {
      const now = new Date();
      const hour = now.getHours();
      const dateStr = now.toISOString().split('T')[0];

      // Define times for Morning (5:00 AM - 9:00 AM) and Evening (4:00 PM - 8:00 PM)
      // For demonstration and reliability, we assume morning starts at 5am, evening starts at 4pm.
      const isMorningTime = hour >= 5 && hour < 9;
      const isEveningTime = hour >= 16 && hour < 20;

      const morningKey = `${dateStr}-morning`;
      const eveningKey = `${dateStr}-evening`;

      const shouldFireMorning = isMorningTime && lastNotificationDate !== morningKey;
      const shouldFireEvening = isEveningTime && lastNotificationDate !== eveningKey;

      if (shouldFireMorning || shouldFireEvening) {
        // Translation keys we'll map directly here or add them to i18n
        const title = shouldFireMorning 
          ? (language === 'ar' ? 'أذكار الصباح' : 'Morning Athkar')
          : (language === 'ar' ? 'أذكار المساء' : 'Evening Athkar');
          
        const body = shouldFireMorning
          ? (language === 'ar' ? 'حان الآن موعد أذكار الصباح، نبدأ يومنا بذكر الله.' : 'It is time for Morning Athkar, let us start our day remembering Allah.')
          : (language === 'ar' ? 'حان الآن موعد أذكار المساء، نختم يومنا بذكر الله.' : 'It is time for Evening Athkar, let us end our day remembering Allah.');

        playNotificationSound();

        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification(title, {
            body,
            icon: '/vite.svg',
            dir: language === 'ar' ? 'rtl' : 'ltr'
          });
        }

        // We update the state to mark today's notification as sent
        setLastNotificationDate(shouldFireMorning ? morningKey : eveningKey);
      }
    };

    // Check immediately on mount/enable
    checkTimeAndNotify();

    // Recheck every minute
    const interval = setInterval(checkTimeAndNotify, 60000);
    return () => clearInterval(interval);

  }, [notificationsEnabled, lastNotificationDate, setLastNotificationDate, language, t]);
}
