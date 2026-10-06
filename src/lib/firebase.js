import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// These values identify the Firebase project; they are not secrets.
// Access is controlled by the Firestore security rules in firestore.rules.
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Without a config (e.g. env vars not set on the host yet), Firebase throws on startup and
// blanks the whole page. Keep browsing working and turn accounts off instead.
export const isFirebaseConfigured = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId);

const app = isFirebaseConfigured ? initializeApp(firebaseConfig) : null;

export const auth = app && getAuth(app);
export const db = app && getFirestore(app);

if (!isFirebaseConfigured) {
  console.warn('Firebase is not configured: set the VITE_FIREBASE_* env vars to enable accounts.');
}
