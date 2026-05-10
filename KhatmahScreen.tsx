import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BookOpen, Goal, Target, Bookmark, CheckCircle2, ChevronRight, PlusCircle, Check, Smartphone, Book, Lock } from 'lucide-react';
import { useStore, KhatmahType } from '../store';
import { TopBar } from '../components/TopBar';
import { JUZ_QUOTES } from '../data/juzQuotes';

export function KhatmahScreen() {
  const language = useStore(s => s.language);
  const activeKhatmah = useStore(s => s.activeKhatmah);
  const startKhatmah = useStore(s => s.startKhatmah);
  const updateKhatmahProgress = useStore(s => s.updateKhatmahProgress);
  const finishKhatmah = useStore(s => s.finishKhatmah);
  const cancelKhatmah = useStore(s => s.cancelKhatmah);
  const setKhatmahSource = useStore(s => s.setKhatmahSource);
  const navigate = useStore(s => s.navigate);
  const showAlert = useStore(s => s.showAlert);
  
  const [activeTab, setActiveTab] = useState<KhatmahType>('reading');

  const tabs = [
    { id: 'reading', label: language === 'ar' ? 'قراءة' : 'Reading' },
    { id: 'memorization', label: language === 'ar' ? 'حفظ ومراجعة' : 'Memorization' },
    { id: 'tadabbur', label: language === 'ar' ? 'تدبر' : 'Tadabbur' },
  ];

  const readingPlans = [
    { id: 'reading-30', days: 30, title_ar: 'ختمة في شهر (٣٠ يوم)', title_en: '30-Day Khatmah', desc_ar: 'قراءة جزء يومياً', desc_en: 'Read 1 Juz per day', icon: <Goal /> },
    { id: 'reading-15', days: 15, title_ar: 'ختمة في أسبوعين (١٥ يوم)', title_en: '15-Day Khatmah', desc_ar: 'قراءة جزأين يومياً', desc_en: 'Read 2 Juz per day', icon: <Goal /> },
    { id: 'reading-7', days: 7, title_ar: 'ختمة في أسبوع (٧ أيام)', title_en: '7-Day Khatmah', desc_ar: 'قراءة ٤ أجزاء وربع يومياً', desc_en: 'Read 4.25 Juz per day', icon: <CheckCircle2 /> },
  ];

  const memPlans = [
    { id: 'mem-365', days: 365, title_ar: 'حفظ في سنة', title_en: '1-Year Memorization', desc_ar: 'حفظ جزء كل ١٢ يوم تقريبا', desc_en: 'Memorize 1 Juz every ~12 days', icon: <Goal /> },
    { id: 'mem-30', days: 30, title_ar: 'مراجعة مكثفة (٣٠ يوم)', title_en: 'Intensive Review (30 Days)', desc_ar: 'مراجعة جزء يومياً', desc_en: 'Review 1 Juz per day', icon: <CheckCircle2 /> },
  ];

  const tadabburPlans = [
    { id: 'tad-365', days: 365, title_ar: 'تدبر في سنة', title_en: '1-Year Tadabbur', desc_ar: 'تدبر صفحة ونصف يومياً', desc_en: 'Reflect on 1.5 pages per day', icon: <Goal /> },
  ];

  const currentPlans = activeTab === 'reading' ? readingPlans : (activeTab === 'memorization' ? memPlans : tadabburPlans);

  const handleStartPlan = (id: string, days: number) => {
    if (activeKhatmah) {
      const msg = language === 'ar' 
        ? 'هل أنت متأكد من بدء خطة جديدة؟ سيتم إلغاء خطتك الحالية ولن تضاف إلى السجل.' 
        : 'Are you sure you want to start a new plan? Your current plan will be canceled.';
      if (!window.confirm(msg)) return;
    }
    startKhatmah({
      id,
      type: activeTab,
      days
    });
  };

  const checkCanLogExternal = () => {
    if (!activeKhatmah || !activeKhatmah.lastLogDate) return true; // Never logged before
    const lastDate = new Date(activeKhatmah.lastLogDate).toDateString();
    const now = new Date().toDateString();
    return lastDate !== now;
  };

  const canLogExternal = checkCanLogExternal();

  const handleIncrementExternal = () => {
    if (!activeKhatmah) return;
    if (!canLogExternal) {
      showAlert(language === 'ar' ? 'لقد أتممت وردك اليوم، غداً يوم جديد مع القرآن الكريم 🌸' : 'You have completed today\'s target. A new day with the Quran awaits tomorrow 🌸');
      return;
    }
    const incrementAmount = activeKhatmah.totalJuz / activeKhatmah.days;
    const newProg = activeKhatmah.progressJuz + incrementAmount;
    
    const completedJuzIndex = Math.min(30, Math.ceil(newProg));
    const quoteObj = JUZ_QUOTES[completedJuzIndex] || { ar: "بوركت مساعيك 🌸", en: "Blessed effort! 🌸" };
    const niceMsg = language === 'ar' ? quoteObj.ar : quoteObj.en;

    if (newProg >= activeKhatmah.totalJuz - 0.01) { // 0.01 tolerance for floating point
      finishKhatmah();
      showAlert(language === 'ar' ? 'مبارك! لقد أتممت الختمة بنجاح! 🌟 (+500 XP)\n\n' + niceMsg : 'Congratulations! You have completed the Khatmah! 🌟 (+500 XP)\n\n' + niceMsg);
    } else {
      updateKhatmahProgress(newProg, true); // setDate to enforce daily lock
      showAlert(niceMsg);
    }
  };

  const calculateCompletionDate = () => {
    if (!activeKhatmah) return '';
    const start = new Date(activeKhatmah.startDate);
    const end = new Date(start.getTime() + activeKhatmah.days * 24 * 60 * 60 * 1000);
    return end.toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="flex flex-col flex-1 h-full bg-dark">
      <TopBar title={language === 'ar' ? 'الختمة والخطط' : 'Khatmah Planner'} />
      
      <div className="flex-1 overflow-y-auto pb-24">
        
        {/* Tabs */}
        <div className="flex gap-2 p-4 overflow-x-auto no-scrollbar">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as KhatmahType)}
              className={`px-6 py-3 rounded-full font-bold whitespace-nowrap transition-colors flex-1 ${
                activeTab === tab.id ? 'bg-gold text-dark' : 'bg-mid text-light border border-border'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-4">
           {/* Current Progress Card */}
           <AnimatePresence>
             {activeKhatmah && (
               <motion.div 
                 initial={{ opacity: 0, height: 0, scale: 0.95 }}
                 animate={{ opacity: 1, height: 'auto', scale: 1 }}
                 exit={{ opacity: 0, height: 0, scale: 0.95 }}
                 className="bg-mid border border-border rounded-2xl p-6 mb-6 relative overflow-hidden shadow-lg"
               >
                 <div className="absolute -right-4 -bottom-4 text-gold/5"><BookOpen size={150} /></div>
                 
                 <div className="flex items-center gap-3 mb-2 relative z-10">
                   <Target size={24} className="text-gold" />
                   <h2 className="text-xl font-bold text-text">
                     {language === 'ar' ? 'الخطة الحالية' : 'Current Plan'}
                   </h2>
                   <div className="mr-auto ml-2 text-xs bg-gold/20 text-gold px-2 py-1 rounded-lg">
                     {activeKhatmah.days} {language === 'ar' ? 'يوم' : 'Days'}
                   </div>
                 </div>
                 
                 {activeKhatmah.source && (
                   <div className="relative z-10 mb-4">
                     <button 
                       onClick={() => setKhatmahSource(activeKhatmah.source === 'app' ? 'external' : 'app')}
                       className="text-light hover:text-gold text-xs underline"
                     >
                       {language === 'ar' ? 'تغيير طريقة القراءة (مصحف التطبيق / الخارجي)' : 'Change Reading Source (App / External)'}
                     </button>
                   </div>
                 )}
                 
                 <p className="text-light text-sm mb-6 relative z-10">
                   {language === 'ar' 
                     ? `تاريخ الانتهاء المتوقع: ${calculateCompletionDate()}` 
                     : `Expected completion: ${calculateCompletionDate()}`}
                 </p>
    
                 <div className="relative z-10 mb-6">
                   <div className="flex justify-between text-sm mb-2">
                     <span className="text-text font-bold">
                       {language === 'ar' ? `الجزء ${Math.round(activeKhatmah.progressJuz * 10) / 10} من ${activeKhatmah.totalJuz}` : `Juz ${Math.round(activeKhatmah.progressJuz * 10) / 10} of ${activeKhatmah.totalJuz}`}
                     </span>
                     <span className="text-gold font-bold">
                       {Math.round((activeKhatmah.progressJuz / activeKhatmah.totalJuz) * 100)}٪
                     </span>
                   </div>
                   <div className="w-full bg-dark h-3 rounded-full overflow-hidden">
                     <motion.div 
                       initial={{ width: 0 }}
                       animate={{ width: `${(activeKhatmah.progressJuz / activeKhatmah.totalJuz) * 100}%` }}
                       className="h-full bg-gold rounded-full"
                     />
                   </div>
                   <div className="flex justify-between text-[11px] text-light/50 mt-1.5 font-bold px-1">
                     <span>{language === 'ar' ? 'الجزء ٠' : '0'}</span>
                     <span>{language === 'ar' ? `الجزء ${activeKhatmah.totalJuz}` : `${activeKhatmah.totalJuz}`}</span>
                   </div>
                 </div>

                 {/* Source Selection or Action Buttons */}
                 <div className="relative z-10 border-t border-border/50 pt-4 mt-2">
                   {!activeKhatmah.source ? (
                     <div className="space-y-3">
                       <p className="text-sm text-text font-bold text-center mb-2">
                         {language === 'ar' ? 'من أين ستقرأ الورد اليومي؟' : 'Where will you read from?'}
                       </p>
                       <div className="flex gap-2">
                         <button 
                           onClick={() => setKhatmahSource('app')}
                           className="flex-1 bg-dark border border-gold hover:bg-gold/10 text-gold font-bold py-3 rounded-xl flex flex-col items-center justify-center gap-1 transition-colors"
                         >
                           <Smartphone size={24} />
                           <span className="text-xs">{language === 'ar' ? 'مصحف التطبيق (سيتم التسجيل تلقائياً)' : 'App (Auto log)'}</span>
                         </button>
                         <button 
                           onClick={() => setKhatmahSource('external')}
                           className="flex-1 bg-dark border border-border hover:border-gold text-light hover:text-gold font-bold py-3 rounded-xl flex flex-col items-center justify-center gap-1 transition-colors"
                         >
                           <Book size={24} />
                           <span className="text-xs">{language === 'ar' ? 'مصحف مطبوع (تسجيل يدوي)' : 'Printed (Manual log)'}</span>
                         </button>
                       </div>
                     </div>
                   ) : activeKhatmah.source === 'app' ? (
                     <button 
                       onClick={() => navigate('full_quran')}
                       className="w-full bg-gold text-dark font-bold py-3 rounded-xl flex items-center justify-center gap-2 shadow-md hover:bg-yellow-400 transition-colors active:scale-95"
                     >
                       <Smartphone size={20} />
                       {language === 'ar' ? 'الذهاب للقراءة الآن' : 'Go Read Now'}
                     </button>
                   ) : (
                     <button 
                       onClick={handleIncrementExternal}
                       disabled={!canLogExternal}
                       className={`w-full font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors ${
                         canLogExternal 
                           ? 'bg-gold text-dark shadow-md hover:bg-yellow-400 active:scale-95' 
                           : 'bg-dark/50 text-light/50 border border-border cursor-not-allowed'
                       }`}
                     >
                       {canLogExternal ? (
                         <>
                           <CheckCircle2 size={20} />
                           {language === 'ar' ? 'تسجيل إتمام الورد اليومي' : 'Log Today\'s Progress'}
                         </>
                       ) : (
                         <>
                           <Lock size={20} />
                           {language === 'ar' ? 'تم التسجيل، عد غداً' : 'Logged, Come Back Tomorrow'}
                         </>
                       )}
                     </button>
                   )}
                 </div>
               </motion.div>
             )}
           </AnimatePresence>

           {/* Create New Plan */}
           {activeKhatmah && (
             <div className="flex justify-center -mt-2 mb-6">
                <button 
                   onClick={() => {
                       window.confirm(language === 'ar' ? 'هل تود إلغاء الخطة الحالية وبدء خطة محتسبة من الصفر؟' : 'Cancel current plan and start from zero?') && cancelKhatmah();
                   }}
                   className="bg-red-500/10 text-red-500 font-bold py-2 px-6 rounded-xl text-xs hover:bg-red-500/20 transition-colors cursor-pointer"
                 >
                   {language === 'ar' ? 'إلغاء الخطة وبدء أخرى من الصفر' : 'Cancel and start new plan from zero'}
                 </button>
             </div>
           )}
           <h3 className="text-lg font-bold text-text mb-4">
             {activeKhatmah 
               ? (language === 'ar' ? 'تغيير الخطة' : 'Change Plan') 
               : (language === 'ar' ? 'ابدأ خطة جديدة' : 'Start a New Plan')}
           </h3>

           <div className="space-y-4">
             {currentPlans.map(plan => (
               <PlanCard 
                 key={plan.id}
                 title={language === 'ar' ? plan.title_ar : plan.title_en}
                 desc={language === 'ar' ? plan.desc_ar : plan.desc_en}
                 icon={plan.icon}
                 isActive={activeKhatmah?.id === plan.id}
                 onClick={() => handleStartPlan(plan.id, plan.days)}
               />
             ))}
           </div>
        </div>
      </div>
    </div>
  );
}

const PlanCard: React.FC<{ title: string, desc: string, icon: React.ReactNode, isActive: boolean, onClick: () => void }> = ({ title, desc, icon, isActive, onClick }) => {
  return (
    <div 
      onClick={onClick}
      className={`border p-4 rounded-xl flex items-center justify-between group transition-colors cursor-pointer ${
        isActive ? 'bg-gold/10 border-gold' : 'bg-dark border-border hover:border-gold/50'
      }`}
    >
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-transform ${
          isActive ? 'bg-gold text-dark' : 'bg-mid text-gold group-hover:scale-110'
        }`}>
          {isActive ? <Check size={24} /> : icon}
        </div>
        <div>
          <h4 className="text-text font-bold text-base">{title}</h4>
          <p className="text-light text-sm">{desc}</p>
        </div>
      </div>
      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isActive ? 'bg-gold text-dark' : 'bg-mid text-light group-hover:bg-gold/20 group-hover:text-gold'}`}>
        {isActive ? <Check size={16} /> : <PlusCircle size={16} />}
      </div>
    </div>
  );
}
