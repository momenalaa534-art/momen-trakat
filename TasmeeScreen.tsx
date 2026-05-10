import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useStore } from './store';
import { TopBar } from './TopBar';
import { Mic } from 'lucide-react';

const SURAH_DATA = [
  { name: 'الفاتحة', verses: ['بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ', 'الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ', 'الرَّحْمَٰنِ الرَّحِيمِ', 'مَالِكِ يَوْمِ الدِّينِ', 'إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ', 'اهْدِنَا الصِّرَاطَ الْمُسْتَقِيمَ', 'صِرَاطَ الَّذِينَ أَنْعَمْتَ عَلَيْهِمْ'] },
  { name: 'الإخلاص', verses: ['قُلْ هُوَ اللَّهُ أَحَدٌ', 'اللَّهُ الصَّمَدُ', 'لَمْ يَلِدْ وَلَمْ يُولَدْ', 'وَلَمْ يَكُن لَّهُ كُفُوًا أَحَدٌ'] },
  { name: 'الناس', verses: ['قُلْ أَعُوذُ بِرَبِّ النَّاسِ', 'مَلِكِ النَّاسِ', 'إِلَٰهِ النَّاسِ', 'مِن شَرِّ الْوَسْوَاسِ الْخَنَّاسِ', 'الَّذِي يُوَسْوِسُ فِي صُدُورِ النَّاسِ', 'مِنَ الْجِنَّةِ وَالنَّاسِ'] },
];

export function TasmeeScreen() {
  const surahIndex = useStore(s => s.tasmeeSurah);
  const goBack = useStore(s => s.goBack);
  
  const surah = SURAH_DATA[Math.min(surahIndex, SURAH_DATA.length - 1)];
  const [currentAyah, setCurrentAyah] = useState(0);
  const [status, setStatus] = useState<'idle' | 'listening' | 'evaluating' | 'result'>('idle');
  const [result, setResult] = useState<boolean | null>(null);

  const startListening = () => {
    if (status !== 'idle' && status !== 'result') return;
    
    setStatus('listening');
    
    // Simulate listening and evaluating Let's make it 3 seconds
    setTimeout(() => {
      setStatus('evaluating');
      setTimeout(() => {
        setResult(Math.random() > 0.2); // 80% chance to pass
        setStatus('result');
      }, 1000);
    }, 2000);
  };

  const handleNext = () => {
    if (currentAyah < surah.verses.length - 1) {
      setCurrentAyah(prev => prev + 1);
      setStatus('idle');
      setResult(null);
    } else {
      useStore.getState().addStars(50); // Add 50 stars
      useStore.getState().logActivity('quran', surah.verses.length, 50); // Adds 50 XP and logs verses recited
      alert(`ما شاء الله! أتممت سورة ${surah.name} كاملة! 🎉 كسبت ٥٠ نجمة ⭐ و ٥٠ نقطة XP`);
      goBack();
    }
  };

  return (
    <div className="flex flex-col flex-1 h-full bg-dark">
      <TopBar title={`🎙️ تسميع — ${surah.name}`} subTitle="اضغط الميكروفون واتلُ الآية" />
      
      <div className="flex flex-col flex-1 items-center p-5 gap-6 overflow-y-auto">
        <div className="w-full bg-mid border-2 border-gold rounded-2xl p-6 text-center shadow-lg">
          <div className="text-light text-[11px] mb-3">سورة {surah.name} — الآية {currentAyah + 1}</div>
          <motion.div 
            key={currentAyah}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-text text-xl leading-loose font-bold"
          >
            {surah.verses[currentAyah]}
          </motion.div>
          <div className="text-light text-[10px] mt-4">آية {currentAyah + 1} من {surah.verses.length}</div>
        </div>

        <div className="flex flex-col items-center mt-4">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={startListening}
            className={`relative w-20 h-20 rounded-full border-4 flex items-center justify-center transition-colors ${
              status === 'listening' ? 'bg-gold/20 border-gold/50' : 'bg-mid border-gold'
            }`}
          >
            {status === 'listening' && (
              <motion.div 
                animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0, 0.5] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="absolute inset-0 rounded-full border-2 border-gold"
              />
            )}
            <Mic size={32} className={status === 'listening' ? 'text-text' : 'text-gold'} />
          </motion.button>
          
          <div className="text-gold font-bold text-xs mt-4">
            {status === 'idle' && 'اضغط وابدأ التلاوة'}
            {status === 'listening' && 'جاري الاستماع...'}
            {status === 'evaluating' && 'جاري التقييم...'}
            {status === 'result' && (result ? 'تلاوة صحيحة' : 'حاول مرة أخرى')}
          </div>
          
          <div className="text-light text-[9px] mt-1 text-center">
            سيستمع التطبيق ويصحح لك تلقائياً
          </div>
        </div>

        <AnimatePresence>
          {status === 'result' && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full bg-mid border border-border rounded-xl p-4 text-center"
            >
              <div className="text-light text-[10px] mb-2">نتيجة التلاوة</div>
              {result ? (
                <>
                  <div className="text-xl tracking-widest mb-1">⭐⭐⭐</div>
                  <div className="text-gold text-xs font-bold">ممتاز! النطق صحيح 🎉</div>
                </>
              ) : (
                <>
                  <div className="text-xl tracking-widest mb-1 opacity-50">⭐☆☆</div>
                  <div className="text-red-400 text-xs font-bold">يوجد خطأ بسيط، حاول مجدداً</div>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex gap-3 w-full mt-auto pt-4">
          <button 
            disabled={status === 'listening'}
            className="flex-1 bg-border text-gold rounded-xl py-3 text-xs font-bold disabled:opacity-50"
          >
            استمع للنموذج
          </button>
          
          {status === 'result' && result && (
            <motion.button 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              onClick={handleNext}
              className="flex-1 bg-gold text-dark rounded-xl py-3 text-xs font-bold flex items-center justify-center gap-2"
            >
              الآية التالية 
            </motion.button>
          )}
        </div>
      </div>
    </div>
  );
}
