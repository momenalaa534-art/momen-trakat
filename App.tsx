/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Home, Compass, Trophy, Star, Mic, MessageSquare, LayoutGrid } from 'lucide-react';
import { useStore, Screen } from './store';

import { HomeScreen } from './screens/HomeScreen';
import { AthkarScreen } from './screens/AthkarScreen';
import { AthkarCategoriesScreen } from './screens/AthkarCategoriesScreen';
import { TasbihScreen } from './screens/TasbihScreen';
import { KidsHomeScreen } from './screens/KidsScreen';
import { QuranScreen } from './screens/QuranScreen';
import { TasmeeScreen } from './screens/TasmeeScreen';
import { HadithQuizScreen } from './screens/HadithQuizScreen';
import { ChallengesScreen } from './screens/ChallengesScreen';
import { RewardsScreen } from './screens/RewardsScreen';
import { AIDuaScreen } from './screens/AIDuaScreen';
import { FullQuranScreen } from './screens/FullQuranScreen';
import { SurahScreen } from './screens/SurahScreen';
import { PrayerTimesScreen } from './screens/PrayerTimesScreen';
import { HadithLibraryScreen } from './screens/HadithLibraryScreen';
import { IslamicStoriesScreen } from './screens/IslamicStoriesScreen';
import { MoreScreen } from './screens/MoreScreen';
import { OnThisDayScreen } from './screens/OnThisDayScreen';
import { QiblaScreen } from './screens/QiblaScreen';
import { CalendarScreen } from './screens/CalendarScreen';
import { FlightPrayerScreen } from './screens/FlightPrayerScreen';
import { KhatmahScreen } from './screens/KhatmahScreen';
import { TadabburScreen } from './screens/TadabburScreen';
import { HappinessWheelScreen } from './screens/HappinessWheelScreen';
import { MemorizationScreen } from './screens/MemorizationScreen';
import { SettingsDrawer } from './components/SettingsDrawer';
import { useTranslation } from './i18n';
import { useAthkarNotifications } from './hooks/useAthkarNotifications';
import { useWirdReminder } from './hooks/useWirdReminder';
import { useFocusMode } from './hooks/useFocusMode';
import { usePrayerNotifications } from './hooks/usePrayerNotifications';
import { OnboardingScreen } from './screens/OnboardingScreen';
import { useChallengeSync } from './hooks/useChallengeSync';

export default function App() {
  const currentScreen = useStore((s) => s.currentScreen);
  const userName = useStore((s) => s.userName);
  const navigate = useStore((s) => s.navigate);
  const resetDailyTtsCredits = useStore((s) => s.resetDailyTtsCredits);
  const { theme, language, fontSize } = useStore();
  const { t } = useTranslation();

  useAthkarNotifications();
  useWirdReminder();
  useFocusMode();
  usePrayerNotifications();
  useChallengeSync();

  useEffect(() => {
    resetDailyTtsCredits();
  }, [resetDailyTtsCredits]);

  useEffect(() => {
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    
    if (theme === 'light') {
      document.body.classList.add('light-theme');
      document.documentElement.classList.add('light-theme');
    } else {
      document.body.classList.remove('light-theme');
      document.documentElement.classList.remove('light-theme');
    }

    document.documentElement.classList.remove('font-sm', 'font-md', 'font-lg');
    document.documentElement.classList.add(`font-${fontSize}`);
  }, [language, theme, fontSize]);

  const getScreenContent = () => {
    switch (currentScreen) {
      case 'home': return <HomeScreen />;
      case 'morning': return <AthkarScreen type="morning" />;
      case 'evening': return <AthkarScreen type="evening" />;
      case 'athkar_categories': return <AthkarCategoriesScreen />;
      case 'athkar_morning': return <AthkarScreen type="morning" />;
      case 'athkar_evening': return <AthkarScreen type="evening" />;
      case 'athkar_after_prayer': return <AthkarScreen type="after_prayer" />;
      case 'athkar_sleep': return <AthkarScreen type="sleep" />;
      case 'athkar_waking_up': return <AthkarScreen type="waking_up" />;
      case 'athkar_food': return <AthkarScreen type="food" />;
      case 'athkar_fasting': return <AthkarScreen type="fasting" />;
      case 'athkar_travel': return <AthkarScreen type="travel" />;
      case 'athkar_mosque': return <AthkarScreen type="mosque" />;
      case 'athkar_wudu': return <AthkarScreen type="wudu" />;
      case 'athkar_home': return <AthkarScreen type="home" />;
      case 'athkar_distress': return <AthkarScreen type="distress" />;
      case 'athkar_prayer': return <AthkarScreen type="prayer" />;
      case 'athkar_adhan': return <AthkarScreen type="adhan" />;
      case 'athkar_clothes': return <AthkarScreen type="clothes" />;
      case 'athkar_toilet': return <AthkarScreen type="toilet" />;
      case 'athkar_ruqyah': return <AthkarScreen type="ruqyah" />;
      case 'tasbih': return <TasbihScreen />;
      case 'kids': return <KidsHomeScreen />;
      case 'quran': return <QuranScreen />;
      case 'tasmee': return <TasmeeScreen />;
      case 'hadith': return <HadithQuizScreen />;
      case 'challenges': return <ChallengesScreen />;
      case 'rewards': return <RewardsScreen />;
      case 'ai': return <AIDuaScreen />;
      case 'tadabbur': return <TadabburScreen />;
      case 'full_quran': return <FullQuranScreen />;
      case 'surah': return <SurahScreen />;
      case 'prayer': return <PrayerTimesScreen />;
      case 'hadith_library': return <HadithLibraryScreen />;
      case 'islamic_stories': return <IslamicStoriesScreen />;
      case 'more': return <MoreScreen />;
      case 'on_this_day': return <OnThisDayScreen />;
      case 'qibla': return <QiblaScreen />;
      case 'calendar': return <CalendarScreen />;
      case 'flight_prayer': return <FlightPrayerScreen />;
      case 'khatmah': return <KhatmahScreen />;
      case 'happiness_wheel': return <HappinessWheelScreen />;
      case 'memorization': return <MemorizationScreen />;
      default: return <HomeScreen />;
    }
  };

  const isKidsMode = ['kids', 'quran', 'tasmee', 'hadith'].includes(currentScreen);

  const standardNav = [
    { id: 'home', name: t('nav.home'), icon: Home },
    { id: 'tasbih', name: t('nav.tasbih'), icon: Compass },
    { id: 'challenges', name: t('nav.challenges'), icon: Trophy },
    { id: 'rewards', name: t('nav.rewards'), icon: Star },
    { id: 'more', name: t('nav.more'), icon: LayoutGrid },
  ];

  const kidsNav = [
    { id: 'kids', name: t('nav.home'), icon: Home },
    { id: 'quran', name: t('nav.quran'), icon: Mic },
    { id: 'hadith', name: t('nav.hadith'), icon: MessageSquare },
    { id: 'rewards', name: t('nav.rewards'), icon: Star },
  ];

  const activeNav = isKidsMode ? kidsNav : standardNav;

  if (!userName) {
    return <OnboardingScreen />;
  }

  return (
    <div className="w-full max-w-md mx-auto bg-dark h-screen max-h-screen flex flex-col overflow-hidden text-sm relative">
      
      <div className="flex-1 overflow-hidden relative">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.div
            key={currentScreen}
            initial={{ opacity: 0, scale: 0.98, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 1.02, y: -10 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="absolute inset-0 flex flex-col"
          >
            {getScreenContent()}
          </motion.div>
        </AnimatePresence>
      </div>

      <nav className="flex justify-around items-center pt-3 pb-4 bg-mid border-t border-border z-20 shrink-0">
        {activeNav.map((item) => {
          const Icon = item.icon;
          const isActive = currentScreen === item.id || 
            (item.id === 'home' && currentScreen === 'morning') || 
            (item.id === 'home' && currentScreen === 'evening') ||
            (item.id === 'home' && currentScreen === 'ai') ||
            (item.id === 'home' && currentScreen.startsWith('athkar')) ||
            (item.id === 'more' && ['more', 'on_this_day', 'qibla', 'calendar', 'flight_prayer', 'khatmah', 'happiness_wheel', 'memorization'].includes(currentScreen));

          return (
            <button
              key={item.id}
              onClick={() => navigate(item.id as Screen)}
              className={`flex flex-col items-center gap-1.5 px-4 pb-2 transition-colors ${
                isActive ? 'text-gold' : 'text-light hover:text-gold/80'
              }`}
            >
              <motion.div
                animate={isActive ? { y: -2, scale: 1.1 } : { y: 0, scale: 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              >
                <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
              </motion.div>
              <span className={`text-[10px] ${isActive ? 'font-bold' : ''}`}>{item.name}</span>
            </button>
          );
        })}
      </nav>

        {/* Settings Drawer Overlay */}
      <SettingsDrawer />

      {/* Custom Alert Overlay */}
      <AlertModal />
    </div>
  );
}

function AlertModal() {
  const alertMessage = useStore((s) => s.alertMessage);
  const hideAlert = useStore((s) => s.hideAlert);
  const { language } = useStore();

  if (!alertMessage) return null;

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-mid border border-gold/30 rounded-2xl p-6 shadow-2xl max-w-sm w-full relative -mt-20">
        <p className="text-light text-center font-bold text-lg whitespace-pre-wrap leading-relaxed">
          {alertMessage.text}
        </p>
        <button 
          onClick={hideAlert}
          className="mt-6 w-full py-3 bg-gold text-dark font-bold rounded-xl active:scale-95 transition-transform"
        >
          {language === 'ar' ? 'حسناً' : 'OK'}
        </button>
      </div>
    </div>
  );
}

