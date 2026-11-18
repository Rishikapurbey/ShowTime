import React, { useEffect } from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, act, waitFor } from '@testing-library/react';
import { AuthContext } from './auth-context';
import { RecentlyViewedProvider } from './RecentlyViewedProvider';
import { useRecentlyViewed } from './recently-viewed-context';
import { LEGACY_LOCAL_KEY } from '../lib/recentlyViewed';

// Fake Firestore: one document per path, with snapshots the test pushes by hand.
const fs = vi.hoisted(() => ({}));

vi.mock('../lib/firebase', () => ({
  isFirebaseConfigured: true,
  loadFirestore: vi.fn(async () => fs.sdk),
}));

const makeFakeFirestore = () => {
  fs.sdk = {
    db: {},
    doc: (db, ...path) => ({ path: path.join('/') }),
    setDoc: vi.fn().mockResolvedValue(),
    onSnapshot: vi.fn((ref, next) => {
      fs.subscribedTo = ref.path;
      fs.emit = (movies) => act(() => next({ data: () => (movies ? { movies } : undefined) }));
      return (fs.unsubscribe = vi.fn());
    }),
  };
};

const movie = (n) => ({ imdbID: `tt${n}`, Title: `Movie ${n}`, Poster: 'N/A', Year: '2000' });
const ids = (list) => list.map((m) => m.imdbID);
const { loadFirestore } = await import('../lib/firebase');

const signedIn = { currentUser: { uid: 'u1' }, authLoading: false };
const signedOut = { currentUser: null, authLoading: false };
const loading = { currentUser: null, authLoading: true };

// Renders the provider under a given auth state; `setAuth` changes it later.
const renderProvider = (auth, extra = null) => {
  const ctx = { current: null };
  const Capture = () => {
    ctx.current = useRecentlyViewed();
    return null;
  };
  const tree = (value) => (
    <AuthContext.Provider value={value}>
      <RecentlyViewedProvider>
        <Capture />
        {extra}
      </RecentlyViewedProvider>
    </AuthContext.Provider>
  );
  const { rerender } = render(tree(auth));
  return { ctx, setAuth: (value) => rerender(tree(value)) };
};

const waitForSubscription = (times = 1) =>
  waitFor(() => expect(fs.sdk.onSnapshot).toHaveBeenCalledTimes(times));

// Records its movie the way the movie page does.
const OpenMoviePage = ({ movie: opened }) => {
  const { recordView } = useRecentlyViewed();
  useEffect(() => {
    recordView(opened);
  }, [opened, recordView]);
  return null;
};

describe('RecentlyViewedProvider', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    makeFakeFirestore();
  });

  describe('signed out', () => {
    it('shows nothing and records nothing', () => {
      const { ctx } = renderProvider(signedOut);
      act(() => ctx.current.recordView(movie(1)));
      expect(ctx.current.recent).toEqual([]);
      expect(localStorage.getItem(LEGACY_LOCAL_KEY)).toBeNull();
      expect(loadFirestore).not.toHaveBeenCalled();
    });

    it('deletes history an older version kept in this browser', () => {
      localStorage.setItem(LEGACY_LOCAL_KEY, JSON.stringify([movie(1)]));
      const { ctx } = renderProvider(signedOut);
      expect(ctx.current.recent).toEqual([]);
      expect(localStorage.getItem(LEGACY_LOCAL_KEY)).toBeNull();
    });

    it('drops views made while sign-in status was loading', async () => {
      const { ctx, setAuth } = renderProvider(loading);
      act(() => ctx.current.recordView(movie(1)));
      setAuth(signedOut);
      setAuth(signedIn);
      await waitForSubscription();
      await fs.emit([]);
      expect(ctx.current.recent).toEqual([]);
      expect(fs.sdk.setDoc).not.toHaveBeenCalled();
    });
  });

  describe('signed in', () => {
    it("loads and live-syncs the account's history", async () => {
      const { ctx } = renderProvider(signedIn);
      await waitForSubscription();
      expect(fs.subscribedTo).toBe('users/u1/history/recent');

      await fs.emit([movie(1), movie(2)]);
      expect(ids(ctx.current.recent)).toEqual(['tt1', 'tt2']);

      // Another device viewed something.
      await fs.emit([movie(3), movie(1), movie(2)]);
      expect(ids(ctx.current.recent)).toEqual(['tt3', 'tt1', 'tt2']);
    });

    it("doesn't write anything just from loading", async () => {
      renderProvider(signedIn);
      await waitForSubscription();
      await fs.emit([movie(1)]);
      expect(fs.sdk.setDoc).not.toHaveBeenCalled();
    });

    it('saves new views to the account', async () => {
      const { ctx } = renderProvider(signedIn);
      await waitForSubscription();
      await fs.emit([movie(1)]);

      act(() => ctx.current.recordView(movie(2)));
      expect(ids(ctx.current.recent)).toEqual(['tt2', 'tt1']);
      expect(fs.sdk.setDoc).toHaveBeenCalledWith({ path: 'users/u1/history/recent' }, { movies: [movie(2), movie(1)] });
    });

    it('skips saving when the movie is already first, e.g. on a refresh', async () => {
      const { ctx } = renderProvider(signedIn);
      await waitForSubscription();
      await fs.emit([movie(1)]);

      act(() => ctx.current.recordView(movie(1)));
      expect(fs.sdk.setDoc).not.toHaveBeenCalled();
    });

    it("doesn't let a view made before the history loads overwrite it", async () => {
      const { ctx } = renderProvider(signedIn);
      act(() => ctx.current.recordView(movie(9)));
      expect(fs.sdk.setDoc).not.toHaveBeenCalled();

      await waitForSubscription();
      await fs.emit([movie(1), movie(2)]);
      expect(ids(ctx.current.recent)).toEqual(['tt9', 'tt1', 'tt2']);
      expect(fs.sdk.setDoc).toHaveBeenCalledWith(
        { path: 'users/u1/history/recent' },
        { movies: [movie(9), movie(1), movie(2)] }
      );
    });

    it('keeps a view made while sign-in status was loading', async () => {
      const { ctx, setAuth } = renderProvider(loading);
      act(() => ctx.current.recordView(movie(9)));
      setAuth(signedIn);
      await waitForSubscription();
      await fs.emit([movie(1)]);
      expect(ids(ctx.current.recent)).toEqual(['tt9', 'tt1']);
    });

    it('does not add old browser history to the account', async () => {
      localStorage.setItem(LEGACY_LOCAL_KEY, JSON.stringify([movie(5)]));
      const { ctx } = renderProvider(signedIn);
      await waitForSubscription();
      await fs.emit([movie(1)]);
      expect(ids(ctx.current.recent)).toEqual(['tt1']);
      expect(fs.sdk.setDoc).not.toHaveBeenCalled();
    });

    it('starts empty for an account with no history yet', async () => {
      const { ctx } = renderProvider(signedIn);
      await waitForSubscription();
      await fs.emit(undefined);
      expect(ctx.current.recent).toEqual([]);
    });

    it('clears the history in the account', async () => {
      const { ctx } = renderProvider(signedIn);
      await waitForSubscription();
      await fs.emit([movie(1)]);

      act(() => ctx.current.clearRecent());
      expect(ctx.current.recent).toEqual([]);
      expect(fs.sdk.setDoc).toHaveBeenCalledWith({ path: 'users/u1/history/recent' }, { movies: [] });
    });

    it("stops syncing and hides the account's history on sign-out", async () => {
      const { ctx, setAuth } = renderProvider(signedIn);
      await waitForSubscription();
      await fs.emit([movie(1)]);

      setAuth(signedOut);
      expect(fs.unsubscribe).toHaveBeenCalled();
      expect(ctx.current.recent).toEqual([]);
    });

    it('brings back only signed-in views after logging out and in again', async () => {
      const { ctx, setAuth } = renderProvider(signedIn);
      await waitForSubscription();
      await fs.emit([]);
      act(() => ctx.current.recordView(movie(1)));
      act(() => ctx.current.recordView(movie(2)));
      const saved = fs.sdk.setDoc.mock.lastCall[1].movies;

      setAuth(signedOut);
      act(() => ctx.current.recordView(movie(3)));
      expect(ctx.current.recent).toEqual([]);
      expect(fs.sdk.setDoc).toHaveBeenCalledTimes(2);

      setAuth(signedIn);
      await waitForSubscription(2);
      await fs.emit(saved);
      expect(ids(ctx.current.recent)).toEqual(['tt2', 'tt1']);

      act(() => ctx.current.recordView(movie(4)));
      expect(ids(ctx.current.recent)).toEqual(['tt4', 'tt2', 'tt1']);
    });

    it('counts the movie page someone is on when they log in', async () => {
      const page = <OpenMoviePage movie={movie(7)} />;
      const { ctx, setAuth } = renderProvider(signedOut, page);
      expect(ctx.current.recent).toEqual([]);

      setAuth(signedIn);
      await waitForSubscription();
      await fs.emit([movie(1)]);
      expect(ids(ctx.current.recent)).toEqual(['tt7', 'tt1']);
    });
  });
});
