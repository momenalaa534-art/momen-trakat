import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useStore } from '../store';
import { TopBar } from '../components/TopBar';
import { SURAHS } from '../data/quranSurahs';
import { Search, BookmarkCheck, LayoutGrid, List, PlayCircle, Clock } from 'lucide-react';
import { useTranslation } from '../i18n';

import { Loader2 } from 'lucide-react';

export function FullQuranScreen() {
  const navigate = useStore(s => s.navigate);
  const setSelectedSurah = useStore(s => s.setSelectedSurah);
  const setSelectedAyahToScroll = useStore(s => s.setSelectedAyahToScroll);
  const quranBookmarks = useStore(s => s.quranBookmarks);
  const { language } = useTranslation();
  const [search, setSearch] = useState('');
  const [isGridView, setIsGridView] = useState(false);
  const [activeTab, setActiveTab] = useState<'surahs' | 'bookmarks' | 'ayahs'>('surahs');
  const [ayahResults, setAyahResults] = useState<any[]>([]);
  const [isSearchingAyahs, setIsSearchingAyahs] = useState(false);

  React.useEffect(() => {
    if (activeTab === 'ayahs' && search.trim().length > 2) {
      const timeout = setTimeout(() => {
        searchAyahs(search.trim());
      }, 500);
      return () => clearTimeout(timeout);
    } else if (activeTab === 'ayahs') {
      setAyahResults([]);
    }
  }, [search, activeTab]);

  const searchAyahs = async (q: string) => {
    setIsSearchingAyahs(true);
    try {
      const edition = language === 'ar' ? 'quran-simple-clean' : 'en.sahih';
      const res = await fetch(`https://api.alquran.cloud/v1/search/${encodeURIComponent(q)}/all/${edition}`);
      const data = await res.json();
      if (data.code === 200 && data.data && data.data.matches) {
        setAyahResults(data.data.matches.slice(0, 50));
      } else {
        setAyahResults([]);
      }
    } catch (e) {
      setAyahResults([]);
    } finally {
      setIsSearchingAyahs(false);
    }
  };

  const filteredSurahs = SURAHS.filter(s => 
    s.name.includes(search) || s.englishName.toLowerCase().includes(search.toLowerCase()) || s.number.toString().includes(search)
  );

  const bookmarkedSurahs = SURAHS.filter(s => quranBookmarks[s.number] !== undefined);

  const openSurah = (index: number) => {
    setSelectedSurah(index);
    navigate('surah');
  };

  const openAyah = (surahNumber: number, ayahNumber: number) => {
    setSelectedSurah(surahNumber);
    setSelectedAyahToScroll(ayahNumber);
    navigate('surah');
  };

  // Find the last read surah (for demo we use the first bookmarked, or Al-Fatihah)
  const lastReadSurahId = Object.keys(quranBookmarks).map(Number).sort((a,b) => b-a)[0] || 1;
  const lastReadSurah = SURAHS.find(s => s.number === lastReadSurahId);
  const lastReadAyah = quranBookmarks[lastReadSurahId] || 1;

  const displaySurahs = activeTab === 'surahs' ? filteredSurahs : bookmarkedSurahs;

  return (
    <div className="flex flex-col flex-1 h-full bg-dark">
      <TopBar title={language === 'ar' ? 'القرآن الكريم' : 'Holy Quran'} subTitle={language === 'ar' ? 'تلاوة وحفظ' : 'Read & Memorize'} />
      
      <div className="flex-1 overflow-y-auto px-4 pt-6 pb-24 flex flex-col gap-6 w-full max-w-2xl mx-auto">
        
        {/* Hero: Last Read */}
        {!search && activeTab === 'surahs' && lastReadSurah && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="w-full bg-mid border border-gold/30 rounded-3xl p-6 relative overflow-hidden flex flex-col items-start gap-4 shadow-xl"
          >
            <div className="absolute -left-6 -bottom-6 opacity-5 pointer-events-none text-gold">
              <svg width="150" height="150" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
              </svg>
            </div>
            
            <div className="flex items-center gap-2 text-gold font-cairo text-sm font-bold relative z-10">
              <Clock size={16} />
              <span>{language === 'ar' ? 'آخر قراءة' : 'Last Read'}</span>
            </div>

            <div className="relative z-10">
              <h3 className="font-amiri-quran text-3xl font-bold text-text mb-2">{lastReadSurah.name}</h3>
              <p className="text-light font-cairo text-sm">
                {language === 'ar' ? `آية ${lastReadAyah}` : `Ayah ${lastReadAyah}`}
              </p>
            </div>

            <button 
              onClick={() => openSurah(lastReadSurah.number)}
              className="mt-2 bg-gold text-dark px-6 py-2.5 rounded-full font-cairo font-bold flex items-center gap-2 hover:scale-105 transition-transform relative z-10 shadow-lg border border-gold/50"
            >
              <PlayCircle size={18} />
              {language === 'ar' ? 'متابعة القراءة' : 'Continue'}
            </button>
          </motion.div>
        )}

        {/* Tabs & Search */}
        <div className="flex flex-col gap-4 sticky top-0 z-10 bg-dark pt-2 pb-4">
          <div className="flex bg-mid border border-border/50 rounded-2xl p-1 shadow-inner">
            <button 
              onClick={() => setActiveTab('surahs')}
              className={`flex-1 py-3 rounded-xl font-cairo font-bold text-sm transition-all ${activeTab === 'surahs' ? 'bg-gold text-dark shadow-md' : 'text-light hover:text-text'}`}
            >
              {language === 'ar' ? 'السور' : 'Surahs'}
            </button>
            <button 
              onClick={() => setActiveTab('ayahs')}
              className={`flex-1 py-3 rounded-xl font-cairo font-bold text-sm transition-all ${activeTab === 'ayahs' ? 'bg-gold text-dark shadow-md' : 'text-light hover:text-text'}`}
            >
              {language === 'ar' ? 'البحث بالآيات' : 'Search Ayahs'}
            </button>
            <button 
              onClick={() => setActiveTab('bookmarks')}
              className={`flex-1 py-3 rounded-xl font-cairo font-bold text-sm transition-all ${activeTab === 'bookmarks' ? 'bg-gold text-dark shadow-md' : 'text-light hover:text-text'}`}
            >
              {language === 'ar' ? 'العلامات المرجعية' : 'Bookmarks'}
            </button>
          </div>

          <div className="relative">
            <input 
              type="text"
              placeholder={activeTab === 'ayahs' ? (language === 'ar' ? 'اكتب كلمة للبحث عن آية...' : 'Type to search for an Ayah...') : (language === 'ar' ? 'ابحث عن سورة...' : 'Search for a Surah...')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-mid border border-border rounded-2xl py-4 px-12 text-text outline-none focus:border-gold transition-colors font-cairo shadow-sm placeholder:text-light/50"
              dir={language === 'ar' ? 'rtl' : 'ltr'}
            />
            <Search size={20} className="absolute top-1/2 -translate-y-1/2 right-4 text-light" />
            
            <button 
              onClick={() => setIsGridView(!isGridView)}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center text-light hover:text-gold transition-colors bg-dark/50 rounded-xl"
            >
              {isGridView ? <List size={20} /> : <LayoutGrid size={20} />}
            </button>
          </div>
        </div>

        {/* List Content */}
        {activeTab === 'ayahs' ? (
          <div className="flex flex-col gap-3">
            {isSearchingAyahs ? (
              <div className="text-center py-10">
                <Loader2 className="animate-spin text-gold mx-auto" size={32} />
              </div>
            ) : ayahResults.length > 0 ? (
              ayahResults.map(result => (
                <motion.button
                  key={`${result.surah.number}-${result.numberInSurah}`}
                  onClick={() => openAyah(result.surah.number, result.numberInSurah)}
                  className="bg-mid border border-border p-5 rounded-2xl text-right hover:border-gold transition-colors text-text shadow-sm"
                  dir="rtl"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-gold font-bold font-cairo text-sm bg-dark px-3 py-1 rounded-full border border-border">
                      {result.surah.name} - الآية {result.numberInSurah}
                    </div>
                  </div>
                  <div className="text-xl leading-relaxed font-amiri-quran text-right">
                    {result.text}
                  </div>
                  <div className="text-light font-cairo text-xs mt-3 opacity-70">
                    اضغط للذهاب للآية
                  </div>
                </motion.button>
              ))
            ) : search.trim().length > 2 ? (
              <div className="text-center text-light mt-10 font-cairo">لا توجد نتائج</div>
            ) : (
              <div className="text-center text-light mt-10 font-cairo">اكتب 3 حروف على الأقل للبحث عن الآيات</div>
            )}
          </div>
        ) : (
          <div className={`w-full ${isGridView ? 'grid grid-cols-2 gap-4' : 'flex flex-col gap-3'}`}>
            <AnimatePresence>
              {displaySurahs.map((surah) => {
                const bookmarkedAyah = quranBookmarks[surah.number];

                return (
                <motion.button
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  key={surah.number}
                  onClick={() => openSurah(surah.number)}
                  className={`bg-mid border border-border hover:border-gold rounded-2xl transition-all shadow-sm group ${
                    isGridView ? 'p-6 flex flex-col items-center text-center gap-4' : 'p-4 flex items-center justify-between'
                  }`}
                  dir="rtl"
                >
                  {isGridView ? (
                    <>
                      <div className="relative w-14 h-14 flex items-center justify-center">
                        <svg className="absolute inset-0 w-full h-full text-gold opacity-10 group-hover:opacity-20 transition-opacity" viewBox="0 0 100 100">
                          <path d="M50 5 L85 25 L85 75 L50 95 L15 75 L15 25 Z" fill="currentColor" />
                        </svg>
                        <span className="relative z-10 font-bold text-gold">{surah.number}</span>
                      </div>
                      <div>
                        <h4 className="font-amiri-quran text-2xl text-text mb-2 group-hover:text-gold transition-colors">{surah.name}</h4>
                        <div className="flex flex-col items-center gap-1 font-cairo text-xs text-light">
                          <span>{surah.ayahs} آية</span>
                          <span dir="ltr">{surah.englishName}</span>
                        </div>
                      </div>
                      {bookmarkedAyah && (
                        <div className="absolute top-3 right-3 text-gold">
                           <BookmarkCheck size={18} />
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="flex items-center w-full gap-4">
                      {/* Number Badge */}
                      <div className="relative w-12 h-12 flex-shrink-0 flex items-center justify-center">
                         <svg className="absolute inset-0 w-full h-full text-gold opacity-10 group-hover:opacity-20 transition-opacity" viewBox="0 0 100 100">
                          <path d="M50 5 L85 25 L85 75 L50 95 L15 75 L15 25 Z" fill="currentColor" />
                        </svg>
                        <span className="relative z-10 font-bold text-sm text-gold">{surah.number}</span>
                      </div>

                      {/* Info */}
                      <div className="flex-1 flex flex-col items-start gap-1">
                        <h4 className="font-amiri-quran text-xl sm:text-2xl text-text group-hover:text-gold transition-colors">{surah.name}</h4>
                        <div className="flex items-center gap-2 font-cairo text-xs font-bold opacity-80">
                          <span className="text-gold">{surah.revelationType === 'Meccan' ? 'مكية' : 'مدنية'}</span>
                          <span className="w-1 h-1 rounded-full bg-border"></span>
                          <span className="text-light">{surah.ayahs} آية</span>
                        </div>
                      </div>

                      {/* Right Side */}
                      <div className="flex flex-col items-end gap-2 text-left" dir="ltr">
                        <span className="font-cairo font-bold text-sm text-light opacity-80">{surah.englishName}</span>
                        {bookmarkedAyah && (
                          <div className="flex items-center gap-1 text-xs text-gold font-cairo font-bold bg-gold/10 px-2 py-0.5 rounded-md border border-gold/20">
                            <BookmarkCheck size={14} />
                            <span>{bookmarkedAyah}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </motion.button>
              );
            })}
          </AnimatePresence>

          {displaySurahs.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-light font-cairo text-center">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="mb-4 opacity-50 text-gold">
                <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
              </svg>
              <p>{language === 'ar' ? 'لم يتم العثور على نتائج' : 'No results found'}</p>
            </div>
          )}
          </div>
        )}

      </div>
    </div>
  );
}
