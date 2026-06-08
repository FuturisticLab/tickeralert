/**
 * Firebase Client SDK initialization.
 *
 * Security notes:
 * - Only NEXT_PUBLIC_ prefixed variables are used here (safe for browser).
 * - These values are NOT secret — Firebase client keys are designed to be public.
 *   They identify your project; Firebase Security Rules protect your data.
 * - NEVER put Firebase Admin private keys or service account credentials here.
 */

import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getAuth, type Auth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Prevent re-initialization in Next.js hot reloads
let app: FirebaseApp;
let db: Firestore;
let auth: Auth;

const isConfigured = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId);

if (isConfigured) {
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]!;
  db = getFirestore(app);
  auth = getAuth(app);
} else {
  console.warn(
    '[TickerAlert] Firebase client not configured. ' +
    'Set NEXT_PUBLIC_FIREBASE_* variables in .env.local to enable cloud features.'
  );
}

export { db, auth, isConfigured };
