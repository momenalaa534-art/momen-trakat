import { useEffect, useCallback } from 'react';
import { useStore } from './store';
import { useTranslation } from './i18n';

export function useWirdReminder() {
  const { dailyWirdReminderEnabled, dailyWirdReminderTime, lastWirdReminderDate, setLastWirdReminderDate } = useStore();
  const { language } = useTranslation();

  const checkReminder = useCallback(() => {
    if (!dailyWirdReminderEnabled || !dailyWirdReminderTime) return;

    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    
    const todayDateString = now.toISOString().split('T')[0];
    
    const [targetHourStr, targetMinuteStr] = dailyWirdReminderTime.split(':');
    const targetHour = parseInt(targetHourStr, 10);
    const targetMinute = parseInt(targetMinuteStr, 10);

    // Same minute & not already notified today
    if (
      currentHour === targetHour &&
      currentMinute === targetMinute &&
      lastWirdReminderDate !== todayDateString
    ) {
      setLastWirdReminderDate(todayDateString);
      
      // Push notification if possible
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(language === 'ar' ? 'تذكير الورد اليومي' : 'Daily Quran Reminder', {
          body: language === 'ar' 
            ? 'حان وقت قراءة الورد اليومي من القرآن الكريم.' 
            : 'It is time to read your daily portion of the Quran.',
          icon: '/favicon.ico',
        });
      } else {
        // Fallback to simple alert or custom toast (here alert as it's safe)
        alert(
          language === 'ar' 
            ? 'تذكير: حان وقت قراءة الورد اليومي من القرآن الكريم.' 
            : 'Reminder: It is time to read your daily portion of the Quran.'
        );
      }
    }
  }, [dailyWirdReminderEnabled, dailyWirdReminderTime, lastWirdReminderDate, setLastWirdReminderDate, language]);

  useEffect(() => {
    // Check immediately when the state/time changes, then check every 15 seconds to ensure it triggers exactly on time
    checkReminder();
    
    const interval = setInterval(checkReminder, 15000); 

    return () => clearInterval(interval);
  }, [checkReminder]);
}
