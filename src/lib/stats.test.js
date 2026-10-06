import { describe, it, expect } from 'vitest';
import { watchlistStats } from './stats';

const movie = (Year, extra = {}) => ({ imdbID: `tt${Math.random()}`, Title: 'x', Year, ...extra });

describe('watchlistStats', () => {
  it('counts watched and to-watch movies', () => {
    const stats = watchlistStats([movie('2010', { watched: true }), movie('2011'), movie('2012', { watched: false })]);
    expect(stats.watchedCount).toBe(1);
    expect(stats.toWatchCount).toBe(2);
  });

  it('averages only rated movies', () => {
    const stats = watchlistStats([
      movie('2010', { watched: true, rating: 5 }),
      movie('2010', { watched: true, rating: 2 }),
      movie('2010', { watched: true }),
    ]);
    expect(stats.ratedCount).toBe(2);
    expect(stats.average).toBe(3.5);
  });

  it('has no average when nothing is rated', () => {
    expect(watchlistStats([movie('2010', { watched: true })]).average).toBeNull();
    expect(watchlistStats([]).average).toBeNull();
  });

  it('counts ratings from 5 stars down to 1', () => {
    const stats = watchlistStats([
      movie('2010', { watched: true, rating: 4 }),
      movie('2010', { watched: true, rating: 4 }),
      movie('2010', { watched: true, rating: 1 }),
    ]);
    expect(stats.ratings).toEqual([
      { stars: 5, count: 0 },
      { stars: 4, count: 2 },
      { stars: 3, count: 0 },
      { stars: 2, count: 0 },
      { stars: 1, count: 1 },
    ]);
  });

  it('groups watched movies by decade, filling the gaps in between', () => {
    const stats = watchlistStats([
      movie('1972', { watched: true }),
      movie('1999', { watched: true }),
      movie('1995', { watched: true }),
      movie('2008–2013', { watched: true }), // a series counts from its first year
      movie('1950'), // not watched: ignored
      movie('N/A', { watched: true }), // no usable year: ignored
    ]);
    expect(stats.decades).toEqual([
      { decade: 1970, count: 1 },
      { decade: 1980, count: 0 },
      { decade: 1990, count: 2 },
      { decade: 2000, count: 1 },
    ]);
  });

  it('has no decades when nothing watched has a year', () => {
    expect(watchlistStats([movie('N/A', { watched: true })]).decades).toEqual([]);
  });
});
