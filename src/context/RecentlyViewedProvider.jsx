import React, { useState, useEffect, useRef, useCallback } from 'react';
import { loadFirestore } from '../lib/firebase';
import { addRecent, sameRecent, removeLegacyRecent } from '../lib/recentlyViewed';
import { useAuth } from './auth-context';
import { RecentlyViewedContext } from './recently-viewed-context';

// History belongs to an account: users/{uid}/history/recent = { movies: [...] }.
// Nothing is shown or recorded while signed out.
const historyDoc = (fs, uid) => fs.doc(fs.db, 'users', uid, 'history', 'recent');

export const RecentlyViewedProvider = ({ children }) => {
  const { currentUser, authLoading } = useAuth();
  const uid = currentUser?.uid;
  const signedOut = !authLoading && !currentUser;
  const [recent, setRecent] = useState([]);

  // The latest list, for writes that happen between renders.
  const listRef = useRef(recent);
  // Saves to the account, or null until its history has loaded. Views made before then wait
  // in `pendingRef`, so a movie opened straight from a link can't overwrite that history.
  const saveRef = useRef(null);
  const pendingRef = useRef([]);

  const show = useCallback((list) => {
    listRef.current = list;
    setRecent(list);
  }, []);

  useEffect(() => {
    removeLegacyRecent();
  }, []);

  useEffect(() => {
    if (signedOut) {
      pendingRef.current = [];
      show([]);
      return;
    }
    if (!uid) return;

    let unsubscribe;
    let cancelled = false;

    loadFirestore()
      .then((fs) => {
        if (cancelled) return;
        const ref = historyDoc(fs, uid);
        const save = (list) =>
          fs.setDoc(ref, { movies: list }).catch((error) => console.error('Could not save recently viewed:', error));

        unsubscribe = fs.onSnapshot(
          ref,
          (snapshot) => {
            const saved = snapshot.data()?.movies ?? [];
            if (saveRef.current) {
              // A later update, e.g. from another device.
              show(saved);
              return;
            }

            // First load: add anything opened while it was loading.
            const list = pendingRef.current.reduce(addRecent, saved);
            pendingRef.current = [];
            show(list);
            if (!sameRecent(list, saved)) save(list);
            saveRef.current = save;
          },
          (error) => console.error('Recently viewed sync failed:', error)
        );
      })
      .catch((error) => console.error('Could not load Firestore:', error));

    return () => {
      cancelled = true;
      unsubscribe?.();
      saveRef.current = null;
    };
  }, [uid, signedOut, show]);

  // Changes when sign-in does, so a movie page that stays open records its movie after login.
  const recordView = useCallback(
    (movie) => {
      if (signedOut) return;
      if (!saveRef.current) {
        pendingRef.current.push(movie);
        return;
      }
      const list = addRecent(listRef.current, movie);
      // Already first (e.g. a refresh): nothing to save.
      if (sameRecent(list, listRef.current)) return;
      show(list);
      saveRef.current(list);
    },
    [signedOut, show]
  );

  const clearRecent = useCallback(() => {
    show([]);
    saveRef.current?.([]);
  }, [show]);

  return (
    <RecentlyViewedContext.Provider value={{ recent, recordView, clearRecent }}>
      {children}
    </RecentlyViewedContext.Provider>
  );
};
