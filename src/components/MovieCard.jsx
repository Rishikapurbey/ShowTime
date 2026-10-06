import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { posterOrPlaceholder, showPlaceholderOnError } from '../api/omdb';
import { AuthContext } from '../context/AuthContext';
import './MovieCard.css';

const MovieCard = ({ movie }) => {
  const { currentUser, watchlist, addToWatchlist, removeFromWatchlist } = useContext(AuthContext);
  const poster = posterOrPlaceholder(movie.Poster);
  const inWatchlist = watchlist.some((m) => m.imdbID === movie.imdbID);

  const toggleWatchlist = (e) => {
    // The card is a link; don't navigate when the button is clicked.
    e.preventDefault();
    e.stopPropagation();
    if (inWatchlist) {
      removeFromWatchlist(movie.imdbID);
    } else {
      const { imdbID, Title, Poster, Year } = movie;
      addToWatchlist({ imdbID, Title, Poster, Year });
    }
  };

  return (
    <Link to={`/movie/${movie.imdbID}`} className="movie-card-link">
      <div className="movie-card">
        <img src={poster} alt={movie.Title} loading="lazy" onError={showPlaceholderOnError} />
        {currentUser && (
          <button
            className={`card-watchlist-button ${inWatchlist ? 'added' : ''}`}
            onClick={toggleWatchlist}
            aria-label={inWatchlist ? `Remove ${movie.Title} from watchlist` : `Add ${movie.Title} to watchlist`}
            title={inWatchlist ? 'Remove from watchlist' : 'Add to watchlist'}
          >
            {inWatchlist ? '✓' : '+'}
          </button>
        )}
        <div className="movie-info">
          <h3>{movie.Title}</h3>
          <p>{movie.Year}</p>
        </div>
      </div>
    </Link>
  );
};

export default MovieCard;
