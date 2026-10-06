import React, { useState } from 'react';
import { useAuth } from '../context/auth-context';
import './WatchedControls.css';

const STARS = [1, 2, 3, 4, 5];

// Watched toggle and 1-5 star rating for a movie that's on the watchlist.
// `movie` is the watchlist entry, so it carries the saved `watched` and `rating`.
const WatchedControls = ({ movie, compact = false }) => {
  const { setWatched, setRating } = useAuth();
  const [hovered, setHovered] = useState(0);
  const rating = movie.rating || 0;
  const shown = hovered || rating;

  // On a movie card these sit inside the card's link; don't navigate when they're clicked.
  const stayOnPage = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  return (
    <div className={`watched-controls ${compact ? 'compact' : ''}`} onClick={stayOnPage}>
      <button
        className={`watched-toggle ${movie.watched ? 'on' : ''}`}
        onClick={() => setWatched(movie.imdbID, !movie.watched)}
        aria-pressed={Boolean(movie.watched)}
      >
        {movie.watched ? '✓ Watched' : 'Mark as watched'}
      </button>

      <div
        className="star-rating"
        role="radiogroup"
        aria-label={`Your rating for ${movie.Title}`}
        onMouseLeave={() => setHovered(0)}
      >
        {STARS.map((star) => (
          <button
            key={star}
            role="radio"
            aria-checked={rating === star}
            aria-label={`${star} star${star > 1 ? 's' : ''}`}
            title={rating === star ? 'Clear rating' : `Rate ${star} of 5`}
            className={`star ${star <= shown ? 'filled' : ''}`}
            onMouseEnter={() => setHovered(star)}
            // Clicking the current rating again clears it.
            onClick={() => setRating(movie.imdbID, rating === star ? null : star)}
          >
            ★
          </button>
        ))}
      </div>
    </div>
  );
};

export default WatchedControls;
