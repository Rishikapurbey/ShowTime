import React, { useState, useEffect, useRef, useCallback } from 'react';
import { loadFirestore } from '../lib/firebase';
import {
  addRecent,
  mergeRecent,
  sameRecent,
  readLocalRecent,
  writeLocalRecent,
} from '../lib/recentlyViewed';
import { useAuth } from './auth-context';
import { RecentlyViewedContext } from './recently-viewed-context';

// A signed-in user's history is one document: users/{uid}/history/recent = { movies: [...] }.
const historyDoc = (fs, uid) => fs.doc(fs.db, 'users', uid, 'history', 'recent');

export const RecentlyViewedProvider = ({ children }) => {
  const { currentUser, authLoading } = useAuth();
  const [recent, setRecent] = useState(readLocalRecent);

  // The latest list, for writes that happen between renders.
  const listRef = useRef(recent);
  // Where the list is saved right now: null while auth or the account's history is still
  // loading, then { save(list) }. Until then, views and Clear clicks wait in `pending` and
  // are applied once the saved list has loaded, so a movie page opened straight from a
  // link can't overwrite history that hasn't arrived yet, and a Clear isn't undone by it.
  const storeRef = useRef(null);
  const pendingRef = useRef({ cleared: false, views: [] });

  const show = (list) => {
    listRef.current = list;
    setRecent(list);
  };

  // Applies what happened while loading on top of `saved`, then forgets it.
  const applyPending = (saved) => {
    const { cleared, views } = pendingRef.current;
    pendingRef.current = { cleared: false, views: [] };
    return views.reduce(addRecent, cleared ? [] : saved);
  };

  useEffect(() => {
    storeRef.current = null;
    if (authLoading) return;

    if (!currentUser) {
      const list = applyPending(readLocalRecent());
      writeLocalRecent(list);
      show(list);
      storeRef.current = { save: writeLocalRecent };
      return;
    }

    let unsubscribe;
    let cancelled = false;

    loadFirestore()
      .then((fs) => {
        if (cancelled) return;
        const ref = historyDoc(fs, currentUser.uid);
        const save = (list) =>
          fs.setDoc(ref, { movies: list }).catch((error) => console.error('Could not save recently viewed:', error));

        unsubscribe = fs.onSnapshot(
          ref,
          (snapshot) => {
            const saved = snapshot.data()?.movies ?? [];
            if (storeRef.current) {
              // A later update, e.g. from another device.
              show(saved);
              return;
            }

            // First load for this account: fold in what this browser viewed while signed
            // out, plus anything opened while loading, then save if that changed anything.
            const list = applyPending(mergeRecent(readLocalRecent(), saved));
            writeLocalRecent([]);
            show(list);
            if (!sameRecent(list, saved)) save(list);
            storeRef.current = { save };
          },
          (error) => console.error('Recently viewed sync failed:', error)
        );
      })
      .catch((error) => console.error('Could not load Firestore:', error));

    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, [currentUser, authLoading]);

  const recordView = useCallback((movie) => {
    if (!storeRef.current) {
      pendingRef.current.views.push(movie);
      return;
    }
    const list = addRecent(listRef.current, movie);
    // Already first (e.g. a refresh): nothing to save.
    if (sameRecent(list, listRef.current)) return;
    show(list);
    storeRef.current.save(list);
  }, []);

  const clearRecent = useCallback(() => {
    show([]);
    if (storeRef.current) storeRef.current.save([]);
    else pendingRef.current = { cleared: true, views: [] };
  }, []);

  return (
    <RecentlyViewedContext.Provider value={{ recent, recordView, clearRecent }}>
      {children}
    </RecentlyViewedContext.Provider>
  );
};
