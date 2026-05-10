import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Smile, Share2, Sparkles, RefreshCw } from 'lucide-react';
import { useStore } from '../store';
import { TopBar } from '../components/TopBar';
import html2canvas from 'html2canvas';

const MESSAGES_AR = [
  "الله يعلم أنك تتعب، وسيجزيك على قدر تعبك وأكثر.",
  "لا تحزن، لعل الأماني يئست من طول الرجاء، فجاء بها الله من حيث لا تحتسب.",
  "ابتسم! من توكل على الله كفاه.",
  "سيجبرك الله جبراً يليق برحمته.",
  "كل كسر يهون إذا كان الله هو الجابر.",
  "لا تدري لعل الله يحدث بعد ذلك أمرا.",
  "ثق بأن الله ألطف من أن يرى خاطر عبده مكسوراً ولا يجبره.",
  "العوض الجميل من الله قادم، فاستعد له بالحمد."
];

const MESSAGES_EN = [
  "Allah knows you are trying, and He will reward you beyond your imagination.",
  "Do not grieve, perhaps what you wished for was brought by Allah from where you do not expect.",
  "Smile! Whoever relies on Allah, He will suffice him.",
  "Allah will heal your heart in a way that befits His mercy.",
  "Every break is easy to mend when Allah is the Healer.",
  "You do not know, perhaps Allah will bring about a new situation.",
  "Trust that Allah is too kind to see His servant's heart broken and not mend it.",
  "The beautiful compensation from Allah is coming, prepare for it with gratitude."
];

export function HappinessWheelScreen() {
  const language = useStore(s => s.language);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [rotation, setRotation] = useState(0);

  const messages = language === 'ar' ? MESSAGES_AR : MESSAGES_EN;

  const spinWheel = () => {
    if (spinning) return;
    setSpinning(true);
    setResult(null);
    
    // Calculate new rotation
    const spins = Math.floor(Math.random() * 5) + 5; // 5 to 10 full spins
    const randomIndex = Math.floor(Math.random() * messages.length);
    const sliceAngle = 360 / messages.length;
    const extraRotation = Array(spins).fill(360).reduce((a,b)=>a+b,0) + (randomIndex * sliceAngle) + (sliceAngle / 2);
    
    const targetRotation = rotation + extraRotation;
    setRotation(targetRotation);

    setTimeout(() => {
      setSpinning(false);
      setResult(messages[randomIndex]);
    }, 4000); // match animation duration
  };

  const handleShare = async () => {
    if (!result) return;
    try {
      if (navigator.share) {
        await navigator.share({
          title: language === 'ar' ? 'رسالة سعادة' : 'Message of Happiness',
          text: result,
        });
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="flex flex-col flex-1 h-full bg-dark">
      <TopBar title={language === 'ar' ? 'عجلة السعادة' : 'Wheel of Happiness'} />
      
      <div className="flex-1 overflow-y-auto p-5 pb-24 flex flex-col items-center justify-center">

        <h2 className="text-2xl font-bold text-text text-center mb-2">
           {language === 'ar' ? 'رسالة من الله لك اليوم' : 'A Message for You Today'}
        </h2>
        <p className="text-light text-center mb-10">
           {language === 'ar' ? 'اضغط على العجلة لتدور واستقبل رسالتك' : 'Tap the wheel to spin and receive your message'}
        </p>

        {/* Wheel Container */}
        <div className="relative mb-12">
          {/* Pointer */}
          <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-20 text-gold drop-shadow-md">
            <svg width="30" height="30" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2L22 20H2L12 2Z" transform="rotate(180 12 11)" />
            </svg>
          </div>

          {/* The Wheel */}
          <div 
            className="w-72 h-72 sm:w-80 sm:h-80 rounded-full border-8 border-mid shadow-[0_0_40px_rgba(212,175,55,0.2)] cursor-pointer"
            onClick={spinWheel}
          >
            <motion.div 
              className="w-full h-full rounded-full relative overflow-hidden bg-dark"
              style={{
                background: `conic-gradient(from 0deg, 
                  #1F2937 0deg 45deg, #111827 45deg 90deg, 
                  #1F2937 90deg 135deg, #111827 135deg 180deg, 
                  #1F2937 180deg 225deg, #111827 225deg 270deg, 
                  #1F2937 270deg 315deg, #111827 315deg 360deg
                )`
              }}
              animate={{ rotate: rotation }}
              transition={{ duration: 4, ease: [0.2, 0.8, 0.2, 1] }}
            >
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                 <Sparkles size={60} className="text-gold opacity-20" />
              </div>
            </motion.div>
          </div>
          
          <button 
            onClick={spinWheel}
            disabled={spinning}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-gold text-dark rounded-full flex items-center justify-center font-bold shadow-xl border-4 border-mid z-10 disabled:opacity-80"
          >
            {spinning ? <RefreshCw className="animate-spin" size={24} /> : <Smile size={28} />}
          </button>
        </div>

        {/* Result Message */}
        <AnimatePresence>
          {result && !spinning && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className="bg-mid border border-gold/30 p-6 rounded-3xl shadow-lg text-center relative w-full max-w-sm"
            >
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gold text-dark px-4 py-1 rounded-full font-bold text-sm shadow-md">
                {language === 'ar' ? 'رسالتك' : 'Your Message'}
              </div>
              <p className="text-text font-amiri text-2xl leading-relaxed mt-4 mb-6">
                {result}
              </p>
              <button 
                onClick={handleShare}
                className="mx-auto flex items-center justify-center gap-2 bg-dark/50 hover:bg-dark border border-border px-6 py-3 rounded-xl text-gold transition-colors font-bold w-full"
              >
                <Share2 size={20} />
                {language === 'ar' ? 'مشاركة' : 'Share'}
              </button>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
