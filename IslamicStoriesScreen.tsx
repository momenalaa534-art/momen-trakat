import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Search, Loader2, BookOpen, Share2, Filter, Users, X, Image as ImageIcon, Type, Download, Settings2, Play, Pause, SkipForward, SkipBack, Highlighter } from 'lucide-react';
import { useStore } from '../store';
import { TopBar } from '../components/TopBar';
import { GoogleGenAI } from '@google/genai';
import { StoryReader } from '../components/StoryReader';
import { getLocalStory } from '../data/islamicStories';
import { MORE_SAHABA, MORE_SAHABIYAT, MORE_TABIUN, getDailyItems } from '../utils/dailyStories';
import html2canvas from 'html2canvas';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });



const CATEGORIES = [
  { id: 'prophets', name: { ar: 'قصص الأنبياء', en: 'Stories of Prophets' } },
  { id: 'sahaba', name: { ar: 'قصص الصحابة', en: 'Stories of Sahaba' } },
  { id: 'sahabiyat', name: { ar: 'قصص الصحابيات', en: 'Stories of Sahabiyat' } },
  { id: 'tabiun', name: { ar: 'التابعين والصالحين', en: 'Tabi\'un & Righteous' } },
  { id: 'battles', name: { ar: 'الغزوات والمعارك', en: 'Battles & History' } },
];

const CATEGORY_ITEMS: Record<string, { id: string, name: {ar: string, en: string} }[]> = {
  prophets: [
    { id: 'adam', name: { ar: 'آدم عليه السلام', en: 'Adam (AS)' } },
    { id: 'idris', name: { ar: 'إدريس عليه السلام', en: 'Idris (AS)' } },
    { id: 'nuh', name: { ar: 'نوح عليه السلام', en: 'Nuh (AS)' } },
    { id: 'hud', name: { ar: 'هود عليه السلام', en: 'Hud (AS)' } },
    { id: 'salih', name: { ar: 'صالح عليه السلام', en: 'Salih (AS)' } },
    { id: 'ibrahim', name: { ar: 'إبراهيم عليه السلام', en: 'Ibrahim (AS)' } },
    { id: 'lut', name: { ar: 'لوط عليه السلام', en: 'Lut (AS)' } },
    { id: 'ismail', name: { ar: 'إسماعيل عليه السلام', en: 'Ismail (AS)' } },
    { id: 'ishaq', name: { ar: 'إسحاق عليه السلام', en: 'Ishaq (AS)' } },
    { id: 'yaqub', name: { ar: 'يعقوب عليه السلام', en: 'Yaqub (AS)' } },
    { id: 'yusuf', name: { ar: 'يوسف عليه السلام', en: 'Yusuf (AS)' } },
    { id: 'ayyoub', name: { ar: 'أيوب عليه السلام', en: 'Ayyub (AS)' } },
    { id: 'musa', name: { ar: 'موسى عليه السلام', en: 'Musa (AS)' } },
    { id: 'harun', name: { ar: 'هارون عليه السلام', en: 'Harun (AS)' } },
    { id: 'dawud', name: { ar: 'داود عليه السلام', en: 'Dawud (AS)' } },
    { id: 'sulayman', name: { ar: 'سليمان عليه السلام', en: 'Sulayman (AS)' } },
    { id: 'yunus', name: { ar: 'يونس عليه السلام', en: 'Yunus (AS)' } },
    { id: 'zakariya', name: { ar: 'زكريا عليه السلام', en: 'Zakariya (AS)' } },
    { id: 'yahya', name: { ar: 'يحيى عليه السلام', en: 'Yahya (AS)' } },
    { id: 'isa', name: { ar: 'عيسى عليه السلام', en: 'Isa (AS)' } },
    { id: 'muhammad', name: { ar: 'محمد ﷺ', en: 'Muhammad (PBUH)' } },
  ],
  sahaba: getDailyItems(MORE_SAHABA, 5),
  sahabiyat: getDailyItems(MORE_SAHABIYAT, 4),
  tabiun: getDailyItems(MORE_TABIUN, 4),
  battles: [
    { id: 'badr', name: { ar: 'غزوة بدر', en: 'Battle of Badr' } },
    { id: 'uhud', name: { ar: 'غزوة أحد', en: 'Battle of Uhud' } },
    { id: 'ahzab', name: { ar: 'غزوة الخندق (الأحزاب)', en: 'Battle of the Trench' } },
    { id: 'khaybar', name: { ar: 'غزوة خيبر', en: 'Battle of Khaybar' } },
    { id: 'muta', name: { ar: 'معركة مؤتة', en: 'Battle of Mu\'tah' } },
    { id: 'fath_makkah', name: { ar: 'فتح مكة', en: 'Conquest of Makkah' } },
    { id: 'hunayn', name: { ar: 'غزوة حنين', en: 'Battle of Hunayn' } },
    { id: 'tabuk', name: { ar: 'غزوة تبوك', en: 'Battle of Tabuk' } },
  ],
};

export function IslamicStoriesScreen() {
  const language = useStore((s) => s.language);
  
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>('prophets');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Array<{ title: string, story: string, lessons: string[], type: string }>>([]);
  const [sharingObj, setSharingObj] = useState<{ title: string, story: string, lessons: string[] } | null>(null);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const exportRef = useRef<HTMLDivElement>(null);

  const fetchStories = async (searchQuery: string, categoryId: string | null, isId: boolean = false) => {
    setLoading(true);
    setResults([]);

    // Check local robust DB first
    if (isId) {
      const local = getLocalStory(searchQuery, language as 'ar' | 'en');
      if (local) {
        setResults([local]);
        setLoading(false);
        return;
      }
    }

    if (!navigator.onLine) {
      setLoading(false);
      const fallbackTitle = language === 'ar' ? 'أنت غير متصل بالإنترنت' : 'You are offline';
      const fallbackStory = language === 'ar' 
        ? 'عذراً، هذه القصة تحتاج إلى اتصال بالإنترنت لتحميل تفاصيلها الكاملة من المكتبة، يرجى المحاولة لاحقاً.' 
        : 'Sorry, this story requires an internet connection to fetch its full details from the library. Please try again later.';
      
      // Some generic fallback if offline
      setResults([{
        title: fallbackTitle,
        story: fallbackStory,
        lessons: [],
        type: 'Offline'
      }]);
      return;
    }

    try {
      let prompt = '';
      if (language === 'ar') {
        prompt = `أنت موسوعة إسلامية تاريخية كبرى ومؤرخ خبير. طلب المستخدم هو قراءة القصة التاريخية والدينية للبحث التالي:
${categoryId ? `التصنيف: ${CATEGORIES.find(c => c.id === categoryId)?.name.ar}` : ''}
${searchQuery ? `البحث/الاسم: ${searchQuery}` : ''}

تعليمات صارمة جداً جداً:
1. قم بسرد قصة هذه الشخصية أو الحدث **بالتفصيل الممل جداً جداً والكامل**، من البداية وحتى النهاية. لا تختصر أي جزء، بل اذكر كل تفصيلة صغيرة وكبيرة.
2. اذكر كافة الأحداث الهامة، المواقف، المعجزات، الحوارات التاريخية، الغزوات، وأحداث الوفاة بأسلوب أدبي شيق وسرد تاريخي دقيق.
3. يجب أن تكون القصة موسوعية وطويلة جداً (لا تقل عن 1500 إلى 2000 كلمة).
4. لا تقم باختصار أي حدث أو تجاوز أي مرحلة من مراحل حياة الشخصية.
5. تأكد من صحة القصة بالكامل واستنادها إلى المصادر الإسلامية الموثوقة.
6. استخرج الدروس المستفادة.
أعد النتيجة بصيغة JSON التقطيع التالي (تأكد من إبقاء هيكل JSON سليم رغم طول النص):
{
  "stories": [
    {
      "title": "عنوان القصة وتحديد الشخصية",
      "story": "سرد القصة بالكامل والتفصيل الممل جداً جداً والعميق لجميع مراحل الحياة أو تفاصيل الحدث...",
      "lessons": ["الدرس الأول", "الدرس الثاني"],
      "type": "التصنيف (مثال: صحابة / أنبياء)"
    }
  ]
}`;
      } else {
        prompt = `You are a major encyclopedic Islamic historian. The user requested the following historical/religious story:
${categoryId ? `Category: ${CATEGORIES.find(c => c.id === categoryId)?.name.en}` : ''}
${searchQuery ? `Search/Name: ${searchQuery}` : ''}

Extreme Strict Instructions:
1. Narrate the story of this figure or event in **extreme, exhaustive, and complete detail**, from beginning to end. Do not summarize any part; mention every minor and major detail.
2. Mention all important events, situations, miracles, historical dialogues, battles, and death events in an engaging literary style with accurate historical narrative.
3. The story MUST be encyclopedic and very long (at least 1500 to 2000 words).
4. Do not omit or summarize any event or stage of the figure's life.
5. Ensure complete authenticity based on reliable Islamic sources.
6. Extract lessons learned.
Return the result strictly as a JSON object (ensure the JSON structure remains valid despite the long text length):
{
  "stories": [
    {
      "title": "Story Title",
      "story": "The complete, extremely detailed, and profound story covering all life stages or event details...",
      "lessons": ["Lesson 1", "Lesson 2"],
      "type": "Category"
    }
  ]
}`;
      }

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: prompt,
        config: {
          responseMimeType: "application/json",
        }
      });

      const text = response.text;
      const parsed = JSON.parse(text);
      if (parsed && parsed.stories) {
        setResults(parsed.stories);
      }
    } catch (error) {
      console.error('Error fetching stories:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchClick = () => {
    if (query.trim()) {
      fetchStories(query.trim(), selectedCategory, false);
    }
  };

  const handleCategoryClick = (id: string) => {
    setSelectedCategory(id);
    setResults([]);
    setQuery('');
  };

  const handleItemSelect = (item: {id: string, name: {ar: string, en: string}}) => {
    setQuery(item.name[language as 'ar' | 'en']);
    fetchStories(item.id, selectedCategory, true);
  };

  const handleShare = (storyObj: { title: string, story: string, lessons: string[] }) => {
    setSharingObj(storyObj);
  };

  const shareAsText = async () => {
    if (!sharingObj) return;
    const textToShare = `${sharingObj.title}\n\n${sharingObj.story}\n\n${language === 'ar' ? 'الدروس المستفادة:' : 'Lessons Learned:\n'} ${sharingObj.lessons.join(' - ')}`;
    try {
      if (navigator.share) {
        try {
          await navigator.share({
            title: sharingObj.title,
            text: textToShare,
          });
        } catch (e: any) {
          if (e.name !== 'AbortError' && !e.message?.includes('Share canceled') && !e.toString().includes('Share canceled')) {
             await navigator.clipboard.writeText(textToShare);
             alert(language === 'ar' ? 'تم نسخ القصة!' : 'Story copied to clipboard!');
          }
        }
      } else {
        await navigator.clipboard.writeText(textToShare);
        alert(language === 'ar' ? 'تم نسخ القصة!' : 'Story copied to clipboard!');
      }
    } catch (e) {
      console.error('Share failed', e);
    }
  };

  const shareAsImage = async () => {
    if (!exportRef.current || !sharingObj) return;
    setIsGeneratingImage(true);
    
    try {
      // Small delay to ensure the offscreen element is fully rendered in the DOM
      await new Promise(r => setTimeout(r, 100));
      
      const canvas = await html2canvas(exportRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#4E3A2F', // very dark brown border-like background
      });
      
      canvas.toBlob(async (blob) => {
        if (!blob) return;
        const file = new File([blob], `${sharingObj.title.replace(/\s+/g, '_')}.png`, { type: 'image/png' });
        
        try {
          if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
            await navigator.share({
              files: [file],
              title: sharingObj.title,
            });
          } else {
            // Fallback: trigger download
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = file.name;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
          }
        } catch (shareErr: any) {
           if (shareErr.name !== 'AbortError' && !shareErr.message?.includes('canceled')) {
             console.error('Image share failed, attempting download instead', shareErr);
             const url = URL.createObjectURL(blob);
             const a = document.createElement('a');
             a.href = url;
             a.download = file.name;
             document.body.appendChild(a);
             a.click();
             document.body.removeChild(a);
             URL.revokeObjectURL(url);
           }
        }
        setIsGeneratingImage(false);
      }, 'image/png');
      
    } catch (err) {
      console.error("Error generating image:", err);
      setIsGeneratingImage(false);
    }
  };

  const activeItems = selectedCategory ? CATEGORY_ITEMS[selectedCategory] || [] : [];

  return (
    <div className="flex flex-col flex-1 h-full overflow-hidden bg-dark">
      <TopBar 
        title={language === 'ar' ? 'تعلم دينك' : 'Learn Religion'} 
      />

      <div className="flex-1 overflow-y-auto p-5 pb-24">
        
        <div className="bg-mid border border-border p-5 rounded-2xl shadow-sm mb-6 flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <h2 className="text-gold font-bold text-lg flex items-center gap-2">
              <Sparkles size={20} />
              {language === 'ar' ? 'مكتبة القصص الإسلامية الشاملة' : 'Comprehensive Islamic Stories'}
            </h2>
            <p className="text-light text-sm">
              {language === 'ar' 
                ? 'قصص الأنبياء والصحابة بالتفصيل الممل والكامل. اختر قسماً ثم اختر الشخصية ليتم سرد قصتها كاملة.' 
                : 'Stories of Prophets and Sahaba in full detail. Select a category, then a figure to read their complete story.'}
            </p>
          </div>
          
          <div className="relative">
            <input 
              type="text" 
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearchClick()}
              placeholder={language === 'ar' ? 'أو ابحث باسم شخصية أو حدث...' : 'Or search for a specific name/event...'}
              className="w-full bg-dark border-2 border-border/50 rounded-xl px-4 py-4 pr-12 text-base text-text outline-none focus:border-gold placeholder-light/40 transition-colors"
              dir={language === 'ar' ? 'rtl' : 'ltr'}
            />
            <button 
              onClick={handleSearchClick}
              disabled={loading || !query.trim()}
              className="absolute bg-gold rounded-lg text-dark aspect-square h-[calc(100%-16px)] top-2 end-2 flex flex-col justify-center items-center font-bold disabled:opacity-50 hover:bg-gold/90 transition-colors shadow-sm"
            >
              {loading ? <Loader2 size={24} className="animate-spin" /> : <Search size={24} />}
            </button>
          </div>

          <div className="pt-2 border-t border-border/50">
            <div className="flex items-center gap-2 mb-3">
              <Filter size={16} className="text-light" />
              <span className="text-light text-xs font-bold">{language === 'ar' ? 'الأقسام الرئيسية:' : 'Main Categories:'}</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => handleCategoryClick(cat.id)}
                  className={`px-3 py-1.5 rounded-full text-sm font-bold transition-all border ${
                    selectedCategory === cat.id 
                      ? 'bg-gold text-dark border-gold' 
                      : 'bg-dark text-light border-border hover:border-gold/50'
                  }`}
                >
                  {cat.name[language as 'ar' | 'en']}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Dynamic Category Items List */}
        {!loading && results.length === 0 && activeItems.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-4">
              <Users size={18} className="text-gold" />
              <h3 className="text-text font-bold text-base">
                {language === 'ar' ? 'اختر الشخصية أو الحدث:' : 'Select a Figure or Event:'}
              </h3>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {activeItems.map(item => (
                <button
                  key={item.id}
                  onClick={() => handleItemSelect(item)}
                  className="bg-mid border border-border hover:border-gold p-3 rounded-xl flex items-center justify-center transition-colors shadow-sm"
                >
                  <span className="text-light hover:text-gold font-bold text-sm text-center">
                    {item.name[language as 'ar' | 'en']}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Results Area */}
        <div className="space-y-4">
          <AnimatePresence>
            {loading && (
               <motion.div 
                 initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                 className="flex flex-col items-center justify-center p-8 gap-3"
               >
                 <Loader2 size={32} className="text-gold animate-spin" />
                 <p className="text-light text-sm font-bold">{language === 'ar' ? 'جاري استخراج وتفصيل القصة بالكامل... يرجى الانتظار.' : 'Extracting and detailing the complete story... please wait.'}</p>
                 <p className="text-light/50 text-xs text-center">{language === 'ar' ? 'هذا قد يستغرق بعض الوقت نظراً للتفاصيل الدقيقة.' : 'This might take a moment due to the detailed content.'}</p>
               </motion.div>
            )}

            {!loading && results.length > 0 && results.map((res, idx) => (
              <StoryReader 
                key={idx} 
                story={res} 
                language={language} 
                onShare={handleShare} 
              />
            ))}

            {!loading && results.length === 0 && activeItems.length === 0 && !query && (
              <div className="flex flex-col items-center justify-center p-8 gap-2 opacity-50 text-center">
                <BookOpen size={32} className="text-light" />
                <p className="text-light text-sm">
                  {language === 'ar' 
                    ? 'اختر قسماً أو ابحث عن قصة لتعرض هنا' 
                    : 'Select a category or search for a story to display here'}
                </p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Share Modal */}
      <AnimatePresence>
        {sharingObj && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-dark/80 backdrop-blur-sm flex justify-center items-end sm:items-center p-4"
            onClick={() => !isGeneratingImage && setSharingObj(null)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-mid border border-border w-full max-w-md rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl relative"
            >
              <button
                onClick={() => setSharingObj(null)}
                disabled={isGeneratingImage}
                className="absolute top-4 end-4 p-2 text-light hover:text-gold transition-colors disabled:opacity-50"
              >
                <X size={24} />
              </button>
              
              <h3 className="text-xl font-bold text-gold mb-2 pr-8">
                {language === 'ar' ? 'مشاركة القصة' : 'Share Story'}
              </h3>
              <p className="text-light text-sm mb-6">
                {language === 'ar' 
                  ? 'اختر طريقة المشاركة المفضلة لديك. يمكنك مشاركتها كنص أو كصورة جميلة بتصميم عتيق.' 
                  : 'Choose how you want to share. You can share as text or as a beautiful vintage image.'}
              </p>

              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={shareAsText}
                  disabled={isGeneratingImage}
                  className="flex flex-col items-center justify-center p-6 bg-dark border border-border hover:border-gold rounded-2xl gap-3 transition-colors group disabled:opacity-50"
                >
                  <div className="w-12 h-12 rounded-full bg-mid flex items-center justify-center group-hover:bg-gold group-hover:text-dark transition-colors">
                    <Type size={24} className={language === 'ar' ? 'text-light group-hover:text-dark' : 'text-light group-hover:text-dark'} />
                  </div>
                  <span className="text-text font-bold text-sm">
                    {language === 'ar' ? 'نص فقط' : 'Text Only'}
                  </span>
                </button>

                <button
                  onClick={shareAsImage}
                  disabled={isGeneratingImage}
                  className="flex flex-col items-center justify-center p-6 bg-dark border border-border hover:border-gold rounded-2xl gap-3 transition-colors group relative overflow-hidden"
                >
                  <div className="w-12 h-12 rounded-full bg-mid flex items-center justify-center group-hover:bg-gold group-hover:text-dark transition-colors">
                    {isGeneratingImage ? <Loader2 size={24} className="animate-spin text-gold" /> : <ImageIcon size={24} className="text-light group-hover:text-dark" />}
                  </div>
                  <span className="text-text font-bold text-sm text-center">
                    {language === 'ar' ? 'صورة (ورق قديم)' : 'Image (Old Paper)'}
                  </span>
                  
                  {isGeneratingImage && (
                    <div className="absolute inset-0 bg-dark/50 flex items-center justify-center backdrop-blur-sm">
                       <span className="text-gold font-bold text-xs bg-dark px-3 py-1 rounded-full border border-gold/30">
                          {language === 'ar' ? 'جاري الصنع...' : 'Generating...'}
                       </span>
                    </div>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hidden Export Element */}
      {sharingObj && (
        <div style={{ position: 'absolute', top: '-10000px', left: '-10000px' }}>
          <div 
            ref={exportRef}
            style={{
              width: '800px',
              backgroundColor: '#fdf5e6',
              backgroundImage: 'linear-gradient(to right, #eaddc5, #fdf5e6, #eaddc5)',
              color: '#342211',
              padding: '60px',
              fontFamily: "'Amiri', serif",
              direction: language === 'ar' ? 'rtl' : 'ltr',
              boxSizing: 'border-box'
            }}
          >
            <div style={{
              border: '2px solid #a88a64',
              padding: '40px',
              borderRadius: '12px',
              position: 'relative'
            }}>
              {/* Decorative corners */}
              <div style={{ position: 'absolute', top: '-6px', left: '-6px', width: '20px', height: '20px', borderTop: '4px solid #8b6e4a', borderLeft: '4px solid #8b6e4a' }}></div>
              <div style={{ position: 'absolute', top: '-6px', right: '-6px', width: '20px', height: '20px', borderTop: '4px solid #8b6e4a', borderRight: '4px solid #8b6e4a' }}></div>
              <div style={{ position: 'absolute', bottom: '-6px', left: '-6px', width: '20px', height: '20px', borderBottom: '4px solid #8b6e4a', borderLeft: '4px solid #8b6e4a' }}></div>
              <div style={{ position: 'absolute', bottom: '-6px', right: '-6px', width: '20px', height: '20px', borderBottom: '4px solid #8b6e4a', borderRight: '4px solid #8b6e4a' }}></div>

              <h1 style={{ textAlign: 'center', color: '#5a3d1d', fontSize: '42px', fontWeight: 'bold', marginBottom: '40px', borderBottom: '1px dashed #c4b094', paddingBottom: '20px' }}>
                {sharingObj.title}
              </h1>
              
              <p style={{ fontSize: '24px', lineHeight: '2.4', whiteSpace: 'pre-wrap', textAlign: 'justify', color: '#3d2813' }}>
                {sharingObj.story}
              </p>

              {sharingObj.lessons && sharingObj.lessons.length > 0 && (
                <div style={{ marginTop: '50px', backgroundColor: 'rgba(139, 110, 74, 0.05)', padding: '30px', borderRadius: '8px', border: '1px solid rgba(139, 110, 74, 0.2)' }}>
                  <h2 style={{ fontSize: '26px', fontWeight: 'bold', color: '#5a3d1d', marginBottom: '20px' }}>
                    {language === 'ar' ? 'الدروس والعبر المستفادة:' : 'Lessons and Insights:'}
                  </h2>
                  <ul style={{ fontSize: '22px', lineHeight: '2.0', color: '#3d2813', paddingInlineStart: '30px' }}>
                    {sharingObj.lessons.map((lesson, i) => (
                      <li key={i} style={{ marginBottom: '12px' }}>{lesson}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              <div style={{ marginTop: '60px', textAlign: 'center', color: '#8b6e4a', fontSize: '18px', borderTop: '1px solid #dcd0bc', paddingTop: '20px' }}>
                 تم الإنشاء بواسطة تطبيق منارة الإسلام - {new Date().getFullYear()}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

