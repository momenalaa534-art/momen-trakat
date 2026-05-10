import React, { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { useStore } from './store';
import { TopBar } from './TopBar';

export function CalendarScreen() {
  const language = useStore(s => s.language);
  
  const [currentDate, setCurrentDate] = useState(new Date());

  const monthsEn = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const monthsAr = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
  
  const higriMonthsAr = ['محرم', 'صفر', 'ربيع الأول', 'ربيع الآخر', 'جمادى الأولى', 'جمادى الآخرة', 'رجب', 'شعبان', 'رمضان', 'شوال', 'ذو القعدة', 'ذو الحجة'];
  const higriMonthsEn = ['Muharram', 'Safar', 'Rabi al-Awwal', 'Rabi al-Thani', 'Jumada al-Awwal', 'Jumada al-Thani', 'Rajab', 'Sha\'ban', 'Ramadan', 'Shawwal', 'Dhu al-Qi\'dah', 'Dhu al-Hijjah'];

  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  // Very basic approximation for Hijri date for display purposes
  // Production should use proper uqa-alqura formula or an API
  const getApproxHijri = (date: Date) => {
    const formatted = new Intl.DateTimeFormat('en-u-ca-islamic', {
      day: 'numeric',
      month: 'numeric',
      year: 'numeric'
    }).format(date);
    const [m, d, y] = formatted.split('/');
    return { day: parseInt(d), month: parseInt(m) - 1, year: parseInt(y.split(' ')[0]) };
  };

  const daysInMonth = getDaysInMonth(currentDate.getFullYear(), currentDate.getMonth());
  const firstDay = getFirstDayOfMonth(currentDate.getFullYear(), currentDate.getMonth());
  const monthName = language === 'ar' ? monthsAr[currentDate.getMonth()] : monthsEn[currentDate.getMonth()];
  const hijriNow = getApproxHijri(currentDate);

  const daysLabels = language === 'ar' 
    ? ['أ', 'إ', 'ث', 'أ', 'خ', 'ج', 'س'] 
    : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="flex flex-col flex-1 h-full bg-dark">
      <TopBar title={language === 'ar' ? 'التقويم التاريخي' : 'Calendar'} />
      
      <div className="flex-1 overflow-y-auto p-5 pb-24">
        
        {/* Today Header */}
        <div className="bg-mid border border-border p-6 rounded-3xl shadow-sm text-center mb-8 relative overflow-hidden">
           <div className="absolute top-0 end-0 opacity-5 -scale-x-100 text-gold"><CalendarIcon size={120} /></div>
           <div className="relative z-10">
             <h2 className="text-4xl font-bold text-gold mb-2">
               {hijriNow.day} {language === 'ar' ? higriMonthsAr[hijriNow.month] : higriMonthsEn[hijriNow.month]} {hijriNow.year}
             </h2>
             <p className="text-light text-xl font-bold">
               {currentDate.getDate()} {monthName} {currentDate.getFullYear()}
             </p>
           </div>
        </div>

        {/* Calendar Grid */}
        <div className="bg-mid border border-border rounded-2xl p-4 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <button onClick={handlePrevMonth} className="p-2 hover:bg-dark rounded-full text-light hover:text-gold transition-colors">
              <ChevronLeft size={24} />
            </button>
            <h3 className="text-xl font-bold text-text">
              {monthName} {currentDate.getFullYear()}
            </h3>
            <button onClick={handleNextMonth} className="p-2 hover:bg-dark rounded-full text-light hover:text-gold transition-colors">
              <ChevronRight size={24} />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-2 mb-2">
            {daysLabels.map((day, i) => (
              <div key={i} className="text-center font-bold text-light text-sm p-2">{day}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-2">
            {[...Array(firstDay)].map((_, i) => (
              <div key={`empty-${i}`} className="p-2" />
            ))}
            
            {[...Array(daysInMonth)].map((_, i) => {
              const day = i + 1;
              const isToday = day === new Date().getDate() && 
                              currentDate.getMonth() === new Date().getMonth() && 
                              currentDate.getFullYear() === new Date().getFullYear();
              
              // Calculate rough hijri day for this cell
              const cellDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
              const cellHijri = getApproxHijri(cellDate);

              return (
                <div 
                  key={day} 
                  className={`relative p-2 h-14 flex flex-col items-center justify-center rounded-xl border ${
                    isToday 
                      ? 'bg-gold/10 border-gold/50 text-gold' 
                      : 'border-transparent text-text hover:border-gold/30 hover:bg-dark'
                  } transition-colors cursor-pointer`}
                >
                  <span className={`text-base font-bold ${isToday ? 'text-gold' : 'text-text'}`}>
                    {day}
                  </span>
                  <span className={`text-[9px] ${isToday ? 'text-gold/80' : 'text-light/50'}`}>
                    {cellHijri.day} {language === 'ar' ? higriMonthsAr[cellHijri.month].substring(0, 3) : higriMonthsEn[cellHijri.month].substring(0, 3)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}
