import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Sparkles, Loader2 } from 'lucide-react';
import { useTranslation } from './i18n';
import { GoogleGenAI } from '@google/genai';
import { useStore } from './store';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

interface AITasbihModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectDhikr: (dhikr: string) => void;
}

export function AITasbihModal({ isOpen, onClose, onSelectDhikr }: AITasbihModalProps) {
  const { t, language } = useTranslation();
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setIsLoading(true);
    setError('');
    setSuggestions([]);

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `You are an Islamic assistant helping a user find the right Dhikr or Dua to repeat based on their current situation.
The user's situation is: "${prompt}"

Provide 3 short, authentic Islamic Dhikr or brief Duas (in Arabic only, no translation needed in the items, keep it under 10-15 words each) suitable for this situation to be used in a Tasbih application.
Format your response as a simple JSON array of strings. Do not use markdown blocks, just return the JSON array.
Example: ["حَسْبِيَ اللَّهُ وَنِعْمَ الْوَكِيلُ", "لَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللَّهِ", "يَا حَيُّ يَا قَيُّومُ بِرَحْمَتِكَ أَسْتَغِيثُ"]`,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.7,
        }
      });

      const text = response.text || "[]";
      const result = JSON.parse(text);
      if (Array.isArray(result) && result.length > 0) {
         setSuggestions(result);
      } else {
         throw new Error("Invalid response format");
      }
    } catch (err: any) {
      console.error(err);
      setError(language === 'ar' ? 'حدث خطأ، حاول مرة أخرى.' : 'Error generating, please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
        onClick={onClose}
        dir={language === 'ar' ? 'rtl' : 'ltr'}
      >
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="bg-mid rounded-2xl w-full max-w-md shadow-2xl p-6 flex flex-col border border-border"
          onClick={e => e.stopPropagation()}
        >
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-gold font-bold text-lg flex items-center gap-2">
              <Sparkles size={20} />
              {language === 'ar' ? 'تسبيح مخصص' : 'AI Custom Tasbih'}
            </h2>
            <button onClick={onClose} className="text-light hover:text-gold transition-colors">
              <X size={24} />
            </button>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-bold text-text mb-2">
              {language === 'ar' ? 'بماذا تشعر أو بم تمر الآن؟' : 'What are you feeling or going through?'}
            </label>
            <textarea 
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              placeholder={language === 'ar' ? 'أشعر بالقلق والتوتر بخصوص امتحاني غداً...' : 'I am feeling anxious about my exam tomorrow...'}
              className="w-full bg-dark text-text placeholder-light border border-border rounded-xl p-3 h-24 focus:border-gold outline-none resize-none text-sm transition-colors"
            />
          </div>

          <button 
            onClick={handleGenerate}
            disabled={isLoading || !prompt.trim()}
            className="w-full bg-gold text-dark font-bold py-3 rounded-xl disabled:opacity-50 flex justify-center items-center gap-2 transition-transform hover:scale-[1.02] active:scale-95"
          >
            {isLoading && <Loader2 size={18} className="animate-spin" />}
            {language === 'ar' ? 'توليد أذكار' : 'Generate Athkar'}
          </button>

          {error && <div className="text-red-400 text-xs mt-3 text-center">{error}</div>}

          {suggestions.length > 0 && (
            <div className="mt-6">
              <h3 className="text-light text-xs font-bold mb-3">{language === 'ar' ? 'اختر ذكراً للتسبيح:' : 'Select a Dhikr:'}</h3>
              <div className="flex flex-col gap-2">
                {suggestions.map((s, i) => (
                  <button 
                    key={i}
                    onClick={() => {
                      onSelectDhikr(s);
                      onClose();
                    }}
                    className="p-3 bg-dark border border-border rounded-xl text-gold hover:border-gold transition-colors text-right relative overflow-hidden group"
                  >
                    <div className="relative z-10 font-bold leading-relaxed">{s}</div>
                    <div className="absolute inset-0 bg-gold/5 transform translate-y-full group-hover:translate-y-0 transition-transform" />
                  </button>
                ))}
              </div>
            </div>
          )}

        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
