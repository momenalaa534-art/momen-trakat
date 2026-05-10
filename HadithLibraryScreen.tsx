import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Book, Bot, Sparkles, ChevronLeft, Search, Loader2, BookOpen, Share2 } from 'lucide-react';
import { ShareImageModal } from "../components/ShareImageModal";
import { useStore } from '../store';
import { TopBar } from '../components/TopBar';
import { useTranslation } from '../i18n';
import { GoogleGenAI } from '@google/genai';

// Initialize Gemini
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const BOOKS = [
  { id: 'bukhari', name: { ar: 'صحيح البخاري', en: 'Sahih al-Bukhari' } },
  { id: 'muslim', name: { ar: 'صحيح مسلم', en: 'Sahih Muslim' } },
  { id: 'tirmidhi', name: { ar: 'جامع الترمذي', en: 'Jami at-Tirmidhi' } },
  { id: 'abudawud', name: { ar: 'سنن أبي داود', en: 'Sunan Abi Dawud' } },
  { id: 'nasai', name: { ar: 'سنن النسائي', en: 'Sunan an-Nasai' } },
  { id: 'ibnmajah', name: { ar: 'سنن ابن ماجه', en: 'Sunan Ibn Majah' } },
  { id: 'nawawi', name: { ar: 'الأربعون النووية', en: '40 Hadith Nawawi' } },
];

export function HadithLibraryScreen() {
  const { t, language } = useTranslation();
  const goBack = useStore((s) => s.goBack);
  const logActivity = useStore((s) => s.logActivity);
  const [selectedBook, setSelectedBook] = useState<string | null>(null);
  const [earnedHadiths, setEarnedHadiths] = useState<Set<string>>(new Set());
  
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [shareModalData, setShareModalData] = useState({
    isOpen: false,
    text: "",
    title: "",
    subtitle: ""
  });
  const [results, setResults] = useState<Array<{ hadith: string, source: string, explanation: string }>>([]);
  
  const [allBookHadiths, setAllBookHadiths] = useState<any[]>([]);
  const [bookLoading, setBookLoading] = useState(false);
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const observerTarget = useRef(null);

  const handleAISearch = async (searchQuery: string = query) => {
    if (!searchQuery) return;

    setLoading(true);
    setResults([]);
    setSelectedBook(null);
    setAllBookHadiths([]);
    try {
      let prompt = '';
      if (language === 'ar') {
        prompt = `أنت مساعد إسلامي متخصص في الحديث النبوي الشريف.
المستخدم يطلب أحاديث حول: "${searchQuery}"
يرجى جلب 3 أحاديث صحيحة متعلقة بالطلب.
أرجع النتيجة بصيغة JSON فيها مصفوفة اسمها "hadiths"، كل عنصر فيها عبارة عن كائن يحتوي على:
1. "hadith": نص الحديث النبوي الأصلي ومشكلاً إن أمكن.
2. "source": المصدر واسم الكتاب ورقمه (مثال: صحيح البخاري، كتاب الأدب، حديث ١).
3. "explanation": شرح مبسط وموجز للحديث وما يستفاد منه.
تأكد من صحة الأحاديث المذكورة.
أرجع JSON فقط بدون أي إضافة أو تنسيق.`;
      } else {
        prompt = `You are an Islamic assistant specializing in the prophetic Hadith.
The user is requesting hadiths about: "${searchQuery}"
Please provide 3 authentic hadiths related to the query.
Return the result in ONLY JSON format containing an array named "hadiths", each item being an object with:
1. "hadith": The text of the hadith in both Arabic and an English translation.
2. "source": The detailed source (e.g. Sahih al-Bukhari, Book 1, Hadith 1).
3. "explanation": A simple, concise explanation of the hadith.
Return ONLY valid JSON format representing the array, without markdown.`;
      }

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: "application/json",
        }
      });

      let text = response.text;
      if (text) {
        const parsed = JSON.parse(text);
        if (parsed && parsed.hadiths) {
          setResults(parsed.hadiths);
        }
      }
    } catch (e) {
      console.error('Error fetching hadith:', e);
    } finally {
      setLoading(false);
    }
  };

  const loadBook = async (bookId: string) => {
    setBookLoading(true);
    setAllBookHadiths([]);
    setResults([]);
    try {
      const res = await fetch(`https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions/ara-${bookId}.min.json`);
      const data = await res.json();
      if (data && data.hadiths) {
        setAllBookHadiths(data.hadiths);
        setPage(1);
      }
    } catch (e) {
      console.error("Failed to load book", e);
    } finally {
      setBookLoading(false);
    }
  };

  const handleBookClick = (id: string) => {
    if (selectedBook === id) {
      setSelectedBook(null);
      setAllBookHadiths([]);
      setResults([]);
    } else {
      setSelectedBook(id);
      setQuery('');
      setResults([]);
      setAllBookHadiths([]);
      loadBook(id);
    }
  };

  const displayedHadiths = allBookHadiths.slice(0, page * pageSize);
  const hasMore = displayedHadiths.length < allBookHadiths.length;

  const currentBookName = BOOKS.find(b => b.id === selectedBook)?.name[language as 'ar'|'en'] || '';

  const handleShareHadith = (hadithText: string, source: string, explanation?: string) => {
    let combinedText = hadithText;
    if (explanation) {
      combinedText += `\n\n${language === 'ar' ? '💡 شرح:' : '💡 Explanation:'}\n${explanation}`;
    }
    setShareModalData({
      isOpen: true,
      text: combinedText,
      title: source.split(' - ')[0] || source,
      subtitle: source.split(' - ')[1] || "",
    });
  };

  return (
    <div className="flex flex-col flex-1 h-full overflow-hidden bg-dark">
      <TopBar title={language === 'ar' ? 'مكتبة الأحاديث' : 'Hadith Library'} subTitle="" />
      
      <div className="flex-1 overflow-y-auto p-5 pb-24">
        
        {/* Search Bar & AI */}
        <div className="bg-mid border border-border p-5 rounded-2xl shadow-sm mb-6 flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <h2 className="text-gold font-bold text-lg flex items-center gap-2">
              <Search size={20} />
              {language === 'ar' ? 'البحث الذكي في الأحاديث' : 'Smart Hadith Search'}
            </h2>
            <p className="text-light text-sm">
              {language === 'ar' 
                ? 'ابحث عن أي موضوع أو كلمة (مثال: الصبر، الصلاة، التوبة) وسنقوم بجلب أحاديث صحيحة مع شرحها المبسط.' 
                : 'Search any topic or keyword (e.g. patience, prayer, repentance) to get authentic hadiths with explanation.'}
            </p>
          </div>
          
          <div className="relative">
            <input 
              type="text" 
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAISearch()}
              placeholder={language === 'ar' ? 'أدخل كلمة البحث أو الموضوع هنا...' : 'Enter your keyword or topic here...'}
              className="w-full bg-dark border-2 border-border/50 rounded-xl px-4 py-4 pr-12 text-base text-text outline-none focus:border-gold placeholder-light/40 transition-colors"
              dir={language === 'ar' ? 'rtl' : 'ltr'}
            />
            <button 
              onClick={() => handleAISearch()}
              disabled={loading || !query.trim()}
              className="absolute bg-gold rounded-lg text-dark aspect-square h-[calc(100%-16px)] top-2 end-2 flex flex-col justify-center items-center font-bold disabled:opacity-50 hover:bg-gold/90 transition-colors shadow-sm"
            >
              {loading ? <Loader2 size={24} className="animate-spin" /> : <Sparkles size={24} />}
            </button>
          </div>
        </div>

        {/* Books Grid */}
        <h3 className="text-gold font-bold text-sm mb-3">
          {language === 'ar' ? 'الكتب الستة والمجموعات' : 'The Six Books & Collections'}
        </h3>
        <div className="flex overflow-x-auto gap-3 pb-4 scrollbar-hide -mx-2 px-2">
          {BOOKS.map((book) => (
            <button
              key={book.id}
              onClick={() => handleBookClick(book.id)}
              className={`flex-shrink-0 w-32 aspect-square p-3 rounded-xl border flex flex-col items-center justify-center gap-2 transition-all ${
                selectedBook === book.id 
                  ? 'bg-gold/10 border-gold shadow-md' 
                  : 'bg-mid border-border hover:border-gold/50 shadow-sm'
              }`}
            >
              <Book size={32} className={selectedBook === book.id ? 'text-gold' : 'text-light'} />
              <span className={`text-center font-bold text-xs ${selectedBook === book.id ? 'text-text' : 'text-light'}`}>
                {book.name[language as keyof typeof book.name]}
              </span>
            </button>
          ))}
        </div>

        {/* Results Area */}
        <div className="mt-4 space-y-4">
          <AnimatePresence>
            {(loading || bookLoading) && (
               <motion.div 
                 initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                 className="flex flex-col items-center justify-center p-8 gap-3"
               >
                 <Loader2 size={32} className="text-gold animate-spin" />
                 <p className="text-light text-xs font-bold animate-pulse">
                   {language === 'ar' ? 'جاري البحث في كتب السنة...' : 'Searching Hadith collections...'}
                 </p>
               </motion.div>
            )}

            {!loading && !bookLoading && results.length > 0 && results.map((res, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="bg-mid border border-border rounded-xl p-5 shadow-sm flex flex-col gap-3 relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 p-3 opacity-5 text-gold pointer-events-none"><Sparkles size={40} /></div>
                
                <div className="flex justify-between items-start gap-4">
                  <h4 className="text-gold font-bold text-sm bg-dark px-3 py-1.5 rounded-md self-start border border-border/50 shadow-sm">
                    {res.source}
                  </h4>
                  <div className="flex gap-2 z-10 shrink-0">
                    {!earnedHadiths.has(`ai-${idx}`) ? (
                       <button
                         onClick={() => {
                           setEarnedHadiths(prev => new Set(prev).add(`ai-${idx}`));
                           logActivity('athkar', 1, 5);
                         }}
                         className="px-3 py-1.5 bg-gold border border-gold/30 rounded-lg text-dark hover:bg-gold/80 transition-colors text-xs font-bold"
                       >
                         {language === 'ar' ? 'تمت القراءة (+5 نقطة)' : 'Mark Read (+5 XP)'}
                       </button>
                    ) : (
                       <span className="px-3 py-1.5 bg-dark border border-green text-green rounded-lg text-xs font-bold">
                         {language === 'ar' ? 'مكتمل ✅' : 'Read ✅'}
                       </span>
                    )}
                    <button 
                      onClick={() => handleShareHadith(res.hadith, res.source, res.explanation)}
                      className="p-2 bg-dark/50 hover:bg-dark border border-border/30 rounded-lg text-light hover:text-gold transition-colors"
                    >
                      <Share2 size={18} />
                    </button>
                  </div>
                </div>
                
                <p className="text-text text-base sm:text-lg font-amiri font-bold leading-loose relative z-10" dir={language === 'ar' ? 'rtl' : 'ltr'}>
                  {res.hadith}
                </p>
                
                <div className="border-t border-border mt-2 pt-3 flex flex-col gap-1 relative z-10">
                  <span className="text-gold text-[10px] font-bold">
                    {language === 'ar' ? 'الشرح / الفائدة:' : 'Explanation / Lesson:'}
                  </span>
                  <p className="text-light text-xs sm:text-sm leading-relaxed" dir={language === 'ar' ? 'rtl' : 'ltr'}>
                    {res.explanation}
                  </p>
                </div>
              </motion.div>
            ))}

            {!loading && !bookLoading && displayedHadiths.length > 0 && (
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-2 mb-2 bg-dark p-3 rounded-lg border border-border/50">
                  <BookOpen className="text-gold" size={18} />
                  <span className="text-light text-xs font-bold">
                    {language === 'ar' ? 'محتوى كتاب:' : 'Content of Book:'} <span className="text-text">{currentBookName}</span>
                  </span>
                  <span className="ml-auto text-gold text-xs">{allBookHadiths.length} {language === 'ar' ? 'حديث' : 'Hadiths'}</span>
                </div>
                {displayedHadiths.map((item, idx) => (
                  <motion.div 
                    key={item.hadithnumber || idx}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-mid border border-border rounded-xl p-5 shadow-sm flex flex-col gap-3 relative overflow-hidden"
                  >
                  <div className="flex justify-between items-start gap-4">
                    <h4 className="text-gold font-bold text-sm bg-dark px-3 py-1.5 rounded-md self-start border border-border/50 shadow-sm" dir={language === 'ar' ? 'rtl' : 'ltr'}>
                      {currentBookName} - {language === 'ar' ? `حديث رقم ${item.hadithnumber || item.arabicnumber}` : `Hadith No. ${item.hadithnumber || item.arabicnumber}`}
                    </h4>
                    <div className="flex gap-2 z-10 shrink-0">
                      {!earnedHadiths.has(item.hadithnumber?.toString() || idx.toString()) ? (
                         <button
                           onClick={() => {
                             setEarnedHadiths(prev => new Set(prev).add(item.hadithnumber?.toString() || idx.toString()));
                             logActivity('athkar', 1, 5);
                           }}
                           className="px-3 py-1.5 bg-gold border border-gold/30 rounded-lg text-dark hover:bg-gold/80 transition-colors text-xs font-bold"
                         >
                           {language === 'ar' ? 'تمت القراءة (+5 نقطة)' : 'Mark Read (+5 XP)'}
                         </button>
                      ) : (
                         <span className="px-3 py-1.5 bg-dark border border-green text-green rounded-lg text-xs font-bold">
                           {language === 'ar' ? 'مكتمل ✅' : 'Read ✅'}
                         </span>
                      )}
                      <button 
                        onClick={() => handleShareHadith(item.text, `${currentBookName} - ${language === 'ar' ? `حديث رقم ${item.hadithnumber || item.arabicnumber}` : `Hadith No. ${item.hadithnumber || item.arabicnumber}`}`)}
                        className="p-2 bg-dark/50 hover:bg-dark border border-border/30 rounded-lg text-light hover:text-gold transition-colors"
                      >
                        <Share2 size={18} />
                      </button>
                    </div>
                  </div>

                    
                    <p className="text-text text-base sm:text-lg font-amiri font-bold leading-loose relative z-10" dir="rtl">
                      {item.text}
                    </p>
                  </motion.div>
                ))}

                {hasMore && (
                  <button 
                    onClick={() => setPage(p => p + 1)}
                    className="w-full mt-2 py-3 bg-dark border border-border rounded-xl text-gold font-bold hover:bg-gold/10 transition-colors text-sm"
                  >
                    {language === 'ar' ? 'عرض المزيد من الأحاديث' : 'Load More Hadiths'}
                  </button>
                )}
              </div>
            )}

            {!loading && !bookLoading && results.length === 0 && allBookHadiths.length === 0 && !selectedBook && !query && (
              <div className="flex flex-col items-center justify-center p-8 gap-2 opacity-50">
                <Book size={32} className="text-light" />
                <p className="text-light text-xs text-center">
                  {language === 'ar' ? 'اختر كتاباً أو ابدأ البحث عن حديث' : 'Select a book or search for a hadith'}
                </p>
              </div>
            )}
          </AnimatePresence>
        </div>

      </div>

      {/* Back button */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-[300px] z-50">
        <button 
          onClick={goBack}
          className="w-full bg-dark border border-border text-text font-bold py-3 rounded-xl shadow-lg active:scale-95 transition-all text-sm flex justify-center items-center gap-2"
        >
          <ChevronLeft className="rtl:rotate-180" size={18} />
          {language === 'ar' ? 'رجوع' : 'Back'}
        </button>
      </div>

      <ShareImageModal
        isOpen={shareModalData.isOpen}
        onClose={() => setShareModalData(prev => ({ ...prev, isOpen: false }))}
        text={shareModalData.text}
        title={shareModalData.title}
        subtitle={shareModalData.subtitle}
        type="hadith"
        language={language}
      />
    </div>
  );
}
