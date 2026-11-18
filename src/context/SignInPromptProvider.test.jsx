import React, { useState } from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { AuthContext } from './auth-context';
import { SignInPromptProvider } from './SignInPromptProvider';
import { getMovieDetails } from '../api/omdb';
import Header from '../components/Header';
import HeroBanner from '../components/HeroBanner';
import MovieCard from '../components/MovieCard';
import LoginPage from '../pages/LoginPage';
import MovieDetailPage from '../pages/MovieDetailPage';
import SignupPage from '../pages/SignupPage';

vi.mock('../api/omdb', async (importOriginal) => ({
  ...(await importOriginal()),
  getMovieDetails: vi.fn(),
}));
vi.mock('../context/recently-viewed-context', () => ({
  useRecentlyViewed: () => ({ recordView: vi.fn() }),
}));

const MOVIE = { imdbID: 'tt1', Title: 'Inception', Year: '2010', Poster: 'N/A' };
const USER = { uid: 'u1', name: 'Me', email: 'me@example.com' };

const ShowLocation = () => {
  const { pathname, search } = useLocation();
  return <p data-testid="location">{pathname + search}</p>;
};

// Signing in really changes the user here, as it does with Firebase.
const FakeAuth = ({ initialUser, authLoading, addResult, added, children }) => {
  const [currentUser, setCurrentUser] = useState(initialUser);
  const signIn = async () => setCurrentUser(USER);
  const value = {
    currentUser,
    authLoading,
    watchlist: [],
    login: signIn,
    signup: signIn,
    loginWithGoogle: signIn,
    logout: async () => setCurrentUser(null),
    addToWatchlist: added,
    removeFromWatchlist: vi.fn(),
    addToWatchlistIfMissing: (movie) => {
      added(movie);
      return addResult();
    },
  };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

const setup = ({ user = null, authLoading = false, route = '/browse?q=dream', addResult = async () => true } = {}) => {
  const added = vi.fn();
  getMovieDetails.mockResolvedValue({ ...MOVIE, Plot: 'Dreams.', Runtime: '148 min', imdbRating: '8.8' });
  render(
    <QueryClientProvider client={new QueryClient()}>
      <FakeAuth initialUser={user} authLoading={authLoading} addResult={addResult} added={added}>
        <MemoryRouter initialEntries={[route]}>
          <SignInPromptProvider>
            <ShowLocation />
            <Header />
            <Routes>
              <Route path="/" element={null} />
              <Route path="/browse" element={<MovieCard movie={MOVIE} />} />
              <Route path="/hero" element={<HeroBanner />} />
              <Route path="/movie/:id" element={<MovieDetailPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignupPage />} />
            </Routes>
          </SignInPromptProvider>
        </MemoryRouter>
      </FakeAuth>
    </QueryClientProvider>
  );
  return { added };
};

const currentPath = () => screen.getByTestId('location').textContent;
const dialog = () => screen.findByRole('dialog', { name: 'Save Inception to your watchlist' });
const clickPlus = () => userEvent.click(screen.getByRole('button', { name: 'Add Inception to watchlist' }));

const logIn = async () => {
  await userEvent.type(screen.getByPlaceholderText('Email'), 'me@example.com');
  await userEvent.type(screen.getByPlaceholderText('Password'), 'secret123');
  await userEvent.click(screen.getByRole('button', { name: 'Login' }));
};

describe('signing in to save a movie', () => {
  it.each([
    ['a movie card', '/browse', 'Add Inception to watchlist'],
    ['the home banner', '/hero', '+ Watchlist'],
    ['the movie page', '/movie/tt1', '+ Add to Watchlist'],
  ])('prompts from %s without leaving the page', async (_, route, name) => {
    const { added } = setup({ route });
    await userEvent.click(await screen.findByRole('button', { name }));
    expect(await dialog()).toBeInTheDocument();
    expect(currentPath()).toBe(route);
    expect(added).not.toHaveBeenCalled();
  });

  it('hides the button until sign-in status is known', () => {
    setup({ authLoading: true });
    expect(screen.queryByRole('button', { name: 'Add Inception to watchlist' })).not.toBeInTheDocument();
  });

  it('adds straight away for signed-in users', async () => {
    const { added } = setup({ user: USER });
    await clickPlus();
    expect(added).toHaveBeenCalledWith(MOVIE);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('closes on Not now and adds nothing', async () => {
    const { added } = setup();
    await clickPlus();
    await userEvent.click(within(await dialog()).getByRole('button', { name: 'Not now' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(currentPath()).toBe('/browse?q=dream');
    expect(added).not.toHaveBeenCalled();
  });

  it('adds the movie after logging in and returns to the same page', async () => {
    const { added } = setup();
    await clickPlus();
    await userEvent.click(within(await dialog()).getByRole('link', { name: 'Log in' }));
    expect(currentPath()).toBe('/login');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(added).not.toHaveBeenCalled();

    await logIn();
    expect(await screen.findByText('Inception is on your watchlist.')).toBeInTheDocument();
    expect(currentPath()).toBe('/browse?q=dream');
    expect(added).toHaveBeenCalledTimes(1);
    expect(added).toHaveBeenCalledWith(MOVIE);
    expect(screen.getByRole('link', { name: 'View watchlist' })).toHaveAttribute('href', '/watchlist');
  });

  it('keeps the movie when moving from login to signup', async () => {
    const { added } = setup();
    await clickPlus();
    await userEvent.click(within(await dialog()).getByRole('link', { name: 'Log in' }));
    await userEvent.click(screen.getByRole('link', { name: 'Sign up now.' }));
    expect(screen.getByText('Create an account to add Inception to your watchlist.')).toBeInTheDocument();

    await userEvent.type(screen.getByPlaceholderText('Name'), 'Me');
    await userEvent.type(screen.getByPlaceholderText('Email'), 'me@example.com');
    await userEvent.type(screen.getByPlaceholderText(/^Password/), 'secret123');
    await userEvent.click(screen.getByRole('button', { name: 'Sign Up' }));

    expect(await screen.findByText('Inception is on your watchlist.')).toBeInTheDocument();
    expect(added).toHaveBeenCalledTimes(1);
  });

  it('drops the confirmation on logging out', async () => {
    setup();
    await clickPlus();
    await userEvent.click(within(await dialog()).getByRole('link', { name: 'Log in' }));
    await logIn();
    await screen.findByText('Inception is on your watchlist.');

    await userEvent.click(screen.getByRole('button', { name: 'Logout' }));
    expect(await screen.findByRole('link', { name: 'Login' })).toBeInTheDocument();
    expect(screen.queryByText('Inception is on your watchlist.')).not.toBeInTheDocument();
  });

  it('says so when the account already has the movie', async () => {
    setup({ addResult: async () => false });
    await clickPlus();
    await userEvent.click(within(await dialog()).getByRole('link', { name: 'Log in' }));
    await logIn();
    expect(await screen.findByText('Inception was already on your watchlist.')).toBeInTheDocument();
  });

  it('reports a failed add', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    setup({ addResult: async () => { throw new Error('offline'); } });
    await clickPlus();
    await userEvent.click(within(await dialog()).getByRole('link', { name: 'Log in' }));
    await logIn();
    expect(await screen.findByText("Couldn't add Inception. Please try again.")).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'View watchlist' })).not.toBeInTheDocument();
    consoleError.mockRestore();
  });
});
