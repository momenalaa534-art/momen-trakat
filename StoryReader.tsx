import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import { Share2, BookOpen, Settings2, Play, Pause, SkipForward, SkipBack, Loader2, Highlighter, Check } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';
import { useStore } from './store';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

interface StoryReaderProps {
  key?: React.Key;
  story: { title: string, story: string, lessons: string[], type: string };
  language: string;
  onShare: (s: any) => void;
}

export function StoryReader({ story, language, onShare }: StoryReaderProps) {
  const [fontSize, setFontSize] = useState(20);
  const [fontFamily, setFontFamily] = useState('font-amiri');
  const [readTheme, setReadTheme] = useState<'dark'|'light'|'sepia'>('dark');
  const [showSettings, setShowSettings] = useState(false);

  const [sentences, setSentences] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoadingTts, setIsLoadingTts] = useState(false);

  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const audioCache = useRef<Record<number, Promise<string | null>>>({});
  const audioElements = useRef<Record<number, HTMLAudioElement>>({});

  const [ttsError, setTtsError] = useState<string | null>(null);
  const [voiceMode, setVoiceMode] = useState<'ai' | 'device'>('ai');
  const ttsCredits = useStore((s) => s.ttsCredits);
  const synth = window.speechSynthesis;

  useEffect(() => {
    // Grouping all text into chunks (up to 400 characters) for faster first-byte audio start.
    const raw = story.story.split(/([.؟!\n]+)/);
    const result: string[] = [];
    let currentChunk = '';
    for (let i = 0; i < raw.length; i += 2) {
      const s = raw[i];
      const p = raw[i+1] || '';
      const textPart = s + p;
      if (textPart.trim()) {
        currentChunk += textPart + ' ';
        // 400 chars is roughly 2-3 sentences, starts playing fast.
        if (currentChunk.length > 400) {
           result.push(currentChunk.trim());
           currentChunk = '';
        }
      }
    }
    if (currentChunk.trim()) {
      result.push(currentChunk.trim());
    }
    setSentences(result);
    setCurrentIndex(-1);
    setIsPlaying(false);
    setTtsError(null);
    audioCache.current = {};
    (Object.values(audioElements.current) as HTMLAudioElement[]).forEach(a => {
      a.pause();
      a.src = "";
    });
    audioElements.current = {};
    synth.cancel();
  }, [story.story]);

  const fetchTTS = async (text: string) => {
    try {
       const response = await ai.models.generateContent({
         model: "gemini-3.1-flash-tts-preview",
         contents: [{ parts: [{ text: text }] }],
         config: {
           responseModalities: ['AUDIO'],
           speechConfig: {
               voiceConfig: {
                 // Charon is a deep, authoritative male voice matching the user's description
                 prebuiltVoiceConfig: { voiceName: 'Charon' } 
               }
           }
         }
       });
       const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
       if (base64Audio) {
         // Convert raw PCM (24kHz, 16-bit, mono) to WAV
         const pcmData = Uint8Array.from(atob(base64Audio), c => c.charCodeAt(0));
         const dataSize = pcmData.length;
         const buffer = new ArrayBuffer(44 + dataSize);
         const view = new DataView(buffer);

         const writeString = (v: DataView, offset: number, str: string) => {
           for (let i = 0; i < str.length; i++) {
             v.setUint8(offset + i, str.charCodeAt(i));
           }
         };

         writeString(view, 0, 'RIFF');
         view.setUint32(4, 36 + dataSize, true);
         writeString(view, 8, 'WAVE');
         
         writeString(view, 12, 'fmt ');
         view.setUint32(16, 16, true); 
         view.setUint16(20, 1, true); 
         view.setUint16(22, 1, true); // 1 channel
         view.setUint32(24, 24000, true); // sample rate 24kHz
         view.setUint32(28, 24000 * 2, true); // byteRate
         view.setUint16(32, 2, true); // blockAlign
         view.setUint16(34, 16, true); // bitsPerSample
         
         writeString(view, 36, 'data');
         view.setUint32(40, dataSize, true);

         new Uint8Array(buffer).set(pcmData, 44);

         const blob = new Blob([buffer], { type: 'audio/wav' });
         return URL.createObjectURL(blob);
       }
    } catch (e: any) {
      console.error("TTS fetch error", e);
      if (e?.status === 429 || e?.status === 'RESOURCE_EXHAUSTED' || e?.message?.includes('429') || e?.message?.includes('quota') || e?.message?.includes('RESOURCE_EXHAUSTED')) {
         setTtsError(language === 'ar' ? "ضغط كبير علي الخدمة جاري التحويل إلى القارئ العادي..." : "Server busy. Switching to unlimited device reader...");
         setTimeout(() => setVoiceMode('device'), 1500);
      } else {
         setTtsError(language === 'ar' ? "حدث خطأ أثناء إعداد الصوت الذكي. التحويل لقارئ الجهاز..." : "AI Audio Error. Switching to device reader...");
         setTimeout(() => setVoiceMode('device'), 1500);
      }
    }
    return null;
  }

  const preloadAudio = (index: number) => {
    if (index >= sentences.length || audioCache.current[index] !== undefined) return audioCache.current[index];
    const promise = fetchTTS(sentences[index]);
    audioCache.current[index] = promise;
    promise.then((res) => {
      if (!res) {
         audioCache.current[index] = undefined;
      } else {
         const audio = new Audio(res);
         audio.preload = "auto";
         audio.playbackRate = playbackSpeed;
         audioElements.current[index] = audio;
      }
    });
    return promise;
  };

  const playSentence = async (index: number) => {
    if (index < 0 || index >= sentences.length) {
      setIsPlaying(false);
      setCurrentIndex(-1);
      return;
    }
    setCurrentIndex(index);
    setTtsError(null);

    if (voiceMode === 'device') {
      synth.cancel();
      const utterance = new SpeechSynthesisUtterance(sentences[index]);
      utterance.lang = language === 'ar' ? 'ar-SA' : 'en-US';
      utterance.rate = playbackSpeed;
      utterance.onend = () => {
        playSentence(index + 1);
      };
      utterance.onerror = (e) => {
        setIsPlaying(false);
      };
      synth.speak(utterance);
      setIsPlaying(true);
      return;
    }

    setIsLoadingTts(true);
    
    if (audioCache.current[index] === undefined) {
      preloadAudio(index);
    }
    const audioUrl = await audioCache.current[index];
    
    setIsLoadingTts(false);

    if (!audioUrl) {
       setIsPlaying(false);
       return;
    }

    // Stop all others
    (Object.values(audioElements.current) as HTMLAudioElement[]).forEach(a => {
      if (a !== audioElements.current[index]) {
         a.pause();
      }
    });

    let currentAudio = audioElements.current[index];
    if (!currentAudio) {
      currentAudio = new Audio(audioUrl);
      audioElements.current[index] = currentAudio;
    }

    currentAudio.playbackRate = playbackSpeed;
    
    // Auto preload the next sentence
    setTimeout(() => {
       preloadAudio(index + 1);
    }, 50);

    currentAudio.onended = () => {
      playSentence(index + 1);
    };
    currentAudio.play().catch(e => console.error("Audio play error", e));
    setIsPlaying(true);
  }

  const togglePlay = () => {
    if (isPlaying) {
      if (voiceMode === 'device') {
        synth.cancel();
      } else {
        (Object.values(audioElements.current) as HTMLAudioElement[]).forEach(a => a.pause());
      }
      setIsPlaying(false);
    } else {
      if (currentIndex === -1 && sentences.length > 0) {
        playSentence(0);
      } else if (voiceMode === 'device') {
        playSentence(currentIndex);
      } else if (audioElements.current[currentIndex]) {
        audioElements.current[currentIndex].play().catch(e => console.error(e));
        setIsPlaying(true);
      } else {
         playSentence(currentIndex);
      }
    }
  }

  const handleNext = () => {
    if (currentIndex < sentences.length - 1) {
      playSentence(currentIndex + 1);
    }
  }

  const handlePrev = () => {
    if (currentIndex > 0) {
      playSentence(currentIndex - 1);
    }
  }

  const speedOptions = [0.75, 1, 1.25, 1.5, 2];
  const toggleSpeed = () => {
    const nextIdx = (speedOptions.indexOf(playbackSpeed) + 1) % speedOptions.length;
    const newSpd = speedOptions[nextIdx];
    setPlaybackSpeed(newSpd);
    
    if (voiceMode === 'device' && isPlaying) {
        synth.cancel();
        playSentence(currentIndex);
    } else {
        (Object.values(audioElements.current) as HTMLAudioElement[]).forEach(a => {
          a.playbackRate = newSpd;
        });
    }
  };

  const getThemeClasses = () => {
    if (readTheme === 'light') return 'bg-white text-gray-900 border-gray-200';
    if (readTheme === 'sepia') return 'bg-[#fdf5e6] text-[#5a3d1d] border-[#eaddc5]';
    return 'bg-mid text-text border-border';
  }

  const getHighlightClass = () => {
    if (readTheme === 'light') return 'bg-blue-100 text-blue-900 rounded px-1';
    if (readTheme === 'sepia') return 'bg-yellow-200 text-[#5a3d1d] rounded px-1';
    return 'bg-gold/30 text-gold rounded px-1';
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`${getThemeClasses()} border rounded-xl p-5 sm:p-6 shadow-sm flex flex-col gap-5 relative transition-colors duration-300`}
    >
      <div className="flex justify-between items-start gap-4">
        <div className="flex flex-col gap-2">
          <span className={`text-[10px] px-2 py-0.5 rounded-md self-start font-bold ${readTheme === 'dark' ? 'bg-dark text-gold border border-border/50' : 'bg-black/10 text-current'}`}>
            {story.type}
          </span>
          <h3 className={`font-bold text-xl leading-snug ${readTheme === 'dark' ? 'text-gold' : 'text-current font-black'}`}>
            {story.title}
          </h3>
        </div>
        
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setShowSettings(!showSettings)}
            className={`p-2 rounded-lg transition-colors shrink-0 ${readTheme === 'dark' ? 'bg-dark/50 hover:bg-dark text-light hover:text-gold border border-border/30' : 'bg-black/5 hover:bg-black/10 text-current'}`}
          >
            <Settings2 size={20} />
          </button>
          <button 
            onClick={() => onShare(story)}
            className={`p-2 rounded-lg transition-colors shrink-0 flex items-center justify-center ${readTheme === 'dark' ? 'bg-dark/50 hover:bg-dark text-light hover:text-gold border border-border/30' : 'bg-black/5 hover:bg-black/10 text-current'}`}
          >
            <Share2 size={20} />
          </button>
        </div>
      </div>

      {showSettings && (
        <div className={`p-4 rounded-xl flex flex-col gap-4 text-sm ${readTheme === 'dark' ? 'bg-dark/30 border border-border/50' : 'bg-black/5'}`}>
          <div className="flex items-center justify-between">
            <span className="font-bold opacity-80">{language === 'ar' ? 'حجم الخط' : 'Font Size'}</span>
            <div className="flex items-center gap-3">
              <button onClick={() => setFontSize(Math.max(14, fontSize - 2))} className="w-8 h-8 rounded-full border border-current flex items-center justify-center opacity-70 hover:opacity-100">-</button>
              <span className="w-6 text-center">{fontSize}</span>
              <button onClick={() => setFontSize(Math.min(36, fontSize + 2))} className="w-8 h-8 rounded-full border border-current flex items-center justify-center opacity-70 hover:opacity-100">+</button>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="font-bold opacity-80">{language === 'ar' ? 'الخط' : 'Font'}</span>
            <div className="flex items-center gap-2">
              <button onClick={() => setFontFamily('font-amiri')} className={`px-2 py-1 border rounded-md ${fontFamily === 'font-amiri' ? 'border-current' : 'border-transparent opacity-50'}`}>Amiri</button>
              <button onClick={() => setFontFamily('font-cairo')} className={`px-2 py-1 border rounded-md ${fontFamily === 'font-cairo' ? 'border-current' : 'border-transparent opacity-50'}`}>Cairo</button>
              <button onClick={() => setFontFamily('font-sans')} className={`px-2 py-1 border rounded-md ${fontFamily === 'font-sans' ? 'border-current' : 'border-transparent opacity-50'}`}>Modern</button>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="font-bold opacity-80">{language === 'ar' ? 'المظهر' : 'Theme'}</span>
            <div className="flex items-center gap-2">
              <button onClick={() => setReadTheme('dark')} className={`w-6 h-6 rounded-full bg-[#1a1c23] border-2 ${readTheme === 'dark' ? 'border-gold' : 'border-transparent'}`}></button>
              <button onClick={() => setReadTheme('sepia')} className={`w-6 h-6 rounded-full bg-[#fdf5e6] border-2 ${readTheme === 'sepia' ? 'border-[#5a3d1d]' : 'border-transparent'}`}></button>
              <button onClick={() => setReadTheme('light')} className={`w-6 h-6 rounded-full bg-white border-2 ${readTheme === 'light' ? 'border-blue-500' : 'border-transparent'}`}></button>
            </div>
          </div>
        </div>
      )}

      {/* TTS Audio Player Bar */}
      <div className={`flex flex-wrap sm:flex-nowrap items-center justify-between gap-4 p-3 rounded-xl border ${readTheme === 'dark' ? 'bg-dark/30 border-border/50' : 'bg-black/5 border-black/10'}`}>
        <div className="flex items-center gap-2 opacity-80 min-w-[max-content]">
          <Highlighter size={18} />
          <span className="text-sm font-bold">{language === 'ar' ? 'الاستماع التلقائي' : 'Audio Reader'}</span>
          <button
            onClick={() => {
               setVoiceMode(voiceMode === 'ai' ? 'device' : 'ai');
               if (isPlaying) {
                  if (voiceMode === 'ai') (Object.values(audioElements.current) as HTMLAudioElement[]).forEach(a => a.pause());
                  else synth.cancel();
                  setIsPlaying(false);
               }
            }}
            className={`mr-2 px-2 py-0.5 rounded text-[10px] sm:text-xs font-bold transition-colors ${voiceMode === 'ai' ? 'bg-gold text-dark' : 'bg-green-500 text-white'}`}
          >
            {voiceMode === 'ai' ? (language === 'ar' ? 'صوت ذكي' : 'AI Voice') : (language === 'ar' ? 'سريع و مجاني' : 'Unlimited Free')}
          </button>
        </div>
        
        <div className="flex items-center justify-center gap-4 flex-1 order-3 sm:order-2 w-full justify-center" dir="ltr">
          <button onClick={handlePrev} disabled={currentIndex <= 0} className="disabled:opacity-30 hover:scale-110 transition-transform">
            <SkipBack size={20} />
          </button>
          
          <button onClick={togglePlay} className="w-10 h-10 rounded-full bg-gold text-dark flex items-center justify-center hover:scale-105 transition-transform" disabled={isLoadingTts}>
            {isLoadingTts ? <Loader2 size={18} className="animate-spin" /> : (isPlaying ? <Pause size={20} /> : <Play size={20} className="ml-1" />)}
          </button>
          
          <button onClick={handleNext} disabled={currentIndex >= sentences.length - 1} className="disabled:opacity-30 hover:scale-110 transition-transform">
            <SkipForward size={20} />
          </button>
        </div>

        <div className="order-2 sm:order-3">
          <button 
            onClick={toggleSpeed}
            className={`px-3 py-1 rounded-full text-xs font-bold font-sans transition-colors ${readTheme === 'dark' ? 'bg-dark/50 border border-border/50 text-gold' : 'bg-black/10 text-current border border-black/10'}`}
          >
            {playbackSpeed}x
          </button>
        </div>
      </div>
      
      {ttsError && (
        <div className="text-red-500 font-bold text-center text-xs sm:text-sm px-2 py-2 border border-red-500/20 bg-red-500/10 rounded-lg">
          {ttsError}
        </div>
      )}

      <div className={`${fontFamily} leading-[2.2] whitespace-pre-wrap text-justify transition-all duration-300`} style={{ fontSize: `${fontSize}px` }} dir={language === 'ar' ? 'rtl' : 'ltr'}>
        {sentences.map((sentence, idx) => (
          <span key={idx} className={`transition-colors duration-300 ${idx === currentIndex ? getHighlightClass() : ''}`}>
            {sentence}
          </span>
        ))}
      </div>

      {story.lessons && story.lessons.length > 0 && (
        <div className={`mt-4 border rounded-xl p-5 ${readTheme === 'dark' ? 'bg-dark/50 border-border/50' : 'bg-black/5 border-black/10'}`}>
          <h4 className={`font-bold text-base mb-4 flex items-center gap-2 ${readTheme === 'dark' ? 'text-gold' : 'text-current'}`}>
            <BookOpen size={18} />
            {language === 'ar' ? 'الدروس والعبر المستفادة:' : 'Lessons and Insights:'}
          </h4>
          <ul className={`list-disc list-inside space-y-3 leading-relaxed ${fontFamily}`} style={{ fontSize: `${Math.max(14, fontSize - 2)}px` }}>
            {story.lessons.map((lesson, i) => (
              <li key={i}>{lesson}</li>
            ))}
          </ul>
        </div>
      )}
    </motion.div>
  );
}
