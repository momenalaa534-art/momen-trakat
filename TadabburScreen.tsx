import React, { useState, useEffect } from 'react';
import { useStore } from '../store';
import { TopBar } from '../components/TopBar';
import { ChevronRight, ChevronLeft, Search, Sparkles, BookOpen, Quote, Info, Loader2, Share2, Settings2, Check, Type as TypeIcon } from 'lucide-react';
import { GoogleGenAI, Type } from '@google/genai';
import { motion } from 'motion/react';
import { ShareImageModal } from '../components/ShareImageModal';

export function TadabburScreen() {
  const language = useStore(s => s.language);
  const quranTheme = useStore(s => s.quranTheme);
  const tadabburTheme = useStore((s: any) => s.tadabburTheme || 'cream');
  const setTadabburTheme = useStore((s: any) => s.setTadabburTheme);
  const tadabburFont = useStore((s: any) => s.tadabburFont || 'amiri');
  const setTadabburFont = useStore((s: any) => s.setTadabburFont);
  const tadabburFontSize = useStore((s: any) => s.tadabburFontSize || 16);
  const setTadabburFontSize = useStore((s: any) => s.setTadabburFontSize);
  const tadabburPage = useStore((s: any) => s.tadabburPage);
  const setTadabburPage = useStore((s: any) => s.setTadabburPage);
  const showAlert = useStore(s => s.showAlert);

  const [pageData, setPageData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [aiTafsir, setAiTafsir] = useState<any>(null);
  const [loadingAi, setLoadingAi] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const [shareData, setShareData] = useState<{ text: string; title: string; subtitle: string } | null>(null);
  const [showSettings, setShowSettings] = useState(false);

  const totalPages = 604;
  
  const fetchPage = async (page: number) => {
    setLoading(true);
    try {
      const res = await fetch(`https://api.alquran.cloud/v1/page/${page}/quran-uthmani`);
      const data = await res.json();
      if (data.code === 200) {
        setPageData(data.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPage(tadabburPage);
    generateAiTafsir(tadabburPage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tadabburPage]);

  const generateAiTafsir = async (page: number) => {
    setAiTafsir(null);
    setLoadingAi(true);
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        console.error('API key missing');
        setLoadingAi(false);
        return;
      }

      const ai = new GoogleGenAI({ apiKey });
      const prompt = `أريد تفسيراً تفصيلياً جداً ومطولاً (بالتفصيل الممل) معتمداً من مصادر موثوقة (مثل تفسير ابن كثير، الطبري، القرطبي، السعدي) للآيات الموجودة في الصفحة رقم ${page} من القرآن الكريم.
رجاءً قم بتوفير:
1. "overview": المعنى العام للآيات وسياقها ومقاصدها بشكل مفصل جداً ومطول.
2. "story": أسباب النزول إن وجدت، أو القصص والأحداث التاريخية التي تتحدث عنها الآيات بالتفصيل الممل والممتع والشامل.
3. "vocabulary": معاني جميع الكلمات الصعبة والغريبة بدقة وتفصيل (قائمة متكاملة من {word, meaning}).
4. "reflections": هدايات ولطائف تدبرية، وأحكام فقهية، وإعجاز بلاغي، واستنباطات للعمل بها في الحياة (قائمة طويلة ومفصلة من 5-7 نقاط على الأقل).
5. "sources": المصادر المعتمدة المأخوذ منها هذا التفسير بالتفصيل.`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          temperature: 0.3,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              overview: { type: Type.STRING },
              story: { type: Type.STRING },
              vocabulary: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    word: { type: Type.STRING },
                    meaning: { type: Type.STRING },
                  },
                },
              },
              reflections: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              sources: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
            },
            required: ["overview", "story", "vocabulary", "reflections", "sources"],
          }
        }
      });

      if (response.text && response.text.trim() !== '') {
        const result = JSON.parse(response.text);
        setAiTafsir(result);
      }
    } catch (error) {
      console.error('Error generating tafsir', error);
      showAlert(language === 'ar' ? 'فشل استخراج التفسير. يرجى المحاولة لاحقاً.' : 'Failed to generate Tafsir.');
    } finally {
      setLoadingAi(false);
    }
  };

  const handleNextPage = () => {
    if (tadabburPage < totalPages) {
      setTadabburPage(tadabburPage + 1);
    }
  };

  const handlePrevPage = () => {
    if (tadabburPage > 1) {
      setTadabburPage(tadabburPage - 1);
    }
  };

  const handleSearch = () => {
    const p = parseInt(searchInput);
    if (!isNaN(p) && p >= 1 && p <= totalPages) {
      setTadabburPage(p);
      setShowSearch(false);
    } else {
      showAlert(language === 'ar' ? 'رقم الصفحة غير صحيح' : 'Invalid page number');
    }
    setSearchInput('');
  };

  const getPageAyahs = () => {
    if (!pageData) return [];
    return pageData.ayahs;
  };

  const surahsMap: Record<string, boolean> = {};
  getPageAyahs().forEach((a: any) => { surahsMap[a.surah.name] = true; });
  const surahNames = Object.keys(surahsMap).join(' - ');

  const fontFamilyClass = tadabburFont === 'amiri' ? 'font-amiri' : tadabburFont === 'cairo' ? 'font-cairo' : 'font-sans';
  const customTextStyle = { fontSize: tadabburFontSize };

  return (
    <div className={`flex flex-col flex-1 overflow-y-auto overflow-x-hidden relative ${tadabburTheme === "cream" ? "bg-[#FCF5E3]" : tadabburTheme === "dark" ? "bg-[#121212]" : "bg-white"}`}>
      <TopBar title={language === 'ar' ? 'التدبر اليومي' : 'Daily Tadabbur'} subTitle={language === 'ar' ? 'وقفات قرآنية ومصادر موثوقة' : 'Quranic Reflections'} />
      
      <div className="flex-1 p-4 md:p-6 pb-24 max-w-2xl mx-auto w-full">
        {/* Controls */}
        <div className="flex items-center justify-between mb-4 bg-mid/50 p-2 rounded-2xl border border-border shadow-sm backdrop-blur-sm relative z-10" dir="rtl">
          <button 
            disabled={tadabburPage <= 1}
            onClick={handlePrevPage}
            className="p-3 bg-dark disabled:opacity-50 text-gold rounded-xl hover:bg-dark/80 transition"
          >
            <ChevronRight />
          </button>
          
          <div className="flex flex-col items-center flex-1 mx-2">
            {showSearch ? (
              <div className="flex items-center justify-center gap-2 w-full">
                <input 
                  type="number" 
                  autoFocus
                  placeholder={language === 'ar' ? 'رقم' : 'Pg'}
                  className="w-16 sm:w-24 text-center bg-dark border border-gold/50 rounded-lg py-1 px-2 text-text outline-none text-sm"
                  value={searchInput}
                  onBlur={() => setTimeout(() => setShowSearch(false), 200)}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  min={1} max={totalPages}
                />
                <button onClick={handleSearch} className="bg-gold text-dark p-1.5 rounded-lg">
                  <Search size={14} />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button onClick={() => setShowSearch(true)} className="flex items-center gap-2 group p-2">
                  <Search size={14} className="text-light group-hover:text-gold transition" />
                  <h3 className="font-bold text-text group-hover:text-gold transition text-sm sm:text-base">
                    {language === 'ar' ? 'الصفحة' : 'Page'} {tadabburPage}
                  </h3>
                </button>
                <button onClick={() => setShowSettings(!showSettings)} className={`p-2 rounded-full transition ${showSettings ? 'bg-gold text-dark' : 'text-light hover:text-gold'}`}>
                  <Settings2 size={16} />
                </button>
              </div>
            )}
            <span className="text-[10px] sm:text-xs text-light font-amiri mt-0.5 text-center">{surahNames}</span>
          </div>

          <button 
            disabled={tadabburPage >= totalPages}
            onClick={handleNextPage}
            className="p-3 bg-dark disabled:opacity-50 text-gold rounded-xl hover:bg-dark/80 transition"
          >
            <ChevronLeft />
          </button>
        </div>

        {/* Settings Panel */}
        {showSettings && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className={`p-4 rounded-2xl mb-6 shadow-md border ${tadabburTheme === 'dark' ? 'bg-[#1a2b22] border-[#2d5a3d]' : 'bg-white border-[#e0f0e6]'}`}>
            <h4 className={`text-sm font-bold mb-3 ${tadabburTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
              {language === 'ar' ? 'إعدادات التدبر والتفسير' : 'Tadabbur Settings'}
            </h4>
            
            <div className="space-y-4">
              {/* Theme */}
              <div className="flex items-center justify-between">
                <span className={`text-sm ${tadabburTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                  {language === 'ar' ? 'الخلفية' : 'Background'}
                </span>
                <div className="flex gap-2">
                  <button onClick={() => setTadabburTheme('dark')} className={`w-8 h-8 rounded-full border-2 ${tadabburTheme === 'dark' ? 'border-gold' : 'border-transparent'} bg-[#121212] shadow-sm`}></button>
                  <button onClick={() => setTadabburTheme('cream')} className={`w-8 h-8 rounded-full border-2 ${tadabburTheme === 'cream' ? 'border-gold' : 'border-transparent'} bg-[#FCF5E3] shadow-sm`}></button>
                  <button onClick={() => setTadabburTheme('light')} className={`w-8 h-8 rounded-full border-2 ${tadabburTheme === 'light' ? 'border-gold' : 'border-transparent'} bg-white border border-gray-200 shadow-sm`}></button>
                </div>
              </div>

              {/* Font Family */}
              <div className="flex items-center justify-between">
                <span className={`text-sm ${tadabburTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                  {language === 'ar' ? 'نوع الخط' : 'Font Type'}
                </span>
                <div className="flex gap-2">
                  <button onClick={() => setTadabburFont('amiri')} className={`px-3 py-1 text-sm rounded-lg border transition ${tadabburFont === 'amiri' ? 'bg-gold text-dark border-gold font-bold' : tadabburTheme === 'dark' ? 'border-border text-gray-400' : 'border-gray-200 text-gray-600'} font-amiri`}>Amiri</button>
                  <button onClick={() => setTadabburFont('cairo')} className={`px-3 py-1 text-sm rounded-lg border transition ${tadabburFont === 'cairo' ? 'bg-gold text-dark border-gold font-bold' : tadabburTheme === 'dark' ? 'border-border text-gray-400' : 'border-gray-200 text-gray-600'} font-cairo`}>Cairo</button>
                  <button onClick={() => setTadabburFont('sans')} className={`px-3 py-1 text-sm rounded-lg border transition ${tadabburFont === 'sans' ? 'bg-gold text-dark border-gold font-bold' : tadabburTheme === 'dark' ? 'border-border text-gray-400' : 'border-gray-200 text-gray-600'} font-sans`}>Sans</button>
                </div>
              </div>

              {/* Font Size */}
              <div className="flex items-center justify-between">
                <span className={`text-sm ${tadabburTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                  {language === 'ar' ? 'حجم الخط' : 'Font Size'}
                </span>
                <div className="flex items-center gap-3">
                  <button onClick={() => setTadabburFontSize(Math.max(12, tadabburFontSize - 2))} className={`p-1.5 rounded-lg border ${tadabburTheme === 'dark' ? 'border-border text-gray-400' : 'border-gray-200 text-gray-600'}`}>
                    <TypeIcon size={14} />
                  </button>
                  <span className={`text-sm w-4 text-center font-bold ${tadabburTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>{tadabburFontSize}</span>
                  <button onClick={() => setTadabburFontSize(Math.min(32, tadabburFontSize + 2))} className={`p-1.5 rounded-lg border ${tadabburTheme === 'dark' ? 'border-border text-gray-400' : 'border-gray-200 text-gray-600'}`}>
                    <TypeIcon size={18} />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Quran Page */}
        <div className={`p-4 sm:p-6 md:p-8 rounded-3xl mb-8 border shadow-lg relative min-h-[400px] flex flex-col justify-center items-center ${quranTheme === "dark" ? "bg-[#1a2b22]/40 border-[#2d5a3d]/50" : "bg-[#f4fcf6]/80 border-[#e0f0e6]"}`}>
          {loading ? (
             <Loader2 className="animate-spin text-gold w-8 h-8" />
          ) : (
             <div className={`text-justify w-full leading-[2.5] font-amiri-quran text-xl sm:text-2xl md:text-3xl ${quranTheme === "dark" ? "text-[#f4f1ea]" : "text-[#1a1a1a]"}`} dir="rtl">
               {getPageAyahs().map((ayah: any) => (
                 <span key={ayah.number}>
                   {ayah.text}{' '}
                   <span className="inline-flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 mx-1 text-xs sm:text-sm bg-contain bg-center bg-no-repeat text-gold rounded-full border border-gold/30 shrink-0 font-sans mt-2 relative top-2">
                     {ayah.numberInSurah}
                   </span>
                 </span>
               ))}
             </div>
          )}
        </div>

        {/* Tafsir AI Loading */}
        {loadingAi && (
           <div className="flex flex-col items-center justify-center p-8 text-gold space-y-4">
             <Loader2 className="w-8 h-8 animate-spin" />
             <p className="font-bold animate-pulse text-sm text-center px-4">
               {language === 'ar' ? 'جاري استخراج درر التدبر والقصص القرآنية...' : 'Extracting reflections and stories...'}
             </p>
           </div>
        )}

        {/* Tafsir Content */}
        {!loadingAi && aiTafsir && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6" dir={language === 'ar' ? 'rtl' : 'ltr'}>
            
            <div className={`border p-5 rounded-3xl shadow-sm relative group ${tadabburTheme === 'dark' ? 'bg-[#1a2b22]/20 border-[#2d5a3d]/30' : tadabburTheme === 'cream' ? 'bg-[#FCF5E3] border-[#e0e3c8]' : 'bg-white border-[#e0f0e6]'}`}>
               <div className="flex justify-between items-center mb-4">
                 <h3 className={`flex items-center gap-2 font-bold text-base sm:text-lg ${tadabburTheme === 'dark' ? 'text-[#a4d4b4]' : 'text-[#2d5a3d]'}`}>
                   <BookOpen size={20} />
                   {language === 'ar' ? 'المعنى العام والسياق' : 'General Overview'}
                 </h3>
                 <button 
                   onClick={() => setShareData({
                     title: language === 'ar' ? 'المعنى العام' : 'General Overview',
                     subtitle: `${language === 'ar' ? 'الصفحة' : 'Page'} ${tadabburPage} | ${surahNames}`,
                     text: aiTafsir.overview
                   })}
                   className={`p-2 rounded-full opacity-60 hover:opacity-100 transition ${tadabburTheme === 'dark' ? 'bg-[#121f18] text-white hover:bg-[#2d5a3d]' : 'bg-[#e8f5e9] text-[#2d5a3d] hover:bg-[#2d5a3d] hover:text-white'}`}
                 >
                   <Share2 size={16} />
                 </button>
               </div>
               <p className={`leading-relaxed ${fontFamilyClass} ${tadabburTheme === 'dark' ? 'text-gray-300' : 'text-gray-800'}`} style={customTextStyle}>
                 {aiTafsir.overview}
               </p>
            </div>

            {aiTafsir.story && aiTafsir.story.length > 10 && (
              <div className={`border p-5 rounded-3xl shadow-sm relative group ${tadabburTheme === 'dark' ? 'bg-[#1a2b22]/20 border-[#2d5a3d]/30' : tadabburTheme === 'cream' ? 'bg-[#FCF5E3] border-[#e0e3c8]' : 'bg-white border-[#e0f0e6]'}`}>
                 <div className="flex justify-between items-center mb-4">
                   <h3 className={`flex items-center gap-2 font-bold text-base sm:text-lg ${tadabburTheme === 'dark' ? 'text-[#a4d4b4]' : 'text-[#2d5a3d]'}`}>
                     <Quote size={20} />
                     {language === 'ar' ? 'سبب النزول والقصة' : 'Story / Asbab Al-Nuzul'}
                   </h3>
                   <button 
                     onClick={() => setShareData({
                       title: language === 'ar' ? 'سبب النزول والقصة' : 'Story / Asbab',
                       subtitle: `${language === 'ar' ? 'الصفحة' : 'Page'} ${tadabburPage} | ${surahNames}`,
                       text: aiTafsir.story
                     })}
                     className={`p-2 rounded-full opacity-60 hover:opacity-100 transition ${tadabburTheme === 'dark' ? 'bg-[#121f18] text-white hover:bg-[#2d5a3d]' : 'bg-[#e8f5e9] text-[#2d5a3d] hover:bg-[#2d5a3d] hover:text-white'}`}
                   >
                     <Share2 size={16} />
                   </button>
                 </div>
                 <p className={`leading-relaxed whitespace-pre-wrap ${fontFamilyClass} ${tadabburTheme === 'dark' ? 'text-gray-300' : 'text-gray-800'}`} style={customTextStyle}>
                   {aiTafsir.story}
                 </p>
              </div>
            )}

            <div className={`border p-5 rounded-3xl shadow-sm relative group ${tadabburTheme === 'dark' ? 'bg-[#1a2b22]/20 border-[#2d5a3d]/30' : tadabburTheme === 'cream' ? 'bg-[#FCF5E3] border-[#e0e3c8]' : 'bg-white border-[#e0f0e6]'}`}>
               <div className="flex justify-between items-center mb-4">
                 <h3 className={`flex items-center gap-2 font-bold text-base sm:text-lg text-gold`}>
                   <Sparkles size={20} />
                   {language === 'ar' ? 'لطائف وهدايات تدبرية' : 'Reflections'}
                 </h3>
                 <button 
                   onClick={() => setShareData({
                     title: language === 'ar' ? 'لطائف تدبرية' : 'Reflections',
                     subtitle: `${language === 'ar' ? 'الصفحة' : 'Page'} ${tadabburPage} | ${surahNames}`,
                     text: aiTafsir.reflections?.map((ref: string, i: number) => `${i + 1}. ${ref}`).join('\n\n')
                   })}
                   className={`p-2 rounded-full opacity-60 hover:opacity-100 transition ${tadabburTheme === 'dark' ? 'bg-[#121f18] text-white hover:bg-[#2d5a3d]' : 'bg-[#e8f5e9] text-[#2d5a3d] hover:bg-[#2d5a3d] hover:text-white'}`}
                 >
                   <Share2 size={16} />
                 </button>
               </div>
               <ul className="space-y-3">
                 {aiTafsir.reflections?.map((ref: string, i: number) => (
                   <li key={i} className={`flex gap-3 items-start p-3 rounded-xl border ${tadabburTheme === 'dark' ? 'bg-[#121f18] border-[#1a3a2a]' : tadabburTheme === 'cream' ? 'bg-white/50 border-[#e0e3c8]' : 'bg-[#f4fcf6] border-[#e0f0e6]'}`}>
                     <span className="w-6 h-6 rounded-full bg-gold/20 text-gold flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">{i + 1}</span>
                     <p className={`leading-relaxed ${fontFamilyClass} ${tadabburTheme === 'dark' ? 'text-gray-300' : 'text-gray-800'}`} style={customTextStyle}>{ref}</p>
                   </li>
                 ))}
               </ul>
            </div>

            {aiTafsir.vocabulary && aiTafsir.vocabulary.length > 0 && (
              <div className={`border p-5 rounded-3xl shadow-sm relative group ${tadabburTheme === 'dark' ? 'bg-[#1a2b22]/20 border-[#2d5a3d]/30' : tadabburTheme === 'cream' ? 'bg-[#FCF5E3] border-[#e0e3c8]' : 'bg-white border-[#e0f0e6]'}`}>
                 <div className="flex justify-between items-center mb-4">
                   <h3 className={`flex items-center gap-2 font-bold text-base sm:text-lg ${tadabburTheme === 'dark' ? 'text-[#a4d4b4]' : 'text-[#2d5a3d]'}`}>
                     <Info size={20} />
                     {language === 'ar' ? 'معاني الكلمات' : 'Vocabulary'}
                   </h3>
                   <button 
                     onClick={() => setShareData({
                       title: language === 'ar' ? 'معاني الكلمات' : 'Vocabulary',
                       subtitle: `${language === 'ar' ? 'الصفحة' : 'Page'} ${tadabburPage} | ${surahNames}`,
                       text: aiTafsir.vocabulary.map((v: any) => `${v.word}: ${v.meaning}`).join('\n')
                     })}
                     className={`p-2 rounded-full opacity-60 hover:opacity-100 transition ${tadabburTheme === 'dark' ? 'bg-[#121f18] text-white hover:bg-[#2d5a3d]' : 'bg-[#e8f5e9] text-[#2d5a3d] hover:bg-[#2d5a3d] hover:text-white'}`}
                   >
                     <Share2 size={16} />
                   </button>
                 </div>
                 <div className="flex flex-col gap-2">
                   {aiTafsir.vocabulary.map((v: any, i: number) => (
                     <div key={i} className={`flex justify-between items-center p-3 rounded-xl border ${tadabburTheme === 'dark' ? 'bg-[#121f18] border-[#1a3a2a]' : tadabburTheme === 'cream' ? 'bg-white/50 border-[#e0e3c8]' : 'bg-[#f4fcf6] border-[#e0f0e6]'}`}>
                       <span className="font-bold text-gold font-amiri-quran text-base sm:text-lg w-1/3 min-w-[80px]" style={customTextStyle}>{v.word}</span>
                       <span className={`w-2/3 px-2 leading-relaxed ${fontFamilyClass} ${tadabburTheme === 'dark' ? 'text-gray-300' : 'text-gray-800'}`} style={customTextStyle}>{v.meaning}</span>
                     </div>
                   ))}
                 </div>
              </div>
            )}

            <div className={`p-4 rounded-2xl flex flex-wrap gap-2 text-[10px] sm:text-xs items-center justify-center ${tadabburTheme === 'dark' ? 'bg-[#121f18] text-gray-500' : tadabburTheme === 'cream' ? 'bg-[#FCF5E3] text-gray-500 border border-[#e0e3c8]' : 'bg-[#f4fcf6] text-gray-500 border border-[#e0f0e6]'}`}>
              <span className="font-bold">{language === 'ar' ? 'المصادر:' : 'Sources:'}</span>
              {aiTafsir.sources?.join(' • ')}
            </div>

          </motion.div>
        )}

        {shareData && (
          <ShareImageModal
            isOpen={!!shareData}
            onClose={() => setShareData(null)}
            type="tadabbur"
            language={language}
            title={shareData.title}
            subtitle={shareData.subtitle}
            text={shareData.text}
          />
        )}

      </div>
    </div>
  );
}
