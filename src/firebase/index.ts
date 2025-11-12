'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore'

// IMPORTANT: DO NOT MODIFY THIS FUNCTION
export function initializeFirebase() {
    if (typeof window !== 'undefined') {
        if (!getApps().length) {
            let firebaseApp;
            try {
              firebaseApp = initializeApp();
            } catch (e) {
              if (process.env.NODE_ENV === "production") {
                console.warn('Automatic initialization failed. Falling back to firebase config object.', e);
              }
              firebaseApp = initializeApp(firebaseConfig);
            }
            return getSdks(firebaseApp);
        }
        return getSdks(getApp());
    }
    return getSdks(null);
}

export function getSdks(firebaseApp: FirebaseApp | null) {
  const auth = firebaseApp ? getAuth(firebaseApp) : null;
  const firestore = firebaseApp ? getFirestore(firebaseApp) : null;

  return {
    firebaseApp,
    auth,
    firestore,
  };
}

export * from './provider';
export * from './client-provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './non-blocking-updates';
export * from './non-blocking-login';
export * from './errors';
export * from './error-emitter';
