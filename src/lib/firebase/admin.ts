/**
 * Firebase Admin SDK initialization for server-side operations.
 *
 * Security notes:
 * - This file is server-side ONLY. Never import from client components.
 * - Credentials come from environment variables — never hardcoded.
 * - The service account JSON file must NEVER be committed to source control.
 *
 * Usage:
 *   import { adminDb, adminAuth } from '@/lib/firebase/admin';
 */

import * as admin from 'firebase-admin';

// Prevent re-initialization in Next.js hot reloads
function getFirebaseAdmin(): admin.app.App {
  if (admin.apps.length > 0) {
    return admin.app();
  }

  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY;

  // Option 1: Use individual env vars (recommended for Vercel / CI/CD)
  if (projectId && clientEmail && privateKey) {
    return admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        // Replace escaped newlines from env var strings
        privateKey: privateKey.replace(/\\n/g, '\n'),
      }),
    });
  }

  // Option 2: Use GOOGLE_APPLICATION_CREDENTIALS (local dev with JSON file)
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    return admin.initializeApp({
      credential: admin.credential.applicationDefault(),
    });
  }

  // Fallback: unconfigured (Firebase features will not work)
  console.warn(
    '[TickerAlert] Firebase Admin SDK not configured. ' +
    'Set FIREBASE_ADMIN_PROJECT_ID, FIREBASE_ADMIN_CLIENT_EMAIL, and FIREBASE_ADMIN_PRIVATE_KEY in .env.local'
  );

  // Initialize with no credentials so the app can still run without Firebase
  return admin.initializeApp({ projectId: projectId ?? 'unconfigured' });
}

const app = getFirebaseAdmin();

export const adminDb = admin.firestore(app);
export const adminAuth = admin.auth(app);
export default app;
