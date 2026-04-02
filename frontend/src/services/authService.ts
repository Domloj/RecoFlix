import { createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';

export interface RegisterData {
  email: string;
  password: string;
  username: string;
}

export const registerUser = async (data: RegisterData) => {
  const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
  const user = userCredential.user;

  await setDoc(doc(db, 'users', user.uid), {
    username: data.username,
    email: data.email,
    role: 'user',
    createdAt: new Date().toISOString(),
  });

  return user;
};

export const logoutUser = async () => {
  await signOut(auth);
};