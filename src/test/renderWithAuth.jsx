import React, { useState } from 'react';
import { render } from '@testing-library/react';
import { MemoryRouter, Route, Routes, parsePath, useLocation } from 'react-router-dom';
import { vi } from 'vitest';
import { AuthContext } from '../context/auth-context';
import { watchedFields, ratingFields } from '../lib/watchlist';

// A stand-in for AuthProvider: keeps the watchlist in React state and applies the same
// watched/rating rules (from lib/watchlist), so pages can be tested without Firebase.
const FakeAuthProvider = ({ initialWatchlist, overrides, children }) => {
  const [watchlist, setWatchlist] = useState(initialWatchlist);
  const update = (imdbID, fields) =>
    setWatchlist((list) => list.map((m) => (m.imdbID === imdbID ? { ...m, ...fields } : m)));

  const value = {
    currentUser: { uid: 'user-1', email: 'test@example.com', name: 'Test' },
    authLoading: false,
    watchlist,
    login: vi.fn().mockResolvedValue(),
    signup: vi.fn().mockResolvedValue(),
    loginWithGoogle: vi.fn().mockResolvedValue(),
    resetPassword: vi.fn().mockResolvedValue(),
    logout: vi.fn().mockResolvedValue(),
    addToWatchlist: (movie) => setWatchlist((list) => [movie, ...list]),
    removeFromWatchlist: (imdbID) => setWatchlist((list) => list.filter((m) => m.imdbID !== imdbID)),
    setWatched: (imdbID, watched) => update(imdbID, watchedFields(watched)),
    setRating: (imdbID, rating) => update(imdbID, ratingFields(rating)),
    ...overrides,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Records where the router currently is, so tests can assert on navigation and URL params.
const LocationSpy = ({ onChange }) => {
  onChange(useLocation());
  return null;
};

// Renders `ui` at `route` (matched by `path`) with a fake signed-in user.
// `auth` overrides any context value, e.g. { currentUser: null } or { login: vi.fn() }.
export const renderWithAuth = (
  ui,
  { route = '/', path = '*', watchlist = [], auth = {}, routerState } = {}
) => {
  const location = { current: null };
  const result = render(
    <FakeAuthProvider initialWatchlist={watchlist} overrides={auth}>
      <MemoryRouter initialEntries={[{ ...parsePath(route), state: routerState }]}>
        <LocationSpy onChange={(loc) => (location.current = loc)} />
        <Routes>
          <Route path={path} element={ui} />
          <Route path="*" element={<p>Other page</p>} />
        </Routes>
      </MemoryRouter>
    </FakeAuthProvider>
  );
  return { ...result, location };
};
