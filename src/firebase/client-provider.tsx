'use client';

import React, { useMemo, type ReactNode } from 'react';
import { FirebaseProvider } from '@/firebase/provider';
import { initializeFirebase } from '@/firebase';

interface FirebaseClientProviderProps {
  children: ReactNode;
}

export function FirebaseClientProvider({ children }: FirebaseClientProviderProps) {
  const { firebaseApp, auth, firestore } = useMemo(() => {
    if (typeof window !== 'undefined') {
      return initializeFirebase();
    }
    return { firebaseApp: null, auth: null, firestore: null };
  }, []);

  if (!firebaseApp || !auth || !firestore) {
    // Return a loading state or null if Firebase is not available
    return null; 
  }

  return (
    <FirebaseProvider
      firebaseApp={firebaseApp}
      auth={auth}
      firestore={firestore}
    >
      {children}
    </FirebaseProvider>
  );
}
