import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Repeat, Mic, Eye, EyeOff, CheckCircle, Loader2 } from 'lucide-react';
import { useStore } from './store';
import { TopBar } from './TopBar';

const AL_FATIHA = [
  { id: 1, text: "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ", audio: "https://cdn.islamic.network/quran/audio/128/ar.alafasy/1.mp3" },
  { id: 2, text: "الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ", audio: "https://cdn.islamic.network/quran/audio/128/ar.alafasy/2.mp3" },
  { id: 3, text: "الرَّحْمَٰنِ الرَّحِيمِ", audio: "https://cdn.islamic.network/quran/audio/128/ar.alafasy/3.mp3" },
  { id: 4, text: "مَالِكِ يَوْمِ الدِّينِ", audio: "https://cdn.islamic.network/quran/audio/128/ar.alafasy/4.mp3" },
  { id: 5, text: "إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ", audio: "https://cdn.islamic.network/quran/audio/128/ar.alafasy/5.mp3" },
  { id: 6, text: "اهْدِنَا الصِّرَاطَ الْمُسْتَقِيمَ", audio: "https://cdn.islamic.network/quran/audio/128/ar.alafasy/6.mp3" },
  { id: 7, text: "صِرَاطَ الَّذِينَ أَنْعَمْتَ عَلَيْهِمْ غَيْرِ الْمَغْضُوبِ عَلَيْهِمْ وَلَا الضَّالِّينَ", audio: "https://cdn.islamic.network/quran/audio/128/ar.alafasy/7.mp3" }
];

export function MemorizationScreen() {
  const language = useStore(s => s.language);
  const [ayats, setAyats] = useState(AL_FATIHA);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentAyahIndex, setCurrentAyahIndex] = useState(0);
  const [hiddenAyats, setHiddenAyats] = useState<Set<number>>(new Set());
  
  // Speech Recognition
  const [isListening, setIsListening] = useState(false);
  const [spokenText, setSpokenText] = useState('');
  const [feedback, setFeedback] = useState<'perfect' | 'incorrect' | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  // --- AUDIO LOGIC ---
  const handlePlayPause = () => {
    if (isPlaying) {
       audioRef.current?.pause();
       setIsPlaying(false);
    } else {
       playAyah(currentAyahIndex);
    }
  };

  const playAyah = (index: number) => {
    if (index >= ayats.length) {
      setIsPlaying(false);
      return;
    }
    setCurrentAyahIndex(index);
    if (audioRef.current) {
      audioRef.current.src = ayats[index].audio;
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const onAudioEnded = () => {
    // For now sequence to next ayah
    playAyah(currentAyahIndex + 1);
  };

  // --- HIDING LOGIC ---
  const toggleHide = (id: number) => {
    const newHidden = new Set(hiddenAyats);
    if (newHidden.has(id)) newHidden.delete(id);
    else newHidden.add(id);
    setHiddenAyats(newHidden);
  };

  // --- MEMORIZATION TEST LOGIC ---
  const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'ar-SA';

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setSpokenText(transcript);
        checkMemorization(transcript);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, []);

  const toggleListen = () => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      setSpokenText('');
      setFeedback(null);
      if (recognitionRef.current) {
        recognitionRef.current.start();
        setIsListening(true);
      } else {
        alert(language === 'ar' ? 'التعرف على الصوت غير مدعوم في متصفحك' : 'Speech recognition not supported');
      }
    }
  };

  const checkMemorization = (spoken: string) => {
    const currentCorrectText = ayats[currentAyahIndex].text;
    
    // Very basic comparison. Needs NLP in production.
    const normalize = (ar: string) => ar.replace(/[\u0617-\u061A\u064B-\u0652]/g, "").trim().replace(/\s+/g," ");
    
    if (normalize(spoken).includes(normalize(currentCorrectText).substring(0, Math.min(10, normalize(currentCorrectText).length)))) {
      setFeedback('perfect');
    } else {
       // Check if at least 50% match
       const spokenWords = normalize(spoken).split(' ');
       const correctWords = normalize(currentCorrectText).split(' ');
       let matches = 0;
       spokenWords.forEach(w => { if(correctWords.includes(w)) matches++; });
       
       if (matches >= correctWords.length * 0.4) {
          setFeedback('perfect');
       } else {
          setFeedback('incorrect');
       }
    }
  };

  return (
    <div className="flex flex-col flex-1 h-full bg-dark">
      <TopBar title={language === 'ar' ? 'ركن التحفيظ' : 'Memorization'} />
      <audio ref={audioRef} onEnded={onAudioEnded} className="hidden" />

      <div className="flex-1 overflow-y-auto p-5 pb-32">
        <div className="bg-mid border border-gold p-4 rounded-xl text-center mb-6">
          <h2 className="text-xl font-bold text-gold font-amiri">سورة الفاتحة</h2>
        </div>

        <div className="space-y-4">
          {ayats.map((ayah, i) => (
            <div 
              key={ayah.id} 
              className={`p-4 rounded-xl border transition-colors relative ${currentAyahIndex === i ? 'bg-gold/10 border-gold/50' : 'bg-mid border-border'}`}
              onClick={() => setCurrentAyahIndex(i)}
            >
              <div className="flex justify-between items-start mb-2">
                <button 
                  onClick={(e) => { e.stopPropagation(); toggleHide(ayah.id); }}
                  className="p-1.5 bg-dark rounded-md text-light hover:text-gold"
                >
                  {hiddenAyats.has(ayah.id) ? <Eye size={18} /> : <EyeOff size={18} />}
                </button>
                <div className="w-8 h-8 rounded-full border border-gold/30 flex items-center justify-center text-xs text-gold">
                  {ayah.id}
                </div>
              </div>
              
              <div 
                className={`text-2xl font-amiri font-bold text-center leading-loose transition-all duration-300 ${hiddenAyats.has(ayah.id) ? 'blur-sm text-transparent select-none' : 'text-text'}`}
                dir="rtl"
              >
                {hiddenAyats.has(ayah.id) ? 'يتم إخفاء الآية لاختبار الحفظ...' : ayah.text}
              </div>
            </div>
          ))}
        </div>

      </div>

      {/* Control Bar */}
      <div className="fixed bottom-16 left-0 right-0 max-w-md mx-auto bg-mid border-t border-border p-4 flex flex-col gap-3 z-20">
         
         <div className="flex items-center justify-between">
           <button 
             className="w-12 h-12 bg-dark border border-border rounded-full flex items-center justify-center text-light hover:text-gold"
           >
             <Repeat size={20} />
           </button>
           
           <button 
             onClick={handlePlayPause}
             className="w-14 h-14 bg-gold text-dark rounded-full flex items-center justify-center shadow-lg"
           >
             {isPlaying ? <Pause size={28} /> : <Play size={28} className="translate-x-0.5" />}
           </button>

           <button 
             onClick={toggleListen}
             className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
               isListening ? 'bg-red-500 text-white animate-pulse' : 'bg-dark border border-border text-light hover:text-gold'
             }`}
           >
             <Mic size={20} />
           </button>
         </div>

         {/* Feedback Area */}
         {isListening && (
           <div className="text-center text-gold font-bold text-sm bg-dark py-2 rounded-lg border border-gold/30">
              {language === 'ar' ? 'جاري الاستماع... اقرأ الآية' : 'Listening... Read the ayah'}
           </div>
         )}

         {feedback && !isListening && (
            <div className={`p-3 rounded-lg border text-center font-bold flex items-center justify-center gap-2 ${
              feedback === 'perfect' ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400' : 'bg-red-500/10 border-red-500/50 text-red-400'
            }`}>
              {feedback === 'perfect' 
                ? <><CheckCircle size={18} /> {language === 'ar' ? 'تلاوة صحيحة ما شاء الله!' : 'Perfect reading Mashallah!'}</>
                : <>{language === 'ar' ? 'يوجد خطأ بسيط، أعد المحاولة' : 'Minor mistake, try again'}</>
              }
            </div>
         )}
      </div>

    </div>
  );
}
