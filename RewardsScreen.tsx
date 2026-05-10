import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useStore } from './store';
import { TopBar } from './TopBar';
import { useTranslation } from './i18n';
import { Flame, Medal, BookOpen, Clock, Heart, Award, Sparkles, TrendingUp } from 'lucide-react';

type ReportPeriod = 'daily' | 'weekly' | 'monthly';

export function RewardsScreen() {
  const { stars, xp, level, streak, activityLog } = useStore();
  const { t, language } = useTranslation();
  
  const [period, setPeriod] = useState<ReportPeriod>('daily');

  const stats = useMemo(() => {
    const now = new Date();
    // Normalize to start of day
    now.setHours(0, 0, 0, 0);

    const periodDays = period === 'daily' ? 1 : period === 'weekly' ? 7 : 30;
    
    let totalXp = 0;
    let totalQuran = 0;
    let totalTasbih = 0;
    let totalAthkar = 0;
    let totalDua = 0;

    // Last N days for chart
    const chartData = [];
    
    for (let i = periodDays - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateString = d.toISOString().split('T')[0];
      const log = activityLog[dateString] || { xp: 0, quran: 0, tasbih: 0, athkar: 0, dua: 0 };
      
      totalXp += log.xp;
      totalQuran += log.quran;
      totalTasbih += log.tasbih;
      totalAthkar += log.athkar;
      totalDua += log.dua;

      // Label for chart (e.g. Day name or date)
      const dayName = d.toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US', { weekday: 'short' });
      const dayNum = d.getDate();
      const label = period === 'weekly' ? dayName : period === 'monthly' ? dayNum.toString() : language === 'ar' ? 'اليوم' : 'Today';
      
      chartData.push({ label, xp: log.xp });
    }

    return { totalXp, totalQuran, totalTasbih, totalAthkar, totalDua, chartData };
  }, [activityLog, period, language]);

  const BADGES = [
    { emoji: '🌟', label: language === 'ar' ? 'المبتدئ' : 'Beginner', earned: xp >= 50 },
    { emoji: '🔥', label: language === 'ar' ? 'أسبوع' : '1 Week', earned: streak >= 7 },
    { emoji: '📿', label: language === 'ar' ? '١٠٠ تسبيحة' : '100 Tasbih', earned: Object.values(activityLog).reduce((acc, l) => acc + l.tasbih, 0) >= 100 },
    { emoji: '📖', label: language === 'ar' ? 'قارئ' : 'Reader', earned: Object.values(activityLog).reduce((acc, l) => acc + l.quran, 0) >= 50 },
    { emoji: '💎', label: language === 'ar' ? 'نجم ساطع' : 'Super Star', earned: stars >= 100 },
    { emoji: '👑', label: language === 'ar' ? 'الماسة' : 'Diamond', earned: xp >= 1000 },
  ];

  const periodLabels = {
    daily: language === 'ar' ? 'يومي' : 'Daily',
    weekly: language === 'ar' ? 'أسبوعي' : 'Weekly',
    monthly: language === 'ar' ? 'شهري' : 'Monthly'
  };

  const maxChartXp = Math.max(...stats.chartData.map(d => d.xp), 10);

  return (
    <div className="flex flex-col flex-1 h-full bg-dark">
      <TopBar title={language === 'ar' ? '⭐ إحصائياتي وجوائزي' : '⭐ Rewards & Stats'} />
      
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-5">
        
        {/* Top Summary */}
        <div className="flex gap-3">
          <div className="flex-1 bg-mid border border-gold rounded-2xl p-4 text-center shadow-sm relative overflow-hidden">
            <div className="absolute -top-4 -right-4 text-gold/10"><Sparkles size={60} /></div>
            <div className="text-gold text-3xl font-bold mb-1 relative z-10">{xp}</div>
            <div className="text-light text-[10px] relative z-10">{language === 'ar' ? 'إجمالي النقاط (XP)' : 'Total XP'}</div>
          </div>
          <div className="flex-1 bg-mid border border-border rounded-2xl p-4 text-center relative overflow-hidden">
            <div className="absolute -top-4 -left-4 text-orange-500/10"><Flame size={60} /></div>
            <div className="text-gold text-3xl font-bold mb-1 relative z-10">{streak}</div>
            <div className="text-light text-[10px] relative z-10">{language === 'ar' ? 'يوم متتالي' : 'Day Streak'}</div>
          </div>
        </div>

        {/* Level / Stars Banner */}
        <section className="bg-gradient-to-r from-mid to-dark border border-gold/40 rounded-2xl p-4 flex items-center justify-between px-5 shadow-[0_0_15px_rgba(201,162,39,0.15)]">
          <div className="flex flex-col items-center gap-1">
            <div className="text-light text-xs">{language === 'ar' ? 'النجوم' : 'Stars'}</div>
            <div className="text-gold text-xl font-bold flex items-center gap-1"><Award size={18} /> {stars}</div>
          </div>
          <div className="h-10 w-px bg-border"></div>
          <div className="flex flex-col items-center gap-1">
            <div className="text-light text-xs">{language === 'ar' ? 'المستوى' : 'Level'}</div>
            <div className="bg-gold text-dark px-4 py-1 rounded-full text-xs font-bold">{level}</div>
          </div>
        </section>

        {/* Dynamic Period Selector */}
        <section className="mt-2">
          <div className="flex bg-mid border border-border p-1 rounded-xl">
            {(['daily', 'weekly', 'monthly'] as ReportPeriod[]).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors ${
                  period === p ? 'bg-gold text-dark' : 'text-light hover:text-gold'
                }`}
              >
                {periodLabels[p]}
              </button>
            ))}
          </div>
        </section>

        {/* Activity Breakdown */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-mid border border-border/50 rounded-xl p-3 flex items-center gap-3">
            <div className="bg-dark p-2 rounded-lg text-emerald-400"><BookOpen size={20} /></div>
            <div className="flex flex-col">
              <span className="text-text font-bold text-lg leading-none">{stats.totalQuran}</span>
              <span className="text-light text-[9px] mt-1">{language === 'ar' ? 'آية قرئت' : 'Ayahs Read'}</span>
            </div>
          </div>
          <div className="bg-mid border border-border/50 rounded-xl p-3 flex items-center gap-3">
            <div className="bg-dark p-2 rounded-lg text-blue-400"><Clock size={20} /></div>
            <div className="flex flex-col">
              <span className="text-text font-bold text-lg leading-none">{stats.totalAthkar}</span>
              <span className="text-light text-[9px] mt-1">{language === 'ar' ? 'أذكار' : 'Athkar'}</span>
            </div>
          </div>
          <div className="bg-mid border border-border/50 rounded-xl p-3 flex items-center gap-3">
            <div className="bg-dark p-2 rounded-lg text-purple-400"><TrendingUp size={20} /></div>
            <div className="flex flex-col">
              <span className="text-text font-bold text-lg leading-none">{stats.totalTasbih}</span>
              <span className="text-light text-[9px] mt-1">{language === 'ar' ? 'تسبيحة' : 'Tasbihs'}</span>
            </div>
          </div>
          <div className="bg-mid border border-border/50 rounded-xl p-3 flex items-center gap-3">
            <div className="bg-dark p-2 rounded-lg text-rose-400"><Heart size={20} /></div>
            <div className="flex flex-col">
              <span className="text-text font-bold text-lg leading-none">{stats.totalDua}</span>
              <span className="text-light text-[9px] mt-1">{language === 'ar' ? 'أدعية قرئت' : 'Duas Read'}</span>
            </div>
          </div>
        </div>

        {/* Chart */}
        {(period === 'weekly' || period === 'monthly') && (
          <section className="bg-mid border border-border rounded-xl p-4 mt-2 mb-2">
            <div className="text-gold text-[11px] font-bold mb-4">{language === 'ar' ? 'تحصيل النقاط (XP)' : 'XP Progression'}</div>
            <div className="h-32 flex items-end justify-between px-1 gap-1">
              {stats.chartData.map((d, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                  <div className="w-full relative flex flex-col justify-end items-center h-[90%]">
                     <motion.div 
                        initial={{ height: 0 }}
                        animate={{ height: `${(d.xp / maxChartXp) * 100}%` }}
                        transition={{ duration: 0.5, delay: i * (period === 'weekly' ? 0.05 : 0.01) }}
                        className="w-full rounded-t-md bg-gold/80 hover:bg-gold transition-colors"
                      />
                      {/* Tooltip */}
                      {d.xp > 0 && <span className="absolute -top-5 text-[8px] text-light opacity-0 group-hover:opacity-100 transition-opacity bg-dark px-1 rounded border border-border">{d.xp}</span>}
                  </div>
                  <div className="text-light/50 text-[7px]" dir="ltr">
                    {d.label}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Badges Hub */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <Medal size={16} className="text-gold" />
            <div className="text-gold text-[11px] font-bold">{language === 'ar' ? 'الشارات والأوسمة' : 'Badges & Achievements'}</div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {BADGES.map((b, i) => (
              <div key={i} className={`flex flex-col items-center justify-center gap-2 p-3 rounded-2xl border ${
                b.earned 
                  ? 'bg-gradient-to-b from-mid to-dark border-gold/50 shadow-[0_0_10px_rgba(201,162,39,0.1)] text-gold' 
                  : 'bg-dark border-border/30 opacity-50 text-light grayscale'
              }`}>
                <div className="text-3xl filter drop-shadow-md">{b.emoji}</div>
                <div className={`text-[9px] font-bold text-center leading-tight ${b.earned ? 'text-gold' : 'text-light'}`}>{b.label}</div>
              </div>
            ))}
          </div>
        </section>

      </div>
    </div>
  );
}
