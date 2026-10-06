import React, { useRef, useState, useEffect, useCallback } from 'react';
import MovieCard from './MovieCard';
import './MovieList.css';

const SKELETON_COUNT = 8;

// layout="row": one horizontally scrolling line with arrow buttons (homepage categories).
// layout="grid": wrapping grid (search results, watchlist).
// renderActions(movie), if given, adds extra controls under each card's title.
const MovieList = ({ movies, isLoading = false, layout = 'row', renderActions }) => {
  const listRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateArrows = useCallback(() => {
    const el = listRef.current;
    if (!el || layout !== 'row') return;
    setCanScrollLeft(el.scrollLeft > 0);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 1);
  }, [layout]);

  useEffect(() => {
    updateArrows();
    window.addEventListener('resize', updateArrows);
    return () => window.removeEventListener('resize', updateArrows);
  }, [updateArrows, movies, isLoading]);

  const scrollBy = (direction) => {
    const el = listRef.current;
    el.scrollBy({ left: direction * el.clientWidth * 0.8, behavior: 'smooth' });
  };

  return (
    <div className={`movie-list-wrapper ${layout}`}>
      {canScrollLeft && (
        <button className="row-arrow left" onClick={() => scrollBy(-1)} aria-label="Scroll left">
          ‹
        </button>
      )}
      <div
        ref={listRef}
        className={layout === 'grid' ? 'movie-grid' : 'movie-list'}
        onScroll={updateArrows}
      >
        {isLoading
          ? Array.from({ length: SKELETON_COUNT }, (_, i) => (
              <div key={i} className="movie-card-skeleton" aria-hidden="true">
                <div className="skeleton-poster" />
                <div className="skeleton-line" />
                <div className="skeleton-line short" />
              </div>
            ))
          : movies.map((movie) => <MovieCard key={movie.imdbID} movie={movie} actions={renderActions?.(movie)} />)}
      </div>
      {canScrollRight && (
        <button className="row-arrow right" onClick={() => scrollBy(1)} aria-label="Scroll right">
          ›
        </button>
      )}
    </div>
  );
};

export default MovieList;
