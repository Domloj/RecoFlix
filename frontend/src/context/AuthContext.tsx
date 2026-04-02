import React, { createContext, useContext, useEffect, useState } from 'react';
import { type User as FirebaseUser, onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '../config/firebase';
import { Loader, Center } from '@mantine/core';
import type { AppUser, Role } from '../interfaces/auth';
import { doc, getDoc } from 'firebase/firestore';

interface AuthContextType {
  user: AppUser | null;
  loading: boolean;
  setUser: React.Dispatch<React.SetStateAction<AppUser | null>>;
}

const AuthContext = createContext<AuthContextType>({ user: null, loading: true, setUser: () => {}});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
            const docRef = doc(db, 'users', firebaseUser.uid);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
            const userData = docSnap.data();
            setUser({
                uid: firebaseUser.uid,
                email: firebaseUser.email,
                username: userData.username,
                role: userData.role as Role, 
            });
            }
        } else {
            setUser(null);
        }
        setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <Center h="100vh">
        <Loader color="blue" size="xl" />
      </Center>
    );
  }

  return (
    <AuthContext.Provider value={{ user, loading, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);