import { describe, it, expect } from 'vitest';
import { MAX_RECENT, LEGACY_LOCAL_KEY, addRecent, sameRecent, removeLegacyRecent } from './recentlyViewed';

const movie = (n) => ({ imdbID: `tt${n}`, Title: `Movie ${n}`, Poster: 'N/A', Year: '2000' });
const ids = (list) => list.map((m) => m.imdbID);

describe('addRecent', () => {
  it('puts the movie first', () => {
    expect(ids(addRecent([movie(1), movie(2)], movie(3)))).toEqual(['tt3', 'tt1', 'tt2']);
  });

  it('moves a movie already in the list to the front instead of repeating it', () => {
    expect(ids(addRecent([movie(1), movie(2), movie(3)], movie(3)))).toEqual(['tt3', 'tt1', 'tt2']);
  });

  it(`keeps only the ${MAX_RECENT} most recent`, () => {
    const full = Array.from({ length: MAX_RECENT }, (_, i) => movie(i));
    const list = addRecent(full, movie('new'));
    expect(list).toHaveLength(MAX_RECENT);
    expect(list[0].imdbID).toBe('ttnew');
    expect(ids(list)).not.toContain(`tt${MAX_RECENT - 1}`);
  });

  it('stores only the fields the row needs', () => {
    const [saved] = addRecent([], { ...movie(1), Plot: 'Long plot', Ratings: [] });
    expect(saved).toEqual(movie(1));
  });
});

describe('sameRecent', () => {
  it('compares by movie and order', () => {
    expect(sameRecent([movie(1), movie(2)], [movie(1), movie(2)])).toBe(true);
    expect(sameRecent([movie(1), movie(2)], [movie(2), movie(1)])).toBe(false);
    expect(sameRecent([movie(1)], [movie(1), movie(2)])).toBe(false);
  });
});

describe('removeLegacyRecent', () => {
  it('deletes the old signed-out history from the browser', () => {
    localStorage.setItem(LEGACY_LOCAL_KEY, JSON.stringify([movie(1)]));
    removeLegacyRecent();
    expect(localStorage.getItem(LEGACY_LOCAL_KEY)).toBeNull();
  });
});
