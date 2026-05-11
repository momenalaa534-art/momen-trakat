import React, { useState, useRef } from 'react';
import { ART_STYLES, DEFAULT_SCENE_COUNT, LANGUAGES, ASPECT_RATIOS } from './constants';
import { StoryRequest, StoryBoardResponse, GeneratorStatus } from './types';
import { generateStoryBoard } from './services/geminiService';
import { SceneCard } from './components/SceneCard';
import { CharacterCard } from './components/CharacterCard';

const App: React.FC = () => {
  const [formData, setFormData] = useState<StoryRequest>({
    concept: '',
    style: ART_STYLES[0],
    sceneCount: DEFAULT_SCENE_COUNT,
    language: 'العربية',
    aspectRatio: '16:9',
    noMusic: false
  });

  const [status, setStatus] = useState<GeneratorStatus>(GeneratorStatus.IDLE);
  const [result, setResult] = useState<StoryBoardResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' 
        ? (e.target as HTMLInputElement).checked 
        : (name === 'sceneCount' ? parseInt(value) || 0 : value)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus(GeneratorStatus.GENERATING);
    setError(null);
    setResult(null);

    try {
      const data = await generateStoryBoard(formData);
      setResult(data);
      setStatus(GeneratorStatus.SUCCESS);
    } catch (err: any) {
      setError(err.message || "حدث خطأ أثناء إنشاء لوحة القصة.");
      setStatus(GeneratorStatus.ERROR);
    }
  };

  const handleExport = () => {
    if (!result) return;
    const jsonString = JSON.stringify(result, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const href = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = href;
    link.download = `${result.title.replace(/\s+/g, '_')}_Project.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        // Basic validation
        if (json.title && json.scenes) {
            setResult(json as StoryBoardResponse);
            setStatus(GeneratorStatus.SUCCESS);
        } else {
            throw new Error("Invalid JSON format");
        }
      } catch (err) {
        alert("خطأ في قراءة الملف. تأكد من أنه ملف مشروع صالح.");
        console.error(err);
      }
    };
    reader.readAsText(file);
    // Reset input
    e.target.value = ''; 
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200">
      {/* Header */}
      <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
             <svg className="w-8 h-8 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
             </svg>
             <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-brand-400 to-indigo-400 font-['Noto_Sans_Arabic']">
               تريكات لهندسة اوامر قصص الكرتون
             </h1>
          </div>
          
          <div className="flex items-center gap-3">
             {/* Hidden Import Input */}
             <input 
               type="file" 
               accept=".json" 
               ref={fileInputRef} 
               onChange={handleFileChange} 
               className="hidden" 
             />
             
             <button 
               onClick={handleImportClick}
               className="hidden sm:flex items-center gap-2 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded-lg border border-slate-700 transition-colors"
             >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                استيراد مشروع
             </button>

             {result && (
               <button 
                 onClick={handleExport}
                 className="flex items-center gap-2 text-xs bg-brand-600 hover:bg-brand-500 text-white px-3 py-1.5 rounded-lg transition-colors font-medium shadow-lg shadow-brand-500/20"
               >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  تصدير JSON
               </button>
             )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Right Column (Controls) */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800 shadow-xl sticky top-24">
              <h2 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                <span className="w-1 h-6 bg-brand-500 rounded-full"></span>
                إعدادات القصة
              </h2>
              
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Concept */}
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">فكرة القصة</label>
                  <textarea
                    name="concept"
                    required
                    rows={5}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-sm focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition-all placeholder-slate-600"
                    placeholder="مثال: روبوت وحيد يجد زهرة على المريخ ويحاول حمايتها من عاصفة رملية..."
                    value={formData.concept}
                    onChange={handleInputChange}
                  />
                </div>

                {/* Style */}
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">أسلوب الرسم (Art Style)</label>
                  <select
                    name="style"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-sm focus:ring-2 focus:ring-brand-500 outline-none"
                    value={formData.style}
                    onChange={handleInputChange}
                  >
                    {ART_STYLES.map(style => (
                      <option key={style} value={style}>{style}</option>
                    ))}
                  </select>
                </div>

                {/* Aspect Ratio */}
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">أبعاد الفيديو (Aspect Ratio)</label>
                  <select
                    name="aspectRatio"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-sm focus:ring-2 focus:ring-brand-500 outline-none"
                    value={formData.aspectRatio}
                    onChange={handleInputChange}
                  >
                    {ASPECT_RATIOS.map(ratio => (
                      <option key={ratio.value} value={ratio.value}>{ratio.label}</option>
                    ))}
                  </select>
                </div>

                {/* Language */}
                 <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">لغة الحوار</label>
                  <select
                    name="language"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-sm focus:ring-2 focus:ring-brand-500 outline-none"
                    value={formData.language}
                    onChange={handleInputChange}
                  >
                    {LANGUAGES.map(lang => (
                      <option key={lang} value={lang}>{lang}</option>
                    ))}
                  </select>
                </div>

                {/* Scene Count */}
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">
                    عدد المشاهد
                  </label>
                  <input
                    type="number"
                    name="sceneCount"
                    min="1"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-sm focus:ring-2 focus:ring-brand-500 outline-none placeholder-slate-600"
                    value={formData.sceneCount}
                    onChange={handleInputChange}
                    placeholder="أدخل عدد المشاهد المطلوبة"
                  />
                </div>

                {/* Audio Option */}
                <div className="bg-slate-950/50 border border-slate-800 rounded-lg p-3">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      name="noMusic"
                      checked={formData.noMusic}
                      onChange={handleInputChange}
                      className="w-5 h-5 text-brand-600 bg-slate-900 border-slate-700 rounded focus:ring-brand-500 focus:ring-2"
                    />
                    <span className="text-sm text-slate-300 select-none">
                      توليد فيديو بدون موسيقى خلفية (مؤثرات صوتية فقط)
                    </span>
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={status === GeneratorStatus.GENERATING}
                  className={`w-full py-3.5 rounded-lg font-bold text-white shadow-lg transition-all transform hover:-translate-y-0.5 ${
                    status === GeneratorStatus.GENERATING
                      ? 'bg-slate-700 cursor-not-allowed animate-pulse'
                      : 'bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500'
                  }`}
                >
                  {status === GeneratorStatus.GENERATING ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      جاري هندسة الأوامر...
                    </span>
                  ) : (
                    'إنشاء خطة العمل'
                  )}
                </button>
                
                {/* Mobile Import Button */}
                <button 
                   type="button"
                   onClick={handleImportClick}
                   className="w-full sm:hidden flex justify-center items-center gap-2 text-sm bg-slate-800 hover:bg-slate-700 text-slate-300 py-3 rounded-lg border border-slate-700 transition-colors"
                 >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                    استيراد مشروع
                 </button>
              </form>
            </div>
          </div>

          {/* Left Column (Results) */}
          <div className="lg:col-span-8">
            {status === GeneratorStatus.IDLE && (
              <div className="h-full flex flex-col items-center justify-center text-slate-600 min-h-[400px] border-2 border-dashed border-slate-800 rounded-2xl">
                <svg className="w-16 h-16 mb-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
                <p className="text-lg">أدخل فكرة قصتك للبدء.</p>
              </div>
            )}

            {status === GeneratorStatus.ERROR && (
              <div className="bg-red-900/20 border border-red-500/50 text-red-200 p-6 rounded-xl flex items-start gap-3">
                 <svg className="w-6 h-6 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                 </svg>
                 <div>
                   <h3 className="font-bold">خطأ في إنشاء المحتوى</h3>
                   <p className="text-sm mt-1 opacity-80">{error}</p>
                 </div>
              </div>
            )}

            {result && status === GeneratorStatus.SUCCESS && (
              <div className="space-y-10 animate-fade-in">
                {/* Title & Summary */}
                <div className="bg-slate-900/50 rounded-2xl p-8 text-center border border-slate-800 relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand-500 via-indigo-500 to-purple-500"></div>
                  <h2 className="text-3xl md:text-4xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400 mb-4">{result.title}</h2>
                  <p className="text-slate-400 max-w-2xl mx-auto leading-relaxed">{result.summary}</p>
                </div>

                {/* Assets Section */}
                <section>
                  <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                    <span className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400">
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                    </span>
                    عناصر القصة (Assets)
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {result.assets.map((asset, idx) => (
                      <CharacterCard key={idx} asset={asset} />
                    ))}
                  </div>
                </section>

                {/* Scenes Section */}
                <section>
                  <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                    <span className="p-2 bg-pink-500/10 rounded-lg text-pink-400">
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </span>
                    تفاصيل المشاهد
                  </h3>
                  <div className="space-y-6">
                    {result.scenes.map((scene) => (
                      <SceneCard key={scene.sceneNumber} scene={scene} />
                    ))}
                  </div>
                </section>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;