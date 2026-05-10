import { db, handleFirestoreError, OperationType } from '../firebase';
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  serverTimestamp, 
  query, 
  orderBy, 
  onSnapshot
} from 'firebase/firestore';

export interface Challenge {
  code: string;
  name: string;
  ownerId: string;
  durationDays: number;
  createdAt: any;
  endsAt: any;
}

export interface ChallengeMember {
  userId: string;
  userName: string;
  xp: number;
  joinedAt: any;
}

export const challengesService = {
  async createChallenge(ownerId: string, name: string, durationDays: number): Promise<string> {
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    const challengeRef = doc(db, 'challenges', code);
    
    // Set 00:00:00 of endsAt date
    const endsAtDate = new Date();
    endsAtDate.setDate(endsAtDate.getDate() + durationDays);
    
    const challengeData = {
      code,
      name,
      ownerId,
      durationDays,
      createdAt: serverTimestamp(),
      endsAt: endsAtDate
    };

    try {
      await setDoc(challengeRef, challengeData);
      return code;
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, `challenges/${code}`);
      throw e;
    }
  },

  async joinChallenge(code: string, userId: string, userName: string, startingXp: number = 0) {
    const challengeRef = doc(db, 'challenges', code);
    
    try {
      const challengeDoc = await getDoc(challengeRef);
      if (!challengeDoc.exists()) {
        throw new Error("Challenge not found");
      }
    } catch (e) {
      handleFirestoreError(e, OperationType.GET, `challenges/${code}`);
      throw e;
    }

    const memberRef = doc(db, `challenges/${code}/members`, userId);
    
    try {
      await setDoc(memberRef, {
        userId,
        userName,
        xp: startingXp,
        joinedAt: serverTimestamp()
      });
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, `challenges/${code}/members/${userId}`);
      throw e;
    }
  },

  async updateMemberProgress(code: string, userId: string, newXp: number, userName: string) {
    const memberRef = doc(db, `challenges/${code}/members`, userId);
    try {
      await updateDoc(memberRef, {
        xp: newXp,
        userName: userName
      });
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `challenges/${code}/members/${userId}`);
      throw e;
    }
  },

  subscribeToMembers(code: string, callback: (members: ChallengeMember[]) => void) {
    const q = query(
      collection(db, `challenges/${code}/members`), 
      orderBy('xp', 'desc')
    );
    
    return onSnapshot(q, (snapshot) => {
      const members = snapshot.docs.map(doc => doc.data() as ChallengeMember);
      callback(members);
    }, (e) => {
      handleFirestoreError(e, OperationType.LIST, `challenges/${code}/members`);
    });
  },

  async getChallengeDetails(code: string): Promise<Challenge | null> {
    const challengeRef = doc(db, 'challenges', code);
    try {
      const docSnap = await getDoc(challengeRef);
      if (docSnap.exists()) {
        return docSnap.data() as Challenge;
      }
      return null;
    } catch (e) {
      handleFirestoreError(e, OperationType.GET, `challenges/${code}`);
      throw e;
    }
  }
};
