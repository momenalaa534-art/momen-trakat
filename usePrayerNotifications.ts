import { useEffect, useCallback, useRef } from 'react';
import { useStore } from '../store';
import { useTranslation } from '../i18n';
import { calculatePrayerTimes, formatTimePrefix } from '../utils/prayerTimes';

// Selected reliable Adhan URLs
const ADHAN_URLS: Record<string, string> = {
  makkah: 'https://podcasts.muslimcentral.com/adhan/makkah-adhan.mp3',
  madinah: 'https://podcasts.muslimcentral.com/adhan/madinah-adhan.mp3',
  alafasy: 'https://podcasts.muslimcentral.com/adhan/al-afasy-adhan.mp3',
  abdulbasit: 'https://podcasts.muslimcentral.com/adhan/abdul-basit-adhan.mp3',
  short: 'https://actions.google.com/sounds/v1/alarms/message_alert.ogg',
};

export function usePrayerNotifications() {
  const { 
    prayerReminderEnabled, 
    prayerSettings,
    selectedMuezzin, 
    lastPrayerNotified, 
    setLastPrayerNotified,
    location,
    setLocation,
    prayerTimes,
    setPrayerTimes,
    calculationMethod,
    preReminderTime,
    dstAdjustment,
    progressiveVolume,
    nightModeAudio
  } = useStore();
  const { language } = useTranslation();
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Ask for location if not available and enabled
  useEffect(() => {
    if (prayerReminderEnabled && !location) {
      if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            setLocation({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude
            });
          },
          (error) => {
            console.error('Geolocation error:', error);
            // Default to Makkah if denied
            setLocation({ latitude: 21.4225, longitude: 39.8262 });
          }
        );
      }
    }
  }, [prayerReminderEnabled, location, setLocation]);

  // Fetch today's prayer times offline from adhan js
  const fetchPrayerTimes = useCallback(() => {
    if (!location) return;
    try {
      const pt = calculatePrayerTimes(location.latitude, location.longitude, calculationMethod, new Date());
      
      const applyDst = (dateObj: Date) => {
        return new Date(dateObj.getTime() + dstAdjustment * 60 * 60 * 1000);
      };

      setPrayerTimes({
        Fajr: formatTimePrefix(applyDst(pt.fajr)),
        Dhuhr: formatTimePrefix(applyDst(pt.dhuhr)),
        Asr: formatTimePrefix(applyDst(pt.asr)),
        Maghrib: formatTimePrefix(applyDst(pt.maghrib)),
        Isha: formatTimePrefix(applyDst(pt.isha))
      });
    } catch (e) {
      console.error('Failed to calculate prayer times', e);
    }
  }, [location, calculationMethod, dstAdjustment, setPrayerTimes]);

  // Re-fetch when dependencies change
  useEffect(() => {
    fetchPrayerTimes();
  }, [location, calculationMethod, dstAdjustment, fetchPrayerTimes]);

  const playAdhan = useCallback((prayerName: string, settings: any) => {
    if (audioRef.current) {
        audioRef.current.pause();
    }
    const muezzinToUse = settings?.muezzin || selectedMuezzin;
    const audioUrl = ADHAN_URLS[muezzinToUse] || ADHAN_URLS.makkah;
    const audio = new Audio(audioUrl);
    
    // Night Mode Audio (softer for Fajr & Isha)
    let maxVolume = 1.0;
    if (nightModeAudio && (prayerName === 'Fajr' || prayerName === 'Isha')) {
        maxVolume = 0.5;
    }

    // Progressive Vol
    if (progressiveVolume) {
        audio.volume = 0.1;
    } else {
        audio.volume = maxVolume;
    }

    audioRef.current = audio;
    audio.play().then(() => {
        if (progressiveVolume) {
            let vol = 0.1;
            const fadeInterval = setInterval(() => {
                vol += 0.05;
                if (vol >= maxVolume) {
                    audio.volume = maxVolume;
                    clearInterval(fadeInterval);
                } else {
                    audio.volume = vol;
                }
            }, 1000);
        }
    }).catch(e => console.error('Audio play failed:', e));
  }, [selectedMuezzin, nightModeAudio, progressiveVolume]);

  const sendNotification = useCallback((title: string, body: string, isUrgent = true) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
          if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
            navigator.serviceWorker.ready.then(registration => {
              registration.showNotification(title, {
                body,
                icon: '/icons/icon-192.png',
                vibrate: isUrgent ? [200, 100, 200, 100, 200] : undefined,
                badge: '/icons/icon-192.png',
                requireInteraction: isUrgent
              } as any);
            });
          } else {
             new Notification(title, {
               body,
               icon: '/icons/icon-192.png',
             });
          }
      } catch(e) { console.error('Notification failed', e); }
    }
  }, []);

  // Check every 15 seconds
  const checkTimes = useCallback(() => {
    if (!prayerReminderEnabled || !prayerTimes) return;

    const now = new Date();
    const currentHour = now.getHours().toString().padStart(2, '0');
    const currentMinute = now.getMinutes().toString().padStart(2, '0');
    const currentTimeStr = `${currentHour}:${currentMinute}`;
    
    const todayDateString = now.toISOString().split('T')[0];

    Object.entries(prayerTimes).forEach(([prayerName, time]) => {
      // 1. Check exact time
      if (time === currentTimeStr) {
        const notificationId = `${todayDateString}-${prayerName}`;

        if (lastPrayerNotified !== notificationId) {
          const settings = prayerSettings?.[prayerName];
          if (settings && settings.enabled === false) return; // skip
          
          setLastPrayerNotified(notificationId);
          
          if (!settings || settings.mode === 'both' || settings.mode === 'notification') {
            const title = language === 'ar' ? `حان موعد صلاة ${getArabicName(prayerName)}` : `Time for ${prayerName} prayer`;
            const body = prayerName === 'Fajr' ? 
              (language === 'ar' ? 'الصلاة خير من النوم' : 'Prayer is better than sleep') : 
              (language === 'ar' ? 'حي على الصلاة، حي على الفلاح' : 'Come to prayer, come to success');
            
            sendNotification(title, body, true);
          }
          
          if (!settings || settings.mode === 'both' || settings.mode === 'sound') {
            playAdhan(prayerName, settings);
          }
        }
      }

      // 2. Post prayer reminder (e.g. 15 mins after prayer)
      const [ph, pm] = time.split(':').map(Number);
      const postPrayerDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), ph, pm + 15);
      const diffToPost = Math.round((now.getTime() - postPrayerDate.getTime()) / 60000);
      const postRemId = `${todayDateString}-post-${prayerName}`;

      if (diffToPost === 0 && lastPrayerNotified !== postRemId) {
         setLastPrayerNotified(postRemId);
         if (prayerSettings?.[prayerName]?.enabled !== false) {
           sendNotification(
              language === 'ar' ? 'أذكار بعد الصلاة' : 'Post Prayer Adhkar',
              language === 'ar' ? 'لا تنسَ أذكار بعد الصلاة' : 'Do not forget post prayer adhkar',
              false
           );
         }

         // Specific morning/evening adhkar trigger
         if (prayerName === 'Fajr') {
            setTimeout(() => {
              sendNotification(
                language === 'ar' ? 'أذكار الصباح' : 'Morning Adhkar',
                language === 'ar' ? 'ابدأ يومك بذكر الله والأذكار الصباحية' : 'Start your day with morning adhkar',
                false
              );
            }, 5000);
         }
         if (prayerName === 'Asr' || prayerName === 'Maghrib') {
            setTimeout(() => {
              sendNotification(
                language === 'ar' ? 'أذكار المساء' : 'Evening Adhkar',
                language === 'ar' ? 'لا تنسَ قراءة أذكار المساء' : 'Do not forget your evening adhkar',
                false
              );
            }, 5000);
         }
      }

      // 3. Pre prayer reminder
      const prePrayerDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), ph, pm - Math.max(0, preReminderTime));
      const diffToPre = Math.round((now.getTime() - prePrayerDate.getTime()) / 60000);
      const preRemId = `${todayDateString}-pre-${prayerName}`;
      
      if (diffToPre === 0 && preReminderTime > 0 && lastPrayerNotified !== preRemId) {
         setLastPrayerNotified(preRemId);
         if (prayerSettings?.[prayerName]?.enabled !== false) {
           sendNotification(
              language === 'ar' ? `اقترب موعد صلاة ${getArabicName(prayerName)}` : `${prayerName} is approaching`,
              language === 'ar' ? `باقي ${preReminderTime} دقيقة على الأذان` : `${preReminderTime} minutes until Adhan`,
              false
           );
         }
      }
    });
  }, [prayerReminderEnabled, prayerSettings, prayerTimes, selectedMuezzin, lastPrayerNotified, setLastPrayerNotified, language, location, calculationMethod, preReminderTime, sendNotification, playAdhan]);

  useEffect(() => {
    checkTimes();
    const interval = setInterval(checkTimes, 15000); 
    
    const fetchInterval = setInterval(() => {
       const now = new Date();
       if (now.getHours() === 0 && now.getMinutes() === 0) {
         fetchPrayerTimes();
       }
    }, 60000);

    return () => {
      clearInterval(interval);
      clearInterval(fetchInterval);
    };
  }, [checkTimes, fetchPrayerTimes]);
}

function getArabicName(prayer: string) {
  switch (prayer) {
    case 'Fajr': return 'الفجر';
    case 'Dhuhr': return 'الظهر';
    case 'Asr': return 'العصر';
    case 'Maghrib': return 'المغرب';
    case 'Isha': return 'العشاء';
    default: return prayer;
  }
}

