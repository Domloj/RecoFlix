import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

export const updateUsernameInDb = async (uid: string, newUsername: string) => {
  const userRef = doc(db, 'users', uid);
  await updateDoc(userRef, { username: newUsername });
};