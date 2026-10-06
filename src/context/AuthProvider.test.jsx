import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, act, waitFor } from '@testing-library/react';
import { AuthProvider } from './AuthProvider';
import { useAuth } from './auth-context';

// Fake Firebase SDKs: just enough of Auth and Firestore for AuthProvider, recording what it does.
const fb = vi.hoisted(() => ({ configured: true }));

vi.mock('../lib/firebase', () => ({
  get isFirebaseConfigured() {
    return fb.configured;
  },
  loadAuth: vi.fn(async () => fb.authSdk),
  loadFirestore: vi.fn(async () => fb.firestoreSdk),
}));

const { loadAuth, loadFirestore } = await import('../lib/firebase');

const makeFakes = () => {
  fb.authSdk = {
    auth: {},
    onAuthStateChanged: vi.fn((auth, callback) => {
      fb.emitUser = (user) => act(() => callback(user));
      return (fb.unsubscribeAuth = vi.fn());
    }),
    signInWithEmailAndPassword: vi.fn().mockResolvedValue({}),
    signOut: vi.fn().mockResolvedValue(),
  };

  const batch = { set: vi.fn(), commit: vi.fn().mockResolvedValue() };
  fb.firestoreSdk = {
    db: {},
    collection: (db, ...path) => ({ path: path.join('/') }),
    doc: (ref, id) => ({ path: `${ref.path}/${id}` }),
    query: (ref) => ref,
    orderBy: () => null,
    serverTimestamp: () => 'SERVER_TIME',
    onSnapshot: vi.fn((q, next) => {
      fb.emitWatchlist = (movies) =>
        act(() => next({ docs: movies.map((m) => ({ data: () => m })) }));
      return (fb.unsubscribeWatchlist = vi.fn());
    }),
    updateDoc: vi.fn().mockResolvedValue(),
    setDoc: vi.fn().mockResolvedValue(),
    deleteDoc: vi.fn().mockResolvedValue(),
    writeBatch: () => batch,
    batch,
  };
};

// Renders the provider and returns a live view of its context value.
const renderProvider = () => {
  const ctx = { current: null };
  const Capture = () => {
    ctx.current = useAuth();
    return null;
  };
  render(
    <AuthProvider>
      <Capture />
    </AuthProvider>
  );
  return ctx;
};

const firebaseUser = { uid: 'u1', email: 'me@example.com', displayName: 'Me' };

const signIn = async () => {
  const ctx = renderProvider();
  await waitFor(() => expect(fb.authSdk.onAuthStateChanged).toHaveBeenCalled());
  await fb.emitUser(firebaseUser);
  await waitFor(() => expect(fb.firestoreSdk.onSnapshot).toHaveBeenCalled());
  return ctx;
};

describe('AuthProvider', () => {
  beforeEach(() => {
    fb.configured = true;
    localStorage.clear();
    vi.clearAllMocks();
    makeFakes();
  });

  describe('when Firebase is not configured', () => {
    beforeEach(() => {
      fb.configured = false;
    });

    it('turns accounts off without loading Firebase', () => {
      const ctx = renderProvider();
      expect(ctx.current.authLoading).toBe(false);
      expect(ctx.current.currentUser).toBeNull();
      expect(loadAuth).not.toHaveBeenCalled();
    });

    it('rejects sign-in with a code the login page can explain', async () => {
      const ctx = renderProvider();
      await expect(ctx.current.login('me@example.com', 'pw')).rejects.toMatchObject({ code: 'app/not-configured' });
      await expect(ctx.current.loginWithGoogle()).rejects.toMatchObject({ code: 'app/not-configured' });
    });
  });

  it('is loading until Firebase reports who is signed in', async () => {
    const ctx = renderProvider();
    expect(ctx.current.authLoading).toBe(true);

    await waitFor(() => expect(fb.authSdk.onAuthStateChanged).toHaveBeenCalled());
    await fb.emitUser(null);
    expect(ctx.current.authLoading).toBe(false);
    expect(ctx.current.currentUser).toBeNull();
    // Nobody signed in, so Firestore is never downloaded.
    expect(loadFirestore).not.toHaveBeenCalled();
  });

  it('loads the signed-in user and syncs their watchlist', async () => {
    const ctx = await signIn();
    expect(ctx.current.currentUser).toEqual({ uid: 'u1', email: 'me@example.com', name: 'Me' });
    expect(fb.firestoreSdk.onSnapshot.mock.calls[0][0]).toEqual({ path: 'users/u1/watchlist' });

    await fb.emitWatchlist([{ imdbID: 'tt1', Title: 'Inception' }]);
    expect(ctx.current.watchlist).toEqual([{ imdbID: 'tt1', Title: 'Inception' }]);
  });

  it('falls back to the email name when the user has no display name', async () => {
    const ctx = renderProvider();
    await waitFor(() => expect(fb.authSdk.onAuthStateChanged).toHaveBeenCalled());
    await fb.emitUser({ uid: 'u2', email: 'sam@example.com', displayName: null });
    expect(ctx.current.currentUser.name).toBe('sam');
  });

  it('logs in with email and password', async () => {
    const ctx = renderProvider();
    await ctx.current.login('me@example.com', 'secret123');
    expect(fb.authSdk.signInWithEmailAndPassword).toHaveBeenCalledWith(fb.authSdk.auth, 'me@example.com', 'secret123');
  });

  describe('watchlist writes', () => {
    it('adds a movie with only the allowed fields', async () => {
      const ctx = await signIn();
      ctx.current.addToWatchlist({ imdbID: 'tt1', Title: 'Inception', Poster: 'p.jpg', Year: '2010', Plot: 'extra' });
      await waitFor(() =>
        expect(fb.firestoreSdk.setDoc).toHaveBeenCalledWith(
          { path: 'users/u1/watchlist/tt1' },
          { imdbID: 'tt1', Title: 'Inception', Poster: 'p.jpg', Year: '2010', addedAt: 'SERVER_TIME' }
        )
      );
    });

    it('removes a movie', async () => {
      const ctx = await signIn();
      ctx.current.removeFromWatchlist('tt1');
      await waitFor(() =>
        expect(fb.firestoreSdk.deleteDoc).toHaveBeenCalledWith({ path: 'users/u1/watchlist/tt1' })
      );
    });

    it.each([
      ['rating a movie marks it watched', (c) => c.setRating('tt1', 4), { rating: 4, watched: true }],
      ['clearing a rating keeps it watched', (c) => c.setRating('tt1', null), { rating: null }],
      ['marking watched', (c) => c.setWatched('tt1', true), { watched: true }],
      ['un-marking watched clears the rating', (c) => c.setWatched('tt1', false), { watched: false, rating: null }],
    ])('%s', async (_, action, fields) => {
      const ctx = await signIn();
      action(ctx.current);
      await waitFor(() =>
        expect(fb.firestoreSdk.updateDoc).toHaveBeenCalledWith({ path: 'users/u1/watchlist/tt1' }, fields)
      );
    });

    it('does nothing when signed out', async () => {
      const ctx = renderProvider();
      ctx.current.setRating('tt1', 4);
      ctx.current.addToWatchlist({ imdbID: 'tt1' });
      await Promise.resolve();
      expect(loadFirestore).not.toHaveBeenCalled();
    });
  });

  it('copies a watchlist saved by the old localStorage login into Firestore', async () => {
    localStorage.setItem(
      'me@example.com_watchlist',
      JSON.stringify([{ imdbID: 'tt9', Title: 'Old Movie', Poster: 'N/A', Year: '1999' }])
    );
    await signIn();

    await waitFor(() => expect(fb.firestoreSdk.batch.commit).toHaveBeenCalled());
    expect(fb.firestoreSdk.batch.set).toHaveBeenCalledWith(
      { path: 'users/u1/watchlist/tt9' },
      { imdbID: 'tt9', Title: 'Old Movie', Poster: 'N/A', Year: '1999', addedAt: 'SERVER_TIME' }
    );
    await waitFor(() => expect(localStorage.getItem('me@example.com_watchlist')).toBeNull());
  });

  it('stops syncing and empties the watchlist on sign-out', async () => {
    const ctx = await signIn();
    await fb.emitWatchlist([{ imdbID: 'tt1', Title: 'Inception' }]);

    await fb.emitUser(null);
    expect(fb.unsubscribeWatchlist).toHaveBeenCalled();
    expect(ctx.current.watchlist).toEqual([]);
  });
});
