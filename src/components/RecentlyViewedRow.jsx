import React from 'react';
import { useRecentlyViewed } from '../context/recently-viewed-context';
import MovieList from './MovieList';
import './CategoryRow.css';

// Homepage row of the movies opened most recently; hidden until there are some.
const RecentlyViewedRow = () => {
  const { recent, clearRecent } = useRecentlyViewed();
  if (recent.length === 0) return null;

  return (
    <section className="category-row" aria-labelledby="recently-viewed-title">
      <div className="category-row-header">
        <h2 id="recently-viewed-title">Recently Viewed</h2>
        <button className="category-row-clear" onClick={clearRecent}>
          Clear
        </button>
      </div>
      <MovieList movies={recent} />
    </section>
  );
};

export default RecentlyViewedRow;
