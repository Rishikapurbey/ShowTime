import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithAuth } from '../test/renderWithAuth';
import WatchlistPage from './WatchlistPage';

// The share panel has its own tests; keep these away from Firestore.
vi.mock('../hooks/useShareProfile', () => ({
  default: () => ({ profile: undefined, claimUsername: vi.fn(), setPublic: vi.fn() }),
  UsernameTaken: class extends Error {},
}));

// Newest-added first, the order Firestore returns it in.
const WATCHLIST = [
  { imdbID: 'tt1', Title: 'Inception', Year: '2010', Poster: 'N/A', watched: true, rating: 4 },
  { imdbID: 'tt2', Title: 'Breaking Bad', Year: '2008–2013', Poster: 'N/A', watched: true, rating: 5 },
  { imdbID: 'tt3', Title: 'Avatar', Year: '2009', Poster: 'N/A', watched: true },
  { imdbID: 'tt4', Title: 'Cars', Year: '2006', Poster: 'N/A', watched: true, rating: 2 },
  { imdbID: 'tt5', Title: 'Dune', Year: '2021', Poster: 'N/A' },
  { imdbID: 'tt6', Title: 'Up', Year: '2009', Poster: 'N/A', watched: false },
];

const renderPage = (route = '/watchlist', options = {}) =>
  renderWithAuth(<WatchlistPage />, { route, path: '/watchlist', watchlist: WATCHLIST, ...options });

const shownTitles = () => screen.queryAllByRole('heading', { level: 3 }).map((h) => h.textContent);
const param = (location, key) => new URLSearchParams(location.current.search).get(key);

describe('WatchlistPage', () => {
  it('asks signed-out visitors to log in', () => {
    renderPage('/watchlist', { auth: { currentUser: null } });
    expect(screen.getByRole('heading', { name: 'Please Login' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Login' })).toHaveAttribute('href', '/login');
  });

  it('shows a message when the watchlist is empty', () => {
    renderPage('/watchlist', { watchlist: [] });
    expect(screen.getByText('Your watchlist is empty. Add some movies!')).toBeInTheDocument();
    expect(screen.queryByRole('tablist')).not.toBeInTheDocument();
  });

  describe('tabs', () => {
    it('opens on To watch, newest first, with a count on each tab', () => {
      renderPage();
      expect(screen.getByRole('tab', { name: /To watch/ })).toHaveAttribute('aria-selected', 'true');
      expect(within(screen.getByRole('tab', { name: /To watch/ })).getByText('2')).toBeInTheDocument();
      expect(within(screen.getByRole('tab', { name: /Watched/ })).getByText('4')).toBeInTheDocument();
      expect(shownTitles()).toEqual(['Dune', 'Up']);
    });

    it('switches to Watched and keeps the tab in the URL', async () => {
      const { location } = renderPage();
      await userEvent.click(screen.getByRole('tab', { name: /Watched/ }));
      expect(shownTitles()).toEqual(['Inception', 'Breaking Bad', 'Avatar', 'Cars']);
      expect(param(location, 'tab')).toBe('watched');
    });

    it('opens the tab named in the URL', () => {
      renderPage('/watchlist?tab=watched');
      expect(screen.getByRole('tab', { name: /Watched/ })).toHaveAttribute('aria-selected', 'true');
    });

    it('moves a movie to Watched when it is rated', async () => {
      renderPage();
      await userEvent.click(screen.getAllByRole('radio', { name: '3 stars' })[0]); // Dune
      expect(shownTitles()).toEqual(['Up']);
      await userEvent.click(screen.getByRole('tab', { name: /Watched/ }));
      expect(shownTitles()).toContain('Dune');
    });
  });

  describe('sorting', () => {
    const sortBy = (label) => userEvent.selectOptions(screen.getByRole('combobox', { name: 'Sort' }), label);

    it.each([
      ['Oldest added', ['Cars', 'Avatar', 'Breaking Bad', 'Inception']],
      ['Title (A–Z)', ['Avatar', 'Breaking Bad', 'Cars', 'Inception']],
      // Series sort by their first year.
      ['Release year (newest)', ['Inception', 'Avatar', 'Breaking Bad', 'Cars']],
      // Unrated last.
      ['Your rating (highest)', ['Breaking Bad', 'Inception', 'Cars', 'Avatar']],
    ])('sorts watched movies by %s', async (label, expected) => {
      renderPage('/watchlist?tab=watched');
      await sortBy(label);
      expect(shownTitles()).toEqual(expected);
    });

    it('only offers the rating sort on the Watched tab', () => {
      renderPage();
      expect(screen.queryByRole('option', { name: 'Your rating (highest)' })).not.toBeInTheDocument();
    });

    it('ignores a rating sort in the URL on the To watch tab', () => {
      renderPage('/watchlist?sort=rating');
      expect(shownTitles()).toEqual(['Dune', 'Up']);
      expect(screen.getByRole('combobox', { name: 'Sort' })).toHaveValue('added');
    });

    it('keeps the sort in the URL and drops it when back on the default', async () => {
      const { location } = renderPage();
      await sortBy('Title (A–Z)');
      expect(param(location, 'sort')).toBe('title');
      await sortBy('Recently added');
      expect(param(location, 'sort')).toBeNull();
    });
  });

  describe('filtering', () => {
    // Pass the option element: matching by label text fails on "&" (user-event compares innerHTML).
    const filterByRating = (label) =>
      userEvent.selectOptions(
        screen.getByRole('combobox', { name: 'Rating' }),
        screen.getByRole('option', { name: label })
      );

    it.each([
      ['★★★★★ only', ['Breaking Bad']],
      ['★★★★ & up', ['Inception', 'Breaking Bad']],
      ['★★★ & up', ['Inception', 'Breaking Bad']],
      ['Not rated yet', ['Avatar']],
    ])('filters watched movies to %s', async (label, expected) => {
      renderPage('/watchlist?tab=watched');
      await filterByRating(label);
      expect(shownTitles()).toEqual(expected);
    });

    it('only offers the rating filter on the Watched tab', () => {
      renderPage();
      expect(screen.queryByRole('combobox', { name: 'Rating' })).not.toBeInTheDocument();
    });

    it('drops the rating filter when switching tabs', async () => {
      const { location } = renderPage('/watchlist?tab=watched&rating=5');
      await userEvent.click(screen.getByRole('tab', { name: /To watch/ }));
      expect(param(location, 'rating')).toBeNull();
    });

    it('searches titles, ignoring case', async () => {
      const { location } = renderPage('/watchlist?tab=watched');
      await userEvent.type(screen.getByRole('searchbox', { name: /Search your watchlist/ }), 'BAD');
      expect(shownTitles()).toEqual(['Breaking Bad']);
      expect(param(location, 'q')).toBe('BAD');
    });

    it('offers to clear filters when nothing matches', async () => {
      renderPage('/watchlist?tab=watched&rating=5&q=inc&sort=title');
      expect(shownTitles()).toEqual([]);
      expect(screen.getByText('No movies match these filters.')).toBeInTheDocument();

      await userEvent.click(screen.getByRole('button', { name: 'Clear filters' }));
      // Filters are cleared but the sort is kept.
      expect(shownTitles()).toEqual(['Avatar', 'Breaking Bad', 'Cars', 'Inception']);
    });
  });
});
