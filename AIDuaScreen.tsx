import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useStore } from '../store';
import { TopBar } from '../components/TopBar';
import { useTranslation } from '../i18n';
import { GoogleGenAI } from '@google/genai';
import { Sparkles, Loader2, ArrowRight, Share2, ChevronLeft, X } from 'lucide-react';
import { ShareImageModal } from '../components/ShareImageModal';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const QUICK_SUGGESTIONS = {
  ar: [
    'للامتحانات والتوفيق',
    'للزواج وتيسير الأمور',
    'للموت وفقدان عزيز',
    'للشفاء من المرض',
    'للرزق وتسديد الديون',
    'للقلق والتوتر',
    'للحزن والضيق',
  ],
  en: [
    'For exams and success',
    'For marriage and ease',
    'For death or loss of a loved one',
    'For sickness and healing',
    'For provision and debt',
    'For anxiety and stress',
    'For sadness and distress',
  ]
};

const PRESET_DUA_CATEGORIES = [
  {
    id: 'travel',
    title: { ar: 'أدعية السفر', en: 'Travel Duas' },
    image: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=600&q=80',
    duas: [
      { ar: 'الله أكبر، الله أكبر، الله أكبر، ﴿سُبْحَانَ الَّذِي سَخَّرَ لَنَا هَذَا وَمَا كُنَّا لَهُ مُقْرِنِينَ * وَإِنَّا إِلَى رَبِّنَا لَمُنقَلِبُونَ﴾', desc: { ar: 'دعاء ركوب الدابة (أو السيارة/الطائرة).', en: 'Dua for traveling on a vehicle.' } },
      { ar: 'اللهم إنا نسألك في سفرنا هذا البر والتقوى، ومن العمل ما ترضى، اللهم هون علينا سفرنا هذا واطو عنا بعده.', desc: { ar: 'دعاء بداية السفر.', en: 'Dua for starting a journey.' } },
      { ar: 'أستودع الله دينكم وأمانتكم وخواتيم أعمالكم.', desc: { ar: 'دعاء توديع المسافر.', en: 'Dua when bidding farewell to a traveler.'} },
      { ar: 'آيِبُونَ تَائِبُونَ عَابِدُونَ لِرَبِّنَا حَامِدُونَ', desc: { ar: 'دعاء الرجوع من السفر.', en: 'Dua upon returning from a journey.' } }
    ]
  },
  {
    id: 'food',
    title: { ar: 'أدعية الطعام', en: 'Food Duas' },
    image: 'https://images.unsplash.com/photo-1543353071-873f17a7a088?auto=format&fit=crop&w=600&q=80',
    duas: [
      { ar: 'بِسْمِ اللهِ', desc: { ar: 'عند بدء الأكل.', en: 'When starting to eat.' } },
      { ar: 'بِسْمِ اللَّهِ أَوَّلَهُ وَآخِرَهُ', desc: { ar: 'اذا نسيت التسمية في الأول.', en: 'If you forgot to say Bismillah at the beginning.'} },
      { ar: 'اللَّهُمَّ بَارِكْ لَنَا فِيهِ وَأَطْعِمْنَا خَيْراً مِنْهُ', desc: { ar: 'عند الفراغ من الطعام أو الشراب (غير اللبن).', en: 'After finishing food or drink.' } },
      { ar: 'الحَمْدُ للهِ الَّذِي أَطْعَمَنِي هَذَا وَرَزَقَنِيهِ مِنْ غَيْرِ حَوْلٍ مِنِّي وَلا قُوَّةٍ', desc: { ar: 'بعد الفراغ من الأكل.', en: 'After finishing the meal.' } },
      { ar: 'ذَهَبَ الظَّمَأُ وَابْتَلَّتِ الْعُرُوقُ، وَثَبَتَ الأَجْرُ إِنْ شَاءَ اللهُ', desc: { ar: 'دعاء الصائم عند الإفطار.', en: 'Dua when breaking the fast.' } }
    ]
  },
  {
    id: 'sleep',
    title: { ar: 'أدعية النوم', en: 'Sleeping Duas' },
    image: 'https://images.unsplash.com/photo-1515894203077-94df09bcedd9?auto=format&fit=crop&w=600&q=80',
    duas: [
      { ar: 'بِاسْمِكَ رَبِّي وَضَعْتُ جَنْبِي، وَبِكَ أَرْفَعُهُ، فَإِنْ أَمْسَكْتَ نَفْسِي فَارْحَمْهَا، وَإِنْ أَرْسَلْتَهَا فَاحْفَظْهَا بِمَا تَحْفَظُ بِهِ عِبَادَكَ الصَّالِحِينَ.', desc: { ar: 'عند الاستلقاء للنوم.', en: 'When lying down to sleep.' } },
      { ar: 'بِاسْمِكَ اللَّهُمَّ أَمُوتُ وَأَحْيَا', desc: { ar: 'قبل النوم مباشرة.', en: 'Right before sleeping.' } },
      { ar: 'سُبْحَانَ اللَّهِ (33)، وَالْحَمْدُ لِلَّهِ (33)، وَاللَّهُ أَكْبَرُ (34)', desc: { ar: 'تسبيح قبل النوم.', en: 'Tasbeeh before sleeping.' } },
      { ar: 'الحَمْدُ للهِ الَّذِي أَحْيَانَا بَعْدَ مَا أَمَاتَنَا وَإِلَيْهِ النُّشُورُ', desc: { ar: 'عند الاستيقاظ من النوم.', en: 'Upon waking up.'} }
    ]
  },
  {
    id: 'morning',
    title: { ar: 'أذكار الصباح والمساء', en: 'Morning & Evening Duas' },
    image: 'https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?auto=format&fit=crop&w=600&q=80',
    duas: [
      { ar: 'اللَّهُمَّ بِكَ أَصْبَحْنَا، وَبِكَ أَمْسَيْنَا، وَبِكَ نَحْيَا، وَبِكَ نَمُوتُ، وَإِلَيْكَ النُّشُورُ', desc: { ar: 'دعاء الصباح.', en: 'Morning dua.' } },
      { ar: 'اللَّهُمَّ بِكَ أَمْسَيْنَا، وَبِكَ أَصْبَحْنَا، وَبِكَ نَحْيَا، وَبِكَ نَمُوتُ، وَإِلَيْكَ الْمَصِيرُ', desc: { ar: 'دعاء المساء.', en: 'Evening dua.'} },
      { ar: 'رَضِيتُ بِاللَّهِ رَبًّا، وَبِالْإِسْلَامِ دِينًا، وَبِمُحَمَّدٍ صَلَّى اللَّهُ عَلَيْهِ وَسَلَّمَ نَبِيًّا', desc: { ar: 'من قالها صباحاً ومساءً حق على الله أن يرضيه.', en: 'Who says this morning and evening, Allah will surely please him.' } },
      { ar: 'حَسْبِيَ اللَّهُ لَا إِلَهَ إِلَّا هُوَ عَلَيْهِ تَوَكَّلْتُ وَهُوَ رَبُّ الْعَرْشِ الْعَظِيمِ', desc: { ar: 'تُقال 7 مرات صباحاً ومساءً.', en: 'Said 7 times morning and evening.' } },
      { ar: 'يَا حَيُّ يَا قَيُّومُ بِرَحْمَتِكَ أَسْتَغِيثُ، أَصْلِحْ لِي شَأْنِي كُلَّهُ وَلَا تَكِلْنِي إِلَى نَفْسِي طَرْفَةَ عَيْنٍ', desc: { ar: 'دعاء شامل في الصباح والمساء.', en: 'Comprehensive dua in the morning and evening.' } }
    ]
  },
  {
    id: 'pain',
    title: { ar: 'أدعية المرض والألم', en: 'Healing & Pain' },
    image: 'https://images.unsplash.com/photo-1584515933487-779824d29309?auto=format&fit=crop&w=600&q=80',
    duas: [
      { ar: 'أَسْأَلُ اللَّهَ الْعَظِيمَ رَبَّ الْعَرْشِ الْعَظِيمِ أَنْ يَشْفِيَكَ', desc: { ar: 'دعاء لزيارة المريض (7 مرات).', en: 'Dua when visiting the sick (7 times).' } },
      { ar: 'اللهم رب الناس أذهب البأس، اشف أنت الشافي، لا شفاء إلا شفاؤك، شفاء لا يغادر سقما', desc: { ar: 'دعاء شفاء المريض.', en: 'Dua for healing the sick.' } },
      { ar: 'بِاسْمِ اللَّهِ (ثلاثاً) أَعُوذُ بِاللَّهِ وَقُدْرَتِهِ مِنْ شَرِّ مَا أَجِدُ وَأُحَاذِرُ (سبع مرات).', desc: { ar: 'يُقال مع وضع اليد على مكان الألم.', en: 'Said while placing hand on the area of pain.'} }
    ]
  },
  {
    id: 'studying',
    title: { ar: 'أدعية المذاكرة والامتحان', en: 'Studying & Exams' },
    image: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&w=600&q=80',
    duas: [
      { ar: 'اللهم لا سهل إلا ما جعلته سهلاً، وأنت تجعل الحزن إذا شئت سهلاً', desc: { ar: 'عند مواجهة صعوبة في الامتحان.', en: 'When facing difficulty in an exam.' } },
      { ar: 'رب اشرح لي صدري ويسر لي أمري واحلل عقدة من لساني يفقهوا قولي', desc: { ar: 'عند البدء بالمذاكرة.', en: 'When starting to study.' } },
      { ar: 'اللهم إني أستودعك ما قرأت وما حفظت وما تعلمت، فرده عند حاجتي إليه، إنك على كل شيء قدير', desc: { ar: 'بعد الانتهاء من المذاكرة.', en: 'After finishing studying.' } }
    ]
  },
  {
    id: 'distress',
    title: { ar: 'أدعية الهم والحزن', en: 'Distress & Sorrow' },
    image: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=600&q=80',
    duas: [
      { ar: 'لا إله إلا أنت سبحانك إني كنت من الظالمين', desc: { ar: 'دعاء ذي النون لتفريج الكروب.', en: 'Dua of Yunus for relieving distress.' } },
      { ar: 'اللهم إني أعوذ بك من الهم والحزن، والعجز والكسل، والبخل والجبن، وضلع الدين، وغلبة الرجال', desc: { ar: 'الاستعاذة من مسببات الضيق.', en: 'Seeking refuge from causes of distress.' } },
      { ar: 'اللهم رحمتك أرجو فلا تكلني إلى نفسي طرفة عين، وأصلح لي شأني كله لا إله إلا أنت', desc: { ar: 'دعاء المكروب والمهموم.', en: 'Dua for the distressed.' } }
    ]
  },
  {
    id: 'parents',
    title: { ar: 'أدعية للوالدين', en: 'Duas for Parents' },
    image: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=600&q=80',
    duas: [
      { ar: 'رَّبِّ ارْحَمْهُمَا كَمَا رَبَّيَانِي صَغِيرًا', desc: { ar: 'دعاء بالرحمة للوالدين.', en: 'Dua for mercy upon parents.' } },
      { ar: 'رَبَّنَا اغْفِرْ لِي وَلِوَالِدَيَّ وَلِلْمُؤْمِنِينَ يَوْمَ يَقُومُ الْحِسَابُ', desc: { ar: 'استغفار شامل للنفس والوالدين.', en: 'Seeking forgiveness for oneself and parents.' } },
      { ar: 'اللهم اغفر لوالدي وارحمهما وعافهما واعف عنهما، وأكرم نزلهما، ووسع مدخلهما', desc: { ar: 'دعاء شامل للمتوفين من الوالدين.', en: 'Dua for deceased parents.' } }
    ]
  },
  {
    id: 'rain',
    title: { ar: 'أدعية المطر', en: 'Rain Duas' },
    image: 'https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?auto=format&fit=crop&w=600&q=80',
    duas: [
      { ar: 'اللَّهُمَّ صَيِّبًا نَافِعًا', desc: { ar: 'عند نزول المطر.', en: 'When the rain falls.' } },
      { ar: 'مُطِرْنَا بِفَضْلِ اللَّهِ وَرَحْمَتِهِ', desc: { ar: 'بعد نزول المطر.', en: 'After the rain heavily falls.' } },
      { ar: 'اللَّهُمَّ حَوَالَيْنَا وَلاَ عَلَيْنَا، اللَّهُمَّ عَلَى الآكَامِ وَالظِّرَابِ، وَبُطُونِ الأَوْدِيَةِ، وَمَنَابِتِ الشَّجَرِ', desc: { ar: 'عند الخوف من ضرر المطر الغزير.', en: 'When fearing damage from heavy rain.' } },
      { ar: 'اللَّهُمَّ صَيِّبًا هَنِيئًا', desc: { ar: 'من أدعية المطر المستحبة.', en: 'Desirable dua for rainfall.' } },
      { ar: 'سبحان الذي يسبح الرعد بحمده والملائكة من خيفته', desc: { ar: 'عند سماع الرعد.', en: 'Upon hearing thunder.' } }
    ]
  },
  {
    id: 'sustenance',
    title: { ar: 'أدعية الرزق والبركة', en: 'Sustenance & Blessing' },
    image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=80',
    duas: [
      { ar: 'اللهم إني أسألك علماً نافعاً، ورزقاً طيباً، وعملاً متقبلاً', desc: { ar: 'بعد صلاة الفجر للرزق.', en: 'After Fajr prayer for sustenance.' } },
      { ar: 'اللهم اكفني بحلالك عن حرامك، وأغنني بفضلك عمن سواك', desc: { ar: 'لسداد الدين وسعة الرزق.', en: 'For paying off debt and wealth.' } },
      { ar: 'اللهم ارزقني رزقاً حلالاً طيباً من غير كد، واستجب دعائي من غير رد', desc: { ar: 'طلب الرزق والبركة.', en: 'Seeking halal provision and blessings.' } },
      { ar: 'ما شاء الله لا قوة إلا بالله', desc: { ar: 'للحفظ من العين ولدوام النعمة.', en: 'For protection from evil eye and sustaining blessings.' } }
    ]
  },
  {
    id: 'protection',
    title: { ar: 'أدعية الحفظ والتحصين', en: 'Protection Duas' },
    image: 'https://images.unsplash.com/photo-1519817650390-64a93db51149?auto=format&fit=crop&w=600&q=80',
    duas: [
      { ar: 'بِسْمِ اللَّهِ الَّذِي لَا يَضُرُّ مَعَ اسْمِهِ شَيْءٌ فِي الْأَرْضِ وَلَا فِي السَّمَاءِ وَهُوَ السَّمِيعُ الْعَلِيمُ', desc: { ar: 'يقال 3 مرات صباحاً ومساءً للتحصين.', en: 'Said 3 times morning & evening for protection.' } },
      { ar: 'أعوذ بكلمات الله التامات من شر ما خلق', desc: { ar: 'للحماية من شر المخلوقات.', en: 'For protection from evil creations.' } },
      { ar: 'اللهم إني أستودعك نفسي وأهلي ومالي وديني', desc: { ar: 'لحفظ النفس والأهل.', en: 'To protect oneself and family.' } },
      { ar: 'اللهم احفظني من بين يدي ومن خلفي وعن يميني وعن شمالي ومن فوقي وأعوذ بعظمتك أن أغتال من تحتي', desc: { ar: 'للتحصين الشامل في كل الاتجاهات.', en: 'Comprehensive protection in all directions.' } }
    ]
  },
  {
    id: 'forgiveness',
    title: { ar: 'أدعية التوبة والمغفرة', en: 'Repentance & Forgiveness' },
    image: 'https://images.unsplash.com/photo-1542171497-6a2c36f2e825?auto=format&fit=crop&w=600&q=80',
    duas: [
      { ar: 'اللَّهُمَّ أَنْتَ رَبِّي لَا إِلَهَ إِلَّا أَنْتَ، خَلَقْتَنِي وَأَنَا عَبْدُكَ، وَأَنَا عَلَى عَهْدِكَ وَوَعْدِكَ مَا اسْتَطَعْتُ..', desc: { ar: 'سيد الاستغفار وأعظمه.', en: 'The best and greatest form of seeking forgiveness.' } },
      { ar: 'رَبَّنَا ظَلَمْنَا أَنفُسَنَا وَإِن لَّمْ تَغْفِرْ لَنَا وَتَرْحَمْنَا لَنَكُونَنَّ مِنَ الْخَاسِرِينَ', desc: { ar: 'دعاء آدم عليه السلام بالاعتراف بالذنب.', en: 'Adam\'s dua acknowledging sin.' } },
      { ar: 'أستغفر الله العظيم الذي لا إله إلا هو الحي القيوم وأتوب إليه', desc: { ar: 'يغفر للشخص وإن كان قد فر من الزحف.', en: 'Forgives sins even if one fled from battle.' } },
      { ar: 'اللهم اغفر لي خطيئتي وجهلي وإسرافي في أمري وما أنت أعلم به مني', desc: { ar: 'دعاء شامل للمغفرة.', en: 'Comprehensive dua for forgiveness.' } }
    ]
  }
];

export function AIDuaScreen() {
  const [activeTab, setActiveTab] = useState<'ai' | 'presets'>('ai');
  const [selectedCategory, setSelectedCategory] = useState<typeof PRESET_DUA_CATEGORIES[0] | null>(null);

  const [input, setInput] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'result'>('idle');
  const [results, setResults] = useState<{ ar: string; desc: string }[]>([]);
  const { t, language } = useTranslation();
  const logActivity = useStore(s => s.logActivity);
  const [earnedDuas, setEarnedDuas] = useState<Set<string>>(new Set());

  const [showShareCard, setShowShareCard] = useState(false);
  const [selectedDuaToShare, setSelectedDuaToShare] = useState<{ar: string, desc: string} | null>(null);

  const handleShareDua = (dua: {ar: string, desc: string}) => {
    setSelectedDuaToShare(dua);
    setShowShareCard(true);
  };

  const handleGenerate = async (queryOverride?: string) => {
    const val = queryOverride || input.trim();
    if (!val) {
      alert(t('ai.emptyAlert'));
      return;
    }

    // Set input to the chip text if clicked
    if (queryOverride) {
      setInput(queryOverride);
    }

    setStatus('loading');
    setResults([]);

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `You are an Islamic assistant. The user needs authentic Duas for the following situation: "${val}"
Please provide 3 authentic Islamic Duas suitable for this situation.
For each Dua, provide the Arabic text and a brief explanation/translation in ${language === 'ar' ? 'Arabic' : 'English'}.
Format the response ONLY as a JSON array of objects, with each object having two properties: "ar" (the Arabic Dua) and "desc" (the explanation).
Example: [{"ar": "اللهم...", "desc": "دعاء كذا..."}, {"ar": "...", "desc": "..."}]
Do not include any other markdown or text outside the JSON array.`,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.7,
        }
      });

      const text = response.text || "[]";
      const parsed = JSON.parse(text);
      
      if (Array.isArray(parsed) && parsed.length > 0) {
        setResults(parsed);
        setStatus('result');
      } else {
        throw new Error("Invalid format");
      }

    } catch (err) {
      console.error(err);
      alert(language === 'ar' ? 'حدث خطأ أثناء جلب الأدعية، حاول مرة أخرى.' : 'Error generating Duas, please try again.');
      setStatus('idle');
    }
  };

  const currentSuggestions = QUICK_SUGGESTIONS[language as keyof typeof QUICK_SUGGESTIONS];

  return (
    <div className="flex flex-col flex-1 h-full bg-dark">
      <TopBar title={"🤖 " + t('ai.title')} subTitle={t('ai.subtitle')} />
      
      {!selectedCategory && (
        <div className="px-5 pt-4">
          <div className="flex bg-mid rounded-xl p-1 shadow-sm border border-border">
            <button
              onClick={() => setActiveTab('ai')}
              className={`flex-1 py-2 text-xs sm:text-sm font-bold text-center rounded-lg transition-colors ${activeTab === 'ai' ? 'bg-gold text-dark' : 'text-light hover:text-white'}`}
            >
              {language === 'ar' ? 'البحث بالذكاء الاصطناعي' : 'AI Search'}
            </button>
            <button
              onClick={() => setActiveTab('presets')}
              className={`flex-1 py-2 text-xs sm:text-sm font-bold text-center rounded-lg transition-colors ${activeTab === 'presets' ? 'bg-gold text-dark' : 'text-light hover:text-white'}`}
            >
              {language === 'ar' ? 'أدعية منوعة' : 'Various Duas'}
            </button>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-6">
        
        {activeTab === 'ai' && !selectedCategory && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-6">
            <div className="bg-mid border border-border rounded-xl p-4 shadow-sm">
              <label className="block text-light text-[10px] mb-2">{t('ai.inputLabel')}</label>
              <textarea 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={t('ai.inputPlaceholder')}
                className="w-full bg-transparent border border-border/50 rounded-lg text-text text-sm p-3 min-h-[100px] outline-none focus:border-gold transition-colors resize-none placeholder:text-light/50"
              />
            </div>

            <button 
              onClick={() => handleGenerate()}
              disabled={status === 'loading'}
              className="bg-gold text-dark font-bold text-sm py-3.5 rounded-xl shadow-md active:scale-95 disabled:opacity-50 transition-all w-full flex items-center justify-center gap-2"
            >
              {status === 'loading' ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
              {status === 'loading' ? t('ai.loadingBtn') : t('ai.generateBtn')}
            </button>

            {status === 'idle' && (
              <div className="mt-2">
                <h3 className="text-light text-xs font-bold mb-3">{language === 'ar' ? 'أو اختر من الحالات الشائعة:' : 'Or choose from common situations:'}</h3>
                <div className="flex flex-wrap gap-2">
                  {currentSuggestions.map((suggestion, i) => (
                    <button
                      key={i}
                      onClick={() => handleGenerate(suggestion)}
                      className="px-3 py-2 bg-mid border border-border rounded-lg text-xs text-text hover:border-gold hover:text-gold transition-colors text-right"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <AnimatePresence mode="wait">
              {status === 'loading' && (
                <motion.div 
                  key="loading"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="flex flex-col items-center gap-3 mt-4"
                >
                  <div className="flex gap-2">
                    <motion.div animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0 }} className="w-2 h-2 rounded-full bg-gold" />
                    <motion.div animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }} className="w-2 h-2 rounded-full bg-gold" />
                    <motion.div animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.4 }} className="w-2 h-2 rounded-full bg-gold" />
                  </div>
                  <div className="text-light text-[9px]">{t('ai.searchingInfo')}</div>
                </motion.div>
              )}

              {status === 'result' && results.length > 0 && (
                <motion.div 
                  key="result"
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col gap-4 mt-2 mb-10 pb-10"
                >
                  <div className="text-light text-[11px] font-bold text-center mb-2">{t('ai.resultLabel')}</div>
                  {results.map((res, idx) => (
                    <div key={idx} className="bg-mid border border-gold/40 rounded-xl p-5 text-center shadow-lg relative overflow-hidden group">
                      <div className="absolute top-3 left-3 flex gap-2 z-20">
                        {!earnedDuas.has(`ai-${idx}`) ? (
                           <button
                             onClick={() => {
                               setEarnedDuas(prev => new Set(prev).add(`ai-${idx}`));
                               logActivity('dua', 1, 5);
                             }}
                             className="px-3 py-1 bg-gold border border-gold/30 rounded-full text-dark hover:bg-gold/80 transition-colors text-[10px] font-bold"
                           >
                             {language === 'ar' ? 'تمت القراءة (+5 نقطة)' : 'Mark Read (+5 XP)'}
                           </button>
                        ) : (
                           <span className="px-3 py-1 bg-dark border border-green text-green rounded-full text-[10px] font-bold">
                             {language === 'ar' ? 'مكتمل ✅' : 'Read ✅'}
                           </span>
                        )}
                        <button 
                          onClick={() => handleShareDua(res)}
                          className="p-2 bg-dark/50 text-gold rounded-full opacity-70 hover:opacity-100 hover:bg-gold hover:text-dark transition-all"
                          title={language === 'ar' ? 'مشاركة' : 'Share'}
                        >
                          <Share2 size={16} />
                        </button>
                      </div>
                      <div className="absolute top-0 right-0 p-3 opacity-10 text-gold transition-opacity group-hover:opacity-20"><Sparkles size={40} /></div>
                      <div className="text-text tracking-wide text-lg sm:text-xl leading-loose font-bold mb-4 font-sans relative z-10">{res.ar}</div>
                      <div className="text-gold mt-1 text-[11px] sm:text-xs leading-relaxed mb-2 relative z-10">{res.desc}</div>
                    </div>
                  ))}
                  <div className="text-border text-[9px] mt-4 pt-3 border-t border-border/50 text-center">{t('ai.sunnahSource')}</div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}

        {activeTab === 'presets' && !selectedCategory && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-10">
            {PRESET_DUA_CATEGORIES.map((cat) => (
              <button 
                key={cat.id}
                onClick={() => setSelectedCategory(cat)}
                className="relative overflow-hidden rounded-2xl aspect-[2/1] md:aspect-video group text-right shadow-sm border border-border"
              >
                <img src={cat.image} alt={cat.title[language as keyof typeof cat.title]} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent"></div>
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <h3 className="text-white font-bold text-lg sm:text-xl">{cat.title[language as keyof typeof cat.title]}</h3>
                  <p className="text-gray-300 text-xs mt-1">{language === 'ar' ? `${cat.duas.length} أدعية` : `${cat.duas.length} Duas`}</p>
                </div>
              </button>
            ))}
          </motion.div>
        )}

        {selectedCategory && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex flex-col gap-4 pb-10">
            <button 
              onClick={() => setSelectedCategory(null)}
              className="flex items-center gap-2 text-gold font-bold mb-2 group w-fit"
            >
              <ArrowRight size={20} className="group-hover:-translate-x-1 transition-transform rtl:rotate-0 ltr:rotate-180" />
              {language === 'ar' ? 'عودة للتصنيفات' : 'Back to categories'}
            </button>

            <div className="relative h-40 sm:h-48 rounded-2xl overflow-hidden mb-4 shadow-md">
               <img src={selectedCategory.image} alt="Cover" className="w-full h-full object-cover" />
               <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                 <h2 className="text-2xl sm:text-3xl font-bold text-white shadow-sm">{selectedCategory.title[language as keyof typeof selectedCategory.title]}</h2>
               </div>
            </div>

            {selectedCategory.duas.map((dua, idx) => (
              <div key={idx} className="bg-mid border border-border rounded-xl p-5 text-center shadow-sm relative overflow-hidden group mt-4">
                <div className="absolute top-3 left-3 flex gap-2 z-20">
                  {!earnedDuas.has(`preset-${selectedCategory.id}-${idx}`) ? (
                     <button
                       onClick={() => {
                         setEarnedDuas(prev => new Set(prev).add(`preset-${selectedCategory.id}-${idx}`));
                         logActivity('dua', 1, 5);
                       }}
                       className="px-3 py-1 bg-gold border border-gold/30 rounded-full text-dark hover:bg-gold/80 transition-colors text-[10px] font-bold"
                     >
                       {language === 'ar' ? 'تمت القراءة (+5 نقطة)' : 'Mark Read (+5 XP)'}
                     </button>
                  ) : (
                     <span className="px-3 py-1 bg-dark border border-green text-green rounded-full text-[10px] font-bold">
                       {language === 'ar' ? 'مكتمل ✅' : 'Read ✅'}
                     </span>
                  )}
                  <button 
                    onClick={() => handleShareDua({ar: dua.ar, desc: dua.desc[language as keyof typeof dua.desc]})}
                    className="p-2 bg-dark/50 text-gold rounded-full opacity-70 hover:opacity-100 hover:bg-gold hover:text-dark transition-all"
                    title={language === 'ar' ? 'مشاركة' : 'Share'}
                  >
                    <Share2 size={16} />
                  </button>
                </div>
                <div className="text-text tracking-wide text-lg sm:text-xl leading-loose font-bold mb-4 font-sans relative z-10 mt-6">{dua.ar}</div>
                <div className="text-gold mt-1 text-[12px] sm:text-sm leading-relaxed mb-2 relative z-10">{dua.desc[language as keyof typeof dua.desc]}</div>
              </div>
            ))}
          </motion.div>
        )}

      </div>

      <ShareImageModal
        isOpen={showShareCard}
        onClose={() => setShowShareCard(false)}
        text={selectedDuaToShare?.ar || ""}
        title={language === 'ar' ? 'دعاء' : 'Dua'}
        subtitle={selectedDuaToShare?.desc || ""}
        type="dua"
        language={language}
      />
    </div>
  );
}
