import React from 'react';
import { useStore, AppTheme, AppLanguage, AppFontSize } from '../store';
import { motion, AnimatePresence } from 'motion/react';
import { Settings, X, Globe, Moon, Sun, Type, Share2, Star, Info, MessageCircle, Heart, Bell, Volume2, Monitor, BookOpen, Clock, LogOut } from 'lucide-react';

export function SettingsDrawer() {
  const { 
    isSettingsOpen, setSettingsOpen,
    theme, setTheme,
    language, setLanguage,
    fontSize, setFontSize,
    notificationsEnabled,
    tasbihSoundEnabled,
    focusModeEnabled,
    dailyWirdReminderEnabled,
    dailyWirdReminderTime,
    prayerReminderEnabled,
    prayerSettings,
    setPrayerSettings,
    selectedMuezzin,
  } = useStore();

  if (!isSettingsOpen) return null;

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'تطبيق أذكاري',
          text: 'رفيقك اليومي للذكر والدعاء، جربه الآن!',
          url: window.location.href,
        });
      } else {
        alert('ميزة المشاركة غير مدعومة على هذا المتصفح.');
      }
    } catch (err) {
      console.log('Error sharing', err);
    }
  };

  const textMap = {
    title: language === 'ar' ? 'الإعدادات' : 'Settings',
    lang: language === 'ar' ? 'اللغة' : 'Language',
    theme: language === 'ar' ? 'المظهر' : 'Theme',
    fontSize: language === 'ar' ? 'حجم الخط' : 'Font Size',
    publish: language === 'ar' ? 'نشر التطبيق' : 'Share App',
    rate: language === 'ar' ? 'تقييم التطبيق' : 'Rate App',
    info: language === 'ar' ? 'معلومات التطبيق' : 'App Info',
    support: language === 'ar' ? 'الدعم الفني (واتساب)' : 'Tech Support (WA)',
    notifications: language === 'ar' ? 'إشعارات الأذكار' : 'Athkar Notifications',
    notificationsOn: language === 'ar' ? 'مفعلة' : 'Enabled',
    notificationsOff: language === 'ar' ? 'معطلة' : 'Disabled',
    tasbihSound: language === 'ar' ? 'صوت السبحة' : 'Tasbih Sound',
    focusMode: language === 'ar' ? 'وضع التركيز (إبقاء الشاشة مفعلة)' : 'Focus Mode (Keep Awake)',
    focusModeHint: language === 'ar' ? 'لإيقاف الإشعارات استخدم ميزة (الرجاء عدم الإزعاج) في هاتفك.' : 'To mute notifications, use your phone\'s Do Not Disturb mode.',
    wirdReminder: language === 'ar' ? 'تذكير الورد اليومي' : 'Daily Quran Reminder',
    wirdReminderTime: language === 'ar' ? 'وقت التذكير' : 'Reminder Time',
    prayerReminder: language === 'ar' ? 'تنبيهات الأذان والصلاة' : 'Adhan & Prayer Alerts',
    muezzin: language === 'ar' ? 'صوت المؤذن' : 'Muezzin Audio',
    muezzins: {
      makkah: language === 'ar' ? 'أذان الحرم المكي' : 'Makkah',
      madinah: language === 'ar' ? 'أذان الحرم المدني' : 'Madinah',
      alafasy: language === 'ar' ? 'مشاري العفاسي' : 'Mishary Alafasy',
      abdulbasit: language === 'ar' ? 'عبدالباسط عبدالصمد' : 'Abdulbasit',
    },
    logout: language === 'ar' ? 'تسجيل الخروج' : 'Log Out'
  };

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 z-50 flex justify-end bg-black/50"
        onClick={() => setSettingsOpen(false)}
      >
        <motion.div 
          initial={{ x: language === 'ar' ? '-100%' : '100%' }}
          animate={{ x: 0 }}
          exit={{ x: language === 'ar' ? '-100%' : '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="w-4/5 max-w-sm h-full bg-dark shadow-2xl flex flex-col border-r border-border"
          onClick={(e) => e.stopPropagation()}
          dir={language === 'ar' ? 'rtl' : 'ltr'}
        >
          <div className="flex items-center justify-between p-5 border-b border-border bg-mid">
            <h2 className="text-gold font-bold flex items-center gap-2">
              <Settings size={20} />
              {textMap.title}
            </h2>
            <button onClick={() => setSettingsOpen(false)} className="text-light hover:text-gold p-1">
              <X size={20} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-6">
            
            {/* Language */}
            <div className="flex flex-col gap-3 pb-4 border-b border-border/50">
              <div className="text-gold text-sm font-bold flex items-center gap-2">
                <Globe size={18} /> {textMap.lang}
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => setLanguage('ar')}
                  className={`flex-1 py-2 rounded-lg text-xs font-bold transition-colors ${language === 'ar' ? 'bg-gold text-dark' : 'bg-mid text-text border border-border border-solid'}`}
                >عربي</button>
                <button 
                  onClick={() => setLanguage('en')}
                  className={`flex-1 py-2 rounded-lg text-xs font-bold transition-colors ${language === 'en' ? 'bg-gold text-dark' : 'bg-mid text-text border border-border border-solid'}`}
                >English</button>
              </div>
            </div>

            {/* Theme */}
            <div className="flex flex-col gap-3 pb-4 border-b border-border/50">
              <div className="text-gold text-sm font-bold flex items-center gap-2">
                {theme === 'dark' ? <Moon size={18} /> : <Sun size={18} />} {textMap.theme}
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => setTheme('dark')}
                  className={`flex-1 py-2 rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1 ${theme === 'dark' ? 'bg-gold text-dark' : 'bg-mid text-text border border-border border-solid'}`}
                ><Moon size={14}/> ليلي</button>
                <button 
                  onClick={() => setTheme('light')}
                  className={`flex-1 py-2 rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1 ${theme === 'light' ? 'bg-gold text-dark' : 'bg-mid text-text border border-border border-solid'}`}
                ><Sun size={14}/> نهاري</button>
              </div>
            </div>

            {/* Font Size */}
            <div className="flex flex-col gap-3 pb-4 border-b border-border/50">
              <div className="text-gold text-sm font-bold flex items-center gap-2">
                <Type size={18} /> {textMap.fontSize}
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => setFontSize('sm')}
                  className={`flex-1 py-2 rounded-lg text-xs font-bold transition-colors ${fontSize === 'sm' ? 'bg-gold text-dark' : 'bg-mid text-text border border-border border-solid'}`}
                >صغير</button>
                <button 
                  onClick={() => setFontSize('md')}
                  className={`flex-1 py-2 rounded-lg text-xs font-bold transition-colors ${fontSize === 'md' ? 'bg-gold text-dark' : 'bg-mid text-text border border-border border-solid'}`}
                >وسط</button>
                <button 
                  onClick={() => setFontSize('lg')}
                  className={`flex-1 py-2 rounded-lg text-xs font-bold transition-colors ${fontSize === 'lg' ? 'bg-gold text-dark' : 'bg-mid text-text border border-border border-solid'}`}
                >كبير</button>
              </div>
            </div>

            {/* Notifications */}
            <div className="flex flex-col gap-3 pb-4 border-b border-border/50">
              <div className="text-gold text-sm font-bold flex items-center gap-2">
                <Bell size={18} /> {textMap.notifications}
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => {
                    if (!notificationsEnabled && 'Notification' in window) {
                      Notification.requestPermission();
                    }
                    useStore.getState().setNotificationsEnabled(true);
                  }}
                  className={`flex-1 py-2 rounded-lg text-xs font-bold transition-colors ${notificationsEnabled ? 'bg-gold text-dark' : 'bg-mid text-text border border-border border-solid'}`}
                >{textMap.notificationsOn}</button>
                <button 
                  onClick={() => useStore.getState().setNotificationsEnabled(false)}
                  className={`flex-1 py-2 rounded-lg text-xs font-bold transition-colors ${!notificationsEnabled ? 'bg-gold text-dark' : 'bg-mid text-text border border-border border-solid'}`}
                >{textMap.notificationsOff}</button>
              </div>
            </div>

            {/* Tasbih Sound */}
            <div className="flex flex-col gap-3 pb-4 border-b border-border/50">
              <div className="text-gold text-sm font-bold flex items-center gap-2">
                <Volume2 size={18} /> {textMap.tasbihSound}
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => useStore.getState().setTasbihSoundEnabled(true)}
                  className={`flex-1 py-2 rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1 ${tasbihSoundEnabled ? 'bg-gold text-dark' : 'bg-mid text-text border border-border border-solid'}`}
                >{textMap.notificationsOn}</button>
                <button 
                  onClick={() => useStore.getState().setTasbihSoundEnabled(false)}
                  className={`flex-1 py-2 rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1 ${!tasbihSoundEnabled ? 'bg-gold text-dark' : 'bg-mid text-text border border-border border-solid'}`}
                >{textMap.notificationsOff}</button>
              </div>
            </div>

            {/* Focus Mode */}
            <div className="flex flex-col gap-3 pb-4 border-b border-border/50">
              <div className="text-gold text-sm font-bold flex items-center gap-2">
                <Monitor size={18} /> {textMap.focusMode}
              </div>
              <p className="text-[10px] text-light leading-relaxed font-bold">
                {textMap.focusModeHint}
              </p>
              <div className="flex gap-2 mt-1">
                <button 
                  onClick={() => useStore.getState().setFocusModeEnabled(true)}
                  className={`flex-1 py-2 rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1 ${focusModeEnabled ? 'bg-gold text-dark' : 'bg-mid text-text border border-border border-solid'}`}
                >{textMap.notificationsOn}</button>
                <button 
                  onClick={() => useStore.getState().setFocusModeEnabled(false)}
                  className={`flex-1 py-2 rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1 ${!focusModeEnabled ? 'bg-gold text-dark' : 'bg-mid text-text border border-border border-solid'}`}
                >{textMap.notificationsOff}</button>
              </div>
            </div>

            {/* Daily Wird Reminder */}
            <div className="flex flex-col gap-3 pb-4 border-b border-border/50">
              <div className="text-gold text-sm font-bold flex items-center gap-2">
                <BookOpen size={18} /> {textMap.wirdReminder}
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => {
                    if (!dailyWirdReminderEnabled && 'Notification' in window) {
                      Notification.requestPermission();
                    }
                    useStore.getState().setDailyWirdReminderEnabled(true);
                  }}
                  className={`flex-1 py-2 rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1 ${dailyWirdReminderEnabled ? 'bg-gold text-dark' : 'bg-mid text-text border border-border border-solid'}`}
                >{textMap.notificationsOn}</button>
                <button 
                  onClick={() => useStore.getState().setDailyWirdReminderEnabled(false)}
                  className={`flex-1 py-2 rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1 ${!dailyWirdReminderEnabled ? 'bg-gold text-dark' : 'bg-mid text-text border border-border border-solid'}`}
                >{textMap.notificationsOff}</button>
              </div>
              
              <AnimatePresence>
                {dailyWirdReminderEnabled && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="flex flex-col gap-2 mt-2 overflow-hidden"
                  >
                    <div className="text-xs text-light">{textMap.wirdReminderTime}</div>
                    <input 
                      type="time" 
                      value={dailyWirdReminderTime}
                      onChange={(e) => useStore.getState().setDailyWirdReminderTime(e.target.value)}
                      className="bg-dark border border-border rounded-lg text-text px-3 py-2 text-sm outline-none focus:border-gold"
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Prayer & Adhan Alerts */}
            <div className="flex flex-col gap-3 pb-4 border-b border-border/50">
              <div className="text-gold text-sm font-bold flex items-center gap-2">
                <Clock size={18} /> {textMap.prayerReminder}
              </div>
              <button 
                onClick={() => {
                  setSettingsOpen(false);
                  useStore.getState().navigate('prayer');
                }}
                className="w-full bg-dark text-text border border-border rounded-lg py-2.5 text-xs font-bold hover:border-gold transition-colors flex items-center justify-center gap-2"
              >
                {language === 'ar' ? 'إعدادات تنبيهات الصلاة' : 'Prayer Alerts Settings'}
              </button>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-3">
              <button onClick={handleShare} className="flex items-center gap-3 p-3 bg-mid border border-border rounded-xl text-text hover:border-gold transition-colors text-sm">
                <Share2 size={18} className="text-gold" /> {textMap.publish}
              </button>

              <button onClick={() => alert('شكراً لك! سيتم تحويلك لمتجر التطبيقات قريباً للتقييم.')} className="flex items-center gap-3 p-3 bg-mid border border-border rounded-xl text-text hover:border-gold transition-colors text-sm">
                <Star size={18} className="text-gold" /> {textMap.rate}
              </button>

              <button onClick={() => alert('تطبيق أذكاري\nالإصدار 1.0.0\nمخصص لمساعدة المسلم في الحفاظ على ورده اليومي.\nتصميم وتطوير: مؤمن علاء مصطفى أحمد')} className="flex items-center gap-3 p-3 bg-mid border border-border rounded-xl text-text hover:border-gold transition-colors text-sm">
                <Info size={18} className="text-gold" /> {textMap.info}
              </button>
              
              <a 
                href="https://wa.me/201210055036" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-3 bg-green/10 border border-border rounded-xl text-text hover:border-green transition-colors text-sm"
              >
                <MessageCircle size={18} className="text-green" /> {textMap.support}
              </a>

              {/* Logout */}
              {React.createElement(() => {
                const [confirming, setConfirming] = React.useState(false);
                return (
                  <button 
                    onClick={() => {
                      if (!confirming) {
                        setConfirming(true);
                        setTimeout(() => setConfirming(false), 3000);
                      } else {
                        useStore.getState().logout();
                        setSettingsOpen(false);
                      }
                    }} 
                    className="flex items-center gap-3 p-3 mt-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-500 hover:bg-red-500/20 transition-colors text-sm font-bold w-full"
                  >
                    <LogOut size={18} /> 
                    {confirming 
                      ? (language === 'ar' ? 'هل أنت متأكد؟ (اضغط للتأكيد)' : 'Are you sure? (Tap to confirm)')
                      : textMap.logout}
                  </button>
                );
              })}
            </div>

          </div>
          
          {/* Footer Duaa Signature */}
          <div className="mt-auto p-4 bg-mid border-t border-border flex flex-col items-center justify-center text-center">
            <Heart size={16} fill="currentColor" className="text-gold mb-2" />
            <div className="text-gold font-bold text-xs mb-1">
              مؤمن علاء مصطفى أحمد
            </div>
            <div className="text-light text-[9px] leading-relaxed italic">
              (نسأل الله العظيم أن يتقبل هذا العمل خالصاً لوجهه الكريم وأن ينفع به كل من استخدمه)
            </div>
          </div>

        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
