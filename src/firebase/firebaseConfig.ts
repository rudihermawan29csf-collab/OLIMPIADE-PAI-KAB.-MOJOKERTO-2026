import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getAuth, Auth } from 'firebase/auth';

// Environment variables configuration
export const firebaseEnvConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
};

export const isFirebaseConfigured = Boolean(
  firebaseEnvConfig.apiKey &&
  firebaseEnvConfig.projectId &&
  firebaseEnvConfig.apiKey !== 'MY_FIREBASE_API_KEY'
);

let app;
let db: Firestore | null = null;
let auth: Auth | null = null;

if (isFirebaseConfigured) {
  try {
    app = getApps().length === 0 ? initializeApp(firebaseEnvConfig) : getApp();
    db = getFirestore(app);
    auth = getAuth(app);
  } catch (err) {
    console.warn('Firebase initialization error, running in demo local mode:', err);
  }
}

export { app, db, auth };
