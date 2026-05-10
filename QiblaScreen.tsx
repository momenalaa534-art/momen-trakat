import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'motion/react';
import { Compass, MapPin, RefreshCw } from 'lucide-react';
import { useStore } from '../store';
import { TopBar } from '../components/TopBar';

const KAABA_COORDS = {
  latitude: 21.422487,
  longitude: 39.826206,
};

export function QiblaScreen() {
  const language = useStore(s => s.language);
  const userLocation = useStore(s => s.location);
  const setLocation = useStore(s => s.setLocation);
  
  const [heading, setHeading] = useState<number | null>(null);
  const [qiblaAngle, setQiblaAngle] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLocating, setIsLocating] = useState(false);

  // Smooth the heading to prevent jumping/spinning and lagging
  const smoothedHeadingRef = useRef<number | null>(null);

  const fetchLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setError(language === 'ar' ? 'الموقع غير مدعوم في متصفحك' : 'Geolocation is not supported by your browser');
      return;
    }
    
    setIsLocating(true);
    setError(null);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        });
        setIsLocating(false);
      },
      (err) => {
        console.error(err);
        setIsLocating(false);
        setError(language === 'ar' ? 'تعذر الحصول على الموقع بدقة. يرجى تفعيله من الإعدادات.' : 'Could not get location accurately. Please enable it in settings.');
      },
      { enableHighAccuracy: true, maximumAge: 0 }
    );
  }, [setLocation, language]);

  useEffect(() => {
    if (!userLocation) {
      fetchLocation();
    }
  }, [userLocation, fetchLocation]);

  // Compass Logic
  useEffect(() => {
    let usingAbsolute = false;
    let isSupported = false;

    const updateHeading = (rawHeading: number) => {
      // Basic Low-pass filter to prevent "hanging" and smooth the needle
      if (smoothedHeadingRef.current === null) {
        smoothedHeadingRef.current = rawHeading;
      } else {
        let diff = rawHeading - (smoothedHeadingRef.current % 360);
        if (diff > 180) diff -= 360;
        if (diff < -180) diff += 360;
        smoothedHeadingRef.current += diff * 0.15; // 0.15 is the smoothing factor
      }
      setHeading(smoothedHeadingRef.current);
    };

    const handleAbsolute = (event: DeviceOrientationEvent) => {
      if (event.alpha !== null) {
        usingAbsolute = true;
        updateHeading(360 - event.alpha);
      }
    };

    const handleStandard = (event: DeviceOrientationEvent) => {
      if ('webkitCompassHeading' in event) {
        updateHeading((event as any).webkitCompassHeading);
      } else if (!usingAbsolute && event.alpha !== null) {
        updateHeading(360 - event.alpha);
      }
    };

    if (window.DeviceOrientationEvent) {
      isSupported = true;
      if (typeof (DeviceOrientationEvent as any).requestPermission !== 'function') {
        if ('ondeviceorientationabsolute' in window) {
          window.addEventListener('deviceorientationabsolute', handleAbsolute, true);
        }
        window.addEventListener('deviceorientation', handleStandard, true);
      }
    } else {
      setError(language === 'ar' ? 'جهازك لا يدعم البوصلة' : 'Compass not supported on your device');
    }

    return () => {
      if (isSupported) {
        if ('ondeviceorientationabsolute' in window) {
          window.removeEventListener('deviceorientationabsolute', handleAbsolute, true);
        }
        window.removeEventListener('deviceorientation', handleStandard, true);
      }
    };
  }, [language]);

  // Request Compass Permission (iOS)
  const requestCompassPermission = async () => {
    if (typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
      try {
        const permissionState = await (DeviceOrientationEvent as any).requestPermission();
        if (permissionState === 'granted') {
          window.addEventListener('deviceorientation', (e) => {
            let currentHeading = null;
            if ('webkitCompassHeading' in e) {
              currentHeading = (e as any).webkitCompassHeading;
            } else if (e.alpha !== null) {
              currentHeading = 360 - e.alpha;
            }
            if (currentHeading !== null) {
              if (smoothedHeadingRef.current === null) {
                smoothedHeadingRef.current = currentHeading;
              } else {
                let diff = currentHeading - (smoothedHeadingRef.current % 360);
                if (diff > 180) diff -= 360;
                if (diff < -180) diff += 360;
                smoothedHeadingRef.current += diff * 0.15;
              }
              setHeading(smoothedHeadingRef.current);
            }
          }, true);
        } else {
          setError(language === 'ar' ? 'تم رفض إذن البوصلة' : 'Compass permission denied');
        }
      } catch (err) {
        console.error(err);
      }
    }
  };

  // Calculate Qibla Angle from coordinates
  useEffect(() => {
    if (userLocation) {
      calculateQibla(userLocation.latitude, userLocation.longitude);
    }
  }, [userLocation]);

  const calculateQibla = (lat: number, lng: number) => {
    const toRad = (deg: number) => (deg * Math.PI) / 180;
    const toDeg = (rad: number) => (rad * 180) / Math.PI;

    const latK = toRad(KAABA_COORDS.latitude);
    const lngK = toRad(KAABA_COORDS.longitude);
    const latU = toRad(lat);
    const lngU = toRad(lng);

    const dfLng = lngK - lngU;

    const y = Math.sin(dfLng);
    const x = Math.cos(latU) * Math.tan(latK) - Math.sin(latU) * Math.cos(dfLng);

    let qibla = toDeg(Math.atan2(y, x));
    qibla = (qibla + 360) % 360;

    setQiblaAngle(qibla);
  };

  // Display angle calculation
  const getPointerRotation = () => {
    if (heading === null || qiblaAngle === null) return 0;
    return qiblaAngle - heading;
  };

  const isFacingQibla = () => {
    const rot = Math.abs(getPointerRotation() % 360);
    return rot < 5 || rot > 355;
  };

  return (
    <div className="flex flex-col flex-1 h-full bg-dark">
      <TopBar title={language === 'ar' ? 'القبلة' : 'Qibla Compass'} />
      
      <div className="flex-1 flex flex-col items-center justify-center p-5 pb-24 relative overflow-hidden">
        
        {error && (
          <div className="absolute top-8 left-4 right-4 bg-red-500/10 border border-red-500/50 p-4 rounded-xl text-center text-red-200 z-50">
            {error}
          </div>
        )}

        {!userLocation && !isLocating && (
          <div className="mb-8 text-center bg-mid border border-border p-4 rounded-xl z-20">
             <MapPin size={32} className="text-light mx-auto mb-2" />
             <p className="text-text font-bold mb-3">
               {language === 'ar' ? 'يرجى تفعيل الموقع لتحديد القبلة' : 'Please enable location for Qibla calculation'}
             </p>
             <button 
               onClick={fetchLocation}
               className="bg-gold text-dark font-bold px-4 py-2 rounded-lg flex items-center gap-2 mx-auto"
             >
               <MapPin size={16} /> {language === 'ar' ? 'تحديد الموقع الآن' : 'Locate Now'}
             </button>
          </div>
        )}

        {isLocating && (
          <div className="mb-8 text-center bg-mid border border-border p-4 rounded-xl z-20">
             <RefreshCw size={32} className="text-gold mx-auto mb-2 animate-spin" />
             <p className="text-text font-bold">
               {language === 'ar' ? 'جاري تحديد الموقع بدقة...' : 'Getting accurate location...'}
             </p>
          </div>
        )}

        {typeof (DeviceOrientationEvent as any).requestPermission === 'function' && heading === null && !error && (
          <button 
            onClick={requestCompassPermission}
            className="mb-8 bg-gold text-dark font-bold px-6 py-3 rounded-full shadow-lg z-20"
          >
            {language === 'ar' ? 'تفعيل البوصلة' : 'Enable Compass'}
          </button>
        )}

        <div className="relative w-72 h-72 rounded-full border-4 border-gold/30 bg-mid/30 shadow-[0_0_50px_rgba(212,175,55,0.1)] flex items-center justify-center">
           {/* North marker static or rotating with compass */}
           <motion.div 
             className="absolute w-full h-full"
             style={{ transform: `rotate(${heading ? -heading : 0}deg)` }}
           >
             <div className="absolute top-2 w-full text-center text-red-500 font-bold text-lg">N</div>
             <div className="absolute bottom-2 w-full text-center text-light font-bold text-lg">S</div>
             <div className="absolute right-2 top-1/2 -translate-y-1/2 text-light font-bold text-lg">E</div>
             <div className="absolute left-2 top-1/2 -translate-y-1/2 text-light font-bold text-lg">W</div>
             
             {/* Compass Ticks */}
             {[...Array(24)].map((_, i) => (
                <div 
                  key={i} 
                  className="absolute w-full h-full"
                  style={{ transform: `rotate(${i * 15}deg)` }}
                >
                  <div className={`mx-auto w-1 ${i % 6 === 0 ? 'h-4 bg-light/50' : 'h-2 bg-light/20'}`} />
                </div>
             ))}
           </motion.div>

           {/* The Qibla Pointer */}
           {qiblaAngle !== null && (
             <motion.div 
               className="absolute w-full h-full z-10" /* REMOVED transition-transform HERE */
               style={{ transform: `rotate(${getPointerRotation()}deg)` }}
             >
               <div className="absolute top-8 left-1/2 -translate-x-1/2 flex flex-col items-center drop-shadow-2xl">
                 <div className="w-0 h-0 border-l-[15px] border-r-[15px] border-b-[30px] border-transparent border-b-gold mb-1 filter drop-shadow-lg" />
                 <div className="bg-dark rounded-md border border-gold/50 p-1 flex items-center justify-center">
                    {/* Visual representation of Kaaba */}
                    <div className="w-8 h-8 bg-black border border-gold relative flex items-center justify-center">
                      <div className="w-full h-2 absolute top-2 bg-gold" />
                    </div>
                 </div>
               </div>
             </motion.div>
           )}

           {/* Center dot */}
           <div className="w-4 h-4 bg-gold rounded-full relative z-20 shadow-lg" />
        </div>

        {/* Feedback text */}
        <div className="mt-12 text-center h-16">
          {qiblaAngle !== null && heading !== null && (
            <motion.div
              animate={{
                scale: isFacingQibla() ? [1, 1.05, 1] : 1,
                color: isFacingQibla() ? '#10b981' : '#D4AF37'
              }}
              transition={{ repeat: isFacingQibla() ? Infinity : 0, duration: 1 }}
              className="font-bold text-2xl flex flex-col items-center gap-2"
            >
              <Compass size={32} />
              {isFacingQibla() 
                ? (language === 'ar' ? 'أنت متجه نحو القبلة!' : 'You are facing the Qibla!') 
                : (language === 'ar' ? 'قم بالدوران ليتطابق المؤشر مع الكعبة' : 'Rotate to align the pointer with Kaaba')}
            </motion.div>
          )}
        </div>

      </div>
    </div>
  );
}
