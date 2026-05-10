import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Repeat, Mic, Eye, EyeOff, CheckCircle, Loader2, ChevronLeft } from 'lucide-react';
import { useStore } from '../store';
import { TopBar } from '../components/TopBar';
import { SURAHS } from '../data/quranSurahs';

export function MemorizationScreen() {
  const language = useStore(s => s.language);
  const selectedSurah = useStore(s => s.selectedSurah);
  const navigate = useStore(s => s.navigate);
  const [ayats, setAyats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentAyahIndex, setCurrentAyahIndex] = useState(0);
  const [hiddenAyats, setHiddenAyats] = useState<Set<number>>(new Set());
  
  const selectedQuranReciter = useStore(s => s.selectedQuranReciter);
  const setSelectedQuranReciter = useStore(s => s.setSelectedQuranReciter);

  const [repeatCount, setRepeatCount] = useState(1);
  const [currentRepeat, setCurrentRepeat] = useState(1);

  const QURAN_RECITERS: Record<string, string> = {
    makkah: "ar.abdurrahmaansudais",
    madinah: "ar.hudhaify",
    alafasy: "ar.alafasy",
    abdulbasit: "ar.abdulsamad",
    husary: "ar.husary",
    minshawi: "ar.minshawi",
    maher: "ar.mahermuaiqly",
    shatri: "ar.shaatree",
    ajamy: "ar.ahmedajamy",
    shuraym: "ar.saoodshuraym",
    jibreel: "ar.muhammadjibreel",
    ayyoub: "ar.muhammadayyoub",
    rifai: "ar.hanirifai",
  };

  const audioReciter = QURAN_RECITERS[selectedQuranReciter] || "ar.alafasy";
  
  // Speech Recognition
  const [isListening, setIsListening] = useState(false);
  const [spokenText, setSpokenText] = useState('');
  const [feedback, setFeedback] = useState<'perfect' | 'incorrect' | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const fetchSurah = async () => {
      setLoading(true);
      try {
        const surahIdToFetch = selectedSurah || 1;
        const res = await fetch(`https://api.alquran.cloud/v1/surah/${surahIdToFetch}/${audioReciter}`);
        if (!res.ok) throw new Error("API response not ok");
        const data = await res.json();
        if (data && data.data && data.data.ayahs) {
          const formattedAyahs = data.data.ayahs.map((a: any) => ({
            id: a.numberInSurah,
            text: a.text,
            audio: a.audio
          }));
          setAyats(formattedAyahs);
          setCurrentAyahIndex(0);
          setCurrentRepeat(1);
        }
      } catch (err) {
        console.error("Failed to fetch surah", err);
      } finally {
        setLoading(false);
      }
    };
    if (selectedSurah && QURAN_RECITERS) {
       fetchSurah();
    }
  }, [selectedSurah, audioReciter]);

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
      audioRef.current.play().catch(e => {
        console.error("Audio play error:", e);
        setIsPlaying(false);
      });
      setIsPlaying(true);
    }
  };

  const onAudioEnded = () => {
    if (currentRepeat < repeatCount) {
      setCurrentRepeat(prev => prev + 1);
      playAyah(currentAyahIndex);
    } else {
      setCurrentRepeat(1);
      playAyah(currentAyahIndex + 1);
    }
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
  }, [ayats, currentAyahIndex]);

  const toggleListen = () => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      setSpokenText('');
      setFeedback(null);
      if (recognitionRef.current) {
        try {
          recognitionRef.current.start();
          setIsListening(true);
        } catch (e) {
          console.error("Speech recognition start error:", e);
        }
      } else {
        alert(language === 'ar' ? 'التعرف على الصوت غير مدعوم في متصفحك' : 'Speech recognition not supported');
      }
    }
  };

  const checkMemorization = (spoken: string) => {
    if (!ayats[currentAyahIndex]) return;
    const currentCorrectText = ayats[currentAyahIndex].text;
    
    // Very basic comparison. Needs NLP in production.
    const normalize = (ar: string) => ar.replace(/[\u0617-\u061A\u064B-\u0652]/g, "").trim().replace(/\s+/g," ");
    
    if (normalize(spoken).includes(normalize(currentCorrectText).substring(0, Math.min(10, normalize(currentCorrectText).length)))) {
      setFeedback('perfect');
    } else {
       // Check if at least 40% match
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

  const currentSurahIndex = selectedSurah || 1;
  const currentSurah = SURAHS.find(s => s.number === currentSurahIndex);

  return (
    <div className="flex flex-col flex-1 h-full bg-dark">
      <TopBar title={language === 'ar' ? 'ركن التحفيظ' : 'Memorization'} />
      <audio ref={audioRef} onEnded={onAudioEnded} className="hidden" />

      <div className="flex-1 overflow-y-auto p-5 pb-32">
        
        <div className="flex items-center justify-between mb-6">
           <button onClick={() => {
             useStore.getState().setFullQuranTarget('memorization');
             navigate('full_quran');
           }} className="p-2 border border-border rounded-xl text-light hover:text-gold flex items-center gap-2">
             <ChevronLeft size={20} />
             <span className="text-sm font-bold">{language === 'ar' ? 'تغيير السورة' : 'Change Surah'}</span>
           </button>
           <button onClick={() => {
             const allIds = ayats.map(a => a.id);
             if (hiddenAyats.size === ayats.length) setHiddenAyats(new Set());
             else setHiddenAyats(new Set(allIds));
           }} className="text-xs text-gold underline">
             {language === 'ar' ? 'إخفاء / إظهار الكل' : 'Hide / Show All'}
           </button>
        </div>

        <div className="bg-mid border border-gold p-4 rounded-xl text-center mb-6">
          <h2 className="text-xl font-bold text-gold font-amiri mb-4">سورة {currentSurah?.name || 'الفاتحة'}</h2>
          
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between bg-dark p-3 rounded-lg border border-border">
              <span className="text-sm font-bold text-light">{language === 'ar' ? 'القارئ:' : 'Reciter:'}</span>
              <select 
                value={selectedQuranReciter} 
                onChange={(e) => setSelectedQuranReciter(e.target.value as any)}
                className="bg-transparent text-sm text-gold border-none outline-none appearance-none"
                style={{ direction: language === 'ar' ? 'rtl' : 'ltr' }}
              >
                <option className="bg-dark" value="alafasy">مشاري العفاسي</option>
                <option className="bg-dark" value="makkah">عبدالرحمن السديس</option>
                <option className="bg-dark" value="madinah">علي الحذيفي</option>
                <option className="bg-dark" value="abdulbasit">عبدالباسط عبدالصمد</option>
                <option className="bg-dark" value="husary">محمود خليل الحصري</option>
                <option className="bg-dark" value="minshawi">محمد صديق المنشاوي</option>
                <option className="bg-dark" value="maher">ماهر المعيقلي</option>
              </select>
            </div>
            
            <div className="flex items-center justify-between bg-dark p-3 rounded-lg border border-border">
               <span className="text-sm font-bold text-light flex items-center gap-2">
                 <Repeat size={16} className="text-gold" />
                 {language === 'ar' ? 'تكرار الآية:' : 'Repeat Ayah:'}
               </span>
               <div className="flex items-center gap-3 bg-mid rounded-full px-2 py-1">
                 <button onClick={() => setRepeatCount(Math.max(1, repeatCount - 1))} className="w-8 h-8 flex items-center justify-center text-light hover:text-gold">-</button>
                 <span className="text-gold font-bold min-w-[20px] text-center">{repeatCount}</span>
                 <button onClick={() => setRepeatCount(repeatCount + 1)} className="w-8 h-8 flex items-center justify-center text-light hover:text-gold">+</button>
               </div>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center p-12 text-light">
            <Loader2 className="animate-spin mb-4" size={32} />
            <p>{language === 'ar' ? 'جاري تحميل الآيات...' : 'Loading verses...'}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {ayats.map((ayah, i) => (
              <div 
                key={ayah.id} 
                className={`p-4 rounded-xl border transition-colors relative cursor-pointer ${currentAyahIndex === i ? 'bg-gold/10 border-gold/50' : 'bg-mid border-border'}`}
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
        )}

      </div>

      {/* Control Bar */}
      <div className="fixed bottom-16 left-0 right-0 max-w-md mx-auto bg-mid border-t border-border p-4 flex flex-col gap-3 z-20">
         
         <div className="flex items-center justify-between">
           <div className="w-12 h-12 flex items-center justify-center font-bold text-xs text-gold">
             {currentRepeat}/{repeatCount}
           </div>
           
           <button 
             onClick={handlePlayPause}
             className="w-14 h-14 bg-gold text-dark rounded-full flex items-center justify-center shadow-lg hover:scale-105 transition-transform"
             disabled={loading}
           >
             {isPlaying ? <Pause size={28} /> : <Play size={28} className="translate-x-0.5" />}
           </button>

           <button 
             onClick={toggleListen}
             className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
               isListening ? 'bg-red-500 text-white animate-pulse' : 'bg-dark border border-border text-light hover:text-gold'
             }`}
             disabled={loading}
           >
             <Mic size={20} />
           </button>
         </div>

         {/* Feedback Area */}
         {isListening && (
           <div className="text-center text-gold font-bold text-sm bg-dark py-2 rounded-lg border border-gold/30">
              {language === 'ar' ? 'جاري الاستماع... اقرأ الآية المحددة' : 'Listening... Read the selected ayah'}
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
