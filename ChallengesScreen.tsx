import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { useStore } from '../store';
import { TopBar } from '../components/TopBar';
import { useFirebaseAuth } from '../hooks/useFirebaseAuth';
import { challengesService, Challenge, ChallengeMember } from '../services/challengesService';
import { useTranslation } from '../i18n';
import { Users, Plus, LogIn, Trophy, Clock, Share2, ClipboardCopy } from 'lucide-react';

export function ChallengesScreen() {
  const { user, loginWithGoogle } = useFirebaseAuth();
  const userName = useStore(state => state.userName);
  const xp = useStore(state => state.xp);
  const joinedChallenges = useStore(state => state.joinedChallenges);
  const joinChallengeStore = useStore(state => state.joinChallenge);
  const { language } = useTranslation();

  const [activeChallengeCode, setActiveChallengeCode] = useState<string | null>(joinedChallenges[0] || null);
  const [challengeData, setChallengeData] = useState<Challenge | null>(null);
  const [members, setMembers] = useState<ChallengeMember[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const [newChallengeName, setNewChallengeName] = useState('');
  const [newChallengeDays, setNewChallengeDays] = useState(7);
  const [joinCode, setJoinCode] = useState('');
  const [loading, setLoading] = useState(false);

  // Sync active challenge if joinedChallenges changes
  useEffect(() => {
    if (!activeChallengeCode && joinedChallenges.length > 0) {
      setActiveChallengeCode(joinedChallenges[0]);
    }
  }, [joinedChallenges, activeChallengeCode]);

  useEffect(() => {
    if (!activeChallengeCode) return;
    
    // Fetch details
    challengesService.getChallengeDetails(activeChallengeCode).then(data => {
      setChallengeData(data);
    }).catch(e => console.error("Error fetching challenge", e));

    // Subscribe to members
    const unsubscribe = challengesService.subscribeToMembers(activeChallengeCode, (newMembers) => {
      setMembers(newMembers);
    });

    return () => unsubscribe();
  }, [activeChallengeCode]);

  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleLogin = async () => {
    setIsLoggingIn(true);
    try {
      setAuthError(null);
      await loginWithGoogle();
    } catch (e: any) {
      console.error(e);
      if (e?.code === 'auth/operation-not-allowed') {
        setAuthError('not-allowed');
      } else if (e?.code === 'auth/popup-blocked' || e?.code === 'auth/popup-closed-by-user') {
        setAuthError('popup-blocked');
      } else {
        setAuthError(e?.message || 'unknown');
        let errorMsg = language === 'ar' ? 'فشل تسجيل الدخول.' : 'Login failed.';
        errorMsg += '\n' + (e?.message || 'Unknown Error');
        alert(errorMsg);
      }
    }
    setIsLoggingIn(false);
  };

  const handleCreate = async () => {
    if (!newChallengeName.trim() || !user) return;
    setLoading(true);
    try {
      const code = await challengesService.createChallenge(user.uid, newChallengeName, newChallengeDays);
      await challengesService.joinChallenge(code, user.uid, userName, xp);
      joinChallengeStore(code);
      setActiveChallengeCode(code);
      setIsCreating(false);
    } catch (e) {
      console.error(e);
      alert(language === 'ar' ? 'حدث خطأ' : 'Error occurred');
    }
    setLoading(false);
  };

  const handleJoin = async () => {
    if (!joinCode.trim() || !user) return;
    setLoading(true);
    const upperCode = joinCode.trim().toUpperCase();
    try {
      await challengesService.joinChallenge(upperCode, user.uid, userName, xp);
      joinChallengeStore(upperCode);
      setActiveChallengeCode(upperCode);
      setIsJoining(false);
    } catch (e) {
      console.error(e);
      alert(language === 'ar' ? 'الكود غير صحيح' : 'Invalid code');
    }
    setLoading(false);
  };

  const shareWhatsApp = () => {
    if (!activeChallengeCode || !challengeData) return;
    const text = language === 'ar' 
      ? `انضم لتحدي "${challengeData.name}" معي على تطبيق المسلم! كود التحدي: ${activeChallengeCode}\nهيا نتنافس في طاعة الله!`
      : `Join the "${challengeData.name}" challenge with me! Code: ${activeChallengeCode}`;
    
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`);
  };

  if (!user) {
    return (
      <div className="flex flex-col flex-1 h-full bg-dark">
        <TopBar title={language === 'ar' ? 'التحديات 🏆' : 'Challenges 🏆'} />
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center gap-6">
          <div className="w-20 h-20 bg-mid rounded-full flex items-center justify-center border border-gold/30 text-gold shrink-0">
            <Users size={32} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gold mb-2">
              {language === 'ar' ? 'تحديات الأهل والأصدقاء' : 'Family & Friends Challenges'}
            </h2>
            <p className="text-light text-sm">
              {language === 'ar' 
                ? 'سجل دخولك بحساب جوجل لتتمكن من إنشاء تحدي والمنافسة مع أحبائك.' 
                : 'Sign in with Google to create and join challenges with loved ones.'}
            </p>
          </div>
          {authError === 'popup-blocked' && (
            <div className="bg-yellow-500/10 border border-yellow-500 text-yellow-500 p-4 rounded-xl text-xs text-start w-full max-w-xs leading-relaxed">
              <b>{language === 'ar' ? 'عذراً!' : 'Oops!'}</b> 
              <br/>
              {language === 'ar' ? 'تم حظر نافذة تسجيل الدخول من قبل المتصفح. يرجى السماح بالنوافذ المنبثقة (Popups)، أو المحاولة مرة أخرى باستخدام وضع التخفي أو متصفح آخر.' : 'The login popup was blocked by your browser. Please allow popups, or try again in incognito mode or another browser.'}
            </div>
          )}
          {authError === 'not-allowed' && (
            <div className="bg-red-500/10 border border-red-500 text-red-500 p-4 rounded-xl text-xs text-start w-full max-w-xs leading-relaxed">
              <b>{language === 'ar' ? 'تحتاج إلى إعداد مرة واحدة:' : 'One-time setup required:'}</b> 
              <br/>
              {language === 'ar' ? 'لتفعيل المنافسة عبر الأجهزة المتعددة، تحتاج إلى تفعيل "تسجيل الدخول المجهول" أو "تسجيل دخول جوجل" في إعدادات التطبيق.' : 'To enable multi-device competition, you need to enable "Anonymous Login" or "Google Sign-In" in your app settings.'}
              <br/>
              <br/>
              {language === 'ar' ? '1. اذهب إلى' : '1. Go to '} <a href="https://console.firebase.google.com/project/_/authentication/providers" target="_blank" rel="noreferrer" className="underline font-bold text-gold">Firebase Console</a><br/>
              {language === 'ar' ? '2. اختر مشروعك' : '2. Choose your project'}<br/>
              {language === 'ar' ? '3. قم بتفعيل (Anonymous) أو (Google)' : '3. Enable (Anonymous) or (Google)'}
            </div>
          )}
          <button 
            onClick={handleLogin}
            disabled={isLoggingIn}
            className="w-full max-w-xs bg-white text-black font-bold py-3 px-4 rounded-xl shadow-lg flex items-center justify-center gap-3 active:scale-95 transition-all disabled:opacity-75 disabled:scale-100"
          >
            <LogIn size={20} />
            {isLoggingIn ? (language === 'ar' ? 'جاري تسجيل الدخول...' : 'Signing in...') : (language === 'ar' ? 'تسجيل الدخول / الدخول كضيف' : 'Sign In / Continue as Guest')}
          </button>
        </div>
      </div>
    );
  }

  if (joinedChallenges.length === 0 || !activeChallengeCode) {
    return (
      <div className="flex flex-col flex-1 h-full bg-dark">
        <TopBar title={language === 'ar' ? 'التحديات 🏆' : 'Challenges 🏆'} />
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-5">
          
          {isCreating ? (
            <motion.div initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} className="bg-mid border border-gold rounded-2xl p-5">
              <h3 className="text-gold font-bold mb-4">{language === 'ar' ? 'إنشاء تحدي جديد' : 'Create New Challenge'}</h3>
              
              <label className="text-light text-xs mb-1 block">{language === 'ar' ? 'اسم التحدي' : 'Challenge Name'}</label>
              <input 
                type="text" 
                value={newChallengeName}
                onChange={e => setNewChallengeName(e.target.value)}
                className="w-full bg-dark border border-border rounded-xl p-3 text-text mb-4"
                placeholder={language === 'ar' ? 'مثال: تحدي رمضان، تحدي العائلة...' : 'e.g., Ramadan Challenge'}
              />

              <label className="text-light text-xs mb-1 block">{language === 'ar' ? 'المدة (بالأيام)' : 'Duration (Days)'}</label>
              <input 
                type="number" 
                value={newChallengeDays}
                onChange={e => setNewChallengeDays(Number(e.target.value))}
                min="1" max="180"
                className="w-full bg-dark border border-border rounded-xl p-3 text-text mb-6"
              />

              <div className="flex gap-2">
                <button onClick={handleCreate} disabled={loading} className="flex-1 bg-gold text-dark font-bold py-3 rounded-xl">
                  {loading ? '...' : (language === 'ar' ? 'إنشاء' : 'Create')}
                </button>
                <button onClick={() => setIsCreating(false)} className="flex-1 border border-border text-light font-bold py-3 rounded-xl">
                  {language === 'ar' ? 'إلغاء' : 'Cancel'}
                </button>
              </div>
            </motion.div>
          ) : isJoining ? (
            <motion.div initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} className="bg-mid border border-gold rounded-2xl p-5">
              <h3 className="text-gold font-bold mb-4">{language === 'ar' ? 'الانضمام لتحدي' : 'Join Challenge'}</h3>
              
              <label className="text-light text-xs mb-1 block">{language === 'ar' ? 'كود التحدي' : 'Challenge Code'}</label>
              <input 
                type="text" 
                value={joinCode}
                onChange={e => setJoinCode(e.target.value.toUpperCase())}
                className="w-full bg-dark border border-border rounded-xl p-3 text-text mb-6 font-bold tracking-widest text-center uppercase"
                placeholder="XXXXXX"
                maxLength={6}
              />

              <div className="flex gap-2">
                <button onClick={handleJoin} disabled={loading} className="flex-1 bg-gold text-dark font-bold py-3 rounded-xl">
                  {loading ? '...' : (language === 'ar' ? 'انضمام' : 'Join')}
                </button>
                <button onClick={() => setIsJoining(false)} className="flex-1 border border-border text-light font-bold py-3 rounded-xl">
                  {language === 'ar' ? 'إلغاء' : 'Cancel'}
                </button>
              </div>
            </motion.div>
          ) : (
            <div className="flex flex-col gap-4 mt-10">
              <button 
                onClick={() => setIsCreating(true)}
                className="bg-gold/10 border border-gold rounded-2xl p-6 flex flex-col items-center gap-3 active:scale-95 transition-all text-gold hover:bg-gold/20"
              >
                <Plus size={32} />
                <span className="font-bold text-lg">{language === 'ar' ? 'تحدي جديد' : 'New Challenge'}</span>
              </button>
              <button 
                onClick={() => setIsJoining(true)}
                className="bg-mid border border-border rounded-2xl p-6 flex flex-col items-center gap-3 active:scale-95 transition-all text-light hover:border-gold/50"
              >
                <LogIn size={32} />
                <span className="font-bold text-lg">{language === 'ar' ? 'لديك كود؟ انضم هنا' : 'Have a code? Join here'}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Active Challenge View
  
  // Calculate rankings relative to their initial XP, if want exact delta.
  // Wait, right now the XP stored in Firebase is their TOTAL XP at the time of sync!
  // To get their "challenge score", we'd need to subtract `startingXp`.
  // Since we don't store `startingXp` in the state array above easily,let's just sort by XP.
  // Actually, wait, `joinedAt` and their total `xp` - users might join with different base XP.
  // Our schema `ChallengeMember` has `xp` which we just update to the user's total `xp`.
  // Wait! A user with 10k XP who joins a challenge will instantly be 1st! That's not fair.
  // Let's modify `ChallengeMember` to have `baseXp`. But actually, for now we will just show TOTAL XP! 
  // It's a fun simple competition of who has the highest total level in the app overall, OR they can start fresh.
  
  // Let's rank them by Total XP for this version, or calculate delta! Let's just use `member.xp`.

  const sortedMembers = [...members].sort((a, b) => b.xp - a.xp);
  const highestXp = sortedMembers[0]?.xp || 1;
  const totalGroupXp = sortedMembers.reduce((acc, m) => acc + m.xp, 0);

  const getRankMedal = (index: number) => {
    if (index === 0) return '1 🥇';
    if (index === 1) return '2 🥈';
    if (index === 2) return '3 🥉';
    return `${index + 1}`;
  };

  return (
    <div className="flex flex-col flex-1 h-full bg-dark relative">
      {(isCreating || isJoining) && (
        <div className="absolute inset-0 bg-dark/80 backdrop-blur-sm z-50 flex flex-col p-4">
          <TopBar title={isCreating ? (language === 'ar' ? 'إنشاء تحدي' : 'Create Challenge') : (language === 'ar' ? 'الانضمام لتحدي' : 'Join Challenge')} onBack={() => {setIsCreating(false); setIsJoining(false);}} />
          <div className="flex-1 flex flex-col justify-center">
          {isCreating ? (
            <motion.div initial={{opacity:0, scale:0.95}} animate={{opacity:1, scale:1}} className="bg-mid border border-gold rounded-2xl p-5 shadow-2xl">
              <h3 className="text-gold font-bold mb-4">{language === 'ar' ? 'إنشاء تحدي جديد' : 'Create New Challenge'}</h3>
              
              <label className="text-light text-xs mb-1 block">{language === 'ar' ? 'اسم التحدي' : 'Challenge Name'}</label>
              <input 
                type="text" 
                value={newChallengeName}
                onChange={e => setNewChallengeName(e.target.value)}
                className="w-full bg-dark border border-border rounded-xl p-3 text-text mb-4"
                placeholder={language === 'ar' ? 'مثال: تحدي رمضان، تحدي العائلة...' : 'e.g., Ramadan Challenge'}
              />

              <label className="text-light text-xs mb-1 block">{language === 'ar' ? 'المدة (بالأيام)' : 'Duration (Days)'}</label>
              <input 
                type="number" 
                value={newChallengeDays}
                onChange={e => setNewChallengeDays(Number(e.target.value))}
                min="1" max="180"
                className="w-full bg-dark border border-border rounded-xl p-3 text-text mb-6"
              />

              <div className="flex gap-2">
                <button onClick={handleCreate} disabled={loading} className="flex-1 bg-gold text-dark font-bold py-3 rounded-xl">
                  {loading ? '...' : (language === 'ar' ? 'إنشاء' : 'Create')}
                </button>
                <button onClick={() => setIsCreating(false)} className="flex-1 border border-border text-light font-bold py-3 rounded-xl">
                  {language === 'ar' ? 'إلغاء' : 'Cancel'}
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div initial={{opacity:0, scale:0.95}} animate={{opacity:1, scale:1}} className="bg-mid border border-gold rounded-2xl p-5 shadow-2xl">
              <h3 className="text-gold font-bold mb-4">{language === 'ar' ? 'الانضمام لتحدي' : 'Join Challenge'}</h3>
              
              <label className="text-light text-xs mb-1 block">{language === 'ar' ? 'كود التحدي' : 'Challenge Code'}</label>
              <input 
                type="text" 
                value={joinCode}
                onChange={e => setJoinCode(e.target.value.toUpperCase())}
                className="w-full bg-dark border border-border rounded-xl p-3 text-text mb-6 font-bold tracking-widest text-center uppercase"
                placeholder="XXXXXX"
                maxLength={6}
              />

              <div className="flex gap-2">
                <button onClick={handleJoin} disabled={loading} className="flex-1 bg-gold text-dark font-bold py-3 rounded-xl">
                  {loading ? '...' : (language === 'ar' ? 'انضمام' : 'Join')}
                </button>
                <button onClick={() => setIsJoining(false)} className="flex-1 border border-border text-light font-bold py-3 rounded-xl">
                  {language === 'ar' ? 'إلغاء' : 'Cancel'}
                </button>
              </div>
            </motion.div>
          )}
          </div>
        </div>
      )}

      <TopBar 
        title={challengeData?.name || (language === 'ar' ? 'التحدي' : 'Challenge')} 
        subTitle={language === 'ar' ? `${members.length} مشاركين` : `${members.length} Participants`} 
      />
      
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-5">
        
        <section className="bg-mid border border-gold rounded-2xl p-4 shadow-sm relative overflow-hidden">
          <div className="text-gold text-[11px] font-bold mb-4 pr-16">{language === 'ar' ? 'ترتيب اليوم' : 'Leaderboard'}</div>
          
          {joinedChallenges.length > 1 && (
            <select 
              value={activeChallengeCode || ''} 
              onChange={e => setActiveChallengeCode(e.target.value)}
              className="absolute top-3 left-3 bg-dark text-gold border border-gold/50 rounded p-1 text-[10px] outline-none max-w-24"
              dir="ltr"
            >
              {joinedChallenges.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          )}

          <div className="flex flex-col gap-3">
            {sortedMembers.map((member, i) => {
              const isYou = member.userId === user.uid;
              const bgPercent = Math.min((member.xp / highestXp) * 100, 100) || 0;
              return (
                <div key={member.userId} className="flex items-center gap-2 border-b border-border/50 pb-3 last:border-0 last:pb-0">
                  <div className="text-gold text-[11px] sm:text-xs font-bold w-12 text-start shrink-0 flex items-center gap-1">{getRankMedal(i)}</div>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                    isYou ? 'bg-gold text-dark' : 'bg-border text-gold'
                  }`}>
                    {member.userName.charAt(0)}
                  </div>
                  <div className={`flex-1 text-xs break-words px-1 ${isYou ? 'text-gold font-bold' : 'text-text'}`}>
                    {member.userName} {isYou && (language === 'ar' ? '(أنت)' : '(You)')}
                  </div>
                  
                  <div className="flex flex-col items-end gap-1 min-w-[60px] shrink-0">
                    <div className="text-gold text-xs font-bold font-mono" dir="ltr">{member.xp.toLocaleString('en-US')} XP</div>
                    <div className="w-16 bg-dark rounded-full h-1.5 overflow-hidden" dir="ltr">
                      <motion.div 
                        className="bg-gold h-full rounded-full" 
                        initial={{ width: 0 }}
                        animate={{ width: `${bgPercent}%` }}
                        transition={{ duration: 1, delay: i * 0.1 }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="bg-mid border border-border rounded-2xl p-5 text-center flex flex-col items-center justify-center">
          <div className="text-gold text-[10px] font-bold mb-2">{language === 'ar' ? 'إجمالي نقاط المجموعة' : 'Total Group Points'}</div>
          <div className="text-gold text-4xl font-mono font-bold tracking-wider mb-2">{totalGroupXp.toLocaleString('en-US')}</div>
          <div className="text-light text-[10px]">
            {language === 'ar' ? 'مجتمعين على طاعة الله 🤲' : 'Gathered upon the obedience of Allah 🤲'}
          </div>
        </section>

        <section className="bg-mid border border-border rounded-2xl p-4">
          <div className="text-gold text-[11px] font-bold mb-4">{language === 'ar' ? 'دعوة الأسرة 👨‍👩‍👧‍👦' : 'Invite Family 👨‍👩‍👧‍👦'}</div>
          <p className="text-light text-[10px] mb-3 leading-relaxed">
            {language === 'ar' 
              ? 'ابعت الكود لأهلك وأصحابك وانضموا مع بعض وتنافسوا على الأكثر نقاطاً.'
              : 'Send this code to your family and friends to join the competition.'}
          </p>
          <div className="bg-dark border border-gold/50 border-dashed rounded-xl p-3 text-center text-gold text-xl font-bold tracking-widest mb-3 select-all">
            {activeChallengeCode}
          </div>
          <div className="flex gap-2">
            <button 
              onClick={shareWhatsApp}
              className="flex-1 bg-green text-dark font-bold text-[11px] py-3 rounded-lg active:scale-95 flex justify-center items-center gap-1"
            >
              <Share2 size={14} /> {language === 'ar' ? 'مشاركة واتساب' : 'WhatsApp'}
            </button>
            <button 
              onClick={() => navigator.clipboard.writeText(activeChallengeCode!)}
              className="flex-1 bg-gold text-dark font-bold text-[11px] py-3 rounded-lg active:scale-95 flex justify-center items-center gap-1"
            >
              <ClipboardCopy size={14} /> {language === 'ar' ? 'نسخ الكود' : 'Copy Code'}
            </button>
          </div>
        </section>
        
        {/* Buttons for create/join extra */}
        <div className="flex gap-2 px-2 pb-6">
          <button 
            onClick={() => setIsCreating(true)}
            className="flex-1 bg-gold/10 border border-gold/30 text-gold font-bold text-[10px] py-2 rounded-lg"
          >
             {language === 'ar' ? '+ تحدي جديد' : '+ New Challenge'}
          </button>
          <button 
            onClick={() => setIsJoining(true)}
            className="flex-1 border border-border text-light font-bold text-[10px] py-2 rounded-lg"
          >
             {language === 'ar' ? '+ انضمام لتحدي آخر' : '+ Join Another'}
          </button>
        </div>

      </div>
    </div>
  );
}
