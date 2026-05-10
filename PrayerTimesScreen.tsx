import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bell, BellOff, Music, Moon, Volume2, User, ChevronLeft, MapPin, Calculator, Clock } from 'lucide-react';
import { useStore } from './store';
import { TopBar } from './TopBar';
import { useTranslation } from './i18n';

export function PrayerTimesScreen() {
  const { t, language } = useTranslation();
  const { 
    prayerSettings, 
    setPrayerSettings, 
    selectedMuezzin, 
    setSelectedMuezzin,
    prayerReminderEnabled, 
    setPrayerReminderEnabled,
    calculationMethod,
    setCalculationMethod,
    preReminderTime,
    setPreReminderTime,
    progressiveVolume,
    setProgressiveVolume,
    nightModeAudio,
    setNightModeAudio,
    goBack 
  } = useStore();

  const [expandedPrayer, setExpandedPrayer] = useState<string | null>(null);

  const PRAYERS = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];
  const MUEZZINS = [
    { id: 'makkah', label: { ar: 'مكة المكرمة', en: 'Makkah' } },
    { id: 'madinah', label: { ar: 'المدينة المنورة', en: 'Madinah' } },
    { id: 'alafasy', label: { ar: 'مشاري العفاسي', en: 'Mishary Alafasy' } },
    { id: 'abdulbasit', label: { ar: 'عبد الباسط عبد الصمد', en: 'Abdul Basit' } },
    { id: 'short', label: { ar: 'تنبيه قصير', en: 'Short Alert' } },
  ];
  const METHODS = [
    { id: 'Egyptian', label: { ar: 'الهيئة العامة المصرية', en: 'Egyptian General Authority' } },
    { id: 'UmmAlQura', label: { ar: 'أم القرى (مكة)', en: 'Umm Al-Qura (Makkah)' } },
    { id: 'MuslimWorldLeague', label: { ar: 'رابطة العالم الإسلامي', en: 'Muslim World League' } },
    { id: 'MoonsightingCommittee', label: { ar: 'لجنة رؤية الهلال', en: 'Moonsighting Committee' } },
  ];

  const getPrayerName = (p: string) => {
    const ar: Record<string, string> = { Fajr: 'الفجر', Dhuhr: 'الظهر', Asr: 'العصر', Maghrib: 'المغرب', Isha: 'العشاء' };
    return language === 'ar' ? ar[p] : p;
  };

  return (
    <div className="flex flex-col flex-1 h-full overflow-hidden bg-dark">
      <TopBar title={language === 'ar' ? 'إعدادات الصلاة' : 'Prayer Settings'} subTitle="" />
      
      <div className="flex-1 overflow-y-auto p-5 pb-24">
        {/* Main Toggle */}
        <div className="bg-mid border border-border rounded-xl p-4 mb-6 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${prayerReminderEnabled ? 'bg-gold/20 text-gold' : 'bg-dark text-light'}`}>
              <Bell size={24} />
            </div>
            <div>
              <h3 className="text-text font-bold text-sm">{language === 'ar' ? 'تفعيل تنبيهات الصلاة' : 'Enable Prayer Alerts'}</h3>
              <p className="text-light text-xs mt-0.5">{language === 'ar' ? 'تشغيل الأذان في وقت الصلاة' : 'Play Adhan at prayer times'}</p>
            </div>
          </div>
          <button 
            onClick={() => setPrayerReminderEnabled(!prayerReminderEnabled)}
            className={`w-12 h-6 rounded-full transition-colors relative ${prayerReminderEnabled ? 'bg-gold' : 'bg-dark border border-border'}`}
          >
            <motion.div 
              animate={{ x: prayerReminderEnabled ? (language === 'ar' ? -24 : 24) : 0 }}
              className="w-5 h-5 bg-white rounded-full absolute top-0.5 rtl:right-0.5 ltr:left-0.5 shadow-md"
            />
          </button>
        </div>

        {prayerReminderEnabled && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            
            {/* Advanced Features */}
            <div className="space-y-3">
               <h4 className="text-light text-xs font-bold px-2">{language === 'ar' ? 'الميزات الذكية' : 'Smart Features'}</h4>
               
               <div className="bg-mid border border-border rounded-xl shadow-sm divide-y divide-border">
                  <div className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Volume2 className="text-gold" size={20} />
                        <div>
                          <p className="text-text font-bold text-sm">{language === 'ar' ? 'ارتفاع الصوت تدريجياً' : 'Progressive Volume'}</p>
                          <p className="text-light text-[10px] sm:text-xs">{language === 'ar' ? 'يبدأ بصوت منخفض ثم يرتفع لعدم الإزعاج' : 'Starts low and gradually increases'}</p>
                        </div>
                    </div>
                    <button onClick={() => setProgressiveVolume(!progressiveVolume)} className={`w-10 h-5 rounded-full relative ${progressiveVolume ? 'bg-gold' : 'bg-dark border border-border'}`}>
                        <motion.div animate={{ x: progressiveVolume ? (language === 'ar' ? -20 : 20) : 0 }} className="w-4 h-4 bg-white rounded-full absolute top-0.5 rtl:right-0.5 ltr:left-0.5" />
                    </button>
                  </div>

                  <div className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Moon className="text-gold" size={20} />
                        <div>
                          <p className="text-text font-bold text-sm">{language === 'ar' ? 'الوضع الليلي للأذان' : 'Night Mode Audio'}</p>
                          <p className="text-light text-[10px] sm:text-xs">{language === 'ar' ? 'خفض صوت أذان الفجر والعشاء' : 'Lower volume for Fajr & Isha'}</p>
                        </div>
                    </div>
                    <button onClick={() => setNightModeAudio(!nightModeAudio)} className={`w-10 h-5 rounded-full relative ${nightModeAudio ? 'bg-gold' : 'bg-dark border border-border'}`}>
                        <motion.div animate={{ x: nightModeAudio ? (language === 'ar' ? -20 : 20) : 0 }} className="w-4 h-4 bg-white rounded-full absolute top-0.5 rtl:right-0.5 ltr:left-0.5" />
                    </button>
                  </div>
               </div>
            </div>

            {/* Timings Configuration */}
            <div className="space-y-3">
                <h4 className="text-light text-xs font-bold px-2">{language === 'ar' ? 'إعدادات المواقيت' : 'Time Settings'}</h4>
                <div className="bg-mid border border-border rounded-xl shadow-sm divide-y divide-border">
                    <div className="p-4">
                        <div className="flex items-center gap-3 mb-3">
                            <Calculator className="text-gold" size={20} />
                            <p className="text-text font-bold text-sm">{language === 'ar' ? 'طريقة الحساب' : 'Calculation Method'}</p>
                        </div>
                        <select 
                            value={calculationMethod}
                            onChange={(e) => setCalculationMethod(e.target.value)}
                            className="w-full bg-dark text-text border border-border rounded-lg p-2 text-sm outline-none focus:border-gold"
                            dir={language === 'ar' ? 'rtl' : 'ltr'}
                        >
                            {METHODS.map(m => (
                                <option key={m.id} value={m.id}>{m.label[language as keyof typeof m.label]}</option>
                            ))}
                        </select>
                    </div>
                    
                    <div className="p-4">
                        <div className="flex items-center gap-3 mb-3">
                            <Clock className="text-gold" size={20} />
                            <p className="text-text font-bold text-sm">{language === 'ar' ? 'تذكير قبل الصلاة' : 'Pre-prayer Reminder'}</p>
                        </div>
                        <select 
                            value={preReminderTime.toString()}
                            onChange={(e) => setPreReminderTime(Number(e.target.value))}
                            className="w-full bg-dark text-text border border-border rounded-lg p-2 text-sm outline-none focus:border-gold mb-4"
                            dir={language === 'ar' ? 'rtl' : 'ltr'}
                        >
                            <option value="0">{language === 'ar' ? 'بدون' : 'None'}</option>
                            <option value="5">{language === 'ar' ? '5 دقائق' : '5 mins'}</option>
                            <option value="10">{language === 'ar' ? '10 دقائق' : '10 mins'}</option>
                            <option value="15">{language === 'ar' ? '15 دقيقة' : '15 mins'}</option>
                            <option value="30">{language === 'ar' ? '30 دقيقة' : '30 mins'}</option>
                        </select>

                        <div className="flex items-center gap-3 mb-3">
                            <Moon className="text-gold" size={20} />
                            <p className="text-text font-bold text-sm">{language === 'ar' ? 'التوقيت الصيفي' : 'Daylight Saving Time'}</p>
                        </div>
                        <select 
                            value={useStore.getState().dstAdjustment.toString()}
                            onChange={(e) => useStore.getState().setDstAdjustment(Number(e.target.value))}
                            className="w-full bg-dark text-text border border-border rounded-lg p-2 text-sm outline-none focus:border-gold"
                            dir={language === 'ar' ? 'rtl' : 'ltr'}
                        >
                            <option value="-1">{language === 'ar' ? '-1 ساعة' : '-1 Hour'}</option>
                            <option value="0">{language === 'ar' ? 'إيقاف (تلقائي)' : 'Off (Auto)'}</option>
                            <option value="1">{language === 'ar' ? '+1 ساعة' : '+1 Hour'}</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Per-Prayer Settings */}
            <div className="space-y-3">
              <h4 className="text-light text-xs font-bold px-2">{language === 'ar' ? 'صوت الأذان والتنبيهات المخصصة' : 'Adhan Sound & Custom Alerts'}</h4>
              <div className="bg-mid border border-border rounded-xl shadow-sm divide-y divide-border overflow-hidden">
                {PRAYERS.map((prayer) => {
                  const s = prayerSettings?.[prayer] || { enabled: true, mode: 'both', muezzin: 'makkah' };
                  const isExpanded = expandedPrayer === prayer;
                  return (
                    <div key={prayer} className="flex flex-col">
                      <div 
                        className="p-4 flex items-center justify-between hover:bg-dark/20 cursor-pointer transition-colors"
                        onClick={() => setExpandedPrayer(isExpanded ? null : prayer)}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-text font-bold text-base w-16">{getPrayerName(prayer)}</span>
                          <span className="text-light text-xs bg-dark px-2 rounded-full border border-border">
                            {MUEZZINS.find(m => m.id === s.muezzin)?.label[language as keyof typeof MUEZZINS[0]['label']]}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          {s.enabled ? (
                            <Bell className="text-gold" size={18} />
                          ) : (
                            <BellOff className="text-light/50" size={18} />
                          )}
                        </div>
                      </div>

                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="bg-dark/30 px-4 py-4 border-t border-border overflow-hidden"
                          >
                            <div className="flex items-center justify-between mb-4">
                              <span className="text-sm text-text">{language === 'ar' ? 'تفعيل التنبيه' : 'Enable Alert'}</span>
                              <button onClick={() => setPrayerSettings(prayer, { ...s, enabled: !s.enabled })} className={`w-10 h-5 rounded-full relative ${s.enabled ? 'bg-gold' : 'bg-dark border border-border'}`}>
                                <motion.div animate={{ x: s.enabled ? (language === 'ar' ? -20 : 20) : 0 }} className="w-4 h-4 bg-white rounded-full absolute top-0.5 rtl:right-0.5 ltr:left-0.5" />
                              </button>
                            </div>

                            {s.enabled && (
                              <div className="space-y-4">
                                <div>
                                  <span className="text-xs text-light mb-2 block">{language === 'ar' ? 'نوع التنبيه' : 'Alert Type'}</span>
                                  <div className="flex gap-2">
                                    <button 
                                      onClick={() => setPrayerSettings(prayer, { ...s, mode: 'sound' })}
                                      className={`flex-1 py-1.5 text-xs rounded-md border ${s.mode === 'sound' ? 'border-gold text-gold bg-gold/10' : 'border-border text-light hover:bg-mid'}`}
                                    >
                                      {language === 'ar' ? 'صوت فقط' : 'Sound Only'}
                                    </button>
                                    <button 
                                      onClick={() => setPrayerSettings(prayer, { ...s, mode: 'both' })}
                                      className={`flex-1 py-1.5 text-xs rounded-md border ${s.mode === 'both' ? 'border-gold text-gold bg-gold/10' : 'border-border text-light hover:bg-mid'}`}
                                    >
                                      {language === 'ar' ? 'صوت وإشعار' : 'Sound & Notif'}
                                    </button>
                                    <button 
                                      onClick={() => setPrayerSettings(prayer, { ...s, mode: 'notification' })}
                                      className={`flex-1 py-1.5 text-xs rounded-md border ${s.mode === 'notification' ? 'border-gold text-gold bg-gold/10' : 'border-border text-light hover:bg-mid'}`}
                                    >
                                      {language === 'ar' ? 'إشعار صامت' : 'Silent Notif'}
                                    </button>
                                  </div>
                                </div>

                                {['both', 'sound'].includes(s.mode) && (
                                  <div>
                                    <span className="text-xs text-light mb-2 block">{language === 'ar' ? 'صوت المؤذن' : 'Muezzin Voice'}</span>
                                    <select 
                                      value={s.muezzin}
                                      onChange={(e) => setPrayerSettings(prayer, { ...s, muezzin: e.target.value })}
                                      className="w-full bg-dark text-text border border-border rounded-lg p-2 text-sm outline-none focus:border-gold"
                                      dir={language === 'ar' ? 'rtl' : 'ltr'}
                                    >
                                        {MUEZZINS.map((m) => (
                                          <option key={m.id} value={m.id}>{m.label[language as keyof typeof m.label]}</option>
                                        ))}
                                    </select>
                                  </div>
                                )}
                              </div>
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            </div>
            
          </motion.div>
        )}

        {/* Show Calculated Times to user */}
        {prayerReminderEnabled && useStore.getState().prayerTimes && (
          <div className="mt-6">
            <h4 className="text-light text-xs font-bold px-2 mb-3">{language === 'ar' ? 'مواقيت اليوم' : 'Today\'s Times'}</h4>
            <div className="bg-mid border border-border rounded-xl shadow-sm p-4 flex flex-wrap gap-4 items-center justify-center">
              {Object.entries(useStore.getState().prayerTimes!).map(([name, time]) => (
                <div key={name} className="flex flex-col items-center gap-1 w-1/4 min-w-[60px]">
                   <span className="text-light text-[10px]">{getPrayerName(name)}</span>
                   <span className="text-gold font-bold text-lg font-sans">{time}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Back button */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-[300px]">
        <button 
          onClick={goBack}
          className="w-full bg-dark border border-border text-text font-bold py-3 rounded-xl shadow-lg active:scale-95 transition-all text-sm flex justify-center items-center gap-2"
        >
          <ChevronLeft className="rtl:rotate-180" size={18} />
          {language === 'ar' ? 'رجوع' : 'Back'}
        </button>
      </div>
    </div>
  );
}
