import { useEffect, useState } from 'react';
import { onAuthStateChanged, User, signInWithPopup, GoogleAuthProvider, signOut, signInAnonymously } from 'firebase/auth';
import { auth, db } from '../firebase'; // Assuming I create this
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { useStore } from '../store';

export function useFirebaseAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setLoading(false);
      
      if (currentUser) {
        // Ensure user document exists in users collection (for safe matching)
        const userRef = doc(db, 'users', currentUser.uid);
        const docSnap = await getDoc(userRef);
        if (!docSnap.exists()) {
           try {
              await setDoc(userRef, {
                uid: currentUser.uid,
                name: currentUser.displayName || 'مستخدم',
                createdAt: serverTimestamp()
              });
           } catch (e) {
              console.error("Error creating user document", e);
           }
        }
      }
    });

    return unsubscribe;
  }, []);

  const loginWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (error: any) {
      if (error?.code === 'auth/operation-not-allowed') {
        console.log('Google Auth not enabled, falling back to anonymous auth');
        try {
          await signInAnonymously(auth);
          return;
        } catch (anonError) {
          console.error('Error signing in anonymously', anonError);
          throw anonError;
        }
      }
      console.error('Error signing in with Google', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Error signing out', error);
    }
  };

  return { user, loading, loginWithGoogle, logout };
}
