import React from 'react';
import { useStore } from './store';
import { motion } from 'motion/react';
import { Mic, MessageSquare, BookOpen, Trophy, LogOut } from 'lucide-react';
import { useTranslation } from './i18n';

export function KidsHomeScreen() {
  const navigate = useStore(s => s.navigate);
  const stars = useStore(s => s.stars);
  const level = useStore(s => s.level);
  const { t } = useTranslation();
  
  return (
    <div className="flex flex-col flex-1 overflow-y-auto">
      <div className="bg-mid p-5 border-b-2 border-gold relative">
        <div className="absolute top-4 left-4 flex gap-2">
          <div className="bg-gold text-dark text-[9px] font-bold px-2 py-1.5 rounded-md flex items-center">{t('kids.kidsModeBadge')}</div>
          <button 
            onClick={() => navigate('home')}
            className="bg-[#2a0f0f] border border-[#a32d2d] text-[#f09595] text-[9px] font-bold px-3 py-1.5 rounded-md flex items-center gap-1 active:scale-95 transition-transform"
          >
            <LogOut size={10} />
            {t('kids.exitKidsMode')}
          </button>
        </div>
        <p className="text-[#6a9a7a] text-[11px] mt-2">{t('kids.welcome')}</p>
        <h1 className="text-gold text-2xl font-bold mt-1">{t('home.name')}</h1>
        
        <div className="flex items-center gap-3 mt-4">
          <div className="bg-border text-gold text-[10px] font-bold px-3 py-1 rounded-lg">{t('common.level')} {level}</div>
          <div className="text-gold text-xs font-bold flex items-center gap-1">
            <span>⭐</span> {stars} {t('kids.starsCollected')}
          </div>
        </div>
      </div>

      <div className="p-4 flex flex-col gap-4">
        
        <KidCard 
          icon={<Mic className="text-gold" size={24} />}
          title={t('kids.quranTitle')}
          desc={t('kids.quranDesc')}
          progress={45}
          progressLabel={t('kids.quranProgress')}
          onClick={() => navigate('quran')}
        />

        <KidCard 
          icon={<MessageSquare className="text-gold" size={24} />}
          title={t('kids.hadithTitle')}
          desc={t('kids.hadithDesc')}
          progress={30}
          progressLabel={t('kids.hadithProgress')}
          onClick={() => navigate('hadith')}
        />

        <KidCard 
          icon={<Trophy className="text-gold" size={24} />}
          title={t('kids.rewardsTitle')}
          desc={t('kids.rewardsDesc')}
          progress={60}
          progressLabel={t('kids.rewardsProgress')}
          onClick={() => navigate('rewards')}
        />

      </div>
    </div>
  );
}

function KidCard({ icon, title, desc, progress, progressLabel, onClick }: { icon: React.ReactNode, title: string, desc: string, progress: number, progressLabel: string, onClick: () => void }) {
  return (
    <motion.div 
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="bg-mid border border-border p-4 rounded-2xl cursor-pointer hover:border-gold transition-colors flex gap-4"
    >
      <div className="bg-border w-12 h-12 rounded-xl flex items-center justify-center shrink-0">
        {icon}
      </div>
      <div className="flex-1 flex flex-col">
        <h3 className="text-gold font-bold text-sm mb-1">{title}</h3>
        <p className="text-light text-[10px] mb-3 leading-relaxed">{desc}</p>
        
        <div className="w-full bg-border h-1.5 rounded-full overflow-hidden mt-auto">
          <div className="bg-gold h-full rounded-full" style={{ width: `${progress}%` }} />
        </div>
        <p className="text-light text-[8px] mt-1">{progressLabel}</p>
      </div>
    </motion.div>
  );
}
