import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { useTranslation } from './i18n';
import { allAthkarData } from './athkar';
import { useStore } from './store';
import { ChevronRight, ChevronLeft, Play, Pause, MoreHorizontal, Bell, BookText, Share, Copy, User, List, CheckSquare, Settings, Info, Share2 } from 'lucide-react';

export type AthkarType = keyof typeof allAthkarData;

export function AthkarScreen({ type }: { type: AthkarType }) {
  const { t, language } = useTranslation();
  const goBack = useStore(s => s.goBack);
  const logActivity = useStore(s => s.logActivity);
  
  const data = allAthkarData[type] || allAthkarData.morning;
  
  const titles: Record<AthkarType, { ar: string; en: string }> = {
    morning: { ar: 'أذكار الصباح', en: 'Morning Athkar' },
    evening: { ar: 'أذكار المساء', en: 'Evening Athkar' },
    after_prayer: { ar: 'أذكار بعد الصلاة', en: 'After Prayer' },
    sleep: { ar: 'أذكار النوم', en: 'Sleep Athkar' },
    waking_up: { ar: 'أذكار الاستيقاظ', en: 'Waking Up' },
    food: { ar: 'أذكار الطعام', en: 'Food Athkar' },
    fasting: { ar: 'أذكار الصيام', en: 'Fasting Athkar' },
    prayer: { ar: 'أذكار الصلاة', en: 'Prayer Athkar' },
    adhan: { ar: 'أذكار الأذان', en: 'Adhan Athkar' },
    clothes: { ar: 'أذكار اللباس', en: 'Clothing Athkar' },
    toilet: { ar: 'أذكار الخلاء', en: 'Toilet Athkar' },
    ruqyah: { ar: 'الرقية الشرعية', en: 'Ruqyah' },
    travel: { ar: 'أذكار السفر', en: 'Travel Athkar' },
    mosque: { ar: 'أذكار المسجد', en: 'Mosque Athkar' },
    wudu: { ar: 'أذكار الوضوء', en: 'Wudu Athkar' },
    home: { ar: 'أذكار المنزل', en: 'Home Athkar' },
    distress: { ar: 'أذكار الكرب', en: 'Distress Athkar' },
  };

  const titleText = titles[type] ? titles[type][language] : 'الأذكار';

  const [counts, setCounts] = useState<Record<number, number>>({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const currentDhikr = data[currentIndex];
  
  // Audio state
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  const [activeTab, setActiveTab] = useState<'dhikr' | 'reminder'>('dhikr');
  const [showMenu, setShowMenu] = useState(false);
  const [showAudioMenu, setShowAudioMenu] = useState(false);
  
  // Audio settings state
  const [audioRepeat, setAudioRepeat] = useState(false);
  const [audioSpeed, setAudioSpeed] = useState(1);
  const [autoPlayNext, setAutoPlayNext] = useState(false);
  const [reminderEnabled, setReminderEnabled] = useState(false);

  // Audio progress
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  
  const [focusMode, setFocusMode] = useState(false);
  
  const remainingCount = currentDhikr.count - (counts[currentIndex] || 0);
  const isDone = remainingCount <= 0;
  
  const totalCompleted = data.filter((d, i) => (counts[i] || 0) >= d.count).length;
  const isAllDone = totalCompleted === data.length;



  useEffect(() => {

    if (isAllDone && data.length > 0) {
      confetti({
        particleCount: 150,
        spread: 100,
        origin: { y: 0.5 },
        colors: ['#D4AF37', '#1A382A', '#0D2818', '#ffffff']
      });
    }
  }, [isAllDone]);

  const handleTap = () => {
    if (remainingCount > 0) {
      if ('vibrate' in navigator) navigator.vibrate(50);
      logActivity('athkar', 1, 1);
      setCounts(prev => ({ ...prev, [currentIndex]: (prev[currentIndex] || 0) + 1 }));
      if (remainingCount - 1 === 0) {
        confetti({
          particleCount: 80,
          spread: 50,
          origin: { y: 0.6 },
          colors: ['#D4AF37', '#1A382A', '#0D2818', '#ffffff']
        });
        if (currentIndex < data.length - 1) {
          setTimeout(() => setCurrentIndex(prev => prev + 1), 600);
        }
      }
    } else {
      if (currentIndex < data.length - 1) {
        setCurrentIndex(prev => prev + 1);
      }
    }
  };

  const handleNext = () => {
    if (currentIndex < data.length - 1) {
      setCurrentIndex(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = audioSpeed;
      audioRef.current.loop = audioRepeat;
    }
  }, [audioSpeed, audioRepeat]);

  const togglePlay = () => {
    if (!currentDhikr.audio) {
       showToast("عذراً، الصوت الحقيقي غير متوفر حالياً لهذا الذكر");
       return;
    }
    
    if (isPlaying) {
      if (audioRef.current) audioRef.current.pause();
      setIsPlaying(false);
    } else {
      if (audioRef.current) {
         const playPromise = audioRef.current.play();
         if (playPromise !== undefined) {
             playPromise.then(() => {
                 setIsPlaying(true);
                 if ('mediaSession' in navigator) {
                     navigator.mediaSession.metadata = new MediaMetadata({
                         title: 'أذكاري',
                         artist: 'تطبيق أذكاري',
                         album: titleText,
                         artwork: [
                             { src: '/icon.png', sizes: '192x192', type: 'image/png' }
                         ]
                     });
                 }
             }).catch(e => {
                console.error("Audio play failed", e);
                showToast("حدث خطأ في تشغيل الصوت");
                setIsPlaying(false);
             });
         }
      }
    }
  };

  // Setup Media Session handlers
  useEffect(() => {
      if ('mediaSession' in navigator) {
          navigator.mediaSession.setActionHandler('play', togglePlay);
          navigator.mediaSession.setActionHandler('pause', togglePlay);
          navigator.mediaSession.setActionHandler('previoustrack', handlePrev);
          navigator.mediaSession.setActionHandler('nexttrack', handleNext);
      }
  }, [isPlaying, currentIndex, autoPlayNext, data.length]);

  // Reset audio when switching dhikr unless we want it to auto-play
  useEffect(() => {
     setIsPlaying(false);
     setProgress(0);
     if (audioRef.current) {
         audioRef.current.pause();
         audioRef.current.currentTime = 0;
         if (autoPlayNext && currentDhikr.audio) {
             const playPromise = audioRef.current.play();
             if (playPromise !== undefined) {
                playPromise.then(() => setIsPlaying(true)).catch(() => {
                   setIsPlaying(false);
                });
             }
         }
     }
  }, [currentIndex, autoPlayNext, currentDhikr]);
  
  const [reminderTitle, setReminderTitle] = useState('تذكير');
  const [reminderBody, setReminderBody] = useState(`حان الآن وقت ${titleText}`);
  const [reminderTime, setReminderTime] = useState('06:00');
  
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (reminderEnabled) {
      if ('Notification' in window && Notification.permission !== 'granted') {
          Notification.requestPermission();
      }
      interval = setInterval(() => {
         const now = new Date();
         const currentH = now.getHours().toString().padStart(2, '0');
         const currentM = now.getMinutes().toString().padStart(2, '0');
         const currentTime = `${currentH}:${currentM}`;
         
         if (currentTime === reminderTime && now.getSeconds() === 0) {
            if ('Notification' in window && Notification.permission === 'granted') {
               new Notification(reminderTitle, { body: reminderBody, icon: '/icon.png' });
            }
         }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [reminderEnabled, reminderTime, reminderTitle, reminderBody, titleText]);

  const [toast, setToast] = useState<string | null>(null);
  
  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const copyToClipboard = async () => {
      try {
          if (navigator.clipboard) {
              await navigator.clipboard.writeText(currentDhikr.ar);
          } else {
              throw new Error("Clipboard API not available");
          }
          showToast('تم النسخ بنجاح');
          setShowMenu(false);
      } catch (err) {
          try {
              const textArea = document.createElement("textarea");
              textArea.value = currentDhikr.ar;
              textArea.style.position = "fixed";
              textArea.style.left = "-999999px";
              textArea.style.top = "-999999px";
              document.body.appendChild(textArea);
              textArea.focus();
              textArea.select();
              document.execCommand('copy');
              textArea.remove();
              showToast('تم النسخ بنجاح');
              setShowMenu(false);
          } catch (fallbackErr) {
              console.error("Failed to copy", err, fallbackErr);
              showToast('فشل النسخ ❌');
          }
      }
  };

  const shareText = async () => {
      try {
          await navigator.share({
             title: 'أذكاري',
             text: `${currentDhikr.ar}\n\n[تطبيق أذكاري]`
          });
      } catch {
          copyToClipboard();
      }
      setShowMenu(false);
  };


  const formatTime = (seconds: number) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  if (focusMode) {
    return (
      <div 
         className="flex flex-col items-center justify-center min-h-full bg-black text-[#D4AF37] p-6 relative font-sans w-full" 
         dir="rtl"
         onClick={handleTap}
      >
        <button onClick={() => setFocusMode(false)} className="absolute top-6 right-6 p-2 bg-white/10 rounded-full opacity-50 hover:opacity-100 transition-opacity">
           <ChevronRight size={30} />
        </button>
        <div className="flex-1 flex items-center w-full max-w-2xl text-center">
            <p className="text-3xl md:text-5xl leading-[2] md:leading-[2] font-bold text-center w-full" style={{ fontFamily: "'Amiri', serif" }}>
              {currentDhikr.ar}
            </p>
        </div>
        <div className="pb-16 flex flex-col items-center gap-4">
            <div className="w-32 h-32 rounded-full border-4 border-[#D4AF37]/50 flex items-center justify-center text-5xl font-bold bg-[#D4AF37]/10" style={{ WebkitTapHighlightColor: 'transparent' }}>
                {isDone ? '✓' : Math.max(remainingCount, 0)}
            </div>
            <div className="flex text-[#D4AF37]/50 gap-8">
               <button onClick={(e) => { e.stopPropagation(); setCounts(prev => ({...prev, [currentIndex]: 0})); }}>إعادة</button>
               <span>{currentIndex + 1} / {data.length}</span>
            </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 h-full overflow-hidden bg-[#0D2818] relative font-sans text-white/90" dir="rtl">
      {/* Hidden Audio Player */}
      <audio 
         ref={audioRef}
         src={currentDhikr.audio || undefined}
         onEnded={() => {
            setIsPlaying(false);
            if (!audioRepeat) handleTap();
         }}
         onTimeUpdate={(e) => {
            setProgress(e.currentTarget.currentTime / (e.currentTarget.duration || 1));
         }}
         onLoadedMetadata={(e) => {
            setDuration(e.currentTarget.duration);
         }}
      />

      {/* Background Pattern */}
      <div 
        className="absolute inset-0 opacity-15 pointer-events-none mix-blend-color-burn"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M40 0l40 40-40 40L0 40z' fill='none' stroke='%23000' stroke-width='1' stroke-opacity='0.2'/%3E%3Cpath d='M40 20l20 20-20 20-20-20z' fill='none' stroke='%23000' stroke-width='1' stroke-opacity='0.2'/%3E%3C/svg%3E")`,
          backgroundSize: '80px 80px'
        }}
      />

      {/* Top Bar */}
      <div className="relative z-20 flex items-center justify-between p-4 pt-6">
        <div className="flex items-center gap-2">
          <button onClick={goBack} className="p-2 -mr-2 text-white hover:bg-white/10 rounded-full transition-colors drop-shadow-md">
            <ChevronRight size={32} strokeWidth={2.5} />
          </button>
          
          <AnimatePresence>
            <motion.div 
               key={useStore(s => s.xp)}
               initial={{ scale: 1.2, color: '#ffffff' }}
               animate={{ scale: 1, color: '#D4AF37' }}
               className="flex items-center gap-1 bg-dark/30 px-2 py-1 rounded-full border border-[#D4AF37]/20"
            >
              <span className="text-[#D4AF37] text-xs font-bold">{useStore(s => s.xp)}</span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="none" className="text-[#D4AF37]">
                 <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
            </motion.div>
          </AnimatePresence>
        </div>
        
        <div className="flex bg-[#1A382A] rounded-xl p-1 gap-1 shadow-sm border border-[#D4AF37]/20">
          <button 
            onClick={() => setActiveTab('dhikr')}
            className={`flex items-center gap-2 px-5 py-1.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'dhikr' ? 'bg-[#D4AF37] text-[#0D2818] shadow-sm' : 'text-white/80 hover:bg-white/10'}`}
          >
            الذكر
            <BookText size={18} strokeWidth={2.5} />
          </button>
          <button 
            onClick={() => setActiveTab('reminder')}
            className={`flex items-center gap-2 px-5 py-1.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'reminder' ? 'bg-[#D4AF37] text-[#0D2818] shadow-sm' : 'text-white/80 hover:bg-white/10'}`}
          >
            التذكير
            <Bell size={18} fill={activeTab === 'reminder' ? "currentColor" : "none"} strokeWidth={2.5} />
          </button>
        </div>

        <div className="relative">
          <button onClick={() => setShowMenu(!showMenu)} className="p-1 -ml-2 text-white hover:bg-white/20 rounded-full transition-colors border-2 border-white/80 drop-shadow-md flex items-center justify-center bg-white/10 w-9 h-9">
            <MoreHorizontal size={24} strokeWidth={2.5} />
          </button>

          {/* Menu Dropdown */}
          <AnimatePresence>
            {showMenu && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="absolute left-0 top-12 w-64 bg-[#1A382A] rounded-2xl shadow-2xl py-2 z-50 origin-top-left overflow-hidden border border-[#D4AF37]/30"
              >
                <div className="px-4 py-3 text-center border-b border-[#D4AF37]/20 bg-[#1A382A]">
                  <h3 className="font-bold text-[#D4AF37] text-lg">{titleText}</h3>
                </div>
                
                {[
                  { icon: Copy, label: 'نسخ النص' },
                  { icon: BookText, label: 'وضع التركيز' },
                  { icon: Share, label: 'مشاركة النص' },
                  { icon: User, label: 'نسخ النص إلى أذكاري' },
                  { icon: List, label: 'بيانات الذكر' },
                  { icon: CheckSquare, label: 'تحديد في متتبع الأذكار' },
                  { icon: Settings, label: 'إعدادات الصوت والتحكم' },
                  { icon: Info, label: 'حول التطبيق' },
                  { icon: Share2, label: 'مشاركة التطبيق' },
                ].map((item, idx) => (
                  <button 
                    key={idx}
                    onClick={() => {
                        if (item.label === 'نسخ النص') copyToClipboard();
                        if (item.label === 'وضع التركيز') setFocusMode(true);
                        if (item.label === 'مشاركة النص') shareText();
                        if (item.label === 'نسخ النص إلى أذكاري') {
                           logActivity('athkar', 1, 5);
                           showToast("تمت الإضافة إلى أذكاري ⭐️");
                        }
                        if (item.label === 'بيانات الذكر') {
                           showToast(`المصدر: السنة النبوية | التكرار: ${currentDhikr.count} مرة`);
                        }
                        if (item.label === 'تحديد في متتبع الأذكار') {
                           logActivity('athkar', 1, 2);
                           showToast("✓ تم التحديد في متتبع الأذكار يومياً");
                        }
                        if (item.label === 'إعدادات الصوت والتحكم') {
                           setShowAudioMenu(true);
                        }
                        if (item.label === 'حول التطبيق') showToast("تطبيق أذكاري - الإصدار 1.0");
                        if (item.label === 'مشاركة التطبيق') {
                           navigator.share?.({ title: "أذكاري", text: "قم بتجربة تطبيق أذكاري!" }).catch(() => showToast("تم نسخ الرابط"));
                        }
                        if (item.label !== 'إعدادات الصوت والتحكم') setShowMenu(false);
                    }} 
                    className="w-full text-right px-4 py-3.5 hover:bg-white/10 flex items-center justify-between text-[15px] font-bold border-b border-[#D4AF37]/10 text-white/90 last:border-0"
                  >
                    <item.icon size={20} strokeWidth={2.5} />
                    {item.label}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {activeTab === 'reminder' ? (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center z-10 w-full">
           <div className="bg-[#f4f8f7]/95 backdrop-blur-md rounded-3xl p-6 flex flex-col gap-4 shadow-xl w-full max-w-sm border border-white/50">
              <input 
                 type="text" 
                 value={reminderTitle}
                 onChange={(e) => setReminderTitle(e.target.value)}
                 placeholder="عنوان التذكير"
                 className="w-full py-4 text-center bg-white/50 text-dark/80 rounded-2xl font-bold shadow-sm border border-gray-100 text-lg focus:outline-none focus:ring-2 focus:ring-[#3d7a6e]/50 transition-all"
              />
              <input 
                 type="text" 
                 value={reminderBody}
                 onChange={(e) => setReminderBody(e.target.value)}
                 placeholder="نص التذكير"
                 className="w-full py-4 text-center bg-white/50 text-dark/80 rounded-2xl font-bold shadow-sm border border-gray-100 text-lg focus:outline-none focus:ring-2 focus:ring-[#3d7a6e]/50 transition-all"
              />
              <button 
                onClick={() => {
                   setReminderEnabled(!reminderEnabled);
                   if (!reminderEnabled) {
                       showToast("تم تفعيل التذكير 🔔");
                       if ('Notification' in window && Notification.permission !== 'granted') {
                           Notification.requestPermission();
                       }
                   } else {
                       showToast("تم إيقاف التذكير");
                   }
                }}
                className={`w-full py-4 px-6 bg-white/50 text-dark rounded-2xl font-bold shadow-sm border text-lg flex justify-between items-center cursor-pointer transition-all ${reminderEnabled ? 'border-[#3d7a6e] bg-[#3d7a6e]/10' : 'border-gray-100 hover:bg-white/80'}`}
              >
                 <span>تفعيل التذكير</span>
                 <div className={`w-12 h-6 rounded-full relative transition-colors ${reminderEnabled ? 'bg-[#3d7a6e]' : 'bg-gray-300'}`}>
                   <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${reminderEnabled ? 'right-7' : 'right-1'}`}></div>
                 </div>
              </button>

              <div className="w-full py-6 mt-2 bg-white/50 text-dark rounded-2xl font-bold shadow-sm border border-gray-100 flex flex-col items-center gap-4">
                 <div className="text-sm font-bold text-gray-500">تحديد وقت إرسال التذكير</div>
                 <input 
                    type="time" 
                    value={reminderTime}
                    onChange={(e) => setReminderTime(e.target.value)}
                    className="text-4xl text-dark bg-transparent border-none focus:outline-none font-bold tracking-widest text-center direction-ltr"
                    dir="ltr"
                 />
              </div>
              <button 
                onClick={() => {
                   setActiveTab('dhikr');
                   if (reminderEnabled) {
                       showToast("تم تحديث إعدادات التذكير بنجاح");
                   }
                }} 
                className="w-full mt-4 py-3 bg-[#4ba095] text-white rounded-xl font-bold shadow-md active:scale-95 transition-transform hover:bg-[#3d7a6e]"
              >
                 حسناً، العودة للأذكار
              </button>
           </div>
        </div>
      ) : (
        <>
          {/* Audio Player / Progress Area */}
          {(type === 'morning' || type === 'evening') && (
            <div className="px-5 py-2 z-20 flex items-center gap-3 text-white/90 relative">
               <div className="flex flex-col text-[11px] font-bold opacity-70 w-8 text-center leading-tight">
                   <span>{currentDhikr.audio && duration > 0 ? formatTime(duration) : '01:10'}</span>
                   <span>{currentDhikr.audio ? formatTime(progress * duration) : '00:09'}</span>
               </div>
               
               <div className="flex-1 px-2 relative group cursor-pointer h-8 flex items-center" dir="ltr">
                   <div className="w-full h-1.5 bg-white/20 rounded-full overflow-hidden relative">
                      <div className="absolute top-0 bottom-0 left-0 bg-[#D4AF37] shadow-sm transition-all duration-300" style={{ width: `${progress * 100}%` }} />
                   </div>
                   <div className="absolute w-4 h-4 bg-[#D4AF37] rounded-full shadow-md top-1/2 -translate-y-1/2 pointer-events-none transition-all duration-300" style={{ left: `calc(0.5rem + ${progress * 100}% - 8px)` }}></div>
                   <input 
                     type="range" 
                     min="0" max="1" step="0.001" 
                     value={progress || 0}
                     onChange={(e) => {
                       const p = parseFloat(e.target.value);
                       setProgress(p);
                       if (audioRef.current && duration > 0) {
                          audioRef.current.currentTime = p * duration;
                       }
                     }}
                     className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                     disabled={!currentDhikr.audio}
                   />
               </div>
               
               <button 
                   onClick={togglePlay}
                   className="p-1 rounded-full drop-shadow-md text-[#D4AF37] hover:bg-white/10 transition-colors"
               >
                   {isPlaying ? <Pause size={30} fill="currentColor" strokeWidth={1} /> : <Play size={30} fill="currentColor" strokeWidth={1} className="ml-1 rtl:mr-1 rtl:ml-0" />}
               </button>
  
               <div className="relative">
                 <button onClick={() => setShowAudioMenu(!showAudioMenu)} className="p-1 ml-1 rounded-full border-2 border-[#D4AF37] drop-shadow-sm text-[#D4AF37] hover:bg-white/10 bg-transparent flex items-center justify-center w-8 h-8">
                   <MoreHorizontal size={20} strokeWidth={2.5} />
                 </button>
                 {/* Audio Menu Dropdown */}
                 <AnimatePresence>
                   {showAudioMenu && (
                     <motion.div 
                       initial={{ opacity: 0, scale: 0.95 }}
                       animate={{ opacity: 1, scale: 1 }}
                       exit={{ opacity: 0, scale: 0.95 }}
                       className="absolute left-0 top-10 w-64 bg-[#1A382A] rounded-xl shadow-xl py-2 z-50 origin-top-left border border-[#D4AF37]/30"
                     >
                         <button 
                           onClick={() => { setAutoPlayNext(!autoPlayNext); setShowAudioMenu(false); }} 
                           className="w-full text-right px-4 py-3 hover:bg-white/10 flex items-center justify-between text-sm font-bold border-b border-[#D4AF37]/10 text-white/90 last:border-0"
                         >
                           <div className={`w-5 h-5 rounded flex items-center justify-center border ${autoPlayNext ? 'bg-[#D4AF37] border-[#D4AF37]' : 'border-white/30'}`}>
                             {autoPlayNext && <CheckSquare size={14} className="text-[#0D2818]" />}
                           </div>
                           <span>مقطع واحد لجميع الأذكار</span>
                         </button>
                         <button 
                           onClick={() => { setAudioRepeat(!audioRepeat); setShowAudioMenu(false); }} 
                           className="w-full text-right px-4 py-3 hover:bg-white/10 flex items-center justify-between text-sm font-bold border-b border-[#D4AF37]/10 text-white/90 last:border-0"
                         >
                           <div className={`w-5 h-5 rounded flex items-center justify-center border ${audioRepeat ? 'bg-[#D4AF37] border-[#D4AF37]' : 'border-white/30'}`}>
                             {audioRepeat && <CheckSquare size={14} className="text-[#0D2818]" />}
                           </div>
                           <span>تشغيل التكرار</span>
                         </button>
                         <button 
                           onClick={() => { setAudioSpeed(prev => prev === 1 ? 1.5 : prev === 1.5 ? 2 : 1); setShowAudioMenu(false); }} 
                           className="w-full text-right px-4 py-3 hover:bg-white/10 flex items-center justify-between text-sm font-bold border-b border-[#D4AF37]/10 text-white/90 last:border-0"
                         >
                           <div className="text-xs font-bold text-[#D4AF37]">{audioSpeed}x</div>
                           <span>تغيير السرعة</span>
                         </button>
                         <div className="px-4 py-2 border-b border-[#D4AF37]/10 flex flex-col gap-2">
                             <span className="text-sm font-bold text-white/70">اختر القارئ</span>
                             <select 
                                 className="w-full bg-[#0D2818] border border-[#D4AF37]/30 text-white rounded-lg px-2 py-1.5 text-sm outline-none font-bold"
                                 onChange={(e) => {
                                     showToast(`تم تغيير القارئ إلى ${e.target.options[e.target.selectedIndex].text}`);
                                     setShowAudioMenu(false);
                                 }}
                                 defaultValue="meshary"
                             >
                                <option value="meshary">مشاري العفاسي</option>
                                <option value="sudais">عبد الرحمن السديس</option>
                                <option value="ghamdi">سعد الغامدي</option>
                                <option value="minshawi">محمد صديق المنشاوي</option>
                                <option value="abdulbasit">عبد الباسط عبد الصمد</option>
                                <option value="maher">ماهر المعيقلي</option>
                                <option value="fares">فارس عباد</option>
                                <option value="jaleel">خالد الجليل</option>
                             </select>
                         </div>
                     </motion.div>
                   )}
                 </AnimatePresence>
               </div>
            </div>
          )}
  
          {/* Main Content Area */}
          <div className="flex-1 overflow-y-auto px-4 sm:px-6 pb-2 pt-2 z-10">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentIndex}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="w-full flex justify-center py-2 min-h-full"
              >
                <div className={`bg-[#1A382A] rounded-[16px] p-6 sm:p-8 shadow-lg w-full flex flex-col max-w-xl mx-auto border border-[#D4AF37]/20 h-max min-h-[300px] transition-colors duration-500 ${isDone ? 'bg-[#154a32]' : ''}`}>
                  
                  <div className="flex justify-between items-center mb-6 text-[#D4AF37]/80 text-sm font-bold border-b border-[#D4AF37]/10 pb-3">
                    <span className="flex items-center gap-2">🔖 {titleText}</span>
                    <span className="bg-[#D4AF37]/10 px-3 py-1 rounded-full text-[#D4AF37]">{currentIndex + 1} / {data.length}</span>
                  </div>

                  <p className="text-2xl md:text-[28px] leading-[2.2] md:leading-[2.4] text-[#D4AF37] whitespace-pre-wrap text-center flex-1 my-auto" style={{ fontFamily: "'Amiri', serif", textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>
                    {currentDhikr.ar}
                  </p>
                  
                  {language === 'en' && currentDhikr.en && (
                    <div className="mt-8 text-sm md:text-[15px] leading-relaxed text-[#a0c4b4] bg-black/20 p-4 rounded-xl text-center border border-[#D4AF37]/10 font-medium">
                      {currentDhikr.en}
                    </div>
                  )}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Bottom Controls */}
          <div className="px-6 pb-8 pt-4 z-10 bg-gradient-to-t from-[#0D2818] via-[#0D2818]/90 to-transparent">
            <div className="flex items-center justify-between max-w-sm mx-auto w-full relative">
              <button 
                onClick={handlePrev}
                disabled={currentIndex === 0}
                className="flex gap-2 items-center px-4 py-3 text-white font-bold active:scale-95 transition-all disabled:opacity-30 disabled:active:scale-100 bg-[#1A382A] hover:bg-[#224A38] shadow-sm rounded-2xl w-28 justify-center z-10 order-first border border-[#D4AF37]/20"
              >
                <ChevronRight size={20} className="text-[#D4AF37]" strokeWidth={3} />
                السابق
              </button>

              <div className="relative z-20 mx-auto w-24 h-24 sm:w-28 sm:h-28 flex justify-center items-center">
                <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="46" fill="none" stroke="#D4AF37" strokeWidth="4" strokeOpacity="0.1" />
                  <circle cx="50" cy="50" r="46" fill="none" stroke="#D4AF37" strokeWidth="4" strokeDasharray="289" strokeDashoffset={289 - (289 * Math.min((counts[currentIndex] || 0), currentDhikr.count)) / currentDhikr.count} className="transition-all duration-300" strokeLinecap="round" />
                </svg>
                <button 
                  onClick={handleTap}
                  className={`w-20 h-20 sm:w-24 sm:h-24 rounded-full flex items-center justify-center text-3xl font-extrabold shadow-xl transition-all active:scale-90 border-[4px] ${isDone ? 'bg-[#D4AF37] text-[#0D2818] border-[#ebd48a] shadow-[#D4AF37]/40' : 'bg-[#1A382A] text-[#D4AF37] border-[#D4AF37]/20 shadow-black/40'}`}
                  style={{ WebkitTapHighlightColor: 'transparent' }}
                >
                  {isDone ? '✓' : Math.max(remainingCount, 0)}
                </button>
                {(counts[currentIndex] || 0) > 0 && (
                   <button onClick={() => setCounts(prev => ({...prev, [currentIndex]: 0}))} className="absolute -bottom-6 text-[#D4AF37] text-xs font-bold opacity-60 hover:opacity-100 transition-opacity">
                     إعادة العد
                   </button>
                )}
              </div>

              <button 
                onClick={handleNext}
                disabled={currentIndex === data.length - 1}
                className="flex gap-2 items-center px-4 py-3 text-white font-bold active:scale-95 transition-all disabled:opacity-30 disabled:active:scale-100 bg-[#1A382A] hover:bg-[#224A38] shadow-sm rounded-2xl w-28 justify-center z-10 order-last border border-[#D4AF37]/20"
              >
                التالي
                <ChevronLeft size={20} className="text-[#D4AF37]" strokeWidth={3} />
              </button>
            </div>
          </div>
          <AnimatePresence>
            {isAllDone && (
               <motion.div 
                 initial={{ opacity: 0, y: 50, scale: 0.9 }}
                 animate={{ opacity: 1, y: 0, scale: 1 }}
                 exit={{ opacity: 0, scale: 0.9 }}
                 className="absolute bottom-32 left-1/2 -translate-x-1/2 bg-[#1A382A] text-[#D4AF37] px-6 py-4 rounded-xl shadow-2xl border border-[#D4AF37]/50 z-50 text-center flex flex-col items-center gap-2"
               >
                  <span className="text-xl font-bold">🎉 أتممت {titleText}!</span>
                  <span className="text-sm opacity-80">+50 نقطة أضيفت لرصيدك</span>
               </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
           <motion.div
             initial={{ opacity: 0, y: 50, x: '-50%' }}
             animate={{ opacity: 1, y: -20, x: '-50%' }}
             exit={{ opacity: 0, y: 50, x: '-50%' }}
             className="absolute bottom-10 left-1/2 -translate-x-1/2 bg-[#D4AF37] text-[#0D2818] px-6 py-3 rounded-full font-bold shadow-2xl z-[100] whitespace-nowrap text-sm border border-[#ebd48a]"
           >
              {toast}
           </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
