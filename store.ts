import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Screen = 
  | 'home' | 'morning' | 'evening' | 'tasbih' 
  | 'kids' | 'quran' | 'tasmee' | 'hadith' 
  | 'challenges' | 'rewards' | 'ai' | 'full_quran' | 'surah' | 'prayer' | 'hadith_library' | 'islamic_stories'
  | 'more' | 'on_this_day' | 'qibla' | 'calendar' | 'flight_prayer' | 'khatmah' | 'happiness_wheel' | 'memorization'
  | 'athkar_categories' | 'athkar_morning' | 'athkar_evening' | 'athkar_after_prayer' | 'athkar_sleep' | 'athkar_waking_up' | 'athkar_food' | 'athkar_fasting'
  | 'athkar_travel' | 'athkar_mosque' | 'athkar_wudu' | 'athkar_home' | 'athkar_distress'
  | 'athkar_prayer' | 'athkar_adhan' | 'athkar_clothes' | 'athkar_toilet' | 'athkar_ruqyah';

export type AppTheme = 'dark' | 'light';
export type AppLanguage = 'ar' | 'en';
export type AppFontSize = 'sm' | 'md' | 'lg';

export type KhatmahType = 'reading' | 'memorization' | 'tadabbur';

export interface KhatmahPlan {
  id: string;
  type: KhatmahType;
  days: number;
  startDate: string;
  progressJuz: number;
  totalJuz: number;
  source?: 'app' | 'external';
  lastLogDate?: string;
}

interface AppState {
  currentScreen: Screen;
  screenHistory: Screen[];
  userName: string;
  xp: number;
  level: number;
  streak: number;
  lastActiveDate: string | null;
  stars: number;
  tasbihCount: number;
  tasbihMax: number;
  currentDhikrIndex: number;
  tasmeeSurah: number;
  selectedSurah: number | null;
  selectedAyahToScroll: number | null;
  quranBookmarks: Record<number, number>; // surahId -> ayahNumber
  joinedChallenges: string[]; // List of challenge codes

  quranTheme: 'light' | 'dark' | 'cream';
  quranFont: 'amiri' | 'madinah' | 'hafs';
  quranTajweed: boolean;

  theme: AppTheme;
  language: AppLanguage;
  fontSize: AppFontSize;
  isSettingsOpen: boolean;
  notificationsEnabled: boolean;
  tasbihSoundEnabled: boolean;
  focusModeEnabled: boolean;
  lastNotificationDate: string | null;

  dailyWirdReminderEnabled: boolean;
  dailyWirdReminderTime: string; // HH:mm format
  lastWirdReminderDate: string | null;

  prayerReminderEnabled: boolean;
  prayerSettings: Record<string, { enabled: boolean; mode: 'sound' | 'notification' | 'both'; muezzin?: string }>;
  selectedMuezzin: 'makkah' | 'madinah' | 'alafasy' | 'abdulbasit' | 'short' | 'husary' | 'minshawi' | 'maher' | 'shatri';
  calculationMethod: string;
  preReminderTime: number; // minutes
  dstAdjustment: number; // hours
  autoSilentMode: boolean;
  progressiveVolume: boolean;
  nightModeAudio: boolean;
  lastPrayerNotified: string | null;
  prayerTimes: Record<string, string> | null; // e.g. { Fajr: "05:00", Dhuhr: "12:00", ... }
  location: { latitude: number; longitude: number } | null;

  ttsCredits: number;
  lastTtsCreditResetDate: string | null;

  activityLog: Record<string, { xp: number; quran: number; tasbih: number; athkar: number; dua: number }>;
  savedUsers: Record<string, {
    xp: number;
    level: number;
    streak: number;
    lastActiveDate: string | null;
    stars: number;
    ttsCredits?: number;
    lastTtsCreditResetDate?: string | null;
    tasbihCount: number;
    activityLog: Record<string, { xp: number; quran: number; tasbih: number; athkar: number; dua: number }>;
    joinedChallenges?: string[];
    activeKhatmah?: KhatmahPlan | null;
    khatmahHistory?: KhatmahPlan[];
  }>;

  selectedQuranReciter: 'makkah' | 'madinah' | 'alafasy' | 'abdulbasit' | 'husary' | 'minshawi' | 'maher' | 'shatri' | 'ajamy' | 'shuraym' | 'jibreel' | 'ayyoub' | 'rifai';

  activeKhatmah: KhatmahPlan | null;
  khatmahHistory: KhatmahPlan[];

  navigate: (screen: Screen) => void;

  goBack: () => void;
  addXp: (amount: number) => void;
  logActivity: (type: 'quran' | 'tasbih' | 'athkar' | 'dua', count: number, xpAmount: number) => void;
  addStars: (amount: number) => void;
  setTasbihCount: (count: number) => void;
  setTasbihMax: (max: number) => void;
  setCurrentDhikrIndex: (index: number) => void;
  setTasmeeSurah: (index: number) => void;
  setSelectedSurah: (index: number | null) => void;
  setSelectedAyahToScroll: (index: number | null) => void;
  setQuranBookmark: (surahId: number, ayahNumber: number) => void;
  setQuranTheme: (theme: 'light' | 'dark' | 'cream') => void;
  setQuranFont: (font: 'amiri' | 'madinah' | 'hafs') => void;
  setQuranTajweed: (enabled: boolean) => void;
  setTheme: (theme: AppTheme) => void;
  setLanguage: (lang: AppLanguage) => void;
  setFontSize: (size: AppFontSize) => void;
  setSettingsOpen: (isOpen: boolean) => void;
  setNotificationsEnabled: (enabled: boolean) => void;
  setTasbihSoundEnabled: (enabled: boolean) => void;
  setFocusModeEnabled: (enabled: boolean) => void;
  setLastNotificationDate: (date: string) => void;
  setDailyWirdReminderEnabled: (enabled: boolean) => void;
  setDailyWirdReminderTime: (time: string) => void;
  setLastWirdReminderDate: (date: string | null) => void;
  setPrayerReminderEnabled: (enabled: boolean) => void;
  setPrayerSettings: (prayerName: string, settings: { enabled: boolean; mode: 'sound' | 'notification' | 'both'; muezzin?: string }) => void;
  setSelectedMuezzin: (muezzin: 'makkah' | 'madinah' | 'alafasy' | 'abdulbasit' | 'short') => void;
  setSelectedQuranReciter: (r: 'makkah' | 'madinah' | 'alafasy' | 'abdulbasit' | 'husary' | 'minshawi' | 'maher' | 'shatri' | 'ajamy' | 'shuraym' | 'jibreel' | 'ayyoub' | 'rifai') => void;
  setCalculationMethod: (method: string) => void;
  setPreReminderTime: (minutes: number) => void;
  setDstAdjustment: (hours: number) => void;
  setAutoSilentMode: (enabled: boolean) => void;
  setProgressiveVolume: (enabled: boolean) => void;
  setNightModeAudio: (enabled: boolean) => void;
  setLastPrayerNotified: (id: string | null) => void;
  setPrayerTimes: (times: Record<string, string> | null) => void;
  setLocation: (loc: { latitude: number; longitude: number } | null) => void;
  setUserName: (name: string) => void;
  startKhatmah: (plan: Omit<KhatmahPlan, 'startDate' | 'progressJuz' | 'totalJuz'>) => void;
  setKhatmahSource: (source: 'app' | 'external') => void;
  updateKhatmahProgress: (progressJuz: number, setDate?: boolean) => void;
  finishKhatmah: () => void;
  cancelKhatmah: () => void;
  joinChallenge: (code: string) => void;
  leaveChallenge: (code: string) => void;
  logout: () => void;

  deductTtsCredit: (amount: number) => boolean;
  addTtsCredits: (amount: number) => void;
  resetDailyTtsCredits: () => void;
  
  // Custom Alert
  alertMessage: { text: string; delay?: number } | null;
  showAlert: (text: string, delay?: number) => void;
  hideAlert: () => void;
}

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      currentScreen: 'home',
      screenHistory: [],
      userName: '',
      savedUsers: {},
      xp: 0,
      level: 1,
      streak: 0,
      
      alertMessage: null,
      showAlert: (text, delay = 5000) => {
        set({ alertMessage: { text, delay } });
        setTimeout(() => {
          set((state) => state.alertMessage?.text === text ? { alertMessage: null } : {});
        }, delay);
      },
      hideAlert: () => set({ alertMessage: null }),
      lastActiveDate: null,
      stars: 0,
      ttsCredits: 100,
      lastTtsCreditResetDate: null,
      tasbihCount: 0,
      tasbihMax: 33,
      currentDhikrIndex: 0,
      tasmeeSurah: 0,
      selectedSurah: null,
      selectedAyahToScroll: null,
      quranBookmarks: {},
      joinedChallenges: [],
      quranTheme: 'cream',
      quranFont: 'amiri',
      quranTajweed: true,
      theme: 'dark',
      language: 'ar',
      fontSize: 'md',
      isSettingsOpen: false,
      notificationsEnabled: false,
      tasbihSoundEnabled: true,
      focusModeEnabled: false,
      lastNotificationDate: null,
      dailyWirdReminderEnabled: false,
      dailyWirdReminderTime: '20:00',
      lastWirdReminderDate: null,
      prayerReminderEnabled: false,
      prayerSettings: {
        Fajr: { enabled: true, mode: 'both', muezzin: 'makkah' },
        Dhuhr: { enabled: true, mode: 'both', muezzin: 'makkah' },
        Asr: { enabled: true, mode: 'both', muezzin: 'makkah' },
        Maghrib: { enabled: true, mode: 'both', muezzin: 'makkah' },
        Isha: { enabled: true, mode: 'both', muezzin: 'makkah' },
      },
      selectedMuezzin: 'makkah',
      selectedQuranReciter: 'alafasy',
      calculationMethod: 'Egyptian',
      preReminderTime: 15,
      dstAdjustment: 0,
      autoSilentMode: false,
      progressiveVolume: false,
      nightModeAudio: true,
      lastPrayerNotified: null,
      prayerTimes: null,
      location: null,
      activityLog: {},
      activeKhatmah: null,
      khatmahHistory: [],

      navigate: (screen) => set((state) => {
        const isRoot = ['home', 'kids'].includes(screen);
        const newHistory = isRoot ? [] : [...state.screenHistory, state.currentScreen];
        return {
          currentScreen: screen,
          screenHistory: newHistory,
        };
      }),

      goBack: () => set((state) => {
        if (state.screenHistory.length === 0) return { currentScreen: 'home' };
        const newHistory = [...state.screenHistory];
        const prev = newHistory.pop()!;
        return { currentScreen: prev, screenHistory: newHistory };
      }),

      addXp: (amount) => set((state) => {
        const newXp = state.xp + amount;
        const newLevel = Math.floor(newXp / 100) + 1;
        return { xp: newXp, level: newLevel, ttsCredits: (state.ttsCredits || 0) + amount };
      }),
      logActivity: (type, count, xpAmount) => set((state) => {
        const today = new Date().toISOString().split('T')[0];
        const currentLog = state.activityLog[today] || { xp: 0, quran: 0, tasbih: 0, athkar: 0, dua: 0 };
        const newXp = state.xp + xpAmount;
        const newLevel = Math.floor(newXp / 100) + 1;
        
        // Streak calculation
        let newStreak = state.streak;
        if (state.lastActiveDate !== today) {
          if (!state.lastActiveDate) {
            newStreak = 1;
          } else {
            const lastDate = new Date(state.lastActiveDate);
            const todayDate = new Date(today);
            const diffDays = Math.floor((todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
            
            if (diffDays === 1) {
              newStreak += 1; // consecutive day
            } else if (diffDays > 1) {
              newStreak = 1; // broke streak
            } // else diffDays === 0, streak remains the same
          }
        }

        return {
          xp: newXp,
          level: newLevel,
          streak: newStreak,
          lastActiveDate: today,
          ttsCredits: (state.ttsCredits || 0) + xpAmount,
          activityLog: {
            ...state.activityLog,
            [today]: {
              ...currentLog,
              xp: currentLog.xp + xpAmount,
              [type]: currentLog[type] + count
            }
          }
        };
      }),
      addStars: (amount) => set((state) => ({ stars: state.stars + amount, ttsCredits: (state.ttsCredits || 0) + amount })),
      setTasbihCount: (count) => set({ tasbihCount: count }),
      setTasbihMax: (max) => set({ tasbihMax: max }),
      setCurrentDhikrIndex: (index) => set({ currentDhikrIndex: index }),
      setTasmeeSurah: (index) => set({ tasmeeSurah: index }),
      setSelectedSurah: (index) => set({ selectedSurah: index }),
      setSelectedAyahToScroll: (index) => set({ selectedAyahToScroll: index }),
      setQuranBookmark: (surahId, ayahNumber) => set((state) => ({
        quranBookmarks: { ...state.quranBookmarks, [surahId]: ayahNumber }
      })),
      setQuranTheme: (t) => set({ quranTheme: t }),
      setQuranFont: (f) => set({ quranFont: f }),
      setQuranTajweed: (t) => set({ quranTajweed: t }),
      setTheme: (t) => set({ theme: t }),
      setLanguage: (l) => set({ language: l }),
      setFontSize: (s) => set({ fontSize: s }),
      setSettingsOpen: (o) => set({ isSettingsOpen: o }),
      setNotificationsEnabled: (e) => set({ notificationsEnabled: e }),
      setTasbihSoundEnabled: (e) => set({ tasbihSoundEnabled: e }),
      setFocusModeEnabled: (e) => set({ focusModeEnabled: e }),
      setLastNotificationDate: (d) => set({ lastNotificationDate: d }),
      setDailyWirdReminderEnabled: (e) => set({ dailyWirdReminderEnabled: e }),
      setDailyWirdReminderTime: (t) => set({ dailyWirdReminderTime: t }),
      setLastWirdReminderDate: (d) => set({ lastWirdReminderDate: d }),
      setPrayerReminderEnabled: (e) => set({ prayerReminderEnabled: e }),
      setPrayerSettings: (prayerName, settings) => set((state) => ({
        prayerSettings: { ...state.prayerSettings, [prayerName]: settings }
      })),
      setSelectedMuezzin: (m) => set({ selectedMuezzin: m }),
      setSelectedQuranReciter: (r) => set({ selectedQuranReciter: r }),
      setCalculationMethod: (m) => set({ calculationMethod: m }),
      setPreReminderTime: (m) => set({ preReminderTime: m }),
      setDstAdjustment: (h) => set({ dstAdjustment: h }),
      setAutoSilentMode: (e) => set({ autoSilentMode: e }),
      setProgressiveVolume: (e) => set({ progressiveVolume: e }),
      setNightModeAudio: (e) => set({ nightModeAudio: e }),
      setLastPrayerNotified: (id) => set({ lastPrayerNotified: id }),
      setPrayerTimes: (times) => set({ prayerTimes: times }),
      setLocation: (loc) => set({ location: loc }),
      setUserName: (name) => set((state) => {
        const saved = state.savedUsers[name];
        if (saved) {
          return {
            userName: name,
            xp: saved.xp,
            level: saved.level,
            streak: saved.streak,
            lastActiveDate: saved.lastActiveDate,
            stars: saved.stars,
            ttsCredits: saved.ttsCredits || 100,
            lastTtsCreditResetDate: saved.lastTtsCreditResetDate || null,
            tasbihCount: saved.tasbihCount,
            activityLog: saved.activityLog,
            joinedChallenges: saved.joinedChallenges || [],
            activeKhatmah: saved.activeKhatmah || null,
            khatmahHistory: saved.khatmahHistory || [],
          };
        }
        return { userName: name };
      }),
      startKhatmah: (plan) => set({
        activeKhatmah: {
          ...plan,
          startDate: new Date().toISOString(),
          progressJuz: 0,
          totalJuz: 30,
        }
      }),
      setKhatmahSource: (source) => set((state) => {
        if (!state.activeKhatmah) return {};
        return {
          activeKhatmah: {
            ...state.activeKhatmah,
            source,
          }
        };
      }),
      updateKhatmahProgress: (progress, setDate = false) => set((state) => {
        if (!state.activeKhatmah) return {};
        const isFinished = progress >= state.activeKhatmah.totalJuz;
        return {
          activeKhatmah: {
            ...state.activeKhatmah,
            progressJuz: Math.min(progress, state.activeKhatmah.totalJuz),
            lastLogDate: setDate ? new Date().toISOString() : state.activeKhatmah.lastLogDate,
          }
        };
      }),
      finishKhatmah: () => set((state) => {
        if (!state.activeKhatmah) return {};
        return {
          khatmahHistory: [...state.khatmahHistory, { ...state.activeKhatmah, progressJuz: state.activeKhatmah.totalJuz }],
          activeKhatmah: null,
          xp: state.xp + 500, // Big reward for finishing a khatmah
          level: Math.floor((state.xp + 500) / 100) + 1,
        };
      }),
      cancelKhatmah: () => set({ activeKhatmah: null }),
      joinChallenge: (code) => set((state) => ({
        joinedChallenges: state.joinedChallenges.includes(code) ? state.joinedChallenges : [...state.joinedChallenges, code]
      })),
      leaveChallenge: (code) => set((state) => ({
        joinedChallenges: state.joinedChallenges.filter(c => c !== code)
      })),
      logout: () => set((state) => {
        if (!state.userName) return {};
        
        return {
          savedUsers: {
            ...state.savedUsers,
            [state.userName]: {
              xp: state.xp,
              level: state.level,
              streak: state.streak,
              lastActiveDate: state.lastActiveDate,
              stars: state.stars,
              ttsCredits: state.ttsCredits || 0,
              lastTtsCreditResetDate: state.lastTtsCreditResetDate,
              tasbihCount: state.tasbihCount,
              activityLog: state.activityLog,
              joinedChallenges: state.joinedChallenges,
              activeKhatmah: state.activeKhatmah,
              khatmahHistory: state.khatmahHistory,
            }
          },
          userName: '', 
          xp: 0, 
          level: 1, 
          streak: 0, 
          lastActiveDate: null, 
          stars: 0, 
          tasbihCount: 0, 
          currentDhikrIndex: 0, 
          activityLog: {},
          joinedChallenges: [],
          activeKhatmah: null,
          khatmahHistory: []
        };
      }),

      deductTtsCredit: (amount) => {
        let success = false;
        set((state) => {
           const current = state.ttsCredits || 0;
           if (current >= amount) {
               success = true;
               return { ttsCredits: current - amount };
           }
           return {};
        });
        return success;
      },
      addTtsCredits: (amount) => set((state) => ({ ttsCredits: (state.ttsCredits || 0) + amount })),
      resetDailyTtsCredits: () => set((state) => {
         const today = new Date().toISOString().split('T')[0];
         if (state.lastTtsCreditResetDate !== today) {
             return { ttsCredits: Math.max(state.ttsCredits || 0, 100), lastTtsCreditResetDate: today };
         }
         return {};
      }),
    }),
    {
      name: 'muslim-app-storage-v2',
      partialize: (state) => {
        const currentSavedUsers = { ...state.savedUsers };
        if (state.userName) {
          currentSavedUsers[state.userName] = {
            xp: state.xp,
            level: state.level,
            streak: state.streak,
            lastActiveDate: state.lastActiveDate,
            stars: state.stars,
            ttsCredits: state.ttsCredits,
            lastTtsCreditResetDate: state.lastTtsCreditResetDate,
            tasbihCount: state.tasbihCount,
            activityLog: state.activityLog,
            joinedChallenges: state.joinedChallenges,
            activeKhatmah: state.activeKhatmah,
            khatmahHistory: state.khatmahHistory,
          };
        }
        return {
          savedUsers: currentSavedUsers,
          userName: state.userName,
        xp: state.xp,
        level: state.level,
        streak: state.streak,
        lastActiveDate: state.lastActiveDate,
        stars: state.stars,
        ttsCredits: state.ttsCredits,
        lastTtsCreditResetDate: state.lastTtsCreditResetDate,
        quranBookmarks: state.quranBookmarks,
        joinedChallenges: state.joinedChallenges,
        quranTheme: state.quranTheme,
        quranFont: state.quranFont,
        quranTajweed: state.quranTajweed,
        theme: state.theme,
        language: state.language,
        fontSize: state.fontSize,
        notificationsEnabled: state.notificationsEnabled,
        tasbihSoundEnabled: state.tasbihSoundEnabled,
        focusModeEnabled: state.focusModeEnabled,
        lastNotificationDate: state.lastNotificationDate,
        dailyWirdReminderEnabled: state.dailyWirdReminderEnabled,
        dailyWirdReminderTime: state.dailyWirdReminderTime,
        lastWirdReminderDate: state.lastWirdReminderDate,
        prayerReminderEnabled: state.prayerReminderEnabled,
        prayerSettings: state.prayerSettings || {
          Fajr: { enabled: true, mode: 'both', muezzin: 'makkah' },
          Dhuhr: { enabled: true, mode: 'both', muezzin: 'makkah' },
          Asr: { enabled: true, mode: 'both', muezzin: 'makkah' },
          Maghrib: { enabled: true, mode: 'both', muezzin: 'makkah' },
          Isha: { enabled: true, mode: 'both', muezzin: 'makkah' },
        },
        selectedMuezzin: state.selectedMuezzin,
        selectedQuranReciter: state.selectedQuranReciter,
        calculationMethod: state.calculationMethod,
        preReminderTime: state.preReminderTime,
        dstAdjustment: state.dstAdjustment,
        autoSilentMode: state.autoSilentMode,
        progressiveVolume: state.progressiveVolume,
        nightModeAudio: state.nightModeAudio,
        location: state.location,
        prayerTimes: state.prayerTimes,
        activityLog: state.activityLog,
        activeKhatmah: state.activeKhatmah,
        khatmahHistory: state.khatmahHistory,
      };
      },
    }
  )
);
