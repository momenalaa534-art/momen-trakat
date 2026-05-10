import React from 'react';
import { motion } from 'motion/react';
import { Sun, Moon, Coffee, MoonStar, Utensils, BookHeart, ChevronLeft, Droplets, Plane, Home, ShieldAlert, Waves, Mic, Shirt, Bath, HeartPulse } from 'lucide-react';
import { useStore } from '../store';
import { TopBar } from '../components/TopBar';
import { useTranslation } from '../i18n';

export function AthkarCategoriesScreen() {
  const { t, language } = useTranslation();
  const navigate = useStore((s) => s.navigate);
  const goBack = useStore((s) => s.goBack);

  const categories = [
    { id: 'morning', title: language === 'ar' ? 'أذكار الصباح' : 'Morning Athkar', icon: <Sun className="text-gold" size={24} /> },
    { id: 'evening', title: language === 'ar' ? 'أذكار المساء' : 'Evening Athkar', icon: <Moon className="text-gold" size={24} /> },
    { id: 'after_prayer', title: language === 'ar' ? 'أذكار بعد الصلاة' : 'After Prayer', icon: <BookHeart className="text-gold" size={24} /> },
    { id: 'sleep', title: language === 'ar' ? 'أذكار النوم' : 'Sleep Athkar', icon: <MoonStar className="text-gold" size={24} /> },
    { id: 'waking_up', title: language === 'ar' ? 'أذكار الاستيقاظ' : 'Waking Up', icon: <Coffee className="text-gold" size={24} /> },
    { id: 'prayer', title: language === 'ar' ? 'أذكار الصلاة' : 'Prayer Athkar', icon: <BookHeart className="text-gold" size={24} /> },
    { id: 'adhan', title: language === 'ar' ? 'أذكار الأذان' : 'Adhan Athkar', icon: <Mic className="text-gold" size={24} /> },
    { id: 'mosque', title: language === 'ar' ? 'أذكار المسجد' : 'Mosque Athkar', icon: <BookHeart className="text-gold" size={24} /> },
    { id: 'wudu', title: language === 'ar' ? 'أذكار الوضوء' : 'Wudu Athkar', icon: <Waves className="text-gold" size={24} /> },
    { id: 'travel', title: language === 'ar' ? 'أذكار السفر' : 'Travel Athkar', icon: <Plane className="text-gold" size={24} /> },
    { id: 'home', title: language === 'ar' ? 'أذكار المنزل' : 'Home Athkar', icon: <Home className="text-gold" size={24} /> },
    { id: 'clothes', title: language === 'ar' ? 'أذكار اللباس' : 'Clothing Athkar', icon: <Shirt className="text-gold" size={24} /> },
    { id: 'food', title: language === 'ar' ? 'أذكار الطعام' : 'Food Athkar', icon: <Utensils className="text-gold" size={24} /> },
    { id: 'toilet', title: language === 'ar' ? 'أذكار الخلاء' : 'Toilet Athkar', icon: <Bath className="text-gold" size={24} /> },
    { id: 'fasting', title: language === 'ar' ? 'أذكار الصيام' : 'Fasting Athkar', icon: <Droplets className="text-gold" size={24} /> },
    { id: 'distress', title: language === 'ar' ? 'أذكار الكرب' : 'Distress Athkar', icon: <ShieldAlert className="text-gold" size={24} /> },
    { id: 'ruqyah', title: language === 'ar' ? 'الرقية الشرعية' : 'Ruqyah', icon: <HeartPulse className="text-gold" size={24} /> },
  ];

  return (
    <div className="flex flex-col flex-1 h-full overflow-hidden bg-dark">
      <TopBar title={language === 'ar' ? 'حصن المسلم' : 'Fortress of the Muslim'} subTitle={language === 'ar' ? 'الأذكار' : 'Athkar'} />
      
      <div className="flex-1 overflow-y-auto p-4 pb-24 space-y-4">
        {categories.map((cat, idx) => (
          <motion.button
            key={cat.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            onClick={() => navigate(`athkar_${cat.id}` as any)}
            className="w-full bg-mid border border-border p-4 rounded-2xl flex items-center gap-4 hover:border-gold/50 active:scale-95 transition-all shadow-sm"
          >
            <div className="w-12 h-12 rounded-full bg-dark flex items-center justify-center border border-border shadow-inner">
              {cat.icon}
            </div>
            <span className="text-text font-bold text-lg flex-1 text-start" dir={language === 'ar' ? 'rtl' : 'ltr'}>
              {cat.title}
            </span>
            <ChevronLeft className={`text-light rtl:rotate-180`} size={20} />
          </motion.button>
        ))}
      </div>

      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-[300px] z-50">
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
