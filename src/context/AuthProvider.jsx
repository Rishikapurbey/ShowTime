import React, { useState, useEffect } from 'react';
import { isFirebaseConfigured, loadAuth, loadFirestore } from '../lib/firebase';
import { watchedFields, ratingFields } from '../lib/watchlist';
import { AuthContext } from './auth-context';

// Each user's watchlist lives at users/{uid}/watchlist/{imdbID}.
const watchlistRef = (fs, uid) => fs.collection(fs.db, 'users', uid, 'watchlist');

const notConfigured = () =>
  Promise.reject(Object.assign(new Error('Firebase is not configured'), { code: 'app/not-configured' }));

// Runs fn with the loaded Auth SDK, or rejects the way a failed sign-in would if accounts are off.
const withAuth = (fn) => (isFirebaseConfigured ? loadAuth().then(fn) : notConfigured());

const toUser = (firebaseUser) => ({
  uid: firebaseUser.uid,
  email: firebaseUser.email,
  name: firebaseUser.displayName || firebaseUser.email.split('@')[0],
});

// Before real accounts, watchlists were kept in this browser's localStorage under
// "<email>_watchlist". Copy one into Firestore the first time that email signs in.
const importLegacyWatchlist = async (fs, user) => {
  const key = `${user.email}_watchlist`;
  const stored = localStorage.getItem(key);
  localStorage.removeItem('showtime_user');
  if (!stored) return;

  const movies = JSON.parse(stored);
  const batch = fs.writeBatch(fs.db);
  for (const { imdbID, Title, Poster, Year } of movies) {
    batch.set(fs.doc(watchlistRef(fs, user.uid), imdbID), {
      imdbID,
      Title,
      Poster,
      Year,
      addedAt: fs.serverTimestamp(),
    });
  }
  await batch.commit();
  localStorage.removeItem(key);
};

const writeEntry = (fs, ref, { imdbID, Title, Poster, Year }) =>
  fs.setDoc(ref, { imdbID, Title, Poster, Year, addedAt: fs.serverTimestamp() });

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  // True until Firebase reports whether someone is signed in, so pages don't flash "Please login".
  const [authLoading, setAuthLoading] = useState(isFirebaseConfigured);
  const [watchlist, setWatchlist] = useState([]);
  // The latest failed watchlist change, as { message }. A new object each time, so repeats show.
  const [watchlistError, setWatchlistError] = useState(null);

  useEffect(() => {
    if (!isFirebaseConfigured) return;
    let unsubscribe;
    let cancelled = false;

    loadAuth()
      .then(({ auth, onAuthStateChanged }) => {
        if (cancelled) return;
        unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
          setCurrentUser(firebaseUser ? toUser(firebaseUser) : null);
          setAuthLoading(false);
        });
      })
      .catch((error) => {
        console.error('Could not load Firebase Auth:', error);
        setAuthLoading(false);
      });

    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, []);

  useEffect(() => {
    if (!currentUser) {
      setWatchlist([]);
      return;
    }
    let unsubscribe;
    let cancelled = false;

    loadFirestore()
      .then((fs) => {
        if (cancelled) return;

        importLegacyWatchlist(fs, currentUser).catch((error) =>
          console.error('Could not import the old watchlist:', error)
        );

        const q = fs.query(watchlistRef(fs, currentUser.uid), fs.orderBy('addedAt', 'desc'));
        unsubscribe = fs.onSnapshot(
          q,
          (snapshot) => setWatchlist(snapshot.docs.map((d) => d.data({ serverTimestamps: 'estimate' }))),
          (error) => console.error('Watchlist sync failed:', error)
        );
      })
      .catch((error) => console.error('Could not load Firestore:', error));

    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, [currentUser]);

  const login = (email, password) =>
    withAuth(({ auth, signInWithEmailAndPassword }) => signInWithEmailAndPassword(auth, email, password));

  const signup = (name, email, password) =>
    withAuth(async ({ auth, createUserWithEmailAndPassword, updateProfile }) => {
      const { user } = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(user, { displayName: name });
      // onAuthStateChanged fired before the name was set, so refresh it.
      setCurrentUser(toUser(user));
    });

  // Auth is already loaded by the time anyone can click this, so the popup still opens
  // within the click's user-activation window and isn't blocked.
  const loginWithGoogle = () =>
    withAuth(({ auth, signInWithPopup, GoogleAuthProvider }) => signInWithPopup(auth, new GoogleAuthProvider()));

  const resetPassword = (email) =>
    withAuth(({ auth, sendPasswordResetEmail }) => sendPasswordResetEmail(auth, email));

  const logout = () => withAuth(({ auth, signOut }) => signOut(auth));

  // Firestore applies writes locally first, so the UI updates instantly via onSnapshot and
  // puts things back by itself if the server refuses; the message explains why they changed.
  const writeWatchlist = (write, message) => {
    if (!currentUser) return;
    loadFirestore()
      .then((fs) => write(fs, watchlistRef(fs, currentUser.uid)))
      .catch((error) => {
        console.error(`${message}:`, error);
        setWatchlistError({ message: `${message}. Please try again.` });
      });
  };

  const addToWatchlist = (movie) =>
    writeWatchlist((fs, list) => writeEntry(fs, fs.doc(list, movie.imdbID), movie), `Couldn't add ${movie.Title}`);

  // For the add that finishes a sign-in, before the list has loaded: the account may already
  // have this movie, and rewriting it would erase its rating. Resolves to whether it was added.
  const addToWatchlistIfMissing = async (movie) => {
    const fs = await loadFirestore();
    const ref = fs.doc(watchlistRef(fs, currentUser.uid), movie.imdbID);
    if ((await fs.getDoc(ref)).exists()) return false;
    await writeEntry(fs, ref, movie);
    return true;
  };

  const removeFromWatchlist = (imdbID) =>
    writeWatchlist((fs, list) => fs.deleteDoc(fs.doc(list, imdbID)), "Couldn't remove that movie");

  const updateWatchlistEntry = (imdbID, fields) =>
    writeWatchlist((fs, list) => fs.updateDoc(fs.doc(list, imdbID), fields), "Couldn't save your change");

  const setWatched = (imdbID, watched) => updateWatchlistEntry(imdbID, watchedFields(watched));

  const setRating = (imdbID, rating) => updateWatchlistEntry(imdbID, ratingFields(rating));

  const value = {
    currentUser,
    authLoading,
    login,
    signup,
    loginWithGoogle,
    resetPassword,
    logout,
    watchlist,
    watchlistError,
    addToWatchlist,
    addToWatchlistIfMissing,
    removeFromWatchlist,
    setWatched,
    setRating,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
