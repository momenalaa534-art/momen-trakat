import { useEffect, useRef } from 'react';
import { useStore } from '../store';
import { challengesService } from '../services/challengesService';
import { useFirebaseAuth } from './useFirebaseAuth';

export function useChallengeSync() {
  const { user } = useFirebaseAuth();
  const xp = useStore(state => state.xp);
  const userName = useStore(state => state.userName);
  const joinedChallenges = useStore(state => state.joinedChallenges);
  const lastSyncedXp = useRef(xp);

  useEffect(() => {
    if (!user || joinedChallenges.length === 0) return;

    // Only sync if xp has changed by a bit (e.g., at least 5) or if it's been idle.
    // Let's use a timeout instead: debounce for 5 seconds.
    const timeoutId = setTimeout(() => {
      if (xp !== lastSyncedXp.current) {
        lastSyncedXp.current = xp;
        
        joinedChallenges.forEach(code => {
          challengesService.updateMemberProgress(code, user.uid, xp, userName).catch(console.error);
        });
      }
    }, 5000);

    return () => clearTimeout(timeoutId);
  }, [xp, user, joinedChallenges, userName]);
}
