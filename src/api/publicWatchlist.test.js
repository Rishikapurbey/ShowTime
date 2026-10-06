import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchPublicWatchlist, WatchlistNotShared } from './publicWatchlist';

// Fake Firestore holding documents by path; `denied` paths fail like the security rules would.
const store = vi.hoisted(() => ({ docs: {}, denied: new Set(), error: null }));

vi.mock('../lib/firebase', () => ({
  loadFirestore: async () => {
    const read = (path) => {
      if (store.error) throw store.error;
      if (store.denied.has(path)) throw Object.assign(new Error('denied'), { code: 'permission-denied' });
    };
    return {
      db: {},
      doc: (db, ...path) => path.join('/'),
      collection: (db, ...path) => path.join('/'),
      orderBy: () => null,
      query: (path) => path,
      getDoc: async (path) => {
        read(path);
        const data = store.docs[path];
        return { exists: () => Boolean(data), data: () => data };
      },
      getDocs: async (path) => {
        read(path);
        const docs = Object.entries(store.docs)
          .filter(([p]) => p.startsWith(`${path}/`))
          .map(([, data]) => ({ data: () => data }));
        return { docs };
      },
    };
  },
}));

const share = (isPublic) => {
  store.docs = {
    'usernames/movie_fan': { uid: 'u1' },
    'profiles/u1': { username: 'movie_fan', public: isPublic },
    'users/u1/watchlist/tt1': { imdbID: 'tt1', Title: 'Inception' },
  };
};

describe('fetchPublicWatchlist', () => {
  beforeEach(() => {
    store.docs = {};
    store.denied = new Set();
    store.error = null;
  });

  it('loads a shared watchlist', async () => {
    share(true);
    await expect(fetchPublicWatchlist('movie_fan')).resolves.toEqual({
      uid: 'u1',
      username: 'movie_fan',
      movies: [{ imdbID: 'tt1', Title: 'Inception' }],
    });
  });

  it("reports a link that doesn't exist as not shared", async () => {
    await expect(fetchPublicWatchlist('nobody')).rejects.toBeInstanceOf(WatchlistNotShared);
  });

  it('reports a private watchlist as not shared', async () => {
    share(false);
    await expect(fetchPublicWatchlist('movie_fan')).rejects.toBeInstanceOf(WatchlistNotShared);
  });

  it.each([['usernames/movie_fan'], ['profiles/u1'], ['users/u1/watchlist']])(
    'treats a rules refusal reading %s as not shared',
    async (path) => {
      share(true);
      store.denied.add(path);
      await expect(fetchPublicWatchlist('movie_fan')).rejects.toBeInstanceOf(WatchlistNotShared);
    }
  );

  it('passes other errors through so the page can offer a retry', async () => {
    share(true);
    store.error = Object.assign(new Error('offline'), { code: 'unavailable' });
    await expect(fetchPublicWatchlist('movie_fan')).rejects.toMatchObject({ code: 'unavailable' });
  });
});
