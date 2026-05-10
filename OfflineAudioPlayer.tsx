import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, SkipForward, SkipBack } from 'lucide-react';

interface OfflineAudioPlayerProps {
  items: string[];
  language: string;
}

export function OfflineAudioPlayer({ items, language }: OfflineAudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const synth = window.speechSynthesis;

  useEffect(() => {
    return () => {
      synth.cancel();
    };
  }, []);

  const playItem = (index: number) => {
    if (index >= items.length || index < 0) {
      setIsPlaying(false);
      setCurrentIndex(-1);
      return;
    }
    
    synth.cancel();
    setCurrentIndex(index);
    setIsPlaying(true);

    const utterance = new SpeechSynthesisUtterance(items[index]);
    utterance.lang = language === 'ar' ? 'ar-SA' : 'en-US';
    utterance.rate = 0.9; // Slightly slower for better recitation feel
    
    // Attempt to pick a male voice or the default device voice
    const voices = synth.getVoices();
    const arVoices = voices.filter(v => v.lang.startsWith('ar'));
    if (arVoices.length > 0) {
        const preferred = arVoices.find(v => v.name.toLowerCase().includes('maged') || v.name.toLowerCase().includes('tariq')) || arVoices[0];
        utterance.voice = preferred;
    }

    utterance.onend = () => {
      // Small delay between items
      setTimeout(() => {
         if (isPlaying) {
             playItem(index + 1);
         }
      }, 1000);
    };
    
    utterance.onerror = (e) => {
       console.error("Speech synthesis error", e);
       setIsPlaying(false);
    };

    synth.speak(utterance);
  };

  const togglePlay = () => {
    if (isPlaying) {
      synth.cancel();
      setIsPlaying(false);
    } else {
      playItem(currentIndex === -1 ? 0 : currentIndex);
    }
  };

  const handleNext = () => {
    if (currentIndex < items.length - 1) {
      playItem(currentIndex + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      playItem(currentIndex - 1);
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-dark/95 backdrop-blur-xl border-t border-gold/30 p-2 pb-[env(safe-area-inset-bottom)] z-[100] shadow-[0_-10px_40px_rgba(0,0,0,0.5)] transition-transform duration-300">
       <div className="max-w-md mx-auto flex flex-col gap-1 p-2 pb-20">
         <div className="flex items-center justify-between px-2 text-gold">
            <span className="text-[10px] font-bold">
               {currentIndex >= 0 ? `${currentIndex + 1} / ${items.length}` : (language === 'ar' ? 'القارئ الصوتي التلقائي' : 'Offline Audio Reader')}
            </span>
            <span className="text-[10px] bg-dark border border-gold/30 px-2 rounded opacity-50">
               {language === 'ar' ? 'سريع ومجاني دائماً' : 'Instant & Free forever'}
            </span>
         </div>

         <div className="flex items-center justify-center gap-6 mt-1">
            <button
                onClick={handlePrev}
                disabled={currentIndex <= 0}
                className="text-gold/70 hover:text-gold disabled:opacity-30 disabled:pointer-events-none transition-colors"
                title={language === 'ar' ? 'السابق' : 'Previous'}
            >
                <SkipBack size={20} className="rtl:rotate-180" />
            </button>

            <button
                onClick={togglePlay}
                className="w-12 h-12 bg-gold text-dark rounded-full flex items-center justify-center hover:scale-105 transition-transform"
                title={isPlaying ? (language === 'ar' ? 'إيقاف' : 'Pause') : (language === 'ar' ? 'تشغيل' : 'Play')}
            >
                {isPlaying ? <Pause size={24} /> : <Play size={24} className="translate-x-0.5 rtl:-translate-x-0.5" />}
            </button>

            <button
                onClick={handleNext}
                disabled={currentIndex >= items.length - 1 && currentIndex !== -1}
                className="text-gold/70 hover:text-gold disabled:opacity-30 disabled:pointer-events-none transition-colors"
                title={language === 'ar' ? 'التالي' : 'Next'}
            >
                <SkipForward size={20} className="rtl:rotate-180" />
            </button>
         </div>
       </div>
    </div>
  );
}
