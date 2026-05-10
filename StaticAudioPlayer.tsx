import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, SkipForward, SkipBack, Loader2 } from 'lucide-react';
import { useTranslation } from './i18n';

interface StaticAudioPlayerProps {
  url: string;
  title: string;
}

export function StaticAudioPlayer({ url, title }: StaticAudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { language } = useTranslation();

  useEffect(() => {
    if (!url) return;
    
    // Stop previous audio
    if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
    }

    const audio = new Audio(url);
    audioRef.current = audio;
    setIsPlaying(false);
    setProgress(0);
    setIsLoading(false);

    const handleTimeUpdate = () => {
      setProgress((audio.currentTime / audio.duration) * 100);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setProgress(0);
    };

    const handleLoadedData = () => {
      setIsLoading(false);
    };

    const handleWaiting = () => {
      setIsLoading(true);
    };

    const handlePlaying = () => {
      setIsLoading(false);
    };

    const handleError = () => {
      setIsLoading(false);
      setIsPlaying(false);
      console.error("Audio error");
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('loadeddata', handleLoadedData);
    audio.addEventListener('waiting', handleWaiting);
    audio.addEventListener('playing', handlePlaying);
    audio.addEventListener('error', handleError);

    return () => {
      audio.pause();
      audio.src = '';
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('loadeddata', handleLoadedData);
      audio.removeEventListener('waiting', handleWaiting);
      audio.removeEventListener('playing', handlePlaying);
      audio.removeEventListener('error', handleError);
    };
  }, [url]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      setIsLoading(true);
      audioRef.current.play().catch(e => {
        console.error("Audio play error", e);
        setIsLoading(false);
        setIsPlaying(false);
      });
      setIsPlaying(true);
    }
  };

  const skip = (seconds: number) => {
    if (!audioRef.current) return;
    audioRef.current.currentTime += seconds;
  };
  
  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    const newTime = percentage * audioRef.current.duration;
    if (!isNaN(newTime)) {
      audioRef.current.currentTime = newTime;
      setProgress((newTime / audioRef.current.duration) * 100);
    }
  };

  if (!url) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-dark/95 backdrop-blur-xl border-t border-gold/30 p-2 pb-[env(safe-area-inset-bottom)] z-[100] shadow-[0_-10px_40px_rgba(0,0,0,0.5)] transition-transform duration-300">
       <div className="max-w-md mx-auto flex flex-col gap-2 p-2 pb-20">
         <div className="flex items-center justify-between px-2 text-gold">
            <span className="text-xs font-bold truncate">
               {title}
            </span>
         </div>
         
         <div className="px-2">
            <div 
               className="w-full h-2 bg-black/30 rounded-full overflow-hidden cursor-pointer"
               onClick={handleProgressClick}
            >
               <div className="h-full bg-gold transition-all duration-300" style={{ width: `${progress}%` }} />
            </div>
         </div>

         <div className="flex items-center justify-center gap-8 mt-1">
            <button
                onClick={() => skip(-10)}
                className="text-gold/70 hover:text-gold transition-colors flex items-center justify-center"
            >
                <SkipBack size={24} className="rtl:rotate-180" />
                <span className="text-[10px] absolute mt-8 ml-1 rtl:mr-1 font-bold">-10</span>
            </button>

            <button
                onClick={togglePlay}
                className="w-14 h-14 bg-gold text-dark rounded-full flex items-center justify-center hover:scale-105 transition-transform"
            >
                {isLoading ? <Loader2 size={24} className="animate-spin" /> : (isPlaying ? <Pause size={28} /> : <Play size={28} className="translate-x-0.5 rtl:-translate-x-0.5" />)}
            </button>

            <button
                onClick={() => skip(10)}
                className="text-gold/70 hover:text-gold transition-colors flex items-center justify-center"
            >
                <SkipForward size={24} className="rtl:rotate-180" />
                <span className="text-[10px] absolute mt-8 mr-1 rtl:ml-1 font-bold">+10</span>
            </button>
         </div>
       </div>
    </div>
  );
}
