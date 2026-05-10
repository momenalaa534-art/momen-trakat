import { useStore } from './store';
import { TopBar } from './TopBar';
import { motion } from 'motion/react';
import { useState } from 'react';
import { useTranslation } from './i18n';
import { playTasbihSound } from './audio';
import { AITasbihModal } from './AITasbihModal';
import { Sparkles } from 'lucide-react';

const DHIKR_LIST = {
  ar: [
    'سُبْحَانَ اللَّه',
    'الحَمْدُ لِلَّه',
    'اللَّهُ أَكْبَر',
    'لا إِلَهَ إِلا اللَّه',
    'أَسْتَغْفِرُ اللَّه',
    'لا حَوْلَ وَلا قُوَّةَ إِلا بِاللَّه',
    'اللَّهُمَّ صَلِّ عَلَى مُحَمَّد',
    'سُبْحَانَ اللَّهِ وَبِحَمْدِهِ',
    'سُبْحَانَ اللَّهِ العَظِيم',
    'حَسْبِيَ اللَّهُ وَنِعْمَ الوَكِيل',
    'سُبْحَانَ اللَّهِ عَدَدَ خَلْقِه',
    'يَا حَيُّ يَا قَيُّوم',
    'أَسْتَغْفِرُك اللَّهُمَّ وَأَتُوبُ إِلَيك',
    'رَبِّ اغْفِرْ لِي',
    'لَا إِلَهَ إِلَّا أَنْتَ سُبْحَانَكَ إِنِّي كُنْتُ مِنَ الظَّالِمِينَ',
  ],
  en: [
    'Subhan Allah',
    'Alhamdulillah',
    'Allahu Akbar',
    'La ilaha illallah',
    'Astagfirullah',
    'La hawla wa la quwwata illa billah',
    'Allahumma Salli Ala Muhammad',
    'Subhan Allahi wa bihamdihi',
    'Subhan Allahil Azim',
    'Hasbiyallahu wa Ni\'mal Wakeel',
    'Subhan Allah by the number of His creation',
    'Ya Hayyu Ya Qayyum',
    'Astaghfiruka Allahumma wa atubu ilayk',
    'My Lord, forgive me',
    'La ilaha illa anta, subhanaka, inni kuntu minaz-zalimin',
  ]
};

export function TasbihScreen() {
  const count = useStore(s => s.tasbihCount);
  const max = useStore(s => s.tasbihMax);
  const currentDhikrIndex = useStore(s => s.currentDhikrIndex);
  const setCount = useStore(s => s.setTasbihCount);
  const setMax = useStore(s => s.setTasbihMax);
  const setDhikr = useStore(s => s.setCurrentDhikrIndex);
  const logActivity = useStore(s => s.logActivity);
  const { t, language } = useTranslation();

  const currentDhikrList = DHIKR_LIST[language as keyof typeof DHIKR_LIST];

  const [message, setMessage] = useState('');
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [customDhikrs, setCustomDhikrs] = useState<string[]>([]);
  
  const [isEditingMax, setIsEditingMax] = useState(false);
  const [newMaxInput, setNewMaxInput] = useState('');

  // We append custom dhikrs to the selected list based on language
  const combinedDhikrList = [...currentDhikrList, ...customDhikrs];

  const radius = 94;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (count / max) * circumference;

  const tasbihSoundEnabled = useStore(s => s.tasbihSoundEnabled);

  const handleSelectAiDhikr = (dhikr: string) => {
    if (!customDhikrs.includes(dhikr)) {
      setCustomDhikrs([...customDhikrs, dhikr]);
    }
    // Set index to the new dhikr (which is at the end of the combined list)
    setDhikr(currentDhikrList.length + customDhikrs.length);
    handleReset();
  };

  const handleTap = () => {
    if (count >= max) {
      setCount(0);
      setMessage('');
      if (tasbihSoundEnabled) playTasbihSound();
      return;
    }
    const newCount = count + 1;
    setCount(newCount);
    logActivity('tasbih', 1, 1); // 1 tasbih count, 1 XP
    
    if (tasbihSoundEnabled) playTasbihSound();

    if ("vibrate" in navigator) {
      navigator.vibrate(50);
    }

    if (newCount >= max) {
      setMessage(t('tasbih.congrats', { max }));
    } else {
      setMessage('');
    }
  };

  const handleReset = () => {
    setCount(0);
    setMessage('');
  };

  const handleChangeMax = () => {
    setNewMaxInput(max.toString());
    setIsEditingMax(true);
  };

  const handleSaveMax = () => {
    const newVal = parseInt(newMaxInput, 10);
    if (!isNaN(newVal) && newVal > 0) {
      setMax(newVal);
      handleReset();
    }
    setIsEditingMax(false);
  };

  return (
    <div className="flex flex-col flex-1 h-full bg-dark overflow-hidden">
      <TopBar title={"📿 " + t('tasbih.title')} />
      <div className="flex flex-col flex-1 items-center p-4 sm:p-6 gap-4 sm:gap-6 overflow-y-auto pb-10">
        
        <div className="flex overflow-x-auto w-full max-w-2xl gap-2 pb-2 px-2 scrollbar-hide snap-x shrink-0">
          {combinedDhikrList.map((d, i) => (
            <button 
              key={i}
              onClick={() => {
                setDhikr(i);
                handleReset();
              }}
              className={`whitespace-nowrap snap-center px-4 py-1.5 rounded-full text-[11px] font-bold transition-colors shrink-0 ${
                currentDhikrIndex === i 
                  ? 'bg-border text-gold border border-gold' 
                  : 'bg-mid text-light border border-border hover:border-gold/50'
              }`}
            >
              {d.length > 25 ? d.substring(0, 25) + '...' : d}
            </button>
          ))}
          <button 
            onClick={() => setIsAiModalOpen(true)}
            className="whitespace-nowrap shrink-0 snap-center px-4 py-1.5 rounded-full text-[11px] font-bold transition-colors bg-gold/10 text-gold border border-gold/30 hover:bg-gold hover:text-dark flex items-center gap-1"
          >
            <Sparkles size={12} /> {language === 'ar' ? 'اقتراح ذكاء اصطناعي' : 'AI Suggestion'}
          </button>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center w-full min-h-[340px]">
          <h2 className="text-gold font-bold text-center text-xl sm:text-2xl h-14 mt-4 leading-relaxed px-4">
            {combinedDhikrList[currentDhikrIndex] || combinedDhikrList[0]}
          </h2>

          <motion.div 
            whileTap={{ scale: 0.95 }}
            onClick={handleTap}
            className="relative w-56 h-56 cursor-pointer select-none touch-manipulation group my-2"
          >
            {/* Background circles for 3D effect */}
            <div className="absolute inset-2 rounded-full bg-gradient-to-b from-mid to-dark shadow-[inset_0_-10px_20px_rgba(0,0,0,0.3),_0_10px_20px_rgba(0,0,0,0.5)] border border-border/20 transition-all duration-300 group-active:shadow-[inset_0_10px_20px_rgba(0,0,0,0.4),_0_2px_5px_rgba(0,0,0,0.5)] bg-border/10" />
            
            {/* Ripple Effect Ring */}
            <div className="absolute inset-0 rounded-full border border-gold/0 group-active:border-gold/30 group-active:scale-105 transition-all duration-500 opacity-0 group-active:opacity-100" />

            {/* SVG Progress Ring */}
            <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none">
               <circle cx="112" cy="112" r={radius} fill="none" stroke="#1d2d24" strokeWidth="8"/>
               <circle cx="112" cy="112" r={radius} fill="none" className="stroke-gold drop-shadow-[0_0_8px_rgba(201,162,39,0.5)]" strokeWidth="8"
                strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} 
                strokeLinecap="round" style={{ transition: 'stroke-dashoffset 0.2s ease-out' }} />
            </svg>

            {/* Inner Content */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-gold text-7xl font-black drop-shadow-md select-none">{count}</span>
                <span className="text-light text-[11px] mt-2 opacity-80 select-none font-medium">{t('tasbih.from')} {max}</span>
            </div>
          </motion.div>

          <div className="text-[10px] text-light mt-2">{t('tasbih.tapHint')}</div>
        </div>

        <div className="flex items-center gap-4 mt-6">
          <button 
            onClick={handleReset} 
            className="bg-mid border border-border text-light text-[11px] py-2 px-6 rounded-xl hover:bg-border/50 transition-colors"
          >
            {t('tasbih.reset')}
          </button>
          {!isEditingMax ? (
            <button 
              onClick={handleChangeMax} 
              className="text-gold bg-mid border border-border text-[11px] py-2 px-6 rounded-xl hover:bg-border/50 transition-colors"
            >
              {t('tasbih.changeMax')}
            </button>
          ) : (
            <div className="flex items-center gap-2">
               <input
                 type="number"
                 className="bg-mid border border-gold text-light text-[11px] py-2 px-2 rounded-xl outline-none w-16 text-center"
                 value={newMaxInput}
                 onChange={(e) => setNewMaxInput(e.target.value)}
                 autoFocus
               />
               <button 
                 onClick={handleSaveMax}
                 className="text-dark bg-gold text-[11px] py-2 px-4 rounded-xl font-bold"
               >
                 حفظ
               </button>
               <button 
                 onClick={() => setIsEditingMax(false)}
                 className="text-light text-[11px] py-2 px-2"
               >
                 الغاء
               </button>
            </div>
          )}
        </div>

        <div className="h-6 mt-2">
          {message && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }} 
              animate={{ opacity: 1, y: 0 }}
              className="text-green text-xs font-bold"
            >
              {message}
            </motion.div>
          )}
        </div>

      </div>

      <AITasbihModal 
        isOpen={isAiModalOpen} 
        onClose={() => setIsAiModalOpen(false)}
        onSelectDhikr={handleSelectAiDhikr}
      />
    </div>
  );
}
