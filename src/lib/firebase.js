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

if (!isFirebaseConfigured) {
  console.warn('Firebase is not configured: set the VITE_FIREBASE_* env vars to enable accounts.');
}

// Firebase is most of the app's JavaScript, so it's fetched on demand instead of with the
// first page: Auth right after startup, Firestore only once someone is signed in.
// Each loader resolves to the SDK module plus its ready-to-use instance.
let appPromise;
const loadApp = () =>
  (appPromise ??= import('firebase/app').then(({ initializeApp }) => initializeApp(firebaseConfig)));

let authPromise;
export const loadAuth = () =>
  (authPromise ??= Promise.all([loadApp(), import('firebase/auth')]).then(([app, sdk]) => ({
    ...sdk,
    auth: sdk.getAuth(app),
  })));

let firestorePromise;
export const loadFirestore = () =>
  (firestorePromise ??= Promise.all([loadApp(), import('firebase/firestore')]).then(([app, sdk]) => ({
    ...sdk,
    db: sdk.getFirestore(app),
  })));
