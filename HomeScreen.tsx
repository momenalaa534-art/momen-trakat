import React, { useState, useEffect } from 'react';
import { useStore } from '../store';
import { Sun, Moon, Compass, Bot, Gamepad2, Trophy, ArrowLeft, Settings, Calendar, BookOpen, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';
import { useTranslation } from '../i18n';

export function HomeScreen() {
  const navigate = useStore((s) => s.navigate);
  const xp = useStore((s) => s.xp);
  const level = useStore((s) => s.level);
  const streak = useStore((s) => s.streak);
  const userName = useStore((s) => s.userName);
  const activityLog = useStore((s) => s.activityLog);
  const setSettingsOpen = useStore((s) => s.setSettingsOpen);
  const language = useStore((s) => s.language);
  const { t } = useTranslation();

  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentDate(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const locale = language === 'ar' ? 'ar-EG' : 'en-US';
  const hijriLocale = language === 'ar' ? 'ar-SA-u-ca-islamic' : 'en-US-u-ca-islamic';

  const gregorianDate = new Intl.DateTimeFormat(locale, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(currentDate);

  const hijriDate = new Intl.DateTimeFormat(hijriLocale, {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(currentDate);

  const todayStr = currentDate.toISOString().split('T')[0];
  const todayXp = activityLog[todayStr]?.xp || 0;
  const xpPercentage = Math.min(Math.max((todayXp / 10000) * 100, 2), 100);

  return (
    <div className="flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
      <header className="bg-mid p-5 border-b border-border relative">
        <button 
          onClick={() => setSettingsOpen(true)}
          className="absolute top-5 left-5 text-gold p-2 bg-dark rounded-full hover:bg-dark/80 transition shadow-sm active:scale-95 z-50 cursor-pointer"
        >
          <Settings size={20} />
        </button>

        <div className="flex justify-between items-start z-10 w-full relative">
          {/* Settings button is absolutely positioned */}
          <div className="w-10"></div>
          
          <div className="flex flex-col items-center justify-center pt-6 pb-2 px-4 flex-1">
            <h1 className="text-gold text-2xl sm:text-3xl mb-4 font-amiri font-bold whitespace-nowrap overflow-hidden text-ellipsis w-full text-center">
              {language === 'ar' ? `السلام عليكم، ${userName}` : `Welcome, ${userName}`}
            </h1>
            <p className="text-light text-sm text-center font-amiri leading-relaxed">
              ( أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ )
            </p>
          </div>

          <div className="flex flex-col gap-1 items-end mt-1 pe-[40px] opacity-0 sm:opacity-100 hidden sm:flex">
             {/* Hid date on small screens to make room for center text, or reposition below */}
          </div>
        </div>

        <div className="flex flex-row gap-2 items-center justify-between mt-4">
          <div className="flex flex-col gap-1 items-start">
            <div className="bg-dark/50 border border-border/50 px-2 py-1 rounded-md flex items-center gap-2">
              <Calendar size={12} className="text-gold mb-[1px]" />
              <span className="text-light text-[9px] whitespace-nowrap">{hijriDate}</span>
            </div>
            <div className="bg-dark/50 border border-border/50 px-2 py-1 rounded-md flex items-center gap-2">
              <Calendar size={12} className="text-gold mb-[1px]" />
              <span className="text-light text-[9px] whitespace-nowrap">{gregorianDate}</span>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="bg-border text-gold text-[10px] px-3 py-1 rounded-full font-medium">🔥 {streak} {t('common.dayStreak')}</span>
            <span className="text-light text-[10px]">{t('common.level')} {level}</span>
          </div>
        </div>
        
        <div className="bg-dark/50 rounded-full h-2 mt-3 overflow-hidden border border-border/30">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${xpPercentage}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="bg-gold h-full rounded-full"
          />
        </div>
        <p className="text-[9px] text-light mt-2 flex justify-between px-1" dir={language === 'ar' ? 'rtl' : 'ltr'}>
          <span>{language === 'ar' ? `المستوى الحالي: ${level}` : `Current Level: ${level}`}</span>
          <span>{todayXp} / 10000 {language === 'ar' ? 'نقطة لليوم' : 'XP Today'}</span>
        </p>
      </header>

      <div className="p-4 flex flex-col gap-6">
        <section>
          <h2 className="text-gold font-bold text-xs mb-3 flex items-center gap-2">
            <span>🤲</span> {t('home.athkarSection')}
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <Card 
              icon={<Sun className="text-gold mb-1" />} 
              title={language === 'ar' ? 'الأذكار' : 'Athkar'} 
              sub={language === 'ar' ? 'حصن المسلم' : 'Fortress of the Muslim'} 
              onClick={() => navigate('athkar_categories')} 
            />
            <Card 
              icon={<Compass className="text-gold mb-1" />} 
              title={t('home.tasbih')} 
              sub={t('home.tasbihSub')} 
              onClick={() => navigate('tasbih')} 
            />
            <Card 
              icon={<Bot className="text-gold mb-1" />} 
              title={t('home.aiDua')} 
              sub={t('home.aiDuaSub')} 
              badge={t('common.new')} 
              onClick={() => navigate('ai')} 
            />
            <Card 
              icon={<BookOpen className="text-gold mb-1" />} 
              title={t('home.learnQuran')} 
              sub={t('home.learnQuranSub')} 
              onClick={() => {
                useStore.getState().setFullQuranTarget('surah');
                navigate('full_quran');
              }} 
            />
            <Card 
              icon={<BookOpen className="text-gold mb-1" />} 
              title={language === 'ar' ? 'الأحاديث' : 'Hadith'} 
              sub={language === 'ar' ? 'اكتشف سنة النبي ﷺ' : 'Discover the Sunnah'} 
              badge={t('common.new')} 
              onClick={() => navigate('hadith_library')} 
            />
            <Card 
              icon={<Sparkles className="text-gold mb-1" />} 
              title={language === 'ar' ? 'تعلم دينك' : 'Learn Religion'} 
              sub={language === 'ar' ? 'قصص الأنبياء والصحابة' : 'Islamic Stories & Lessons'} 
              badge={t('common.new')} 
              onClick={() => navigate('islamic_stories')} 
            />
            <Card 
              icon={<BookOpen className="text-gold mb-1" />} 
              title={language === 'ar' ? 'التدبر اليومي' : 'Daily Tadabbur'} 
              sub={language === 'ar' ? 'تفسير ومعاني ولطائف' : 'Tafsir & Reflections'} 
              badge={t('common.new')} 
              onClick={() => navigate('tadabbur')} 
            />
          </div>
        </section>

        <section>
           <h2 className="text-gold font-bold text-xs mb-3 flex items-center gap-2">
            <span>👦</span> {t('home.kidsMode')}
          </h2>
          <FullCard 
            icon={<Gamepad2 size={28} className="text-gold" />}
            title={t('home.kidsTitle')}
            sub={t('home.kidsSub')}
            onClick={() => navigate('kids')}
          />
        </section>

        <section>
           <h2 className="text-gold font-bold text-xs mb-3 flex items-center gap-2">
            <span>👥</span> {t('home.familyChallenges')}
          </h2>
          <FullCard 
            icon={<Trophy size={28} className="text-gold" />}
            title={t('home.ongoingChallenge')}
            sub={t('home.ongoingChallengeSub')}
            onClick={() => navigate('challenges')}
          />
        </section>
      </div>
    </div>
  );
}

function Card({ icon, title, sub, badge, onClick }: { icon: React.ReactNode, title: string, sub: string, badge?: string, onClick: () => void }) {
  return (
    <motion.div 
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="bg-mid border border-border p-3 rounded-xl cursor-pointer hover:border-gold transition-colors flex flex-col items-center text-center shadow-sm"
    >
      <div className="mb-2 text-2xl">{icon}</div>
      <h3 className="text-text font-bold text-xs">{title}</h3>
      <p className="text-light text-[9px] mt-1">{sub}</p>
      {badge && <span className="text-[8px] bg-gold text-dark px-2 py-0.5 rounded-md mt-2 font-bold">{badge}</span>}
    </motion.div>
  );
}

function FullCard({ icon, title, sub, onClick }: { icon: React.ReactNode, title: string, sub: string, onClick: () => void }) {
  return (
    <motion.div 
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      onClick={onClick}
      className="bg-mid border border-border p-4 rounded-xl cursor-pointer hover:border-gold transition-colors flex flex-row items-center gap-4 shadow-sm"
    >
      <div className="bg-dark/50 p-2 rounded-xl border border-border/50">
        {icon}
      </div>
      <div className="flex-1">
        <h3 className="text-text font-bold text-xs mb-1">{title}</h3>
        <p className="text-light text-[10px]">{sub}</p>
      </div>
      <ArrowLeft size={16} className="text-gold" />
    </motion.div>
  );
}
