import { motion } from 'motion/react';
import { useStore } from './store';
import { TopBar } from './TopBar';

const SURAHS = [
  { num: '١', name: 'الفاتحة', ayat: 7, status: 'done' },
  { num: '١١٢', name: 'الإخلاص', ayat: 4, status: 'done' },
  { num: '١١٤', name: 'الناس', ayat: 6, status: 'active' },
  { num: '١١٣', name: 'الفلق', ayat: 5, status: 'lock' },
];

export function QuranScreen() {
  const navigate = useStore(s => s.navigate);
  const setTasmeeSurah = useStore(s => s.setTasmeeSurah);

  const startTasmee = (index: number) => {
    setTasmeeSurah(index);
    navigate('tasmee');
  };

  return (
    <div className="flex flex-col flex-1 h-full bg-dark">
      <TopBar title="📖 سورك المحفوظة" subTitle="اضغط على السورة لتسميعها" />
      
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
        {SURAHS.map((surah, i) => {
          const isDone = surah.status === 'done';
          const isLock = surah.status === 'lock';
          
          return (
            <motion.div
              key={i}
              whileHover={!isLock ? { scale: 1.01 } : {}}
              whileTap={!isLock ? { scale: 0.99 } : {}}
              onClick={() => !isLock && startTasmee(i)}
              className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${
                isDone ? 'bg-mid border-gold' : isLock ? 'bg-mid/50 border-border opacity-50' : 'bg-mid border-border cursor-pointer hover:border-gold'
              } ${!isLock ? 'cursor-pointer' : ''}`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 ${
                isDone ? 'bg-gold text-dark' : 'bg-border text-gold'
              }`}>
                {surah.num}
              </div>
              
              <div className="flex-1">
                <div className="text-text font-bold text-sm mb-1">{surah.name}</div>
                <div className="text-light text-[9px]">
                  {surah.ayat} آيات — {isDone ? 'محفوظة ✓' : 'لسه باقية'}
                </div>
              </div>

              {isDone ? (
                <div className="flex gap-0.5 text-[10px]">
                  <span>⭐</span><span>⭐</span><span>⭐</span>
                </div>
              ) : (
                <div className="flex gap-0.5 text-[10px] text-border">
                  <span>☆</span><span>☆</span><span>☆</span>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
