import { ArrowRight, ArrowLeft, Star } from 'lucide-react';
import { useStore } from './store';
import { useTranslation } from './i18n';
import { motion, AnimatePresence } from 'motion/react';
import { useState, useEffect } from 'react';

export function TopBar({ title, subTitle, onBack }: { title: string; subTitle?: string; onBack?: () => void }) {
  const defaultGoBack = useStore((s) => s.goBack);
  const screenHistory = useStore((s) => s.screenHistory);
  const language = useStore(s => s.language);
  const xp = useStore(s => s.xp);
  const { t } = useTranslation();
  
  const [animateXp, setAnimateXp] = useState(false);

  useEffect(() => {
    if (xp > 0) {
      setAnimateXp(true);
      const timer = setTimeout(() => setAnimateXp(false), 500);
      return () => clearTimeout(timer);
    }
  }, [xp]);

  return (
    <div className="bg-mid p-3 border-b border-border flex items-center justify-between relative z-10 shadow-sm relative">
      <div className="flex items-center gap-3">
        <button 
          onClick={onBack || defaultGoBack} 
          disabled={!onBack && screenHistory.length === 0}
          className="text-gold p-1 hover:bg-dark/40 rounded-full transition-colors disabled:opacity-30 disabled:cursor-not-allowed rtl:-scale-x-100"
        >
          <ArrowRight size={20} />
        </button>
        <div>
          <div className="text-gold text-sm font-bold">{title}</div>
          {subTitle && <div className="text-light text-[10px]">{subTitle}</div>}
        </div>
      </div>
      
      <motion.div 
         animate={animateXp ? { scale: [1, 1.3, 1], color: ['#D4AF37', '#ffffff', '#D4AF37'] } : {}}
         className="flex items-center gap-1 bg-dark/30 px-2 py-1 rounded-full border border-gold/20 mr-2 rtl:mr-0 rtl:ml-2"
      >
        <span className="text-gold text-xs font-bold">{xp}</span>
        <Star size={12} className="text-gold fill-gold" />
      </motion.div>
    </div>
  );
}
