import React, { useState, useEffect } from 'react';
import { Plane, MapPin, Clock, Loader2, Edit3, Navigation, AlertTriangle } from 'lucide-react';
import { useStore } from './store';
import { TopBar } from './TopBar';
import { Coordinates, CalculationMethod, PrayerTimes } from 'adhan';
import { motion, AnimatePresence } from 'motion/react';

export function FlightPrayerScreen() {
  const language = useStore(s => s.language);
  const [loading, setLoading] = useState(false);
  const [coords, setCoords] = useState<{lat: number, lng: number, alt?: number} | null>(null);
  const [prayerTimes, setPrayerTimes] = useState<any>(null);
  
  const [manualMode, setManualMode] = useState(false);
  const [mLat, setMLat] = useState('');
  const [mLng, setMLng] = useState('');
  const [mAlt, setMAlt] = useState('');

  const calculatePrayers = (lat: number, lng: number, altInMeters: number) => {
    try {
      const coordinates = new Coordinates(lat, lng);
      const params = CalculationMethod.MuslimWorldLeague();
      
      // Calculate altitude offset (dip angle)
      // Dip angle in degrees ≈ 0.0347 * sqrt(altitude in meters)
      // 1 degree = 4 minutes 
      // Approximate time offset = 0.0347 * 4 * sqrt(alt) ≈ 0.1388 * sqrt(alt)
      // Another common formula is: minutes = 0.117 * sqrt(alt)
      // Let's use 0.1388 for a slightly safer margin (sunset later, sunrise earlier)
      let offsetMins = 0;
      if (altInMeters > 0) {
        offsetMins = Math.round(0.1388 * Math.sqrt(altInMeters));
      }

      params.adjustments.fajr = -offsetMins;
      params.adjustments.sunrise = -offsetMins;
      params.adjustments.maghrib = offsetMins;
      params.adjustments.isha = offsetMins;

      const date = new Date();
      const pt = new PrayerTimes(coordinates, date, params);

      const formatTime = (d: Date) => {
        return d.toLocaleTimeString(language === 'ar' ? 'ar-EG' : 'en-US', {
          hour: '2-digit', minute: '2-digit', hour12: true
        });
      };

      setPrayerTimes({
        Fajr: formatTime(pt.fajr),
        Sunrise: formatTime(pt.sunrise),
        Dhuhr: formatTime(pt.dhuhr),
        Asr: formatTime(pt.asr),
        Maghrib: formatTime(pt.maghrib),
        Isha: formatTime(pt.isha),
        offset: offsetMins
      });
      setCoords({ lat, lng, alt: altInMeters });
    } catch (e) {
      console.error(e);
      alert(language === 'ar' ? 'حدث خطأ أثناء الحساب' : 'Error calculating times');
    }
  };

  const handleManualCalculate = () => {
    const lat = parseFloat(mLat);
    const lng = parseFloat(mLng);
    const altFt = parseFloat(mAlt) || 0; // assuming user enters feet since airlines use feet
    
    if (isNaN(lat) || isNaN(lng)) {
      alert(language === 'ar' ? 'يرجى إدخال إحداثيات صحيحة' : 'Please enter valid coordinates');
      return;
    }
    setLoading(true);
    
    // Check if altitude is likely in feet (very common on planes)
    // 35000 ft = 10668 meters. If they enter 35000, we convert it to meters.
    // To keep it simple, let's treat input as Meters if < 15,000, and Feet if > 15,000.
    // Or just explicitly state it's in Meters. Let's assume input is in Meters.
    // Wait, let's just convert feet to meters. Most airplane screens show Feet.
    // Let's add UI to clarify, but for now we safely assume if > 15,000 it's feet.
    let altMeters = altFt;
    if (altFt > 15000) {
      altMeters = altFt * 0.3048; 
    }

    // Small delay to show loading state 
    setTimeout(() => {
      calculatePrayers(lat, lng, altMeters);
      setLoading(false);
      setManualMode(false);
    }, 500);
  };

  const fetchFlightPrayerTimes = () => {
    setLoading(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          const alt = position.coords.altitude || 0;
          
          calculatePrayers(lat, lng, alt);
          setLoading(false);
        },
        (error) => {
          console.error(error);
          setLoading(false);
          // If GPS fails, switch to manual mode automatically
          setManualMode(true);
          alert(language === 'ar' 
            ? 'لا يمكن العثور على موقعك أثناء الطيران (قد تحتاج لإدخال الإحداثيات يدوياً من شاشة الطائرة).' 
            : 'Cannot get GPS location (you may need to enter coordinates manually from the flight screen).');
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } else {
      setLoading(false);
      setManualMode(true);
      alert(language === 'ar' ? 'نظام تحديد المواقع غير مدعوم' : 'GPS not supported');
    }
  };

  const prayers = ['Fajr', 'Sunrise', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];
  const arPrayers: Record<string, string> = {
    Fajr: 'الفجر', Sunrise: 'الشروق', Dhuhr: 'الظهر', Asr: 'العصر', Maghrib: 'المغرب', Isha: 'العشاء'
  };

  return (
    <div className="flex flex-col flex-1 h-full bg-dark">
      <TopBar title={language === 'ar' ? 'مواقيت الصلاة في الطيران' : 'In-Flight Prayers'} />
      
      <div className="flex-1 p-5 overflow-y-auto pb-24">
        
        <div className="bg-gradient-to-br from-indigo-900 to-indigo-600 rounded-3xl p-6 text-white shadow-lg mb-8 relative overflow-hidden">
          <div className="absolute top-4 end-4 opacity-20 transform rotate-45"><Plane size={100} /></div>
          
          <h2 className="text-2xl font-bold mb-2 relative z-10 text-gold">
            {language === 'ar' ? 'تتبع رحلتك وصلاتك' : 'Track your flight & prayers'}
          </h2>
          <p className="text-indigo-100 text-[11px] sm:text-xs relative z-10 mb-6 leading-relaxed">
            {language === 'ar' 
              ? 'احسب مواقيت الصلاة بدقة فائقة حسب موقعك الحالي في الجو. التطبيق يضبط شروق وغروب الشمس بناءً على ارتفاع الطائرة محلياً بدون إنترنت!' 
              : 'Calculate highly accurate prayer times mid-air. Adjusts sunrise and maghrib based on your plane altitude locally without internet!'}
          </p>

          <div className="flex gap-2 relative z-10">
            <button 
              onClick={fetchFlightPrayerTimes}
              disabled={loading}
              className="flex-1 bg-white text-indigo-900 font-bold px-4 py-3 rounded-xl flex items-center justify-center gap-2 shadow-md hover:bg-gold transition-colors disabled:opacity-50"
            >
              {loading ? <Loader2 className="animate-spin" size={20} /> : <Navigation size={20} />}
              <span className="text-xs sm:text-sm">{language === 'ar' ? 'تحديد تلقائي (GPS)' : 'Auto GPS'}</span>
            </button>
            <button 
              onClick={() => setManualMode(!manualMode)}
              className={`flex-1 px-4 py-3 border-2 font-bold rounded-xl flex items-center justify-center gap-2 transition-colors ${
                manualMode ? 'bg-gold border-gold text-dark' : 'border-white/30 hover:bg-white/10 text-white'
              }`}
            >
              <Edit3 size={20} />
              <span className="text-xs sm:text-sm">{language === 'ar' ? 'إدخال يدوي' : 'Manual'}</span>
            </button>
          </div>
        </div>

        <AnimatePresence>
          {manualMode && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden mb-6"
            >
              <div className="bg-mid border border-gold/30 rounded-2xl p-5 shadow-sm">
                <div className="flex items-center justify-between mb-4 text-gold">
                  <div className="flex items-center gap-2">
                    <AlertTriangle size={18} />
                    <span className="font-bold text-sm">
                      {language === 'ar' ? 'الإدخال اليدوي للإحداثيات' : 'Manual Coordinates Entry'}
                    </span>
                  </div>
                </div>
                
                <div className="mb-4 bg-dark/50 border border-border p-3 rounded-xl">
                  <p className="text-sm text-gold font-bold mb-1">
                    {language === 'ar' ? 'كيف أحصل على هذه المعلومات؟' : 'How to get this information?'}
                  </p>
                  <ul className="text-xs text-light space-y-1 list-disc list-inside">
                    {language === 'ar' ? (
                      <>
                        <li>افتح شاشة الترفيه الموجودة أمام مقعدك بالطائرة.</li>
                        <li>اذهب إلى قسم "خريطة الرحلة" أو "Flight Map".</li>
                        <li>ابحث عن شاشة "بيانات الرحلة" أو "Flight Info".</li>
                        <li>ستجد هناك خط العرض (Latitude) وخط الطول (Longitude).</li>
                        <li>كذلك ستجد الارتفاع (Altitude)، وعادةً يكون بالقدم (ft).</li>
                      </>
                    ) : (
                      <>
                        <li>Open the in-flight entertainment screen in front of you.</li>
                        <li>Go to the "Flight Map" or "Geovision" section.</li>
                        <li>Look for "Flight Info" or "Flight Data".</li>
                        <li>There you'll find the Latitude and Longitude.</li>
                        <li>You'll also find the Altitude, usually in feet (ft).</li>
                      </>
                    )}
                  </ul>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div>
                    <label className="text-[10px] text-light mb-1 block">{language === 'ar' ? 'خط العرض (Lat)' : 'Latitude'} (-90 to 90)</label>
                    <input 
                      type="number" step="any" placeholder="e.g. 24.5"
                      value={mLat} onChange={e => setMLat(e.target.value)}
                      className="w-full bg-dark border border-border p-2.5 rounded-lg text-text text-sm font-mono" dir="ltr"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-light mb-1 block">{language === 'ar' ? 'خط الطول (Lng)' : 'Longitude'} (-180 to 180)</label>
                    <input 
                      type="number" step="any" placeholder="e.g. 45.2"
                      value={mLng} onChange={e => setMLng(e.target.value)}
                      className="w-full bg-dark border border-border p-2.5 rounded-lg text-text text-sm font-mono" dir="ltr"
                    />
                  </div>
                </div>
                <div className="mb-4">
                  <label className="text-[10px] text-light mb-1 block">{language === 'ar' ? 'الارتفاع (Altitude)' : 'Altitude'} (m or ft)</label>
                  <input 
                    type="number" step="any" placeholder="e.g. 35000"
                    value={mAlt} onChange={e => setMAlt(e.target.value)}
                    className="w-full bg-dark border border-border p-2.5 rounded-lg text-text text-sm font-mono" dir="ltr"
                  />
                  <div className="text-[9px] text-light mt-1">
                    {language === 'ar' ? 'أكثر من 15,000 سيتم اعتباره بالقدم ويحوّل تلقائياً لمتر' : 'Values > 15,000 will be treated as feet and auto-converted.'}
                  </div>
                </div>
                <button 
                  onClick={handleManualCalculate}
                  className="w-full bg-gold text-dark font-bold py-3 rounded-xl shadow-md active:scale-95 transition-all text-sm"
                >
                  {language === 'ar' ? 'احسب المواقيت' : 'Calculate Times'}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {coords && (
          <div className="bg-mid border border-border p-4 rounded-xl mb-6 flex flex-col gap-2 shadow-sm">
             <div className="flex justify-between items-center text-sm">
               <span className="text-light">{language === 'ar' ? 'خط العرض:' : 'Latitude:'}</span>
               <span className="text-gold font-bold font-mono">{coords.lat.toFixed(4)}°</span>
             </div>
             <div className="flex justify-between items-center text-sm">
               <span className="text-light">{language === 'ar' ? 'خط الطول:' : 'Longitude:'}</span>
               <span className="text-gold font-bold font-mono">{coords.lng.toFixed(4)}°</span>
             </div>
             {coords.alt !== undefined && coords.alt > 0 && (
               <div className="flex justify-between items-center text-sm">
                 <span className="text-light">{language === 'ar' ? 'الارتفاع:' : 'Altitude:'}</span>
                 <span className="text-gold font-bold font-mono">{Math.round(coords.alt)} m</span>
               </div>
             )}
          </div>
        )}

        {prayerTimes && (
          <motion.div initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} className="space-y-3">
            <div className="flex justify-between items-end mb-2">
              <h3 className="text-text font-bold text-lg">
                {language === 'ar' ? 'مواقيت الصلاة الحالية' : 'Current Prayer Times'}
              </h3>
              {prayerTimes.offset > 0 && (
                <div className="text-[9px] bg-red-500/20 text-red-400 px-2 py-1 rounded border border-red-500/30">
                  {language === 'ar' ? `تأخير الفجر/المغرب ~${prayerTimes.offset} دق` : `±${prayerTimes.offset} min altitude adjustment`}
                </div>
              )}
            </div>
            
            {prayers.map(p => (
              <div key={p} className="bg-dark border border-border p-4 rounded-xl flex justify-between items-center hover:border-gold/50 transition-colors shadow-sm">
                 <span className="text-text font-bold text-base">
                   {language === 'ar' ? arPrayers[p] : p}
                 </span>
                 <div className="flex items-center gap-2 text-gold font-bold">
                   <Clock size={16} />
                   <span className="font-mono text-lg">{prayerTimes[p]}</span>
                 </div>
              </div>
            ))}
          </motion.div>
        )}

      </div>
    </div>
  );
}

