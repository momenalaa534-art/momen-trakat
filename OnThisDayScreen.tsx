import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { CalendarDays, Loader2, Sparkles, Globe, BookOpen } from 'lucide-react';
import { useStore } from './store';
import { TopBar } from './TopBar';
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

interface EventData {
  islamic: string;
  global: string;
  cultural: string;
}

export function OnThisDayScreen() {
  const language = useStore(s => s.language);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<EventData | null>(null);

  const today = new Date();
  const day = today.getDate();
  const monthNamesEn = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const monthNamesAr = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
  
  const currentMonthName = language === 'ar' ? monthNamesAr[today.getMonth()] : monthNamesEn[today.getMonth()];
  const formattedDate = `${day} ${currentMonthName}`;

  useEffect(() => {
    fetchEvents();
  }, [language]);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const prompt = language === 'ar' 
        ? `أنت مؤرخ عالمي وإسلامي خبير. اليوم هو ${formattedDate}.
أريد أهم الأحداث التي حدثت في مثل هذا اليوم من التاريخ.
أعدها بصيغة JSON بالتنسيق التالي:
{
  "islamic": "حدث إسلامي تاريخي هام وقع في هذا اليوم (مع ذكر السنة إن أمكن) وتفصيل شيق.",
  "global": "حدث عالمي أو علمي كبير وقع في مثل هذا اليوم.",
  "cultural": "معلومة ثقافية عامة أو حدث في تاريخ الحضارات المختلفة وقع في نفس اليوم."
}
لا تضع أي نصوص أخرى، فقط JSON الصافي.`
        : `You are an expert global and Islamic historian. Today is ${formattedDate}.
I want the most important events that happened on this day in history.
Return strictly as a JSON object in this format:
{
  "islamic": "A major historical Islamic event that happened on this day (mentioning the year if possible) with an interesting detail.",
  "global": "A major global, scientific, or historical event that happened on this day.",
  "cultural": "A general cultural fact or event in the history of civilizations on this day."
}
No Markdown, just JSON.`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: "application/json",
        }
      });

      const result = JSON.parse(response.text);
      setData(result);
    } catch (e) {
      console.error(e);
      // Fallback
      setData({
        islamic: language === 'ar' ? 'يوم مليء بالأحداث الإسلامية العظيمة، تفكر في نعم الله.' : 'A day full of great Islamic events, reflect on Allah\'s blessings.',
        global: language === 'ar' ? 'العالم يشهد تطورات مستمرة في مثل هذا اليوم.' : 'The world witnesses continuous developments on this day.',
        cultural: language === 'ar' ? 'الثقافات تتلاقى وتتعلم من بعضها.' : 'Cultures meet and learn from each other.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col flex-1 h-full bg-dark">
      <TopBar title={language === 'ar' ? 'حدث في مثل هذا اليوم' : 'On This Day'} />
      
      <div className="flex-1 overflow-y-auto p-5 pb-24">
        
        <div className="flex justify-center mb-8 mt-4">
          <div className="bg-mid border-2 border-gold/30 px-8 py-6 rounded-3xl flex flex-col items-center gap-3 shadow-lg relative overflow-hidden">
            <div className="absolute -top-4 -right-4 text-gold/10"><CalendarDays size={80} /></div>
            <h2 className="text-4xl font-bold text-gold z-10">{day}</h2>
            <span className="text-xl font-bold text-text z-10">{currentMonthName}</span>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center p-12 gap-4">
            <Loader2 size={40} className="animate-spin text-gold" />
            <p className="text-light font-bold">
              {language === 'ar' ? 'جاري البحث في طيات التاريخ...' : 'Searching through the pages of history...'}
            </p>
          </div>
        ) : (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <EventCard 
              icon={<BookOpen size={24} />} 
              title={language === 'ar' ? 'في التاريخ الإسلامي' : 'In Islamic History'}
              content={data?.islamic || ''}
              color="text-emerald-400"
            />
            <EventCard 
              icon={<Globe size={24} />} 
              title={language === 'ar' ? 'حدث عالمي' : 'Global Event'}
              content={data?.global || ''}
              color="text-blue-400"
            />
            <EventCard 
              icon={<Sparkles size={24} />} 
              title={language === 'ar' ? 'من ثقافات الشعوب' : 'Cultural Fact'}
              content={data?.cultural || ''}
              color="text-amber-400"
            />
          </motion.div>
        )}
      </div>
    </div>
  );
}

function EventCard({ icon, title, content, color }: { icon: React.ReactNode, title: string, content: string, color: string }) {
  return (
    <div className="bg-mid border border-border p-5 rounded-2xl flex flex-col gap-3 relative overflow-hidden">
      <div className={`flex items-center gap-3 ${color} font-bold text-lg`}>
        {icon}
        <h3>{title}</h3>
      </div>
      <p className="text-text leading-relaxed font-amiri text-lg">
        {content}
      </p>
    </div>
  );
}
