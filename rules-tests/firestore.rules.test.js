// Runs firestore.rules in the Firestore emulator: `npm run test:rules` (needs Java).
import { readFileSync } from 'node:fs';
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import {
  initializeTestEnvironment,
  assertSucceeds,
  assertFails,
} from '@firebase/rules-unit-testing';
import {
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  query,
  orderBy,
  writeBatch,
  serverTimestamp,
} from 'firebase/firestore';

let env;

beforeAll(async () => {
  env = await initializeTestEnvironment({
    projectId: 'demo-showtime',
    firestore: { rules: readFileSync('firestore.rules', 'utf8') },
  });
});

afterAll(() => env.cleanup());

beforeEach(() => env.clearFirestore());

const as = (uid) => env.authenticatedContext(uid).firestore();
const anonymous = () => env.unauthenticatedContext().firestore();

// Writes test data directly, skipping the rules.
const seed = (writes) =>
  env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    for (const [path, data] of Object.entries(writes)) await setDoc(doc(db, path), data);
  });

const entry = (imdbID, extra = {}) => ({
  imdbID,
  Title: 'Inception',
  Poster: 'N/A',
  Year: '2010',
  addedAt: serverTimestamp(),
  ...extra,
});

// Claims `name` for `uid` the way the app does: name and profile in one batch.
const claim = (db, uid, name, { isPublic = true, release } = {}) => {
  const batch = writeBatch(db);
  if (release) batch.delete(doc(db, 'usernames', release));
  batch.set(doc(db, 'usernames', name), { uid });
  batch.set(doc(db, 'profiles', uid), { username: name, public: isPublic });
  return batch.commit();
};

describe('watchlist', () => {
  it('lets a user read and write their own list', async () => {
    const db = as('alice');
    await assertSucceeds(setDoc(doc(db, 'users/alice/watchlist/tt1'), entry('tt1')));
    await assertSucceeds(updateDoc(doc(db, 'users/alice/watchlist/tt1'), { watched: true, rating: 5 }));
    await assertSucceeds(getDocs(collection(db, 'users/alice/watchlist')));
    await assertSucceeds(deleteDoc(doc(db, 'users/alice/watchlist/tt1')));
  });

  it("blocks writing someone else's list", async () => {
    await assertFails(setDoc(doc(as('bob'), 'users/alice/watchlist/tt1'), entry('tt1')));
    await assertFails(setDoc(doc(anonymous(), 'users/alice/watchlist/tt1'), entry('tt1')));
  });

  it.each([
    ['an ID that does not match the document', entry('tt2')],
    ['unknown fields', entry('tt1', { Plot: 'x' })],
    ['a non-boolean watched', entry('tt1', { watched: 'yes' })],
    ['a rating above 5', entry('tt1', { rating: 6 })],
    ['a rating below 1', entry('tt1', { rating: 0 })],
    ['a fractional rating', entry('tt1', { rating: 3.5 })],
  ])('rejects entries with %s', async (_, data) => {
    await assertFails(setDoc(doc(as('alice'), 'users/alice/watchlist/tt1'), data));
  });

  it('accepts a cleared rating', async () => {
    await assertSucceeds(setDoc(doc(as('alice'), 'users/alice/watchlist/tt1'), entry('tt1', { rating: null })));
  });

  describe('sharing', () => {
    beforeEach(() => seed({ 'users/alice/watchlist/tt1': entry('tt1', { addedAt: new Date() }) }));

    const readAlicesList = (db) =>
      getDocs(query(collection(db, 'users/alice/watchlist'), orderBy('addedAt', 'desc')));

    it('is private when the user has never shared', async () => {
      await assertFails(readAlicesList(as('bob')));
      await assertFails(readAlicesList(anonymous()));
    });

    it('is readable by anyone, signed in or not, while shared', async () => {
      await seed({ 'usernames/alice': { uid: 'alice' }, 'profiles/alice': { username: 'alice', public: true } });
      await assertSucceeds(readAlicesList(as('bob')));
      await assertSucceeds(readAlicesList(anonymous()));
    });

    it('is private again once sharing is switched off', async () => {
      await seed({ 'usernames/alice': { uid: 'alice' }, 'profiles/alice': { username: 'alice', public: false } });
      await assertFails(readAlicesList(anonymous()));
    });

    it('stays read-only for others while shared', async () => {
      await seed({ 'usernames/alice': { uid: 'alice' }, 'profiles/alice': { username: 'alice', public: true } });
      await assertFails(updateDoc(doc(as('bob'), 'users/alice/watchlist/tt1'), { rating: 1 }));
      await assertFails(deleteDoc(doc(as('bob'), 'users/alice/watchlist/tt1')));
    });

    it("never exposes recently viewed, even while shared", async () => {
      await seed({
        'usernames/alice': { uid: 'alice' },
        'profiles/alice': { username: 'alice', public: true },
        'users/alice/history/recent': { movies: [] },
      });
      await assertFails(getDoc(doc(as('bob'), 'users/alice/history/recent')));
    });
  });
});

describe('recently viewed', () => {
  const movies = (n) => Array.from({ length: n }, (_, i) => ({ imdbID: `tt${i}` }));

  it('lets a user keep up to 20 movies', async () => {
    const db = as('alice');
    await assertSucceeds(setDoc(doc(db, 'users/alice/history/recent'), { movies: movies(20) }));
    await assertSucceeds(getDoc(doc(db, 'users/alice/history/recent')));
  });

  it('rejects more than 20, extra fields, or other users', async () => {
    await assertFails(setDoc(doc(as('alice'), 'users/alice/history/recent'), { movies: movies(21) }));
    await assertFails(setDoc(doc(as('alice'), 'users/alice/history/recent'), { movies: [], note: 'x' }));
    await assertFails(setDoc(doc(as('bob'), 'users/alice/history/recent'), { movies: [] }));
  });
});

describe('share links', () => {
  it('lets a user claim a name together with their profile', async () => {
    await assertSucceeds(claim(as('alice'), 'alice', 'alice_99'));
  });

  it('lets anyone look up a name, but not list them all', async () => {
    await seed({ 'usernames/alice': { uid: 'alice' } });
    await assertSucceeds(getDoc(doc(anonymous(), 'usernames/alice')));
    await assertFails(getDocs(collection(anonymous(), 'usernames')));
  });

  it('refuses a name that is already taken', async () => {
    await claim(as('alice'), 'alice', 'popular');
    await assertFails(claim(as('bob'), 'bob', 'popular'));
  });

  it.each([['ab'], ['Has-Caps'], ['has space'], ['a'.repeat(21)], ['emoji😀']])(
    'refuses the invalid name %j',
    async (name) => {
      await assertFails(claim(as('alice'), 'alice', name));
    }
  );

  it('refuses claiming a name for someone else', async () => {
    const db = as('mallory');
    const batch = writeBatch(db);
    batch.set(doc(db, 'usernames', 'alice'), { uid: 'alice' });
    batch.set(doc(db, 'profiles', 'alice'), { username: 'alice', public: true });
    await assertFails(batch.commit());
  });

  it('refuses claiming a name without pointing the profile at it', async () => {
    await claim(as('alice'), 'alice', 'first');
    // An extra name on the side would let one user hoard names.
    await assertFails(setDoc(doc(as('alice'), 'usernames', 'second'), { uid: 'alice' }));
  });

  it('refuses a profile pointing at a name the user does not own', async () => {
    await claim(as('alice'), 'alice', 'alice');
    await assertFails(setDoc(doc(as('bob'), 'profiles', 'bob'), { username: 'alice', public: true }));
  });

  it('refuses profiles with extra or missing fields', async () => {
    const db = as('alice');
    const withProfile = (profile) => {
      const batch = writeBatch(db);
      batch.set(doc(db, 'usernames', 'alice'), { uid: 'alice' });
      batch.set(doc(db, 'profiles', 'alice'), profile);
      return batch.commit();
    };
    await assertFails(withProfile({ username: 'alice', public: true, email: 'a@example.com' }));
    await assertFails(withProfile({ username: 'alice' }));
    await assertFails(withProfile({ username: 'alice', public: 'yes' }));
  });

  it('lets a user switch sharing on and off', async () => {
    await claim(as('alice'), 'alice', 'alice');
    await assertSucceeds(updateDoc(doc(as('alice'), 'profiles', 'alice'), { public: false }));
    await assertSucceeds(updateDoc(doc(as('alice'), 'profiles', 'alice'), { public: true }));
    await assertFails(updateDoc(doc(as('bob'), 'profiles', 'alice'), { public: false }));
  });

  it('shows a profile to others only while it is public', async () => {
    await claim(as('alice'), 'alice', 'alice');
    await assertSucceeds(getDoc(doc(anonymous(), 'profiles', 'alice')));
    await updateDoc(doc(as('alice'), 'profiles', 'alice'), { public: false });
    await assertFails(getDoc(doc(anonymous(), 'profiles', 'alice')));
    await assertSucceeds(getDoc(doc(as('alice'), 'profiles', 'alice')));
  });

  describe('renaming', () => {
    beforeEach(() => claim(as('alice'), 'alice', 'old_name'));

    it('works when the old name is released in the same write', async () => {
      await assertSucceeds(claim(as('alice'), 'alice', 'new_name', { release: 'old_name' }));
      const [oldName, newName] = await Promise.all([
        getDoc(doc(anonymous(), 'usernames', 'old_name')),
        getDoc(doc(anonymous(), 'usernames', 'new_name')),
      ]);
      expect(oldName.exists()).toBe(false);
      expect(newName.data()).toEqual({ uid: 'alice' });
      // The old name is free for someone else.
      await assertSucceeds(claim(as('bob'), 'bob', 'old_name'));
    });

    it('is refused if the old name is kept', async () => {
      await assertFails(claim(as('alice'), 'alice', 'new_name'));
    });

    it("can't release a name the profile still uses", async () => {
      await assertFails(deleteDoc(doc(as('alice'), 'usernames', 'old_name')));
    });

    it("can't release someone else's name", async () => {
      await assertFails(deleteDoc(doc(as('bob'), 'usernames', 'old_name')));
    });
  });
});
