import { describe, it, expect, beforeEach } from 'vitest';
import {
  MAX_RECENT,
  LOCAL_KEY,
  addRecent,
  mergeRecent,
  sameRecent,
  readLocalRecent,
  writeLocalRecent,
} from './recentlyViewed';

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

describe('mergeRecent', () => {
  it("keeps the first list's order and adds the rest without repeats", () => {
    expect(ids(mergeRecent([movie(1), movie(2)], [movie(2), movie(3)]))).toEqual(['tt1', 'tt2', 'tt3']);
  });

  it(`caps the result at ${MAX_RECENT}`, () => {
    const a = Array.from({ length: 15 }, (_, i) => movie(`a${i}`));
    const b = Array.from({ length: 15 }, (_, i) => movie(`b${i}`));
    expect(mergeRecent(a, b)).toHaveLength(MAX_RECENT);
  });
});

describe('sameRecent', () => {
  it('compares by movie and order', () => {
    expect(sameRecent([movie(1), movie(2)], [movie(1), movie(2)])).toBe(true);
    expect(sameRecent([movie(1), movie(2)], [movie(2), movie(1)])).toBe(false);
    expect(sameRecent([movie(1)], [movie(1), movie(2)])).toBe(false);
  });
});

describe('local storage', () => {
  beforeEach(() => localStorage.clear());

  it('round-trips a list', () => {
    writeLocalRecent([movie(1), movie(2)]);
    expect(readLocalRecent()).toEqual([movie(1), movie(2)]);
  });

  it('removes the key when the list is emptied', () => {
    writeLocalRecent([movie(1)]);
    writeLocalRecent([]);
    expect(localStorage.getItem(LOCAL_KEY)).toBeNull();
  });

  it('ignores missing or corrupted data', () => {
    expect(readLocalRecent()).toEqual([]);
    localStorage.setItem(LOCAL_KEY, '{not json');
    expect(readLocalRecent()).toEqual([]);
    localStorage.setItem(LOCAL_KEY, JSON.stringify({ not: 'a list' }));
    expect(readLocalRecent()).toEqual([]);
    localStorage.setItem(LOCAL_KEY, JSON.stringify([null, { Title: 'no id' }, movie(1)]));
    expect(readLocalRecent()).toEqual([movie(1)]);
  });
});
