import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderWithAuth } from './renderWithAuth';
import { fetchPublicWatchlist } from '../api/publicWatchlist';
import LoginPage from '../pages/LoginPage';
import SignupPage from '../pages/SignupPage';
import WatchlistPage from '../pages/WatchlistPage';
import PublicWatchlistPage from '../pages/PublicWatchlistPage';

vi.mock('../hooks/useShareProfile', () => ({
  default: () => ({ profile: undefined, claimUsername: vi.fn(), setPublic: vi.fn() }),
  UsernameTaken: class extends Error {},
}));
vi.mock('../api/publicWatchlist', async (importOriginal) => ({
  ...(await importOriginal()),
  fetchPublicWatchlist: vi.fn(),
}));

const withQueryClient = (ui) => (
  <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>{ui}</QueryClientProvider>
);

// Every page other than home has a "← Back to Home" link, and no logo is a link.
const PAGES = [
  { name: 'login', ui: <LoginPage />, route: '/login', auth: { currentUser: null } },
  { name: 'signup', ui: <SignupPage />, route: '/signup', auth: { currentUser: null } },
  { name: 'watchlist', ui: <WatchlistPage />, route: '/watchlist' },
  { name: 'watchlist (signed out)', ui: <WatchlistPage />, route: '/watchlist', auth: { currentUser: null } },
  { name: 'public watchlist', ui: withQueryClient(<PublicWatchlistPage />), route: '/u/movie_fan', path: '/u/:username' },
];

describe.each(PAGES)('$name page', ({ ui, route, path = route, auth = {} }) => {
  it('has a Back to Home link that goes home', async () => {
    fetchPublicWatchlist.mockResolvedValue({ uid: 'someone-else', movies: [] });
    const { location } = renderWithAuth(ui, { route, path, auth });

    await userEvent.click(await screen.findByRole('link', { name: '← Back to Home' }));
    expect(location.current.pathname).toBe('/');
  });

  it('does not make the logo a link', async () => {
    fetchPublicWatchlist.mockResolvedValue({ uid: 'someone-else', movies: [] });
    renderWithAuth(ui, { route, path, auth });
    await screen.findByRole('link', { name: '← Back to Home' });
    expect(screen.queryByRole('link', { name: 'ShowTime' })).not.toBeInTheDocument();
  });

  it('has exactly one main heading, and it is not the logo', async () => {
    fetchPublicWatchlist.mockResolvedValue({ uid: 'someone-else', movies: [] });
    renderWithAuth(ui, { route, path, auth });
    await screen.findByRole('link', { name: '← Back to Home' });
    const h1s = screen.getAllByRole('heading', { level: 1 });
    expect(h1s).toHaveLength(1);
    expect(h1s[0]).not.toHaveTextContent('ShowTime');
  });
});
