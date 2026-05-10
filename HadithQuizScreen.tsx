import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useStore } from './store';
import { TopBar } from './TopBar';

const QUIZ_DATA = [
  {
    hadith: '« إِنَّمَا الأَعْمَالُ بِالنِّيَّاتِ »',
    src: 'رواه البخاري ومسلم — عن عمر بن الخطاب',
    q: 'من روى هذا الحديث؟',
    answers: [
      { text: 'عمر بن الخطاب رضي الله عنه', isCorrect: true },
      { text: 'أبو هريرة رضي الله عنه', isCorrect: false },
      { text: 'علي بن أبي طالب رضي الله عنه', isCorrect: false },
      { text: 'عائشة رضي الله عنها', isCorrect: false },
    ]
  },
  {
    hadith: '« الدِّينُ النَّصِيحَةُ »',
    src: 'رواه مسلم — عن تميم الداري',
    q: 'لمن تكون النصيحة لله ولرسوله و...؟',
    answers: [
      { text: 'للمسلمين', isCorrect: false },
      { text: 'لأئمة المسلمين وعامتهم', isCorrect: true },
      { text: 'للحكام فقط', isCorrect: false },
      { text: 'للأصدقاء والأهل', isCorrect: false },
    ]
  }
];

export function HadithQuizScreen() {
  const goBack = useStore(s => s.goBack);
  const [currentQ, setCurrentQ] = useState(0);
  const [selectedAns, setSelectedAns] = useState<number | null>(null);
  const [score, setScore] = useState(0);

  const question = QUIZ_DATA[currentQ];

  const handleSelect = (idx: number) => {
    if (selectedAns !== null) return; // Prevent multiple selections
    setSelectedAns(idx);
    if (question.answers[idx].isCorrect) {
      setScore(s => s + 10);
    }
  };

  const handleNext = () => {
    if (currentQ < QUIZ_DATA.length - 1) {
      setCurrentQ(prev => prev + 1);
      setSelectedAns(null);
    } else {
      useStore.getState().addStars(score); // Add score to store
      useStore.getState().addXp(score);
      alert(`انتهت المسابقة! مجموع نقاطك: ${score} ⭐\nتمت إضافة النجوم والـ XP لرصيدك!`);
      goBack();
    }
  };

  return (
    <div className="flex flex-col flex-1 h-full bg-dark">
      <TopBar title="🎯 مسابقة الأحاديث" subTitle="اختار الإجابة الصح" />
      
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
        
        <div className="bg-mid border-2 border-gold rounded-xl p-4 text-center shadow-lg">
          <div className="text-light text-[9px] mb-2">الحديث</div>
          <div className="text-text text-lg font-bold leading-loose mb-2">{question.hadith}</div>
          <div className="text-light text-[9px]">{question.src}</div>
        </div>

        <div className="text-gold font-bold text-sm select-none">
          {question.q}
        </div>

        <div className="flex flex-col gap-3">
          {question.answers.map((ans, idx) => {
            const isSelected = selectedAns === idx;
            const isCorrect = ans.isCorrect;
            
            let btnClass = "bg-mid border-border text-text";
            let icon = "○";

            if (selectedAns !== null) {
              if (isCorrect) {
                btnClass = "border-[#3b6d11] bg-[#1a3a10] text-[#97c459]";
                icon = "✅";
              } else if (isSelected) {
                btnClass = "border-[#a32d2d] bg-[#2a0f0f] text-[#f09595]";
                icon = "❌";
              } else {
                btnClass = "border-border/50 text-text/50 opacity-50";
              }
            } else {
              btnClass = "hover:border-gold border-border text-text";
            }

            return (
              <motion.button
                key={idx}
                whileTap={selectedAns === null ? { scale: 0.98 } : {}}
                onClick={() => handleSelect(idx)}
                disabled={selectedAns !== null}
                className={`p-4 rounded-xl border flex items-center gap-3 text-right text-xs transition-colors ${btnClass}`}
              >
                <span className="text-[14px] w-5 text-center">{icon}</span>
                <span className="flex-1">{ans.text}</span>
              </motion.button>
            )
          })}
        </div>

        <AnimatePresence>
          {selectedAns !== null && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-auto flex items-center justify-between pt-4 pb-2 border-t border-border"
            >
              <div className="text-light text-[10px]">
                سؤال {currentQ + 1} من {QUIZ_DATA.length} — ⭐ مجموعك {score} نقطة
              </div>
              <button 
                onClick={handleNext}
                className="bg-gold text-dark font-bold text-xs px-5 py-2.5 rounded-xl shadow-md active:scale-95 transition-transform"
              >
                {currentQ === QUIZ_DATA.length - 1 ? 'إنهاء المسابقة' : 'التالي ←'}
              </button>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
