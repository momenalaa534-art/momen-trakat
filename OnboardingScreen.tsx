import React, { useState } from 'react';
import { motion } from 'motion/react';
import { useStore } from '../store';
import { useTranslation } from '../i18n';
import { Sparkles, Moon } from 'lucide-react';

export function OnboardingScreen() {
  const [name, setName] = useState('');
  const setUserName = useStore(s => s.setUserName);
  const { language } = useTranslation();

  const handleStart = () => {
    if (name.trim()) {
      setUserName(name.trim());
    }
  };

  return (
    <div className="flex flex-col flex-1 h-full bg-dark items-center justify-center p-6 text-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="max-w-xs w-full flex flex-col items-center"
      >
        <div className="w-24 h-24 bg-mid rounded-full flex items-center justify-center shadow-lg border border-gold/30 mb-8 relative">
          <Moon size={48} className="text-gold relative z-10" />
          <Sparkles size={20} className="text-gold/50 absolute top-2 right-2 animate-pulse" />
        </div>
        
        <h1 className="text-3xl font-bold text-gold mb-2">
          {language === 'ar' ? 'أهلاً بك' : 'Welcome'}
        </h1>
        <p className="text-light text-sm mb-10">
          {language === 'ar' ? 'رفيقك اليومي للذكر والدعاء وكل ما يحتاجه المسلم.' : 'Your daily companion for Dhikr, Dua, and everything a Muslim needs.'}
        </p>

        <div className="w-full text-start mb-2 text-xs font-bold text-light">
          {language === 'ar' ? 'ما اسمك؟' : 'What is your name?'}
        </div>
        <input 
          type="text" 
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={language === 'ar' ? 'أدخل اسمك هنا...' : 'Enter your name...'}
          className="w-full bg-mid border border-border rounded-xl px-4 py-3 text-text outline-none focus:border-gold mb-6"
          dir="auto"
        />

        <button 
          onClick={handleStart}
          disabled={!name.trim()}
          className="w-full bg-gold text-dark font-bold py-3 px-6 rounded-xl shadow-lg hover:shadow-gold/20 transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center gap-2"
        >
          {language === 'ar' ? 'ابدأ رحلتك الروحانية' : 'Start Your Spiritual Journey'}
          <Sparkles size={18} />
        </button>
      </motion.div>
    </div>
  );
}
