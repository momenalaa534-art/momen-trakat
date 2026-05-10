import React, { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useStore } from "../store";
import { JUZ_QUOTES } from "../data/juzQuotes";
import {
  ArrowLeft,
  ArrowRight,
  Loader2,
  BookmarkCheck,
  Play,
  Pause,
  Share2,
  Copy,
  BookOpen,
  Globe2,
  X,
  Download,
  Settings,
  List,
  ChevronLeft,
  ChevronRight,
  Check,
  Target,
  Repeat,
} from "lucide-react";
import { SURAHS } from "../data/quranSurahs";
import { useTranslation } from "../i18n";
import { renderTajweed } from "../utils/tajweedParser";

interface Ayah {
  number: number;
  text: string;
  numberInSurah: number;
  juz?: number;
  audio?: string;
}

import { ShareImageModal } from "../components/ShareImageModal";
import { fetchWithCache, downloadSurahAudio, checkSurahDownloaded } from "../utils/quranCache";

export function SurahScreen() {
  const selectedSurah = useStore((s) => s.selectedSurah);
  const quranBookmarks = useStore((s) => s.quranBookmarks);
  const setQuranBookmark = useStore((s) => s.setQuranBookmark);
  const selectedQuranReciter = useStore((s) => s.selectedQuranReciter);
  const setSelectedQuranReciter = useStore((s) => s.setSelectedQuranReciter);
  const goBack = useStore((s) => s.goBack);
  const navigate = useStore((s) => s.navigate);
  const showAlert = useStore((s) => s.showAlert);
  const logActivity = useStore((s) => s.logActivity);
  const { language } = useTranslation();

  // Settings
  const quranTheme = useStore((s) => s.quranTheme);
  const setQuranTheme = useStore((s) => s.setQuranTheme);
  const quranFont = useStore((s) => s.quranFont);
  const quranTajweed = useStore((s) => s.quranTajweed);
  const setQuranTajweed = useStore((s) => s.setQuranTajweed);
  const setSelectedSurah = useStore((s) => s.setSelectedSurah);
  const selectedAyahToScroll = useStore((s) => s.selectedAyahToScroll);
  const setSelectedAyahToScroll = useStore((s) => s.setSelectedAyahToScroll);
  const activeKhatmah = useStore((s) => s.activeKhatmah);
  const updateKhatmahProgress = useStore((s) => s.updateKhatmahProgress);
  const finishKhatmah = useStore((s) => s.finishKhatmah);

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

  const [ayahs, setAyahs] = useState<Ayah[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [hasCompleted, setHasCompleted] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState<number | null>(null);
  const [isDownloaded, setIsDownloaded] = useState(false);

  const [isPlaying, setIsPlaying] = useState(false);
  const [playingAyahIndex, setPlayingAyahIndex] = useState(-1);
  const [repeatCount, setRepeatCount] = useState(1);
  const [currentPlayCount, setCurrentPlayCount] = useState(1);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const preloadAudioRef = useRef<HTMLAudioElement | null>(null);
  const lastPlayedIndexRef = useRef<number>(-1);

  const [selectedAyah, setSelectedAyah] = useState<Ayah | null>(null);
  const [showMenu, setShowMenu] = useState(false);

  const [tafsirData, setTafsirData] = useState<string | null>(null);
  const [translationData, setTranslationData] = useState<Record<
    string,
    string
  > | null>(null);
  const [loadingExtras, setLoadingExtras] = useState(false);
  const [showTafsir, setShowTafsir] = useState(false);
  const [showTranslation, setShowTranslation] = useState(false);
  const [showShareCard, setShowShareCard] = useState(false);

  const [showSettings, setShowSettings] = useState(false);
  const [showFihris, setShowFihris] = useState(false);

  const [isAudioExpanded, setIsAudioExpanded] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);

  const surahInfo = SURAHS.find((s) => s.number === selectedSurah);
  const currentBookmark = selectedSurah ? quranBookmarks[selectedSurah] : null;
  const ayahRefs = useRef<Record<number, HTMLSpanElement | null>>({});

  useEffect(() => {
    if (!selectedSurah || !surahInfo) return;
    setLoading(true);
    setError("");
    setDownloadProgress(null);
    setIsPlaying(false);
    setPlayingAyahIndex(-1);
    lastPlayedIndexRef.current = -1;

    // Check if already downloaded
    checkSurahDownloaded(selectedSurah, audioReciter, surahInfo.ayahs).then(isCached => {
      setIsDownloaded(isCached);
    });

    // Fetch audio from selected reciter
    fetchWithCache(`https://api.alquran.cloud/v1/surah/${selectedSurah}/${audioReciter}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.code === 200) {
          // Fetch text from tajweed edition
          fetchWithCache(
            `https://api.alquran.cloud/v1/surah/${selectedSurah}/quran-tajweed`,
          )
            .then((res2) => res2.json())
            .then((data2) => {
              if (data2.code === 200) {
                const combined = data2.data.ayahs.map((a: any, i: number) => ({
                  ...a,
                  audio: data.data.ayahs[i].audio,
                }));
                setAyahs(combined);

                // If there's an ayah to scroll to, do it after a short delay
                if (selectedAyahToScroll) {
                  setTimeout(() => {
                    const el = ayahRefs.current[selectedAyahToScroll];
                    if (el) {
                      el.scrollIntoView({
                        behavior: "smooth",
                        block: "center",
                      });
                      // Add highlight effect
                      el.style.backgroundColor = "rgba(242, 185, 24, 0.4)";
                      setTimeout(() => {
                        el.style.backgroundColor = "";
                      }, 3000);
                    }
                    setSelectedAyahToScroll(null);
                  }, 500);
                }
              }
            });
        } else {
          setError(
            language === "ar" ? "فشل تحميل السورة" : "Failed to load Surah",
          );
        }
      })
      .catch((err) => {
        console.warn("Network error during Surah load:", err.message || err);
        setError(
          language === "ar"
            ? "تأكد من اتصالك بالإنترنت والتحميل المسبق للسورة"
            : "Check your internet connection and ensure the Surah is downloaded"
        );
      })
      .finally(() => {
        setLoading(false);
      });

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        const oldSrc = audioRef.current.getAttribute('data-object-url');
        if (oldSrc) {
          URL.revokeObjectURL(oldSrc);
          audioRef.current.removeAttribute('data-object-url');
        }
      }
    };
  }, [selectedSurah, language, audioReciter]);

  // Imperative player function
  const playAyah = (index: number) => {
    if (index < 0 || index >= ayahs.length) {
      setIsPlaying(false);
      setPlayingAyahIndex(-1);
      lastPlayedIndexRef.current = -1;
      return;
    }

    setPlayingAyahIndex(index);
    lastPlayedIndexRef.current = index;
    setCurrentPlayCount(1);
    setIsPlaying(true);

    const ayah = ayahs[index];
    if (ayah.audio && audioRef.current) {
      // If continuing same loaded ayah
      if (audioRef.current.src !== ayah.audio && !audioRef.current.src.endsWith(ayah.audio)) {
        audioRef.current.src = ayah.audio;
      }
      
      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch((e) => {
          console.warn("Audio play failed", e);
          setIsPlaying(false);
        });
      }

      // Preload next track
      if (index + 1 < ayahs.length && preloadAudioRef.current) {
        const nextAudio = ayahs[index + 1].audio;
        if (preloadAudioRef.current.src !== nextAudio && !preloadAudioRef.current.src.endsWith(nextAudio)) {
          preloadAudioRef.current.src = nextAudio;
        }
      }

      // Scroll to playing ayah
      setTimeout(() => {
        const el = ayahRefs.current[ayah.numberInSurah];
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }, 50);
    }
  };

  // Keep effect ONLY for syncing volume and other non-playback state if needed
  // Removed the auto-play sequence from useEffect to satisfy Safari auto-play policy
  
  const handleAudioEnd = () => {
    if (repeatCount === 0 || currentPlayCount < repeatCount) {
      setCurrentPlayCount((prev) => prev + 1);
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(console.warn);
      }
    } else {
      playAyah(playingAyahIndex + 1);
    }
  };

  const togglePlay = () => {
    if (isPlaying) {
      setIsPlaying(false);
      if (audioRef.current) audioRef.current.pause();
    } else {
      if (playingAyahIndex === -1) {
        playAyah(0);
      } else {
        setIsPlaying(true);
        if (audioRef.current) {
          audioRef.current.play().catch((e) => {
             console.warn("Audio resume failed", e);
             setIsPlaying(false);
          });
        }
      }
    }
  };

  const handleAyahClick = (ayah: Ayah) => {
    setSelectedAyah(ayah);
    setShowMenu(true);
  };

  const forcePlayAyah = (ayah: Ayah) => {
    const index = ayahs.findIndex((a) => a.number === ayah.number);
    if (index !== -1) {
      playAyah(index);
    }
  };

  const fetchTafsir = async (ayahNumber: number) => {
    setLoadingExtras(true);
    try {
      const res = await fetch(
        `https://api.alquran.cloud/v1/ayah/${ayahNumber}/ar.muyassar`,
      );
      const data = await res.json();
      if (data.code === 200) {
        setTafsirData(data.data.text);
      }
    } catch (e) {
      console.error(e);
    }
    setLoadingExtras(false);
  };

  const fetchTranslation = async (ayahNumber: number) => {
    setLoadingExtras(true);
    try {
      // Fetch English (sahih) and French (hamidullah)
      const resEn = await fetch(
        `https://api.alquran.cloud/v1/ayah/${ayahNumber}/en.sahih`,
      );
      const dataEn = await resEn.json();
      const resFr = await fetch(
        `https://api.alquran.cloud/v1/ayah/${ayahNumber}/fr.hamidullah`,
      );
      const dataFr = await resFr.json();

      setTranslationData({
        English: dataEn.data?.text || "Translation unavailable",
        French: dataFr.data?.text || "Traduction non disponible",
      });
    } catch (e) {
      console.error(e);
    }
    setLoadingExtras(false);
  };

  const handleCopy = () => {
    if (selectedAyah) {
      navigator.clipboard.writeText(
        `${selectedAyah.text} ﴿${selectedAyah.numberInSurah}﴾`,
      );
      showAlert(language === "ar" ? "تم النسخ" : "Copied");
      setShowMenu(false);
    }
  };

  const handleDownload = async () => {
    if (!selectedSurah || ayahs.length === 0) return;
    setDownloadProgress(0);
    await downloadSurahAudio(selectedSurah, audioReciter, ayahs, (progress) => {
      setDownloadProgress(progress);
    });
    setDownloadProgress(100);
    setIsDownloaded(true);
    setTimeout(() => setDownloadProgress(null), 2000);
  };

  const handleLogKhatmahTarget = (e: any, specificJuz?: number) => {
    if (e) e.stopPropagation();
    if (!activeKhatmah) return;

    const checkCanLogApp = () => {
      if (!activeKhatmah.lastLogDate) return true;
      const lastDate = new Date(activeKhatmah.lastLogDate).toDateString();
      const now = new Date().toDateString();
      return lastDate !== now;
    };
    
    if (!checkCanLogApp()) {
      showAlert(language === 'ar' ? 'لقد أتممت وردك اليوم، غداً يوم جديد مع القرآن الكريم 🌸' : 'You have completed today\'s target. A new day with the Quran awaits tomorrow 🌸');
      return;
    }

    const incrementAmount = activeKhatmah.totalJuz / activeKhatmah.days;
    // Calculate new progress: if specificJuz is passed from inline button, use that if it's greater, or just add the daily amount
    let newProg = activeKhatmah.progressJuz + incrementAmount;
    if (specificJuz && specificJuz > newProg) {
      newProg = specificJuz;
    } else if (specificJuz && specificJuz <= activeKhatmah.progressJuz) {
      showAlert(language === 'ar' ? 'لقد قمت بتسجيل هذا الجزء مسبقاً.' : 'You have already logged this Juz.');
      return;
    }

    const completedJuzIndex = Math.min(30, Math.ceil(newProg));
    const quoteObj = JUZ_QUOTES[completedJuzIndex] || { ar: "بوركت مساعيك 🌸", en: "Blessed effort! 🌸" };
    const niceMsg = language === 'ar' ? quoteObj.ar : quoteObj.en;

    updateKhatmahProgress(newProg, true); // Enforce daily lock
    logActivity('quran', 1, 50);

    if (newProg >= activeKhatmah.totalJuz - 0.01) {
        finishKhatmah();
        showAlert(language === 'ar' ? 'مبارك! لقد أتممت الختمة بنجاح! 🌟 (+500 XP)\n\n' + niceMsg : 'Congratulations! You have completed the Khatmah! 🌟 (+500 XP)\n\n' + niceMsg);
    } else {
        showAlert(niceMsg);
    }
    navigate('khatmah');
  };

  const isEndOfJuz = (ayah: Ayah, index: number) => {
    if (!ayah.juz) return false;
    if (index < ayahs.length - 1) {
      const nextAyah = ayahs[index + 1];
      return nextAyah.juz ? nextAyah.juz > ayah.juz : false;
    }
    const surahsEndingJuz = [14, 16, 20, 22, 45, 57, 66, 77, 114];
    return surahsEndingJuz.includes(selectedSurah);
  };

  if (!surahInfo) return null;

  return (
    <div
      className={`flex flex-col flex-1 h-full relative ${quranTheme === "cream" ? "bg-[#FCF5E3]" : quranTheme === "dark" ? "bg-[#121212]" : "bg-white"}`}
    >
      <audio
        ref={audioRef}
        onEnded={handleAudioEnd}
        onTimeUpdate={(e) => setProgress(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => {
          setDuration(e.currentTarget.duration);
          if (audioRef.current) audioRef.current.volume = volume;
        }}
      />
      <audio ref={preloadAudioRef} preload="auto" className="hidden" />

      {/* Header */}
      <header className="bg-[#f2b918] p-3 md:p-4 flex items-center justify-between shrink-0 z-10 text-black shadow-sm relative">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setShowSettings(true)}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-black/10 transition active:scale-95"
          >
            <Settings size={22} className="opacity-80" />
          </button>
          
          <button
            onClick={handleDownload}
            disabled={isDownloaded || downloadProgress !== null}
            className={`w-10 h-10 flex items-center justify-center rounded-full hover:bg-black/10 transition active:scale-95 relative ${isDownloaded ? 'opacity-50' : ''}`}
          >
            {downloadProgress !== null ? (
              <span className="text-xs font-bold">{downloadProgress}%</span>
            ) : isDownloaded ? (
               <Check size={20} className="opacity-80 text-green-900" />
            ) : (
              <Download size={22} className="opacity-80" />
            )}
          </button>
        </div>
        
        <div className="flex-1 text-center flex flex-col items-center">
          <h1 className="text-xl md:text-2xl font-bold font-cairo">
            القرآن الكريم
          </h1>
        </div>
        <button
          onClick={goBack}
          className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-black/10 transition active:scale-95"
        >
          <ArrowRight size={22} />
        </button>
      </header>

      {/* Page Info Bar */}
      <div
        className={`flex justify-between items-center px-4 md:px-6 py-2 border-b text-sm font-cairo font-bold ${quranTheme === "cream" ? "border-[#e0d6b9] text-[#7d6b38]" : quranTheme === "dark" ? "border-border/40 text-gray-400" : "border-gray-200 text-gray-500"}`}
      >
        <span>الآيات: {surahInfo.ayahs}</span>
        <span className="font-amiri-quran text-lg leading-none">
          {surahInfo.name}
        </span>
      </div>

      {/* Main Content */}
      <div
        className={`flex-1 overflow-y-auto px-2 md:px-8 pt-4 pb-32 flex flex-col items-center relative w-full ${quranFont === "amiri" ? "font-amiri-quran" : quranFont === "madinah" ? "font-sans" : "font-sans"}`}
      >
        {/* Title Frame */}
        <div
          className={`relative w-full max-w-[95%] md:max-w-xl mx-auto flex justify-center items-center h-16 md:h-20 mb-8`}
        >
          <div className="absolute inset-0 bg-[#f2b918] opacity-[0.15] rounded-lg"></div>
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#f2b918] to-transparent"></div>
          <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#f2b918] to-transparent"></div>

          <svg
            className="absolute left-0 top-1/2 -translate-y-1/2 h-full opacity-60 text-[#f2b918]"
            viewBox="0 0 100 100"
            preserveAspectRatio="xMinYMid meet"
          >
            <path
              d="M0,50 Q25,25 50,50 T100,50 L100,100 L0,100 Z"
              fill="currentColor"
              stroke="none"
              transform="scale(0.5) translate(0, 50)"
            />
          </svg>
          <svg
            className="absolute right-0 top-1/2 -translate-y-1/2 h-full opacity-60 text-[#f2b918]"
            viewBox="0 0 100 100"
            preserveAspectRatio="xMaxYMid meet"
          >
            <path
              d="M100,50 Q75,25 50,50 T0,50 L0,100 L100,100 Z"
              fill="currentColor"
              stroke="none"
              transform="scale(0.5) translate(100, 50)"
            />
          </svg>

          <h2
            className={`text-2xl md:text-3xl relative z-10 ${quranTheme === "dark" ? "text-[#f2b918]" : "text-[#2a2a2a]"} font-amiri-quran`}
          >
            سُورَةُ {surahInfo.name}
          </h2>
        </div>

        {/* Bismillah */}
        {selectedSurah !== 1 && selectedSurah !== 9 && (
          <div
            className={`text-2xl md:text-4xl text-center mb-6 py-2 w-full flex justify-center ${quranTheme === "dark" ? "text-white" : "text-black"}`}
          >
            <span className="inline-block font-amiri-quran">
              بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ
            </span>
          </div>
        )}

        <AnimatePresence>
          {loading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center py-20 text-[#d4af37]"
            >
              <Loader2 className="animate-spin mb-2" size={32} />
            </motion.div>
          )}

          {!loading && ayahs.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`w-full text-justify pb-16 relative overflow-visible ${quranTheme === "dark" ? "text-[#f4f1ea]" : "text-[#1a1a1a]"}`}
              style={{ textAlignLast: "center" }}
              dir="rtl"
            >
              <div
                className="inline relative z-10 w-full"
                style={{ display: "inline", wordSpacing: "2px" }}
              >
                {ayahs.map((ayah, i) => {
                  let text = ayah.text;
                  if (
                    ayah.numberInSurah === 1 &&
                    selectedSurah !== 1 &&
                    text.startsWith(
                      "بِسْمِ [h:1[ٱ]للَّهِ [h:2[ٱ][l[ل]رَّحْمَ[n[ـٰ]نِ [h:3[ٱ][l[ل]رَّح[p[ِي]مِ",
                    )
                  ) {
                    // This is trying to strip tajweed Bismillah if present. Let's do a more generic replace for Bismillah
                    text = text.replace(/^بِسْمِ.*?رَّح[p\[ِي\]]+مِ\s*/, "");
                  }
                  if (
                    ayah.numberInSurah === 1 &&
                    selectedSurah !== 1 &&
                    text.startsWith("بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ")
                  ) {
                    text = text.replace(
                      "بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ ",
                      "",
                    );
                  }

                  const isBookmarked = currentBookmark === ayah.numberInSurah;
                  const isPlayingAyah = playingAyahIndex === i;
                  const isJuzEnd = isEndOfJuz(ayah, i);

                  return (
                    <React.Fragment key={ayah.numberInSurah}>
                      <span
                        ref={(el) => (ayahRefs.current[ayah.numberInSurah] = el)}
                        onClick={() => handleAyahClick(ayah)}
                        className={`text-[25px] sm:text-[28px] md:text-[34px] lg:text-[40px] inline cursor-pointer transition-colors duration-200 ${
                          isPlayingAyah ? "bg-[#f2b918]/30 rounded px-1" : ""
                        } ${isBookmarked ? "border-b-2 border-[#f2b918] bg-[#f2b918]/10" : ""}`}
                        style={{ lineHeight: "2.4" }}
                      >
                        {renderTajweed(text, quranTajweed)}
                        <span className="inline-flex flex-col items-center justify-center w-8 h-8 sm:w-10 sm:h-10 md:w-11 md:h-11 mx-1.5 align-middle relative group select-none">
                          <svg
                            viewBox="0 0 100 100"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                            className="absolute inset-0 w-full h-full opacity-80 decoration-svg"
                          >
                            <path
                              d="M50 5 L85 25 L85 75 L50 95 L15 75 L15 25 Z"
                              stroke={
                                quranTheme === "dark" ? "#b5a372" : "#a3946a"
                              }
                              strokeWidth="3"
                              fill="none"
                            />
                            <path
                              d="M50 15 L78 30 L78 70 L50 85 L22 70 L22 30 Z"
                              stroke={
                                quranTheme === "dark" ? "#b5a372" : "#a3946a"
                              }
                              strokeWidth="1"
                              fill="none"
                              strokeDasharray="3 3"
                            />
                          </svg>
                          {isBookmarked && (
                            <div className="absolute -top-4 -right-3 text-[#e69b00] drop-shadow-md scale-110 z-10">
                              <BookmarkCheck size={18} fill="currentColor" />
                            </div>
                          )}
                          <span
                            className={`relative z-10 text-[10px] sm:text-[12px] md:text-[14px] font-sans font-bold mt-[2px] ${quranTheme === "dark" ? "text-white/90" : "text-black/80"}`}
                          >
                            {ayah.numberInSurah.toLocaleString("ar-EG")}
                          </span>
                        </span>
                      </span>
                      {isJuzEnd && (
                        <div className="w-full my-12 flex flex-col items-center clear-both font-cairo" style={{ display: 'block', contain: 'content', float: 'none' }} dir="rtl">
                          <div className={`p-6 rounded-2xl max-w-sm mx-auto shadow-sm border ${quranTheme === 'dark' ? 'bg-[#1a2b22]/80 border-[#2d5a3d]/50' : 'bg-[#f4fcf6] border-[#e0f0e6]'}`}>
                             <div className="flex flex-col items-center text-center gap-3">
                               <div className="w-16 h-16 rounded-full bg-[#f2b918]/20 text-[#ebad00] flex items-center justify-center mb-1">
                                 <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></svg>
                               </div>
                               <h3 className={`text-xl font-bold ${quranTheme === "dark" ? "text-[#a4d4b4]" : "text-[#2d5a3d]"}`}>
                                 {language === 'ar' ? `نهاية الجزء ${ayah.juz}` : `End of Juz ${ayah.juz}`}
                               </h3>
                               
                               {activeKhatmah?.source === 'app' && (
                                 <button 
                                   onClick={(e) => handleLogKhatmahTarget(e, ayah.juz || 0)}
                                   className="mt-2 w-full flex items-center justify-center gap-2 px-6 py-3 bg-[#e69b00] text-black rounded-xl font-bold hover:bg-[#ffb419] transition-all transform active:scale-95 shadow-md"
                                 >
                                   <Target size={20} />
                                   {language === 'ar' ? `تسجيل إتمام الجزء في الختمة` : `Log Juz to Plan`}
                                 </button>
                               )}
                             </div>
                          </div>
                        </div>
                      )}
                    </React.Fragment>
                  );
                })}
              </div>

              {!hasCompleted && (
                <div className="mt-8 flex flex-col justify-center gap-4 pb-20 px-4 items-center">
                  <button 
                    onClick={() => {
                      setHasCompleted(true);
                      logActivity('quran', 1, 20);
                    }}
                    className="w-full max-w-sm flex items-center justify-center gap-2 px-6 py-4 bg-[#e69b00] text-black rounded-xl font-bold hover:bg-[#ffb419] transition-all transform active:scale-95 shadow-md font-cairo"
                  >
                    <Check size={20} />
                    {language === 'ar' ? 'أتممت القراءة (+20 نقطة)' : 'Mark as Read (+20 XP)'}
                  </button>
                </div>
              )}
              {hasCompleted && (
                <div className="mt-8 flex flex-col justify-center gap-4 pb-20 px-4 items-center">
                  <span className={`w-full max-w-sm flex items-center justify-center gap-2 px-6 py-4 rounded-xl font-bold font-cairo ${quranTheme === 'dark' ? 'bg-[#1a3a2a] text-[#a4d4b4]' : 'bg-[#e0f0e6] text-[#2d5a3d]'}`}>
                    <Check size={20} />
                    {language === 'ar' ? 'اكتملت القراءة' : 'Reading Completed'}
                  </span>
                  
                  {activeKhatmah?.source === 'app' && (
                    <button 
                      onClick={(e) => handleLogKhatmahTarget(e)}
                      className="w-full max-w-sm flex items-center justify-center gap-2 px-6 py-4 border-2 border-[#e69b00] text-[#e69b00] rounded-xl font-bold hover:bg-[#e69b00]/10 transition-all transform active:scale-95 font-cairo"
                    >
                      <Target size={20} />
                      {language === 'ar' ? 'تسجيل إتمام الورد اليومي' : 'Log Daily Target'}
                    </button>
                  )}
                </div>
              )}

            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom Audio/Nav Bar */}
      <div
        className={`fixed bottom-0 left-0 right-0 z-30 flex flex-col pointer-events-none`}
      >
        {/* Play controls container */}
        <div
          className={`w-full rounded-t-3xl shadow-[0_-5px_25px_rgba(0,0,0,0.1)] pointer-events-auto transition-transform duration-300 transform relative border-t ${quranTheme === "dark" ? "bg-[#121f18] border-[#1a3a2a]" : "bg-[#f4fcf6] border-[#e0f0e6]"} ${isAudioExpanded ? "translate-y-0" : "translate-y-[calc(100%-72px)] md:translate-y-[calc(100%-80px)]"}`}
        >
          <div className="flex flex-col pt-2 pb-6 px-4 max-w-lg mx-auto w-full">
            {/* Handle bar */}
            <button
              onClick={() => setIsAudioExpanded(!isAudioExpanded)}
              className="w-full py-2 flex justify-center outline-none cursor-pointer"
            >
              <div
                className={`w-12 h-1.5 rounded-full mx-auto ${quranTheme === "dark" ? "bg-gray-600" : "bg-gray-300"}`}
              ></div>
            </button>

            {/* Minimal Header (Always visible) */}
            <div className="flex justify-between items-center px-2 mb-2">
              <button
                onClick={() => {
                  setShowFihris(true);
                  setIsAudioExpanded(false);
                }}
                className={`flex items-center gap-1 text-sm font-bold transition group ${quranTheme === "dark" ? "text-[#a4d4b4]" : "text-[#2d5a3d]"}`}
              >
                <List
                  size={18}
                  className="group-hover:scale-110 transition-transform"
                />
                <span className="font-cairo">سُورَةُ {surahInfo.name}</span>
              </button>

              {!isAudioExpanded && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={togglePlay}
                    className={`w-10 h-10 flex items-center justify-center rounded-full shadow-sm hover:scale-105 transition active:scale-95 ${quranTheme === "dark" ? "bg-[#1a2b22] text-[#a4d4b4]" : "bg-white text-[#2d5a3d]"}`}
                  >
                    {isPlaying ? (
                      <Pause size={18} fill="currentColor" />
                    ) : (
                      <Play
                        size={18}
                        fill="currentColor"
                        className="translate-x-0.5"
                      />
                    )}
                  </button>
                </div>
              )}

              <button
                onClick={() => {
                  setShowSettings(true);
                  setIsAudioExpanded(false);
                }}
                className={`text-sm flex items-center font-bold hover:opacity-80 transition gap-1 ${quranTheme === "dark" ? "text-[#a4d4b4]" : "text-[#2d5a3d]"} opacity-80`}
              >
                {selectedQuranReciter === "makkah"
                  ? "السديس"
                  : selectedQuranReciter === "madinah"
                    ? "الحذيفي"
                    : selectedQuranReciter === "abdulbasit"
                      ? "عبد الباسط"
                      : selectedQuranReciter === "husary"
                        ? "الحصري"
                        : selectedQuranReciter === "minshawi"
                          ? "المنشاوي"
                          : selectedQuranReciter === "maher"
                            ? "المعيقلي"
                            : selectedQuranReciter === "shatri"
                              ? "الشاطري"
                              : selectedQuranReciter === "ajamy"
                                ? "العجمي"
                                : selectedQuranReciter === "shuraym"
                                  ? "الشريم"
                                  : selectedQuranReciter === "jibreel"
                                    ? "جبريل"
                                    : selectedQuranReciter === "ayyoub"
                                      ? "أيوب"
                                      : selectedQuranReciter === "rifai"
                                        ? "الرفاعي"
                                        : "العفاسي"}
                <Settings size={14} />
              </button>
            </div>

            {/* Expanded Content */}
            <div
              className={`transition-all duration-300 overflow-hidden ${isAudioExpanded ? "opacity-100 max-h-[300px]" : "opacity-0 max-h-0"}`}
            >
              {/* Progress Bar */}
              <div className="flex flex-col px-2 mt-4 gap-1">
                <input
                  type="range"
                  min="0"
                  max={duration || 100}
                  value={progress}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    if (audioRef.current) audioRef.current.currentTime = val;
                    setProgress(val);
                  }}
                  className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full appearance-none outline-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-[#2d5a3d] dark:[&::-webkit-slider-thumb]:bg-[#a4d4b4] [&::-webkit-slider-thumb]:rounded-full"
                />
                <div
                  className="flex justify-between text-[10px] text-gray-500 font-mono"
                  dir="ltr"
                >
                  <span>
                    {progress
                      ? Math.floor(progress / 60) +
                        ":" +
                        ("0" + Math.floor(progress % 60)).slice(-2)
                      : "0:00"}
                  </span>
                  <span>
                    {duration
                      ? Math.floor(duration / 60) +
                        ":" +
                        ("0" + Math.floor(duration % 60)).slice(-2)
                      : "0:00"}
                  </span>
                </div>
              </div>

              {/* Controls */}
              <div className="flex items-center justify-center gap-6 sm:gap-8 mt-2 relative">
                <button
                  onClick={() => {
                    const next = selectedSurah < 114 ? selectedSurah + 1 : 1;
                    setSelectedSurah(next);
                  }}
                  className={`p-2 rounded-full transition ${quranTheme === "dark" ? "text-[#a4d4b4] hover:bg-[#1a2b22]" : "text-[#2d5a3d] hover:bg-white"}`}
                >
                  <ChevronRight size={32} />
                </button>

                <button
                  onClick={togglePlay}
                  className={`w-16 h-16 flex items-center justify-center rounded-full shadow-md hover:scale-105 transition active:scale-95 ${quranTheme === "dark" ? "bg-[#1a2b22] text-[#a4d4b4]" : "bg-white text-[#2d5a3d]"}`}
                >
                  {isPlaying ? (
                    <Pause size={28} fill="currentColor" />
                  ) : (
                    <Play
                      size={28}
                      fill="currentColor"
                      className="translate-x-1"
                    />
                  )}
                </button>

                <button
                  onClick={() => {
                    const prev = selectedSurah > 1 ? selectedSurah - 1 : 114;
                    setSelectedSurah(prev);
                  }}
                  className={`p-2 rounded-full transition ${quranTheme === "dark" ? "text-[#a4d4b4] hover:bg-[#1a2b22]" : "text-[#2d5a3d] hover:bg-white"}`}
                >
                  <ChevronLeft size={32} />
                </button>

                <button
                  onClick={() =>
                    setRepeatCount((r) =>
                      r === 1 ? 2 : r === 2 ? 3 : r === 3 ? 5 : r === 5 ? 0 : 1,
                    )
                  }
                  className={`absolute left-0 p-2 sm:left-4 flex items-center justify-center w-10 h-10 rounded-full transition ${repeatCount !== 1 ? (quranTheme === "dark" ? "bg-[#1a2b22] text-[#a4d4b4]" : "bg-[#e8f5e9] text-[#2d5a3d]") : quranTheme === "dark" ? "text-gray-500 hover:text-[#a4d4b4]" : "text-gray-400 hover:text-[#2d5a3d]"} `}
                  title="تكرار الآية"
                >
                  <Repeat size={20} />
                  {repeatCount !== 1 && (
                    <span
                      className={`absolute -top-1 -right-1 text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full ${quranTheme === "dark" ? "bg-[#a4d4b4] text-[#121f18]" : "bg-[#2d5a3d] text-white"}`}
                    >
                      {repeatCount === 0 ? "∞" : repeatCount}
                    </span>
                  )}
                </button>
              </div>

              {/* Volume */}
              <div className="flex items-center gap-3 px-6 mt-4">
                <span
                  className={`text-xs ${quranTheme === "dark" ? "text-gray-400" : "text-gray-500"}`}
                >
                  🔈
                </span>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={volume}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    if (audioRef.current) audioRef.current.volume = val;
                    setVolume(val);
                  }}
                  className="flex-1 h-1 bg-gray-200 dark:bg-gray-700 rounded-full appearance-none outline-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-[#2d5a3d] dark:[&::-webkit-slider-thumb]:bg-[#a4d4b4] [&::-webkit-slider-thumb]:rounded-full"
                />
                <span
                  className={`text-xs ${quranTheme === "dark" ? "text-gray-400" : "text-gray-500"}`}
                >
                  🔊
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Settings Modal */}
      <AnimatePresence>
        {showSettings && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => setShowSettings(false)}
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className={`w-full max-w-sm rounded-3xl z-10 shadow-2xl relative overflow-hidden flex flex-col pt-4 pb-6 border ${quranTheme === "dark" ? "bg-[#121f18] border-[#1a3a2a]" : "bg-[#f4fcf6] border-[#e0f0e6]"}`}
            >
              {/* Tabs / Header */}
              <div className="flex justify-between items-center mb-6 px-6 font-cairo font-bold">
                <button
                  onClick={() => {
                    setShowFihris(true);
                    setShowSettings(false);
                  }}
                  className={`transition group ${quranTheme === "dark" ? "text-gray-400 hover:text-[#a4d4b4]" : "text-gray-400 hover:text-[#2d5a3d]"}`}
                >
                  <List size={20} />
                </button>
                <h2
                  className={`text-lg ${quranTheme === "dark" ? "text-[#a4d4b4]" : "text-[#2d5a3d]"}`}
                >
                  تغيير القارئ والإعدادات
                </h2>
                <button
                  onClick={() => setShowSettings(false)}
                  className={`p-1 transition ${quranTheme === "dark" ? "text-gray-400 hover:text-[#a4d4b4]" : "text-gray-400 hover:text-[#2d5a3d]"}`}
                >
                  <X size={20} />
                </button>
              </div>

              <div className="px-6 space-y-6 font-cairo rtl">
                {/* Theme selection style */}
                <div
                  className={`w-full flex items-center justify-between rounded-2xl p-4 border ${quranTheme === "dark" ? "bg-[#1a2b22] border-[#2d5a3d]" : "bg-white border-[#e0f0e6] shadow-sm"}`}
                >
                  <span
                    className={`font-bold ${quranTheme === "dark" ? "text-gray-300" : "text-gray-700"}`}
                  >
                    لون الخلفية
                  </span>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setQuranTheme("dark")}
                      className={`w-8 h-8 rounded-full border-2 ${quranTheme === "dark" ? "border-[#a4d4b4]" : "border-transparent"} bg-[#121212] shadow-sm transition`}
                    ></button>
                    <button
                      onClick={() => setQuranTheme("cream")}
                      className={`w-8 h-8 rounded-full border-2 ${quranTheme === "cream" ? "border-[#2d5a3d]" : "border-transparent"} bg-[#FCF5E3] shadow-inner transition`}
                    ></button>
                    <button
                      onClick={() => setQuranTheme("light")}
                      className={`w-8 h-8 rounded-full border-2 ${quranTheme === "light" ? "border-[#2d5a3d]" : "border-transparent"} bg-white shadow-sm transition`}
                    ></button>
                  </div>
                </div>

                <div
                  className={`w-full rounded-2xl p-4 border flex flex-col gap-3 ${quranTheme === "dark" ? "bg-[#1a2b22] border-[#2d5a3d]" : "bg-white border-[#e0f0e6] shadow-sm"}`}
                >
                  <span
                    className={`font-bold ${quranTheme === "dark" ? "text-gray-300" : "text-gray-700"}`}
                  >
                    أحكام التجويد والخط
                  </span>

                  <button
                    onClick={() => setQuranTajweed(!quranTajweed)}
                    className="flex justify-between items-center w-full mt-2"
                  >
                    <span
                      className={`text-sm ${quranTheme === "dark" ? "text-gray-400" : "text-gray-600"}`}
                    >
                      مع التجويد الملون
                    </span>
                    <div
                      className={`w-6 h-6 rounded flex items-center justify-center border transition ${quranTajweed ? (quranTheme === "dark" ? "bg-[#a4d4b4] border-[#a4d4b4] text-[#121f18]" : "bg-[#2d5a3d] border-[#2d5a3d] text-white") : "bg-transparent border-gray-300"}`}
                    >
                      {quranTajweed && <Check size={16} />}
                    </div>
                  </button>

                  <div
                    className={`h-[1px] w-full my-2 ${quranTheme === "dark" ? "bg-gray-700" : "bg-gray-200"}`}
                  ></div>

                  <div className="flex flex-col gap-2">
                    <span
                      className={`text-sm font-bold mb-2 ${quranTheme === "dark" ? "text-gray-400" : "text-gray-500"}`}
                    >
                      تكرار الآية (للحفظ)
                    </span>
                    <div className="flex flex-wrap gap-2 justify-end">
                      {[1, 2, 3, 5, 0].map((count) => (
                        <button
                          key={count}
                          onClick={() => setRepeatCount(count)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex-1 border ${
                            repeatCount === count
                              ? quranTheme === "dark"
                                ? "bg-[#2d5a3d] text-white border-transparent"
                                : "bg-[#e8f5e9] text-[#2d5a3d] border-[#2d5a3d]"
                              : quranTheme === "dark"
                                ? "bg-[#0f1a14] text-gray-400 border-gray-800"
                                : "bg-gray-50 text-gray-600 border-gray-300"
                          }`}
                        >
                          {count === 0
                            ? "∞"
                            : count === 1
                              ? "مرة"
                              : count === 2
                                ? "مرتين"
                                : `${count} مرات`}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div
                    className={`h-[1px] w-full my-2 ${quranTheme === "dark" ? "bg-gray-700" : "bg-gray-200"}`}
                  ></div>

                  <div className="flex flex-col gap-2">
                    <span
                      className={`text-sm font-bold mb-2 ${quranTheme === "dark" ? "text-gray-400" : "text-gray-500"}`}
                    >
                      تغيير القارئ للملف الصوتي
                    </span>
                    {Object.keys(QURAN_RECITERS).map((reciter) => (
                      <button
                        key={reciter}
                        onClick={() => setSelectedQuranReciter(reciter as any)}
                        className={`w-full py-2.5 px-4 rounded-xl text-right text-sm font-bold flex items-center gap-3 transition ${selectedQuranReciter === reciter ? (quranTheme === "dark" ? "bg-[#2d5a3d] text-white" : "bg-[#e8f5e9] text-[#2d5a3d] border border-[#2d5a3d]") : quranTheme === "dark" ? "bg-[#0f1a14] text-gray-400 border border-gray-800" : "bg-white text-gray-600 border border-transparent hover:border-[#e0f0e6] shadow-sm"}`}
                      >
                        <div
                          className={`w-4 h-4 rounded-full border flex items-center justify-center ${selectedQuranReciter === reciter ? (quranTheme === "dark" ? "border-white" : "border-[#2d5a3d]") : quranTheme === "dark" ? "border-gray-600" : "border-gray-300"}`}
                        >
                          {selectedQuranReciter === reciter && (
                            <div
                              className={`w-2.5 h-2.5 rounded-full ${quranTheme === "dark" ? "bg-white" : "bg-[#2d5a3d]"}`}
                            ></div>
                          )}
                        </div>
                        {reciter === "makkah" ? "عبدالرحمن السديس" 
                          : reciter === "madinah" ? "علي الحذيفي" 
                          : reciter === "alafasy" ? "مشاري العفاسي" 
                          : reciter === "abdulbasit" ? "عبد الباسط عبد الصمد"
                          : reciter === "husary" ? "محمود خليل الحصري"
                          : reciter === "minshawi" ? "محمد صديق المنشاوي"
                          : reciter === "maher" ? "ماهر المعيقلي"
                          : reciter === "shatri" ? "أبو بكر الشاطري"
                          : reciter === "ajamy" ? "أحمد بن علي العجمي"
                          : reciter === "shuraym" ? "سعود الشريم"
                          : reciter === "jibreel" ? "محمد جبريل"
                          : reciter === "ayyoub" ? "محمد أيوب"
                          : reciter === "rifai" ? "هاني الرفاعي"
                          : reciter}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Fihris Context Menu / List */}
      <AnimatePresence>
        {showFihris && (
          <div className="fixed inset-0 z-50 flex flex-col justify-end pointer-events-none">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm pointer-events-auto"
              onClick={() => setShowFihris(false)}
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              className={`w-full h-[85vh] rounded-t-3xl z-10 relative flex flex-col overflow-hidden pointer-events-auto shadow-2xl ${quranTheme === "dark" ? "bg-[#121212]" : "bg-[#fafafa]"}`}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-[#f2b918]/20 bg-white dark:bg-[#1a1a1a]">
                <div className="flex-1 text-center font-bold font-cairo text-lg">
                  الإستماع للسور
                </div>
                <button
                  onClick={() => setShowFihris(false)}
                  className="text-gray-500 absolute right-4"
                >
                  <X size={24} />
                </button>
              </div>

              {/* List */}
              <div className="flex-1 overflow-y-auto p-4 content-start">
                <div className="space-y-3 pb-24">
                  {SURAHS.map((surah) => {
                    const isActive = selectedSurah === surah.number;
                    return (
                      <button
                        key={surah.number}
                        onClick={() => {
                          setSelectedSurah(surah.number);
                          setShowFihris(false);
                        }}
                        className={`w-full rounded-2xl flex items-center justify-between p-4 transition-all border ${
                          isActive
                            ? "bg-[#fdf4c7] dark:bg-[#f2b918]/20 border-[#f2b918] shadow-sm"
                            : "bg-white dark:bg-[#1a1a1a] shadow-sm border-transparent hover:border-[#f2b918]/50"
                        }`}
                      >
                        {/* Audio / Download icon pseudo */}
                        <div className="w-10 h-10 rounded-full border border-[#f2b918] text-[#f2b918] flex items-center justify-center opacity-70">
                          <Download size={18} />
                        </div>

                        {/* Title & info */}
                        <div className="flex-1 text-right px-4">
                          <h4
                            className={`font-amiri-quran text-2xl mb-1 ${isActive ? "text-[#a17c05] dark:text-[#f2b918]" : "text-gray-900 dark:text-gray-100"}`}
                          >
                            {surah.name}
                          </h4>
                          <div className="flex justify-end gap-2 text-xs font-cairo font-bold opacity-60">
                            <span>{surah.ayahs} آية</span>
                            <span>{surah.englishName}</span>
                          </div>
                        </div>

                        {/* Number badge */}
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shadow-sm ${isActive ? "bg-[#f2b918] text-white" : "bg-[#facc4d] text-white"}`}
                        >
                          {surah.number}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Action Menu Bottom Sheet */}
      <AnimatePresence>
        {showMenu && selectedAyah && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 z-40 backdrop-blur-sm"
              onClick={() => setShowMenu(false)}
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              className={`fixed bottom-0 left-0 right-0 p-6 rounded-t-3xl z-50 shadow-[0_-10px_40px_rgba(0,0,0,0.5)] pb-10 ${quranTheme === "dark" ? "bg-[#121f18] border-t border-[#1a3a2a]" : "bg-[#f4fcf6]"}`}
            >
              <div className="flex justify-between items-center mb-6 font-cairo">
                <button
                  onClick={() => setShowMenu(false)}
                  className={`p-2 rounded-full ${quranTheme === "dark" ? "bg-[#1a2b22] text-[#a4d4b4]" : "bg-white text-[#2d5a3d] shadow-sm"}`}
                >
                  <X size={20} />
                </button>
                <h3
                  className={`font-bold ${quranTheme === "dark" ? "text-[#a4d4b4]" : "text-[#2d5a3d]"}`}
                >
                  {language === "ar"
                    ? `آية ${selectedAyah.numberInSurah}`
                    : `Ayah ${selectedAyah.numberInSurah}`}
                </h3>
              </div>
              <div
                className={`grid grid-cols-4 gap-3 p-4 rounded-2xl border font-cairo mb-4 ${quranTheme === "dark" ? "bg-[#1a2b22] border-[#2d5a3d]" : "bg-white border-[#e0f0e6] shadow-sm"}`}
              >
                <button
                  onClick={() => {
                    setShowMenu(false);
                    setShowTafsir(true);
                    fetchTafsir(selectedAyah.number);
                  }}
                  className="flex flex-col items-center gap-2 group"
                >
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform shadow-sm ${quranTheme === "dark" ? "bg-[#0f1a14] text-[#a4d4b4]" : "bg-[#e8f5e9] text-[#2d5a3d]"}`}
                  >
                    <BookOpen size={22} fill="currentColor" opacity={0.2} />
                  </div>
                  <span
                    className={`text-xs font-bold ${quranTheme === "dark" ? "text-gray-400" : "text-gray-600"}`}
                  >
                    {language === "ar" ? "تفسير" : "Tafsir"}
                  </span>
                </button>
                <button
                  onClick={() => {
                    setShowMenu(false);
                    setShowTranslation(true);
                    fetchTranslation(selectedAyah.number);
                  }}
                  className="flex flex-col items-center gap-2 group"
                >
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform shadow-sm ${quranTheme === "dark" ? "bg-[#0f1a14] text-[#a4d4b4]" : "bg-[#e8f5e9] text-[#2d5a3d]"}`}
                  >
                    <Globe2 size={22} fill="currentColor" opacity={0.2} />
                  </div>
                  <span
                    className={`text-xs font-bold ${quranTheme === "dark" ? "text-gray-400" : "text-gray-600"}`}
                  >
                    {language === "ar" ? "ترجمة" : "Translation"}
                  </span>
                </button>
                <button
                  onClick={handleCopy}
                  className="flex flex-col items-center gap-2 group"
                >
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform shadow-sm ${quranTheme === "dark" ? "bg-[#0f1a14] text-[#a4d4b4]" : "bg-[#e8f5e9] text-[#2d5a3d]"}`}
                  >
                    <Copy size={22} fill="currentColor" opacity={0.2} />
                  </div>
                  <span
                    className={`text-xs font-bold ${quranTheme === "dark" ? "text-gray-400" : "text-gray-600"}`}
                  >
                    {language === "ar" ? "نسخ" : "Copy"}
                  </span>
                </button>
                <button
                  onClick={() => {
                    setShowMenu(false);
                    setShowShareCard(true);
                  }}
                  className="flex flex-col items-center gap-2 group"
                >
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform shadow-sm ${quranTheme === "dark" ? "bg-[#0f1a14] text-[#a4d4b4]" : "bg-[#e8f5e9] text-[#2d5a3d]"}`}
                  >
                    <Share2 size={22} fill="currentColor" opacity={0.2} />
                  </div>
                  <span
                    className={`text-xs font-bold ${quranTheme === "dark" ? "text-gray-400" : "text-gray-600"}`}
                  >
                    {language === "ar" ? "مشاركة" : "Share"}
                  </span>
                </button>
              </div>
              <button
                onClick={() => {
                  setQuranBookmark(
                    surahInfo.number,
                    selectedAyah.numberInSurah,
                  );
                  setShowMenu(false);
                }}
                className={`w-full mt-4 py-4 rounded-xl flex items-center justify-center gap-2 font-bold font-cairo transition-all shadow-sm border ${quranTheme === "dark" ? "bg-[#1a2b22] text-[#a4d4b4] border-[#2d5a3d] hover:bg-[#2d5a3d]" : "bg-white text-[#2d5a3d] border-[#e0f0e6] hover:bg-[#e8f5e9]"}`}
              >
                {currentBookmark === selectedAyah.numberInSurah ? (
                  <>
                    <BookmarkCheck size={20} />{" "}
                    {language === "ar"
                      ? "إزالة العلامة المرجعية"
                      : "Remove Bookmark"}
                  </>
                ) : (
                  <>
                    <BookmarkCheck size={20} />{" "}
                    {language === "ar"
                      ? "حفظ كعلامة مرجعية"
                      : "Bookmark this Ayah"}
                  </>
                )}
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Tafsir Modal */}
      <AnimatePresence>
        {showTafsir && selectedAyah && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/80"
              onClick={() => setShowTafsir(false)}
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className={`w-full max-w-lg rounded-2xl p-6 z-10 border shadow-2xl relative max-h-[80vh] flex flex-col ${quranTheme === "dark" ? "bg-[#121f18] border-[#1a3a2a]" : "bg-[#f4fcf6] border-[#e0f0e6]"}`}
            >
              <button
                onClick={() => setShowTafsir(false)}
                className={`absolute top-4 right-4 transition ${quranTheme === "dark" ? "text-gray-400 hover:text-white" : "text-gray-500 hover:text-black"}`}
              >
                <X />
              </button>
              <h2
                className={`text-xl font-bold mb-4 font-amiri text-center ${quranTheme === "dark" ? "text-[#a4d4b4]" : "text-[#2d5a3d]"}`}
              >
                التفسير الميسر
              </h2>
              <div
                className={`p-4 rounded-xl mb-4 border ${quranTheme === "dark" ? "bg-[#1a2b22] border-[#2d5a3d]" : "bg-white border-[#e0f0e6] shadow-sm"}`}
              >
                <p
                  className={`font-amiri-quran text-right text-xl leading-relaxed ${quranTheme === "dark" ? "text-gray-200" : "text-gray-800"}`}
                >
                  {renderTajweed(selectedAyah.text, false)} ﴿
                  {selectedAyah.numberInSurah}﴾
                </p>
              </div>
              <div className="overflow-y-auto pr-2">
                {loadingExtras ? (
                  <div className="flex justify-center py-10">
                    <Loader2
                      className={`animate-spin ${quranTheme === "dark" ? "text-[#a4d4b4]" : "text-[#2d5a3d]"}`}
                      size={32}
                    />
                  </div>
                ) : (
                  <p
                    className={`text-right leading-loose font-sans text-lg ${quranTheme === "dark" ? "text-gray-300" : "text-gray-700"}`}
                  >
                    {tafsirData}
                  </p>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Translation Modal */}
      <AnimatePresence>
        {showTranslation && selectedAyah && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/80"
              onClick={() => setShowTranslation(false)}
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className={`w-full max-w-lg rounded-2xl p-6 z-10 border shadow-2xl relative max-h-[80vh] flex flex-col ${quranTheme === "dark" ? "bg-[#121f18] border-[#1a3a2a]" : "bg-[#f4fcf6] border-[#e0f0e6]"}`}
            >
              <button
                onClick={() => setShowTranslation(false)}
                className={`absolute top-4 right-4 transition ${quranTheme === "dark" ? "text-gray-400 hover:text-white" : "text-gray-500 hover:text-black"}`}
              >
                <X />
              </button>
              <h2
                className={`text-xl font-bold mb-4 font-amiri text-center ${quranTheme === "dark" ? "text-[#a4d4b4]" : "text-[#2d5a3d]"}`}
              >
                {language === "ar" ? "الترجمة" : "Translations"}
              </h2>
              <div className="overflow-y-auto pr-2 flex flex-col gap-4">
                {loadingExtras ? (
                  <div className="flex justify-center py-10">
                    <Loader2
                      className={`animate-spin ${quranTheme === "dark" ? "text-[#a4d4b4]" : "text-[#2d5a3d]"}`}
                      size={32}
                    />
                  </div>
                ) : translationData ? (
                  Object.entries(translationData).map(([lang, text]) => (
                    <div
                      key={lang}
                      className={`p-4 rounded-xl border ${quranTheme === "dark" ? "bg-[#1a2b22] border-[#2d5a3d]" : "bg-white border-[#e0f0e6] shadow-sm"}`}
                    >
                      <h4
                        className={`text-sm font-bold mb-2 ${quranTheme === "dark" ? "text-[#a4d4b4]" : "text-[#2d5a3d]"}`}
                      >
                        {lang}
                      </h4>
                      <p
                        className={`leading-relaxed ${quranTheme === "dark" ? "text-gray-300" : "text-gray-700"}`}
                      >
                        {text}
                      </p>
                    </div>
                  ))
                ) : null}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ShareImageModal
        isOpen={showShareCard}
        onClose={() => setShowShareCard(false)}
        text={selectedAyah ? `${selectedAyah.text} ﴿${selectedAyah.numberInSurah}﴾` : ""}
        title={surahInfo ? `سورة ${surahInfo.name}` : ""}
        subtitle=""
        type="ayah"
        language={language}
      />
    </div>
  );
}
