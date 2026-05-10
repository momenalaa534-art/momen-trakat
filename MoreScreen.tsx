import React from 'react';
import { motion } from 'motion/react';
import { CalendarDays, Compass, Map, Plane, BookOpen, Smile, Mic, ChevronLeft } from 'lucide-react';
import { useStore } from '../store';

const TOOLS = [
  { id: 'on_this_day', name: { ar: 'حدث في مثل هذا اليوم', en: 'On This Day' }, icon: CalendarDays, color: 'text-blue-400', bg: 'bg-blue-400/10' },
  { id: 'qibla', name: { ar: 'القبلة', en: 'Qibla Compass' }, icon: Compass, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
  { id: 'calendar', name: { ar: 'التقويم الإسلامي', en: 'Islamic Calendar' }, icon: Map, color: 'text-amber-400', bg: 'bg-amber-400/10' },
  { id: 'flight_prayer', name: { ar: 'الصلاة أثناء الطيران', en: 'In-Flight Prayers' }, icon: Plane, color: 'text-indigo-400', bg: 'bg-indigo-400/10' },
  { id: 'khatmah', name: { ar: 'الختمة', en: 'Khatmah Planner' }, icon: BookOpen, color: 'text-rose-400', bg: 'bg-rose-400/10' },
  { id: 'happiness_wheel', name: { ar: 'عجلة السعادة', en: 'Wheel of Happiness' }, icon: Smile, color: 'text-yellow-400', bg: 'bg-yellow-400/10' },
  { id: 'memorization', name: { ar: 'ركن التحفيظ', en: 'Memorization Corner' }, icon: Mic, color: 'text-purple-400', bg: 'bg-purple-400/10' },
];

export function MoreScreen() {
  const language = useStore(s => s.language);
  const navigate = useStore(s => s.navigate);

  return (
    <div className="flex flex-col flex-1 h-full bg-dark pb-20 overflow-y-auto">
      <div className="pt-12 pb-6 px-6 bg-mid border-b border-border shadow-sm sticky top-0 z-10">
        <h1 className="text-2xl font-bold text-text mb-1">
          {language === 'ar' ? 'المزيد من الأدوات' : 'More Tools'}
        </h1>
        <p className="text-light text-sm">
          {language === 'ar' ? 'اكتشف المزيد من الخدمات الإسلامية المتكاملة' : 'Discover more integrated Islamic services'}
        </p>
      </div>

      <div className="p-4 grid gap-3 grid-cols-2">
        {TOOLS.map((tool, index) => {
          const Icon = tool.icon;
          return (
            <motion.div
              key={tool.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => navigate(tool.id as any)}
              className="bg-mid border border-border rounded-2xl p-4 flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-gold transition-all group"
            >
              <div className={`w-14 h-14 rounded-full flex items-center justify-center ${tool.bg}`}>
                <Icon size={28} className={tool.color} />
              </div>
              <span className="text-text font-bold text-sm text-center group-hover:text-gold transition-colors">
                {tool.name[language as 'ar' | 'en']}
              </span>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
