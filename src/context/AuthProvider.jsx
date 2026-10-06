import React, { useState, useEffect } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  sendPasswordResetEmail,
  updateProfile,
  signOut,
} from 'firebase/auth';
import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  writeBatch,
} from 'firebase/firestore';
import { auth, db, isFirebaseConfigured } from '../lib/firebase';
import { AuthContext } from './auth-context';

// Each user's watchlist lives at users/{uid}/watchlist/{imdbID}.
const watchlistRef = (uid) => collection(db, 'users', uid, 'watchlist');

const notConfigured = () =>
  Promise.reject(Object.assign(new Error('Firebase is not configured'), { code: 'app/not-configured' }));

const toUser = (firebaseUser) => ({
  uid: firebaseUser.uid,
  email: firebaseUser.email,
  name: firebaseUser.displayName || firebaseUser.email.split('@')[0],
});

// Before real accounts, watchlists were kept in this browser's localStorage under
// "<email>_watchlist". Copy one into Firestore the first time that email signs in.
const importLegacyWatchlist = async (user) => {
  const key = `${user.email}_watchlist`;
  const stored = localStorage.getItem(key);
  localStorage.removeItem('showtime_user');
  if (!stored) return;

  const movies = JSON.parse(stored);
  const batch = writeBatch(db);
  for (const { imdbID, Title, Poster, Year } of movies) {
    batch.set(doc(watchlistRef(user.uid), imdbID), { imdbID, Title, Poster, Year, addedAt: serverTimestamp() });
  }
  await batch.commit();
  localStorage.removeItem(key);
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  // True until Firebase reports whether someone is signed in, so pages don't flash "Please login".
  const [authLoading, setAuthLoading] = useState(isFirebaseConfigured);
  const [watchlist, setWatchlist] = useState([]);

  useEffect(() => {
    if (!isFirebaseConfigured) return;
    return onAuthStateChanged(auth, (firebaseUser) => {
      setCurrentUser(firebaseUser ? toUser(firebaseUser) : null);
      setAuthLoading(false);
    });
  }, []);

  useEffect(() => {
    if (!currentUser) {
      setWatchlist([]);
      return;
    }

    importLegacyWatchlist(currentUser).catch((error) =>
      console.error('Could not import the old watchlist:', error)
    );

    const q = query(watchlistRef(currentUser.uid), orderBy('addedAt', 'desc'));
    return onSnapshot(
      q,
      (snapshot) => setWatchlist(snapshot.docs.map((d) => d.data({ serverTimestamps: 'estimate' }))),
      (error) => console.error('Watchlist sync failed:', error)
    );
  }, [currentUser]);

  const login = (email, password) =>
    isFirebaseConfigured ? signInWithEmailAndPassword(auth, email, password) : notConfigured();

  const signup = async (name, email, password) => {
    if (!isFirebaseConfigured) return notConfigured();
    const { user } = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(user, { displayName: name });
    // onAuthStateChanged fired before the name was set, so refresh it.
    setCurrentUser(toUser(user));
  };

  const loginWithGoogle = () =>
    isFirebaseConfigured ? signInWithPopup(auth, new GoogleAuthProvider()) : notConfigured();

  const resetPassword = (email) =>
    isFirebaseConfigured ? sendPasswordResetEmail(auth, email) : notConfigured();

  const logout = () => signOut(auth);

  // Firestore applies writes locally first, so the UI updates instantly via onSnapshot.
  const addToWatchlist = ({ imdbID, Title, Poster, Year }) => {
    if (!currentUser) return;
    setDoc(doc(watchlistRef(currentUser.uid), imdbID), {
      imdbID,
      Title,
      Poster,
      Year,
      addedAt: serverTimestamp(),
    }).catch((error) => console.error('Could not add to watchlist:', error));
  };

  const removeFromWatchlist = (imdbID) => {
    if (!currentUser) return;
    deleteDoc(doc(watchlistRef(currentUser.uid), imdbID)).catch((error) =>
      console.error('Could not remove from watchlist:', error)
    );
  };

  const value = {
    currentUser,
    authLoading,
    login,
    signup,
    loginWithGoogle,
    resetPassword,
    logout,
    watchlist,
    addToWatchlist,
    removeFromWatchlist,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
