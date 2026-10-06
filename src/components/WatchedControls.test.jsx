import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithAuth } from '../test/renderWithAuth';
import { useAuth } from '../context/auth-context';
import MovieCard from './MovieCard';
import WatchedControls from './WatchedControls';

const MOVIE = { imdbID: 'tt1', Title: 'Inception', Year: '2010', Poster: 'N/A' };

// Renders the controls for whatever the watchlist currently holds for `MOVIE`, like the pages do.
const LiveControls = () => {
  const { watchlist } = useAuth();
  return <WatchedControls movie={watchlist.find((m) => m.imdbID === MOVIE.imdbID)} />;
};

const renderControls = (entry = MOVIE, auth) => renderWithAuth(<LiveControls />, { watchlist: [entry], auth });

const toggle = () => screen.getByRole('button', { name: /watched/i });
const star = (n) => screen.getByRole('radio', { name: `${n} star${n > 1 ? 's' : ''}` });
const filledStars = () => screen.getAllByRole('radio').filter((s) => s.classList.contains('filled')).length;

describe('WatchedControls', () => {
  it('toggles watched on and off', async () => {
    renderControls();
    expect(toggle()).toHaveTextContent('Mark as watched');
    expect(toggle()).toHaveAttribute('aria-pressed', 'false');

    await userEvent.click(toggle());
    expect(toggle()).toHaveTextContent('✓ Watched');
    expect(toggle()).toHaveAttribute('aria-pressed', 'true');
  });

  it('marks the movie watched when it is rated', async () => {
    renderControls();
    await userEvent.click(star(4));
    expect(star(4)).toHaveAttribute('aria-checked', 'true');
    expect(toggle()).toHaveTextContent('✓ Watched');
  });

  it('clears the rating when un-marked as watched', async () => {
    renderControls({ ...MOVIE, watched: true, rating: 3 });
    await userEvent.click(toggle());
    expect(toggle()).toHaveTextContent('Mark as watched');
    await userEvent.unhover(star(1));
    expect(filledStars()).toBe(0);
  });

  it('clears just the rating when the current star is clicked again', async () => {
    const setRating = vi.fn();
    renderControls({ ...MOVIE, watched: true, rating: 3 }, { setRating });
    await userEvent.click(star(3));
    expect(setRating).toHaveBeenCalledWith('tt1', null);
  });

  it('previews a rating on hover', async () => {
    renderControls({ ...MOVIE, watched: true, rating: 1 });
    await userEvent.hover(star(4));
    expect(filledStars()).toBe(4);
    await userEvent.unhover(star(4));
    expect(filledStars()).toBe(1);
  });

  it("doesn't open the movie page when used inside a movie card", async () => {
    const CardWithControls = () => {
      const { watchlist } = useAuth();
      const entry = watchlist[0];
      return <MovieCard movie={entry} actions={<WatchedControls movie={entry} compact />} />;
    };
    const { location } = renderWithAuth(<CardWithControls />, { route: '/watchlist', watchlist: [MOVIE] });

    await userEvent.click(star(5));
    await userEvent.click(toggle());
    expect(location.current.pathname).toBe('/watchlist');

    // The rest of the card still links to the movie.
    await userEvent.click(screen.getByRole('heading', { name: 'Inception' }));
    expect(location.current.pathname).toBe('/movie/tt1');
  });
});
