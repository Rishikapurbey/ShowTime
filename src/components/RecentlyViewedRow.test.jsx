import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { AuthContext } from '../context/auth-context';
import { RecentlyViewedContext } from '../context/recently-viewed-context';
import RecentlyViewedRow from './RecentlyViewedRow';

const renderRow = (recent, clearRecent = vi.fn()) =>
  render(
    <AuthContext.Provider value={{ currentUser: null, watchlist: [] }}>
      <RecentlyViewedContext.Provider value={{ recent, clearRecent, recordView: vi.fn() }}>
        <MemoryRouter>
          <RecentlyViewedRow />
        </MemoryRouter>
      </RecentlyViewedContext.Provider>
    </AuthContext.Provider>
  );

describe('RecentlyViewedRow', () => {
  it('is hidden when nothing has been viewed', () => {
    const { container } = renderRow([]);
    expect(container).toBeEmptyDOMElement();
  });

  it('shows recently viewed movies, newest first, linking to each one', () => {
    renderRow([
      { imdbID: 'tt2', Title: 'Dune', Year: '2021', Poster: 'N/A' },
      { imdbID: 'tt1', Title: 'Up', Year: '2009', Poster: 'N/A' },
    ]);
    expect(screen.getByRole('heading', { name: 'Recently Viewed' })).toBeInTheDocument();
    const titles = screen.getAllByRole('heading', { level: 3 }).map((h) => h.textContent);
    expect(titles).toEqual(['Dune', 'Up']);
    expect(screen.getByRole('link', { name: /Dune/ })).toHaveAttribute('href', '/movie/tt2');
  });

  it('clears the history', async () => {
    const clearRecent = vi.fn();
    renderRow([{ imdbID: 'tt1', Title: 'Up', Year: '2009', Poster: 'N/A' }], clearRecent);
    await userEvent.click(screen.getByRole('button', { name: 'Clear' }));
    expect(clearRecent).toHaveBeenCalled();
  });
});
