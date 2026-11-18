import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { searchMovies } from '../api/omdb';
import { AuthContext } from '../context/auth-context';
import CategoryRow from './CategoryRow';

vi.mock('../api/omdb', async (importOriginal) => ({
  ...(await importOriginal()),
  searchMovies: vi.fn(),
}));

const found = (Title) => ({ movies: [{ imdbID: Title, Title, Year: '2025', Poster: 'N/A' }], totalResults: 1 });

const renderRow = () =>
  render(
    <QueryClientProvider client={new QueryClient()}>
      <AuthContext.Provider value={{ authLoading: false, currentUser: null, watchlist: [] }}>
        <MemoryRouter>
          <CategoryRow title="Latest Movies" searchTerm="movie" year={2026} fallbackYear={2025} />
        </MemoryRouter>
      </AuthContext.Provider>
    </QueryClientProvider>
  );

describe('CategoryRow', () => {
  beforeEach(() => vi.clearAllMocks());

  it('uses the main year when it has movies', async () => {
    searchMovies.mockResolvedValue(found('This Year'));
    renderRow();
    expect(await screen.findByRole('heading', { name: 'This Year' })).toBeInTheDocument();
    expect(searchMovies).toHaveBeenCalledTimes(1);
    expect(searchMovies).toHaveBeenCalledWith('movie', { year: 2026 });
  });

  it('falls back when the main year has no movies yet', async () => {
    searchMovies.mockResolvedValueOnce({ movies: [], totalResults: 0 }).mockResolvedValueOnce(found('Last Year'));
    renderRow();
    expect(await screen.findByRole('heading', { name: 'Last Year' })).toBeInTheDocument();
    expect(searchMovies).toHaveBeenLastCalledWith('movie', { year: 2025 });
  });
});
