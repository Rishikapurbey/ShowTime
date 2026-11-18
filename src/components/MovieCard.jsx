import React from 'react';
import { Link } from 'react-router-dom';
import { posterOrPlaceholder, showPlaceholderOnError } from '../api/omdb';
import { useAuth } from '../context/auth-context';
import useWatchlistToggle from '../hooks/useWatchlistToggle';
import './MovieCard.css';

const MovieCard = ({ movie, actions }) => {
  const { authLoading } = useAuth();
  const { inWatchlist, toggle } = useWatchlistToggle(movie);
  const poster = posterOrPlaceholder(movie.Poster, movie.Title);

  const handleWatchlistClick = (e) => {
    // The card is a link; don't navigate when the button is clicked.
    e.preventDefault();
    e.stopPropagation();
    toggle();
  };

  return (
    <Link to={`/movie/${movie.imdbID}`} className="movie-card-link">
      <div className="movie-card">
        <img src={poster} alt={movie.Title} loading="lazy" onError={showPlaceholderOnError} />
        {!authLoading && (
          <button
            className={`card-watchlist-button ${inWatchlist ? 'added' : ''}`}
            onClick={handleWatchlistClick}
            aria-label={inWatchlist ? `Remove ${movie.Title} from watchlist` : `Add ${movie.Title} to watchlist`}
            title={inWatchlist ? 'Remove from watchlist' : 'Add to watchlist'}
          >
            {inWatchlist ? '✓' : '+'}
          </button>
        )}
        <div className="movie-info">
          <h3>{movie.Title}</h3>
          <p>{movie.Year}</p>
          {actions}
        </div>
      </div>
    </Link>
  );
};

export default MovieCard;
