import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderWithAuth } from '../test/renderWithAuth';
import { fetchPublicWatchlist, WatchlistNotShared } from '../api/publicWatchlist';
import PublicWatchlistPage from './PublicWatchlistPage';

vi.mock('../api/publicWatchlist', async (importOriginal) => ({
  ...(await importOriginal()),
  fetchPublicWatchlist: vi.fn(),
}));

const MOVIES = [
  { imdbID: 'tt1', Title: 'Inception', Year: '2010', Poster: 'N/A', watched: true, rating: 4 },
  { imdbID: 'tt2', Title: 'Avatar', Year: '2009', Poster: 'N/A', watched: true },
  { imdbID: 'tt3', Title: 'Dune', Year: '2021', Poster: 'N/A' },
];

const renderPage = ({ route = '/u/movie_fan', currentUser = null } = {}) =>
  renderWithAuth(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <PublicWatchlistPage />
    </QueryClientProvider>,
    { route, path: '/u/:username', auth: { currentUser } }
  );

const shownTitles = () => screen.queryAllByRole('heading', { level: 3 }).map((h) => h.textContent);

describe('PublicWatchlistPage', () => {
  beforeEach(() => {
    fetchPublicWatchlist.mockReset();
  });

  it("loads the watchlist named in the link and shows the To watch tab first", async () => {
    fetchPublicWatchlist.mockResolvedValue({ uid: 'owner', username: 'movie_fan', movies: MOVIES });
    renderPage();

    expect(await screen.findByText('Dune')).toBeInTheDocument();
    expect(fetchPublicWatchlist).toHaveBeenCalledWith('movie_fan');
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent("@movie_fan's Watchlist · 3");
    expect(shownTitles()).toEqual(['Dune']);
    expect(document.title).toBe("@movie_fan's watchlist · ShowTime");
  });

  it("shows the owner's ratings read-only on the Watched tab", async () => {
    fetchPublicWatchlist.mockResolvedValue({ uid: 'owner', username: 'movie_fan', movies: MOVIES });
    renderPage();
    await userEvent.click(await screen.findByRole('tab', { name: /Watched/ }));

    expect(shownTitles()).toEqual(['Inception', 'Avatar']);
    expect(screen.getByLabelText('Rated 4 out of 5')).toBeInTheDocument();
    // Visitors can't change anything.
    expect(screen.queryByRole('radio')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /watched/i })).not.toBeInTheDocument();
  });

  it('gives private and missing lists the same message', async () => {
    fetchPublicWatchlist.mockRejectedValue(new WatchlistNotShared());
    renderPage();
    expect(await screen.findByText("This watchlist is private or doesn't exist.")).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Browse movies' })).toHaveAttribute('href', '/');
  });

  it('says when loading failed for another reason', async () => {
    fetchPublicWatchlist.mockRejectedValue(new Error('offline'));
    renderPage();
    // The page retries other errors once (about a second later) before giving up.
    expect(
      await screen.findByText("Couldn't load this watchlist. Please try again.", {}, { timeout: 4000 })
    ).toBeInTheDocument();
    expect(fetchPublicWatchlist).toHaveBeenCalledTimes(2);
  });

  it('tells the owner this is the public view', async () => {
    fetchPublicWatchlist.mockResolvedValue({ uid: 'user-1', username: 'movie_fan', movies: MOVIES });
    renderPage({ currentUser: { uid: 'user-1', name: 'Me' } });
    const note = await screen.findByText(/This is how others see your watchlist/);
    expect(within(note).getByRole('link', { name: 'Back to editing' })).toHaveAttribute('href', '/watchlist');
  });

  it("doesn't show the owner note to visitors", async () => {
    fetchPublicWatchlist.mockResolvedValue({ uid: 'owner', username: 'movie_fan', movies: MOVIES });
    renderPage({ currentUser: { uid: 'someone-else', name: 'Visitor' } });
    await screen.findByText('Dune');
    expect(screen.queryByText(/This is how others see your watchlist/)).not.toBeInTheDocument();
  });

  it('says when the shared list is empty', async () => {
    fetchPublicWatchlist.mockResolvedValue({ uid: 'owner', username: 'movie_fan', movies: [] });
    renderPage();
    expect(await screen.findByText('This watchlist is empty.')).toBeInTheDocument();
  });
});
